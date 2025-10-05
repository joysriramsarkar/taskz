import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const categoryId = searchParams.get('categoryId')

    const where: any = {}
    
    if (status && status !== 'ALL') {
      where.status = status
    }
    if (priority && priority !== 'ALL') {
      where.priority = priority
    }
    if (categoryId && categoryId !== 'ALL') {
      where.categoryId = categoryId
    }

    const tasks = await db.task.findMany({
      where,
      include: {
        category: true,
        histories: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      title, 
      description, 
      priority = 'MEDIUM', 
      dueDate, 
      categoryId, 
      isRecurring = false,
      recurrenceType,
      recurrenceDays 
    } = body

    if (!title || title.trim() === '') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const taskData: any = {
      title: title.trim(),
      description: description?.trim() || null,
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
      categoryId: categoryId || null,
      isRecurring,
    }

    // Add recurring fields if it's a recurring task
    if (isRecurring) {
      if (!recurrenceType) {
        return NextResponse.json({ error: 'Recurrence type is required for recurring tasks' }, { status: 400 })
      }
      
      taskData.recurrenceType = recurrenceType
      
      if (recurrenceType === 'WEEKLY' && recurrenceDays) {
        taskData.recurrenceDays = recurrenceDays
      }
    }

    const task = await db.task.create({
      data: taskData,
      include: {
        category: true,
        histories: true
      }
    })

    // Create history record
    await db.taskHistory.create({
      data: {
        taskId: task.id,
        action: 'CREATED',
        newStatus: task.status,
        description: isRecurring ? 'পুনরাবৃত্ত টাস্ক তৈরি করা হয়েছে' : 'টাস্ক তৈরি করা হয়েছে'
      }
    })

    // If it's a recurring task, create initial instances
    if (isRecurring) {
      try {
        const { RecurringTaskService } = await import('@/lib/recurring-tasks')
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const thirtyDaysLater = new Date(today)
        thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)
        
        await RecurringTaskService.createInstancesForTask(task, today, thirtyDaysLater)
      } catch (error) {
        console.error('Error creating recurring instances:', error)
      }
    }

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}