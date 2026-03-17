from config.settings.base import *  # noqa
from config.settings.base import env
import importlib.util
import os

# ------------------------------------------------------------------------------
# Local database: PostgreSQL only (SQLite disabled). Use Docker Postgres or local.
# ------------------------------------------------------------------------------
if env.str("DATABASE_URL", default=""):
    DATABASES["default"] = env.db("DATABASE_URL")  # noqa: F405
    if DATABASES["default"].get("ENGINE") == "django.db.backends.postgresql_psycopg2":
        DATABASES["default"]["ENGINE"] = "django.db.backends.postgresql"
else:
    # PostgreSQL: use .env if set, else Docker defaults.
    # Port 5433 when connecting from host (docker-compose exposes 5433:5432) to avoid conflict with local PostgreSQL on 5432.
    _pg_port = env.str("POSTGRES_PORT", default="5433")
    DATABASES["default"] = {  # noqa: F405
        "ENGINE": "django.db.backends.postgresql",
        "NAME": env.str("POSTGRES_DB", default="Beauty-cobs"),
        "USER": env.str("POSTGRES_USER", default="postgres"),
        "PASSWORD": env.str("POSTGRES_PASSWORD", default="admin123"),
        "HOST": env.str("POSTGRES_HOST", default="127.0.0.1"),
        "PORT": str(_pg_port) if _pg_port else "5433",
    }

# SECURITY WARNING: don't run with debug turned on in production!
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "",
    }
}

# https://django-debug-toolbar.readthedocs.io/en/latest/installation.html
# Keep local dev working even if the optional dependency isn't installed.
if importlib.util.find_spec("debug_toolbar") is not None:
    INSTALLED_APPS += ["debug_toolbar"]  # noqa: F405
    MIDDLEWARE += ["debug_toolbar.middleware.DebugToolbarMiddleware"]  # noqa: F405
    DEBUG_TOOLBAR_CONFIG = {
        "DISABLE_PANELS": ["debug_toolbar.panels.redirects.RedirectsPanel"],
        "SHOW_TEMPLATE_CONTEXT": True,
    }
# https://django-debug-toolbar.readthedocs.io/en/latest/installation.html#internal-ips
INTERNAL_IPS = env.list("INTERNAL_IPS", default=["localhost", "127.0.0.1"])

if env("USE_DOCKER", default="no") == "yes":
    import socket

    hostname, _, ips = socket.gethostbyname_ex(socket.gethostname())
    INTERNAL_IPS += [".".join(ip.split(".")[:-1] + ["1"]) for ip in ips]

# ------------------------------------------------------------------------------
# Local development overrides
# ------------------------------------------------------------------------------
# Use non-secure cookies locally (http://localhost) and return JWTs in the response
# body for SPA usage. Production should keep secure cookie settings.
SESSION_COOKIE_SECURE = False  # noqa: F405
CSRF_COOKIE_SECURE = False  # noqa: F405

REST_AUTH = {  # noqa: F405
    **REST_AUTH,  # noqa: F405
    "JWT_AUTH_SECURE": False,
    # Disable jwt cookies in local dev so refresh is returned in JSON
    "JWT_AUTH_COOKIE": None,
    "JWT_AUTH_REFRESH_COOKIE": None,
    # Lax is more forgiving for local development
    "JWT_AUTH_SAMESITE": "Lax",
}
