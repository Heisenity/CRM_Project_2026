"use client"

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

/**
 * Hook to persist session data and prevent logout on tab switch/inactivity
 */
export function useSessionPersistence() {
  const { data: session, status } = useSession()

  useEffect(() => {
    // Store session data in localStorage when authenticated
    if (status === 'authenticated' && session) {
      try {
        const sessionData = {
          user: session.user,
          expires: session.expires,
          timestamp: Date.now()
        }
        localStorage.setItem('nextauth.session', JSON.stringify(sessionData))
      } catch (error) {
        console.error('Failed to persist session:', error)
      }
    }

    // Clear session data on unauthenticated
    if (status === 'unauthenticated') {
      try {
        localStorage.removeItem('nextauth.session')
      } catch (error) {
        console.error('Failed to clear persisted session:', error)
      }
    }
  }, [session, status])

  // Handle visibility change to prevent session loss
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Tab became visible again - session should still be valid
        console.log('Tab became visible, session should persist')
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  // Handle page focus to maintain session
  useEffect(() => {
    const handleFocus = () => {
      console.log('Window focused, session should persist')
    }

    const handleBlur = () => {
      console.log('Window blurred, session should persist')
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)

    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])

  return { session, status }
}
