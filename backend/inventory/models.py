"""
Modelos de datos para el inventario de la librería.

────────────────────────────────────────────────────────────
  1. Usamos DecimalField para 'cost_usd' y 'price_local' en vez de
     FloatField porque Decimal evita errores de redondeo con dinero
     (ej: 0.1 + 0.2 = 0.30000000000000004 con float).
  2. 'price_local' es nullable (null=True, blank=True) porque el
     precio en VES solo se calcula cuando el usuario invoca el
     endpoint /calculate-price. No se conoce al momento de crear el libro.
  3. 'isbn' tiene un RegexValidator para aceptar solo ISBN-10 o ISBN-13.
  4. Meta.ordering = ['-created_at'] hace que los libros más recientes
     aparezcan primero por defecto en cualquier consulta.
────────────────────────────────────────────────────────────
"""

from django.core.validators import MinValueValidator, RegexValidator
from django.db import models


class Book(models.Model):
    """Representa un libro en el inventario de la librería."""

    # ─── Validadores reutilizables ──────────────────────
    isbn_validator = RegexValidator(
        regex=r"^\d{10}(\d{3})?$",
        message="El ISBN debe contener exactamente 10 o 13 dígitos numéricos.",
    )

    # ─── Campos del modelo ──────────────────────────────
    title = models.CharField(
        "Título",
        max_length=255,
    )
    author = models.CharField(
        "Autor",
        max_length=255,
    )
    isbn = models.CharField(
        "ISBN",
        max_length=17, # Puede incluir guiones
        unique=True,
        help_text="Código ISBN.",
    )
    cost_usd = models.DecimalField(
        "Costo (USD)",
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0.01)],
    )
    selling_price_local = models.DecimalField(
        "Precio (Local)",
        max_digits=20,
        decimal_places=2,
        null=True,
        blank=True,
    )
    stock_quantity = models.IntegerField(
        "Stock",
        default=0,
        validators=[MinValueValidator(0)],
    )
    category = models.CharField(
        "Categoría",
        max_length=100,
        blank=True,
    )
    supplier_country = models.CharField(
        "País Proveedor",
        max_length=2,
        blank=True,
        help_text="Código ISO de 2 letras, ej: ES, US",
    )
    created_at = models.DateTimeField(
        "Fecha de creación",
        auto_now_add=True,
    )
    updated_at = models.DateTimeField(
        "Última actualización",
        auto_now=True,
    )

    class Meta:
        verbose_name = "Libro"
        verbose_name_plural = "Libros"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.title} — {self.author} (ISBN: {self.isbn})"
