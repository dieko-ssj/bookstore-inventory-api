"""
URL configuration for the Nextep Bookstore API.

────────────────────────────────────────────────────────────
PARA LA ENTREVISTA: Este archivo es el "mapa de rutas" principal.
Todas las URLs de la API empiezan con /api/ para separar
claramente el backend del frontend.
────────────────────────────────────────────────────────────
"""

from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    # Permite tanto /api/books/ como /books/ directamente según el requerimiento del PDF
    path("api/", include("inventory.urls")),
    path("", include("inventory.urls")),
]
