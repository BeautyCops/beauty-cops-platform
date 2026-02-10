from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.contrib.gis.db import models
from django.utils import timezone
from django_extensions.db.models import TimeStampedModel
from django_softdelete.models import SoftDeleteModel
from phonenumber_field.modelfields import PhoneNumberField

from beautycops.users.managers import UserManager
from beautycops.utils.models import UUIDModel


class User(AbstractUser, UUIDModel, TimeStampedModel, SoftDeleteModel):
    """
    Custom user model that uses email as the unique identifier
    instead of username.
    """

    username = None

    email = models.EmailField(unique=True)
    phone = PhoneNumberField(region=settings.DEFAULT_REGION, unique=True)
    skin_type = models.CharField(max_length=20, default="", blank=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "phone", "password"]

    objects = UserManager()

    class Meta:
        db_table = "users"  # ← مهم جداً حتى يستخدم الجدول الموجود مسبقاً

    def __str__(self) -> str:
        return self.email

    def delete(self, *args, **kwargs):
        # Prefix to ensure uniqueness and indicate deletion
        prefix = f"deleted.{timezone.now()}."
        # Anonymize user data instead of hard deleting
        self.email = prefix + self.email
        self.save()
        # Call the parent delete method to mark as deleted
        super().delete(*args, **kwargs)
