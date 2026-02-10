from __future__ import annotations

from beautycops.core.models import ProductIngredient


def compute_safety_category_from_score(score: float | None) -> str:
    # نفس اللي اتفقنا عليه (قريب من EWG)
    if score is None:
        return "unknown"
    if score <= 2.0:
        return "low"
    if score <= 6.0:
        return "medium"
    return "high"


def compute_ewg_like_score(scores: list[float]) -> float | None:
    """
    قريب من EWG:
    - رتب تنازلياً
    - خذ أسوأ 3
    - متوسطهم
    """
    if not scores:
        return None
    scores.sort(reverse=True)
    top = scores[:3]
    return round(sum(top) / len(top), 1)


def calculate_product_safety_for_fk(fk_filter: dict) -> tuple[float | None, str]:
    """
    fk_filter مثال:
      {"skincare_product": obj}
      {"makeup_product": obj}
      {"haircare_product": obj}
    """
    qs = ProductIngredient.objects.select_related("ingredient").filter(**fk_filter)

    scores: list[float] = []
    for pi in qs:
        ing = pi.ingredient
        if ing and ing.risk_score is not None:
            scores.append(float(ing.risk_score))

    score = compute_ewg_like_score(scores)
    category = compute_safety_category_from_score(score)
    return score, category


def update_cached_safety_for_product(obj) -> None:
    """
    يحدد نوع المنتج تلقائياً (skin/makeup/hair) من اسم الموديل.
    """
    model_name = obj.__class__.__name__.lower()

    if "skincare" in model_name:
        score, cat = calculate_product_safety_for_fk({"skincare_product": obj})
    elif "makeup" in model_name:
        score, cat = calculate_product_safety_for_fk({"makeup_product": obj})
    elif "haircare" in model_name:
        score, cat = calculate_product_safety_for_fk({"haircare_product": obj})
    else:
        return

    obj.safety_score_cached = score
    obj.safety_category_cached = cat
    obj.save(update_fields=["safety_score_cached", "safety_category_cached"])
