// app/api/attendance/attempts/[employeeId]/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  try {
    const { employeeId } = params
    
    if (!employeeId) {
      return NextResponse.json(
        { success: false, error: 'Employee ID is required' },
        { status: 400 }
      )
    }
    
    // Forward the request to the backend
    const res = await fetch(
      `${process.env.BACKEND_URL}/attendance/attempts/${employeeId}`,
      {
        cache: 'no-store'
      }
    )

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('API attempts error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}