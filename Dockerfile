# OmniGenesis AI — Multi-stage Docker Build
FROM node:20-alpine AS contract-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx hardhat compile

FROM python:3.12-slim AS agent-base
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends gcc && rm -rf /var/lib/apt/lists/*
COPY agents/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM agent-base AS agent-runner
COPY agents/ ./agents/
COPY --from=contract-builder /app/artifacts ./artifacts
CMD ["python", "-m", "agents.core.swarm", "--config", "agents/config.yaml"]

FROM python:3.12-slim AS backend-base
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM backend-base AS backend
COPY backend/ ./backend/
EXPOSE 8000
CMD ["uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "8000"]

FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM nginx:alpine AS frontend
COPY --from=frontend-builder /app/.next/static /usr/share/nginx/html/_next/static
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
