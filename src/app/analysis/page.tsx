'use client'

import { useState, useEffect } from 'react'
import {
  getSessionsInRange,
  getConditionLogsInRange,
  WorkoutSession,
  ConditionLog,
} from '@/lib/local-db'

function weekRange() {
  const now = new Date()
  const start = new Date(now.getTime() - 7 * 86400000)
  return { start, end: now }
}

export default function AnalysisPage() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [conditions, setConditions] = useState<ConditionLog[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const { start, end } = weekRange()
    Promise.all([
      getConditionLogsInRange(start, end),
      getSessionsInRange(start, end),
    ]).then(([conds, sess]) => {
      setConditions(conds)
      setSessions(sess)
      setLoaded(true)
    })
  }, [])

  if (!loaded) return <div className="text-gray-500 text-sm p-4">로딩 중...</div>

  const { start, end } = weekRange()

  // 세션별 볼륨 계산
  const sessionVolumes = sessions.map((s) => {
    const allSets = s.exercises.flatMap((ex) => ex.sets)
    const totalVolume = allSets.reduce((sum, set) => sum + set.weight * set.reps, 0)
    return {
      date: s.date,
      phase: s.phase,
      day: s.day,
      totalVolume,
    }
  })

  // 통계 계산
  const weights = conditions.map((c) => c.weight).filter(Boolean) as number[]
  const skeletalMass = conditions.map((c) => c.skeletalMass).filter(Boolean) as number[]
  const bodyFat = conditions.map((c) => c.bodyFat).filter(Boolean) as number[]

  const avgWeight = weights.length ? weights.reduce((a, b) => a + b, 0) / weights.length : null
  const avgSkeletalMass = skeletalMass.length ? skeletalMass.reduce((a, b) => a + b, 0) / skeletalMass.length : null
  const avgBodyFat = bodyFat.length ? bodyFat.reduce((a, b) => a + b, 0) / bodyFat.length : null

  const weightChange = weights.length >= 2 ? weights[weights.length - 1] - weights[0] : null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">주간 분석</h1>
      <p className="text-gray-500 text-sm">
        {start.toLocaleDateString('ko-KR')} ~ {end.toLocaleDateString('ko-KR')}
      </p>

      {/* 통계 */}
      <section className="grid grid-cols-2 gap-3">
        {[
          { label: '평균 체중', value: avgWeight ? `${avgWeight.toFixed(1)}kg` : '-' },
          { label: '체중 변화', value: weightChange ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)}kg` : '-' },
          { label: '평균 골격근량', value: avgSkeletalMass ? `${avgSkeletalMass.toFixed(1)}kg` : '-' },
          { label: '평균 체지방률', value: avgBodyFat ? `${avgBodyFat.toFixed(1)}%` : '-' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-900 rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-1">{label}</div>
            <div className="text-xl font-bold text-white">{value}</div>
          </div>
        ))}
      </section>

      {/* 운동 볼륨 */}
      {sessionVolumes.length > 0 && (
        <section className="bg-gray-900 rounded-xl p-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">운동 볼륨</h2>
          <div className="space-y-2">
            {sessionVolumes.map((sv, i) => {
              const maxVol = Math.max(...sessionVolumes.map((s) => s.totalVolume))
              const pct = maxVol > 0 ? (sv.totalVolume / maxVol) * 100 : 0
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{sv.date} ({sv.phase === 'primary' ? '1차' : '2차'} Day {sv.day})</span>
                    <span>{sv.totalVolume.toLocaleString()}kg</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full">
                    <div className="h-2 bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* 상태 기록 */}
      {conditions.length > 0 && (
        <section className="bg-gray-900 rounded-xl p-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">상태 기록</h2>
          <div className="space-y-2 text-sm">
            {conditions.map((c, i) => (
              <div key={i} className="flex justify-between text-gray-300 py-1 border-b border-gray-800 last:border-b-0">
                <span className="text-gray-500">{new Date(c.date).toLocaleDateString('ko-KR')}</span>
                <span className="text-right">
                  {c.weight.toFixed(1)}kg / {c.skeletalMass.toFixed(1)}kg / {c.bodyFat.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
