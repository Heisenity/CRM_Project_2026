"use client"

import { signIn, useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function TestAuthPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [tokenInfo, setTokenInfo] = useState<any>(null)
  const { data: session, status } = useSession()
  const router = useRouter()

  // Check localStorage token on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      setTokenInfo({
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 20)}...` : null
      })
    }
  }, [session])

  const testLogin = async () => {
    setLoading(true)
    setResult(null)

    try {
      const res = await signIn("credentials", {
        email: "admin@mediainfotech.org",
        password: "Admin@123",
        adminId: "ADMIN001",
        userType: "ADMIN",
        redirect: false,
      })

      setResult(res)
      
      // If login successful, wait a bit and check session
      if (res?.ok) {
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      }
    } catch (error: any) {
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const testApiCall = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/database/stats`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      })
      
      const data = await response.json()
      setResult({ apiTest: { status: response.status, data } })
    } catch (error: any) {
      setResult({ apiTest: { error: error.message } })
    }
  }

  const goToDashboard = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Auth Test Page</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Session</h2>
          <p className="text-gray-600 mb-2">Status: <strong>{status}</strong></p>
          {session && (
            <div>
              <p className="text-green-600 font-semibold mb-2">✅ Logged In!</p>
              <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                {JSON.stringify(session, null, 2)}
              </pre>
              <button
                onClick={goToDashboard}
                className="mt-4 bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
              >
                Go to Dashboard
              </button>
            </div>
          )}
          {!session && status === 'unauthenticated' && (
            <p className="text-red-600">❌ Not logged in</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">LocalStorage Token</h2>
          {tokenInfo && (
            <div>
              <p className="text-gray-600 mb-2">
                Has Token: <strong className={tokenInfo.hasToken ? 'text-green-600' : 'text-red-600'}>
                  {tokenInfo.hasToken ? 'Yes' : 'No'}
                </strong>
              </p>
              {tokenInfo.tokenPreview && (
                <p className="text-gray-600 text-sm font-mono bg-gray-100 p-2 rounded">
                  {tokenInfo.tokenPreview}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Admin Login</h2>
          <p className="text-gray-600 mb-4">
            This will test login with hardcoded credentials
          </p>
          
          <div className="flex gap-4">
            <button
              onClick={testLogin}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? "Testing..." : "Test Login"}
            </button>
            
            <button
              onClick={testApiCall}
              className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700"
            >
              Test API Call
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Result:</h3>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
