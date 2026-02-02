"use client"

import { useEffect, useState } from "react"
import { Button } from "./ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "./ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "./ui/select"
import { Textarea } from "./ui/textarea"
import { showToast } from "@/lib/toast-utils"
import { X } from "lucide-react"

interface RejectedAttendance {
    id: string
    employeeId: string
    employeeName: string
}

export function ReEnableClockInDialog({ adminId }: { adminId: string }) {
    const [attendanceId, setAttendanceId] = useState("")
    const [reason, setReason] = useState("")
    const [rejectedAttendances, setRejectedAttendances] = useState<RejectedAttendance[]>([])
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)

    useEffect(() => {
        if (!open) return

        const API_BASE =
            process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001/api/v1"

        fetch(`${API_BASE}/attendance/admin/rejected`, { credentials: "include" })
            .then(res => res.json())
            .then(data => setRejectedAttendances(data.data || []))
            .catch(() => showToast.error("Failed to load rejected attendances"))
    }, [open])

    const handleReEnable = async () => {
        if (!attendanceId) {
            showToast.error("Please select an employee")
            return
        }

        setLoading(true)
        try {
            const API_BASE =
                process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001/api/v1"

            const res = await fetch(`${API_BASE}/attendance/admin/re-enable`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ attendanceId, adminId, reason })
            })

            const data = await res.json()

            if (data.success) {
                showToast.success(data.message)
                setOpen(false)
                setAttendanceId("")
                setReason("")
            } else {
                showToast.error(data.message)
            }
        } catch {
            showToast.error("Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-red-600 hover:bg-red-700 text-white">
                    Re-Enable Clock-In
                </Button>
            </DialogTrigger>



            {/* modal content above the overlay */}
            <DialogContent
                className="
    fixed
    top-1/2 left-1/2
    -translate-x-1/2 -translate-y-1/2
    z-50
    bg-white
    rounded-lg
    shadow-xl
    p-6
    w-[520px]
    max-w-[90vw]
  "
            >
                <DialogHeader className="px-0 pb-2">
                    <DialogTitle className="text-lg font-medium">
                        Re-Enable Employee Clock-In
                    </DialogTitle>
                </DialogHeader>

                <div className="mt-3">
                    <Select value={attendanceId} onValueChange={setAttendanceId}>
                        <SelectTrigger className="w-full h-10 rounded-md border border-gray-300 px-3">
                            <SelectValue placeholder="Select Employee" />
                        </SelectTrigger>
                        <SelectContent className="max-h-48 overflow-auto">
                            {rejectedAttendances.length === 0 ? (
                                <SelectItem value="no-data" disabled>
                                    No rejected attendances
                                </SelectItem>
                            ) : (
                                rejectedAttendances.map((a) => (
                                    <SelectItem key={a.id} value={a.id}>
                                        {a.employeeName} ({a.employeeId})
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                </div>

                <div className="mt-4">
                    <Textarea
                        placeholder="Reason (optional)"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="min-h-[84px] rounded-md border border-gray-200 p-3 resize-none"
                    />
                </div>

                <div className="mt-5">
                    <button
                        onClick={handleReEnable}
                        disabled={loading}
                        className="w-full bg-black hover:opacity-95 disabled:opacity-60 text-white py-2 rounded-md"
                    >
                        {loading ? "Re-enabling..." : "Re-Enable Clock-In"}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
