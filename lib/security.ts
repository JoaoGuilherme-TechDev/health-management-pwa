const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

/**
 * Rate limiter for API routes and actions
 * @param identifier - Unique identifier (user ID, IP, etc.)
 * @param limit - Maximum requests allowed
 * @param window - Time window in milliseconds
 */
export function rateLimit(identifier: string, limit = 10, window = 60000): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + window })
    return true
  }

  if (record.count >= limit) {
    return false
  }

  record.count++
  return true
}

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== "string") return ""

  return input
    .replace(/[<>]/g, "") // Remove < and >
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .trim()
    .slice(0, 10000) // Limit length
}

/**
 * Validate Brazilian CPF
 */
export function validateCPF(cpf: string): boolean {
  cpf = cpf.replace(/[^\d]/g, "")

  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += Number.parseInt(cpf.charAt(i)) * (10 - i)
  }
  let digit = 11 - (sum % 11)
  if (digit > 9) digit = 0
  if (Number.parseInt(cpf.charAt(9)) !== digit) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += Number.parseInt(cpf.charAt(i)) * (11 - i)
  }
  digit = 11 - (sum % 11)
  if (digit > 9) digit = 0
  if (Number.parseInt(cpf.charAt(10)) !== digit) return false

  return true
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 255
}

/**
 * Validate Brazilian phone number
 */
export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/[^\d]/g, "")
  return cleaned.length === 10 || cleaned.length === 11
}

/**
 * Clean up old rate limit records (run periodically)
 */
export function cleanupRateLimits() {
  const now = Date.now()
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}
