"use client"

import * as React from "react"
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react"
import { SimpleDropdown, SimpleDropdownItem } from "./simple-dropdown"
import { cn } from "@/lib/utils"

// Context for managing dropdown state
interface DropdownContextType {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  align?: "start" | "end"
}

const DropdownContext = React.createContext<DropdownContextType | null>(null)

// Main dropdown root component
const DropdownMenu = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  
  return (
    <DropdownContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </DropdownContext.Provider>
  )
}

// Trigger component
const DropdownMenuTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }
>(({ className, children, asChild, ...props }, ref) => {
  const context = React.useContext(DropdownContext)
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ...children.props,
      ...props,
      onClick: (e: React.MouseEvent) => {
        context?.setIsOpen(!context.isOpen)
        children.props.onClick?.(e)
      }
    })
  }
  
  return (
    <div
      ref={ref}
      className={cn("cursor-pointer", className)}
      onClick={() => context?.setIsOpen(!context.isOpen)}
      {...props}
    >
      {children}
    </div>
  )
})
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

// Content wrapper that uses SimpleDropdown
const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    align?: "start" | "end"
    sideOffset?: number
  }
>(({ className, children, align = "start", sideOffset = 4, ...props }, ref) => {
  const context = React.useContext(DropdownContext)
  
  if (!context?.isOpen) return null
  
  return (
    <div
      ref={ref}
      className={cn(
        "absolute top-full mt-1 min-w-[8rem] max-w-[300px] bg-white border border-gray-200 rounded-md shadow-lg z-[9999] py-1",
        align === "end" ? "right-0" : "left-0",
        className
      )}
      style={{
        zIndex: 9999,
        backgroundColor: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        marginTop: `${sideOffset}px`
      }}
      {...props}
    >
      {children}
    </div>
  )
})
DropdownMenuContent.displayName = "DropdownMenuContent"

// Menu item component
const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    inset?: boolean
    disabled?: boolean
  }
>(({ className, children, inset, disabled, onClick, ...props }, ref) => {
  const context = React.useContext(DropdownContext)
  
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return
    onClick?.(e)
    context?.setIsOpen(false)
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100 focus:text-gray-900",
        inset && "pl-8",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      {children}
    </div>
  )
})
DropdownMenuItem.displayName = "DropdownMenuItem"

// Checkbox item component
const DropdownMenuCheckboxItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    checked?: boolean
    disabled?: boolean
  }
>(({ className, children, checked, disabled, onClick, ...props }, ref) => {
  const context = React.useContext(DropdownContext)
  
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return
    onClick?.(e)
    context?.setIsOpen(false)
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100 focus:text-gray-900",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {checked && <CheckIcon className="h-4 w-4" />}
      </span>
      {children}
    </div>
  )
})
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem"

// Radio item component
const DropdownMenuRadioItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    value?: string
    disabled?: boolean
  }
>(({ className, children, disabled, onClick, ...props }, ref) => {
  const context = React.useContext(DropdownContext)
  
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return
    onClick?.(e)
    context?.setIsOpen(false)
  }
  
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100 focus:text-gray-900",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <CircleIcon className="h-2 w-2 fill-current" />
      </span>
      {children}
    </div>
  )
})
DropdownMenuRadioItem.displayName = "DropdownMenuRadioItem"

// Label component
const DropdownMenuLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold text-gray-900",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuLabel.displayName = "DropdownMenuLabel"

// Separator component
const DropdownMenuSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-gray-200", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = "DropdownMenuSeparator"

// Shortcut component
const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  )
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

// Wrapper component that combines trigger and content
const DropdownMenuWrapper = ({ 
  children, 
  align = "start" 
}: { 
  children: React.ReactNode
  align?: "start" | "end" 
}) => {
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
    <DropdownContext.Provider value={{ isOpen, setIsOpen, align }}>
      <div className="relative inline-block" ref={dropdownRef}>
        {children}
      </div>
    </DropdownContext.Provider>
  )
}

// Legacy compatibility - these are no-ops but maintain API compatibility
const DropdownMenuGroup = ({ children }: { children: React.ReactNode }) => <>{children}</>
const DropdownMenuPortal = ({ children }: { children: React.ReactNode }) => <>{children}</>
const DropdownMenuSub = ({ children }: { children: React.ReactNode }) => <>{children}</>
const DropdownMenuRadioGroup = ({ children }: { children: React.ReactNode }) => <>{children}</>

// Sub components (simplified for now)
const DropdownMenuSubTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { inset?: boolean }
>(({ className, inset, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-gray-100",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRightIcon className="ml-auto h-4 w-4" />
  </div>
))
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger"

const DropdownMenuSubContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] rounded-md border bg-white p-1 text-gray-900 shadow-lg",
      className
    )}
    {...props}
  />
))
DropdownMenuSubContent.displayName = "DropdownMenuSubContent"

// Export the wrapper as the main DropdownMenu for new usage
export {
  DropdownMenuWrapper as DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}