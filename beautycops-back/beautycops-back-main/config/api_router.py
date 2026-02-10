from django.urls import include, path

v1 = [
    path("haircare/", include("beautycops.haircare.api.v1.urls")),
    path("skincare/", include("beautycops.skincare.api.v1.urls")),
    path("makeup/", include("beautycops.makeup.api.v1.urls")),
]

urlpatterns = [
    path("v1/", include((v1, "v1"), namespace="v1")),
]
