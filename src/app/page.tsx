'use client'

import { useState, useEffect } from 'react'
import {
  getTodaySession,
  getTodayDiet,
  getTodayCondition,
  getLastSession,
  WorkoutSession,
  DietLog,
  ConditionLog,
} from '@/lib/local-db'
import { recommendWeight } from '@/lib/coach/weight'
import { getCarbPattern, evaluateCarbPlacement, recommendCarbPattern } from '@/lib/coach/carbs'
import { getSupplementTiming } from '@/lib/coach/supplement'

export default function HomePage() {
  const [todaySession, setTodaySession] = useState<WorkoutSession | null>(null)
  const [todayDiet, setTodayDiet] = useState<DietLog | null>(null)
  const [todayCondition, setTodayCondition] = useState<ConditionLog | null>(null)
  const [refSession, setRefSession] = useState<WorkoutSession | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    Promise.all([
      getTodaySession(),
      getTodayDiet(),
      getTodayCondition(),
      getLastSession(),
    ]).then(([session, diet, condition, last]) => {
      setTodaySession(session)
      setTodayDiet(diet)
      setTodayCondition(condition)
      setRefSession(session ?? last)
      setLoaded(true)
    })
  }, [])

  if (!loaded) return <div className="text-gray-500 text-sm p-4">로딩 중...</div>

  const supplementInfo = todayDiet?.workoutTime
    ? getSupplementTiming(todayDiet.workoutTime, todayDiet.beetTime ?? null, todayDiet.caffeineTime ?? null)
    : null

  const carbFeedbacks = todayDiet
    ? evaluateCarbPlacement(todayDiet.breakfastCarbs, todayDiet.lunchCarbs, todayDiet.dinnerCarbs, todayDiet.workoutTime ?? null)
    : []

  const carbPattern = todayDiet
    ? getCarbPattern(todayDiet.breakfastCarbs, todayDiet.lunchCarbs, todayDiet.dinnerCarbs)
    : null
  const recommendedPattern = todayDiet?.workoutTime ? recommendCarbPattern(todayDiet.workoutTime) : null

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
        <h1 className="text-2xl font-bold">오늘의 코칭</h1>
        <span className="text-gray-500 text-sm">{new Date().toLocaleDateString('ko-KR')}</span>
      </div>

      {/* 컨디션 */}
      <section className="bg-gray-900 rounded-xl p-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">오늘 상태</h2>
        {todayCondition ? (
          <div className="flex flex-wrap gap-4 text-sm">
            <span>⚖️ <strong>{todayCondition.weight}kg</strong></span>
            <span>😴 수면 <strong>{todayCondition.sleepHours}h</strong></span>
            <span>🔋 피로도 <strong>{todayCondition.fatigue}/10</strong></span>
            <span>✨ 컨디션 <strong>{todayCondition.condition}/10</strong></span>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">
            오늘 상태 미입력 →{' '}
            <a href="/diet" className="text-blue-400 underline">입력하기</a>
          </p>
        )}
      </section>

      {/* 운동 종목 + 추천 중량 */}
      <section className="bg-gray-900 rounded-xl p-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          {todaySession
            ? `운동 — ${todaySession.bodyPart}`
            : refSession
            ? `마지막 운동 (${refSession.bodyPart})`
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
            <a href="/workout" className="text-blue-400 underline">기록하기</a>
          </p>
        )}
      </section>

      {/* 식단 구조 */}
      <section className="bg-gray-900 rounded-xl p-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">식단 구조</h2>
        {todayDiet ? (
          <>
            <div className="flex items-center gap-4 mb-3">
              <div className="text-center">
                <div className="text-3xl font-mono font-bold text-yellow-400">{carbPattern}</div>
                <div className="text-xs text-gray-500">현재</div>
              </div>
              <span className="text-gray-600">→</span>
              <div className="text-center">
                <div className="text-3xl font-mono font-bold text-green-400">{recommendedPattern}</div>
                <div className="text-xs text-gray-500">권장</div>
              </div>
              {todayDiet.workoutTime && (
                <div className="text-center ml-auto">
                  <div className="text-lg font-bold text-gray-300">{todayDiet.workoutTime}</div>
                  <div className="text-xs text-gray-500">운동 시간</div>
                </div>
              )}
            </div>
            <div className="space-y-1 text-sm text-gray-300">
              {carbFeedbacks.map((fb, i) => <p key={i}>{fb}</p>)}
            </div>
          </>
        ) : (
          <p className="text-gray-500 text-sm">
            식단 미입력 →{' '}
            <a href="/diet" className="text-blue-400 underline">입력하기</a>
          </p>
        )}
      </section>

      {/* 보충제 타이밍 */}
      <section className="bg-gray-900 rounded-xl p-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">보충제 타이밍</h2>
        {supplementInfo ? (
          <div className="space-y-2 text-sm">
            <p>🫐 {supplementInfo.beetFeedback}</p>
            <p>☕ {supplementInfo.caffeineFeedback}</p>
          </div>
        ) : (
          <div className="text-sm text-gray-500">
            <p>운동 시간 입력 시 타이밍 추천 제공</p>
            {todayDiet === null && (
              <p className="mt-1">→ <a href="/diet" className="text-blue-400 underline">식단/타이밍 입력</a></p>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
