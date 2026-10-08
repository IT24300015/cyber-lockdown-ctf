FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm install
COPY backend/ .
COPY --from=frontend /app/frontend/dist ./frontend/dist
COPY static/ ./static/
EXPOSE 3000
CMD ["node", "server.js"]
