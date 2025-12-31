```python
from flask import Flask, send_from_directory, request, jsonify
from user_system.auth import register_user, validate_user, get_user_by_email, create_reset_token, perform_password_reset
from ai_module.analytics import LearningAnalytics
from database.models import init_db
from simulations.procedural_engine import generate_procedural_config
from simulations.ai_generator import generate_simulation_config
from simulations.llm_bridge import chat_with_simulation
from flask_cors import CORS

# Initialize Database
init_db()

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
    role = data.get('role')

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

@app.route('/simulation')
def simulation_page():
    return send_from_directory('frontend', 'simulation.html')

@app.route('/simulation_2d')
def simulation_2d_page():
    return send_from_directory('frontend', 'simulation_2d.html')

@app.route('/api/simulation/template')
def simulation_template():
    return send_from_directory('simulations/custom', 'template.json')

@app.route('/builder')
def builder_page():
    return send_from_directory('frontend', 'builder.html')

@app.route('/api/builder/generate', methods=['POST'])
def generate_simulation():
    data = request.get_json()
    prompt = data.get('prompt', '')
    use_llm = data.get('use_llm', False)
    config = generate_simulation_config(prompt, use_llm)
    return jsonify(config)

@app.route('/hub')
def hub_page():
    return send_from_directory('frontend', 'hub.html')

@app.route('/tracker')
def tracker_page():
    return send_from_directory('frontend', 'tracker.html')

@app.route('/api/tracker/analyze', methods=['POST'])
def analyze_footprint():
    data = request.get_json()
    transport = data.get('transport', 0)
    meat = data.get('meat', 0)
    energy = data.get('energy', 0)
    total = data.get('total', 0)

    # Simple Rule-Based AI
    advice = ""
    if total < 5:
        advice = "Fantastic job! Your footprint is well below average. Keep it up!"
    else:
        # Find biggest culprit
        co2_t = transport * 0.15
        co2_m = meat * 3.0
        co2_e = energy * 0.4
        
        m = max(co2_t, co2_m, co2_e)
        if m == co2_t:
            advice = f"Transport is your biggest factor ({co2_t:.1f}kg). Try carpooling, biking, or public transit to cut this down."
        elif m == co2_m:
            advice = f"Diet is your biggest factor ({co2_m:.1f}kg). Reducing meat intake by just one serving can have a huge impact."
        else:
            advice = f"Energy use is high ({co2_e:.1f}kg). Unplug unused electronics and switch to LED bulbs."

    return jsonify({"message": advice})

@app.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email')

    # Check if email exists
    token = create_reset_token(email)
    if not token:
        return jsonify({"error": "Email not found"}), 404

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

    success, message = perform_password_reset(token, new_password)
    
    if not success:
        return message, 400

    return "Password updated successfully. You can now <a href='/login'>login</a>.", 200

@app.route('/forgot-password', methods=['GET'])
def forgot_password_page():
    return send_from_directory('frontend', 'forgot_password.html')


if __name__ == '__main__':
    app.run(debug=True)

# Chatbot Endpoint
@app.route('/api/simulation/chat', methods=['POST'])
def simulation_chat():
    data = request.json
    message = data.get('message')
    config = data.get('config')
    
    if not message or not config:
        return jsonify({"error": "Missing message or config"}), 400
        
    # In a real app, we'd get the key from env
    # For demo, we might mock it or expect it in env
    api_key = os.environ.get("LLM_API_KEY", "MOCK") 
    
    reply = chat_with_simulation(message, config, api_key)
    return jsonify({"reply": reply})
