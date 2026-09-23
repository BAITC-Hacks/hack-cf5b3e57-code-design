FROM node:22-alpine

WORKDIR /workspace/back

RUN apk add --no-cache openssl

COPY back/package*.json ./
COPY back/prisma ./prisma

RUN npm ci --legacy-peer-deps

COPY back/ ./
COPY shared/ ../shared/

RUN npx prisma generate
RUN npm run build

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist/main.js"]
