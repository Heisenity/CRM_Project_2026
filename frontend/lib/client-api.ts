// lib/client-api.ts - Client-side API functions
export type CreateAttendanceRequest = {
    employeeId: string
    latitude?: number
    longitude?: number
    photo?: string
    status?: 'PRESENT' | 'LATE'
}

export type CreateAttendanceResponse = {
    success: boolean
    message: string
    data?: {
        employeeId: string
        timestamp: string
        location: string
        ipAddress: string
        deviceInfo: string
        photo?: string
        status: 'PRESENT' | 'LATE'
    }
    error?: string
}

export type DeviceInfo = {
  os: string
  browser: string
  device: string
}

export type LocationData = {
  address: string
  city: string
  state: string
}

export type LocationInfo = {
  success: boolean
  coordinates: {
    latitude: number
    longitude: number
  }
  location: LocationData
  humanReadableLocation: string
  timestamp: string
}

// Client-side function for creating attendance
export async function createAttendance(data: CreateAttendanceRequest): Promise<CreateAttendanceResponse> {
    try {
        const res = await fetch('/api/attendance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })

        const response = await res.json()

        if (!res.ok) {
            throw new Error(response.error || `Failed to create attendance: ${res.status}`)
        }

        return response
    } catch (error) {
        console.error('createAttendance error:', error)
        throw error
    }
}

// Client-side function for getting device info
export async function getDeviceInfo(): Promise<DeviceInfo> {
    const res = await fetch('/api/device')

    if (!res.ok) {
        throw new Error('Failed to fetch device info')
    }

    const { device } = await res.json()
    return device
}

// Client-side function for getting location info
export async function getLocationInfo(latitude: number, longitude: number): Promise<LocationInfo> {
    try {
        const res = await fetch(`/api/location?latitude=${latitude}&longitude=${longitude}`)

        if (!res.ok) {
            const errorText = await res.text()
            throw new Error(`Failed to fetch location info: ${res.status} ${errorText}`)
        }

        const locationInfo = await res.json()
        return locationInfo
    } catch (error) {
        console.error('getLocationInfo error:', error)
        throw error
    }
}