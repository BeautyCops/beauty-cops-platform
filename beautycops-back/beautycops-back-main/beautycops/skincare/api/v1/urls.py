from django.urls import include, path
from rest_framework.routers import DefaultRouter

from beautycops.skincare.api.v1.views import (
    ProductAffiliateLinks,
    SelectBrandViewSet,
    SelectCategoryViewSet,
    SelectProductTypeViewSet,
    SkincareProductViewSet,
)

app_name = "skincare"

router = DefaultRouter()

router.register("skincare_products", SkincareProductViewSet, basename="skincare_products")

urlpatterns = [
    path("", include(router.urls)),
    path("product_affiliate_links/<int:product_id>/", ProductAffiliateLinks.as_view(), name="product_affiliate_links"),
    path("select_brands/", SelectBrandViewSet.as_view({"get": "list"}), name="select_brands"),
    path("select_categories/", SelectCategoryViewSet.as_view({"get": "list"}), name="select_categories"),
    path("select_product_types/", SelectProductTypeViewSet.as_view({"get": "list"}), name="select_product_types"),
]
