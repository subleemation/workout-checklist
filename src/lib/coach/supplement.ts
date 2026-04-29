// 보충제 타이밍 추천 (운동 시간 기준)
// 비트: 운동 2~3시간 전
// 카페인: 운동 30분 전

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + minutes
  const nh = Math.floor(((total % 1440) + 1440) % 1440 / 60)
  const nm = ((total % 1440) + 1440) % 1440 % 60
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`
}

function timeDiffMinutes(a: string, b: string): number {
  const [ah, am] = a.split(':').map(Number)
  const [bh, bm] = b.split(':').map(Number)
  return (ah * 60 + am) - (bh * 60 + bm)
}

export interface SupplementTiming {
  beetIdeal: string      // 이상적 비트 시간
  caffeineIdeal: string  // 이상적 카페인 시간
  beetFeedback: string
  caffeineFeedback: string
}

export function getSupplementTiming(
  workoutTime: string,
  beetTime: string | null,
  caffeineTime: string | null
): SupplementTiming {
  const beetIdeal = addMinutes(workoutTime, -150)   // 2.5시간 전
  const caffeineIdeal = addMinutes(workoutTime, -30) // 30분 전

  let beetFeedback = `비트 권장 시간: ${beetIdeal} (운동 2~3시간 전)`
  if (beetTime) {
    const diff = timeDiffMinutes(workoutTime, beetTime)
    if (diff >= 120 && diff <= 180) {
      beetFeedback = `✅ 비트 타이밍 적절 (${beetTime}, 운동 ${diff}분 전)`
    } else if (diff < 120) {
      beetFeedback = `⚠️ 비트 너무 늦게 섭취 (${beetTime}) — 2시간 이상 전 권장`
    } else {
      beetFeedback = `⚠️ 비트 너무 일찍 섭취 (${beetTime}) — 3시간 이내 권장`
    }
  }

  let caffeineFeedback = `카페인 권장 시간: ${caffeineIdeal} (운동 30분 전)`
  if (caffeineTime) {
    const diff = timeDiffMinutes(workoutTime, caffeineTime)
    if (diff >= 20 && diff <= 45) {
      caffeineFeedback = `✅ 카페인 타이밍 적절 (${caffeineTime}, 운동 ${diff}분 전)`
    } else if (diff < 20) {
      caffeineFeedback = `⚠️ 카페인 너무 늦게 섭취 — 30분 전 권장`
    } else {
      caffeineFeedback = `⚠️ 카페인 너무 일찍 섭취 — 30~45분 전 권장`
    }
  }

  return { beetIdeal, caffeineIdeal, beetFeedback, caffeineFeedback }
}
