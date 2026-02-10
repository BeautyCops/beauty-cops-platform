from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from beautycops.core.models import ProductAffiliateLink
from beautycops.skincare.models import Brand, Category, ProductType, SkincareProduct
from beautycops.utils.serializers import IngredientInlineSerializer

# ==========================================================
# ✅ Affiliate links serializer (متوافق مع الفرونت)
# ==========================================================


class AffiliateLinkSerializer(serializers.ModelSerializer):
    # الفرونت متوقع store / marketplace / url
    store = serializers.SerializerMethodField()
    url = serializers.CharField(source="affiliate_url")

    class Meta:
        model = ProductAffiliateLink
        fields = ["store", "marketplace", "url"]

    def get_store(self, obj) -> str:
        # نخليها tag لو موجودة، وإلا ascsubtag، وإلا "unknown"
        return obj.tag or obj.ascsubtag or "unknown"


# ==========================================================
# ✅ Main product serializer
# ==========================================================


class SkincareProductSerializer(serializers.ModelSerializer):
    brand_name = serializers.CharField(source="brand.name", read_only=True, allow_null=True)
    # Safety fields + ingredients
    safety_score = serializers.IntegerField(read_only=True)
    safety_category = serializers.CharField(read_only=True)
    ingredients = IngredientInlineSerializer(many=True, read_only=True, source="product_ingredients")

    # ✅ روابط الأفلييت (بدون FK → لازم method)
    affiliate_links = serializers.SerializerMethodField()

    class Meta:
        model = SkincareProduct
        fields = [
            "skincare_id",
            "name",
            "image_url",
            "skin_type",
            "avg_rating",
            "reviews_count",
            "brand",
            "brand_name",
            # Safety
            "safety_score",
            "safety_category",
            # Ingredients
            "ingredients",
            # Affiliate links
            "affiliate_links",
        ]

    # --------- Fields ---------

    @extend_schema_field(AffiliateLinkSerializer(many=True))
    def get_affiliate_links(self, obj):
        """
        ✅ الربط حسب جدولك:
        - id_type = other
        - id_value = skincare_id
        """
        qs = ProductAffiliateLink.objects.filter(
            id_type=ProductAffiliateLink.IdType.OTHER, id_value=obj.skincare_id
        ).order_by("link_id")

        return AffiliateLinkSerializer(qs, many=True, context=self.context).data


class SelectBrandSerializer(serializers.ModelSerializer):
    label = serializers.CharField(source="name")
    value = serializers.IntegerField(source="brand_id")

    class Meta:
        model = Brand
        fields = ["label", "value"]


class SelectCategorySerializer(serializers.ModelSerializer):
    label = serializers.CharField(source="name")
    value = serializers.IntegerField(source="category_id")

    class Meta:
        model = Category
        fields = ["label", "value"]


class SelectProductTypeSerializer(serializers.ModelSerializer):
    label = serializers.CharField(source="name")
    value = serializers.IntegerField(source="type_id")

    class Meta:
        model = ProductType
        fields = ["label", "value"]
