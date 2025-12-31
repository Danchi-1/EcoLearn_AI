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

    # Create simulation_saves table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS simulation_saves (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT,
            title TEXT,
            config_json TEXT, -- The initial configuration
            state_json TEXT, -- The current grid/resources state
            saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_email) REFERENCES users(email)
        )
    ''')
    
    conn.commit()
    conn.close()
    print("Database initialized successfully.")
