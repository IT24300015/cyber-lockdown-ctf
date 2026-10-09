# Stage 1: Build React Frontend
FROM node:20-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Stage 2: Build Backend (as non-root)
FROM node:20-alpine
WORKDIR /app

# Copy backend dependencies and install
COPY backend/package*.json ./
RUN npm install

# Copy backend code, frontend build, and static files
COPY backend/ .
COPY --from=frontend /app/frontend/dist ./frontend/dist
COPY static/ ./static/

# Fix ownership for the node user (uid=1000, gid=1000)
RUN chown -R node:node /app

# Switch to non-root user
USER node

EXPOSE 3000
CMD ["node", "server.js"]