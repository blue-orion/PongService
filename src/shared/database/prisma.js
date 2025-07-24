import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: [],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

export default prisma;
