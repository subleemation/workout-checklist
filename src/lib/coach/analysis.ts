// 주간 분석 및 펌핑 분석 로직

export interface WeeklyStats {
  avgWeight: number | null
  weightChange: number | null
  avgFatigue: number | null
  avgCondition: number | null
  avgPump: number | null
  performanceTrend: 'up' | 'down' | 'stable'
  recommendations: string[]
}

export interface SessionVolume {
  date: string
  totalVolume: number  // 총 볼륨 = Σ(무게 × 반복수)
  avgPump: number | null
}

export function calcWeeklyStats(
  conditions: { weight?: number | null; fatigue?: number | null; condition?: number | null }[],
  sessionVolumes: SessionVolume[]
): WeeklyStats {
  const weights = conditions.map((c) => c.weight).filter(Boolean) as number[]
  const fatigues = conditions.map((c) => c.fatigue).filter(Boolean) as number[]
  const conds = conditions.map((c) => c.condition).filter(Boolean) as number[]
  const pumps = sessionVolumes.map((s) => s.avgPump).filter(Boolean) as number[]

  const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null

  const avgWeight = avg(weights)
  const weightChange = weights.length >= 2 ? weights[weights.length - 1] - weights[0] : null
  const avgFatigue = avg(fatigues)
  const avgCondition = avg(conds)
  const avgPump = avg(pumps)

  // 퍼포먼스 트렌드: 볼륨 첫 절반 vs 후 절반 비교
  let performanceTrend: 'up' | 'down' | 'stable' = 'stable'
  if (sessionVolumes.length >= 4) {
    const half = Math.floor(sessionVolumes.length / 2)
    const firstHalfAvg = avg(sessionVolumes.slice(0, half).map((s) => s.totalVolume))
    const secondHalfAvg = avg(sessionVolumes.slice(half).map((s) => s.totalVolume))
    if (firstHalfAvg && secondHalfAvg) {
      const diff = (secondHalfAvg - firstHalfAvg) / firstHalfAvg
      if (diff > 0.05) performanceTrend = 'up'
      else if (diff < -0.05) performanceTrend = 'down'
    }
  }

  const recommendations: string[] = []

  // 체중 정체 + 퍼포먼스 유지 → 탄수 감소
  if (weightChange !== null && Math.abs(weightChange) < 0.5 && performanceTrend === 'stable') {
    recommendations.push('💡 체중 정체 + 퍼포먼스 유지 → 탄수 소폭 감소 고려')
  }
  // 퍼포먼스 감소 → 탄수 증가
  if (performanceTrend === 'down') {
    recommendations.push('⚠️ 퍼포먼스 하락 → 탄수 증가 또는 볼륨 감소 필요')
  }
  // 피로도 높음 → 볼륨 감소
  if (avgFatigue !== null && avgFatigue >= 7) {
    recommendations.push('⚠️ 피로도 높음 → 이번 주 볼륨 10~20% 감소 권장')
  }
  if (avgCondition !== null && avgCondition >= 8 && performanceTrend !== 'down') {
    recommendations.push('✅ 컨디션 우수 → 현재 볼륨/강도 유지 또는 소폭 증가 가능')
  }

  return {
    avgWeight,
    weightChange,
    avgFatigue,
    avgCondition,
    avgPump,
    performanceTrend,
    recommendations,
  }
}

// 펌핑 분석: 어떤 조건에서 펌핑이 잘 나왔는지
export interface PumpCondition {
  hasBeet: boolean
  carbTotal: number
  avgPump: number
  count: number
}

export function analyzePumpConditions(
  sets: { pump: number | null; stimulation: number | null }[],
  dietLog: { breakfastCarbs: number; lunchCarbs: number; dinnerCarbs: number; beetTime: string | null } | null
): string[] {
  const validPumps = sets.filter((s) => s.pump !== null).map((s) => s.pump as number)
  if (validPumps.length === 0) return ['펌핑 데이터 없음']

  const avg = validPumps.reduce((a, b) => a + b, 0) / validPumps.length
  const insights: string[] = [`오늘 평균 펌핑: ${avg.toFixed(1)}/10`]

  if (dietLog) {
    const carbTotal = dietLog.breakfastCarbs + dietLog.lunchCarbs + dietLog.dinnerCarbs
    insights.push(`오늘 탄수 총량: ${carbTotal}/6`)
    if (dietLog.beetTime) insights.push(`비트 섭취: ${dietLog.beetTime}`)
    else insights.push('비트 미섭취')

    if (avg >= 7 && dietLog.beetTime) insights.push('✅ 비트 + 높은 탄수 → 펌핑 우수 패턴')
    if (avg < 5 && !dietLog.beetTime) insights.push('💡 비트 섭취 시 펌핑 개선 가능성 높음')
  }

  return insights
}
