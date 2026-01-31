"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Upload, FileText, Download, Trash2, User, Calendar } from "lucide-react"
import { showToast } from "@/lib/toast-utils"
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch'
import { uploadDocumentToS3 } from "@/lib/s3-upload"

interface Employee {
  id: string
  employeeId: string
  name: string
}

interface EmployeeDocument {
  id: string
  employeeId: string
  employeeName?: string
  title: string
  description?: string
  fileName: string
  filePath: string
  fileSize: number
  mimeType: string
  uploadedBy: string
  uploadedAt: string
  createdAt: string
  updatedAt: string
}

interface AdminDocumentUploadProps {
  adminId: string
  adminName: string
}

export function AdminDocumentUpload({ adminId, adminName }: AdminDocumentUploadProps) {
  const { authenticatedFetch, isAuthenticated } = useAuthenticatedFetch()

  const [employees, setEmployees] = useState<Employee[]>([])
  const [documents, setDocuments] = useState<EmployeeDocument[]>([])
  const [loading, setLoading] = useState(false)
  const [employeesLoading, setEmployeesLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Fetch employees
  useEffect(() => {
    const fetchEmployees = async () => {
      setEmployeesLoading(true)
      try {
        // Use authenticatedFetch to include session token
        const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/employees`)
        const result = await response.json()

        console.log('Employees API response:', result) // Debug log

        if (result.success && result.data && Array.isArray(result.data.employees)) {
          // The API returns data.employees, not just data
          const validEmployees = result.data.employees.filter((emp: any) =>
            emp && emp.employeeId && emp.name
          ).map((emp: any) => ({
            id: emp.id,
            employeeId: emp.employeeId,
            name: emp.name
          }))
          console.log('Valid employees:', validEmployees) // Debug log
          setEmployees(validEmployees)
        } else {
          console.warn('No employees found or invalid response format', result)
          setEmployees([])
        }
      } catch (error) {
        console.error('Error fetching employees:', error)
        if (error instanceof Error && error.message.includes('No valid session token')) {
          showToast.error('Please sign in to view employees')
        }
        setEmployees([])
      } finally {
        setEmployeesLoading(false)
      }
    }

    fetchEmployees()
  }, [authenticatedFetch])

  // Fetch all documents
  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    try {
      // Use authenticatedFetch to include session token
      const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/documents/all`)
      const result = await response.json()

      if (result.success) {
        setDocuments(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching documents:', error)
      if (error instanceof Error && error.message.includes('No valid session token')) {
        showToast.error('Please sign in to fetch documents')
      } else {
        showToast.error('Failed to fetch documents')
      }
    } finally {
      setLoading(false)
    }
  }, [authenticatedFetch])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        showToast.error('File size must be less than 10MB')
        return
      }
      setSelectedFile(file)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedEmployee || !title.trim() || !selectedFile) {
      showToast.error("Please fill all required fields")
      return
    }

    setUploading(true)

    try {
      // Upload to S3
      const uploaded = await uploadDocumentToS3(
        selectedFile,
        selectedEmployee
      )

      // Save metadata to backend
      const response = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/documents`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeId: selectedEmployee,
            title: title.trim(),
            description: description.trim(),
            uploadedBy: adminName,
            adminId,
            fileName: uploaded.fileName,
            filePath: uploaded.fileUrl,
            fileSize: uploaded.fileSize,
            mimeType: uploaded.mimeType,
          }),
        }
      )

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || "Failed to save document")
      }

      showToast.success("Document uploaded successfully")
      setSelectedEmployee("")
      setTitle("")
      setDescription("")
      setSelectedFile(null)
      fetchDocuments()
    } catch (err: any) {
      console.error(err)
      showToast.error(err.message || "Upload failed")
    } finally {
      setUploading(false)
    }
  }


  const handleDownload = async (documentId: string) => {
    try {
      if (!isAuthenticated) {
        showToast.error('You need to be signed in to download documents')
        return
      }

      const response = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/documents/download/${documentId}`
      )

      const result = await response.json()

      const url =
        result?.url ||
        result?.data?.url ||
        result?.fileUrl

      if (!url) {
        throw new Error('Download URL missing in response')
      }

      // ✅ Trigger download without leaving page
      const a = document.createElement('a')
      a.href = url
      a.rel = 'noopener'
      a.target = '_blank'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

    } catch (error) {
      console.error('Error downloading document:', error)
      showToast.error('Failed to download document')
    }
  }



  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    try {
      if (!isAuthenticated) {
        showToast.error('You need to be signed in to delete documents')
        return
      }

      const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/documents/${documentId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        showToast.success('Document deleted successfully')
        fetchDocuments()
      } else {
        throw new Error(result.error || 'Failed to delete document')
      }
    } catch (error) {
      console.error('Error deleting document:', error)
      if (error instanceof Error && error.message.includes('No valid session token')) {
        showToast.error('Please sign in to delete documents')
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        showToast.error(`Failed to delete document: ${errorMessage}`)
      }
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5 text-blue-500" />
            <span>Upload Document for Employee</span>
          </CardTitle>
          <p className="text-gray-600">
            Upload documents that employees can download
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employee">Select Employee *</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee} disabled={employeesLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder={employeesLoading ? "Loading employees..." : "Choose an employee"} />
                  </SelectTrigger>
                  <SelectContent>
                    {employeesLoading ? (
                      <SelectItem value="loading" disabled>
                        Loading employees...
                      </SelectItem>
                    ) : employees.length > 0 ? (
                      employees.map((employee) => (
                        <SelectItem key={employee.employeeId} value={employee.employeeId}>
                          {employee.name} ({employee.employeeId})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-employees" disabled>
                        No employees found
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Document Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter document title"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter document description..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file-upload">Select File *</Label>
              <Input
                id="file-upload"
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif"
                required
              />
              <p className="text-xs text-gray-500">
                Supported formats: PDF, Word, Excel, Text, Images. Max size: 10MB
              </p>
              {selectedFile && (
                <div className="bg-blue-50 rounded p-3 text-sm">
                  <p><strong>Selected:</strong> {selectedFile.name}</p>
                  <p><strong>Size:</strong> {formatFileSize(selectedFile.size)}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={uploading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-500" />
            <span>Uploaded Documents</span>
          </CardTitle>
          <p className="text-gray-600">
            Manage documents uploaded for employees
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading documents...</span>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Documents</h3>
              <p className="text-gray-600">
                No documents have been uploaded yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <h4 className="font-medium text-gray-900">{document.title}</h4>
                        <Badge variant="outline" className="text-xs">
                          {document.mimeType.split('/')[1].toUpperCase()}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4" />
                          <span>{document.employeeName} ({document.employeeId})</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4" />
                          <span>{document.fileName}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(document.uploadedAt)}</span>
                        </div>
                      </div>

                      <div className="text-sm text-gray-600 mb-2">
                        <span><strong>Size:</strong> {formatFileSize(document.fileSize)}</span>
                        <span className="ml-4"><strong>Uploaded by:</strong> {document.uploadedBy}</span>
                      </div>

                      {document.description && (
                        <div className="text-sm text-gray-700 mb-3">
                          <span className="font-medium">Description:</span> {document.description}
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(document.id)}
                        className="text-blue-600 hover:text-blue-700 border-blue-300 hover:border-blue-400"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(document.id)}
                        className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}