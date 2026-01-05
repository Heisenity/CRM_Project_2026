// lib/server-actions.ts
// Server-side functions that use next/headers
import { headers } from 'next/headers'

export type DeviceInfo = {
  os: string
  browser: string
  device: string
}

export async function getDeviceInfo(): Promise<DeviceInfo> {
    const ua = (await headers()).get('user-agent') ?? ''

    const res = await fetch(`${process.env.BACKEND_URL}/attendance/device`, {
        headers: { 'user-agent': ua },
        cache: 'no-store'
    })

    if (!res.ok) {
        throw new Error('Failed to fetch device info')
    }

    const { device } = await res.json()
    return device
}