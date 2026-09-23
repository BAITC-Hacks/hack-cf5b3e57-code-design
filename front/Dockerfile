FROM node:22-alpine AS dependencies

WORKDIR /app/front

COPY front/package*.json ./
RUN npm ci

FROM node:22-alpine AS builder

WORKDIR /app

COPY --from=dependencies /app/front/node_modules ./front/node_modules
COPY shared ./shared
COPY front ./front

WORKDIR /app/front

ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app/front

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/front/package*.json ./
COPY --from=builder /app/front/node_modules ./node_modules
COPY --from=builder /app/front/.next ./.next
COPY --from=builder /app/front/public ./public
COPY --from=builder /app/shared ../shared

EXPOSE 3000

CMD ["npm", "run", "start"]

