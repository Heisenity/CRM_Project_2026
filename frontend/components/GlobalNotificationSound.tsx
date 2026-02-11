"use client"

import * as React from "react"
import { playAlertSound } from "@/lib/notification-sound"

/**
 * Invisible component that monitors notifications and plays sound
 * This runs globally in the layout so sound plays on any page
 */
export function GlobalNotificationSound() {
  React.useEffect(() => {
    let lastCount = 0

    const checkUnread = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admin/notifications/unread-count`)
        
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            const count = result.data.count || 0
            
            // Play sound if count increased
            if (count > lastCount) {
              const diff = count - lastCount
              console.log(`🔔 ${diff} new notification(s) detected!`)
              
              // Play sound for each new notification
              for (let i = 0; i < diff; i++) {
                setTimeout(() => {
                  playAlertSound()
                }, i * 400)
              }
            }
            
            lastCount = count
          }
        }
      } catch (error) {
        console.error('Error checking notifications:', error)
      }
    }

    // Initial check
    checkUnread()

    // Poll every 5 seconds for faster detection
    const interval = setInterval(checkUnread, 5000)
    return () => clearInterval(interval)
  }, [])

  // This component is invisible - it only plays sounds
  return null
}
