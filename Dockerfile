# Paso 1: Imagen base para el entorno de Node.js (instalamos Angular CLI)
FROM node:18-alpine AS build

# Paso 2: Establecer directorio de trabajo en el contenedor
WORKDIR /app

# Paso 3: Copiar los archivos de tu proyecto al contenedor
COPY package*.json ./

# Paso 4: Instalar las dependencias del proyecto
RUN npm install

# Paso 5: Copiar el resto del código del proyecto
COPY . .

# Paso 6: Construir el proyecto Angular
RUN npm run build --prod

# Paso 7: Imagen base para el servidor nginx
FROM nginx:alpine

# Paso 8: Copiar los archivos de construcción del proyecto Angular al contenedor
COPY --from=build /app/dist/ /usr/share/nginx/html

# Paso 9: Exponer el puerto 80
EXPOSE 80

# Paso 10: Iniciar nginx cuando se ejecute el contenedor
CMD ["nginx", "-g", "daemon off;"]
