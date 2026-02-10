from rest_framework import serializers

from beautycops.core.models import ProductIngredient


class IngredientInlineSerializer(serializers.ModelSerializer):
    # fields from Ingredient
    ingredient_id = serializers.IntegerField(source="ingredient.ingredient_id")
    name = serializers.CharField(source="ingredient.name")
    canonical_name = serializers.CharField(source="ingredient.canonical_name", allow_null=True)
    risk_score = serializers.DecimalField(
        source="ingredient.risk_score", max_digits=3, decimal_places=1, allow_null=True
    )
    safety_category = serializers.CharField(source="ingredient.safety_category")

    # fields from ProductIngredient
    position = serializers.IntegerField(allow_null=True)
    role = serializers.CharField(allow_null=True)
    concentration = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)

    class Meta:
        model = ProductIngredient
        fields = [
            "ingredient_id",
            "name",
            "canonical_name",
            "risk_score",
            "safety_category",
            "position",
            "role",
            "concentration",
        ]
