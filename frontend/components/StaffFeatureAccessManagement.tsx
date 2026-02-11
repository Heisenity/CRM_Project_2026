"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Shield, Save, User, ChevronDown, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { getAllStaffFeatureAccess, updateStaffFeatureAccess, type StaffPortalFeature } from "@/lib/server-api"
import { showToast } from "@/lib/toast-utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type StaffFeatureData = {
  id: string
  employeeId: string
  name: string
  email: string
  role: string
  features: Record<StaffPortalFeature, boolean>
}

const AVAILABLE_FEATURES: StaffPortalFeature[] = [
  'DASHBOARD', 
  'PROJECT', 
  'TASK_MANAGEMENT', 
  'CUSTOMERS', 
  'TEAMS', 
  'TENDERS', 
  'STOCK', 
  'HR_CENTER', 
  'FIELD_ENGINEER_ATTENDANCE', 
  'INOFFICE_ATTENDANCE', 
  'CUSTOMER_SUPPORT_REQUESTS', 
  'STAFF_FEATURE_ACCESS',
  'TICKETS'
]

const FEATURE_LABELS: Record<StaffPortalFeature, string> = {
  DASHBOARD: 'Dashboard',
  PROJECT: 'Project Management',
  TASK_MANAGEMENT: 'Task Management',
  CUSTOMERS: 'Customer Management',
  TEAMS: 'Team Management',
  TENDERS: 'Tender Management',
  STOCK: 'Stock Management',
  HR_CENTER: 'HR Center',
  FIELD_ENGINEER_ATTENDANCE: 'Field Engineer Attendance',
  INOFFICE_ATTENDANCE: 'In-Office Attendance',
  CUSTOMER_SUPPORT_REQUESTS: 'Customer Support Requests',
  STAFF_FEATURE_ACCESS: 'Staff Feature Access',
  TICKETS: 'Tickets'
}

const FEATURE_DESCRIPTIONS: Record<StaffPortalFeature, string> = {
  DASHBOARD: 'Access to the main dashboard with analytics and overview',
  PROJECT: 'Project management tools and project tracking',
  TASK_MANAGEMENT: 'Task assignment and management capabilities',
  CUSTOMERS: 'Customer database and relationship management',
  TEAMS: 'Team creation and member management',
  TENDERS: 'Tender management and EMD tracking',
  STOCK: 'Inventory and stock level management',
  HR_CENTER: 'Access to the HR center',
  FIELD_ENGINEER_ATTENDANCE: 'Field engineer attendance tracking',
  INOFFICE_ATTENDANCE: 'In-office staff attendance management',
  CUSTOMER_SUPPORT_REQUESTS: 'Customer support ticket handling',
  STAFF_FEATURE_ACCESS: 'Staff permission and feature access control',
  TICKETS: 'Tickets page access'
}

