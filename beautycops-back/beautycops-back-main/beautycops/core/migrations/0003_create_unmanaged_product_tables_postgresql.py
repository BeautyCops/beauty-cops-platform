# Create unmanaged product tables for PostgreSQL and seed initial data.
# For SQLite this is a no-op (0002 already did it). For PostgreSQL this creates
# tables and inserts sample data so the products page shows at least one product.

from django.db import migrations


def create_tables_postgresql(apps, schema_editor):
    """Create product tables for PostgreSQL (local dev)."""
    from django.db import connection

    if connection.vendor != "postgresql":
        return
    with connection.cursor() as cursor:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS brands (
                brand_id BIGSERIAL PRIMARY KEY,
                name TEXT UNIQUE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE NULL,
                created_by BIGINT NULL,
                updated_by BIGINT NULL,
                deleted_at TIMESTAMP WITH TIME ZONE NULL
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS categories (
                category_id BIGSERIAL PRIMARY KEY,
                name TEXT UNIQUE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE NULL,
                created_by BIGINT NULL,
                updated_by BIGINT NULL,
                deleted_at TIMESTAMP WITH TIME ZONE NULL,
                external_id BIGINT NULL,
                parent_id BIGINT NULL
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS product_types (
                type_id BIGSERIAL PRIMARY KEY,
                name TEXT UNIQUE NOT NULL,
                "group" VARCHAR(50) NULL,
                description TEXT NULL,
                created_at TIMESTAMP WITH TIME ZONE NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE NULL,
                created_by BIGINT NULL,
                updated_by BIGINT NULL,
                deleted_at TIMESTAMP WITH TIME ZONE NULL
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS ingredients (
                ingredient_id BIGSERIAL PRIMARY KEY,
                name TEXT UNIQUE NOT NULL,
                canonical_name VARCHAR(200) NULL,
                description TEXT NULL,
                risk_score NUMERIC(3,1) NULL,
                safety_category VARCHAR(20) NOT NULL DEFAULT 'unknown',
                created_at TIMESTAMP WITH TIME ZONE NULL,
                updated_at TIMESTAMP WITH TIME ZONE NULL
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS skincare_products (
                skincare_id BIGSERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT NULL,
                image_url TEXT NULL,
                skin_type TEXT NULL,
                spf_value SMALLINT NULL,
                ph_level NUMERIC(3,1) NULL,
                avg_rating NUMERIC(2,1) NULL,
                reviews_count INTEGER NULL,
                tsv TEXT NULL,
                created_at TIMESTAMP WITH TIME ZONE NULL,
                updated_at TIMESTAMP WITH TIME ZONE NULL,
                created_by BIGINT NULL,
                updated_by BIGINT NULL,
                deleted_at TIMESTAMP WITH TIME ZONE NULL,
                brand_id BIGINT NOT NULL REFERENCES brands(brand_id),
                category_id BIGINT NOT NULL REFERENCES categories(category_id),
                type_id BIGINT NULL REFERENCES product_types(type_id)
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS makeup_products (
                makeup_id BIGSERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT NULL,
                image_url TEXT NULL,
                avg_rating NUMERIC(2,1) NULL,
                reviews_count INTEGER NULL,
                tsv TEXT NULL,
                created_at TIMESTAMP WITH TIME ZONE NULL,
                updated_at TIMESTAMP WITH TIME ZONE NULL,
                created_by BIGINT NULL,
                updated_by BIGINT NULL,
                deleted_at TIMESTAMP WITH TIME ZONE NULL,
                staging_product_id BIGINT NULL,
                brand_id BIGINT NOT NULL REFERENCES brands(brand_id),
                category_id BIGINT NOT NULL REFERENCES categories(category_id),
                type_id BIGINT NULL REFERENCES product_types(type_id)
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS haircare_products (
                haircare_id BIGSERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT NULL,
                image_url TEXT NULL,
                skin_type TEXT NULL,
                staging_product_id BIGINT NULL,
                brand_id BIGINT NOT NULL REFERENCES brands(brand_id),
                category_id BIGINT NULL REFERENCES categories(category_id)
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS product_ingredients (
                product_ing_id BIGSERIAL PRIMARY KEY,
                position INTEGER NULL,
                role VARCHAR(50) NULL,
                concentration NUMERIC(5,2) NULL,
                skincare_id BIGINT NULL REFERENCES skincare_products(skincare_id),
                makeup_id BIGINT NULL REFERENCES makeup_products(makeup_id),
                haircare_id BIGINT NULL REFERENCES haircare_products(haircare_id),
                ingredient_id BIGINT NOT NULL REFERENCES ingredients(ingredient_id)
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS product_affiliate_links (
                link_id BIGSERIAL PRIMARY KEY,
                id_type VARCHAR(20) NOT NULL,
                id_value TEXT NOT NULL,
                marketplace VARCHAR(50) NULL,
                tag VARCHAR(100) NULL,
                ascsubtag VARCHAR(100) NULL,
                affiliate_url TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE NULL,
                updated_at TIMESTAMP WITH TIME ZONE NULL
            )
        """)


def load_initial_data(apps, schema_editor):
    """Insert minimal data for PostgreSQL so products page shows at least one product. No-op for SQLite."""
    from django.db import connection
    from django.utils import timezone

    if connection.vendor != "postgresql":
        return
    now = timezone.now()
    param = "%s"
    with connection.cursor() as cursor:
        cursor.execute("SELECT COUNT(*) FROM brands")
        if cursor.fetchone()[0] > 0:
            return
        cursor.execute(
            f"INSERT INTO brands (name, created_at) VALUES ({param}, {param})",
            ["عينة", now],
        )
        cursor.execute(
            f"INSERT INTO categories (name, created_at) VALUES ({param}, {param})",
            ["عناية بالبشرة", now],
        )
        cursor.execute(
            f"INSERT INTO product_types (name, created_at) VALUES ({param}, {param})",
            ["مرطب", now],
        )
        cursor.execute(
            f"""INSERT INTO skincare_products (
                name, brand_id, category_id, type_id, description, created_at, updated_at
            ) VALUES ({param}, 1, 1, 1, {param}, {param}, {param})""",
            ["منتج تجريبي للعناية بالبشرة", "منتج تجريبي للتنمية المحلية.", now, now],
        )


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("core", "0002_create_unmanaged_product_tables"),
    ]

    operations = [
        migrations.RunPython(create_tables_postgresql, noop_reverse),
        migrations.RunPython(load_initial_data, noop_reverse),
    ]
