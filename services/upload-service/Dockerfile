FROM node:20-alpine AS base
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

ENV NODE_ENV=production
ENV PORT=4002
EXPOSE 4002

VOLUME ["/app/uploads"]

CMD ["node", "dist/index.js"]
