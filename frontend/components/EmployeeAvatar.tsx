"use client"

import React from 'react'
import { User } from 'lucide-react'

interface EmployeeAvatarProps {
  photoUrl?: string | null
  photoKey?: string | null
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function EmployeeAvatar({ photoUrl, photoKey, name, size = 'md', className = '' }: EmployeeAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const [generatedPhotoUrl, setGeneratedPhotoUrl] = React.useState<string | null>(null)

  // Generate presigned URL for photoKey if photoUrl is not provided
  React.useEffect(() => {
    if (!photoUrl && photoKey) {
      // Generate presigned URL from photoKey
      fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/employees/photo-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoKey })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.photoUrl) {
          setGeneratedPhotoUrl(data.photoUrl)
        }
      })
      .catch(err => console.error('Failed to get photo URL:', err))
    }
  }, [photoKey, photoUrl])

  const displayPhotoUrl = photoUrl || generatedPhotoUrl

  if (displayPhotoUrl) {
    return (
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-100 shrink-0 ${className}`}>
        <img
          src={displayPhotoUrl}
          alt={`${name}'s profile`}
          className="w-full h-full object-cover"
          onError={(e) => {
            // If image fails to load, hide it and show fallback
            e.currentTarget.style.display = 'none'
            const parent = e.currentTarget.parentElement
            if (parent) {
              parent.innerHTML = `
                <div class="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
                  ${getInitials(name)}
                </div>
              `
            }
          }}
        />
      </div>
    )
  }

  // Fallback to initials with gradient background
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium shrink-0 ${className}`}>
      <span className="text-sm">
        {getInitials(name)}
      </span>
    </div>
  )
}