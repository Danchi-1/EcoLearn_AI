import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash
from pathlib import Path
import secrets
from datetime import datetime, timedelta
from database.db_config import get_db_connection

def register_user(name, email, password, role):
    hashed_pw = generate_password_hash(password)
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute('''
            INSERT INTO users (name, email, password, role)
            VALUES (?, ?, ?, ?)
        ''', (name, email, hashed_pw, role))
        conn.commit()
        print("Inserting user:", name, email, role)
        return True
    except sqlite3.IntegrityError:
        print("User with this email already exist")
        return False  # email already exists
    finally:
        conn.close()

def validate_user(email, password):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT password FROM users WHERE email = ?', (email,))
    row = cursor.fetchone()
    conn.close()

    if row and check_password_hash(row['password'], password):
        return True
    return False

def get_user_by_email(email):
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT name, email, role FROM users WHERE email = ?', (email,))
    row = cursor.fetchone()
    conn.close()

    if row:
        return {
            "name": row['name'],
            "email": row['email'],
            "role": row['role']
        }
    return None

def create_reset_token(email):
    user = get_user_by_email(email)
    if not user:
        return None

    token = secrets.token_urlsafe(32)
    expiry = datetime.now() + timedelta(hours=1)

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO reset_tokens (email, token, expiry) VALUES (?, ?, ?)', (email, token, expiry))
    conn.commit()
    conn.close()
    
    return token

def verify_reset_token(token):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT email, expiry FROM reset_tokens WHERE token = ?', (token,))
    result = cursor.fetchone()
    conn.close()

    if not result:
        return None, "Invalid or expired token"

    email = result['email']
    expiry = result['expiry']
    
    # Check if expiry is a string or a datetime object (sqlite stores as string usually)
    if isinstance(expiry, str):
        expiry_dt = datetime.strptime(expiry, '%Y-%m-%d %H:%M:%S.%f')
    else:
        expiry_dt = expiry

    if expiry_dt < datetime.now():
        return None, "Token expired"

    return email, None

def perform_password_reset(token, new_password):
    email, error = verify_reset_token(token)
    if error:
        return False, error
    
    hashed_pw = generate_password_hash(new_password)
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE users SET password = ? WHERE email = ?', (hashed_pw, email))
    cursor.execute('DELETE FROM reset_tokens WHERE token = ?', (token,))
    conn.commit()
    conn.close()
    
    return True, "Password updated successfully"
