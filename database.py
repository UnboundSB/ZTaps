import sqlite3
import datetime
from pathlib import Path

DB_FILE = "ztaps_audit.db"

def init_db():
    """
    Initializes the SQLite database and creates the audit_logs table if it doesn't exist.
    """
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            agent_id TEXT NOT NULL,
            item_category TEXT NOT NULL,
            amount INTEGER NOT NULL,
            status TEXT NOT NULL,
            transaction_id TEXT,
            reason TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

def insert_audit_record(agent_id: str, item_category: str, amount: int, status: str, reason: str, transaction_id: str | None = None):
    """
    Inserts a new record into the audit ledger.
    
    Args:
        agent_id (str): ID of the requesting AI agent.
        item_category (str): The requested item category.
        amount (int): Transaction amount.
        status (str): "approved" or "rejected".
        reason (str): Plain-English justification of the decision.
        transaction_id (str | None): Razorpay Order ID if successful, else None.
    """
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    cursor.execute('''
        INSERT INTO audit_logs (timestamp, agent_id, item_category, amount, status, transaction_id, reason)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (now, agent_id, item_category, amount, status, transaction_id, reason))
    
    conn.commit()
    conn.close()

# Automatically initialize database upon import
init_db()
