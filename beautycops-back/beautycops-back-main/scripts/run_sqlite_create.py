"""Run the SQLite table creation from migration 0002 (for debugging)."""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.local")
django.setup()

from django.db import connection

if connection.vendor != "sqlite3":
    print("Not SQLite, skipping")
    sys.exit(0)

with connection.cursor() as cursor:
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS brands (
            brand_id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            created_at DATETIME NOT NULL,
            updated_at DATETIME NULL,
            created_by INTEGER NULL,
            updated_by INTEGER NULL,
            deleted_at DATETIME NULL
        )
    """)
    print("Created brands")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='brands'")
    print("Verify:", cursor.fetchall())
