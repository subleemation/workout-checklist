'use client'

import { useState, useRef, useEffect } from 'react'
import { saveWorkoutSession, getRoutineData, saveRoutineData, type RoutineData } from '@/lib/local-db'
import { parseRoutineCSV } from '@/lib/routine-parser'

interface SetInput {
  weight: string
  reps: string
}

interface ExerciseInput {
  name: string
  sets: SetInput[]
}

interface Props {
  phase: 'primary' | 'secondary'
  onSaved: () => void
}

const COMMON_EXERCISES: Record<number, string[]> = {
  1: ['숄더 프레스 (바벨)', '벤치', '인클라인스미스', '중량펙덱', '자극사레레', '한팔정지사레레', '중량사레레'],
  2: ['백익스텐션', 'y레이즈', '덤벨풀오버', '랫풀다운', '클로즈그립랫풀', '원암하이로우', '롱풀'],
  3: ['이너싸이', '아웃싸이', '스쿼트', '스티프레그데드', '레그프레스', '레그컬', '레그익스텐션'],
  4: ['어깨안정화', '인클라인덤벨프레스', '케이블플라이', '케크오', '디클라인프레스', '수축정지펙덱', '자극사레레'],
  5: ['어깨안정화', '밤레레+다이스키', '자극사레레', '한팔정지사레레', '자극사레레', '자극사레레', '원암리어델트플라이'],
  6: ['백익스텐션', 'y레이즈', '덤벨풀오버', '롱풀', '원암시티드로우', '바암풀다운', '클로즈그립랫풀'],
  7: ['행레레', '케이블크런치', '러시안트위스트', '좌우행레레', '케이블크런치', '케이블크런치', '케이블크런치'],
}

function emptySet(): SetInput {
  return { weight: '', reps: '' }
}

export function WorkoutForm({ phase, onSaved }: Props) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [exercises, setExercises] = useState<ExerciseInput[]>([{ name: '', sets: [emptySet()] }])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [notes, setNotes] = useState('')
  const [routine, setRoutine] = useState<RoutineData | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getRoutineData().then((data) => {
      if (data) setRoutine(data)
    })
  }, [])

  async function handleCSVUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const parsed = parseRoutineCSV(text)
    setRoutine(parsed)
    await saveRoutineData(parsed)
  }

  function loadRoutineDay(day: number) {
    if (!routine) return
    const routines = phase === 'primary' ? routine.primary : routine.secondary
    const dayRoutine = routines.find((r) => r.day === day)
    if (!dayRoutine) return

    setSelectedDay(day)
    const newExercises = dayRoutine.exercises.map((ex) => ({
      name: ex.name,
      sets: Array.from({ length: ex.sets }, () => emptySet()),
    }))
    setExercises(newExercises)
  }

  function addExercise() {
    setExercises((prev) => [...prev, { name: '', sets: [emptySet()] }])
  }

  function removeExercise(ei: number) {
    setExercises((prev) => prev.filter((_, i) => i !== ei))
  }

  function addSet(ei: number) {
    setExercises((prev) =>
      prev.map((ex, i) => i === ei ? { ...ex, sets: [...ex.sets, emptySet()] } : ex)
    )
  }

  function removeSet(ei: number, si: number) {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === ei ? { ...ex, sets: ex.sets.filter((_, j) => j !== si) } : ex
      )
    )
  }

  function updateSet(ei: number, si: number, field: keyof SetInput, value: string) {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === ei
          ? { ...ex, sets: ex.sets.map((s, j) => j === si ? { ...s, [field]: value } : s) }
          : ex
      )
    )
  }

  function updateExerciseName(ei: number, name: string) {
    setExercises((prev) => prev.map((ex, i) => i === ei ? { ...ex, name } : ex))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDay) return

    setSaving(true)
    await saveWorkoutSession({
      date: '',
      phase,
      day: selectedDay,
      notes: notes || null,
      exercises: exercises
        .filter((ex) => ex.name.trim())
        .map((ex, order) => ({
          name: ex.name.trim(),
          order,
          sets: ex.sets
            .filter((s) => s.weight && s.reps)
            .map((s, idx) => ({
              setNumber: idx + 1,
              weight: parseFloat(s.weight),
              reps: parseInt(s.reps),
            })),
        })),
    })
    setSaved(true)
    setSaving(false)
    onSaved()
  }

  if (saved) {
    return (
      <div className="bg-green-900/30 border border-green-700 rounded-xl p-6 text-center">
        <p className="text-green-400 font-semibold text-lg">✅ 운동 저장 완료!</p>
        <button
          onClick={() => { setSaved(false); setExercises([{ name: '', sets: [emptySet()] }]) }}
          className="mt-3 text-sm text-gray-400 underline"
        >
          다시 입력
        </button>
      </div>
    )
  }

  const suggestedExercises = selectedDay ? (COMMON_EXERCISES[selectedDay] ?? []) : []

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {!routine && (
        <div className="bg-blue-900/30 border border-blue-700 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-blue-300">📋 루틴 CSV 업로드</h3>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500"
            />
          </div>
        </div>
      )}

      {routine && (
        <div className="bg-gray-800 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-300">🗓️ Day 선택</h3>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => {
              const routines = phase === 'primary' ? routine.primary : routine.secondary
              const exists = routines.some((r) => r.day === day)
              const isSelected = selectedDay === day
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => loadRoutineDay(day)}
                  disabled={!exists}
                  className={`py-2 rounded-lg text-xs font-medium transition ${
                    !exists
                      ? 'bg-gray-700 text-gray-600 cursor-not-allowed'
                      : isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Day {day}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {exercises.map((ex, ei) => (
          <div key={ei} className="bg-gray-900 rounded-xl p-4 space-y-3">
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={ex.name}
                onChange={(e) => updateExerciseName(ei, e.target.value)}
                placeholder="종목명"
                list={`ex-list-${ei}`}
                className="flex-1 bg-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <datalist id={`ex-list-${ei}`}>
                {suggestedExercises.map((s) => <option key={s} value={s} />)}
              </datalist>
              {exercises.length > 1 && (
                <button type="button" onClick={() => removeExercise(ei)} className="text-gray-600 hover:text-red-400 text-lg">✕</button>
              )}
            </div>

            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-1 text-xs text-gray-500 text-center">
                <span>무게(kg)</span><span>반복</span>
              </div>
              {ex.sets.map((set, si) => (
                <div key={si} className="flex gap-1 items-center">
                  <span className="text-xs text-gray-600 w-4">{si + 1}</span>
                  {(['weight', 'reps'] as const).map((field) => (
                    <input
                      key={field}
                      type="number"
                      value={set[field]}
                      onChange={(e) => updateSet(ei, si, field, e.target.value)}
                      placeholder="0"
                      className="flex-1 bg-gray-800 rounded px-2 py-1.5 text-sm text-center text-white focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-0"
                    />
                  ))}
                  {ex.sets.length > 1 && (
                    <button type="button" onClick={() => removeSet(ei, si)} className="text-gray-700 hover:text-red-400 text-xs ml-1">✕</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => addSet(ei)} className="text-xs text-blue-500 hover:text-blue-400">+ 세트 추가</button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addExercise}
          className="w-full border border-dashed border-gray-700 rounded-xl py-3 text-gray-500 hover:text-gray-300 hover:border-gray-500 text-sm transition"
        >
          + 종목 추가
        </button>
      </div>

      <div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="메모 (선택)"
          rows={2}
          className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={saving || !selectedDay}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition"
      >
        {saving ? '저장 중...' : '운동 저장'}
      </button>
    </form>
  )
}
