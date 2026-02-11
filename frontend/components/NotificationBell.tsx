"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Bell, BellRing } from "lucide-react"
import { AdminNotifications } from "./AdminNotifications"

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [isOpen, setIsOpen] = React.useState(false)
  const buttonRef = React.useRef<HTMLButtonElement>(null)

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

  // Fetch unread count - NO SOUND (GlobalNotificationSound handles that)
  React.useEffect(() => {
    const checkUnread = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/notifications/unread-count`)
        
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            const count = result.data.count || 0
            setUnreadCount(count)
          }
        }
      } catch (error) {
        console.error('Error fetching unread count:', error)
      }
    }

    // Initial check
    checkUnread()

    // Poll every 5 seconds
    const interval = setInterval(checkUnread, 5000)
    return () => clearInterval(interval)
  }, [])

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
          <span className="absolute top-0 right-0 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600 border-2 border-white"></span>
          </span>
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