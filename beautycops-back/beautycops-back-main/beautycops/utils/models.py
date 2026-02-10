import uuid

from django.contrib.gis.db import models


class UUIDModel(models.Model):
    uid = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, unique=True)

    class Meta:
        abstract = True
