from django.urls import include, path
from rest_framework.routers import DefaultRouter

from beautycops.makeup.api.v1.views import MakeupProductViewSet

app_name = "makeup"

router = DefaultRouter()

router.register("makeup_products", MakeupProductViewSet, basename="makeup_products")

urlpatterns = [
    path("", include(router.urls)),
]
