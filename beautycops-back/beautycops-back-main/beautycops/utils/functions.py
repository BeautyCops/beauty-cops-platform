from django.db import connection


def get_affiliate_links(staging_product_id, marketplace="SA"):
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT pal.affiliate_url
            FROM product_external_ids pe
            JOIN product_affiliate_links pal
              ON pal.id_type = pe.id_type
             AND pal.id_value = pe.id_value
             AND pal.marketplace = pe.marketplace
            WHERE pe.id_type = 'asin'
              AND pe.marketplace = %s
              AND pe.staging_product_id = %s
        """,
            [marketplace, staging_product_id],
        )
        rows = cursor.fetchall()
    return [r[0] for r in rows]
