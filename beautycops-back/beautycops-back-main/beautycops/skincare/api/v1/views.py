from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import mixins, views, viewsets
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.response import Response

from beautycops.skincare.api.v1.serializers import (
    SelectBrandSerializer,
    SelectCategorySerializer,
    SelectProductTypeSerializer,
    SkincareProductSerializer,
)
from beautycops.skincare.models import Brand, Category, ProductType, SkincareProduct
from beautycops.utils.functions import get_affiliate_links


class SkincareProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = (
        SkincareProduct.objects.select_related("brand")
        .prefetch_related(
            "product_ingredients__ingredient",
        )
        .order_by("skincare_id")
    )
    serializer_class = SkincareProductSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter, SearchFilter]
    filterset_fields = ["category", "brand", "type", "skin_type"]
    ordering_fields = ["spf_value", "ph_level", "avg_rating", "reviews_count"]
    search_fields = ["name", "description", "brand__name", "category__name"]


class SelectBrandViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = Brand.objects.all().order_by("name")
    serializer_class = SelectBrandSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter, SearchFilter]
    search_fields = ["name"]


class SelectCategoryViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = Category.objects.all().order_by("name")
    serializer_class = SelectCategorySerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter, SearchFilter]
    search_fields = ["name"]


class SelectProductTypeViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = ProductType.objects.all().order_by("name")
    serializer_class = SelectProductTypeSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter, SearchFilter]
    search_fields = ["name"]


class ProductAffiliateLinks(views.APIView):
    def get(self, request, product_id):
        links = get_affiliate_links(product_id, marketplace="SA")
        return Response({"product_id": product_id, "affiliate_links": links})
