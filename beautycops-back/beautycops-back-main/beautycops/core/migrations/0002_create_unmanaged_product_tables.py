# Migration to create unmanaged product tables for local development.
# These tables are normally managed externally (managed=False). This creates
# them for SQLite or PostgreSQL so the app can run and show products locally.

from django.db import migrations


def create_tables_sqlite(apps, schema_editor):
    """Create product tables only for SQLite (local dev)."""
    from django.db import connection

    if connection.vendor != "sqlite":
        return
    with connection.cursor() as cursor:
        # brands (referenced by skincare, makeup, haircare products)
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
        # categories
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS categories (
                category_id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NULL,
                created_by INTEGER NULL,
                updated_by INTEGER NULL,
                deleted_at DATETIME NULL,
                external_id INTEGER NULL,
                parent_id INTEGER NULL
            )
        """)
        # product_types
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS product_types (
                type_id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                "group" VARCHAR(50) NULL,
                description TEXT NULL,
                created_at DATETIME NOT NULL,
                updated_at DATETIME NULL,
                created_by INTEGER NULL,
                updated_by INTEGER NULL,
                deleted_at DATETIME NULL
            )
        """)
        # ingredients
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS ingredients (
                ingredient_id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                canonical_name VARCHAR(200) NULL,
                description TEXT NULL,
                risk_score DECIMAL(3,1) NULL,
                safety_category VARCHAR(20) NOT NULL DEFAULT 'unknown',
                created_at DATETIME NULL,
                updated_at DATETIME NULL
            )
        """)
        # skincare_products
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS skincare_products (
                skincare_id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT NULL,
                image_url TEXT NULL,
                skin_type TEXT NULL,
                spf_value SMALLINT NULL,
                ph_level DECIMAL(3,1) NULL,
                avg_rating DECIMAL(2,1) NULL,
                reviews_count INTEGER NULL,
                tsv TEXT NULL,
                created_at DATETIME NULL,
                updated_at DATETIME NULL,
                created_by INTEGER NULL,
                updated_by INTEGER NULL,
                deleted_at DATETIME NULL,
                brand_id INTEGER NOT NULL REFERENCES brands(brand_id),
                category_id INTEGER NOT NULL REFERENCES categories(category_id),
                type_id INTEGER NULL REFERENCES product_types(type_id)
            )
        """)
        # makeup_products
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS makeup_products (
                makeup_id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT NULL,
                image_url TEXT NULL,
                avg_rating DECIMAL(2,1) NULL,
                reviews_count INTEGER NULL,
                tsv TEXT NULL,
                created_at DATETIME NULL,
                updated_at DATETIME NULL,
                created_by INTEGER NULL,
                updated_by INTEGER NULL,
                deleted_at DATETIME NULL,
                staging_product_id INTEGER NULL,
                brand_id INTEGER NOT NULL REFERENCES brands(brand_id),
                category_id INTEGER NOT NULL REFERENCES categories(category_id),
                type_id INTEGER NULL REFERENCES product_types(type_id)
            )
        """)
        # haircare_products
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS haircare_products (
                haircare_id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT NULL,
                image_url TEXT NULL,
                skin_type TEXT NULL,
                staging_product_id INTEGER NULL,
                brand_id INTEGER NOT NULL REFERENCES brands(brand_id),
                category_id INTEGER NULL REFERENCES categories(category_id)
            )
        """)
        # product_ingredients
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS product_ingredients (
                product_ing_id INTEGER PRIMARY KEY AUTOINCREMENT,
                position INTEGER NULL,
                role VARCHAR(50) NULL,
                concentration DECIMAL(5,2) NULL,
                skincare_id INTEGER NULL REFERENCES skincare_products(skincare_id),
                makeup_id INTEGER NULL REFERENCES makeup_products(makeup_id),
                haircare_id INTEGER NULL REFERENCES haircare_products(haircare_id),
                ingredient_id INTEGER NOT NULL REFERENCES ingredients(ingredient_id)
            )
        """)
        # product_affiliate_links (minimal columns for schema)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS product_affiliate_links (
                link_id INTEGER PRIMARY KEY AUTOINCREMENT,
                id_type VARCHAR(20) NOT NULL,
                id_value TEXT NOT NULL,
                marketplace VARCHAR(50) NULL,
                tag VARCHAR(100) NULL,
                ascsubtag VARCHAR(100) NULL,
                affiliate_url TEXT NOT NULL,
                created_at DATETIME NULL,
                updated_at DATETIME NULL
            )
        """)


def load_initial_data(apps, schema_editor):
    """Insert minimal data so products page shows at least one product (SQLite)."""
    from django.db import connection
    from django.utils import timezone

    if connection.vendor != "sqlite":
        return
    now = timezone.now().isoformat()
    with connection.cursor() as cursor:
        cursor.execute("SELECT COUNT(*) FROM brands")
        if cursor.fetchone()[0] > 0:
            return
        cursor.execute(
            "INSERT INTO brands (name, created_at) VALUES (%s, %s)",
            ["عينة", now],
        )
        cursor.execute(
            "INSERT INTO categories (name, created_at) VALUES (%s, %s)",
            ["عناية بالبشرة", now],
        )
        cursor.execute(
            "INSERT INTO product_types (name, created_at) VALUES (%s, %s)",
            ["مرطب", now],
        )
        cursor.execute(
            """INSERT INTO skincare_products (
                name, brand_id, category_id, type_id, description, created_at, updated_at
            ) VALUES (%s, 1, 1, 1, %s, %s, %s)""",
            ["منتج تجريبي للعناية بالبشرة", "منتج تجريبي للتنمية المحلية.", now, now],
        )


def noop_reverse(apps, schema_editor):
    """No-op reverse (tables are unmanaged; leave them for dev)."""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(create_tables_sqlite, noop_reverse),
        migrations.RunPython(load_initial_data, noop_reverse),
    ]
