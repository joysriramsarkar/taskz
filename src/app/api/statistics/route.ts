import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Get overall task statistics
    const totalTasks = await db.task.count()
    const completedTasks = await db.task.count({
      where: { status: 'COMPLETED' }
    })
    const pendingTasks = await db.task.count({
      where: { status: 'PENDING' }
    })
    const inProgressTasks = await db.task.count({
      where: { status: 'IN_PROGRESS' }
    })
    const cancelledTasks = await db.task.count({
      where: { status: 'CANCELLED' }
    })

    // Get priority statistics
    const lowPriorityTasks = await db.task.count({
      where: { priority: 'LOW' }
    })
    const mediumPriorityTasks = await db.task.count({
      where: { priority: 'MEDIUM' }
    })
    const highPriorityTasks = await db.task.count({
      where: { priority: 'HIGH' }
    })
    const urgentPriorityTasks = await db.task.count({
      where: { priority: 'URGENT' }
    })

    // Get category statistics
    const categoryStats = await db.category.findMany({
      include: {
        _count: {
          select: {
            tasks: true
          }
        }
      }
    })

    // Get completion rate over time (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentCompletions = await db.taskHistory.groupBy({
      by: ['createdAt'],
      where: {
        action: 'COMPLETED',
        createdAt: {
          gte: sevenDaysAgo
        }
      },
      _count: {
        id: true
      }
    })

    // Get overdue tasks
    const overdueTasks = await db.task.count({
      where: {
        dueDate: {
          lt: new Date()
        },
        status: {
          not: 'COMPLETED'
        }
      }
    })

    const statistics = {
      overview: {
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks,
        inProgress: inProgressTasks,
        cancelled: cancelledTasks,
        overdue: overdueTasks
      },
      priority: {
        low: lowPriorityTasks,
        medium: mediumPriorityTasks,
        high: highPriorityTasks,
        urgent: urgentPriorityTasks
      },
      categories: categoryStats.map(cat => ({
        id: cat.id,
        name: cat.name,
        color: cat.color,
        taskCount: cat._count.tasks
      })),
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      recentCompletions: recentCompletions
    }

    return NextResponse.json(statistics)
  } catch (error) {
    console.error('Error fetching statistics:', error)
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 })
  }
}