FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund --fetch-timeout=60000 --fetch-retries=2

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG PRODUCTS_API_URL=http://products-service:4001
ARG NEXT_PUBLIC_PRODUCTS_API_URL=http://localhost:4001
ARG NEXT_PUBLIC_UPLOAD_API_URL=http://localhost:4002
ENV PRODUCTS_API_URL=$PRODUCTS_API_URL
ENV NEXT_PUBLIC_PRODUCTS_API_URL=$NEXT_PUBLIC_PRODUCTS_API_URL
ENV NEXT_PUBLIC_UPLOAD_API_URL=$NEXT_PUBLIC_UPLOAD_API_URL
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.js ./next.config.js

EXPOSE 3000
CMD ["npm", "start"]
