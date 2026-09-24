"""
Serializadores para la app de inventario.

────────────────────────────────────────────────────────────
  1. SERIALIZACIÓN: Convierte un objeto Book de la DB → JSON para la respuesta.
  2. DESERIALIZACIÓN: Convierte el JSON del request/valida/crea/actualiza el Book.
  Es similar al concepto de "DTO" (Data Transfer Object) en otros frameworks.

  Usamos ModelSerializer porque genera automáticamente los campos
  a partir del modelo, evitando duplicar código.
────────────────────────────────────────────────────────────
"""

from rest_framework import serializers

from .models import Book


class BookSerializer(serializers.ModelSerializer):
    """
    Serializador para el modelo Book.

    - Los campos 'price_local', 'created_at' y 'updated_at' son de solo lectura
      porque se calculan/generan automáticamente.
    - La validación de ISBN (formato regex) ya está en el modelo,
      pero aquí agregamos una validación adicional de longitud.
    """

    class Meta:
        model = Book
        fields = [
            "id",
            "title",
            "author",
            "isbn",
            "cost_usd",
            "selling_price_local",
            "stock_quantity",
            "category",
            "supplier_country",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "selling_price_local", "created_at", "updated_at"]

    def validate_isbn(self, value: str) -> str:
        """Validación adicional: solo dígitos/guiones, longitud 10 o 13 (sin contar guiones)."""
        clean_isbn = value.replace('-', '')
        if not clean_isbn.isdigit():
            raise serializers.ValidationError(
                "El ISBN debe contener solo dígitos numéricos (se permiten guiones)."
            )
        if len(clean_isbn) not in (10, 13):
            raise serializers.ValidationError(
                "El ISBN debe tener exactamente 10 o 13 dígitos."
            )
        return value

    def validate_cost_usd(self, value):
        """El costo debe ser positivo."""
        if value <= 0:
            raise serializers.ValidationError(
                "El costo en USD debe ser mayor a 0."
            )
        return value
