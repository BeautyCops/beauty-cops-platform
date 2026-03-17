"""Quick script to list SQLite tables and product-app migration state."""
import os
import sys
import sqlite3

# Use same DB path as Django (project root)
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(script_dir)
os.chdir(project_root)
db_path = os.path.join(project_root, "db.sqlite3")
if not os.path.exists(db_path):
    print("db.sqlite3 not found at", db_path)
    sys.exit(1)

conn = sqlite3.connect(db_path)
c = conn.cursor()
c.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
tables = [r[0] for r in c.fetchall()]
print("Tables:", tables)

c.execute(
    "SELECT app, name FROM django_migrations WHERE app IN ('skincare', 'makeup', 'haircare', 'core')"
)
print("Migrations (skincare, makeup, haircare, core):", c.fetchall())
for t in ("brands", "skincare_products", "makeup_products", "haircare_products"):
    try:
        c.execute("SELECT COUNT(*) FROM " + t)
        print("  " + t + " count:", c.fetchone()[0])
    except Exception as e:
        print("  " + t + ":", e)
conn.close()
