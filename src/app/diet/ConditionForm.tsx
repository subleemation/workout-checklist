'use client'

import { useState } from 'react'
import { saveConditionLog, ConditionLog } from '@/lib/local-db'

interface Props {
  existing: ConditionLog | null
  onSaved: () => void
}

function ScoreSelector({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-xs text-blue-400 font-bold">{value}/10</span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={`flex-1 h-7 rounded text-xs font-medium transition ${
              value >= v ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-600 hover:bg-gray-700'
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  )
}

export function ConditionForm({ existing, onSaved }: Props) {
  const [weight, setWeight] = useState(existing?.weight?.toString() ?? '')
  const [sleep, setSleep] = useState(existing?.sleepHours?.toString() ?? '')
  const [fatigue, setFatigue] = useState(existing?.fatigue ?? 5)
  const [condition, setCondition] = useState(existing?.condition ?? 5)
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await saveConditionLog({
      weight: weight ? parseFloat(weight) : null,
      sleepHours: sleep ? parseFloat(sleep) : null,
      fatigue,
      condition,
      notes: notes || null,
    })
    setSaved(true)
    setSaving(false)
    onSaved()
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">체중 (kg)</label>
          <input
            type="number"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="78.0"
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">수면 시간</label>
          <input
            type="number"
            step="0.5"
            value={sleep}
            onChange={(e) => setSleep(e.target.value)}
            placeholder="7.5"
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <ScoreSelector label="피로도" value={fatigue} onChange={setFatigue} />
      <ScoreSelector label="컨디션" value={condition} onChange={setCondition} />

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
        {saved ? '✅ 저장됨' : saving ? '저장 중...' : '상태 저장'}
      </button>
    </form>
  )
}
