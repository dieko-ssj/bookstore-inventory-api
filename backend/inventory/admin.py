"""
Registro del modelo Book en el panel de administración de Django.

Esto permite gestionar libros desde /admin/ si necesitas
depurar datos directamente en la base de datos.
"""

from django.contrib import admin

from .models import Book


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ("title", "author", "isbn", "cost_usd", "selling_price_local", "stock_quantity", "category", "created_at")
    search_fields = ("title", "author", "isbn", "category")
    list_filter = ("created_at", "category", "supplier_country")
    readonly_fields = ("created_at", "updated_at")
