"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmployeeAvatar } from "@/components/EmployeeAvatar"
import EmployeeIdPrefixManagement from "@/components/EmployeeIdPrefixManagement"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { 
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
    Users, 
    Search, 
    Eye,
    EyeOff,
    Shield,
    Briefcase,
    Building,
    Plus,
    RefreshCw,
    MoreVertical,
    Edit,
    Trash2,
    Upload,
    Camera
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from 'next/navigation'
import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch'
import { uploadEmployeePhotoToS3 } from "@/lib/s3-upload"

interface Employee {
    id: string
    name: string
    employeeId: string
    email: string
    phone?: string
    role: 'FIELD_ENGINEER' | 'IN_OFFICE'
    teamId?: string
    team?: {
        id: string
        name: string
    }
    isTeamLeader: boolean
    sickLeaveBalance: number
    casualLeaveBalance: number
    salary?: number
    address?: string
    aadharCard?: string
    panCard?: string
    photoUrl?: string
    photoKey?: string
    uanNumber?: string
    esiNumber?: string
    bankAccountNumber?: string
    designation?: string
    createdAt: string
    updatedAt: string
}

interface Admin {
    id: string
    name: string
    adminId: string
    email: string
    phone?: string
    status: string
    createdAt: string
    updatedAt: string
}

export default function EmployeeManagement() {
    const { toast } = useToast()
    const router = useRouter()
    const { authenticatedFetch } = useAuthenticatedFetch()
    const [employees, setEmployees] = useState<Employee[]>([])
    const [admins, setAdmins] = useState<Admin[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [roleFilter, setRoleFilter] = useState<string>('all')
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
    const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null)
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
    const [isEditEmployeeDialogOpen, setIsEditEmployeeDialogOpen] = useState(false)
    const [isEditAdminDialogOpen, setIsEditAdminDialogOpen] = useState(false)
    const [activeTab, setActiveTab] = useState('employees')
    const [refreshing, setRefreshing] = useState(false)
    const [teams, setTeams] = useState<any[]>([])
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
    const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null)

    const fetchEmployees = useCallback(async () => {
        try {
            const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/employees`)
            const result = await response.json()
            
            if (result.success) {
                setEmployees(result.data.employees || [])
            } else {
                toast({
                    title: "Error",
                    description: "Failed to fetch employees",
                    variant: "destructive"
                })
            }
        } catch (error) {
            console.error('Error fetching employees:', error)
            toast({
                title: "Error",
                description: "Failed to fetch employees",
                variant: "destructive"
            })
        }
    }, [authenticatedFetch, toast])

    const fetchAdmins = useCallback(async () => {
        try {
            console.log('Fetching admins from:', `${process.env.NEXT_PUBLIC_BACKEND_URL}/admins`)
            
            const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/admins`)
            const result = await response.json()
            
            console.log('Admin fetch response:', result)
            
            if (result.success) {
                setAdmins(result.data || [])
                console.log('Admins set:', result.data || [])
            } else {
                console.error('Admin fetch failed:', result.error)
                // Don't show error toast for unauthorized access, as it might be expected
                if (response.status !== 401 && response.status !== 403) {
                    toast({
                        title: "Error",
                        description: "Failed to fetch administrators",
                        variant: "destructive"
                    })
                }
            }
        } catch (error) {
            console.error('Error fetching admins:', error)
            toast({
                title: "Error",
                description: "Failed to fetch administrators",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }, [authenticatedFetch, toast])

    const fetchTeams = useCallback(async () => {
        try {
            const response = await authenticatedFetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/teams`)
            const result = await response.json()
            
            if (result.success) {
                setTeams(result.data || [])
            }
        } catch (error) {
            console.error('Error fetching teams:', error)
        }
    }, [authenticatedFetch])

    // Fetch data
    useEffect(() => {
        fetchEmployees()
        fetchAdmins()
        fetchTeams()
    }, [fetchEmployees, fetchAdmins, fetchTeams])

    // Refresh data when returning to this page
    useEffect(() => {
        const handleFocus = () => {
            if (!refreshing && !loading) {
                fetchEmployees()
                fetchAdmins()
            }
        }

        window.addEventListener('focus', handleFocus)
        return () => window.removeEventListener('focus', handleFocus)
    }, [refreshing, loading, fetchEmployees, fetchAdmins])

    // Filter employees
    const filteredEmployees = employees.filter(employee => {
        const matchesSearch = 
            employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            employee.email.toLowerCase().includes(searchTerm.toLowerCase())
        
        const matchesRole = roleFilter === 'all' || employee.role === roleFilter
        
        return matchesSearch && matchesRole
    })

    // Filter admins
    const filteredAdmins = admins.filter(admin => {
        const matchesSearch = 
            admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            admin.adminId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            admin.email.toLowerCase().includes(searchTerm.toLowerCase())
        
        return matchesSearch
    })

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'FIELD_ENGINEER':
                return 'bg-blue-100 text-blue-700 border-blue-200'
            case 'IN_OFFICE':
                return 'bg-green-100 text-green-700 border-green-200'
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200'
        }
    }

    const formatRole = (role: string) => {
        switch (role) {
            case 'FIELD_ENGINEER':
                return 'Field Engineer'
            case 'IN_OFFICE':
                return 'In-Office Staff'
            default:
                return role
        }
    }

    const handleRefresh = useCallback(async () => {
        setRefreshing(true)
        try {
            await Promise.all([fetchEmployees(), fetchAdmins()])
            toast({
                title: "Success",
                description: "Employee data refreshed successfully"
            })
        } catch (error) {
            toast({
                title: "Error", 
                description: "Failed to refresh data",
                variant: "destructive"
            })
        } finally {
            setRefreshing(false)
        }
    }, [fetchEmployees, fetchAdmins, toast, authenticatedFetch])

    const handleViewEmployee = (employee: Employee) => {
        setSelectedEmployee(employee)
        setIsViewDialogOpen(true)
    }

    const handleEditEmployee = (employee: Employee) => {
        setEditingEmployee(employee)
        setIsEditEmployeeDialogOpen(true)
    }

    const handleDeleteEmployee = async (employee: Employee) => {
        if (!confirm(`Are you sure you want to delete ${employee.name}? This action cannot be undone.`)) {
            return
        }

        try {
            const response = await authenticatedFetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/employees/${employee.id}`,
                {
                    method: 'DELETE'
                }
            )

            if (response.ok) {
                toast({
                    title: "Success",
                    description: `Employee ${employee.name} has been deleted successfully`
                })
                // Refresh the employee list
                fetchEmployees()
            } else {
                throw new Error('Failed to delete employee')
            }
        } catch (error) {
            console.error('Error deleting employee:', error)
            toast({
                title: "Error",
                description: "Failed to delete employee",
                variant: "destructive"
            })
        }
    }

    const handleViewAdmin = (admin: Admin) => {
        // TODO: Implement admin view functionality
        toast({
            title: "View Administrator",
            description: `View details for ${admin.name} will be implemented soon`,
        })
    }

    const handleEditAdmin = (admin: Admin) => {
        setEditingAdmin(admin)
        setIsEditAdminDialogOpen(true)
    }

    const handleDeleteAdmin = async (admin: Admin) => {
        if (!confirm(`Are you sure you want to delete administrator ${admin.name}? This action cannot be undone.`)) {
            return
        }

        try {
            const response = await authenticatedFetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/admins/${admin.id}`,
                {
                    method: 'DELETE'
                }
            )

            if (response.ok) {
                toast({
                    title: "Success",
                    description: `Administrator ${admin.name} has been deleted successfully`
                })
                // Refresh the admin list
                fetchAdmins()
            } else {
                throw new Error('Failed to delete administrator')
            }
        } catch (error) {
            console.error('Error deleting administrator:', error)
            toast({
                title: "Error",
                description: "Failed to delete administrator",
                variant: "destructive"
            })
        }
    }

    const handleUpdateEmployee = async (updatedData: any) => {
        if (!editingEmployee) return

        try {
            const response = await authenticatedFetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/employees/${editingEmployee.id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updatedData)
                }
            )

            const result = await response.json()

            if (result.success) {
                toast({
                    title: "Success",
                    description: `Employee ${editingEmployee.name} has been updated successfully`
                })
                setIsEditEmployeeDialogOpen(false)
                setEditingEmployee(null)
                fetchEmployees()
            } else {
                throw new Error(result.error || 'Failed to update employee')
            }
        } catch (error) {
            console.error('Error updating employee:', error)
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update employee",
                variant: "destructive"
            })
        }
    }

    const handleUpdateAdmin = async (updatedData: any) => {
        if (!editingAdmin) return

        try {
            const response = await authenticatedFetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/admins/${editingAdmin.id}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(updatedData)
                }
            )

            const result = await response.json()

            if (result.success) {
                toast({
                    title: "Success",
                    description: `Administrator ${editingAdmin.name} has been updated successfully`
                })
                setIsEditAdminDialogOpen(false)
                setEditingAdmin(null)
                fetchAdmins()
            } else {
                throw new Error(result.error || 'Failed to update administrator')
            }
        } catch (error) {
            console.error('Error updating admin:', error)
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update administrator",
                variant: "destructive"
            })
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading employees...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-foreground">Employee Management</h1>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </Button>
                    <Button 
                        className="gap-2"
                        onClick={() => router.push('/employees/new')}
                    >
                        <Plus className="h-4 w-4" />
                        Add Employee
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Employees</p>
                                <p className="text-2xl font-bold">{employees.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Briefcase className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Field Engineers</p>
                                <p className="text-2xl font-bold">
                                    {employees.filter(e => e.role === 'FIELD_ENGINEER').length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Building className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">In-Office Staff</p>
                                <p className="text-2xl font-bold">
                                    {employees.filter(e => e.role === 'IN_OFFICE').length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Shield className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Administrators</p>
                                <p className="text-2xl font-bold">{admins.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                                <Users className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Staff</p>
                                <p className="text-2xl font-bold">
                                    {employees.length + admins.length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="shadow-sm">
                <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1 min-w-0">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name, ID, or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 h-10"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                            <div className="min-w-0">
                                <Select value={roleFilter} onValueChange={setRoleFilter}>
                                    <SelectTrigger className="w-full sm:w-48 h-10">
                                        <SelectValue placeholder="Filter by role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Roles</SelectItem>
                                        <SelectItem value="FIELD_ENGINEER">Field Engineer</SelectItem>
                                        <SelectItem value="IN_OFFICE">In-Office Staff</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Employee Tables */}
            <div className="space-y-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                        <TabsTrigger value="employees" className="text-sm font-medium">
                            Employees ({employees.length})
                        </TabsTrigger>
                        <TabsTrigger value="admins" className="text-sm font-medium">
                            Administrators ({admins.length})
                        </TabsTrigger>
                        <TabsTrigger value="prefixes" className="text-sm font-medium">
                            ID Prefixes
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="employees" className="space-y-4">
                        <Card className="shadow-sm border-0">
                            <CardHeader className="pb-6 px-6 pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-xl font-semibold">Employees</CardTitle>
                                        <CardDescription className="mt-1">
                                            Field engineers and in-office staff members
                                        </CardDescription>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {filteredEmployees.length} of {employees.length} employees
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="px-0 pb-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-b bg-muted/30">
                                                <TableHead className="font-semibold text-foreground px-6 py-4">Employee</TableHead>
                                                <TableHead className="font-semibold text-foreground py-4">ID</TableHead>
                                                <TableHead className="font-semibold text-foreground py-4">Role & Position</TableHead>
                                                <TableHead className="font-semibold text-foreground py-4">Team</TableHead>
                                                <TableHead className="font-semibold text-foreground py-4">Contact</TableHead>
                                                <TableHead className="font-semibold text-foreground py-4">Salary</TableHead>
                                                <TableHead className="font-semibold text-foreground py-4">Leave Balance</TableHead>
                                                <TableHead className="font-semibold text-foreground py-4">Joined</TableHead>
                                                <TableHead className="font-semibold text-foreground py-4 pr-6">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                        {filteredEmployees.map((employee, index) => (
                                            <TableRow 
                                                key={employee.id} 
                                                className={`hover:bg-muted/50 transition-colors border-b ${
                                                    index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                                                }`}
                                            >
                                                <TableCell className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <EmployeeAvatar 
                                                            photoUrl={employee.photoUrl}
                                                            photoKey={employee.photoKey}
                                                            name={employee.name}
                                                            size="lg"
                                                        />
                                                        <div className="space-y-1">
                                                            <div className="font-semibold text-foreground text-base">{employee.name}</div>
                                                            <div className="text-sm text-muted-foreground">{employee.email}</div>
                                                            <div className="flex items-center gap-2">
                                                                {employee.isTeamLeader && (
                                                                    <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                                                        Team Leader
                                                                    </Badge>
                                                                )}
                                                                <span className="text-xs text-muted-foreground">
                                                                    ID: {employee.employeeId}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="space-y-1">
                                                        <Badge variant="outline" className="font-mono text-xs bg-slate-50 border-slate-200 block w-fit">
                                                            {employee.employeeId}
                                                        </Badge>
                                                        <div className="text-xs text-muted-foreground">
                                                            Employee
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="space-y-2">
                                                        <Badge className={getRoleBadgeColor(employee.role)}>
                                                            {formatRole(employee.role)}
                                                        </Badge>
                                                        <div className="text-xs text-muted-foreground">
                                                            {employee.role === 'FIELD_ENGINEER' ? 'Field Operations' : 'Office Operations'}
                                                        </div>
                                                        {employee.isTeamLeader && (
                                                            <div className="flex items-center gap-1 text-xs text-amber-600">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                                                                Leadership Role
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="space-y-2">
                                                        {employee.team ? (
                                                            <>
                                                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 block w-fit">
                                                                    {employee.team.name}
                                                                </Badge>
                                                                <div className="text-xs text-muted-foreground">
                                                                    Team Member
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span className="text-sm text-muted-foreground italic">Unassigned</span>
                                                                <div className="text-xs text-orange-600">
                                                                    No team assigned
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="space-y-2">
                                                        <div className="text-sm font-medium text-foreground">
                                                            {employee.phone || 'No phone'}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {employee.email}
                                                        </div>
                                                        <div className="flex items-center gap-1 text-xs">
                                                            <div className={`w-2 h-2 rounded-full ${employee.phone ? 'bg-green-400' : 'bg-red-400'}`}></div>
                                                            <span className="text-muted-foreground">
                                                                {employee.phone ? 'Reachable' : 'No contact'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="space-y-2">
                                                        {employee.salary ? (
                                                            <>
                                                                <div className="text-sm font-medium text-foreground">
                                                                    ₹{employee.salary.toLocaleString()}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    Monthly salary
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="text-sm text-muted-foreground italic">
                                                                    Not specified
                                                                </div>
                                                                <div className="text-xs text-orange-600">
                                                                    Salary not set
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                                            <span className="text-sm">
                                                                <span className="font-medium text-foreground">{employee.sickLeaveBalance}</span>
                                                                <span className="text-muted-foreground text-xs ml-1">sick days</span>
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                                            <span className="text-sm">
                                                                <span className="font-medium text-foreground">{employee.casualLeaveBalance}</span>
                                                                <span className="text-muted-foreground text-xs ml-1">casual days</span>
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            Total: {employee.sickLeaveBalance + employee.casualLeaveBalance} days
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="space-y-1">
                                                        <div className="text-sm font-medium text-foreground">
                                                            {new Date(employee.createdAt).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            })}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {Math.floor((new Date().getTime() - new Date(employee.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days ago
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            Last updated: {new Date(employee.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4 pr-6">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 hover:bg-muted"
                                                            >
                                                                <MoreVertical className="h-4 w-4" />
                                                                <span className="sr-only">Open menu</span>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-48">
                                                            <DropdownMenuItem 
                                                                onClick={() => handleViewEmployee(employee)}
                                                                className="cursor-pointer"
                                                            >
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                View More
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem 
                                                                onClick={() => handleEditEmployee(employee)}
                                                                className="cursor-pointer"
                                                            >
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem 
                                                                onClick={() => handleDeleteEmployee(employee)}
                                                                className="cursor-pointer text-red-600 focus:text-red-600"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            {filteredEmployees.length === 0 && (
                                <div className="text-center py-16 px-6">
                                    <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                                        <Users className="h-12 w-12 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-medium text-foreground mb-2">No employees found</h3>
                                    <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="admins" className="space-y-4">
                    <Card className="shadow-sm border-0">
                        <CardHeader className="pb-6 px-6 pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-xl font-semibold">Administrators</CardTitle>
                                    <CardDescription className="mt-1">
                                        System administrators with full access
                                    </CardDescription>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {filteredAdmins.length} of {admins.length} administrators
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="px-0 pb-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-b bg-muted/30">
                                            <TableHead className="font-semibold text-foreground px-6 py-4">Administrator</TableHead>
                                            <TableHead className="font-semibold text-foreground py-4">Admin ID</TableHead>
                                            <TableHead className="font-semibold text-foreground py-4">Contact Info</TableHead>
                                            <TableHead className="font-semibold text-foreground py-4">Account Created</TableHead>
                                            <TableHead className="font-semibold text-foreground py-4">Last Activity</TableHead>
                                            <TableHead className="font-semibold text-foreground py-4 pr-6">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredAdmins.map((admin, index) => (
                                            <TableRow 
                                                key={admin.id} 
                                                className={`hover:bg-muted/50 transition-colors border-b ${
                                                    index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                                                }`}
                                            >
                                                <TableCell className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white font-semibold text-sm">
                                                            <Shield className="h-5 w-5" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <div className="font-semibold text-foreground text-base flex items-center gap-2">
                                                                {admin.name}
                                                                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                                                    Admin
                                                                </Badge>
                                                            </div>
                                                            <div className="text-sm text-muted-foreground">{admin.email}</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                Full system access
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="space-y-1">
                                                        <Badge variant="outline" className="font-mono bg-orange-50 text-orange-700 border-orange-200 text-xs block w-fit">
                                                            {admin.adminId}
                                                        </Badge>
                                                        <div className="text-xs text-muted-foreground">
                                                            Administrator
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="space-y-2">
                                                        <div className="text-sm font-medium text-foreground">
                                                            {admin.phone || 'No phone'}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {admin.email}
                                                        </div>
                                                        <div className="flex items-center gap-1 text-xs">
                                                            <div className={`w-2 h-2 rounded-full ${admin.phone ? 'bg-green-400' : 'bg-red-400'}`}></div>
                                                            <span className="text-muted-foreground">
                                                                {admin.phone ? 'Reachable' : 'No contact'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="space-y-1">
                                                        <div className="text-sm font-medium text-foreground">
                                                            {new Date(admin.createdAt).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric'
                                                            })}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {Math.floor((new Date().getTime() - new Date(admin.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days ago
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="space-y-1">
                                                        <div className="text-sm font-medium text-foreground">
                                                            {new Date(admin.updatedAt).toLocaleDateString('en-US', {
                                                                month: 'short',
                                                                day: 'numeric'
                                                            })}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            Profile updated
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4 pr-6">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 p-0 hover:bg-muted"
                                                            >
                                                                <MoreVertical className="h-4 w-4" />
                                                                <span className="sr-only">Open menu</span>
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-48">
                                                            <DropdownMenuItem 
                                                                onClick={() => handleViewAdmin(admin)}
                                                                className="cursor-pointer"
                                                            >
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                View More
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem 
                                                                onClick={() => handleEditAdmin(admin)}
                                                                className="cursor-pointer"
                                                            >
                                                                <Edit className="mr-2 h-4 w-4" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem 
                                                                onClick={() => handleDeleteAdmin(admin)}
                                                                className="cursor-pointer text-red-600 focus:text-red-600"
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            {filteredAdmins.length === 0 && (
                                <div className="text-center py-16 px-6">
                                    <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                                        <Shield className="h-12 w-12 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-medium text-foreground mb-2">No administrators found</h3>
                                    <p className="text-muted-foreground">Try adjusting your search criteria</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="prefixes" className="space-y-4">
                    <EmployeeIdPrefixManagement />
                </TabsContent>
            </Tabs>
            </div>

            {/* View Employee Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader className="space-y-3">
                        <DialogTitle className="text-xl">Employee Details</DialogTitle>
                        <DialogDescription>
                            Detailed information about the selected employee
                        </DialogDescription>
                    </DialogHeader>
                    {selectedEmployee && (
                        <div className="space-y-6 mt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-foreground">Name</Label>
                                    <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">{selectedEmployee.name}</p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-foreground">Employee ID</Label>
                                    <p className="text-sm text-muted-foreground font-mono bg-muted/50 p-2 rounded">{selectedEmployee.employeeId}</p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-foreground">Email</Label>
                                    <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">{selectedEmployee.email}</p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-foreground">Phone</Label>
                                    <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">{selectedEmployee.phone || 'Not provided'}</p>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-foreground">Designation</Label>
                                    <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">{(selectedEmployee as any).designation || 'Not specified'}</p>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-foreground">Role</Label>
                                    <div className="bg-muted/50 p-2 rounded">
                                        <Badge className={getRoleBadgeColor(selectedEmployee.role)}>
                                            {formatRole(selectedEmployee.role)}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-foreground">Team</Label>
                                    <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                                        {selectedEmployee.team ? selectedEmployee.team.name : 'No team assigned'}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-foreground">Team Leader</Label>
                                    <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                                        {selectedEmployee.isTeamLeader ? 'Yes' : 'No'}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-foreground">Sick Leave Balance</Label>
                                    <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">{selectedEmployee.sickLeaveBalance} days</p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-foreground">Casual Leave Balance</Label>
                                    <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">{selectedEmployee.casualLeaveBalance} days</p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-foreground">Salary</Label>
                                    <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                                        {selectedEmployee.salary ? `₹${selectedEmployee.salary.toLocaleString()}` : 'Not specified'}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-foreground">Address</Label>
                                    <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                                        {selectedEmployee.address || 'Not provided'}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-foreground">Aadhar Card</Label>
                                    <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded font-mono">
                                        {selectedEmployee.aadharCard || 'Not provided'}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-foreground">PAN Card</Label>
                                    <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded font-mono">
                                        {selectedEmployee.panCard || 'Not provided'}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-foreground">UAN Number</Label>
                                    <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded font-mono">
                                        {selectedEmployee.uanNumber || 'Not provided'}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-foreground">ESI Number</Label>
                                    <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded font-mono">
                                        {selectedEmployee.esiNumber || 'Not provided'}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-foreground">Bank Account Number</Label>
                                    <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded font-mono">
                                        {selectedEmployee.bankAccountNumber || 'Not provided'}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-foreground">Created</Label>
                                    <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                                        {new Date(selectedEmployee.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-foreground">Last Updated</Label>
                                    <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                                        {new Date(selectedEmployee.updatedAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Employee Dialog */}
            <Dialog open={isEditEmployeeDialogOpen} onOpenChange={setIsEditEmployeeDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader className="space-y-3">
                        <DialogTitle className="text-xl">Edit Employee</DialogTitle>
                        <DialogDescription>
                            Update employee information
                        </DialogDescription>
                    </DialogHeader>
                    {editingEmployee && (
                        <EditEmployeeForm 
                            employee={editingEmployee}
                            teams={teams}
                            onSave={handleUpdateEmployee}
                            onCancel={() => {
                                setIsEditEmployeeDialogOpen(false)
                                setEditingEmployee(null)
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Admin Dialog */}
            <Dialog open={isEditAdminDialogOpen} onOpenChange={setIsEditAdminDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader className="space-y-3">
                        <DialogTitle className="text-xl">Edit Administrator</DialogTitle>
                        <DialogDescription>
                            Update administrator information
                        </DialogDescription>
                    </DialogHeader>
                    {editingAdmin && (
                        <EditAdminForm 
                            admin={editingAdmin}
                            onSave={handleUpdateAdmin}
                            onCancel={() => {
                                setIsEditAdminDialogOpen(false)
                                setEditingAdmin(null)
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

// Edit Employee Form Component
interface EditEmployeeFormProps {
    employee: Employee
    teams: any[]
    onSave: (data: any) => void
    onCancel: () => void
}

function EditEmployeeForm({ employee, teams, onSave, onCancel }: EditEmployeeFormProps) {
    const [formData, setFormData] = useState({
        name: employee.name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        designation: (employee as any).designation || '',
        teamId: employee.teamId || '',
        salary: employee.salary || '',
        address: employee.address || '',
        aadharCard: employee.aadharCard || '',
        panCard: employee.panCard || '',
        sickLeaveBalance: employee.sickLeaveBalance || 12,
        casualLeaveBalance: employee.casualLeaveBalance || 12,
        password: '',
        photo: null as File | null
    })

    const [showPassword, setShowPassword] = useState(false)
    const [passwordEditable, setPasswordEditable] = useState(false)
    const [showPasswordDialog, setShowPasswordDialog] = useState(false)
    const [previewUrl, setPreviewUrl] = useState<string | null>(employee.photoUrl || null)
    const [uploadingPhoto, setUploadingPhoto] = useState(false)

    // Clean up preview URL when component unmounts
    React.useEffect(() => {
        if (formData.photo) {
            const url = URL.createObjectURL(formData.photo)
            setPreviewUrl(url)
            return () => URL.revokeObjectURL(url)
        }
    }, [formData.photo])

    const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return
        
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file')
            return
        }
        
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB')
            return
        }
        
        setFormData(prev => ({ ...prev, photo: file }))
    }

    const handleRemovePhoto = () => {
        setFormData(prev => ({ ...prev, photo: null }))
        setPreviewUrl(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        let photoUrl = employee.photoUrl // Keep existing photo URL by default
        
        // Upload new photo if one was selected
        if (formData.photo) {
            setUploadingPhoto(true)
            try {
                photoUrl = await uploadEmployeePhotoToS3(formData.photo, employee.employeeId)
            } catch (error) {
                console.error('Photo upload failed:', error)
                alert('Failed to upload photo. Please try again.')
                setUploadingPhoto(false)
                return
            } finally {
                setUploadingPhoto(false)
            }
        }
        
        const updateData: any = {
            ...formData,
            salary: formData.salary ? parseFloat(formData.salary.toString()) : null,
            teamId: formData.teamId && formData.teamId !== "no-team" ? formData.teamId : null,
            photoUrl: photoUrl
        }

        // Only include password if it was changed
        if (formData.password && passwordEditable) {
            updateData.password = formData.password
        }
        
        // Remove photo from update data as it's handled separately
        delete updateData.photo
        
        onSave(updateData)
    }

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleShowPasswordConfirm = () => {
        setPasswordEditable(true)
        setShowPassword(true)
        setShowPasswordDialog(false)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="designation">Designation</Label>
                    <Input
                        id="designation"
                        value={formData.designation}
                        onChange={(e) => handleChange('designation', e.target.value)}
                        placeholder="e.g., Senior Field Engineer"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="team">Team</Label>
                    <Select value={formData.teamId || "no-team"} onValueChange={(value) => handleChange('teamId', value === "no-team" ? "" : value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select team" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="no-team">No Team</SelectItem>
                            {teams.map((team) => (
                                <SelectItem key={team.id} value={team.id}>
                                    {team.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="salary">Salary</Label>
                    <Input
                        id="salary"
                        type="number"
                        value={formData.salary}
                        onChange={(e) => handleChange('salary', e.target.value)}
                        placeholder="Monthly salary"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="aadhar">Aadhar Card</Label>
                    <Input
                        id="aadhar"
                        value={formData.aadharCard}
                        onChange={(e) => handleChange('aadharCard', e.target.value)}
                        placeholder="12-digit Aadhar number"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="pan">PAN Card</Label>
                    <Input
                        id="pan"
                        value={formData.panCard}
                        onChange={(e) => handleChange('panCard', e.target.value)}
                        placeholder="PAN number"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="sickLeave">Sick Leave Balance</Label>
                    <Input
                        id="sickLeave"
                        type="number"
                        value={formData.sickLeaveBalance}
                        onChange={(e) => handleChange('sickLeaveBalance', parseInt(e.target.value))}
                        min="0"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="casualLeave">Casual Leave Balance</Label>
                    <Input
                        id="casualLeave"
                        type="number"
                        value={formData.casualLeaveBalance}
                        onChange={(e) => handleChange('casualLeaveBalance', parseInt(e.target.value))}
                        min="0"
                    />
                </div>
            </div>
            
            {/* Photo Upload Section */}
            <div className="space-y-2">
                <Label className="text-sm font-medium">Employee Photo</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    {previewUrl ? (
                        <div className="space-y-3">
                            <div className="w-20 h-20 mx-auto rounded-full overflow-hidden bg-gray-100 relative">
                                <img src={previewUrl} alt="Employee preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            </div>
                            <p className="text-sm text-gray-700 font-medium">{formData.photo?.name}</p>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleRemovePhoto}
                                className="border-gray-300 text-gray-600 hover:bg-gray-100"
                            >
                                Remove Photo
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <Camera className="h-12 w-12 text-gray-400 mx-auto" />
                            <div>
                                <p className="text-gray-700 font-medium mb-1">Upload Employee Photo</p>
                                <p className="text-xs text-gray-600 mb-4">Supported formats: JPG, PNG (Max 5MB)</p>
                            </div>
                            <div>
                                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" id="photo-upload-edit" />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => document.getElementById("photo-upload-edit")?.click()}
                                    className="border-gray-300 text-gray-600 hover:bg-gray-100"
                                    disabled={uploadingPhoto}
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    {uploadingPhoto ? 'Uploading...' : 'Choose Photo'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Password Section */}
            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={passwordEditable ? formData.password : "***********"}
                            onChange={(e) => handleChange('password', e.target.value)}
                            placeholder={passwordEditable ? "Enter new password" : "***********"}
                            disabled={!passwordEditable}
                            className={!passwordEditable ? "bg-muted cursor-not-allowed" : ""}
                        />
                        {passwordEditable && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-gray-100"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4 text-gray-600" />
                                ) : (
                                    <Eye className="h-4 w-4 text-gray-600" />
                                )}
                            </Button>
                        )}
                    </div>
                    {!passwordEditable && (
                        <AlertDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                            <AlertDialogTrigger asChild>
                                <Button type="button" variant="destructive" size="sm" className="bg-red-600 hover:bg-red-700 !text-white">
                                    Reset
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Confirm Password Reset</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to reset the password for {employee.name}? 
                                        This action will make the password field editable so you can set a new password.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleShowPasswordConfirm}>
                                        Yes, Reset Password
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
                {passwordEditable && (
                    <p className="text-xs text-muted-foreground">
                        Leave empty to keep current password unchanged
                    </p>
                )}
            </div>
            
            <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder="Full address"
                />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" disabled={uploadingPhoto} className="bg-blue-600 hover:bg-blue-700 !text-white">
                    {uploadingPhoto ? 'Uploading Photo...' : 'Save Changes'}
                </Button>
            </div>
        </form>
    )
}

// Edit Admin Form Component
interface EditAdminFormProps {
    admin: Admin
    onSave: (data: any) => void
    onCancel: () => void
}

function EditAdminForm({ admin, onSave, onCancel }: EditAdminFormProps) {
    const [formData, setFormData] = useState({
        name: admin.name || '',
        email: admin.email || '',
        phone: admin.phone || '',
        status: admin.status || 'ACTIVE',
        password: ''
    })

    const [showPassword, setShowPassword] = useState(false)
    const [passwordEditable, setPasswordEditable] = useState(false)
    const [showPasswordDialog, setShowPasswordDialog] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        
        const updateData: any = { ...formData }
        
        // Only include password if it was changed
        if (formData.password && passwordEditable) {
            updateData.password = formData.password
        }
        
        onSave(updateData)
    }

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleShowPasswordConfirm = () => {
        setPasswordEditable(true)
        setShowPassword(true)
        setShowPasswordDialog(false)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="adminName">Name *</Label>
                    <Input
                        id="adminName"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="adminEmail">Email *</Label>
                    <Input
                        id="adminEmail"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="adminPhone">Phone</Label>
                    <Input
                        id="adminPhone"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="adminStatus">Status</Label>
                    <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="INACTIVE">Inactive</SelectItem>
                            <SelectItem value="SUSPENDED">Suspended</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            
            {/* Password Section */}
            <div className="space-y-2">
                <Label htmlFor="adminPassword">Password</Label>
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <Input
                            id="adminPassword"
                            type={showPassword ? "text" : "password"}
                            value={passwordEditable ? formData.password : "***********"}
                            onChange={(e) => handleChange('password', e.target.value)}
                            placeholder={passwordEditable ? "Enter new password" : "***********"}
                            disabled={!passwordEditable}
                            className={!passwordEditable ? "bg-muted cursor-not-allowed" : ""}
                        />
                        {passwordEditable && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4 text-gray-400" />
                                ) : (
                                    <Eye className="h-4 w-4 text-gray-400" />
                                )}
                            </Button>
                        )}
                    </div>
                    {!passwordEditable && (
                        <AlertDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                            <AlertDialogTrigger asChild>
                                <Button type="button" variant="destructive" size="sm">
                                    Reset
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Confirm Password Reset</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to reset the password for administrator {admin.name}? 
                                        This action will make the password field editable so you can set a new password.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleShowPasswordConfirm}>
                                        Yes, Reset Password
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
                {passwordEditable && (
                    <p className="text-xs text-muted-foreground">
                        Leave empty to keep current password unchanged
                    </p>
                )}
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 !text-white">
                    Save Changes
                </Button>
            </div>
        </form>
    )
}
