'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Plus, CheckCircle, Clock, AlertCircle, BarChart3, History, Filter, RefreshCw, Search, Repeat } from 'lucide-react'
import { format, addDays, subDays, isToday, isYesterday, isTomorrow, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns'
import { bn } from 'date-fns/locale'
import { taskApi, categoryApi, statisticsApi, Task, Category, Statistics } from '@/lib/api'
import { toast } from 'sonner'
import { convertToBengaliNumber, formatBengaliDateTime } from '@/lib/bengali-utils'

const priorityColors = {
  LOW: 'bg-green-100 text-green-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800'
}

const priorityLabels = {
  LOW: 'নিম্ন',
  MEDIUM: 'মধ্যম',
  HIGH: 'উচ্চ',
  URGENT: 'জরুরি'
}

const statusLabels = {
  PENDING: 'অপেক্ষমাণ',
  IN_PROGRESS: 'চলমান',
  COMPLETED: 'সম্পন্ন',
  CANCELLED: 'বাতিল'
}

const statusIcons = {
  PENDING: Clock,
  IN_PROGRESS: AlertCircle,
  COMPLETED: CheckCircle,
  CANCELLED: AlertCircle
}

const weekDaysInBengali = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র', 'শনি']
const monthsInBengali = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর']

export default function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDateTasks, setSelectedDateTasks] = useState<Task[]>([])
  const [isDateTasksDialogOpen, setIsDateTasksDialogOpen] = useState(false)
  
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as const,
    dueDate: undefined as Date | undefined,
    categoryId: '',
    isRecurring: false,
    recurrenceType: 'DAILY' as const,
    recurrenceDays: [] as number[]
  })
  
  const [filter, setFilter] = useState({
    status: 'ALL',
    priority: 'ALL',
    categoryId: 'ALL'
  })
  const [searchQuery, setSearchQuery] = useState('')

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [tasksData, categoriesData, statsData] = await Promise.all([
        taskApi.getTasks(filter),
        categoryApi.getCategories(),
        statisticsApi.getStatistics()
      ])
      
      setTasks(tasksData)
      setCategories(categoriesData)
      setStatistics(statsData)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('ডাটা লোড করতে সমস্যা হয়েছে')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    taskApi.getTasks(filter).then(setTasks).catch(console.error)
  }, [filter])

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      toast.error('টাস্কের শিরোনাম আবশ্যক')
      return
    }

    try {
      const taskData: any = {
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        dueDate: newTask.dueDate?.toISOString(),
        categoryId: newTask.categoryId || undefined
      }

      if (newTask.isRecurring) {
        taskData.isRecurring = true
        taskData.recurrenceType = newTask.recurrenceType
        if (newTask.recurrenceType === 'WEEKLY' && newTask.recurrenceDays.length > 0) {
          taskData.recurrenceDays = newTask.recurrenceDays
        }
      }

      const task = await taskApi.createTask(taskData)
      
      setTasks([task, ...tasks])
      setNewTask({
        title: '',
        description: '',
        priority: 'MEDIUM',
        dueDate: undefined,
        categoryId: '',
        isRecurring: false,
        recurrenceType: 'DAILY',
        recurrenceDays: []
      })
      setIsCreateDialogOpen(false)
      toast.success(newTask.isRecurring ? 'পুনরাবৃত্ত টাস্ক সফলভাবে তৈরি হয়েছে' : 'টাস্ক সফলভাবে তৈরি হয়েছে')
      loadData()
    } catch (error) {
      console.error('Error creating task:', error)
      toast.error('টাস্ক তৈরি করতে সমস্যা হয়েছে')
    }
  }

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    try {
      const updatedTask = await taskApi.updateTask(taskId, { status: newStatus })
      setTasks(tasks.map(task => task.id === taskId ? updatedTask : task))
      toast.success('টাস্কের অবস্থা আপডেট হয়েছে')
      loadData()
    } catch (error) {
      console.error('Error updating task:', error)
      toast.error('টাস্ক আপডেট করতে সমস্যা হয়েছে')
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await taskApi.deleteTask(taskId)
      setTasks(tasks.filter(task => task.id !== taskId))
      toast.success('টাস্ক মুছে ফেলা হয়েছে')
      loadData()
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('টাস্ক মুছতে সমস্যা হয়েছে')
    }
  }

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      if (!task.dueDate) return false
      const taskDate = new Date(task.dueDate)
      return isSameDay(taskDate, date)
    })
  }

  const handleDateClick = (date: Date) => {
    const dateTasks = getTasksForDate(date)
    setSelectedDateTasks(dateTasks)
    setSelectedDate(date)
    setIsDateTasksDialogOpen(true)
  }

  const getOngoingTasks = () => {
    return tasks.filter(task => 
      task.status === 'PENDING' || task.status === 'IN_PROGRESS'
    )
  }

  const getYesterdayTasks = () => {
    const yesterday = subDays(new Date(), 1)
    return tasks.filter(task => {
      if (!task.dueDate) return false
      const taskDate = new Date(task.dueDate)
      return isSameDay(taskDate, yesterday)
    })
  }

  const getTomorrowTasks = () => {
    const tomorrow = addDays(new Date(), 1)
    return tasks.filter(task => {
      if (!task.dueDate) return false
      const taskDate = new Date(task.dueDate)
      return isSameDay(taskDate, tomorrow)
    })
  }

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
    
    const startDayOfWeek = monthStart.getDay()
    const emptyDays = Array(startDayOfWeek).fill(null)

    return (
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          >
            &lt;
          </Button>
          <h3 className="text-lg font-semibold">
            {monthsInBengali[currentMonth.getMonth()]} {convertToBengaliNumber(currentMonth.getFullYear())}
          </h3>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          >
            &gt;
          </Button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDaysInBengali.map(day => (
            <div key={day} className="text-center text-xs font-medium text-gray-600 p-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {emptyDays.map((_, index) => (
            <div key={`empty-${index}`} className="p-2"></div>
          ))}
          {days.map(day => {
            const dayTasks = getTasksForDate(day)
            const hasTasks = dayTasks.length > 0
            const isCurrentDay = isToday(day)
            
            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDateClick(day)}
                className={`
                  p-2 text-sm rounded-md border transition-colors relative
                  ${isCurrentDay ? 'bg-blue-50 border-blue-200 font-bold' : 'border-gray-200'}
                  ${hasTasks ? 'bg-orange-50 border-orange-200' : ''}
                  hover:bg-gray-50
                `}
              >
                <div className={isCurrentDay ? 'text-blue-600' : 'text-gray-700'}>
                  {convertToBengaliNumber(day.getDate())}
                </div>
                {hasTasks && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-orange-400 rounded-full"></div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const TaskCard = ({ task }: { task: Task }) => {
    const StatusIcon = statusIcons[task.status]
    
    return (
      <Card className="mb-3 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <StatusIcon className="h-4 w-4 text-gray-500" />
                <h4 className="font-medium">{task.title}</h4>
                <Badge className={priorityColors[task.priority]}>
                  {priorityLabels[task.priority]}
                </Badge>
              </div>
              {task.description && (
                <p className="text-sm text-gray-600 mb-2">{task.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                {task.dueDate && (
                  <span>{formatBengaliDateTime(new Date(task.dueDate))}</span>
                )}
                {task.isRecurring && (
                  <span className="flex items-center gap-1">
                    <Repeat className="h-3 w-3" />
                    পুনরাবৃত্ত
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={task.status}
                onValueChange={(value) => handleStatusChange(task.id, value as Task['status'])}
              >
                <SelectTrigger className="w-24 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">অপেক্ষমাণ</SelectItem>
                  <SelectItem value="IN_PROGRESS">চলমান</SelectItem>
                  <SelectItem value="COMPLETED">সম্পন্ন</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteTask(task.id)}
                className="text-red-600 hover:text-red-700"
              >
                মুছুন
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const taskStats = statistics?.overview || {
    total: 0,
    completed: 0,
    pending: 0,
    inProgress: 0,
    cancelled: 0,
    overdue: 0
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 lg:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">টাস্ক ম্যানেজার</h1>
            <p className="text-gray-600">আপনার সকল কাজ সুসংগঠিত রাখুন</p>
          </div>
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 ml-2" />
            রিফ্রেশ
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">সর্বমোট টাস্ক</p>
                  <p className="text-lg sm:text-2xl font-bold">{convertToBengaliNumber(taskStats.total)}</p>
                </div>
                <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">সম্পন্ন</p>
                  <p className="text-lg sm:text-2xl font-bold text-green-600">{convertToBengaliNumber(taskStats.completed)}</p>
                </div>
                <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">অপেক্ষমাণ</p>
                  <p className="text-lg sm:text-2xl font-bold text-yellow-600">{convertToBengaliNumber(taskStats.pending)}</p>
                </div>
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">চলমান</p>
                  <p className="text-lg sm:text-2xl font-bold text-blue-600">{convertToBengaliNumber(taskStats.inProgress)}</p>
                </div>
                <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="ongoing" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="ongoing" className="text-xs sm:text-sm p-2">চলমান টাস্ক</TabsTrigger>
            <TabsTrigger value="yesterday" className="text-xs sm:text-sm p-2">গতকালের টাস্ক</TabsTrigger>
            <TabsTrigger value="tomorrow" className="text-xs sm:text-sm p-2">আগামীকালের টাস্ক</TabsTrigger>
            <TabsTrigger value="calendar" className="text-xs sm:text-sm p-2">ক্যালেন্ডার</TabsTrigger>
          </TabsList>

          <TabsContent value="ongoing" className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-semibold">চলমান টাস্ক ({convertToBengaliNumber(getOngoingTasks().length)})</h2>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    নতুন টাস্ক
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md mx-auto">
                  <DialogHeader>
                    <DialogTitle>নতুন টাস্ক তৈরি করুন</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">টাস্কের শিরোনাম</Label>
                      <Input
                        id="title"
                        value={newTask.title}
                        onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                        placeholder="টাস্কের শিরোনাম লিখুন"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">বর্ণনা</Label>
                      <Textarea
                        id="description"
                        value={newTask.description}
                        onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                        placeholder="টাস্কের বিস্তারিত বর্ণনা"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>অগ্রাধিকার</Label>
                        <Select value={newTask.priority} onValueChange={(value: any) => setNewTask({...newTask, priority: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="LOW">নিম্ন</SelectItem>
                            <SelectItem value="MEDIUM">মধ্যম</SelectItem>
                            <SelectItem value="HIGH">উচ্চ</SelectItem>
                            <SelectItem value="URGENT">জরুরি</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>ক্যাটাগরি</Label>
                        <Select value={newTask.categoryId} onValueChange={(value) => setNewTask({...newTask, categoryId: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="ক্যাটাগরি নির্বাচন করুন" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(cat => (
                              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>সমাপ্তির তারিখ</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {newTask.dueDate ? format(newTask.dueDate, "PPP", { locale: bn }) : "তারিখ নির্বাচন করুন"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={newTask.dueDate}
                            onSelect={(date) => setNewTask({...newTask, dueDate: date})}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="isRecurring"
                          checked={newTask.isRecurring}
                          onChange={(e) => setNewTask({...newTask, isRecurring: e.target.checked})}
                          className="rounded"
                        />
                        <Label htmlFor="isRecurring">পুনরাবৃত্ত টাস্ক</Label>
                      </div>
                      
                      {newTask.isRecurring && (
                        <div className="space-y-2 mr-6">
                          <Label>পুনরাবৃত্তির ধরন</Label>
                          <Select value={newTask.recurrenceType} onValueChange={(value: any) => setNewTask({...newTask, recurrenceType: value})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="DAILY">দৈনিক</SelectItem>
                              <SelectItem value="WEEKLY">সাপ্তাহিক</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          {newTask.recurrenceType === 'WEEKLY' && (
                            <div>
                              <Label>দিন নির্বাচন করুন</Label>
                              <div className="grid grid-cols-7 gap-1 mt-2">
                                {['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র', 'শনি'].map((day, index) => (
                                  <label key={day} className="flex items-center justify-center">
                                    <input
                                      type="checkbox"
                                      checked={newTask.recurrenceDays.includes(index)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setNewTask({...newTask, recurrenceDays: [...newTask.recurrenceDays, index]})
                                        } else {
                                          setNewTask({...newTask, recurrenceDays: newTask.recurrenceDays.filter(d => d !== index)})
                                        }
                                      }}
                                      className="mr-1"
                                    />
                                    <span className="text-xs">{day}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <Button onClick={handleCreateTask} className="w-full">
                      টাস্ক তৈরি করুন
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {getOngoingTasks().length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-500">কোন চলমান টাস্ক নেই</p>
                  </CardContent>
                </Card>
              ) : (
                getOngoingTasks().map(task => <TaskCard key={task.id} task={task} />)
              )}
            </div>
          </TabsContent>

          <TabsContent value="yesterday" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">গতকালের টাস্ক ({convertToBengaliNumber(getYesterdayTasks().length)})</h2>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {getYesterdayTasks().length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-500">গতকাল কোন টাস্ক ছিল না</p>
                  </CardContent>
                </Card>
              ) : (
                getYesterdayTasks().map(task => <TaskCard key={task.id} task={task} />)
              )}
            </div>
          </TabsContent>

          <TabsContent value="tomorrow" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">আগামীকালের টাস্ক ({convertToBengaliNumber(getTomorrowTasks().length)})</h2>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {getTomorrowTasks().length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-500">আগামীকাল কোন টাস্ক নেই</p>
                  </CardContent>
                </Card>
              ) : (
                getTomorrowTasks().map(task => <TaskCard key={task.id} task={task} />)
              )}
            </div>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">ক্যালেন্ডার</h2>
            </div>
            
            <div className="flex justify-center">
              {renderCalendar()}
            </div>
          </TabsContent>
        </Tabs>

        {/* Date Tasks Dialog */}
        <Dialog open={isDateTasksDialogOpen} onOpenChange={setIsDateTasksDialogOpen}>
          <DialogContent className="max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedDate && format(selectedDate, "dd MMMM yyyy", { locale: bn })} - টাস্ক সমূহ
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {selectedDateTasks.length === 0 ? (
                <p className="text-gray-500 text-center py-4">এই তারিখে কোন টাস্ক নেই</p>
              ) : (
                selectedDateTasks.map(task => <TaskCard key={task.id} task={task} />)
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}