"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Clock, MapPin, User, Calendar, Camera, CheckCircle, XCircle, RefreshCw } from "lucide-react"
import { showToast } from "@/lib/toast-utils"

interface PendingAttendance {
  id: string
  employeeId: string
  employeeName: string
  email: string
  phone: string
  role: string
  teamId: string
  isTeamLeader: boolean
  date: string
  clockIn: string
  status: string
  location: string
  photo?: string
  approvalStatus: string
  createdAt: string
}

export function AttendanceApprovalDashboard() {
  const [pendingAttendances, setPendingAttendances] = React.useState<PendingAttendance[]>([])
  const [loading, setLoading] = React.useState(true)
  const [processingIds, setProcessingIds] = React.useState<Set<string>>(new Set())
  const [rejectionReasons, setRejectionReasons] = React.useState<Record<string, string>>({})
  const [showRejectForms, setShowRejectForms] = React.useState<Set<string>>(new Set())

  const fetchPendingApprovals = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/attendance/pending-approvals`)
      const result = await response.json()

      if (result.success) {
        setPendingAttendances(result.data || [])
      } else {
        showToast.error('Failed to fetch pending approvals')
      }
    } catch (error) {
      console.error('Error fetching pending approvals:', error)
      showToast.error('Failed to fetch pending approvals')
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    fetchPendingApprovals()
  }, [])

  const handleApprove = async (attendanceId: string) => {
    setProcessingIds(prev => new Set(prev).add(attendanceId))
    
    try {
      // Get admin ID from session/auth context
      const adminId = "admin-id" // This should come from your auth context

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/attendance/${attendanceId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminId,
          reason: 'Approved by admin'
        })
      })

      const result = await response.json()

      if (result.success) {
        showToast.success('Attendance approved successfully')
        // Remove from pending list
        setPendingAttendances(prev => prev.filter(att => att.id !== attendanceId))
      } else {
        showToast.error(result.error || 'Failed to approve attendance')
      }
    } catch (error) {
      console.error('Error approving attendance:', error)
      showToast.error('Failed to approve attendance')
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(attendanceId)
        return newSet
      })
    }
  }

  const handleReject = async (attendanceId: string) => {
    const reason = rejectionReasons[attendanceId]
    if (!reason?.trim()) {
      showToast.error('Please provide a reason for rejection')
      return
    }

    setProcessingIds(prev => new Set(prev).add(attendanceId))
    
    try {
      // Get admin ID from session/auth context
      const adminId = "admin-id" // This should come from your auth context

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/attendance/${attendanceId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminId,
          reason
        })
      })

      const result = await response.json()

      if (result.success) {
        showToast.success('Attendance rejected successfully')
        // Remove from pending list
        setPendingAttendances(prev => prev.filter(att => att.id !== attendanceId))
        // Clear rejection reason
        setRejectionReasons(prev => {
          const newReasons = { ...prev }
          delete newReasons[attendanceId]
          return newReasons
        })
        // Hide reject form
        setShowRejectForms(prev => {
          const newSet = new Set(prev)
          newSet.delete(attendanceId)
          return newSet
        })
      } else {
        showToast.error(result.error || 'Failed to reject attendance')
      }
    } catch (error) {
      console.error('Error rejecting attendance:', error)
      showToast.error('Failed to reject attendance')
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(attendanceId)
        return newSet
      })
    }
  }

  const toggleRejectForm = (attendanceId: string) => {
    setShowRejectForms(prev => {
      const newSet = new Set(prev)
      if (newSet.has(attendanceId)) {
        newSet.delete(attendanceId)
        // Clear rejection reason when hiding form
        setRejectionReasons(prevReasons => {
          const newReasons = { ...prevReasons }
          delete newReasons[attendanceId]
          return newReasons
        })
      } else {
        newSet.add(attendanceId)
      }
      return newSet
    })
  }

  const updateRejectionReason = (attendanceId: string, reason: string) => {
    setRejectionReasons(prev => ({
      ...prev,
      [attendanceId]: reason
    }))
  }

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDate = (timeString: string) => {
    return new Date(timeString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'FIELD_ENGINEER':
        return 'bg-blue-100 text-blue-800'
      case 'IN_OFFICE':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return 'bg-green-100 text-green-800'
      case 'LATE':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Attendance Approvals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Attendance Approvals
            {pendingAttendances.length > 0 && (
              <Badge variant="secondary">{pendingAttendances.length}</Badge>
            )}
          </div>
          <Button
            onClick={fetchPendingApprovals}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pendingAttendances.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No pending attendance approvals</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingAttendances.map((attendance) => (
              <div key={attendance.id} className="border rounded-lg p-4 space-y-4">
                {/* Employee Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <User className="h-8 w-8 text-gray-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{attendance.employeeName}</h3>
                      <p className="text-sm text-gray-600">ID: {attendance.employeeId}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getRoleBadgeColor(attendance.role)}>
                      {attendance.role.replace('_', ' ')}
                    </Badge>
                    <Badge className={getStatusBadgeColor(attendance.status)}>
                      {attendance.status}
                    </Badge>
                  </div>
                </div>

                {/* Check-in Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{formatDate(attendance.clockIn)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Time:</span>
                    <span className="font-medium">{formatTime(attendance.clockIn)}</span>
                  </div>

                  <div className="flex items-center gap-2 col-span-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">{attendance.location}</span>
                  </div>
                </div>

                {/* Photo if available */}
                {attendance.photo && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Camera className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">Check-in Photo:</span>
                    </div>
                    <div className="flex justify-center">
                      <img 
                        src={attendance.photo} 
                        alt="Check-in photo" 
                        className="max-w-full h-32 object-cover rounded-lg border"
                      />
                    </div>
                  </div>
                )}

                {/* Rejection Form */}
                {showRejectForms.has(attendance.id) && (
                  <div className="space-y-2">
                    <Label htmlFor={`rejection-reason-${attendance.id}`}>Reason for Rejection</Label>
                    <Textarea
                      id={`rejection-reason-${attendance.id}`}
                      placeholder="Please provide a reason for rejecting this attendance..."
                      value={rejectionReasons[attendance.id] || ''}
                      onChange={(e) => updateRejectionReason(attendance.id, e.target.value)}
                      rows={3}
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  {!showRejectForms.has(attendance.id) ? (
                    <>
                      <Button
                        onClick={() => handleApprove(attendance.id)}
                        disabled={processingIds.has(attendance.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {processingIds.has(attendance.id) ? 'Approving...' : 'Approve'}
                      </Button>
                      <Button
                        onClick={() => toggleRejectForm(attendance.id)}
                        variant="destructive"
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={() => toggleRejectForm(attendance.id)}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => handleReject(attendance.id)}
                        disabled={processingIds.has(attendance.id) || !rejectionReasons[attendance.id]?.trim()}
                        variant="destructive"
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        {processingIds.has(attendance.id) ? 'Rejecting...' : 'Confirm Reject'}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}