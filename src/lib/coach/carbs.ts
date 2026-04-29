// 탄수 배치 시스템
// 구조: 3자리 숫자 (아침-점심-저녁), 각 0~2
// 운동 시간 기반 권장 배치 추천

export type CarbPattern = '021' | '120' | '111' | '012' | '210' | string

export function getCarbPattern(
  breakfast: number,
  lunch: number,
  dinner: number
): CarbPattern {
  return `${breakfast}${lunch}${dinner}`
}

// 운동 시간 기준으로 최적 패턴 추천
export function recommendCarbPattern(workoutTime: string | null): CarbPattern {
  if (!workoutTime) return '111'

  const [h] = workoutTime.split(':').map(Number)

  if (h >= 15 && h <= 19) return '021' // 오후 운동: 점심에 탄수 몰기
  if (h >= 6 && h <= 10) return '120'  // 아침 운동: 아침/점심 탄수
  if (h >= 20) return '210'            // 저녁 늦은 운동: 점심에 탄수
  return '111'
}

// 현재 패턴 평가 피드백
export function evaluateCarbPlacement(
  breakfast: number,
  lunch: number,
  dinner: number,
  workoutTime: string | null
): string[] {
  const feedbacks: string[] = []
  const total = breakfast + lunch + dinner

  if (total === 0) {
    feedbacks.push('⚠️ 오늘 탄수화물 섭취가 없습니다. 에너지 부족 위험')
    return feedbacks
  }

  if (!workoutTime) {
    feedbacks.push('운동 시간이 미입력 상태입니다')
    return feedbacks
  }

  const [h] = workoutTime.split(':').map(Number)
  const isAfternoonWorkout = h >= 14 && h <= 19
  const isMorningWorkout = h >= 5 && h <= 11

  // 운동 전 탄수 확인
  if (isAfternoonWorkout && lunch < 1) {
    feedbacks.push('⚠️ 점심 탄수 부족 — 운동 전 탄수 추가 필요')
  }
  if (isMorningWorkout && breakfast < 1) {
    feedbacks.push('⚠️ 아침 탄수 부족 — 운동 전 탄수 추가 필요')
  }

  // 야간에 탄수 과잉
  if (dinner >= 2 && h < 18) {
    feedbacks.push('💡 저녁 탄수가 많습니다 — 운동 후가 아니라면 점심으로 이동 고려')
  }

  // 긍정 피드백
  if (isAfternoonWorkout && lunch >= 1) {
    feedbacks.push('✅ 점심 탄수 적절 — 운동 전 에너지 준비 OK')
  }
  if (isMorningWorkout && breakfast >= 1) {
    feedbacks.push('✅ 아침 탄수 적절 — 운동 전 에너지 준비 OK')
  }

  const recommended = recommendCarbPattern(workoutTime)
  const current = getCarbPattern(breakfast, lunch, dinner)
  if (current !== recommended) {
    feedbacks.push(`💡 현재 패턴 ${current} → 권장 패턴 ${recommended}`)
  } else {
    feedbacks.push(`✅ 탄수 배치 패턴 ${current} — 최적`)
  }

  return feedbacks
}
