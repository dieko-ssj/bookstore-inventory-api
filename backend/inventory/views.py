"""
Vistas (Views) de la API de inventario.

────────────────────────────────────────────────────────────
  ModelViewSet nos da automáticamente los 5 métodos del CRUD:
    - list()    → GET    /api/books/         (listar todos)
    - create()  → POST   /api/books/         (crear uno)
    - retrieve()→ GET    /api/books/{id}/     (obtener uno)
    - update()  → PUT    /api/books/{id}/     (actualizar uno)
    - destroy() → DELETE /api/books/{id}/     (eliminar uno)

  Además, agregamos una "acción personalizada" con @action:
    - calculate_price() → POST /api/books/{id}/calculate-price/

  Esto evita escribir 5 clases/funciones separadas. Es uno de
  los patrones más poderosos de DRF.
────────────────────────────────────────────────────────────
"""

import logging

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Book
from .serializers import BookSerializer
from .services import ExchangeRateService, ExchangeRateServiceError

logger = logging.getLogger(__name__)


class BookViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar el inventario de libros.

    Endpoints generados automáticamente:
      GET    /api/books/              → Lista todos los libros (paginado)
      POST   /api/books/              → Crea un nuevo libro
      GET    /api/books/{id}/         → Obtiene un libro específico
      PUT    /api/books/{id}/         → Actualiza un libro completo
      PATCH  /api/books/{id}/         → Actualiza campos parciales
      DELETE /api/books/{id}/         → Elimina un libro

    Endpoint personalizado:
      POST   /api/books/{id}/calculate-price/  → Calcula precio en VES
    """

    queryset = Book.objects.all()
    serializer_class = BookSerializer

    @action(detail=False, methods=["get"], url_path="search")
    def search_by_category(self, request):
        category = request.query_params.get("category", "")
        books = self.get_queryset().filter(category__icontains=category)
        
        page = self.paginate_queryset(books)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = self.get_serializer(books, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="low-stock")
    def low_stock(self, request):
        try:
            threshold = int(request.query_params.get("threshold", 10))
        except ValueError:
            threshold = 10
            
        books = self.get_queryset().filter(stock_quantity__lt=threshold)
        
        page = self.paginate_queryset(books)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = self.get_serializer(books, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="calculate-price")
    def calculate_price(self, request, pk=None):
        """
        Calcula el precio en moneda local (VES - Bolívares) para un libro específico.

        Cumple con el contrato exacto de la prueba técnica de Nextep:
        {
            "book_id": 1,
            "cost_usd": 15.99,
            "exchange_rate": 854.46,
            "cost_local": 13662.82,
            "margin_percentage": 40,
            "selling_price_local": 19127.95,
            "currency": "VES",
            "calculation_timestamp": "2026-09-24T00:15:00Z"
        }
        """
        book = self.get_object()

        # Moneda destino (por defecto VES)
        target_currency = (
            request.data.get("currency")
            or request.query_params.get("currency")
            or None
        )

        try:
            calculation = ExchangeRateService.calculate_local_price(
                cost_usd=book.cost_usd,
                target_currency=target_currency,
            )

            # Guardar el precio calculado en la base de datos
            book.selling_price_local = calculation["selling_price_local"]
            book.save(update_fields=["selling_price_local", "updated_at"])

            serializer = self.get_serializer(book)

            # Respuesta que cumple estrictamente la especificación exacta del documento:
            response_data = {
                "book_id": book.id,
                "cost_usd": calculation["cost_usd"],
                "exchange_rate": calculation["exchange_rate"],
                "cost_local": calculation["cost_local"],
                "margin_percentage": calculation["margin_percentage"],
                "selling_price_local": calculation["selling_price_local"],
                "currency": calculation["currency"],
                "calculation_timestamp": calculation["calculation_timestamp"],
            }
            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error al calcular precio para libro {book.id}: {e}")
            return Response(
                {
                    "error": "Error al obtener la tasa de cambio",
                    "detail": str(e),
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

    @action(detail=False, methods=["post"], url_path="calculate-all-prices")
    def calculate_all_prices(self, request):
        """
        Calcula el precio para TODOS los libros del inventario en lote.
        Optimiza haciendo una sola consulta a la tasa de cambio.
        """
        target_currency = (
            request.data.get("currency")
            or request.query_params.get("currency")
            or None
        )

        try:
            rate, provider_name, is_fallback = ExchangeRateService.get_exchange_rate(target_currency)

            from decimal import Decimal
            from django.conf import settings

            margin_decimal = Decimal(str(1 + settings.PROFIT_MARGIN))
            books = Book.objects.all()
            updated_count = 0

            for book in books:
                cost_local = (book.cost_usd * rate).quantize(Decimal("0.01"))
                book.selling_price_local = (cost_local * margin_decimal).quantize(
                    Decimal("0.01")
                )
                updated_count += 1

            # Actualización masiva eficiente en una sola transacción SQL
            Book.objects.bulk_update(books, ["selling_price_local"])

            return Response(
                {
                    "message": f"Precios actualizados para {updated_count} libros",
                    "exchange_rate": float(rate),
                    "currency": target_currency or settings.LOCAL_CURRENCY,
                    "rate_provider": provider_name,
                    "is_fallback": is_fallback,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            logger.error(f"Error en actualización masiva: {e}")
            return Response(
                {
                    "error": "Error al calcular precios masivos",
                    "detail": str(e),
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
