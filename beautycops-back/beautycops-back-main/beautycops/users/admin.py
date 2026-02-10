from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as auth_admin
from django.utils.translation import gettext_lazy as _

from beautycops.users.models import User


@admin.register(User)
class UserAdmin(auth_admin):
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (_("Personal info"), {"fields": ("first_name", "skin_type", "phone")}),
        (
            _("Permissions"),
            {
                "fields": (
                    "is_staff",
                    "is_superuser",
                    "is_active",
                    "groups",
                    "user_permissions",
                ),
            },
        ),
        (_("Important dates"), {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "first_name",
                    "email",
                    "phone",
                    "skin_type",
                    "password1",
                    "password2",
                ),
            },
        ),
    )
    list_display = [
        "email",
        "first_name",
        "phone",
        "is_superuser",
        "is_active",
        "date_joined",
    ]
    search_fields = ["first_name", "email"]
    list_filter = ("is_active", "date_joined")
    readonly_fields = ["last_login", "date_joined"]
    ordering = ["email"]
