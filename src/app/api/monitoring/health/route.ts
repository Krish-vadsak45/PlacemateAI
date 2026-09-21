import { NextResponse } from "next/server"
import { redisConnection } from "@/lib/queue"

export async function GET(request: Request) {
  const checks = {
    redis: false,
    database: false,
    queue: false,
  }

  const errors: string[] = []

  // Check Redis connection
  try {
    await redisConnection.ping()
    checks.redis = true
  } catch (error) {
    errors.push(`Redis connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  // Check database connection
  try {
    const { default: connectDB } = await import("@/lib/mongodb")
    await connectDB()
    checks.database = true
  } catch (error) {
    errors.push(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  // Check queue connection
  try {
    const { emailQueue } = await import("@/lib/queue")
    await emailQueue.getWaitingCount()
    checks.queue = true
  } catch (error) {
    errors.push(`Queue connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  const allHealthy = Object.values(checks).every((check) => check === true)

  return NextResponse.json({
    status: allHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks,
    errors: errors.length > 0 ? errors : undefined,
  })
}
