'use client'

import { useState, useRef, useEffect } from 'react'
import { saveWorkoutSession, getRoutineData, saveRoutineData, type RoutineData } from '@/lib/local-db'
import { parseRoutineCSV } from '@/lib/routine-parser'

interface SetInput {
  weight: string
  reps: string
  rir: string
  stimulation: string
  pump: string
}

interface ExerciseInput {
  name: string
  sets: SetInput[]
}

interface Props {
  exerciseHistory: Record<string, { weight: number; reps: number; pump: number | null }[]>
  recommendations: Record<string, number>
  onSaved: () => void
}

const BODY_PARTS = ['shoulder', 'chest', 'back', 'legs', 'arms', 'core']
const COMMON_EXERCISES: Record<string, string[]> = {
  shoulder: ['숄더 프레스 (바벨)', '숄더 프레스 (덤벨)', '사이드 레터럴 레이즈', '리어 델트 플라이', '페이스 풀'],
  chest: ['벤치프레스', '인클라인 덤벨 프레스', '케이블 플라이', '딥스'],
  back: ['데드리프트', '바벨 로우', '랫 풀다운', '시티드 케이블 로우', '풀업'],
  legs: ['스쿼트', '레그 프레스', '레그 컬', '레그 익스텐션', '루마니안 데드리프트'],
  arms: ['바벨 컬', '해머 컬', '트라이셉스 푸시다운', '스컬 크러셔'],
  core: ['플랭크', '크런치', '레그 레이즈'],
}

function emptySet(): SetInput {
  return { weight: '', reps: '', rir: '', stimulation: '', pump: '' }
}

export function WorkoutForm({ exerciseHistory, recommendations, onSaved }: Props) {
  const [bodyPart, setBodyPart] = useState('')
  const [exercises, setExercises] = useState<ExerciseInput[]>([{ name: '', sets: [emptySet()] }])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [notes, setNotes] = useState('')
  const [routine, setRoutine] = useState<RoutineData | null>(null)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [selectedPhase, setSelectedPhase] = useState<'primary' | 'secondary'>('primary')
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  async function handleCSVUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const parsed = parseRoutineCSV(text)
    setRoutine(parsed)
    await saveRoutineData(parsed)
  }

  function loadRoutineDay(day: number, phase: 'primary' | 'secondary') {
    if (!routine) return
    const routines = phase === 'primary' ? routine.primary : routine.secondary
    const dayRoutine = routines.find((r) => r.day === day)
    if (!dayRoutine) return

    setBodyPart(dayRoutine.bodyPart)
    setSelectedDay(day)
    setSelectedPhase(phase)

    const newExercises = dayRoutine.exercises.map((ex) => ({
      name: ex.name,
      sets: Array.from({ length: ex.sets }, () => emptySet()),
    }))
    setExercises(newExercises)
  }

  useEffect(() => {
    getRoutineData().then((data) => {
      if (data) setRoutine(data)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await saveWorkoutSession({
      date: '',
      bodyPart,
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
              rir: s.rir ? parseInt(s.rir) : null,
              stimulation: s.stimulation ? parseInt(s.stimulation) : null,
              pump: s.pump ? parseInt(s.pump) : null,
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

  const suggestedExercises = bodyPart ? (COMMON_EXERCISES[bodyPart] ?? []) : []

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* 루틴 관리 */}
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
          <h3 className="text-sm font-semibold text-gray-300">🗓️ 루틴 선택</h3>
          <div className="space-y-2">
            {['primary', 'secondary'].map((phase) => (
              <div key={phase}>
                <div className="text-xs text-gray-500 mb-2">{phase === 'primary' ? '1차' : '2차'}</div>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                    const routines = phase === 'primary' ? routine.primary : routine.secondary
                    const exists = routines.some((r) => r.day === day)
                    const isSelected = selectedDay === day && selectedPhase === phase
                    return (
                      <button
                        key={`${phase}-${day}`}
                        type="button"
                        onClick={() => loadRoutineDay(day, phase as 'primary' | 'secondary')}
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
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm text-gray-400 mb-2">운동 부위</label>
        <div className="flex flex-wrap gap-2">
          {BODY_PARTS.map((bp) => (
            <button
              key={bp}
              type="button"
              onClick={() => setBodyPart(bp)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                bodyPart === bp
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {bp}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {exercises.map((ex, ei) => {
          const rec = recommendations[ex.name]
          const history = exerciseHistory[ex.name]
          return (
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
                  {Object.keys(exerciseHistory).map((s) => <option key={s} value={s} />)}
                </datalist>
                {exercises.length > 1 && (
                  <button type="button" onClick={() => removeExercise(ei)} className="text-gray-600 hover:text-red-400 text-lg">✕</button>
                )}
              </div>

              {ex.name && history && (
                <div className="text-xs text-gray-500 flex gap-3 flex-wrap">
                  <span>지난: {history.slice(0, 3).map((s) => `${s.weight}×${s.reps}`).join(', ')}</span>
                  {rec && <span className="text-blue-400 font-semibold">추천 {rec}kg</span>}
                </div>
              )}

              <div className="space-y-2">
                <div className="grid grid-cols-5 gap-1 text-xs text-gray-500 text-center">
                  <span>무게(kg)</span><span>반복</span><span>RIR</span><span>자극</span><span>펌핑</span>
                </div>
                {ex.sets.map((set, si) => (
                  <div key={si} className="flex gap-1 items-center">
                    <span className="text-xs text-gray-600 w-4">{si + 1}</span>
                    {(['weight', 'reps', 'rir', 'stimulation', 'pump'] as const).map((field) => (
                      <input
                        key={field}
                        type="number"
                        value={set[field]}
                        onChange={(e) => updateSet(ei, si, field, e.target.value)}
                        placeholder={field === 'weight' ? rec?.toString() ?? '0' : '0'}
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
          )
        })}

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
        disabled={saving || !bodyPart}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition"
      >
        {saving ? '저장 중...' : '운동 저장'}
      </button>
    </form>
  )
}
