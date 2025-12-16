export const BRASILIA_TIMEZONE = "America/Sao_Paulo"

export function toBrasiliaDate(date: string | Date): Date {
  const d = typeof date === "string" ? new Date(date) : date
  return new Date(d.toLocaleString("pt-BR", { timeZone: BRASILIA_TIMEZONE }))
}
export function formatBrasiliaDate(date: string | Date, format: "date" | "time" | "datetime" = "date"): string {
  let d: Date
  
  if (typeof date === "string") {
    d = new Date(date)
  } else {
    d = date
  }
  
  // Adjust by +3 hours for Brasília time
  const adjustedDate = new Date(d.getTime() + (3 * 60 * 60 * 1000))

  if (format === "date") {
    return adjustedDate.toLocaleDateString("pt-BR")
  }

  if (format === "time") {
    return adjustedDate.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return adjustedDate.toLocaleString("pt-BR")
}

export function getCurrentBrasiliaTime(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: BRASILIA_TIMEZONE }))
}
