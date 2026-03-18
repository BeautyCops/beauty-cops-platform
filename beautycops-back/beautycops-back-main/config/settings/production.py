from config.settings.base import *  # noqa
from config.settings.base import INSTALLED_APPS, MIDDLEWARE, env

# https://whitenoise.evans.io/en/stable/django.html#using-whitenoise-in-development
INSTALLED_APPS += ["whitenoise.runserver_nostatic"]
# SECURITY WARNING: don't run with debug turned on in production!
MIDDLEWARE += ["whitenoise.middleware.WhiteNoiseMiddleware"]
# SECURITY
# ------------------------------------------------------------------------------
CSRF_TRUSTED_ORIGINS = [
    "https://*.beautycops.telasttechnologies.com",
    "https://*.beautycops.com",
]
# Database
# https://docs.djangoproject.com/en/5.0/ref/settings/#databases
DATABASES["default"]["CONN_MAX_AGE"] = env.int("CONN_MAX_AGE", default=60)  # noqa: F405

# Ensure production uses PostgreSQL (Railway provides DATABASE_URL).
# Base settings default to SQLite for local convenience; in production this must be overridden.
_db_url = env.str("DATABASE_URL", default="").strip()
if _db_url:
    DATABASES["default"] = env.db("DATABASE_URL")  # noqa: F405
    # django-environ may return the legacy engine name
    if DATABASES["default"].get("ENGINE") == "django.db.backends.postgresql_psycopg2":
        DATABASES["default"]["ENGINE"] = "django.db.backends.postgresql"
# STATIC
# ------------------------
# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/3.2/howto/static-files/
AWS_ACCESS_KEY_ID = env.str("AWS_ACCESS_KEY_ID", default="")
AWS_SECRET_ACCESS_KEY = env.str("AWS_SECRET_ACCESS_KEY", default="")
AWS_STORAGE_BUCKET_NAME = env.str("AWS_STORAGE_BUCKET_NAME", default="")
AWS_S3_REGION_NAME = env.str("AWS_S3_REGION_NAME", default="")
AWS_S3_OBJECT_PARAMETERS = {
    "CacheControl": "max-age=86400",
}
# https://docs.djangoproject.com/en/4.0/ref/settings/#storage-backends
STORAGES = {
    "default": {
        "BACKEND": "config.storages.MediaS3Storage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

# WhiteNoise manifest can be strict (default True) and will raise if any template
# references a static path that isn't in the manifest. In production we're seeing:
# ValueError: Missing staticfiles manifest entry for 'viewflow/img/favicon.png'
# which causes ALL requests (including API) to return 500 when Django tries to
# render 404/500 templates. Relax strictness to prevent cascading outages.
WHITENOISE_MANIFEST_STRICT = env.bool("WHITENOISE_MANIFEST_STRICT", default=False)
