// lib/server-api.ts
// Client-side API functions (no server-only imports)

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

export type RemainingAttemptsResponse = {
  success: boolean
  data: {
    remainingAttempts: number
    isLocked: boolean
    status?: string
  }
  error?: string
}

export type AssignedLocationResponse = {
  success: boolean
  data?: {
    id: string
    latitude: number
    longitude: number
    radius: number
    address?: string
    city?: string
    state?: string
    startTime: string
    endTime: string
    assignedBy: string
  }
  error?: string
}

export async function createAttendance(data: CreateAttendanceRequest): Promise<CreateAttendanceResponse> {
    try {
        const res = await fetch('/api/attendance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
            cache: 'no-store'
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

export async function getLocationInfo(latitude: number, longitude: number): Promise<LocationInfo> {
    try {
        console.log('Making request to:', `/api/location?latitude=${latitude}&longitude=${longitude}`)
        
        const res = await fetch(
            `/api/location?latitude=${latitude}&longitude=${longitude}`,
            {
                cache: 'no-store'
            }
        )

        console.log('Response status:', res.status)
        console.log('Response ok:', res.ok)

        if (!res.ok) {
            const errorText = await res.text()
            console.error('Response error:', errorText)
            throw new Error(`Failed to fetch location info: ${res.status} ${errorText}`)
        }

        const locationInfo = await res.json()
        console.log('Location info response:', locationInfo)
        return locationInfo
    } catch (error) {
        console.error('getLocationInfo error:', error)
        throw error
    }
}

export async function getRemainingAttempts(employeeId: string): Promise<RemainingAttemptsResponse> {
    try {
        const res = await fetch(`/api/attendance/attempts/${employeeId}`, {
            cache: 'no-store'
        })

        const response = await res.json()

        if (!res.ok) {
            throw new Error(response.error || `Failed to get remaining attempts: ${res.status}`)
        }

        return response
    } catch (error) {
        console.error('getRemainingAttempts error:', error)
        throw error
    }
}

export async function getAssignedLocation(employeeId: string): Promise<AssignedLocationResponse> {
    try {
        const res = await fetch(`/api/attendance/assigned-location/${employeeId}`, {
            cache: 'no-store'
        })

        const response = await res.json()

        if (!res.ok) {
            throw new Error(response.error || `Failed to get assigned location: ${res.status}`)
        }

        return response
    } catch (error) {
        console.error('getAssignedLocation error:', error)
        throw error
    }
}