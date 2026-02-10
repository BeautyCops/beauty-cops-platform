from django.db import models

from beautycops.core.services.safety import compute_safety_category_from_score
from beautycops.skincare.models import Brand, Category


class HaircareProduct(models.Model):
    """
    يمثل جدول haircare_products في قاعدة البيانات.
    اربطناه مع brands و categories.
    """

    haircare_id = models.BigAutoField(primary_key=True)
    name = models.TextField()

    brand = models.ForeignKey(
        Brand,
        on_delete=models.DO_NOTHING,
        db_column="brand_id",
        related_name="haircare_products",
    )

    category = models.ForeignKey(
        Category,
        on_delete=models.DO_NOTHING,
        db_column="category_id",
        blank=True,
        null=True,
        related_name="haircare_products",
    )

    description = models.TextField(blank=True, null=True)
    image_url = models.TextField(blank=True, null=True)
    skin_type = models.TextField(blank=True, null=True)

    # هذا العمود شايفه في الصورة (staging_product_id)
    staging_product_id = models.BigIntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = "haircare_products"

    def __str__(self) -> str:
        return f"{self.name} ({self.brand})"

    @property
    def safety_score(self):
        """
        درجة أمان المنتج بطريقة قريبة من EWG:
        - نجمع كل risk_score للمكوّنات
        - نرتّبها تنازلياً (أعلى درجة = أخطر)
        - نأخذ أسوأ 3 مكوّنات
        - safety_score = متوسط أسوأ 3 درجات
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
        avg_score = sum(top_scores) / len(top_scores)
        return round(avg_score, 1)

    @property
    def safety_category(self):
        return compute_safety_category_from_score(self.safety_score)


safety_score_cached = models.DecimalField(max_digits=4, decimal_places=1, null=True, blank=True)
safety_category_cached = models.CharField(max_length=20, default="unknown")
