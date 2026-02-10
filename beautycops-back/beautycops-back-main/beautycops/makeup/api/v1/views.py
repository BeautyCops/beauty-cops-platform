from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets
from rest_framework.filters import OrderingFilter, SearchFilter

from beautycops.makeup.api.v1.serializers import MakeupProductSerializer
from beautycops.makeup.models import MakeupProduct


class MakeupProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = MakeupProduct.objects.select_related("brand").order_by("makeup_id")
    serializer_class = MakeupProductSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter, SearchFilter]
    filterset_fields = ["type", "category", "brand"]
    ordering_fields = ["avg_rating", "reviews_count"]
    search_fields = ["name", "description", "brand__name", "category__name"]
