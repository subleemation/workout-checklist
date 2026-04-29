// 중량 추천: 목표 rep 이상 달성 시 +2.5kg, 미달 시 유지
export function recommendWeight(
  lastSets: { weight: number; reps: number }[],
  targetReps: number,
  increment = 2.5
): number {
  if (lastSets.length === 0) return 20

  const lastSet = lastSets[lastSets.length - 1]
  const allMetTarget = lastSets.every((s) => s.reps >= targetReps)
  return allMetTarget ? lastSet.weight + increment : lastSet.weight
}
