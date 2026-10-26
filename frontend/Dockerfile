# Stage 1: Build React production bundle
FROM node:20-alpine AS build
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
RUN npm install --no-audit --no-fund

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Serve using high-performance lightweight Nginx
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Clear default content
RUN rm -rf ./*

# Copy built artifacts from Stage 1
COPY --from=build /app/dist .

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Public HTTP port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
