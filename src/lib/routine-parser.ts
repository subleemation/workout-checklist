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

export function parseRoutineCSV(csvText: string): RoutineData {
  const lines = csvText.split('\n').map((line) => line.split(',').map((s) => s.trim()))

  const primary: DayRoutine[] = []
  const secondary: DayRoutine[] = []

  // Parse primary routine (rows 0-13, cols 1-7)
  const headerLine = lines[0]
  const days = [1, 2, 3, 4, 5, 6, 7]
  const dayNames: Record<number, string> = {}

  for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
    const dayHeader = headerLine[dayIdx + 1] || ''
    const match = dayHeader.match(/day\s*(\d+)\s*\(([^)]+)\)/)
    if (match) {
      const day = parseInt(match[1])
      const bodyPart = match[2]
      dayNames[day] = bodyPart
    }
  }

  // Collect exercises for each day
  for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
    const day = dayIdx + 1
    const bodyPart = dayNames[day] || `Day ${day}`
    const exercises: RoutineExercise[] = []

    for (let row = 1; row < 14; row++) {
      const cell = (lines[row] && lines[row][dayIdx + 1]) || ''
      if (cell && cell !== '-') {
        const parsed = parseExerciseCell(cell)
        if (parsed) {
          exercises.push(parsed)
        }
      }
    }

    if (exercises.length > 0) {
      primary.push({ day, bodyPart, exercises })
    }
  }

  // Parse secondary routine (rows 19-26, cols 1-7)
  for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
    const day = dayIdx + 1
    const bodyPart = dayNames[day] || `Day ${day}`
    const exercises: RoutineExercise[] = []

    for (let row = 19; row < 27; row++) {
      if (row >= lines.length) break
      const cell = (lines[row] && lines[row][dayIdx + 1]) || ''
      if (cell && cell !== '-') {
        const parsed = parseExerciseCell(cell)
        if (parsed) {
          exercises.push(parsed)
        }
      }
    }

    if (exercises.length > 0) {
      secondary.push({ day, bodyPart, exercises })
    }
  }

  return { primary, secondary }
}

function parseExerciseCell(cell: string): RoutineExercise | null {
  const match = cell.match(/^(.+?)\((\d+)\)$/)
  if (match) {
    return {
      name: match[1].trim(),
      sets: parseInt(match[2]),
    }
  }
  return null
}
