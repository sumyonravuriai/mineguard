FROM node:24-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci

# Copy source code and tsconfig
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript to JavaScript
RUN npm run build

# Create data directory for persistent SQLite volume
RUN mkdir -p /data

ENV NODE_ENV=production
ENV PORT=5000
ENV DB_PATH=/data/mineguard.db

EXPOSE 5000

CMD ["node", "dist/server.js"]
