'use client'

import { useState, useEffect } from 'react'
import { getTodayCondition, saveConditionLog, ConditionLog } from '@/lib/local-db'
import { ConditionForm } from './ConditionForm'

export default function ConditionPage() {
  const [today, setToday] = useState<ConditionLog | null>(null)
  const [loaded, setLoaded] = useState(false)

  const reload = async () => {
    const data = await getTodayCondition()
    setToday(data)
    setLoaded(true)
  }

  useEffect(() => { reload() }, [])

  if (!loaded) return <div className="text-gray-500 text-sm p-4">로딩 중...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">오늘 상태</h1>
      <ConditionForm existing={today} onSaved={reload} />
    </div>
  )
}
