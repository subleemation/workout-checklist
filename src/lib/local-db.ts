import { openDB, IDBPDatabase } from 'idb'

export interface ExerciseSet {
  id?: number
  setNumber: number
  weight: number
  reps: number
}

export interface Exercise {
  id?: number
  name: string
  order: number
  sets: ExerciseSet[]
}

export interface WorkoutSession {
  id?: number
  date: string
  phase: 'primary' | 'secondary'
  day: number
  notes: string | null
  exercises: Exercise[]
}

export interface ConditionLog {
  id?: number
  date: string
  weight: number
  skeletalMass: number
  bodyFat: number
}

const DB_NAME = 'coach-app'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase> | null = null

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('workoutSessions')) {
          const ws = db.createObjectStore('workoutSessions', { keyPath: 'id', autoIncrement: true })
          ws.createIndex('date', 'date')
        }
        if (!db.objectStoreNames.contains('conditionLogs')) {
          const cl = db.createObjectStore('conditionLogs', { keyPath: 'id', autoIncrement: true })
          cl.createIndex('date', 'date')
        }
        if (!db.objectStoreNames.contains('routines')) {
          db.createObjectStore('routines', { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

function todayStr() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ── Workout Sessions ──────────────────────────────────────────────────────────

export async function saveWorkoutSession(session: Omit<WorkoutSession, 'id'>): Promise<void> {
  const db = await getDB()
  await db.add('workoutSessions', { ...session, date: todayStr() })
}

export async function getRecentSessions(limit = 10): Promise<WorkoutSession[]> {
  const db = await getDB()
  const all = (await db.getAllFromIndex('workoutSessions', 'date')) as WorkoutSession[]
  return all.reverse().slice(0, limit)
}

export async function getTodaySession(): Promise<WorkoutSession | null> {
  const db = await getDB()
  const today = todayStr()
  const all = (await db.getAllFromIndex('workoutSessions', 'date', today)) as WorkoutSession[]
  return all[0] ?? null
}

export async function getLastSession(): Promise<WorkoutSession | null> {
  const today = todayStr()
  const all = await getRecentSessions(20)
  return all.find((s) => s.date < today) ?? null
}

export async function getSessionsInRange(start: Date, end: Date): Promise<WorkoutSession[]> {
  const db = await getDB()
  const range = IDBKeyRange.bound(toDateStr(start), toDateStr(end))
  const all = (await db.getAllFromIndex('workoutSessions', 'date', range)) as WorkoutSession[]
  return all.sort((a, b) => a.date.localeCompare(b.date))
}


// ── Condition Logs ────────────────────────────────────────────────────────────

export async function saveConditionLog(data: Omit<ConditionLog, 'id' | 'date'>): Promise<void> {
  const db = await getDB()
  const today = todayStr()
  const existing = await getTodayCondition()
  if (existing?.id) {
    await db.put('conditionLogs', { id: existing.id, ...data, date: today })
  } else {
    await db.add('conditionLogs', { ...data, date: today })
  }
}

export async function getTodayCondition(): Promise<ConditionLog | null> {
  const db = await getDB()
  const all = (await db.getAllFromIndex('conditionLogs', 'date', todayStr())) as ConditionLog[]
  return all[0] ?? null
}

export async function getConditionLogsInRange(start: Date, end: Date): Promise<ConditionLog[]> {
  const db = await getDB()
  const range = IDBKeyRange.bound(toDateStr(start), toDateStr(end))
  const all = (await db.getAllFromIndex('conditionLogs', 'date', range)) as ConditionLog[]
  return all.sort((a, b) => a.date.localeCompare(b.date))
}

// ── Routines ──────────────────────────────────────────────────────────────

export interface RoutineExercise {
  name: string
  sets: number
}

export interface DayRoutine {
  day: number
  bodyPart: string
  exercises: RoutineExercise[]
}

export interface RoutineData {
  primary: DayRoutine[]
  secondary: DayRoutine[]
}

export async function saveRoutineData(routine: RoutineData): Promise<void> {
  const db = await getDB()
  await db.put('routines', { id: 'current', data: routine })
}

export async function getRoutineData(): Promise<RoutineData | null> {
  const db = await getDB()
  try {
    const routine = await db.get('routines', 'current')
    return routine?.data ?? null
  } catch {
    return null
  }
}
