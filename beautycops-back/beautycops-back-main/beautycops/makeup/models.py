# Backend-beautycops/makeup/models.py

from django.db import models

from beautycops.core.services.safety import compute_safety_category_from_score
from beautycops.skincare.models import Brand, Category, ProductType  # نستخدم نفس الجداول


class MakeupProduct(models.Model):
    """
    يمثل جدول makeup_products في قاعدة البيانات
    (بدون مكوّنات حالياً، بس بيانات رئيسية + البراند).
    """

    makeup_id = models.BigAutoField(primary_key=True)
    name = models.TextField()

    # علاقات مع الجداول المشتركة
    brand = models.ForeignKey(
        Brand,
        on_delete=models.DO_NOTHING,
        db_column="brand_id",  # مهم: يطابق اسم العمود في الجدول
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

    # بيانات عامة عن المنتج
    description = models.TextField(blank=True, null=True)
    image_url = models.TextField(blank=True, null=True)

    # تقييمات
    avg_rating = models.DecimalField(
        max_digits=2,
        decimal_places=1,
        blank=True,
        null=True,
    )
    reviews_count = models.IntegerField(blank=True, null=True)

    # باقي الأعمدة في الجدول لو موجودة
    tsv = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)
    created_by = models.BigIntegerField(blank=True, null=True)
    updated_by = models.BigIntegerField(blank=True, null=True)
    deleted_at = models.DateTimeField(blank=True, null=True)
    staging_product_id = models.BigIntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = "makeup_products"
        unique_together = (("name", "brand"),)

    def __str__(self) -> str:
        return f"{self.name} ({self.brand})"

    @property
    def safety_score(self):
        """
        ✅ أولاً: لو عندك كاش في DB: safety_score_cached
        ✅ إذا فاضي/مو موجود: fallback نحسب
        """
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

        scores.sort(reverse=True)
        top_scores = scores[:3]
        return round(sum(top_scores) / len(top_scores), 1)

    @property
    def safety_category(self):
        """
        ✅ أولاً: لو عندك كاش في DB: safety_category_cached
        ✅ إذا فاضي/مو موجود: نشتقه من score
        """
        cached = getattr(self, "safety_category_cached", None)
        if cached:
            return cached

        return compute_safety_category_from_score(self.safety_score)


safety_score_cached = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
safety_category_cached = models.CharField(max_length=20, default="unknown")
