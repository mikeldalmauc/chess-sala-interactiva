# Contenedor de desarrollo: Node 22, npm y git (imagen oficial de Dev Containers).
# No se instala nada en el PC: todo corre dentro de este contenedor.
FROM mcr.microsoft.com/devcontainers/javascript-node:22

WORKDIR /app

# El volumen de node_modules se crea con el propietario de esta carpeta (usuario node).
RUN mkdir -p /app/node_modules && chown -R node:node /app

ENV CHOKIDAR_USEPOLLING=1
EXPOSE 5173

USER node
