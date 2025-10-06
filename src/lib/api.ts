const API_BASE = '/api'

export interface Task {
  id: string
  title: string
  description?: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  dueDate?: string
  categoryId?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
  category?: {
    id: string
    name: string
    color: string
  }
  histories?: TaskHistory[]
}

export interface TaskHistory {
  id: string
  taskId: string
  action: 'CREATED' | 'UPDATED' | 'COMPLETED' | 'CANCELLED' | 'DELETED'
  oldStatus?: string
  newStatus?: string
  description?: string
  createdAt: string
}

export interface Category {
  id: string
  name: string
  color: string
  description?: string
  createdAt: string
  updatedAt: string
  _count?: {
    tasks: number
  }
}

export interface Statistics {
  overview: {
    total: number
    completed: number
    pending: number
    inProgress: number
    cancelled: number
    overdue: number
  }
  priority: {
    low: number
    medium: number
    high: number
    urgent: number
  }
  categories: Array<{
    id: string
    name: string
    color: string
    taskCount: number
  }>
  completionRate: number
  recentCompletions: Array<{
    createdAt: string
    _count: { id: number }
  }>
}

// Task API calls
export const taskApi = {
  async getTasks(params?: {
    status?: string
    priority?: string
    categoryId?: string
  }): Promise<Task[]> {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.append('status', params.status)
    if (params?.priority) searchParams.append('priority', params.priority)
    if (params?.categoryId) searchParams.append('categoryId', params.categoryId)
    
    const response = await fetch(`${API_BASE}/tasks?${searchParams}`)
    if (!response.ok) throw new Error('Failed to fetch tasks')
    return response.json()
  },

  async getTask(id: string): Promise<Task> {
    const response = await fetch(`${API_BASE}/tasks/${id}`)
    if (!response.ok) throw new Error('Failed to fetch task')
    return response.json()
  },

  async createTask(data: {
    title: string
    description?: string
    priority?: string
    dueDate?: string
    categoryId?: string
  }): Promise<Task> {
    const response = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to create task')
    return response.json()
  },

  async updateTask(id: string, data: Partial<Task>): Promise<Task> {
    const response = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to update task')
    return response.json()
  },

  async deleteTask(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/tasks/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) throw new Error('Failed to delete task')
  },
}

// Category API calls
export const categoryApi = {
  async getCategories(): Promise<Category[]> {
    const response = await fetch(`${API_BASE}/categories`)
    if (!response.ok) throw new Error('Failed to fetch categories')
    return response.json()
  },

  async createCategory(data: {
    name: string
    color?: string
    description?: string
  }): Promise<Category> {
    const response = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to create category')
    return response.json()
  },
}

// Statistics API calls
export const statisticsApi = {
  async getStatistics(): Promise<Statistics> {
    const response = await fetch(`${API_BASE}/statistics`)
    if (!response.ok) throw new Error('Failed to fetch statistics')
    return response.json()
  },
}