// app/api/attendance/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001/api/v1'
    const fullUrl = `${backendUrl}/attendance`
    
    console.log('Frontend API: Making request to:', fullUrl)
    console.log('Frontend API: Request body:', body)
    
    // Forward the request to the backend
    const res = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-agent': request.headers.get('user-agent') || '',
      },
      body: JSON.stringify(body),
    })

    console.log('Frontend API: Backend response status:', res.status)
    
    const data = await res.json()
    console.log('Frontend API: Backend response data:', data)

    if (!res.ok) {
      console.error('Frontend API: Backend error:', data)
      return NextResponse.json(data, { status: res.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Frontend API attendance error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}