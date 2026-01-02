export function getCurrentBrasiliaTime(): Date {
  // Brasilia timezone is UTC-3 (America/Sao_Paulo)
  const now = new Date()
  const brasiliaTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))
  return brasiliaTime
}

export function formatBrasiliaDateAppointment(dateString: string, format: "date" | "time" | "full" = "full"): string {
  // 1. Removemos qualquer informação de fuso horário da string (Z ou +/-03:00)
  // 2. Adicionamos 'Z' no final para forçar o JS a ler como UTC "puro"
  // Isso evita que o sistema tente ajustar o horário para o fuso local do servidor/navegador.
  const cleanDateString = dateString.replace(/Z$|[+-]\d{2}:?\d{2}$/, "");
  const date = new Date(cleanDateString + "Z");

  // Usamos timeZone: "UTC" para garantir que a formatação use os valores originais
  const options: Intl.DateTimeFormatOptions = {
    timeZone: "UTC",
  };

  if (format === "full") {
    return date.toLocaleString("pt-BR", { ...options, hour12: false });
  }

  if (format === "date") {
    return date.toLocaleDateString("pt-BR", {
      ...options,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  if (format === "time") {
    return date.toLocaleTimeString("pt-BR", {
      ...options,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  // Formato customizado
  const dateStr = date.toLocaleDateString("pt-BR", {
    ...options,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const timeStr = date.toLocaleTimeString("pt-BR", {
    ...options,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  
  return `${dateStr} às ${timeStr}`;
}

export function formatBrasiliaDate(dateString: string, format: "date" | "time" | "full" = "full"): string {
  const date = new Date(dateString)

  const options: Intl.DateTimeFormatOptions = {
    timeZone: "America/Sao_Paulo",
  };

  if (format === "full") {
    return date.toLocaleString("pt-BR", { ...options, hour12: false });
  }

  if (format === "date") {
    return date.toLocaleDateString("pt-BR", {
      ...options,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  }

  if (format === "time") {
    return date.toLocaleTimeString("pt-BR", {
      ...options,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  // Formato customizado
  const dateStr = date.toLocaleDateString("pt-BR", {
    ...options,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const timeStr = date.toLocaleTimeString("pt-BR", {
    ...options,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  
  return `${dateStr} às ${timeStr}`;
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

export function isDayBeforeBrasilia(appointmentDate: string | Date, todayDate: string | Date): boolean {
  const appointmentDateStr = new Date(appointmentDate).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })
  const todayDateStr = new Date(todayDate).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })

  // Parse DD/MM/YYYY format correctly
  const [dayA, monthA, yearA] = appointmentDateStr.split("/").map(Number)
  const [dayT, monthT, yearT] = todayDateStr.split("/").map(Number)

  // Create dates in correct order: year, month-1, day
  const appointmentUTC = new Date(Date.UTC(yearA, monthA - 1, dayA))
  const todayUTC = new Date(Date.UTC(yearT, monthT - 1, dayT))

  const timeDiff = appointmentUTC.getTime() - todayUTC.getTime()
  const dayDiff = timeDiff / (1000 * 60 * 60 * 24)

  // Return true only if appointment is exactly 1 day AFTER today
  return Math.abs(dayDiff - 1) < 0.01 // Using small tolerance for floating point
}

export function isExactly24HoursBefore(appointmentDate: string | Date): boolean {
  const now = getCurrentBrasiliaTime()

  // Get today's date in Brasilia timezone (00:00:00)
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)

  // Get appointment date in Brasilia timezone (00:00:00)
  const apptDate = new Date(appointmentDate)
  const apptDateOnly = new Date(apptDate.getFullYear(), apptDate.getMonth(), apptDate.getDate(), 0, 0, 0, 0)

  // Calculate difference in days
  const diffInMs = apptDateOnly.getTime() - todayDate.getTime()
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24)

  const isExactly1DayBefore = diffInDays === 1

  console.log(
    `[v0] 24h Check - Today: ${todayDate.toLocaleDateString("pt-BR")}, Appointment: ${apptDateOnly.toLocaleDateString("pt-BR")}, DiffDays: ${diffInDays}, Show: ${isExactly1DayBefore}`,
  )

  return isExactly1DayBefore
}

export function toBrasiliaTime(date: Date | string): Date {
  const d = new Date(date)
  return new Date(d.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))
}

export function getAppointmentTimeStr(appointmentDate: string | Date): string {
  const date = new Date(appointmentDate)
  return date.toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}
