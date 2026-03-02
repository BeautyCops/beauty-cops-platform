from django.conf import settings
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerSplitView

from beautycops.utils.api.v1.views import PasswordResetConfirmRedirect

urlpatterns = [
    # Admin
    path("admin/", admin.site.urls),

    # API Router الرئيسي
    path("api/", include(("config.api_router", "api"), "api")),

    # OTP Authentication Endpoints
    path("api/auth/otp/", include("beautycops.utils.api.v1.urls")),

    # Password reset redirect (لو تحتاجينه مستقبلاً)
    path(
        "api/auth/password/reset/confirm/<str:uidb64>/<str:token>/",
        PasswordResetConfirmRedirect.as_view(),
        name="password_reset_confirm",
    ),

    # API Schema
    path("api/schema/", SpectacularAPIView.as_view(), name="api-schema"),
    path(
        "api/docs/",
        SpectacularSwaggerSplitView.as_view(url_name="api-schema"),
        name="api-docs",
    ),
]


if settings.DEBUG:
    import debug_toolbar
    from django.conf.urls.static import static

    urlpatterns += [
        path("__debug__/", include(debug_toolbar.urls)),
        *static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT),
    ]