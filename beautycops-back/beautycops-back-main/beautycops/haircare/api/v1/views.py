from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter

from beautycops.haircare.api.v1.serializers import HaircareProductSerializer
from beautycops.haircare.models import HaircareProduct


class HaircareProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = (
        HaircareProduct.objects.select_related("brand")
        .prefetch_related(
            "product_ingredients__ingredient",
        )
        .order_by("haircare_id")
    )
    serializer_class = HaircareProductSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter, SearchFilter]
    filterset_fields = ["category", "brand", "skin_type"]
    search_fields = ["name", "description", "brand__name", "category__name"]
