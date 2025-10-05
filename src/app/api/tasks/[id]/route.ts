import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const task = await db.task.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        histories: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { title, description, priority, status, dueDate, categoryId } = body

    // Get current task for history
    const currentTask = await db.task.findUnique({
      where: { id: params.id }
    })

    if (!currentTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const updateData: any = {}
    if (title !== undefined) updateData.title = title.trim()
    if (description !== undefined) updateData.description = description?.trim() || null
    if (priority !== undefined) updateData.priority = priority
    if (status !== undefined) {
      updateData.status = status
      if (status === 'COMPLETED') {
        updateData.completedAt = new Date()
      } else {
        updateData.completedAt = null
      }
    }
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
    if (categoryId !== undefined) updateData.categoryId = categoryId || null

    const task = await db.task.update({
      where: { id: params.id },
      data: updateData,
      include: {
        category: true,
        histories: true
      }
    })

    // Create history record if status changed
    if (status && status !== currentTask.status) {
      let action: any = 'UPDATED'
      if (status === 'COMPLETED') action = 'COMPLETED'
      else if (status === 'CANCELLED') action = 'CANCELLED'

      await db.taskHistory.create({
        data: {
          taskId: task.id,
          action,
          oldStatus: currentTask.status,
          newStatus: status,
          description: `টাস্কের অবস্থা পরিবর্তন: ${currentTask.status} → ${status}`
        }
      })
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentTask = await db.task.findUnique({
      where: { id: params.id }
    })

    if (!currentTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Create history record before deletion
    await db.taskHistory.create({
      data: {
        taskId: currentTask.id,
        action: 'DELETED',
        oldStatus: currentTask.status,
        description: 'টাস্ক মুছে ফেলা হয়েছে'
      }
    })

    await db.task.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Task deleted successfully' })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}