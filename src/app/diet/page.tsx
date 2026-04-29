'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getTodayDiet,
  getTodayCondition,
  getRecentDietLogs,
  DietLog,
  ConditionLog,
} from '@/lib/local-db'
import { DietForm } from './DietForm'
import { ConditionForm } from './ConditionForm'
import { getSupplementTiming } from '@/lib/coach/supplement'
import { evaluateCarbPlacement, getCarbPattern } from '@/lib/coach/carbs'

export default function DietPage() {
  const [todayDiet, setTodayDiet] = useState<DietLog | null>(null)
  const [todayCondition, setTodayCondition] = useState<ConditionLog | null>(null)
  const [recentDiet, setRecentDiet] = useState<DietLog[]>([])
  const [loaded, setLoaded] = useState(false)

  const reload = useCallback(() => {
    Promise.all([
      getTodayDiet(),
      getTodayCondition(),
      getRecentDietLogs(7),
    ]).then(([diet, condition, recent]) => {
      setTodayDiet(diet)
      setTodayCondition(condition)
      setRecentDiet(recent)
      setLoaded(true)
    })
  }, [])

  useEffect(() => { reload() }, [reload])

  if (!loaded) return <div className="text-gray-500 text-sm p-4">로딩 중...</div>

  const supplementInfo = todayDiet?.workoutTime
    ? getSupplementTiming(todayDiet.workoutTime, todayDiet.beetTime ?? null, todayDiet.caffeineTime ?? null)
    : null

  const carbFeedbacks = todayDiet
    ? evaluateCarbPlacement(todayDiet.breakfastCarbs, todayDiet.lunchCarbs, todayDiet.dinnerCarbs, todayDiet.workoutTime ?? null)
    : []

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">식단 / 상태 기록</h1>

      <section className="bg-gray-900 rounded-xl p-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">오늘 상태</h2>
        <ConditionForm existing={todayCondition} onSaved={reload} />
      </section>

      <section className="bg-gray-900 rounded-xl p-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">오늘 식단</h2>
        <DietForm existing={todayDiet} onSaved={reload} />
      </section>

      {(supplementInfo || carbFeedbacks.length > 0) && (
        <section className="bg-gray-900 rounded-xl p-4 space-y-3">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">오늘 분석</h2>
          {carbFeedbacks.length > 0 && (
            <div className="space-y-1 text-sm">
              {carbFeedbacks.map((fb, i) => <p key={i}>{fb}</p>)}
            </div>
          )}
          {supplementInfo && (
            <div className="space-y-1 text-sm border-t border-gray-800 pt-3">
              <p>🫐 {supplementInfo.beetFeedback}</p>
              <p>☕ {supplementInfo.caffeineFeedback}</p>
            </div>
          )}
        </section>
      )}

      {recentDiet.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-200">최근 식단</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-300">
              <thead>
                <tr className="text-gray-500 text-xs border-b border-gray-800">
                  <th className="text-left py-2 pr-4">날짜</th>
                  <th className="text-center px-2">패턴</th>
                  <th className="text-center px-2">운동</th>
                  <th className="text-center px-2">비트</th>
                  <th className="text-center px-2">카페인</th>
                </tr>
              </thead>
              <tbody>
                {recentDiet.map((d) => (
                  <tr key={d.id} className="border-b border-gray-800/50">
                    <td className="py-2 pr-4 text-gray-400 text-xs">
                      {new Date(d.date).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}
                    </td>
                    <td className="text-center px-2 font-mono font-bold text-yellow-400">
                      {getCarbPattern(d.breakfastCarbs, d.lunchCarbs, d.dinnerCarbs)}
                    </td>
                    <td className="text-center px-2">{d.workoutTime ?? '-'}</td>
                    <td className="text-center px-2">{d.beetTime ?? '-'}</td>
                    <td className="text-center px-2">{d.caffeineTime ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
