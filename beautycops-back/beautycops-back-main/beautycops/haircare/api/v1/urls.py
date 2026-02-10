from django.urls import include, path
from rest_framework.routers import DefaultRouter

from beautycops.haircare.api.v1.views import HaircareProductViewSet

app_name = "haircare"

router = DefaultRouter()

router.register("haircare_products", HaircareProductViewSet, basename="haircare_products")

urlpatterns = [
    path("", include(router.urls)),
]
