import { redirect } from 'next/navigation'

export default function EmployeesPage() {
    // Redirect to employee management page
    redirect('/employee-management')
}