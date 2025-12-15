export const BRASILIA_TIMEZONE = "America/Sao_Paulo"

export function toBrasiliaDate(date: string | Date): Date {
  const d = typeof date === "string" ? new Date(date) : date
  return new Date(d.toLocaleString("en-US", { timeZone: BRASILIA_TIMEZONE }))
}

export function formatBrasiliaDate(date: string | Date, format: "date" | "time" | "datetime" = "date"): string {
  const d = typeof date === "string" ? new Date(date) : date

  if (format === "date") {
    return d.toLocaleDateString("pt-BR", { timeZone: BRASILIA_TIMEZONE })
  }

  if (format === "time") {
    return d.toLocaleTimeString("pt-BR", {
      timeZone: BRASILIA_TIMEZONE,
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return d.toLocaleString("pt-BR", { timeZone: BRASILIA_TIMEZONE })
}

export function getCurrentBrasiliaTime(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: BRASILIA_TIMEZONE }))
}
