import { POST } from '../route';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

jest.mock('@/lib/db', () => ({
  db: {
    task: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
    taskHistory: {
      create: jest.fn(),
    },
  },
}));

describe('POST /api/tasks', () => {
  it('should create a recurring task with recurrenceDays as an array of numbers', async () => {
    const recurrenceDays = [1, 3, 5];
    const requestBody = {
      title: 'Test Recurring Task',
      isRecurring: true,
      recurrenceType: 'WEEKLY',
      recurrenceDays,
    };

    const req = new NextRequest('http://localhost/api/tasks', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const task = { id: '1', ...requestBody, status: 'PENDING' };
    (db.task.create as jest.Mock).mockResolvedValue(task);

    await POST(req);

    expect(db.task.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        recurrenceDays,
      }),
      include: {
        category: true,
        histories: true,
      },
    });
  });
});