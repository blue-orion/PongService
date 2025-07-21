# FROM node:20-alpine AS builder
FROM node:20-alpine

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

ENTRYPOINT ["npm", "run", "preview"]

# 배포시 nginx??
# FROM nginx:alpine
#
# # Nginx 설정 파일을 덮어쓸 수도 있음 (옵션)
# # COPY ./nginx.conf /etc/nginx/conf.d/default.conf
#
# # Vite 빌드 결과물 복사
# COPY --from=builder /app/dist /usr/share/nginx/html
#
# EXPOSE 443
# EXPOSE 8080
#
# CMD ["nginx", "-g", "daemon off;"]

