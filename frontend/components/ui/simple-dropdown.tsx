"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

interface SimpleDropdownProps {
  children: React.ReactNode
  trigger: React.ReactNode
  align?: "start" | "end" | "center"
  className?: string
}

export function SimpleDropdown({ children, trigger, align = "start", className }: SimpleDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const triggerRef = React.useRef<HTMLDivElement>(null)
  const dropdownRef = React.useRef<HTMLDivElement>(null)
  const [position, setPosition] = React.useState({ top: 0, left: 0 })

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  React.useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const dropdownWidth = 200 // approximate width
      
      let left = rect.left
      if (align === "end") {
        left = rect.right - dropdownWidth
      } else if (align === "center") {
        left = rect.left + (rect.width / 2) - (dropdownWidth / 2)
      }
      
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: left + window.scrollX
      })
    }
  }, [isOpen, align])

  return (
    <>
      <div className="relative inline-block" ref={triggerRef}>
        <div onClick={() => setIsOpen(!isOpen)}>
          {trigger}
        </div>
      </div>
      
      {mounted && isOpen && createPortal(
        <div
          ref={dropdownRef}
          className={cn(
            "min-w-[8rem] max-w-[300px] bg-white border border-gray-200 rounded-md shadow-lg py-1",
            className
          )}
          style={{
            position: 'absolute',
            top: `${position.top}px`,
            left: `${position.left}px`,
            zIndex: 99999,
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
          }}
        >
          {children}
        </div>,
        document.body
      )}
    </>
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