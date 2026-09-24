"""
Django settings for the Nextep Bookstore Inventory API.

────────────────────────────────────────────────────────────
PARA LA ENTREVISTA: Este archivo es el "cerebro" de configuración de Django.
Aquí se registran las apps instaladas, middleware, base de datos, etc.
Puntos clave a defender:
  - Usamos SQLite para simplificar (no necesita instalar PostgreSQL).
  - django-cors-headers permite que el frontend React se comunique
    con el backend sin errores de "CORS blocked".
  - REST_FRAMEWORK configura DRF para usar paginación automática.
────────────────────────────────────────────────────────────
"""

import os
from decimal import Decimal
from pathlib import Path

# ─── Rutas base ─────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent

# ─── Seguridad ──────────────────────────────────────────
# En producción esta clave NUNCA debe estar hardcodeada.
# Se usa os.environ.get para leerla de variables de entorno (Docker).
SECRET_KEY = os.environ.get(
    "DJANGO_SECRET_KEY",
    "django-insecure-nextep-dev-key-change-in-production",
)

DEBUG = os.environ.get("DJANGO_DEBUG", "True").lower() in ("true", "1", "yes")

ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS", "*").split(",")

# ─── Apps instaladas ───────────────────────────────────
# Orden: apps de Django → apps de terceros → nuestras apps
INSTALLED_APPS = [
    # Django core
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Terceros
    "rest_framework",       # Django REST Framework
    "corsheaders",          # Permite peticiones cross-origin (React → Django)
    # Nuestra app
    "inventory",
]

# ─── Middleware ─────────────────────────────────────────
# CorsMiddleware DEBE ir lo más arriba posible para que intercepte
# las peticiones OPTIONS (preflight) antes que cualquier otro middleware.
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",  # ← Primero!
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# ─── Base de datos ──────────────────────────────────────
# SQLite para desarrollo. En producción usaríamos PostgreSQL.
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# ─── Internacionalización ──────────────────────────────
LANGUAGE_CODE = "es"
TIME_ZONE = "America/Caracas"
USE_I18N = True
USE_TZ = True

# ─── Archivos estáticos ────────────────────────────────
STATIC_URL = "static/"

# ─── Tipo de campo auto por defecto ────────────────────
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ─── Django REST Framework ─────────────────────────────
REST_FRAMEWORK = {
    # Paginación por defecto para todos los ListViews
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 10,
    # Serializa DecimalField como números float en JSON en lugar de strings (ej: 15.99 en vez de "15.99")
    "COERCE_DECIMAL_TO_STRING": False,
    # Parsers y Renderers por defecto
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",  # UI bonita en el navegador
    ],
}

# ─── CORS ───────────────────────────────────────────────
# En desarrollo permitimos todo. En producción se limitaría
# a los dominios específicos del frontend.
CORS_ALLOW_ALL_ORIGINS = DEBUG
CORS_ALLOWED_ORIGINS = os.environ.get(
    "CORS_ALLOWED_ORIGINS", "http://localhost:5173"
).split(",")

# ─── Configuración de la API de tasas de cambio ────────
EXCHANGE_RATE_API_URL = os.environ.get(
    "EXCHANGE_RATE_API_URL", "https://api.exchangerate-api.com/v4/latest/USD"
)
EXCHANGE_RATE_API_KEY = os.environ.get("EXCHANGE_RATE_API_KEY", "free")
# Moneda local de destino (por defecto VES según requerimiento)
LOCAL_CURRENCY = os.environ.get("LOCAL_CURRENCY", "VES")
# Tasa de cambio por defecto en caso de falla de la API externa (Regla de negocio - Contingencia)
DEFAULT_EXCHANGE_RATE = Decimal(str(os.environ.get("DEFAULT_EXCHANGE_RATE", "854.46")))
# Margen de ganancia (40%)
PROFIT_MARGIN = float(os.environ.get("PROFIT_MARGIN", "0.40"))
