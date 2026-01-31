"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, User, MapPin, CreditCard, DollarSign, Briefcase } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Team {
    id: string
    name: string
    description?: string
}

interface CreateEmployeeFormProps {
    onEmployeeCreated: () => void
}

export default function CreateEmployeeForm({ onEmployeeCreated }: CreateEmployeeFormProps) {
    const { toast } = useToast()
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [teams, setTeams] = useState<Team[]>([])
    const [nextEmployeeId, setNextEmployeeId] = useState('')

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'IN_OFFICE' as 'FIELD_ENGINEER' | 'IN_OFFICE',
        designation: '',
        teamId: 'none',
        isTeamLeader: false,
        salary: '',
        address: '',
        aadharCard: '',
        panCard: '',
        sickLeaveBalance: '12',
        casualLeaveBalance: '12'
    })

    // Fetch teams
    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/teams`)
                const result = await response.json()

                if (result.success) {
                    setTeams(result.data || [])
                }
            } catch (error) {
                console.error('Error fetching teams:', error)
            }
        }

        if (isOpen) {
            fetchTeams()
            fetchNextEmployeeId()
        }
    }, [isOpen, formData.role])

    // Fetch next employee ID
    const fetchNextEmployeeId = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/employees/next-id?role=${formData.role}`)
            const result = await response.json()

            if (result.success) {
                setNextEmployeeId(result.data.nextEmployeeId)
            }
        } catch (error) {
            console.error('Error fetching next employee ID:', error)
        }
    }

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))

        // Fetch new employee ID when role changes
        if (field === 'role') {
            fetchNextEmployeeId()
        }
    }

    const validateForm = () => {
        if (!formData.name.trim()) {
            toast({
                title: "Validation Error",
                description: "Name is required",
                variant: "destructive"
            })
            return false
        }

        if (!formData.email.trim()) {
            toast({
                title: "Validation Error",
                description: "Email is required",
                variant: "destructive"
            })
            return false
        }

        if (!formData.password.trim()) {
            toast({
                title: "Validation Error",
                description: "Password is required",
                variant: "destructive"
            })
            return false
        }

        // Validate Aadhar card format (12 digits)
        if (formData.aadharCard && !/^\d{12}$/.test(formData.aadharCard)) {
            toast({
                title: "Validation Error",
                description: "Aadhar card must be 12 digits",
                variant: "destructive"
            })
            return false
        }

        // Validate PAN card format (5 letters, 4 digits, 1 letter)
        if (formData.panCard && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.panCard)) {
            toast({
                title: "Validation Error",
                description: "PAN card format should be like ABCDE1234F",
                variant: "destructive"
            })
            return false
        }

        if (!formData.designation.trim()) {
            toast({
                title: "Validation Error",
                description: "Designation is required",
                variant: "destructive"
            })
            return false
        }


        return true
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validateForm()) return

        setLoading(true)
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/employees`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    salary: formData.salary ? parseFloat(formData.salary) : null,
                    teamId: formData.teamId === 'none' ? null : formData.teamId || null,
                    sickLeaveBalance: parseInt(formData.sickLeaveBalance),
                    casualLeaveBalance: parseInt(formData.casualLeaveBalance)
                })
            })

            const result = await response.json()

            if (result.success) {
                toast({
                    title: "Success",
                    description: "Employee created successfully"
                })

                // Reset form
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    password: '',
                    role: 'IN_OFFICE',
                    designation: '',
                    teamId: 'none',
                    isTeamLeader: false,
                    salary: '',
                    address: '',
                    aadharCard: '',
                    panCard: '',
                    sickLeaveBalance: '12',
                    casualLeaveBalance: '12'
                })

                setIsOpen(false)
                onEmployeeCreated()
            } else {
                toast({
                    title: "Error",
                    description: result.error || "Failed to create employee",
                    variant: "destructive"
                })
            }
        } catch (error) {
            console.error('Error creating employee:', error)
            toast({
                title: "Error",
                description: "Failed to create employee",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Employee
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">Create New Employee</DialogTitle>
                    <DialogDescription>
                        Add a new field engineer or office staff member to the system
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Basic Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        placeholder="Enter full name"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        placeholder="Enter email address"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                        placeholder="Enter phone number"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password *</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => handleInputChange('password', e.target.value)}
                                        placeholder="Enter password"
                                        required
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Role & Team Information */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Briefcase className="h-5 w-5" />
                                Role & Team Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="role">Employee Role *</Label>
                                    <Select value={formData.role} onValueChange={(value: string) => handleInputChange('role', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="FIELD_ENGINEER">Field Engineer</SelectItem>
                                            <SelectItem value="IN_OFFICE">In-Office Staff</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {nextEmployeeId && (
                                        <div className="text-sm text-muted-foreground">
                                            Next Employee ID: <Badge variant="outline" className="font-mono">{nextEmployeeId}</Badge>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="team">Team</Label>
                                    <Select value={formData.teamId} onValueChange={(value: string) => handleInputChange('teamId', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select team (optional)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">No Team</SelectItem>
                                            {teams.map((team) => (
                                                <SelectItem key={team.id} value={team.id}>
                                                    {team.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="designation">Designation *</Label>
                                    <Input
                                        id="designation"
                                        value={formData.designation}
                                        onChange={(e) => handleInputChange('designation', e.target.value)}
                                        placeholder="e.g. Senior Engineer, HR Executive"
                                        required
                                    />
                                </div>

                            </div>
                        </CardContent>
                    </Card>

                    {/* Financial Information */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <DollarSign className="h-5 w-5" />
                                Financial Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="salary">Monthly Salary (₹)</Label>
                                    <Input
                                        id="salary"
                                        type="number"
                                        value={formData.salary}
                                        onChange={(e) => handleInputChange('salary', e.target.value)}
                                        placeholder="Enter monthly salary"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sickLeave">Sick Leave Balance</Label>
                                    <Input
                                        id="sickLeave"
                                        type="number"
                                        value={formData.sickLeaveBalance}
                                        onChange={(e) => handleInputChange('sickLeaveBalance', e.target.value)}
                                        min="0"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="casualLeave">Casual Leave Balance</Label>
                                    <Input
                                        id="casualLeave"
                                        type="number"
                                        value={formData.casualLeaveBalance}
                                        onChange={(e) => handleInputChange('casualLeaveBalance', e.target.value)}
                                        min="0"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Personal Information */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                Personal Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Textarea
                                    id="address"
                                    value={formData.address}
                                    onChange={(e) => handleInputChange('address', e.target.value)}
                                    placeholder="Enter complete address"
                                    rows={3}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Identity Documents */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Identity Documents
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="aadhar">Aadhar Card Number</Label>
                                    <Input
                                        id="aadhar"
                                        value={formData.aadharCard}
                                        onChange={(e) => handleInputChange('aadharCard', e.target.value)}
                                        placeholder="Enter 12-digit Aadhar number"
                                        maxLength={12}
                                        className="font-mono"
                                    />
                                    <div className="text-xs text-muted-foreground">
                                        Format: 12 digits (e.g., 123456789012)
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pan">PAN Card Number</Label>
                                    <Input
                                        id="pan"
                                        value={formData.panCard}
                                        onChange={(e) => handleInputChange('panCard', e.target.value.toUpperCase())}
                                        placeholder="Enter PAN number"
                                        maxLength={10}
                                        className="font-mono"
                                    />
                                    <div className="text-xs text-muted-foreground">
                                        Format: ABCDE1234F (5 letters, 4 digits, 1 letter)
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Separator />

                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Creating...' : 'Create Employee'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}