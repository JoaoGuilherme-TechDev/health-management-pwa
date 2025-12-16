export function getCurrentBrasiliaTime(): Date {
  // Brasilia timezone is UTC-3 (America/Sao_Paulo)
  const now = new Date()
  const brasiliaTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))
  return brasiliaTime
}

export function formatBrasiliaDate(dateString: string, format: "date" | "time" | "full" = "full"): string {
  const date = new Date(dateString)

  const options: Intl.DateTimeFormatOptions = {
    timeZone: "America/Sao_Paulo",
    ...(format === "date" || format === "full" ? { year: "numeric", month: "2-digit", day: "2-digit" } : {}),
    ...(format === "time" || format === "full" ? { hour: "2-digit", minute: "2-digit", hour12: false } : {}),
  }

  return date.toLocaleString("pt-BR", options)
}

export function addHoursBrasilia(hours: number): Date {
  const now = getCurrentBrasiliaTime()
  return new Date(now.getTime() + hours * 60 * 60 * 1000)
}

export function addDaysBrasilia(days: number): Date {
  const now = getCurrentBrasiliaTime()
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
}

export function getBrasiliaTimeISO(): string {
  return getCurrentBrasiliaTime().toISOString()
}

export function isSameDayBrasilia(date1: string | Date, date2: string | Date): boolean {
  const d1 = new Date(date1).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })
  const d2 = new Date(date2).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })
  return d1 === d2
}
