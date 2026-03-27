const { PrismaClient } = require('@prisma/client');

// Prisma 5: dùng cấu hình mặc định, URL lấy từ .env / prisma.config.ts
const prisma = new PrismaClient();

module.exports = {
  prisma,
};

