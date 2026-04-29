import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import path from 'path'

const dbPath = path.join(process.cwd(), 'dev.db')
const adapter = new PrismaLibSql({ url: `file://${dbPath}` })
const prisma = new PrismaClient({ adapter })

async function main() {
  // 기존 데이터 초기화 (재실행 시 중복 방지)
  await prisma.set.deleteMany()
  await prisma.exercise.deleteMany()
  await prisma.workoutSession.deleteMany()
  await prisma.dietLog.deleteMany()
  await prisma.conditionLog.deleteMany()

  const today = new Date()
  const daysAgo = (n: number) => new Date(today.getTime() - n * 86400000)

  await prisma.conditionLog.createMany({
    data: [
      { date: daysAgo(6), weight: 78.5, sleepHours: 7, fatigue: 4, condition: 7 },
      { date: daysAgo(5), weight: 78.3, sleepHours: 6.5, fatigue: 5, condition: 6 },
      { date: daysAgo(4), weight: 78.4, sleepHours: 7.5, fatigue: 3, condition: 8 },
      { date: daysAgo(3), weight: 78.2, sleepHours: 6, fatigue: 6, condition: 6 },
      { date: daysAgo(2), weight: 78.1, sleepHours: 8, fatigue: 3, condition: 9 },
      { date: daysAgo(1), weight: 78.0, sleepHours: 7, fatigue: 4, condition: 7 },
      { date: today, weight: 77.9, sleepHours: 7.5, fatigue: 3, condition: 8 },
    ],
  })

  await prisma.dietLog.createMany({
    data: [
      { date: daysAgo(3), breakfastCarbs: 0, lunchCarbs: 2, dinnerCarbs: 1, workoutTime: '17:00', beetTime: '14:30', caffeineTime: '16:30' },
      { date: daysAgo(1), breakfastCarbs: 0, lunchCarbs: 2, dinnerCarbs: 1, workoutTime: '17:00', beetTime: '14:00', caffeineTime: '16:30' },
      { date: today, breakfastCarbs: 0, lunchCarbs: 2, dinnerCarbs: 1, workoutTime: '17:00', beetTime: '14:30', caffeineTime: '16:30' },
    ],
  })

  // 어깨 운동 (3일 전)
  await prisma.workoutSession.create({
    data: {
      date: daysAgo(3),
      bodyPart: 'shoulder',
      notes: '상태 좋았음',
      exercises: {
        create: [
          {
            name: '숄더 프레스 (바벨)',
            order: 1,
            sets: {
              create: [
                { setNumber: 1, weight: 60, reps: 10, rir: 2, stimulation: 8, pump: 7 },
                { setNumber: 2, weight: 60, reps: 10, rir: 2, stimulation: 8, pump: 7 },
                { setNumber: 3, weight: 60, reps: 9, rir: 3, stimulation: 7, pump: 6 },
              ],
            },
          },
          {
            name: '사이드 레터럴 레이즈',
            order: 2,
            sets: {
              create: [
                { setNumber: 1, weight: 12, reps: 15, rir: 1, stimulation: 9, pump: 8 },
                { setNumber: 2, weight: 12, reps: 14, rir: 2, stimulation: 8, pump: 7 },
                { setNumber: 3, weight: 12, reps: 13, rir: 2, stimulation: 8, pump: 7 },
              ],
            },
          },
          {
            name: '리어 델트 플라이',
            order: 3,
            sets: {
              create: [
                { setNumber: 1, weight: 10, reps: 15, rir: 1, stimulation: 8, pump: 7 },
                { setNumber: 2, weight: 10, reps: 15, rir: 1, stimulation: 8, pump: 8 },
              ],
            },
          },
        ],
      },
    },
  })

  // 가슴 운동 (어제)
  await prisma.workoutSession.create({
    data: {
      date: daysAgo(1),
      bodyPart: 'chest',
      exercises: {
        create: [
          {
            name: '벤치프레스',
            order: 1,
            sets: {
              create: [
                { setNumber: 1, weight: 80, reps: 10, rir: 2, stimulation: 8, pump: 7 },
                { setNumber: 2, weight: 80, reps: 10, rir: 2, stimulation: 8, pump: 8 },
                { setNumber: 3, weight: 80, reps: 10, rir: 2, stimulation: 7, pump: 7 },
              ],
            },
          },
          {
            name: '인클라인 덤벨 프레스',
            order: 2,
            sets: {
              create: [
                { setNumber: 1, weight: 28, reps: 12, rir: 1, stimulation: 9, pump: 8 },
                { setNumber: 2, weight: 28, reps: 11, rir: 2, stimulation: 8, pump: 7 },
              ],
            },
          },
        ],
      },
    },
  })

  console.log('✅ Seed 완료')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