export function StaffFeatureAccessManagement() {
  const [staffList, setStaffList] = useState<StaffFeatureData[]>([])
  const [filteredStaffList, setFilteredStaffList] = useState<StaffFeatureData[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [selectedStaffId, setSelectedStaffId] = useState<string>("")
  const [selectedStaff, setSelectedStaff] = useState<StaffFeatureData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showOverviewTable, setShowOverviewTable] = useState(false)
  const [features, setFeatures] = useState<Record<StaffPortalFeature, boolean>>({
    DASHBOARD: false,
    PROJECT: false,
    TASK_MANAGEMENT: false,
    CUSTOMERS: false,
    TEAMS: false,
    TENDERS: false,
    STOCK: false,
    HR_CENTER: false,
    FIELD_ENGINEER_ATTENDANCE: false,
    INOFFICE_ATTENDANCE: false,
    CUSTOMER_SUPPORT_REQUESTS: false,
    STAFF_FEATURE_ACCESS: false,
    TICKETS: false
  })
  const [hasChanges, setHasChanges] = useState(false)

  // Filter staff list based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredStaffList(staffList)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = staffList.filter(staff => 
        staff.name.toLowerCase().includes(query) ||
        staff.employeeId.toLowerCase().includes(query) ||
        staff.email.toLowerCase().includes(query)
      )
      setFilteredStaffList(filtered)
    }
    setCurrentPage(1) // Reset to first page when search changes
  }, [searchQuery, staffList])

  // Calculate pagination
  const totalPages = Math.ceil(filteredStaffList.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedStaffList = filteredStaffList.slice(startIndex, endIndex)

  useEffect(() => {
    fetchStaffFeatureAccess()
  }, [])

  useEffect(() => {
    if (selectedStaffId) {
      const staff = staffList.find(s => s.id === selectedStaffId)
      if (staff) {
        setSelectedStaff(staff)
        setFeatures({
          DASHBOARD: staff.features.DASHBOARD || false,
          PROJECT: staff.features.PROJECT || false,
          TASK_MANAGEMENT: staff.features.TASK_MANAGEMENT || false,
          CUSTOMERS: staff.features.CUSTOMERS || false,
          TEAMS: staff.features.TEAMS || false,
          TENDERS: staff.features.TENDERS || false,
          STOCK: staff.features.STOCK || false,
          HR_CENTER: staff.features.HR_CENTER || false,
          FIELD_ENGINEER_ATTENDANCE: staff.features.FIELD_ENGINEER_ATTENDANCE || false,
          INOFFICE_ATTENDANCE: staff.features.INOFFICE_ATTENDANCE || false,
          CUSTOMER_SUPPORT_REQUESTS: staff.features.CUSTOMER_SUPPORT_REQUESTS || false,
          STAFF_FEATURE_ACCESS: staff.features.STAFF_FEATURE_ACCESS || false,
          TICKETS: staff.features.TICKETS || false
        })
        setHasChanges(false)
      }
    } else {
      setSelectedStaff(null)
      setFeatures({
        DASHBOARD: false,
        PROJECT: false,
        TASK_MANAGEMENT: false,
        CUSTOMERS: false,
        TEAMS: false,
        TENDERS: false,
        STOCK: false,
        HR_CENTER: false,
        FIELD_ENGINEER_ATTENDANCE: false,
        INOFFICE_ATTENDANCE: false,
        CUSTOMER_SUPPORT_REQUESTS: false,
        STAFF_FEATURE_ACCESS: false,
        TICKETS: false
      })
      setHasChanges(false)
    }
  }, [selectedStaffId, staffList])

  const fetchStaffFeatureAccess = async () => {
    try {
      setLoading(true)
      const response = await getAllStaffFeatureAccess()
      console.log('raw staff api response', response);

      if (response.success && response.data) {
        setStaffList(response.data)
      } else {
        showToast.error(response.error || 'Failed to load staff feature access')
      }
    } catch (error) {
      console.error('Error fetching staff feature access:', error)
      showToast.error('Failed to load staff feature access')
    } finally {
      setLoading(false)
    }
  }

  const handleFeatureToggle = (feature: StaffPortalFeature) => {
    setFeatures(prev => ({
      ...prev,
      [feature]: !prev[feature]
    }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!selectedStaff) return

    try {
      setSaving(true)

      const featuresToUpdate = AVAILABLE_FEATURES.map(feature => ({
        feature,
        isAllowed: features[feature]
      }))

      const response = await updateStaffFeatureAccess(selectedStaff.id, {
        features: featuresToUpdate
      })

      if (response.success) {
        showToast.success('Feature access updated successfully')
        
        // Update local state
        setStaffList(prev => prev.map(s => {
          if (s.id === selectedStaff.id) {
            return { ...s, features: { ...features } }
          }
          return s
        }))

        setHasChanges(false)
      } else {
        showToast.error(response.error || 'Failed to update feature access')
      }
    } catch (error) {
      console.error('Error updating feature access:', error)
      showToast.error('Failed to update feature access')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (selectedStaff) {
      setFeatures({
        DASHBOARD: selectedStaff.features.DASHBOARD || false,
        PROJECT: selectedStaff.features.PROJECT || false,
        TASK_MANAGEMENT: selectedStaff.features.TASK_MANAGEMENT || false,
        CUSTOMERS: selectedStaff.features.CUSTOMERS || false,
        TEAMS: selectedStaff.features.TEAMS || false,
        TENDERS: selectedStaff.features.TENDERS || false,
        STOCK: selectedStaff.features.STOCK || false,
        HR_CENTER: selectedStaff.features.HR_CENTER || false,
        FIELD_ENGINEER_ATTENDANCE: selectedStaff.features.FIELD_ENGINEER_ATTENDANCE || false,
        INOFFICE_ATTENDANCE: selectedStaff.features.INOFFICE_ATTENDANCE || false,
        CUSTOMER_SUPPORT_REQUESTS: selectedStaff.features.CUSTOMER_SUPPORT_REQUESTS || false,
        STAFF_FEATURE_ACCESS: selectedStaff.features.STAFF_FEATURE_ACCESS || false,
        TICKETS: selectedStaff.features.TICKETS || false
      })
      setHasChanges(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Staff Feature Access</h2>
      </div>

      {staffList.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No IN_OFFICE Staff Members</h3>
            <p className="text-gray-600">
              No active IN_OFFICE staff members found in the system.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Collapsible Access Overview Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Feature Access Overview
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowOverviewTable(!showOverviewTable)}
                >
                  {showOverviewTable ? 'Hide Table' : 'Show Table'}
                  <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${showOverviewTable ? 'rotate-180' : ''}`} />
                </Button>
              </div>
            </CardHeader>
            
            {showOverviewTable && (
              <CardContent>
                {/* Search Bar */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search by name, employee ID, or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {filteredStaffList.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Search className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p>No staff members found matching "{searchQuery}"</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-3 px-4 font-semibold text-gray-700 bg-gray-50 sticky left-0 z-10">
                              Employee
                            </th>
                            {AVAILABLE_FEATURES.map(feature => (
                              <th key={feature} className="text-center py-3 px-2 font-medium text-gray-600 bg-gray-50 min-w-[100px]">
                                <div className="flex flex-col items-center gap-1">
                                  <span className="text-xs">{FEATURE_LABELS[feature]}</span>
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedStaffList.map((staff) => (
                            <tr 
                              key={staff.id} 
                              className={`border-b hover:bg-gray-50 transition-colors cursor-pointer ${
                                selectedStaffId === staff.id ? 'bg-blue-50' : ''
                              }`}
                              onClick={() => {
                                setSelectedStaffId(staff.id)
                                setShowOverviewTable(false) // Auto-hide table when selecting
                              }}
                            >
                              <td className="py-3 px-4 sticky left-0 bg-white z-10">
                                <div className="flex flex-col">
                                  <span className="font-medium text-gray-900">{staff.name}</span>
                                  <span className="text-xs text-gray-500">{staff.employeeId}</span>
                                </div>
                              </td>
                              {AVAILABLE_FEATURES.map(feature => (
                                <td key={feature} className="text-center py-3 px-2">
                                  {staff.features[feature] ? (
                                    <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100">
                                      <span className="text-green-600 text-sm font-bold">✓</span>
                                    </div>
                                  ) : (
                                    <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100">
                                      <span className="text-gray-400 text-sm">✗</span>
                                    </div>
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          Page {currentPage} of {totalPages} • Showing {startIndex + 1}-{Math.min(endIndex, filteredStaffList.length)} of {filteredStaffList.length}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                          >
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="mt-4 flex items-center gap-4 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-600 font-bold">✓</span>
                    </div>
                    <span>Access Granted</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-400">✗</span>
                    </div>
                    <span>Access Denied</span>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Existing Edit Section */}
          <Card>
          <CardHeader>
            <CardTitle className="text-lg">Select Staff Member</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Employee Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Select Employee
              </label>
              <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose an employee..." />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 pb-2">
                    <Input
                      type="text"
                      placeholder="Search employees..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-8"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  {filteredStaffList.length === 0 ? (
                    <div className="px-2 py-4 text-center text-sm text-gray-500">
                      No employees found
                    </div>
                  ) : (
                    filteredStaffList.map(staff => (
                      <SelectItem key={staff.id} value={staff.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{staff.name}</span>
                          <span className="text-gray-500">({staff.employeeId})</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Feature Checkboxes - Only show when staff is selected */}
            {selectedStaff && (
              <>
                <div className="border-t pt-6">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                    <Shield className="h-4 w-4" />
                    <span className="font-medium">Feature Permissions for {selectedStaff.name}</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-gray-700">Feature Permissions</span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const allEnabled = Object.fromEntries(
                              AVAILABLE_FEATURES.map(feature => [feature, true])
                            ) as Record<StaffPortalFeature, boolean>
                            setFeatures(allEnabled)
                            setHasChanges(true)
                          }}
                        >
                          Grant All
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const allDisabled = Object.fromEntries(
                              AVAILABLE_FEATURES.map(feature => [feature, false])
                            ) as Record<StaffPortalFeature, boolean>
                            setFeatures(allDisabled)
                            setHasChanges(true)
                          }}
                        >
                          Revoke All
                        </Button>
                      </div>
                    </div>
                    {AVAILABLE_FEATURES.map(feature => (
                      <div
                        key={feature}
                        className="flex items-center space-x-3 p-4 rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-colors"
                      >
                        <Checkbox
                          id={feature}
                          checked={features[feature]}
                          onCheckedChange={() => handleFeatureToggle(feature)}
                        />
                        <label
                          htmlFor={feature}
                          className="flex-1 cursor-pointer"
                        >
                          <div className="font-medium text-gray-900">
                            {FEATURE_LABELS[feature]}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {FEATURE_DESCRIPTIONS[feature]}
                          </div>
                          <div className="text-xs font-medium mt-1">
                            {features[feature] ? (
                              <span className="text-green-600">✓ Enabled</span>
                            ) : (
                              <span className="text-gray-400">✗ Disabled</span>
                            )}
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                {hasChanges && (
                  <div className="flex items-center gap-3 pt-4 border-t">
                    <Button
                      onClick={handleReset}
                      variant="outline"
                      disabled={saving}
                      className="flex-1"
                    >
                      Reset
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* Empty State */}
            {!selectedStaff && (
              <div className="text-center py-8 text-gray-500">
                <ChevronDown className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>Select an employee from the dropdown above to manage their permissions</p>
              </div>
            )}
          </CardContent>
        </Card>
        </>
      )}
    </div>
  )
}
