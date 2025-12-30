from database.db_config import get_db_connection

def init_db():
    conn = get_db_connection()
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

    # Create reset_tokens table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS reset_tokens (
            email TEXT,
            token TEXT UNIQUE,
            expiry TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()
    print("Database initialized successfully.")
