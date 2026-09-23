FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci --legacy-peer-deps

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
