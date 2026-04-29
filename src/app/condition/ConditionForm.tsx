'use client'

import { useState } from 'react'
import { saveConditionLog, ConditionLog } from '@/lib/local-db'

interface Props {
  existing: ConditionLog | null
  onSaved: () => void
}

export function ConditionForm({ existing, onSaved }: Props) {
  const [weight, setWeight] = useState(existing?.weight?.toString() ?? '')
  const [skeletalMass, setSkeletalMass] = useState(existing?.skeletalMass?.toString() ?? '')
  const [bodyFat, setBodyFat] = useState(existing?.bodyFat?.toString() ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!weight || !skeletalMass || !bodyFat) return

    setSaving(true)
    await saveConditionLog({
      weight: parseFloat(weight),
      skeletalMass: parseFloat(skeletalMass),
      bodyFat: parseFloat(bodyFat),
    })
    setSaved(true)
    setSaving(false)
    onSaved()
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-gray-900 rounded-xl p-4">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">체중 (kg)</label>
          <input
            type="number"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="78.0"
            required
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">골격근량 (kg)</label>
          <input
            type="number"
            step="0.1"
            value={skeletalMass}
            onChange={(e) => setSkeletalMass(e.target.value)}
            placeholder="35.0"
            required
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">체지방률 (%)</label>
          <input
            type="number"
            step="0.1"
            value={bodyFat}
            onChange={(e) => setBodyFat(e.target.value)}
            placeholder="15.0"
            required
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving || !weight || !skeletalMass || !bodyFat}
        className={`w-full py-3 rounded-xl font-semibold transition ${
          saved ? 'bg-green-700 text-green-200' : 'bg-blue-600 hover:bg-blue-500 text-white'
        } disabled:opacity-40`}
      >
        {saved ? '✅ 저장됨' : saving ? '저장 중...' : '저장'}
      </button>
    </form>
  )
}
