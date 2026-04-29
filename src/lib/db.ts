import { PrismaClient } from '@/generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import path from 'path'

function createPrismaClient() {
  const dbPath = path.join(process.cwd(), 'dev.db')
  const adapter = new PrismaLibSql({ url: `file://${dbPath}` })
  return new PrismaClient({ adapter })
}

// 개발 환경에서 핫 리로드 시 연결 중복 방지
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
export const prisma = globalForPrisma.prisma ?? createPrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
