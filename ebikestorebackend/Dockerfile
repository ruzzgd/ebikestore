FROM node:20-alpine

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install dependencies deterministically
RUN npm ci --omit=dev

# Copy application source code
COPY . .

# Expose backend port
EXPOSE 5000

# Set default environment variable
ENV NODE_ENV=production
ENV PORT=5000

# Copy startup script and ensure it is executable
COPY docker-entrypoint.sh .
RUN chmod +x docker-entrypoint.sh

# Start the application using the entrypoint script
ENTRYPOINT ["./docker-entrypoint.sh"]
