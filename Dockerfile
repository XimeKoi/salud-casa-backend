# Dockerfile para Railway (Producción)

FROM node:18-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código
COPY . .

# Construir la aplicación (genera dist/)
RUN npm run build

# Exponer el puerto
EXPOSE 3000

# Iniciar en modo producción
CMD ["node", "dist/main.js"]