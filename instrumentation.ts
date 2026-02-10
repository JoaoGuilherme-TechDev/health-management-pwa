declare global {
  // eslint-disable-next-line no-var
  var __health_scheduler__: NodeJS.Timeout | undefined
  // eslint-disable-next-line no-var
  var __health_scheduler_processing__: boolean
}

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    if (!global.__health_scheduler__) {
      console.log('[Instrumentation] Starting background scheduler...')
      global.__health_scheduler_processing__ = false
      
      global.__health_scheduler__ = setInterval(async () => {
        if (global.__health_scheduler_processing__) {
          return
        }
        
        global.__health_scheduler_processing__ = true
        try {
          const { processRemindersAndPush } = await import('@/lib/reminder-processor')
          const result = await processRemindersAndPush()
          if (result.push_notifications_sent > 0) {
            console.log(`[Scheduler] Sent ${result.push_notifications_sent} push notifications`)
          }
          if (result.errors.length > 0) {
            console.error('[Scheduler] Errors:', result.errors)
          }
        } catch (err) {
          console.error('[Scheduler] Unexpected error:', err)
        } finally {
          global.__health_scheduler_processing__ = false
        }
      }, 10_000) // Run every 10 seconds
    }
  }
}
