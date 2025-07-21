FROM node:20-alpine

COPY prisma/schema.prisma /root/prisma/schema.prisma
COPY package.json /root/package.json
COPY src /root/src
COPY .env /root/.env

VOLUME ["/root/prisma/transcendence.db"]

WORKDIR /root

RUN npm install

ENTRYPOINT ["npm", "start"]
