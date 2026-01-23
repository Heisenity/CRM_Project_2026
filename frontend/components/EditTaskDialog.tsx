"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { showToast } from "@/lib/toast-utils"
import { updateTask, UpdateTaskRequest, getAllTickets, Ticket } from "@/lib/server-api"
import { Loader2 } from "lucide-react"

interface EditTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: {
    id: string
    title: string
    description: string
    category?: string
    location?: string
    relatedTicketId?: string
  }
  onTaskUpdated: () => void
}

const TASK_CATEGORIES = [
  'Installation',
  'Maintenance',
  'Repair',
  'Inspection',
  'Customer Support',
  'Documentation',
  'Training',
  'Other'
]

export function EditTaskDialog({ open, onOpenChange, task, onTaskUpdated }: EditTaskDialogProps) {
  const [formData, setFormData] = React.useState({
    title: task.title,
    description: task.description,
    category: task.category || '',
    location: task.location || '',
    relatedTicketId: task.relatedTicketId || ''
  })
  const [loading, setLoading] = React.useState(false)
  const [tickets, setTickets] = React.useState<Ticket[]>([])
  const [ticketsLoading, setTicketsLoading] = React.useState(false)

  // Reset form data when task changes
  React.useEffect(() => {
    setFormData({
      title: task.title,
      description: task.description,
      category: task.category || '',
      location: task.location || '',
      relatedTicketId: task.relatedTicketId || ''
    })
  }, [task])

  // Load tickets when dialog opens
  React.useEffect(() => {
    if (open) {
      loadTickets()
    }
  }, [open])

  const loadTickets = async () => {
    try {
      setTicketsLoading(true)
      const response = await getAllTickets({ limit: 1000 })
      if (response.success && response.data) {
        setTickets(response.data)
      }
    } catch (error) {
      console.error('Error loading tickets:', error)
    } finally {
      setTicketsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.description.trim()) {
      showToast.error('Title and description are required')
      return
    }

    try {
      setLoading(true)

      const updates: UpdateTaskRequest = {}
      
      // Only include fields that have changed
      if (formData.title !== task.title) updates.title = formData.title
      if (formData.description !== task.description) updates.description = formData.description
      if (formData.category !== (task.category || '')) updates.category = formData.category || undefined
      if (formData.location !== (task.location || '')) updates.location = formData.location || undefined
      if (formData.relatedTicketId !== (task.relatedTicketId || '')) updates.relatedTicketId = formData.relatedTicketId || undefined

      // Check if any changes were made
      if (Object.keys(updates).length === 0) {
        showToast.info('No changes to save')
        onOpenChange(false)
        return
      }

      const response = await updateTask(task.id, updates)

      if (response.success) {
        showToast.success('Task updated successfully')
        onTaskUpdated()
        onOpenChange(false)
      } else {
        showToast.error(response.error || 'Failed to update task')
      }
    } catch (error) {
      console.error('Error updating task:', error)
      showToast.error(error instanceof Error ? error.message : 'Failed to update task')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    // Reset form to original values
    setFormData({
      title: task.title,
      description: task.description,
      category: task.category || '',
      location: task.location || '',
      relatedTicketId: task.relatedTicketId || ''
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter task title"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter task description"
              rows={4}
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category || "none"}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value === "none" ? "" : value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No category</SelectItem>
                {TASK_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="Enter task location (optional)"
            />
          </div>

          {/* Related Ticket */}
          <div className="space-y-2">
            <Label htmlFor="relatedTicket">Related Ticket</Label>
            <Select
              value={formData.relatedTicketId || "none"}
              onValueChange={(value) => setFormData(prev => ({ ...prev, relatedTicketId: value === "none" ? "" : value }))}
              disabled={ticketsLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={ticketsLoading ? "Loading tickets..." : "Select related ticket (optional)"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No related ticket</SelectItem>
                {tickets.map((ticket) => (
                  <SelectItem key={ticket.id} value={ticket.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{ticket.ticketId}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        ticket.priority === 'HIGH' || ticket.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                        ticket.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {ticket.priority}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Task'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}