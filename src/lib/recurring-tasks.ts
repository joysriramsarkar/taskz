import { db } from '@/lib/db'

export interface RecurringTaskData {
  title: string
  description?: string
  priority: string
  categoryId?: string
  recurrenceType: 'DAILY' | 'WEEKLY'
  recurrenceDays?: number[] // Array of day numbers (0=Sunday, 1=Monday, etc.)
  dueDate?: Date
}

export class RecurringTaskService {
  // Create recurring task instances for the next 30 days
  static async createRecurringInstances() {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const thirtyDaysLater = new Date(today)
      thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)
      
      // Get all recurring parent tasks
      const recurringTasks = await db.task.findMany({
        where: {
          isRecurring: true,
          parentTaskId: null, // Only parent tasks
          status: 'PENDING' // Only active recurring tasks
        },
        include: {
          category: true
        }
      })
      
      for (const task of recurringTasks) {
        await this.createInstancesForTask(task, today, thirtyDaysLater)
      }
      
      console.log(`Created instances for ${recurringTasks.length} recurring tasks`)
    } catch (error) {
      console.error('Error creating recurring task instances:', error)
    }
  }
  
  private static async createInstancesForTask(
    task: any, 
    startDate: Date, 
    endDate: Date
  ) {
    const currentDate = new Date(startDate)
    
    while (currentDate <= endDate) {
      const shouldCreate = this.shouldCreateInstanceForDate(task, currentDate)
      
      if (shouldCreate) {
        // Check if instance already exists for this date
        const existingInstance = await db.task.findFirst({
          where: {
            parentTaskId: task.id,
            dueDate: {
              gte: new Date(currentDate.setHours(0, 0, 0, 0)),
              lt: new Date(currentDate.setHours(23, 59, 59, 999))
            }
          }
        })
        
        if (!existingInstance) {
          await db.task.create({
            data: {
              title: task.title,
              description: task.description,
              priority: task.priority,
              categoryId: task.categoryId,
              dueDate: new Date(currentDate),
              isRecurring: false, // Instances are not recurring themselves
              parentTaskId: task.id,
              status: 'PENDING'
            }
          })
          
          // Create history record
          await db.taskHistory.create({
            data: {
              taskId: task.id,
              action: 'CREATED',
              newStatus: 'PENDING',
              description: `পুনরাবৃত্ত টাস্কের ইনস্ট্যান্স তৈরি হয়েছে: ${currentDate.toDateString()}`
            }
          })
        }
      }
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
  }
  
  private static shouldCreateInstanceForDate(task: any, date: Date): boolean {
    const dayOfWeek = date.getDay() // 0=Sunday, 1=Monday, ..., 6=Saturday
    
    if (task.recurrenceType === 'DAILY') {
      return true
    }
    
    if (task.recurrenceType === 'WEEKLY' && task.recurrenceDays) {
      const recurrenceDays = task.recurrenceDays as number[]
      return recurrenceDays.includes(dayOfWeek)
    }
    
    return false
  }
  
  // Get all instances of a recurring task
  static async getRecurringInstances(parentTaskId: string) {
    return await db.task.findMany({
      where: {
        parentTaskId
      },
      include: {
        category: true,
        histories: true
      },
      orderBy: {
        dueDate: 'asc'
      }
    })
  }
  
  // Update recurring task and all future instances
  static async updateRecurringTask(
    parentTaskId: string,
    updateData: Partial<RecurringTaskData>
  ) {
    // Update parent task
    const updatedParent = await db.task.update({
      where: { id: parentTaskId },
      data: {
        title: updateData.title,
        description: updateData.description,
        priority: updateData.priority as any,
        categoryId: updateData.categoryId,
        recurrenceType: updateData.recurrenceType as any,
        recurrenceDays: updateData.recurrenceDays ? updateData.recurrenceDays : undefined
      }
    })
    
    // Update future instances (those that are not completed)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    await db.task.updateMany({
      where: {
        parentTaskId,
        dueDate: {
          gte: today
        },
        status: {
          not: 'COMPLETED'
        }
      },
      data: {
        title: updateData.title,
        description: updateData.description,
        priority: updateData.priority as any,
        categoryId: updateData.categoryId
      }
    })
    
    return updatedParent
  }
  
  // Delete recurring task and all instances
  static async deleteRecurringTask(parentTaskId: string) {
    // Delete all instances
    await db.task.deleteMany({
      where: {
        parentTaskId
      }
    })
    
    // Delete parent task
    await db.task.delete({
      where: {
        id: parentTaskId
      }
    })
  }
}