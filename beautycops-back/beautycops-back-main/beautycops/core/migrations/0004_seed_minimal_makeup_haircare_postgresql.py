"""
Seed minimal makeup + haircare products for PostgreSQL production.

Production Railway DB currently has the unmanaged product tables created, but
only a single skincare "dummy" product exists (from 0003).

Because the frontend UI expects to show products across all categories,
we ensure at least one makeup_products and one haircare_products row exist.
"""

from django.db import migrations
from django.utils import timezone


def seed_minimal_products_postgresql(apps, schema_editor):
    from django.db import connection

    if connection.vendor != "postgresql":
        return

    now = timezone.now()

    with connection.cursor() as cursor:
        # Ensure required FK ids exist (from 0003 these usually already exist)
        cursor.execute("SELECT brand_id FROM brands WHERE name=%s", ["عينة"])
        row = cursor.fetchone()
        if row:
            brand_id = row[0]
        else:
            cursor.execute(
                "INSERT INTO brands (name, created_at) VALUES (%s, %s) RETURNING brand_id",
                ["عينة", now],
            )
            brand_id = cursor.fetchone()[0]

        cursor.execute("SELECT category_id FROM categories WHERE name=%s", ["عناية بالبشرة"])
        row = cursor.fetchone()
        if row:
            category_id = row[0]
        else:
            cursor.execute(
                "INSERT INTO categories (name, created_at) VALUES (%s, %s) RETURNING category_id",
                ["عناية بالبشرة", now],
            )
            category_id = cursor.fetchone()[0]

        cursor.execute("SELECT type_id FROM product_types WHERE name=%s", ["مرطب"])
        row = cursor.fetchone()
        if row:
            type_id = row[0]
        else:
            cursor.execute(
                "INSERT INTO product_types (name, created_at) VALUES (%s, %s) RETURNING type_id",
                ["مرطب", now],
            )
            type_id = cursor.fetchone()[0]

        # Seed makeup if missing
        cursor.execute("SELECT COUNT(*) FROM makeup_products")
        makeup_count = cursor.fetchone()[0]
        if makeup_count == 0:
            cursor.execute(
                """
                INSERT INTO makeup_products
                    (name, description, image_url, avg_rating, reviews_count, tsv, created_at, updated_at,
                     brand_id, category_id, type_id, staging_product_id, deleted_at, created_by, updated_by)
                VALUES
                    (%s, %s, %s, %s, %s, %s, %s, %s,
                     %s, %s, %s, %s, %s, %s, %s)
                """,
                [
                    "منتج تجريبي للـمكياج",
                    "منتج تجريبي للتنمية المحلية.",
                    None,
                    None,
                    None,
                    None,
                    now,
                    now,
                    brand_id,
                    category_id,
                    type_id,
                    None,
                    None,
                    None,
                    None,
                ],
            )

        # Seed haircare if missing
        cursor.execute("SELECT COUNT(*) FROM haircare_products")
        haircare_count = cursor.fetchone()[0]
        if haircare_count == 0:
            cursor.execute(
                """
                INSERT INTO haircare_products
                    (name, description, image_url, skin_type, staging_product_id, brand_id, category_id)
                VALUES
                    (%s, %s, %s, %s, %s, %s, %s)
                """,
                [
                    "منتج تجريبي للشعر",
                    "منتج تجريبي للتنمية المحلية.",
                    None,
                    None,
                    None,
                    brand_id,
                    category_id,
                ],
            )


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0003_create_unmanaged_product_tables_postgresql"),
    ]

    operations = [
        migrations.RunPython(seed_minimal_products_postgresql, noop_reverse),
    ]

