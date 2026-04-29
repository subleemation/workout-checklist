'use client'

import { useState, useEffect } from 'react'
import {
  getTodaySession,
  getTodayCondition,
  getLastSession,
  WorkoutSession,
  ConditionLog,
} from '@/lib/local-db'
import { recommendWeight } from '@/lib/coach/weight'

export default function HomePage() {
  const [todaySession, setTodaySession] = useState<WorkoutSession | null>(null)
  const [todayCondition, setTodayCondition] = useState<ConditionLog | null>(null)
  const [refSession, setRefSession] = useState<WorkoutSession | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    Promise.all([
      getTodaySession(),
      getTodayCondition(),
      getLastSession(),
    ]).then(([session, condition, last]) => {
      setTodaySession(session)
      setTodayCondition(condition)
      setRefSession(session ?? last)
      setLoaded(true)
    })
  }, [])

  if (!loaded) return <div className="text-gray-500 text-sm p-4">로딩 중...</div>

  const exerciseRecs = refSession
    ? refSession.exercises.map((ex) => ({
        name: ex.name,
        recommendedWeight: recommendWeight(ex.sets, 10),
        lastSets: ex.sets.map((s) => ({ weight: s.weight, reps: s.reps })),
      }))
    : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <span className="text-gray-500 text-sm">{new Date().toLocaleDateString('ko-KR')}</span>
      </div>

      {/* 오늘 상태 */}
      <section className="bg-gray-900 rounded-xl p-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">오늘 상태</h2>
        {todayCondition ? (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-1">체중</div>
              <div className="text-2xl font-bold text-white">{todayCondition.weight.toFixed(1)}kg</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-1">골격근량</div>
              <div className="text-2xl font-bold text-blue-400">{todayCondition.skeletalMass.toFixed(1)}kg</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-1">체지방률</div>
              <div className="text-2xl font-bold text-orange-400">{todayCondition.bodyFat.toFixed(1)}%</div>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">
            상태 미입력 →{' '}
            <a href="/condition" className="text-blue-400 underline">입력하기</a>
          </p>
        )}
      </section>

      {/* 오늘 운동 */}
      <section className="bg-gray-900 rounded-xl p-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          {todaySession
            ? `${todaySession.phase === 'primary' ? '1차' : '2차'} 운동 — Day ${todaySession.day}`
            : refSession
            ? `마지막 운동 (${refSession.phase === 'primary' ? '1차' : '2차'} Day ${refSession.day})`
            : '운동 기록 없음'}
        </h2>
        {exerciseRecs.length > 0 ? (
          <div className="space-y-2">
            {exerciseRecs.map((rec) => (
              <div key={rec.name} className="flex items-center justify-between border border-gray-800 rounded-lg px-3 py-2">
                <div>
                  <span className="font-medium text-white text-sm">{rec.name}</span>
                  {rec.lastSets.length > 0 && (
                    <div className="flex gap-2 mt-0.5 text-xs text-gray-500">
                      {rec.lastSets.map((s, i) => (
                        <span key={i}>{s.weight}×{s.reps}</span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-blue-400 font-bold text-sm whitespace-nowrap">{rec.recommendedWeight}kg</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">
            운동 기록 없음 →{' '}
            <a href="/workout-primary" className="text-blue-400 underline">1차 운동</a>
            {' / '}
            <a href="/workout-secondary" className="text-blue-400 underline">2차 운동</a>
          </p>
        )}
      </section>
    </div>
  )
}
