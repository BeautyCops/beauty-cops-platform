# Backend-beautycops/skincare/models.py

from django.db import models

from beautycops.core.services.safety import compute_safety_category_from_score


class Brand(models.Model):
    brand_id = models.BigAutoField(primary_key=True)
    name = models.TextField(unique=True)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField(blank=True, null=True)
    created_by = models.BigIntegerField(blank=True, null=True)
    updated_by = models.BigIntegerField(blank=True, null=True)
    deleted_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = "brands"

    def __str__(self) -> str:
        return self.name


class Category(models.Model):
    category_id = models.BigAutoField(primary_key=True)
    name = models.TextField(unique=True)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField(blank=True, null=True)
    created_by = models.BigIntegerField(blank=True, null=True)
    updated_by = models.BigIntegerField(blank=True, null=True)
    deleted_at = models.DateTimeField(blank=True, null=True)
    external_id = models.BigIntegerField(blank=True, null=True)
    parent_id = models.BigIntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = "categories"

    def __str__(self) -> str:
        return self.name


class ProductType(models.Model):
    type_id = models.BigAutoField(primary_key=True)
    name = models.TextField(unique=True)
    group = models.CharField(max_length=50, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField(blank=True, null=True)
    created_by = models.BigIntegerField(blank=True, null=True)
    updated_by = models.BigIntegerField(blank=True, null=True)
    deleted_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = "product_types"

    def __str__(self) -> str:
        return self.name


class SkincareProduct(models.Model):
    """
    تمثيل جدول skincare_products في قاعدة البيانات
    (بدون أي تعقيد زيادة).
    """

    skincare_id = models.BigAutoField(primary_key=True)
    name = models.TextField()

    # مهم: db_column = اسم العمود الحقيقي في الجدول
    brand = models.ForeignKey(
        Brand,
        on_delete=models.DO_NOTHING,
        db_column="brand_id",
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.DO_NOTHING,
        db_column="category_id",
    )
    type = models.ForeignKey(
        ProductType,
        on_delete=models.DO_NOTHING,
        db_column="type_id",
        blank=True,
        null=True,
    )

    description = models.TextField(blank=True, null=True)
    image_url = models.TextField(blank=True, null=True)
    skin_type = models.TextField(blank=True, null=True)
    spf_value = models.SmallIntegerField(blank=True, null=True)
    ph_level = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        blank=True,
        null=True,
    )
    avg_rating = models.DecimalField(
        max_digits=2,
        decimal_places=1,
        blank=True,
        null=True,
    )
    reviews_count = models.IntegerField(blank=True, null=True)
    tsv = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    created_by = models.BigIntegerField(blank=True, null=True)
    updated_by = models.BigIntegerField(blank=True, null=True)
    deleted_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = "skincare_products"
        unique_together = (("name", "brand"),)

    def __str__(self) -> str:
        return f"{self.name} ({self.brand})"

    @property
    def safety_score(self):
        cached = getattr(self, "safety_score_cached", None)
        if cached is not None:
            return float(cached)

        scores: list[float] = []

        for pi in self.product_ingredients.select_related("ingredient").all():
            ing = pi.ingredient
            if ing and ing.risk_score is not None:
                scores.append(float(ing.risk_score))

        if not scores:
            return None

        base = max(scores)
        high_count = sum(1 for s in scores if s >= 7)
        medium_count = sum(1 for s in scores if 3 <= s <= 6)

        penalty = 0.5 * max(0, high_count - 1) + 0.25 * max(0, medium_count - 2)

        final_score = base + penalty
        final_score = max(1.0, min(10.0, final_score))
        return round(final_score, 1)

    @property
    def safety_category(self):
        cached = getattr(self, "safety_category_cached", None)
        if cached:
            return cached

        return compute_safety_category_from_score(self.safety_score)


safety_score_cached = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
safety_category_cached = models.CharField(max_length=20, default="unknown")
