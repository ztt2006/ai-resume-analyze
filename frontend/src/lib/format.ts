export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

export function compactHash(value: string): string {
  return `${value.slice(0, 8)}...${value.slice(-6)}`
}

export function scoreTone(score: number): string {
  if (score >= 85) return "strong"
  if (score >= 70) return "balanced"
  return "cautious"
}
