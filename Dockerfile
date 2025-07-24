FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install

COPY prisma ./prisma
COPY start.sh ./

COPY src ./src
COPY .env* ./

RUN npx prisma generate
RUN chmod +x start.sh

EXPOSE 3333
EXPOSE 5555

CMD ["./start.sh"]
