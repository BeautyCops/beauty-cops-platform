from django.db import models
from django.utils import timezone

# ==========================================================
# ✅ Ingredients (Existing Table)
# ==========================================================


class Ingredient(models.Model):
    ingredient_id = models.BigAutoField(primary_key=True)
    name = models.TextField(unique=True)
    canonical_name = models.CharField(max_length=200, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    risk_score = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        null=True,
        blank=True,
    )
    safety_category = models.CharField(
        max_length=20,
        default="unknown",
    )

    # managed=False → نخليها nullable عشان ما تكسر لو الجدول فيه NULL
    created_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = "ingredients"

    def __str__(self) -> str:
        return self.name


# ==========================================================
# ✅ Product Ingredients (Existing Table)
# ==========================================================


class ProductIngredient(models.Model):
    """
    يربط المكوّن بمنتج (سكين كير / مكياج / شعر)
    جدول: product_ingredients
    """

    product_ing_id = models.BigAutoField(primary_key=True, db_column="product_ing_id")

    skincare_product = models.ForeignKey(
        "skincare.SkincareProduct",
        db_column="skincare_id",
        null=True,
        blank=True,
        related_name="product_ingredients",
        on_delete=models.CASCADE,
    )

    makeup_product = models.ForeignKey(
        "makeup.MakeupProduct",
        db_column="makeup_id",
        null=True,
        blank=True,
        related_name="product_ingredients",
        on_delete=models.CASCADE,
    )

    haircare_product = models.ForeignKey(
        "haircare.HaircareProduct",
        db_column="haircare_id",
        null=True,
        blank=True,
        related_name="product_ingredients",
        on_delete=models.CASCADE,
    )

    ingredient = models.ForeignKey(
        Ingredient,
        db_column="ingredient_id",
        related_name="product_ingredients",
        on_delete=models.CASCADE,
    )

    position = models.IntegerField(null=True, blank=True)
    role = models.CharField(max_length=50, null=True, blank=True)
    concentration = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
    )

    class Meta:
        managed = False
        db_table = "product_ingredients"

    def __str__(self) -> str:
        return f"{self.ingredient} link #{self.product_ing_id}"


# ==========================================================
# ✅ Affiliate Links (Existing Table)
# ==========================================================


class ProductAffiliateLink(models.Model):
    """
    روابط الأفلييت من جدولك الحقيقي: product_affiliate_links

    الأعمدة حسب اللي عندك:
      link_id (PK)
      id_type (ENUM: upc/ean/sku/asin/other)
      id_value (⚠️ غالبًا TEXT في DB)
      marketplace
      tag
      ascsubtag
      affiliate_url
      created_at
      updated_at

    ✅ الربط يصير عن طريق (id_type + id_value)
    """

    class IdType(models.TextChoices):
        UPC = "upc", "upc"
        EAN = "ean", "ean"
        SKU = "sku", "sku"
        ASIN = "asin", "asin"
        OTHER = "other", "other"

    link_id = models.BigAutoField(primary_key=True, db_column="link_id")

    id_type = models.CharField(
        max_length=20,
        choices=IdType.choices,
        db_column="id_type",
    )

    # ✅ مهم جداً: نخليه TextField عشان ما يطلع خطأ (text = integer)
    id_value = models.TextField(db_column="id_value")

    marketplace = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        db_column="marketplace",
    )

    tag = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        db_column="tag",
    )
    ascsubtag = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        db_column="ascsubtag",
    )

    affiliate_url = models.TextField(db_column="affiliate_url")

    created_at = models.DateTimeField(null=True, blank=True, db_column="created_at")
    updated_at = models.DateTimeField(null=True, blank=True, db_column="updated_at")

    class Meta:
        managed = False
        db_table = "product_affiliate_links"
        indexes = [
            models.Index(fields=["id_type", "id_value"]),
        ]

    def __str__(self) -> str:
        return f"{self.id_type}:{self.id_value} – {self.affiliate_url}"


# ==========================================================
# ✅ New Table (managed=True) to Cache Safety Results
# ==========================================================


class ProductSafetyCache(models.Model):
    """
    نخزن نتيجة safety_score + safety_category لكل منتج
    عشان ما نعيد الحسبة كل مرة → يسرّع الـ API.
    """

    CATEGORY_CHOICES = [
        ("skincare", "skincare"),
        ("makeup", "makeup"),
        ("haircare", "haircare"),
    ]

    id = models.BigAutoField(primary_key=True)

    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    product_id = models.BigIntegerField()  # skincare_id / makeup_id / haircare_id

    safety_score = models.DecimalField(
        max_digits=4,
        decimal_places=1,
        null=True,
        blank=True,
    )
    safety_category = models.CharField(
        max_length=10,
        null=True,
        blank=True,
    )

    updated_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "product_safety_cache"
        unique_together = ("category", "product_id")
        indexes = [
            models.Index(fields=["category", "product_id"]),
        ]

    def __str__(self) -> str:
        return f"{self.category}:{self.product_id} -> {self.safety_score}"
