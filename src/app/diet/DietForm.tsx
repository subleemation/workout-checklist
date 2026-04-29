'use client'

import { useState } from 'react'
import { saveDietLog, DietLog } from '@/lib/local-db'

interface Props {
  existing: DietLog | null
  onSaved: () => void
}

function CarbSelector({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-400 w-12">{label}</span>
      <div className="flex gap-1">
        {[0, 1, 2].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={`w-10 h-10 rounded-lg font-bold text-sm transition ${
              value === v ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  )
}

export function DietForm({ existing, onSaved }: Props) {
  const [breakfast, setBreakfast] = useState(existing?.breakfastCarbs ?? 1)
  const [lunch, setLunch] = useState(existing?.lunchCarbs ?? 1)
  const [dinner, setDinner] = useState(existing?.dinnerCarbs ?? 1)
  const [workoutTime, setWorkoutTime] = useState(existing?.workoutTime ?? '')
  const [beetTime, setBeetTime] = useState(existing?.beetTime ?? '')
  const [arginineTime, setArginineTime] = useState(existing?.arginineTime ?? '')
  const [caffeineTime, setCaffeineTime] = useState(existing?.caffeineTime ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await saveDietLog({
      breakfastCarbs: breakfast,
      lunchCarbs: lunch,
      dinnerCarbs: dinner,
      workoutTime: workoutTime || null,
      beetTime: beetTime || null,
      arginineTime: arginineTime || null,
      caffeineTime: caffeineTime || null,
      notes: notes || null,
    })
    setSaved(true)
    setSaving(false)
    onSaved()
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <CarbSelector label="아침" value={breakfast} onChange={setBreakfast} />
        <CarbSelector label="점심" value={lunch} onChange={setLunch} />
        <CarbSelector label="저녁" value={dinner} onChange={setDinner} />
        <div className="text-xs text-gray-600 mt-1">
          현재 패턴: <span className="text-yellow-400 font-mono font-bold">{breakfast}{lunch}{dinner}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        {[
          { label: '운동 시간', value: workoutTime, set: setWorkoutTime },
          { label: '비트 섭취', value: beetTime, set: setBeetTime },
          { label: '아르기닌', value: arginineTime, set: setArginineTime },
          { label: '카페인', value: caffeineTime, set: setCaffeineTime },
        ].map(({ label, value, set }) => (
          <div key={label}>
            <label className="block text-xs text-gray-500 mb-1">{label}</label>
            <input
              type="time"
              value={value}
              onChange={(e) => set(e.target.value)}
              className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        ))}
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="메모 (선택)"
        rows={2}
        className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none resize-none"
      />

      <button
        type="submit"
        disabled={saving}
        className={`w-full py-3 rounded-xl font-semibold transition ${
          saved ? 'bg-green-700 text-green-200' : 'bg-blue-600 hover:bg-blue-500 text-white'
        } disabled:opacity-40`}
      >
        {saved ? '✅ 저장됨' : saving ? '저장 중...' : '식단 저장'}
      </button>
    </form>
  )
}
