# Etapa 1: Build de la app
FROM node:20-alpine AS build

WORKDIR /app

# Copiamos package.json e instalamos dependencias
COPY package.json package-lock.json ./
RUN npm install

# Copiamos todo el código
COPY . .

# Pasamos la API KEY como variable de entorno para el build
ARG REACT_APP_OPENAI_API_KEY
ENV REACT_APP_OPENAI_API_KEY=${REACT_APP_OPENAI_API_KEY}


# Construimos la app de React
RUN npm run build

# Etapa 2: Servir la app con nginx
FROM nginx:stable-alpine

# Copiamos la build generada en la imagen de nginx
COPY --from=build /app/build /usr/share/nginx/html

# Copiamos un nginx.conf personalizado (opcional, si quieres configurar mejor nginx)
COPY nginx.conf /nginx.conf

# Exponemos el puerto 80
EXPOSE 80

# Iniciamos nginx
CMD ["nginx", "-g", "daemon off;"]
