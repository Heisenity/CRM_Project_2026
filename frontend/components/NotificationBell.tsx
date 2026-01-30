"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Bell, BellRing } from "lucide-react"
import { playAlertSound } from "@/lib/notification-sound";
import { AdminNotifications } from "./AdminNotifications"

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [isOpen, setIsOpen] = React.useState(false)
  // Keep track of the previous unread count so we only play sounds for new notifications
  const prevCountRef = React.useRef<number | null>(null)

  // Fetch unread count
  React.useEffect(() => {
    fetchUnreadCount()
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/notifications/unread-count`)
      
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          const newCount = result.data.count

          // On initial load, set the previous count without playing sounds
          if (prevCountRef.current === null) {
            prevCountRef.current = newCount
          } else if (newCount > (prevCountRef.current ?? 0)) {
            const diff = newCount - (prevCountRef.current ?? 0)

            // Play a sound for each new notification with a small spacing to avoid overlap
            for (let i = 0; i < diff; i++) {
              setTimeout(() => {
                try {
                  playAlertSound()
                } catch (e) {
                  console.error('Error playing notification sound:', e)
                }
              }, i * 150)
            }

            prevCountRef.current = newCount
          } else {
            // Update ref when count decreases or stays the same
            prevCountRef.current = newCount
          }

          setUnreadCount(newCount)
        }
      }
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative"
          onClick={() => setIsOpen(!isOpen)}
        >
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5 text-blue-600" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-96 p-0" 
        align="end"
        side="bottom"
        sideOffset={5}
      >
        <AdminNotifications onClose={() => setIsOpen(false)} />
      </PopoverContent>
    </Popover>
  )
}