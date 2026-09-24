# Nextep Innovation - Prueba Técnica (Inventario de Librería)

Este proyecto es la solución a la prueba técnica para el rol de FullStack Developer. Implementa un sistema de gestión de inventario de libros con validación de precios en tiempo real mediante una API de tasas de cambio externa.

## Stack Tecnológico
- **Backend:** Django + Django REST Framework (Python)
- **Frontend:** React + TypeScript + Vite + Tailwind CSS + React Query
- **Base de datos:** SQLite (por simplicidad en desarrollo)
- **Orquestación:** Docker y Docker Compose

## Características Implementadas
1. **CRUD Completo:** Gestión de inventario de libros.
2. **Validaciones estrictas:** 
   - El costo en USD no puede ser negativo.
   - El stock no puede ser negativo.
   - Validación del formato ISBN (10 o 13 dígitos) y evitar duplicados.
3. **Integración Externa (`/calculate-price`):** 
   - Convierte el `cost_usd` a la moneda local (VES - Bolívares) usando una API de tasas de cambio.
   - Aplica automáticamente un 40% de margen de ganancia.
4. **Endpoints Opcionales:**
   - `/api/books/search?category=...`: Búsqueda por categoría.
   - `/api/books/low-stock?threshold=10`: Filtro de inventario bajo.
5. **Frontend Moderno (Dark Theme):**
   - Inspirado en el diseño limpio y moderno de `nextep.xyz`.
   - Manejo de estados asíncronos y caché con **React Query**.
   - Notificaciones (Toasts) y Spinners para UX fluida.

---

## 🚀 Requisitos Previos

Solo necesitas tener instalado **Docker** y **Docker Compose**.
Si prefieres correrlo localmente sin Docker, necesitarás **Python 3.12+** y **Node.js 24+**.

---

## 🐳 Ejecución con Docker (Recomendado)

Esta es la forma más fácil de levantar todo el proyecto con un solo comando.

1. Abre tu terminal en la raíz de este proyecto (donde está el archivo `docker-compose.yml`).
2. Ejecuta el siguiente comando para construir y levantar los contenedores:
   ```bash
   docker-compose up --build
   ```
3. ¡Listo! 
   - El frontend estará disponible en: **http://localhost:5173**
   - La API del backend en: **http://localhost:8000/api/**
   - El panel de Admin de Django en: **http://localhost:8000/admin/**

Para apagar los contenedores presiona `Ctrl + C` o ejecuta en otra terminal:
```bash
docker-compose down
```

---

## 💻 Ejecución Local (Sin Docker)

Si prefieres levantar los servicios manualmente:

### 1. Backend (Django)
```bash
cd backend
python -m venv venv
# Activar entorno virtual (Windows)
.\venv\Scripts\activate
# Instalar dependencias
pip install -r requirements.txt
# Correr migraciones y arrancar el servidor
python manage.py migrate
python manage.py runserver 8000
```

### 2. Frontend (React)
Abre una nueva terminal en la raíz del proyecto.
```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Pruebas con Postman

En la raíz del proyecto se incluye el archivo `Coleccion_Postman_Nextep.json`.
1. Abre [Postman](https://www.postman.com/downloads/).
2. Haz clic en el botón **"Import"** (arriba a la izquierda).
3. Arrastra y suelta el archivo JSON.
4. Usa los endpoints preconfigurados para interactuar con la API.

---

## 📖 Documentación y Ejemplos de Endpoints

La API responde tanto en `/api/books/` como en `/books/` (con o sin slash final).

### 1. Listar Libros
- **Método:** `GET /api/books/` (o con paginación `?page=1`)
- **Respuesta:**
  ```json
  {
    "count": 5,
    "next": null,
    "previous": null,
    "results": [
      {
        "id": 1,
        "title": "Don Quijote de la Mancha",
        "author": "Miguel de Cervantes",
        "isbn": "9788437604947",
        "cost_usd": 15.99,
        "selling_price_local": 19.63,
        "stock_quantity": 25,
        "category": "Literatura Clásica",
        "supplier_country": "ES",
        "created_at": "2026-09-23T23:58:41.289245-04:00",
        "updated_at": "2026-09-24T00:04:19.046939-04:00"
      }
    ]
  }
  ```

### 2. Crear Libro
- **Método:** `POST /api/books/`
- **Request Body:**
  ```json
  {
    "title": "El Quijote",
    "author": "Miguel de Cervantes",
    "isbn": "978-84-376-0494-7",
    "cost_usd": 15.99,
    "stock_quantity": 25,
    "category": "Literatura Clásica",
    "supplier_country": "ES"
  }
  ```
- **Respuesta (201 Created):** Objeto libro con `id`, timestamps y `selling_price_local: null`.

### 3. Calcular Precio Sugerido (Integración Externa con Fallback Cascada en Bolívares)
- **Método:** `POST /api/books/{id}/calculate-price/`
- **Lógica:**
  1. Toma `cost_usd` del libro.
  2. Consulta la tasa en vivo USD $\to$ VES mediante la cadena de tolerancia a fallos:
     - **Principal:** ExchangeRate-API
     - **Fallback 2:** BCV Oficial (DolarAPI Venezuela)
     - **Fallback 3:** Dólar Paralelo (DolarAPI Venezuela)
     - **Fallback 4:** Open Exchange Rates
     - **Fallback 5:** Tasa de contingencia local offline
  3. Aplica margen del 40%: `cost_local = cost_usd * tasa`, `selling_price_local = cost_local * 1.40`.
  4. Actualiza `selling_price_local` en la base de datos.
- **Respuesta Estricta (Exactamente los 8 campos requeridos):**
  ```json
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
  ```

### 4. Búsqueda por Categoría
- **Método:** `GET /api/books/search/?category=Literatura Clásica`

### 5. Filtro de Stock Bajo
- **Método:** `GET /api/books/low-stock/?threshold=10`

### 6. Respuestas de Error
- **400 Bad Request:** Costo negativo, stock negativo, ISBN inválido o duplicado.
- **404 Not Found:** ID de libro inexistente.
- **503 Service Unavailable:** Falla de servicio externo no recuperable.
