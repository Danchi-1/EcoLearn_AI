from flask import Flask, send_from_directory
from flask import Flask, request, jsonify
from user_system.auth import register_user, validate_user, get_user_by_email
import sqlite3
import secrets
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from flask_cors import CORS

# Make sure this runs once at startup
def initialize_token_table():
    conn = sqlite3.connect('database/ecolearn.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS reset_tokens (
            email TEXT,
            token TEXT UNIQUE,
            expiry TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

initialize_token_table()

app = Flask(__name__)
CORS(app) # Enable CORS for all routes  

# Serve index.html from frontend folder
@app.route('/')
def home():
    return send_from_directory('frontend', 'index.html')

# Serve CSS files
@app.route('/css/<path:filename>')
def serve_css(filename):
    return send_from_directory('frontend/css', filename)

# Serve JS files
@app.route('/js/<path:filename>')
def serve_js(filename):
    return send_from_directory('frontend/js', filename)

@app.route('/signup')
def signup_page():
    return send_from_directory('frontend', 'signup.html')

@app.route('/login', methods=['GET'])
def login_page():
    return send_from_directory('frontend', 'login.html')

@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'student')

    success = register_user(name, email, password, role)
    if success:
        return jsonify({"message": "Signup successful"}), 200
    else:
        return jsonify({"error": "Email already exists"}), 400

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    valid = validate_user(email, password)
    if valid:
        return jsonify({"message": "Login successful", "email": email}), 200
    else:
        return jsonify({"error": "Invalid credentials"}), 401

@app.route('/api/user/<email>', methods=['GET'])
def api_user(email):
    user = get_user_by_email(email)
    if user:
        return jsonify(user)
    else:
        return jsonify({"error": "User not found"}), 404
    
@app.route('/dashboard')
def dashboard_page():
    return send_from_directory('frontend', 'dashboard.html')

@app.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email')

    # Check if email exists
    user = get_user_by_email(email)
    if not user:
        return jsonify({"error": "Email not found"}), 404

    token = secrets.token_urlsafe(32)
    expiry = datetime.now() + timedelta(hours=1)

    conn = sqlite3.connect('database/ecolearn.db')
    cursor = conn.cursor()
    cursor.execute('INSERT INTO reset_tokens (email, token, expiry) VALUES (?, ?, ?)', (email, token, expiry))
    conn.commit()
    conn.close()

    reset_link = f"http://127.0.0.1:5000/reset-password?token={token}"
    print(f"[RESET LINK] Send this to user's email: {reset_link}")

    return jsonify({"message": "Password reset link sent to your email."}), 200

@app.route('/reset-password', methods=['GET'])
def serve_reset_form():
    token = request.args.get('token')
    return f'''
    <html><body>
        <h2>Reset Password</h2>
        <form method="POST" action="/reset-password">
            <input type="hidden" name="token" value="{token}">
            <input type="password" name="new_password" placeholder="New Password" required>
            <input type="submit" value="Reset Password">
        </form>
    </body></html>
    '''

@app.route('/reset-password', methods=['POST'])
def reset_password():
    token = request.form.get('token')
    new_password = request.form.get('new_password')
    if not new_password:
        return "Password is required", 400

    conn = sqlite3.connect('database/ecolearn.db')
    cursor = conn.cursor()
    cursor.execute('SELECT email, expiry FROM reset_tokens WHERE token = ?', (token,))
    result = cursor.fetchone()

    if not result:
        return "Invalid or expired token", 400

    email, expiry = result
    if datetime.strptime(expiry, '%Y-%m-%d %H:%M:%S.%f') < datetime.now():
        return "Token expired", 400
    
    hashed_pw = generate_password_hash(new_password)
    cursor.execute('UPDATE users SET password = ? WHERE email = ?', (hashed_pw, email))
    cursor.execute('DELETE FROM reset_tokens WHERE token = ?', (token,))
    conn.commit()
    conn.close()

    return "Password updated successfully. You can now <a href='/login'>login</a>.", 200

@app.route('/forgot-password', methods=['GET'])
def forgot_password_page():
    return send_from_directory('frontend', 'forgot_password.html')


if __name__ == '__main__':
    app.run(debug=True)
