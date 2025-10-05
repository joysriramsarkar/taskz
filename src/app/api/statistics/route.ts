import { NextRequest, NextResponse } from 'next/server'
import { db, Prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const sevenDaysAgo = new Date(new Date().setDate(new Date().getDate() - 7));
    // Get overall task statistics
    const [
      totalTasks, completedTasks, pendingTasks, inProgressTasks, cancelledTasks,
      lowPriorityTasks, mediumPriorityTasks, highPriorityTasks, urgentPriorityTasks,
      overdueTasks, categoryStats
    ] = await db.$transaction([
      db.task.count(),
      db.task.count({ where: { status: 'COMPLETED' } }),
      db.task.count({ where: { status: 'PENDING' } }),
      db.task.count({ where: { status: 'IN_PROGRESS' } }),
      db.task.count({ where: { status: 'CANCELLED' } }),
      db.task.count({ where: { priority: 'LOW' } }),
      db.task.count({ where: { priority: 'MEDIUM' } }),
      db.task.count({ where: { priority: 'HIGH' } }),
      db.task.count({ where: { priority: 'URGENT' } }),
      db.task.count({ where: { dueDate: { lt: new Date() }, status: { not: 'COMPLETED' } } }),
      db.category.findMany({ include: { _count: { select: { tasks: true } } } })
    ]);

    // Raw SQL query for daily completion counts
    const recentCompletions: { completion_date: Date, count: bigint }[] = await db.$queryRaw`
      SELECT DATE("createdAt") as completion_date, COUNT(id) as count
      FROM "TaskHistory"
      WHERE "action" = 'COMPLETED' AND "createdAt" >= ${sevenDaysAgo}
      GROUP BY completion_date
      ORDER BY completion_date ASC;
    `;

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
      recentCompletions: recentCompletions.map(item => ({
        date: item.completion_date.toISOString().split('T')[0],
        count: Number(item.count)
      }))
    }

    return NextResponse.json(statistics)
  } catch (error) {
    console.error('Error fetching statistics:', error)
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 })
  }
}