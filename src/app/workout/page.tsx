'use client'

import { useState, useEffect } from 'react'
import { getRecentSessions, WorkoutSession } from '@/lib/local-db'
import { recommendWeight } from '@/lib/coach/weight'
import { WorkoutForm } from './WorkoutForm'

export default function WorkoutPage() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [loaded, setLoaded] = useState(false)

  function reload() {
    getRecentSessions(10).then((data) => {
      setSessions(data)
      setLoaded(true)
    })
  }

  useEffect(() => { reload() }, [])

  const exerciseHistory: Record<string, { weight: number; reps: number; pump: number | null }[]> = {}
  for (const session of sessions) {
    for (const ex of session.exercises) {
      if (!exerciseHistory[ex.name]) {
        exerciseHistory[ex.name] = ex.sets.map((s) => ({
          weight: s.weight,
          reps: s.reps,
          pump: s.pump ?? null,
        }))
      }
    }
  }

  const recommendations: Record<string, number> = {}
  for (const [name, sets] of Object.entries(exerciseHistory)) {
    recommendations[name] = recommendWeight(sets, 10)
  }

  if (!loaded) return <div className="text-gray-500 text-sm p-4">로딩 중...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">운동 기록</h1>

      <WorkoutForm
        exerciseHistory={exerciseHistory}
        recommendations={recommendations}
        onSaved={reload}
      />

      {sessions.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-200">최근 운동 이력</h2>
          {sessions.map((session) => (
            <div key={session.id} className="bg-gray-900 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-white capitalize">{session.bodyPart}</span>
                <span className="text-sm text-gray-400">
                  {new Date(session.date).toLocaleDateString('ko-KR')}
                </span>
              </div>
              {session.exercises.map((ex, ei) => (
                <div key={ei} className="mt-2">
                  <div className="text-sm text-gray-300 font-medium">{ex.name}</div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {ex.sets.map((s, si) => (
                      <span key={si} className="text-xs bg-gray-800 rounded px-2 py-1 text-gray-300">
                        {s.weight}kg×{s.reps}
                        {s.pump != null && ` P${s.pump}`}
                        {s.rir != null && ` RIR${s.rir}`}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
