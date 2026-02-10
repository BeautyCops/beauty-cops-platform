from django.core.management.base import BaseCommand

from beautycops.coportalels import ProductIngredient, ProductSafetyCache
from beautycops.haircare.models import HaircareProduct
from beautycops.makeup.models import MakeupProduct
from beautycops.skincare.models import SkincareProduct


def compute_safety_category(score: float | None) -> str:
    if score is None:
        return "unknown"
    if score <= 2:
        return "low"
    elif score <= 6:
        return "medium"
    return "high"


def calculate_ewg_score(scores: list[float]) -> float | None:
    """
    طريقة قريبة من EWG:
    - نأخذ أسوأ 3 مكونات
    - نحسب متوسطهم
    """
    if not scores:
        return None

    scores.sort(reverse=True)
    top = scores[:3]
    return round(sum(top) / len(top), 1)


class Command(BaseCommand):
    help = "Recalculate and cache safety scores for all products"

    def handle(self, *args, **options):
        ProductSafetyCache.objects.all().delete()

        self.stdout.write("🔄 Recalculating safety cache...")

        self._process_skincare()
        self._process_makeup()
        self._process_haircare()

        self.stdout.write(self.style.SUCCESS("✅ Safety cache recalculated successfully"))

    def _process_skincare(self):
        for product in SkincareProduct.objects.all():
            scores = list(
                ProductIngredient.objects.filter(
                    skincare_product=product, ingredient__risk_score__isnull=False
                ).values_list("ingredient__risk_score", flat=True)
            )

            score = calculate_ewg_score([float(s) for s in scores])
            ProductSafetyCache.objects.create(
                category="skincare",
                product_id=product.skincare_id,
                safety_score=score,
                safety_category=compute_safety_category(score),
            )

    def _process_makeup(self):
        for product in MakeupProduct.objects.all():
            scores = list(
                ProductIngredient.objects.filter(
                    makeup_product=product, ingredient__risk_score__isnull=False
                ).values_list("ingredient__risk_score", flat=True)
            )

            score = calculate_ewg_score([float(s) for s in scores])
            ProductSafetyCache.objects.create(
                category="makeup",
                product_id=product.makeup_id,
                safety_score=score,
                safety_category=compute_safety_category(score),
            )

    def _process_haircare(self):
        for product in HaircareProduct.objects.all():
            scores = list(
                ProductIngredient.objects.filter(
                    haircare_product=product, ingredient__risk_score__isnull=False
                ).values_list("ingredient__risk_score", flat=True)
            )

            score = calculate_ewg_score([float(s) for s in scores])
            ProductSafetyCache.objects.create(
                category="haircare",
                product_id=product.haircare_id,
                safety_score=score,
                safety_category=compute_safety_category(score),
            )
