"""
URLs de la app de inventario.

────────────────────────────────────────────────────────────
  El Router de DRF genera automáticamente todas las URLs del
  ViewSet. Una sola línea `router.register("books", BookViewSet)`
  genera:
    GET/POST        /api/books/
    GET/PUT/DELETE  /api/books/{id}/
    POST            /api/books/{id}/calculate-price/
    POST            /api/books/calculate-all-prices/

  Es mucho más limpio que definir cada ruta manualmente con path().
────────────────────────────────────────────────────────────
"""

from rest_framework.routers import DefaultRouter

from .views import BookViewSet


class OptionalSlashRouter(DefaultRouter):
    """Router que acepta rutas con o sin barra inclinada al final (/books y /books/)."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.trailing_slash = r"/?"


router = OptionalSlashRouter()
router.register("books", BookViewSet, basename="book")

urlpatterns = router.urls
