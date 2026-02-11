"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Edit, Hash } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getAvailablePrefixes, addCustomPrefix, updatePrefix, deletePrefix, type EmployeeIdPrefix } from "@/lib/server-api"

export default function EmployeeIdPrefixManagement() {
    const { toast } = useToast()
    const [prefixes, setPrefixes] = useState<EmployeeIdPrefix[]>([])
    const [loading, setLoading] = useState(false)
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [newPrefix, setNewPrefix] = useState('')
    const [newDescription, setNewDescription] = useState('')
    const [newRoleType, setNewRoleType] = useState<'FIELD_ENGINEER' | 'IN_OFFICE'>('IN_OFFICE')

    useEffect(() => {
        fetchPrefixes()
    }, [])

    const fetchPrefixes = async () => {
        try {
            const response = await getAvailablePrefixes()
            if (response.success) {
                setPrefixes(response.data)
            }
        } catch (error) {
            console.error('Error fetching prefixes:', error)
            toast({
                title: "Error",
                description: "Failed to load prefixes",
                variant: "destructive"
            })
        }
    }

    const handleAddPrefix = async () => {
        if (!newPrefix.trim()) {
            toast({
                title: "Validation Error",
                description: "Prefix is required",
                variant: "destructive"
            })
            return
        }

        const trimmedPrefix = newPrefix.trim().toUpperCase()

        setLoading(true)
        try {
            await addCustomPrefix(trimmedPrefix, newDescription || undefined, newRoleType)
            
            toast({
                title: "Success",
                description: "Prefix added successfully"
            })

            setNewPrefix('')
            setNewDescription('')
            setNewRoleType('IN_OFFICE')
            setIsAddDialogOpen(false)
            fetchPrefixes()
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to add prefix",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const handleDeletePrefix = async (prefix: string) => {
        if (!confirm(`Are you sure you want to delete prefix "${prefix}"? This will fail if any employees are using it.`)) {
            return
        }

        setLoading(true)
        try {
            await deletePrefix(prefix)
            
            toast({
                title: "Success",
                description: "Prefix deleted successfully"
            })

            fetchPrefixes()
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to delete prefix",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const handleToggleActive = async (prefix: string, description: string | null, currentActive: boolean, roleType: 'FIELD_ENGINEER' | 'IN_OFFICE') => {
        setLoading(true)
        try {
            await updatePrefix(prefix, description || '', !currentActive, roleType)
            
            toast({
                title: "Success",
                description: `Prefix ${!currentActive ? 'activated' : 'deactivated'} successfully`
            })

            fetchPrefixes()
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to update prefix",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Hash className="h-5 w-5" />
                            Employee ID Prefix Management
                        </CardTitle>
                        <CardDescription>
                            Manage custom prefixes for employee IDs (e.g., DEV, HR, SALES)
                        </CardDescription>
                    </div>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                Add Prefix
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Prefix</DialogTitle>
                                <DialogDescription>
                                    Create a custom prefix for employee IDs
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label htmlFor="prefix">Prefix *</Label>
                                    <Input
                                        id="prefix"
                                        value={newPrefix}
                                        onChange={(e) => setNewPrefix(e.target.value.toUpperCase())}
                                        placeholder="e.g., DEV, HR, SALES, FIELD"
                                        className="font-mono"
                                    />
                                    <div className="text-xs text-muted-foreground">
                                        Any uppercase letters/numbers (e.g., DEV, HR, FIELD, EMP1)
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Input
                                        id="description"
                                        value={newDescription}
                                        onChange={(e) => setNewDescription(e.target.value)}
                                        placeholder="e.g., Development Team, HR Department"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="roleType">Employee Type *</Label>
                                    <Select value={newRoleType} onValueChange={(value: 'FIELD_ENGINEER' | 'IN_OFFICE') => setNewRoleType(value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select employee type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="IN_OFFICE">Office Employee</SelectItem>
                                            <SelectItem value="FIELD_ENGINEER">Field Engineer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <div className="text-xs text-muted-foreground">
                                        This determines the default role for employees with this prefix
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsAddDialogOpen(false)}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button onClick={handleAddPrefix} disabled={loading}>
                                        {loading ? 'Adding...' : 'Add Prefix'}
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Prefix</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Employee Type</TableHead>
                            <TableHead>Next Sequence</TableHead>
                            <TableHead>Next ID</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {prefixes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-muted-foreground">
                                    No prefixes found
                                </TableCell>
                            </TableRow>
                        ) : (
                            prefixes.map((prefix) => (
                                <TableRow key={prefix.prefix}>
                                    <TableCell className="font-mono font-semibold">
                                        {prefix.prefix}
                                    </TableCell>
                                    <TableCell>
                                        {prefix.description || '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={prefix.roleType === 'FIELD_ENGINEER' ? 'default' : 'secondary'}>
                                            {prefix.roleType === 'FIELD_ENGINEER' ? 'Field Engineer' : 'Office Employee'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {prefix.nextSequence}
                                    </TableCell>
                                    <TableCell className="font-mono">
                                        {prefix.prefix}{prefix.nextSequence.toString().padStart(3, '0')}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={prefix.prefix === 'FE' || prefix.prefix === 'IO' ? 'default' : 'secondary'}>
                                            Active
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeletePrefix(prefix.prefix)}
                                            disabled={loading}
                                        >
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
