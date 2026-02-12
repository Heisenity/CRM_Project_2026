"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, FileText, X } from "lucide-react"
import { showToast } from "@/lib/toast-utils"
import { uploadPetrolBillToS3 } from "@/lib/s3-upload"
import { useAuthenticatedFetch } from "@/hooks/useAuthenticatedFetch"

interface PetrolBillUploaderProps {
  employeeId: string
  currentVehicleId?: string
  onUploadSuccess?: () => void
}

interface VehicleOption {
  id: string
  label: string
}

export function PetrolBillUploader({ employeeId, currentVehicleId, onUploadSuccess }: PetrolBillUploaderProps) {
  const [selectedVehicleId, setSelectedVehicleId] = useState(currentVehicleId || "")
  const [vehicleOptions, setVehicleOptions] = useState<VehicleOption[]>([])
  const [loadingVehicles, setLoadingVehicles] = useState(true)
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState("")
  const [description, setDescription] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const { authenticatedFetch } = useAuthenticatedFetch()

  useEffect(() => {
    let cancelled = false

    const loadVehicles = async () => {
      try {
        setLoadingVehicles(true)
        const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/vehicles`)
        const result = await response.json()

        if (!cancelled && result?.success && Array.isArray(result.data)) {
          const options: VehicleOption[] = result.data.map((vehicle: any) => ({
            id: vehicle.id,
            label: `${vehicle.vehicleNumber} - ${vehicle.make} ${vehicle.model}`
          }))
          setVehicleOptions(options)
        }
      } catch (error) {
        console.error("Failed to load vehicles:", error)
      } finally {
        if (!cancelled) {
          setLoadingVehicles(false)
        }
      }
    }

    loadVehicles()
    return () => {
      cancelled = true
    }
  }, [authenticatedFetch])

  useEffect(() => {
    if (currentVehicleId && !selectedVehicleId) {
      setSelectedVehicleId(currentVehicleId)
    }
  }, [currentVehicleId, selectedVehicleId])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"]
    if (!validTypes.includes(file.type)) {
      showToast.error("Please select a valid image (JPG, PNG, WEBP) or PDF file")
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast.error("File size must be less than 5MB")
      return
    }

    setSelectedFile(file)

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setPreviewUrl(null)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedVehicleId || !amount || !date || !selectedFile) {
      showToast.error("Please fill in all required fields and select a file")
      return
    }

    if (parseFloat(amount) <= 0) {
      showToast.error("Amount must be greater than 0")
      return
    }

    setUploading(true)

    try {
      // Upload file to S3
      const imageUrl = await uploadPetrolBillToS3(selectedFile, employeeId)

      // Create petrol bill record
      const response = await authenticatedFetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/petrol-bills`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            vehicleId: selectedVehicleId,
            employeeId,
            amount: parseFloat(amount),
            date,
            imageUrl,
            description: description.trim() || undefined,
          }),
        }
      )

      const result = await response.json()

      if (result.success) {
        showToast.success("Petrol bill submitted successfully")
        // Reset form
        setAmount("")
        setDate("")
        setDescription("")
        setSelectedFile(null)
        setPreviewUrl(null)
        onUploadSuccess?.()
      } else {
        throw new Error(result.error || "Failed to submit petrol bill")
      }
    } catch (error: any) {
      console.error("Petrol bill upload error:", error)
      showToast.error(error.message || "Failed to submit petrol bill")
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-blue-500" />
          Submit Petrol Bill
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="vehicleId">
              Vehicle <span className="text-red-500">*</span>
            </Label>
            <select
              id="vehicleId"
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm"
              disabled={loadingVehicles}
              required
            >
              <option value="">
                {loadingVehicles ? "Loading vehicles..." : "Select vehicle"}
              </option>
              {vehicleOptions.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.label}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">
              Amount <span className="text-red-500">*</span>
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">
              Date <span className="text-red-500">*</span>
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add any notes about this bill..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="file">
              Bill Image/PDF <span className="text-red-500">*</span>
            </Label>
            {!selectedFile ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  id="file"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <label htmlFor="file" className="cursor-pointer">
                  <Upload className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    Click to upload bill image or PDF
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    JPG, PNG, WEBP or PDF (max 5MB)
                  </p>
                </label>
              </div>
            ) : (
              <div className="border rounded-lg p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {previewUrl && (
                      <img
                        src={previewUrl}
                        alt="Bill preview"
                        className="w-full max-w-xs rounded mb-2"
                      />
                    )}
                    <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveFile}
                    className="flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={uploading || !selectedVehicleId || !amount || !date || !selectedFile}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {uploading ? "Submitting..." : "Submit Petrol Bill"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
