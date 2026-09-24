# Usar una imagen oficial de Node ligera
FROM node:24-alpine

# Establecer el directorio de trabajo
WORKDIR /app

# Copiar los archivos de configuración primero (para optimizar caché de Docker)
COPY package.json package-lock.json ./

# Instalar dependencias
RUN npm ci

# Copiar el resto del código
COPY . .

# Exponer el puerto que usa Vite
EXPOSE 5173

# Arrancar Vite exponiendo al host (necesario en Docker)
CMD ["npm", "run", "dev", "--", "--host"]
