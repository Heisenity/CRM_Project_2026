"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SimpleDropdownProps {
  children: React.ReactNode
  trigger: React.ReactNode
  align?: "start" | "end"
  className?: string
}

export function SimpleDropdown({ children, trigger, align = "start", className }: SimpleDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      
      {isOpen && (
        <div
          className={cn(
            "absolute top-full mt-1 min-w-[8rem] max-w-[300px] bg-white border border-gray-200 rounded-md shadow-lg py-1",
            align === "end" ? "right-0" : "left-0",
            className
          )}
          style={{
            zIndex: 99999,
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            position: 'absolute'
          }}
        >
          {children}
        </div>
      )}
    </div>
  )
}

interface SimpleDropdownItemProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

export function SimpleDropdownItem({ children, onClick, className }: SimpleDropdownItemProps) {
  return (
    <div
      className={cn(
        "px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 transition-colors",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}