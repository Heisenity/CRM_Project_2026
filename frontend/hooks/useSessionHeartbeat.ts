"use client";

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

/**
 * This hook sends a heartbeat to the backend every 2 minutes to keep the session alive
 * while the browser tab is open (whether active or inactive).
 * 
 * When the browser is closed, the heartbeat stops, and after 5 minutes of no heartbeat,
 * the backend will invalidate the session.
 */
export function useSessionHeartbeat() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) {
      return;
    }

    const sessionToken = (session.user as any)?.sessionToken;
    if (!sessionToken) {
      return;
    }

    // Send heartbeat every 2 minutes (less than the 5-minute timeout)
    const sendHeartbeat = async () => {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/validate-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`
          }
        });
      } catch (error) {
        console.error('Heartbeat failed:', error);
      }
    };

    // Send initial heartbeat
    sendHeartbeat();

    // Set up interval to send heartbeat every 2 minutes
    const intervalId = setInterval(sendHeartbeat, 2 * 60 * 1000);

    // Cleanup interval when component unmounts or session changes
    return () => {
      clearInterval(intervalId);
    };
  }, [session, status]);
}
