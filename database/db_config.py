import sqlite3
from pathlib import Path

# Ensure the database folder exists (relative to this script's location)
BASE_DIR = Path(__file__).resolve().parent
db_folder = BASE_DIR
db_folder.mkdir(exist_ok=True)

# Connect to SQLite database (creates file if not exists)
db_path = db_folder / "ecolearn.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Create users table
cursor.execute('''
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('student', 'teacher', 'admin')) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
''')

cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users';")
table = cursor.fetchone()
if table:
    print("'users' table created successfully at", db_path)
else:
    print("'users' table was not created.")


conn.commit()
conn.close()