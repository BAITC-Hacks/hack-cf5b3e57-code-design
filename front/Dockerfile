FROM node:22-alpine

WORKDIR /workspace/front

COPY front/package*.json ./
RUN npm ci

COPY front/ ./
COPY shared/ ../shared/

ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npm run build -- --webpack

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "run", "start", "--", "-H", "0.0.0.0"]
