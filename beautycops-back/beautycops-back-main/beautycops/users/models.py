from django.conf import settings
from django.contrib.auth.models import AbstractUser
# from django.contrib.gis.db import models +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
from django.db import models
from django.utils import timezone
from django_extensions.db.models import TimeStampedModel
from django_softdelete.models import SoftDeleteModel
from phonenumber_field.modelfields import PhoneNumberField

from beautycops.users.managers import UserManager
from beautycops.utils.models import UUIDModel


class User(AbstractUser, UUIDModel, TimeStampedModel, SoftDeleteModel):

    username = None

    email = models.EmailField(unique=True, blank=True, null=True)
    phone = PhoneNumberField(region=settings.DEFAULT_REGION, unique=True)
    skin_type = models.CharField(max_length=20, default="", blank=True)

    USERNAME_FIELD = "phone"
    REQUIRED_FIELDS = []

    objects = UserManager()

    class Meta:
        db_table = "users"

    def __str__(self):
        return str(self.phone)

    def delete(self, *args, **kwargs):
        prefix = f"deleted.{timezone.now()}."
        if self.email:
            self.email = prefix + self.email
        self.save()
        super().delete(*args, **kwargs)


# from dj_rest_auth.models import TokenModel +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
import random
from datetime import timedelta


class PhoneOTP(models.Model):
    phone = models.CharField(max_length=20, db_index=True)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_valid(self):
        return timezone.now() < self.created_at + timedelta(minutes=5)

    def generate_code(self):
        self.code = f"{random.randint(100000, 999999)}"
        self.save()
        return self.code