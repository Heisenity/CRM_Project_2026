"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, BellRing } from "lucide-react"
import { playAlertSound } from "@/lib/notification-sound";
import { AdminNotifications } from "./AdminNotifications"

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [isOpen, setIsOpen] = React.useState(false)
  const buttonRef = React.useRef<HTMLButtonElement>(null)
  // Keep track of the previous unread count so we only play sounds for new notifications
  const prevCountRef = React.useRef<number | null>(null)

  // Close popover when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        const popoverElement = document.querySelector('[data-notification-popover]')
        if (popoverElement && !popoverElement.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

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

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        variant="ghost"
        size="sm"
        className="relative"
        type="button"
        onClick={handleToggle}
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
      
      {isOpen && (
        <div 
          data-notification-popover
          className="absolute right-0 top-full mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999]"
          style={{ 
            position: 'absolute',
            right: 0,
            top: '100%',
            marginTop: '8px'
          }}
        >
          <AdminNotifications onClose={() => setIsOpen(false)} />
        </div>
      )}
    </div>
  )
}