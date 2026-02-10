from rest_framework import serializers

from beautycops.makeup.models import MakeupProduct
from beautycops.utils.serializers import IngredientInlineSerializer


class MakeupProductSerializer(serializers.ModelSerializer):
    brand_name = serializers.CharField(source="brand.name", read_only=True, allow_null=True)
    # ✅ نرجعها كـ JSON رقم (مو string)
    safety_score = serializers.IntegerField(read_only=True)
    safety_category = serializers.CharField(read_only=True)
    ingredients = IngredientInlineSerializer(many=True, read_only=True, source="product_ingredients")

    class Meta:
        model = MakeupProduct
        fields = [
            "makeup_id",
            "staging_product_id",
            "name",
            "image_url",
            "avg_rating",
            "reviews_count",
            "brand",
            "brand_name",
            "safety_score",
            "safety_category",
            "ingredients",
        ]
