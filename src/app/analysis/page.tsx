'use client'

import { useState, useEffect } from 'react'
import {
  getSessionsInRange,
  getConditionLogsInRange,
  getDietLogsInRange,
  WorkoutSession,
  DietLog,
  ConditionLog,
} from '@/lib/local-db'
import { calcWeeklyStats } from '@/lib/coach/analysis'
import { analyzePumpConditions } from '@/lib/coach/analysis'
import { getCarbPattern } from '@/lib/coach/carbs'

function weekRange() {
  const now = new Date()
  const start = new Date(now.getTime() - 7 * 86400000)
  return { start, end: now }
}

export default function AnalysisPage() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [conditions, setConditions] = useState<ConditionLog[]>([])
  const [dietLogs, setDietLogs] = useState<DietLog[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const { start, end } = weekRange()
    Promise.all([
      getConditionLogsInRange(start, end),
      getSessionsInRange(start, end),
      getDietLogsInRange(start, end),
    ]).then(([conds, sess, diets]) => {
      setConditions(conds)
      setSessions(sess)
      setDietLogs(diets)
      setLoaded(true)
    })
  }, [])

  if (!loaded) return <div className="text-gray-500 text-sm p-4">로딩 중...</div>

  const { start, end } = weekRange()

  const sessionVolumes = sessions.map((s) => {
    const allSets = s.exercises.flatMap((ex) => ex.sets)
    const totalVolume = allSets.reduce((sum, set) => sum + set.weight * set.reps, 0)
    const pumps = allSets.map((s) => s.pump).filter((p): p is number => p !== null)
    const avgPump = pumps.length ? pumps.reduce((a, b) => a + b, 0) / pumps.length : null
    return { date: s.date, totalVolume, avgPump, bodyPart: s.bodyPart }
  })

  const stats = calcWeeklyStats(conditions, sessionVolumes)

  const lastSession = sessions[sessions.length - 1]
  const lastDiet = dietLogs[dietLogs.length - 1]
  const pumpInsights = lastSession
    ? analyzePumpConditions(
        lastSession.exercises.flatMap((ex) => ex.sets),
        lastDiet ?? null
      )
    : ['운동 데이터 없음']

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">주간 분석</h1>
      <p className="text-gray-500 text-sm">
        {start.toLocaleDateString('ko-KR')} ~ {end.toLocaleDateString('ko-KR')}
      </p>

      <section className="grid grid-cols-2 gap-3">
        {[
          { label: '평균 체중', value: stats.avgWeight ? `${stats.avgWeight.toFixed(1)}kg` : '-' },
          { label: '체중 변화', value: stats.weightChange != null ? `${stats.weightChange > 0 ? '+' : ''}${stats.weightChange.toFixed(1)}kg` : '-' },
          { label: '평균 피로도', value: stats.avgFatigue ? `${stats.avgFatigue.toFixed(1)}/10` : '-' },
          { label: '평균 컨디션', value: stats.avgCondition ? `${stats.avgCondition.toFixed(1)}/10` : '-' },
          { label: '평균 펌핑', value: stats.avgPump ? `${stats.avgPump.toFixed(1)}/10` : '-' },
          { label: '퍼포먼스', value: stats.performanceTrend === 'up' ? '📈 상승' : stats.performanceTrend === 'down' ? '📉 하락' : '➡️ 유지' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-900 rounded-xl p-4">
            <div className="text-xs text-gray-500 mb-1">{label}</div>
            <div className="text-xl font-bold text-white">{value}</div>
          </div>
        ))}
      </section>

      {stats.recommendations.length > 0 && (
        <section className="bg-gray-900 rounded-xl p-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">코치 추천</h2>
          <div className="space-y-2 text-sm">
            {stats.recommendations.map((r, i) => (
              <p key={i} className="text-gray-200">{r}</p>
            ))}
          </div>
        </section>
      )}

      <section className="bg-gray-900 rounded-xl p-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">펌핑 분석 (최근 세션)</h2>
        <div className="space-y-1 text-sm">
          {pumpInsights.map((insight, i) => (
            <p key={i} className="text-gray-200">{insight}</p>
          ))}
        </div>
      </section>

      {sessionVolumes.length > 0 && (
        <section className="bg-gray-900 rounded-xl p-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">운동별 볼륨</h2>
          <div className="space-y-2">
            {sessionVolumes.map((sv) => {
              const maxVol = Math.max(...sessionVolumes.map((s) => s.totalVolume))
              const pct = maxVol > 0 ? (sv.totalVolume / maxVol) * 100 : 0
              return (
                <div key={sv.date}>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{sv.date} ({sv.bodyPart})</span>
                    <span>{sv.totalVolume.toLocaleString()}kg {sv.avgPump != null ? `P${sv.avgPump.toFixed(1)}` : ''}</span>
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

      {dietLogs.length > 0 && (
        <section className="bg-gray-900 rounded-xl p-4">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">주간 식단 패턴</h2>
          <div className="flex flex-wrap gap-3">
            {dietLogs.map((d) => (
              <div key={d.id} className="text-center">
                <div className="text-xs text-gray-500 mb-1">
                  {new Date(d.date).toLocaleDateString('ko-KR', { weekday: 'short' })}
                </div>
                <div className="text-lg font-mono font-bold text-yellow-400">
                  {getCarbPattern(d.breakfastCarbs, d.lunchCarbs, d.dinnerCarbs)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
