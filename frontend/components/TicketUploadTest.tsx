import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch'
import { showToast } from '@/lib/toast-utils'

// Test component to verify ticket file upload functionality
export function TicketUploadTest() {
  const { authenticatedFetch } = useAuthenticatedFetch()
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [uploading, setUploading] = React.useState(false)
  const [uploadResult, setUploadResult] = React.useState<any>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        showToast.error('File is too large. Maximum size is 10MB.')
        return
      }
      setSelectedFile(file)
      setUploadResult(null)
    }
  }

  const testUpload = async () => {
    if (!selectedFile) {
      showToast.error('Please select a file first')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      
      console.log('Testing upload with:', {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type
      })

      const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/upload`, {
        method: 'POST',
        body: formData
      })

      console.log('Upload response status:', response.status)
      const result = await response.json()
      console.log('Upload response:', result)

      if (response.ok && result.success) {
        setUploadResult(result)
        showToast.success('File uploaded successfully!')
      } else {
        throw new Error(result.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      showToast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setUploadResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setUploading(false)
    }
  }

  const testDownload = async () => {
    if (!uploadResult?.data?.filename) {
      showToast.error('No file to download')
      return
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.replace('/api/v1', '') || 'http://localhost:3001'
      const downloadUrl = `${baseUrl}/uploads/tickets/${uploadResult.data.filename}`
      
      console.log('Testing download from:', downloadUrl)
      
      // Test if file is accessible
      const response = await fetch(downloadUrl)
      if (response.ok) {
        // Create download link
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = uploadResult.data.originalName || uploadResult.data.filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        showToast.success('Download started!')
      } else {
        throw new Error(`File not accessible: ${response.status}`)
      }
    } catch (error) {
      console.error('Download error:', error)
      showToast.error(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" />
            Ticket File Upload Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="test-file">Select Test File</Label>
              <Input
                id="test-file"
                type="file"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Supported: PDF, Word, Excel, Text, Images (max 10MB)
              </p>
            </div>

            {selectedFile && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="font-medium text-sm">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                onClick={testUpload}
                disabled={!selectedFile || uploading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Test Upload
                  </>
                )}
              </Button>

              {uploadResult?.data && (
                <Button 
                  onClick={testDownload}
                  variant="outline"
                  className="border-green-300 text-green-600 hover:bg-green-50"
                >
                  Test Download
                </Button>
              )}
            </div>
          </div>

          {uploadResult && (
            <div className="space-y-3">
              <h3 className="font-medium">Upload Result:</h3>
              {uploadResult.error ? (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-red-700 font-medium">Upload Failed</span>
                  </div>
                  <p className="text-red-600 text-sm mt-1">{uploadResult.error}</p>
                </div>
              ) : (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-green-700 font-medium">Upload Successful</span>
                  </div>
                  <div className="text-sm space-y-1">
                    <p><strong>File URL:</strong> {uploadResult.data.url}</p>
                    <p><strong>Original Name:</strong> {uploadResult.data.originalName}</p>
                    <p><strong>File Size:</strong> {uploadResult.data.size} bytes</p>
                    <p><strong>MIME Type:</strong> {uploadResult.data.mimetype}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>Test Process:</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Select a file (PDF, Word, Excel, Text, or Image)</li>
              <li>Click "Test Upload" to upload to backend</li>
              <li>If successful, click "Test Download" to verify file access</li>
              <li>Check browser console for detailed logs</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}