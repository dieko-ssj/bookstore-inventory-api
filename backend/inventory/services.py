"""
Servicio para consultar tasas de cambio desde una API externa.

────────────────────────────────────────────────────────────
PARA LA ENTREVISTA — Principio de Responsabilidad Única (SRP):
  Este servicio está separado de las vistas porque:
  1. La vista (views.py) solo se encarga de recibir/responder HTTP.
  2. Este servicio se encarga de la LÓGICA DE NEGOCIO de divisas.
  3. Si mañana cambian la API externa, solo modificas ESTE archivo.
  Esto es parte de los principios SOLID que mencionan en la prueba.

  Usamos la API gratuita de exchangerate-api.com como ejemplo.
  En un entorno real, usarías una API con clave privada.
────────────────────────────────────────────────────────────
"""

import logging
from decimal import Decimal, ROUND_HALF_UP

import requests
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)


class ExchangeRateServiceError(Exception):
    """Excepción personalizada para errores del servicio de tasa de cambio."""
    pass


class ExchangeRateService:
    """
    Servicio con arquitectura de Tolerancia a Fallos en Cascada (Fallback Chain).
    Para Venezuela (VES - Bolívares):
      1. ExchangeRate-API (Principal, según documento de especificación)
      2. BCV Oficial - DolarApi Venezuela (Fallback secundario local)
      3. Dólar Paralelo - DolarApi Venezuela (Fallback terciario local)
      4. Open Exchange Rates (Fallback cuaternario global)
      5. Tasa de Contingencia Local Offline (Garantiza disponibilidad 100%)
    """

    @classmethod
    def get_exchange_rate(cls, target_currency: str = None) -> tuple[Decimal, str, bool]:
        """
        Obtiene la tasa de cambio usando la cadena de proveedores en cascada para VES.
        Retorna: (tasa: Decimal, nombre_proveedor: str, is_fallback: bool)
        """
        currency = (target_currency or settings.LOCAL_CURRENCY).upper()
        default_rate = getattr(settings, "DEFAULT_EXCHANGE_RATE", Decimal("854.46"))

        # Cadena de proveedores con fallback en cascada para Venezuela (VES)
        providers = [
            {
                "name": "ExchangeRate-API (Principal)",
                "type": "rates_dict",
                "url": getattr(
                    settings,
                    "EXCHANGE_RATE_API_URL",
                    "https://api.exchangerate-api.com/v4/latest/USD",
                ),
                "key": "VES",
            },
            {
                "name": "BCV Oficial (DolarAPI Venezuela)",
                "type": "dolarapi_promedio",
                "url": "https://ve.dolarapi.com/v1/dolares/oficial",
            },
            {
                "name": "Dólar Paralelo (DolarAPI Venezuela)",
                "type": "dolarapi_promedio",
                "url": "https://ve.dolarapi.com/v1/dolares/paralelo",
            },
            {
                "name": "Open Exchange Rates (Global)",
                "type": "rates_dict",
                "url": "https://open.er-api.com/v6/latest/USD",
                "key": "VES",
            },
        ]

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) BookstoreInventory/1.0"
        }

        # 1. Probar en orden cada una de las APIs en vivo
        for i, provider in enumerate(providers):
            provider_name = provider["name"]
            api_url = provider["url"]
            try:
                response = requests.get(api_url, headers=headers, timeout=4)
                if response.status_code == 200:
                    data = response.json()
                    rate = None

                    if provider.get("type") == "dolarapi_promedio":
                        promedio = data.get("promedio")
                        if promedio:
                            rate = Decimal(str(promedio))
                    else:
                        key = provider.get("key", currency)
                        rates = data.get("rates", {})
                        if key in rates:
                            rate = Decimal(str(rates[key]))

                    if rate and rate > 0:
                        is_fallback = (i > 0)
                        logger.info(
                            f"Tasa obtenida ({provider_name}): 1 USD = {rate} {currency}"
                        )
                        return rate, provider_name, is_fallback
            except Exception as e:
                logger.warning(f"Proveedor '{provider_name}' ({api_url}) falló: {e}")

        # 2. Si todas las APIs externas fallan, usar la tasa de contingencia local
        fallback_name = "Tasa de Contingencia Local (Offline)"
        logger.warning(
            f"Todas las APIs externas no respondieron. Usando {fallback_name}: 1 USD = {default_rate} {currency}"
        )
        return default_rate, fallback_name, True

    @classmethod
    def calculate_local_price(
        cls,
        cost_usd: Decimal,
        margin: float = None,
        target_currency: str = None,
    ) -> dict:
        """
        Calcula el precio en moneda local aplicando la cadena de tasas y el margen del 40%.
        """
        margin = margin if margin is not None else settings.PROFIT_MARGIN
        currency = (target_currency or settings.LOCAL_CURRENCY).upper()

        exchange_rate, provider_name, is_fallback = cls.get_exchange_rate(currency)

        # 1. Costo convertido a moneda local
        cost_local = (cost_usd * exchange_rate).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )

        # 2. Precio de venta sugerido con margen de ganancia
        margin_decimal = Decimal(str(1 + margin))
        selling_price_local = (cost_local * margin_decimal).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )

        return {
            "exchange_rate": float(exchange_rate),
            "cost_usd": float(cost_usd),
            "cost_local": float(cost_local),
            "margin_percentage": int(round(margin * 100)),
            "selling_price_local": float(selling_price_local),
            "currency": currency,
            "rate_provider": provider_name,
            "calculation_timestamp": timezone.now().isoformat(),
            "is_fallback": is_fallback,
        }
