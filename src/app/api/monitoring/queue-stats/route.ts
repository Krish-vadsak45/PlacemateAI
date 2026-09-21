import { NextResponse } from "next/server"
import { getQueueStats, getDeadLetterQueueStats } from "@/lib/queue"
import Placement from "@/models/Placement"
import connectDB from "@/lib/mongodb"

export async function GET(request: Request) {
  try {
    await connectDB()

    // Get queue statistics
    const emailQueueStats = await getQueueStats()
    const dlqStats = await getDeadLetterQueueStats()

    // Get placement processing statistics
    const processingStats = await Placement.aggregate([
      {
        $group: {
          _id: '$processingStatus',
          count: { $sum: 1 },
        },
      },
    ])

    const statsMap = new Map()
    processingStats.forEach((stat: any) => {
      statsMap.set(stat._id || 'UNKNOWN', stat.count)
    })

    // Calculate health metrics
    const totalPlacements = await Placement.countDocuments()
    const failedPlacements = statsMap.get('FAILED') || 0
    const processingPlacements = statsMap.get('PROCESSING') || 0
    const completedPlacements = statsMap.get('COMPLETED') || 0

    const healthScore = totalPlacements > 0
      ? ((completedPlacements / totalPlacements) * 100).toFixed(2)
      : '100'

    // Determine health status
    let healthStatus = 'healthy'
    if (parseFloat(healthScore) < 50) healthStatus = 'critical'
    else if (parseFloat(healthScore) < 80) healthStatus = 'warning'

    const response = {
      timestamp: new Date().toISOString(),
      health: {
        status: healthStatus,
        score: healthScore,
      },
      queue: {
        email: emailQueueStats,
        deadLetter: dlqStats,
      },
      placements: {
        total: totalPlacements,
        byStatus: Object.fromEntries(statsMap),
        failed: failedPlacements,
        processing: processingPlacements,
        completed: completedPlacements,
      },
      alerts: generateAlerts(emailQueueStats, dlqStats, {
        total: totalPlacements,
        failed: failedPlacements,
        processing: processingPlacements,
      }),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching monitoring stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch monitoring stats' },
      { status: 500 }
    )
  }
}

function generateAlerts(
  queueStats: any,
  dlqStats: any,
  placementStats: any
): string[] {
  const alerts: string[] = []

  // Queue alerts
  if (queueStats.waiting > 100) {
    alerts.push(`High queue backlog: ${queueStats.waiting} emails waiting`)
  }

  if (queueStats.failed > 10) {
    alerts.push(`High failure rate: ${queueStats.failed} failed jobs`)
  }

  if (queueStats.active > 20) {
    alerts.push(`High concurrent processing: ${queueStats.active} active jobs`)
  }

  // Dead letter queue alerts
  if (dlqStats.waiting > 5) {
    alerts.push(`Dead letter queue growing: ${dlqStats.waiting} failed emails`)
  }

  // Placement alerts
  if (placementStats.failed > 5) {
    alerts.push(`Multiple failed placements: ${placementStats.failed} emails failed to process`)
  }

  if (placementStats.processing > 10) {
    alerts.push(`Stuck processing: ${placementStats.processing} emails stuck in PROCESSING state`)
  }

  return alerts
}
