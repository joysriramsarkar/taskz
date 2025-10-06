import { NextRequest, NextResponse } from 'next/server'
import { RecurringTaskService } from '@/lib/recurring-tasks'

export async function POST(request: NextRequest) {
  try {
    await RecurringTaskService.createRecurringInstances()
    return NextResponse.json({ message: 'Recurring task instances created successfully' })
  } catch (error) {
    console.error('Error creating recurring instances:', error)
    return NextResponse.json({ error: 'Failed to create recurring instances' }, { status: 500 })
  }
}