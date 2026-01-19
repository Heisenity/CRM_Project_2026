import { useAuthenticatedFetch } from '@/hooks/useAuthenticatedFetch'

export interface ExportFilters {
  dateFrom?: string
  dateTo?: string
  date?: string
  status?: string
  priority?: string
  category?: string
  department?: string
  assigneeId?: string
  reporterId?: string
  quickRange?: 'yesterday' | '15days' | '30days'
}

export const exportTicketsToExcel = async (
  authenticatedFetch: ReturnType<typeof useAuthenticatedFetch>['authenticatedFetch'],
  filters: ExportFilters = {}
) => {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams()
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        queryParams.append(key, value)
      }
    })

    const queryString = queryParams.toString()
    const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/tickets/export/excel${queryString ? `?${queryString}` : ''}`

    const response = await authenticatedFetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    })

    if (!response.ok) {
      throw new Error('Export failed')
    }

    // Get the filename from the response headers
    const contentDisposition = response.headers.get('content-disposition')
    let filename = `support-tickets-${new Date().toISOString().split('T')[0]}.xlsx`
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/)
      if (filenameMatch) {
        filename = filenameMatch[1]
      }
    }

    // Create blob and download
    const blob = await response.blob()
    const url2 = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url2
    a.download = filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url2)
    document.body.removeChild(a)

    return { success: true, filename }
  } catch (error) {
    console.error('Export error:', error)
    throw error
  }
}

export const getFilterLabel = (filters: ExportFilters): string => {
  const activeFilters: string[] = []
  
  if (filters.quickRange) {
    switch (filters.quickRange) {
      case 'yesterday':
        activeFilters.push('Yesterday')
        break
      case '15days':
        activeFilters.push('Last 15 Days')
        break
      case '30days':
        activeFilters.push('Last 30 Days')
        break
    }
  } else if (filters.dateFrom || filters.dateTo) {
    if (filters.dateFrom && filters.dateTo) {
      activeFilters.push(`${filters.dateFrom} to ${filters.dateTo}`)
    } else if (filters.dateFrom) {
      activeFilters.push(`From ${filters.dateFrom}`)
    } else if (filters.dateTo) {
      activeFilters.push(`Until ${filters.dateTo}`)
    }
  } else if (filters.date) {
    activeFilters.push(`Date: ${filters.date}`)
  }

  if (filters.status && filters.status !== 'all') {
    activeFilters.push(`Status: ${filters.status}`)
  }

  if (filters.priority && filters.priority !== 'all') {
    activeFilters.push(`Priority: ${filters.priority}`)
  }

  if (filters.category && filters.category !== 'all') {
    activeFilters.push(`Category: ${filters.category}`)
  }

  if (filters.department && filters.department !== 'all') {
    activeFilters.push(`Department: ${filters.department}`)
  }

  return activeFilters.length > 0 ? activeFilters.join(', ') : 'All Tickets'
}