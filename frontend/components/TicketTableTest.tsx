import React from 'react'
import { TicketTable } from './TicketTable'

// Simple test component to verify TicketTable functionality
export function TicketTableTest() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Ticket Management System</h1>
      <TicketTable />
    </div>
  )
}