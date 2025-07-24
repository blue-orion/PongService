FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY tsconfig.json ./
COPY vite.config.js ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY ./src ./src
COPY ./.env.production ./.env
COPY ./public ./public
COPY ./index.html ./index.html

RUN npm install && npm run build

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/dist ./
CMD ["echo", "Frontend build completed"]

