"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Loader2, CheckCircle, AlertCircle, User, Info, ArrowLeft, Save, Plus, Upload, Camera } from "lucide-react"
import { createEmployee } from "@/lib/server-api"
import { uploadEmployeePhotoToS3 } from "@/lib/s3-upload"

interface AddAttendanceRecordProps {
  onRecordAdded?: () => void // Changed to just notify without passing record
  onBack?: () => void
  role?: 'FIELD_ENGINEER' | 'IN_OFFICE' // Add role prop
}

export function AddAttendanceRecord({ onRecordAdded, onBack, role = 'FIELD_ENGINEER' }: AddAttendanceRecordProps) {
  const [loading, setLoading] = React.useState(false)
  const [showSuccess, setShowSuccess] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [formData, setFormData] = React.useState({
    employeeId: '',
    employeeName: '',
    email: '',
    password: '',
    phone: '',
    designation: '',
    sickLeaveBalance: 12,
    casualLeaveBalance: 12,
    salary: '',
    address: '',
    aadharCard: '',
    panCard: '',
    uanNumber: '',
    esiNumber: '',
    bankAccountNumber: '',
    photo: null as File | null
  })

  const [availablePrefixes, setAvailablePrefixes] = React.useState<Array<{ prefix: string; description: string | null; roleType: 'FIELD_ENGINEER' | 'IN_OFFICE'; nextSequence: number }>>([])
  const [selectedPrefix, setSelectedPrefix] = React.useState('')
  const [useCustomId, setUseCustomId] = React.useState(false)

  // store an object URL for preview and clean it up
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (formData.photo) {
      const url = URL.createObjectURL(formData.photo);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [formData.photo]);

  // Fetch available prefixes on mount
  React.useEffect(() => {
    const fetchPrefixes = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/employees/prefixes`)
        const result = await response.json()

        if (result.success && result.data) {
          // Filter prefixes by role type
          const filteredPrefixes = result.data.filter((p: any) => p.roleType === role)
          setAvailablePrefixes(filteredPrefixes)
          // Set first prefix as default
          if (filteredPrefixes.length > 0) {
            setSelectedPrefix(filteredPrefixes[0].prefix)
          }
        }
      } catch (error) {
        console.error('Error fetching prefixes:', error)
      }
    }
    fetchPrefixes()
  }, [role])

  // Update employee ID preview when prefix changes
  React.useEffect(() => {
    if (selectedPrefix && !useCustomId) {
      const fetchPreview = async () => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/employees/prefixes/${selectedPrefix}/preview`)
          const result = await response.json()

          if (result.success && result.data?.nextId) {
            setFormData(prev => ({ ...prev, employeeId: result.data.nextId }))
          }
        } catch (error) {
          console.error('Error fetching preview:', error)
        }
      }
      fetchPreview()
    }
  }, [selectedPrefix, useCustomId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.employeeId.trim()) {
      setError('Employee ID is required')
      return
    }

    if (!formData.employeeName.trim()) {
      setError('Employee name is required')
      return
    }

    if (!formData.password.trim()) {
      setError('Password is required')
      return
    }

    if (!formData.phone.trim()) {
      setError('Phone is required')
      return
    }

    // Validate Aadhar card format (12 digits) if provided
    if (formData.aadharCard && !/^\d{12}$/.test(formData.aadharCard)) {
      setError('Aadhar card must be 12 digits')
      return
    }

    // Validate PAN card format (5 letters, 4 digits, 1 letter) if provided
    if (formData.panCard && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panCard)) {
      setError('PAN card format should be like ABCDE1234F')
      return
    }

    setLoading(true)
    setError(null)

    try {
      let photoKey: string | undefined;
      let finalEmployeeId = formData.employeeId

      // 🔹 STEP 1: Generate employee ID if using prefix selector
      if (!useCustomId && selectedPrefix) {
        try {
          const genResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/employees/generate-id`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prefix: selectedPrefix })
          })
          
          const genResult = await genResponse.json()
          
          if (genResult.success && genResult.data?.employeeId) {
            finalEmployeeId = genResult.data.employeeId
          } else {
            setError('Failed to generate employee ID')
            setLoading(false)
            return
          }
        } catch (error) {
          setError('Failed to generate employee ID')
          setLoading(false)
          return
        }
      }

      // 🔹 STEP 2: upload photo to S3 if exists
      if (formData.photo) {
        photoKey = await uploadEmployeePhotoToS3(formData.photo, finalEmployeeId);
      }

      // 🔹 STEP 3: Create the employee with the specified role
      const employeeData = {
        name: formData.employeeName.trim(),
        email: formData.email.trim() || null,
        password: formData.password.trim(),
        phone: formData.phone.trim() || undefined,
        designation: formData.designation.trim() || undefined,
        isTeamLeader: false, // Always false during employee creation
        role: role, // Use the role prop
        employeeId: finalEmployeeId, // Include the employee ID
        sickLeaveBalance: formData.sickLeaveBalance,
        casualLeaveBalance: formData.casualLeaveBalance,
        salary: formData.salary ? parseFloat(formData.salary) : undefined,
        address: formData.address.trim() || undefined,
        aadharCard: formData.aadharCard.trim() || undefined,
        panCard: formData.panCard.trim() || undefined,
        uanNumber: formData.uanNumber.trim() || undefined,
        esiNumber: formData.esiNumber.trim() || undefined,
        bankAccountNumber: formData.bankAccountNumber.trim() || undefined,
        photoKey
      }

      const employeeResponse = await createEmployee(employeeData)

      if (!employeeResponse.success) {
        setError(employeeResponse.error || 'Failed to create employee')
        return
      }

      // Success - employee created (no attendance record)
      onRecordAdded?.() // Notify parent component
      setShowSuccess(true)

      // Reset form after success
      setTimeout(() => {
        setFormData({
          employeeId: '',
          employeeName: '',
          email: '',
          password: '',
          phone: '',
          designation: '',
          sickLeaveBalance: 12,
          casualLeaveBalance: 12,
          salary: '',
          address: '',
          aadharCard: '',
          panCard: '',
          uanNumber: '',
          esiNumber: '',
          bankAccountNumber: '',
          photo: null
        })
        setShowSuccess(false)
        onBack?.()
      }, 2000)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create employee')
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }
    setError(null);
    setFormData(prev => ({ ...prev, photo: file }));
  };

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              onClick={onBack}
              className="h-10 w-10 p-0 border-gray-300 hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Add New Employee</h1>
              <p className="text-gray-600 mt-1">Create a new {role === 'FIELD_ENGINEER' ? 'field engineer' : 'office employee'} account</p>
            </div>
          </div>
        </div>

        {showSuccess ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="border-green-200 bg-green-50 w-full max-w-md">
              <CardContent className="flex flex-col items-center justify-center py-16 space-y-6">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
                <div className="text-center space-y-3">
                  <h3 className="text-2xl font-semibold text-green-900">Success!</h3>
                  <p className="text-green-700 text-lg">Employee account has been created successfully.</p>
                  <Badge className="bg-green-100 text-green-800 border-green-200 text-sm px-4 py-2">
                    Employee Added
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form - Left Side */}
            <div className="lg:col-span-2 space-y-8">
              {error && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-red-900 text-lg">Error</h4>
                        <p className="text-red-700 mt-1">{error}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Add New Field Engineer */}
                <Card className="border-green-200 bg-green-50">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg text-green-900">
                      <Plus className="h-5 w-5" />
                      Add New {role === 'FIELD_ENGINEER' ? 'Field Engineer' : 'Office Employee'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-green-800">Employee Photo (Optional)</Label>
                      <div className="border-2 border-dashed border-green-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
                        {previewUrl ? (
                          <div className="space-y-3">
                            <div className="w-20 h-20 mx-auto rounded-full overflow-hidden bg-gray-100 relative">
                              <img src={previewUrl} alt="Employee preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            </div>
                            <p className="text-sm text-green-700 font-medium">{formData.photo?.name}</p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setFormData((prev) => ({ ...prev, photo: null }))}
                              className="border-green-300 text-green-600 hover:bg-green-100"
                            >
                              Remove Photo
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <Camera className="h-12 w-12 text-green-400 mx-auto" />
                            <div>
                              <p className="text-green-700 font-medium mb-1">Upload Employee Photo</p>
                              <p className="text-xs text-green-600 mb-4">Supported formats: JPG, PNG (Max 5MB)</p>
                            </div>
                            <div>
                              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" id="photo-upload" />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => document.getElementById("photo-upload")?.click()}
                                className="border-green-300 text-green-600 hover:bg-green-100"
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Choose Photo
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-green-800">
                          Full Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          value={formData.employeeName}
                          onChange={(e) => setFormData(prev => ({ ...prev, employeeName: e.target.value }))}
                          placeholder="Enter full name"
                          className="border-green-300 focus:border-green-500 focus:ring-green-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-green-800">
                          Employee ID <span className="text-red-500">*</span>
                        </Label>
                        
                        {!useCustomId && availablePrefixes.length > 0 ? (
                          <div className="space-y-2">
                            <Select value={selectedPrefix} onValueChange={setSelectedPrefix}>
                              <SelectTrigger className="border-green-300 focus:border-green-500 focus:ring-green-500">
                                <SelectValue placeholder="Select prefix" />
                              </SelectTrigger>
                              <SelectContent>
                                {availablePrefixes.map((p) => (
                                  <SelectItem key={p.prefix} value={p.prefix}>
                                    {p.prefix} {p.description && `- ${p.description}`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {formData.employeeId && (
                              <div className="text-sm text-green-700 bg-green-50 p-2 rounded">
                                Next ID: <span className="font-mono font-semibold">{formData.employeeId}</span>
                              </div>
                            )}
                          </div>
                        ) : useCustomId ? (
                          <Input
                            value={formData.employeeId}
                            onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value.toUpperCase() }))}
                            placeholder="e.g., DEV001, HR001, FIELD001"
                            className="font-mono border-green-300 focus:border-green-500 focus:ring-green-500"
                          />
                        ) : (
                          <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded border border-amber-200">
                            No prefixes available for {role === 'FIELD_ENGINEER' ? 'Field Engineers' : 'Office Employees'}. Enable custom ID below.
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="useCustomId"
                            checked={useCustomId}
                            onChange={(e) => {
                              setUseCustomId(e.target.checked)
                              if (!e.target.checked && selectedPrefix && availablePrefixes.length > 0) {
                                // Reset to prefix-based ID
                                const prefixConfig = availablePrefixes.find(p => p.prefix === selectedPrefix)
                                if (prefixConfig) {
                                  setFormData(prev => ({
                                    ...prev,
                                    employeeId: `${selectedPrefix}${prefixConfig.nextSequence.toString().padStart(3, '0')}`
                                  }))
                                }
                              } else if (e.target.checked) {
                                setFormData(prev => ({ ...prev, employeeId: '' }))
                              }
                            }}
                            className="h-4 w-4"
                          />
                          <label htmlFor="useCustomId" className="text-xs text-gray-600 cursor-pointer">
                            Enter custom Employee ID
                          </label>
                        </div>
                        
                        {useCustomId && (
                          <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                            💡 Tip: Type any new prefix and it will be automatically saved for future use!
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-500">
                          Format: [PREFIX][3-digits] (e.g., DEV001, HR001, FIELD001)
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-green-800">
                          Email
                        </Label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="employee@company.com (optional)"
                          className="border-green-300 focus:border-green-500 focus:ring-green-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-green-800">
                          Password <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="Enter password"
                          className="border-green-300 focus:border-green-500 focus:ring-green-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-green-800">
                          Phone <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="Phone number"
                          className="border-green-300 focus:border-green-500 focus:ring-green-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-green-800">
                          Designation <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          value={formData.designation}
                          onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
                          placeholder="e.g. Senior Manager"
                          className="border-green-300 focus:border-green-500 focus:ring-green-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-green-800">Role</Label>
                        <div className="p-3 bg-green-50 border border-green-300 rounded-md">
                          <span className="text-sm font-medium text-green-900">
                            {role === 'FIELD_ENGINEER' ? 'Field Engineer' : 'Office Employee'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-green-800">
                          Sick Leave Balance (Days)
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          max="365"
                          value={formData.sickLeaveBalance.toString()}
                          onChange={(e) => {
                            const value = e.target.value
                            // Only update if it's a valid number or empty
                            if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0)) {
                              setFormData(prev => ({
                                ...prev,
                                sickLeaveBalance: value === '' ? 0 : parseInt(value) || 0
                              }))
                            }
                          }}
                          onBlur={(e) => {
                            // Remove leading zeros on blur
                            const value = parseInt(e.target.value) || 0
                            setFormData(prev => ({ ...prev, sickLeaveBalance: value }))
                          }}
                          placeholder="12"
                          className="border-green-300 focus:border-green-500 focus:ring-green-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-green-800">
                          Casual Leave Balance (Days)
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          max="365"
                          value={formData.casualLeaveBalance.toString()}
                          onChange={(e) => {
                            const value = e.target.value
                            // Only update if it's a valid number or empty
                            if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0)) {
                              setFormData(prev => ({
                                ...prev,
                                casualLeaveBalance: value === '' ? 0 : parseInt(value) || 0
                              }))
                            }
                          }}
                          onBlur={(e) => {
                            // Remove leading zeros on blur
                            const value = parseInt(e.target.value) || 0
                            setFormData(prev => ({ ...prev, casualLeaveBalance: value }))
                          }}
                          placeholder="12"
                          className="border-green-300 focus:border-green-500 focus:ring-green-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-green-800">
                          Monthly Salary (₹)
                        </Label>
                        <Input
                          type="number"
                          value={formData.salary}
                          onChange={(e) => setFormData(prev => ({ ...prev, salary: e.target.value }))}
                          placeholder="Enter monthly salary"
                          min="0"
                          step="0.01"
                          className="border-green-300 focus:border-green-500 focus:ring-green-500"
                        />
                      </div>
                    </div>

                    {/* Address Field */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-green-800">
                        Address
                      </Label>
                      <Input
                        value={formData.address}
                        onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Enter complete address"
                        className="border-green-300 focus:border-green-500 focus:ring-green-500"
                      />
                    </div>

                    {/* Identity Documents */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-green-800">
                          Aadhar Card Number
                        </Label>
                        <Input
                          value={formData.aadharCard}
                          onChange={(e) => setFormData(prev => ({ ...prev, aadharCard: e.target.value }))}
                          placeholder="Enter 12-digit Aadhar number"
                          maxLength={12}
                          className="border-green-300 focus:border-green-500 focus:ring-green-500 font-mono"
                        />
                        <div className="text-xs text-green-600">
                          Format: 12 digits (e.g., 123456789012)
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-green-800">
                          PAN Card Number
                        </Label>
                        <Input
                          value={formData.panCard}
                          onChange={(e) => setFormData(prev => ({ ...prev, panCard: e.target.value.toUpperCase() }))}
                          placeholder="Enter PAN number"
                          maxLength={10}
                          className="border-green-300 focus:border-green-500 focus:ring-green-500 font-mono"
                        />
                        <div className="text-xs text-green-600">
                          Format: ABCDE1234F (5 letters, 4 digits, 1 letter)
                        </div>
                      </div>
                    </div>

                    {/* Financial Information */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-green-800">
                          UAN Number
                        </Label>
                        <Input
                          value={formData.uanNumber}
                          onChange={(e) => setFormData(prev => ({ ...prev, uanNumber: e.target.value }))}
                          placeholder="Enter UAN number"
                          className="border-green-300 focus:border-green-500 focus:ring-green-500 font-mono"
                        />
                        <div className="text-xs text-green-600">
                          Universal Account Number (PF)
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-green-800">
                          ESI Number
                        </Label>
                        <Input
                          value={formData.esiNumber}
                          onChange={(e) => setFormData(prev => ({ ...prev, esiNumber: e.target.value }))}
                          placeholder="Enter ESI number"
                          className="border-green-300 focus:border-green-500 focus:ring-green-500 font-mono"
                        />
                        <div className="text-xs text-green-600">
                          Employee State Insurance
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-green-800">
                          Bank Account Number
                        </Label>
                        <Input
                          value={formData.bankAccountNumber}
                          onChange={(e) => setFormData(prev => ({ ...prev, bankAccountNumber: e.target.value }))}
                          placeholder="Enter bank account"
                          className="border-green-300 focus:border-green-500 focus:ring-green-500 font-mono"
                        />
                        <div className="text-xs text-green-600">
                          For salary payments
                        </div>
                      </div>
                    </div>

                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onBack}
                    className="flex-1 h-14 text-base border-gray-300 hover:bg-gray-50 font-medium"
                    disabled={loading}
                  >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !formData.employeeId.trim() || !formData.employeeName.trim() || !formData.password.trim() || !formData.phone.trim()}
                    className="flex-1 h-14 text-base bg-blue-600 hover:bg-blue-700 disabled:opacity-50 font-medium shadow-sm"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Creating Employee...
                      </>
                    ) : (
                      <>
                        <Save className="h-5 w-5 mr-2" />
                        Create Employee
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>

            {/* Sidebar - Right Side */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-6 max-h-[calc(100vh-4rem)] overflow-y-auto">
                {/* Preview Card */}
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Employee Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Employee ID:</span>
                        <span className="font-medium text-gray-900">
                          {formData.employeeId || 'Not specified'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Employee Name:</span>
                        <span className="font-medium text-gray-900">
                          {formData.employeeName || 'Not specified'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Email:</span>
                        <span className="font-medium text-gray-900 text-xs">
                          {formData.email || 'Not specified'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Phone:</span>
                        <span className="font-medium text-gray-900">
                          {formData.phone || 'Not specified'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Role:</span>
                        <Badge className="bg-purple-100 text-purple-800">
                          {role === 'FIELD_ENGINEER' ? 'Field Engineer' : 'Office Employee'}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Sick Leave:</span>
                        <span className="font-medium text-gray-900">
                          {formData.sickLeaveBalance} days
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Casual Leave:</span>
                        <span className="font-medium text-gray-900">
                          {formData.casualLeaveBalance} days
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Help Card */}
                <Card className="border-blue-200 bg-linear-to-br from-blue-50 to-blue-100/50 shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-100 rounded-lg">
                        <Info className="h-4 w-4 text-blue-600" />
                      </div>
                      <CardTitle className="text-lg text-blue-900 font-semibold">Quick Tips</CardTitle>
                    </div>
                    <p className="text-sm text-blue-700 mt-2">Guidelines to help you fill out the form correctly</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg border border-blue-200/50">
                        <div className="p-1 bg-blue-100 rounded-md shrink-0 mt-0.5">
                          <User className="h-3 w-3 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-900">New {role === 'FIELD_ENGINEER' ? 'Field Engineer' : 'Office Employee'}</p>
                          <p className="text-xs text-blue-700 mt-1">Creates employee account only - no attendance</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg border border-blue-200/50">
                        <div className="p-1 bg-green-100 rounded-md shrink-0 mt-0.5">
                          <Clock className="h-3 w-3 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-900">Self Attendance</p>
                          <p className="text-xs text-blue-700 mt-1">Employees must mark their own attendance</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg border border-blue-200/50">
                        <div className="p-1 bg-purple-100 rounded-md shrink-0 mt-0.5">
                          <User className="h-3 w-3 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-900">Login Credentials</p>
                          <p className="text-xs text-blue-700 mt-1">Employee can login with Employee ID and password</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-blue-200/50">
                      <div className="flex items-center gap-2 text-xs text-blue-600">
                        <CheckCircle className="h-3 w-3" />
                        <span className="font-medium">All required fields must be completed</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
