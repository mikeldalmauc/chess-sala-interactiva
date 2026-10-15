# Etapa 1: compilar la web con Vite
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
COPY scripts ./scripts
RUN npm ci
COPY . .
ARG BASE_PATH=/
ENV BASE_PATH=$BASE_PATH
RUN npm run build

# Etapa 2: servir los ficheros estáticos con nginx
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
