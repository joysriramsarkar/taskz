"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { createTask, getCategories } from '@/lib/api'
import { useToast } from '@/components/ui/use-toast'
import { Category } from '@/lib/types'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { CalendarIcon, PlusCircle, Loader2 } from 'lucide-react'
import { Calendar } from './ui/calendar'
import { format } from 'date-fns'
import { bn } from 'date-fns/locale'

interface CreateTaskDialogProps {
  onTaskCreated: (newTask: any) => void;
}

export function CreateTaskDialog({ onTaskCreated }: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('MEDIUM')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [dueDate, setDueDate] = useState<Date | undefined>()
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrenceType, setRecurrenceType] = useState('DAILY')
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([])
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast()

  useEffect(() => {
    async function fetchCategories() {
      try {
        const fetchedCategories = await getCategories()
        setCategories(fetchedCategories)
      } catch (error) {
        console.error("Failed to fetch categories", error)
        toast({ variant: "destructive", title: "ক্যাটাগরি আনতে ব্যর্থ", description: "ক্যাটাগরিগুলো লোড করা যায়নি।" })
      }
    }
    if (open) {
      fetchCategories()
    }
  }, [open, toast])

  const handleCreateTask = async () => {
    if (!title) {
      toast({ variant: "destructive", title: "শিরোনাম প্রয়োজন", description: "অনুগ্রহ করে টাস্কের একটি শিরোনাম দিন।" })
      return
    }
    
    setIsCreating(true);

    try {
      const newTaskData: any = {
        title,
        description,
        priority,
        categoryId,
        dueDate,
        isRecurring,
        recurrenceType: isRecurring ? recurrenceType : undefined,
        recurrenceDays: isRecurring && recurrenceType === 'WEEKLY' ? recurrenceDays : undefined,
      };

      const newTask = await createTask(newTaskData)
      onTaskCreated(newTask)
      toast({ title: "টাস্ক তৈরি হয়েছে", description: `"${title}" সফলভাবে তৈরি হয়েছে।` })
      setOpen(false)
      // Reset form
      setTitle('')
      setDescription('')
      setPriority('MEDIUM')
      setCategoryId(null)
      setDueDate(undefined)
      setIsRecurring(false)
      setRecurrenceType('DAILY')
      setRecurrenceDays([])
    } catch (error) {
      console.error("Error creating task:", error)
      toast({ variant: "destructive", title: "ত্রুটি", description: "টাস্ক তৈরিতে একটি সমস্যা হয়েছে।" })
    } finally {
      setIsCreating(false);
    }
  }

  const handleDaySelect = (day: number) => {
    setRecurrenceDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  const weekDays = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র', 'শনি'];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="lg" className="fixed top-4 left-1/2 -translate-x-1/2 z-50 shadow-lg">
          <PlusCircle className="mr-2 h-4 w-4" /> নতুন টাস্ক যোগ করুন
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>নতুন টাস্ক তৈরি করুন</DialogTitle>
          <DialogDescription>
            আপনার নতুন টাস্কের বিবরণ এখানে যোগ করুন। শেষ হলে "তৈরি করুন" ক্লিক করুন।
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            id="title"
            placeholder="টাস্কের শিরোনাম"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            id="description"
            placeholder="টাস্কের বিস্তারিত বিবরণ"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Select onValueChange={setPriority} defaultValue={priority}>
            <SelectTrigger>
              <SelectValue placeholder="গুরুত্ব" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">নিম্ন</SelectItem>
              <SelectItem value="MEDIUM">মধ্যম</SelectItem>
              <SelectItem value="HIGH">উচ্চ</SelectItem>
              <SelectItem value="URGENT">জরুরি</SelectItem>
            </SelectContent>
          </Select>
          <Select onValueChange={(value) => setCategoryId(value)} value={categoryId || ''}>
            <SelectTrigger>
              <SelectValue placeholder="ক্যাটাগরি" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={`w-full justify-start text-left font-normal ${!dueDate && "text-muted-foreground"}`}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dueDate ? format(dueDate, 'PPP', { locale: bn }) : <span>শেষ তারিখ বাছাই করুন</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dueDate}
                onSelect={setDueDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <div className="flex items-center space-x-2">
            <Switch id="is-recurring" checked={isRecurring} onCheckedChange={setIsRecurring} />
            <Label htmlFor="is-recurring">পুনরাবৃত্ত টাস্ক?</Label>
          </div>
          {isRecurring && (
            <div className="grid gap-4 p-4 border rounded-md">
              <Select onValueChange={setRecurrenceType} defaultValue={recurrenceType}>
                <SelectTrigger>
                  <SelectValue placeholder="পুনরাবৃত্তির ধরন" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAILY">দৈনিক</SelectItem>
                  <SelectItem value="WEEKLY">সাপ্তাহিক</SelectItem>
                </SelectContent>
              </Select>
              {recurrenceType === 'WEEKLY' && (
                <div className="grid gap-2">
                  <Label>কোন দিন পুনরাবৃত্তি হবে?</Label>
                  <div className="flex flex-wrap gap-2">
                    {weekDays.map((day, index) => (
                      <Button 
                        key={index} 
                        variant={recurrenceDays.includes(index) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleDaySelect(index)}
                      >
                        {day}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleCreateTask} disabled={isCreating}>
            {isCreating ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> টাস্ক তৈরি হচ্ছে...</>
            ) : (
              'টাস্ক তৈরি করুন'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
