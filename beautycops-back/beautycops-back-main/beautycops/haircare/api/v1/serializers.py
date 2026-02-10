from rest_framework import serializers

from beautycops.haircare.models import HaircareProduct
from beautycops.utils.serializers import IngredientInlineSerializer


class HaircareProductSerializer(serializers.ModelSerializer):
    # نطلع اسم البراند بدل الـ id
    brand_name = serializers.CharField(source="brand.name", read_only=True, allow_null=True)
    # حقول الأمان + قائمة المكوّنات
    safety_score = serializers.IntegerField(read_only=True)
    safety_category = serializers.CharField(read_only=True)
    ingredients = IngredientInlineSerializer(many=True, read_only=True, source="product_ingredients")

    class Meta:
        model = HaircareProduct
        fields = [
            "haircare_id",
            "staging_product_id",
            "name",
            "image_url",
            "skin_type",  # لو عندك hair_type بدالها غيّري الاسم هنا
            "brand_name",
            "safety_score",
            "safety_category",
            "ingredients",
        ]
