// app/api/device/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const userAgent = request.headers.get('user-agent') || ''
    
    // Forward the request to the backend
    const res = await fetch(`${process.env.BACKEND_URL}/attendance/device`, {
      headers: {
        'user-agent': userAgent,
      },
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('API device error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}