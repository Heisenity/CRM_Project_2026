"use client"

import React, { useState } from "react"
import { useSession } from "next-auth/react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "@/hooks/use-toast"
import { Upload, FileText, X } from "lucide-react"

interface TenderDocumentUploadProps {
  tenderId: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const DOCUMENT_TYPES = [
  { value: "TECHNICAL_SPECIFICATION", label: "Technical Specification" },
  { value: "FINANCIAL_PROPOSAL", label: "Financial Proposal" },
  { value: "COMPANY_PROFILE", label: "Company Profile" },
  { value: "COMPLIANCE_CERTIFICATE", label: "Compliance Certificate" },
  { value: "EMD_PROOF", label: "EMD Proof" },
  { value: "TENDER_FORM", label: "Tender Form" },
  { value: "OTHER", label: "Other" },
]

export default function TenderDocumentUpload({
  tenderId,
  isOpen,
  onClose,
  onSuccess,
}: TenderDocumentUploadProps) {
  const { data: session } = useSession()

  const [file, setFile] = useState<File | null>(null)
  const [documentType, setDocumentType] = useState("")
  const [isRequired, setIsRequired] = useState(false)
  const [uploading, setUploading] = useState(false)

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL!

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    const allowed = [
      ".pdf",
      ".doc",
      ".docx",
      ".xls",
      ".xlsx",
      ".jpg",
      ".jpeg",
      ".png",
    ]

    const ext = selectedFile.name
      .toLowerCase()
      .substring(selectedFile.name.lastIndexOf("."))

    if (!allowed.includes(ext)) {
      toast({
        title: "Invalid File Type",
        description: "Unsupported file format",
        variant: "destructive",
      })
      return
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Max size is 10MB",
        variant: "destructive",
      })
      return
    }

    setFile(selectedFile)
  }

  const handleUpload = async () => {
    if (!file || !documentType) {
      toast({
        title: "Missing Information",
        description: "Please select a file and document type",
        variant: "destructive",
      })
      return
    }

    setUploading(true)

    try {
      // 1️⃣ Ask backend for presigned URL
      const presignRes = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/tenders/${tenderId}/documents/presign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" , 
          Authorization: `Bearer ${(session?.user as any)?.sessionToken}`
        },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            tenderId,
          }),
        }
      )

      const presignData = await presignRes.json()
      if (!presignData.success) {
        throw new Error("Failed to get upload URL")
      }

      // 2️⃣ Upload directly to S3
      const uploadRes = await fetch(presignData.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      })

      if (!uploadRes.ok) {
        throw new Error("S3 upload failed")
      }

      // 3️⃣ Save metadata ONLY (no file)
      const saveRes = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/tenders/${tenderId}/documents`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${(session?.user as any)?.sessionToken}`,
          },
          body: JSON.stringify({
            documentType,
            isRequired,
            fileName: file.name,
            fileUrl: presignData.fileUrl,
            fileSize: file.size,
            mimeType: file.type,
          }),
        }
      )

      const result = await saveRes.json()
      if (!result.success) {
        throw new Error("Failed to save document metadata")
      }

      toast({ title: "Success", description: "Document uploaded successfully" })
      onSuccess()
      onClose()
    } catch (err) {
      console.error(err)
      toast({
        title: "Upload Failed",
        description: "Something went wrong while uploading",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }


  const handleClose = () => {
    setFile(null)
    setDocumentType("")
    setIsRequired(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a document for this tender
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Document File *</Label>
            {!file ? (
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                onChange={handleFileChange}
              />
            ) : (
              <div className="flex justify-between items-center p-2 border rounded">
                <span className="text-sm">{file.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          <div>
            <Label>Document Type *</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((d) => (
                  <SelectItem key={d.value} value={d.value}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              checked={isRequired}
              onCheckedChange={(v) => setIsRequired(Boolean(v))}
            />
            <Label>Mark as required</Label>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={uploading}>
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
