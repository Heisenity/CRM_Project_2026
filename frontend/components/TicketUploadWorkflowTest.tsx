import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Download,
  Ticket as TicketIcon,
  User,
  Building
} from 'lucide-react'
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch'
import { showToast } from '@/lib/toast-utils'

// Comprehensive test for ticket upload workflow
export function TicketUploadWorkflowTest() {
  const { authenticatedFetch } = useAuthenticatedFetch()
  const [testResults, setTestResults] = React.useState<any>({})
  const [testing, setTesting] = React.useState(false)

  const runUploadTest = async () => {
    setTesting(true)
    const results: any = {}

    try {
      // Test 1: Check upload endpoint accessibility
      console.log('🧪 Testing upload endpoint accessibility...')
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/upload`, {
          method: 'OPTIONS'
        })
        results.endpointAccessible = {
          success: true,
          status: response.status,
          message: 'Upload endpoint is accessible'
        }
      } catch (error) {
        results.endpointAccessible = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }

      // Test 2: Test file upload with mock file
      console.log('🧪 Testing file upload...')
      try {
        // Create a mock text file
        const mockFile = new File(['This is a test file for ticket upload'], 'test-ticket-file.txt', {
          type: 'text/plain'
        })

        const formData = new FormData()
        formData.append('file', mockFile)

        const uploadResponse = await authenticatedFetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/upload`, {
          method: 'POST',
          body: formData
        })

        const uploadResult = await uploadResponse.json()
        
        if (uploadResponse.ok && uploadResult.success) {
          results.fileUpload = {
            success: true,
            data: uploadResult.data,
            message: 'File uploaded successfully'
          }

          // Test 3: Test file download
          console.log('🧪 Testing file download...')
          try {
            const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.replace('/api/v1', '') || 'http://localhost:3001'
            const downloadUrl = `${baseUrl}${uploadResult.data.url}`
            
            const downloadResponse = await fetch(downloadUrl)
            results.fileDownload = {
              success: downloadResponse.ok,
              status: downloadResponse.status,
              message: downloadResponse.ok ? 'File is downloadable' : 'File download failed'
            }
          } catch (error) {
            results.fileDownload = {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          }
        } else {
          results.fileUpload = {
            success: false,
            error: uploadResult.error || 'Upload failed'
          }
        }
      } catch (error) {
        results.fileUpload = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }

      // Test 4: Test ticket creation with attachment
      console.log('🧪 Testing ticket creation with attachment...')
      if (results.fileUpload?.success) {
        try {
          const ticketData = {
            title: 'Test Ticket with Attachment',
            description: 'This is a test ticket created to verify file upload functionality',
            category: 'SOFTWARE',
            priority: 'MEDIUM',
            department: 'IT Support',
            attachments: [{
              fileName: 'test-ticket-file.txt',
              fileSize: 45,
              mimeType: 'text/plain',
              filePath: results.fileUpload.data.url
            }]
          }

          const ticketResponse = await authenticatedFetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tickets`, {
            method: 'POST',
            body: JSON.stringify(ticketData)
          })

          const ticketResult = await ticketResponse.json()
          
          if (ticketResponse.ok && ticketResult.success) {
            results.ticketCreation = {
              success: true,
              data: ticketResult.data,
              message: 'Ticket created successfully with attachment'
            }

            // Test 5: Verify ticket has attachment
            console.log('🧪 Verifying ticket attachment...')
            try {
              const ticketDetailResponse = await authenticatedFetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/tickets/${ticketResult.data.id}`
              )
              const ticketDetail = await ticketDetailResponse.json()
              
              if (ticketDetailResponse.ok && ticketDetail.success) {
                const hasAttachments = ticketDetail.data.attachments && ticketDetail.data.attachments.length > 0
                results.attachmentVerification = {
                  success: hasAttachments,
                  attachmentCount: ticketDetail.data.attachments?.length || 0,
                  message: hasAttachments ? 'Ticket attachment verified' : 'No attachments found on ticket'
                }
              } else {
                results.attachmentVerification = {
                  success: false,
                  error: 'Failed to fetch ticket details'
                }
              }
            } catch (error) {
              results.attachmentVerification = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            }
          } else {
            results.ticketCreation = {
              success: false,
              error: ticketResult.error || 'Ticket creation failed'
            }
          }
        } catch (error) {
          results.ticketCreation = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      }

      setTestResults(results)
      
      // Show overall result
      const allTestsPassed = Object.values(results).every((result: any) => result.success)
      if (allTestsPassed) {
        showToast.success('All upload tests passed! ✅')
      } else {
        showToast.error('Some upload tests failed. Check results below.')
      }

    } catch (error) {
      console.error('Test suite error:', error)
      showToast.error('Test suite failed to run')
    } finally {
      setTesting(false)
    }
  }

  const TestResult = ({ title, result }: { title: string; result: any }) => (
    <div className="p-3 border rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        {result.success ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <AlertCircle className="h-4 w-4 text-red-600" />
        )}
        <span className={`font-medium ${result.success ? 'text-green-700' : 'text-red-700'}`}>
          {title}
        </span>
        <Badge className={result.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
          {result.success ? 'PASS' : 'FAIL'}
        </Badge>
      </div>
      
      {result.message && (
        <p className="text-sm text-muted-foreground mb-1">{result.message}</p>
      )}
      
      {result.error && (
        <p className="text-sm text-red-600 mb-1">Error: {result.error}</p>
      )}
      
      {result.data && (
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer">View Details</summary>
          <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </details>
      )}
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TicketIcon className="h-5 w-5 text-blue-600" />
            Ticket Upload Workflow Test Suite
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              This comprehensive test verifies the complete ticket file upload workflow:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium">Tests Performed:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Upload endpoint accessibility</li>
                  <li>• File upload functionality</li>
                  <li>• File download verification</li>
                  <li>• Ticket creation with attachment</li>
                  <li>• Attachment persistence verification</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">What This Tests:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Backend upload endpoint</li>
                  <li>• File storage system</li>
                  <li>• Static file serving</li>
                  <li>• Database attachment storage</li>
                  <li>• End-to-end workflow</li>
                </ul>
              </div>
            </div>

            <Button 
              onClick={runUploadTest}
              disabled={testing}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {testing ? (
                <>
                  <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin mr-2" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Run Upload Workflow Tests
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {Object.keys(testResults).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.endpointAccessible && (
                <TestResult title="Upload Endpoint Accessibility" result={testResults.endpointAccessible} />
              )}
              
              {testResults.fileUpload && (
                <TestResult title="File Upload" result={testResults.fileUpload} />
              )}
              
              {testResults.fileDownload && (
                <TestResult title="File Download" result={testResults.fileDownload} />
              )}
              
              {testResults.ticketCreation && (
                <TestResult title="Ticket Creation with Attachment" result={testResults.ticketCreation} />
              )}
              
              {testResults.attachmentVerification && (
                <TestResult title="Attachment Verification" result={testResults.attachmentVerification} />
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}