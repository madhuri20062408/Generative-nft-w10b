# Multi-stage Dockerfile

# Base for both
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install

# Contracts stage (Hardhat)
FROM base AS contracts
COPY . .
EXPOSE 8545
CMD ["npx", "hardhat", "node"]

# Frontend stage
FROM base AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend ./
EXPOSE 3000
CMD ["npm", "run", "dev"]
