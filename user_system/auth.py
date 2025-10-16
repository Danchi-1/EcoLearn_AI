import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash
from pathlib import Path
import sys
from database.db_config import db_path


def register_user(name, email, password, role):
    hashed_pw = generate_password_hash(password)
    conn = sqlite3.connect(db_path)
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
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute('SELECT password FROM users WHERE email = ?', (email,))
    row = cursor.fetchone()
    conn.close()

    if row and check_password_hash(row[0], password):
        return True
    return False

def get_user_by_email(email):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute('SELECT name, email, role FROM users WHERE email = ?', (email,))
    row = cursor.fetchone()
    conn.close()

    if row:
        return {
            "name": row[0],
            "email": row[1],
            "role": row[2]
        }
    return None
