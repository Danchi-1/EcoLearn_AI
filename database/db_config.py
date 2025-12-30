import sqlite3
from pathlib import Path

# Ensure the database folder exists (relative to this script's location)
BASE_DIR = Path(__file__).resolve().parent
db_folder = BASE_DIR
db_folder.mkdir(exist_ok=True)
db_path = db_folder / "ecolearn.db"

def get_db_connection():
    """Establishes and returns a database connection.
    remember to close the connection after use.
    """
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row # Access columns by name
    return conn