# Stage 1: Build the Vite production bundle
FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_API_BASE_URL=http://localhost:5000/api/v1
ARG VITE_INACTIVITY_TIMEOUT_MINUTES=30
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_INACTIVITY_TIMEOUT_MINUTES=$VITE_INACTIVITY_TIMEOUT_MINUTES

# Copy package descriptors
COPY package*.json ./

# Install dependencies deterministically
RUN npm ci

# Copy application source code
COPY . .

# Build production bundle
RUN npm run build

# Stage 2: Serve static production assets via Node 20
FROM node:20-alpine

WORKDIR /app

# Install lightweight static HTTP server
RUN npm install -g serve

# Copy built dist files from builder stage
COPY --from=builder /app/dist ./dist

# Expose frontend port
EXPOSE 3000

# Serve SPA
CMD ["serve", "-s", "dist", "-l", "3000"]
