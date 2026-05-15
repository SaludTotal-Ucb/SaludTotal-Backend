FROM node:20-alpine AS builder
# 1. Instalamos OpenSSL para que Prisma lo detecte al generar el cliente
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
COPY prisma ./prisma
RUN npm run prisma:generate
RUN npm run build

FROM node:20-alpine
RUN apk add --no-cache openssl

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

EXPOSE 3000
CMD ["node", "dist/main.js"]