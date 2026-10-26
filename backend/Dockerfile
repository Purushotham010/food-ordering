FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package manifests
COPY package*.json ./

# Install production dependencies only
RUN npm install --omit=dev

# Copy server code
COPY . .

# Expose internal backend port
EXPOSE 5000

CMD ["node", "server.js"]
