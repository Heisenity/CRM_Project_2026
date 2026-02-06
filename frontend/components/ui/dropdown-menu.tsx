"use client"

import * as React from "react"
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react"
import { SimpleDropdown, SimpleDropdownItem } from "./simple-dropdown"
import { cn } from "@/lib/utils"

// Context for managing dropdown state and collecting children
interface DropdownContextType {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  triggerElement: React.ReactNode
  setTriggerElement: (element: React.ReactNode) => void
  contentElement: React.ReactNode
  setContentElement: (element: React.ReactNode) => void
  align?: "start" | "end" | "center"
  setAlign: (align: "start" | "end" | "center") => void
}

const DropdownContext = React.createContext<DropdownContextType | null>(null)

// Main dropdown root component - collects trigger and content, renders SimpleDropdown
const DropdownMenu = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [triggerElement, setTriggerElement] = React.useState<React.ReactNode>(null)
  const [contentElement, setContentElement] = React.useState<React.ReactNode>(null)
  const [align, setAlign] = React.useState<"start" | "end" | "center">("start")
  
  return (
    <DropdownContext.Provider value={{ 
      isOpen, 
      setIsOpen, 
      triggerElement, 
      setTriggerElement,
      contentElement,
      setContentElement,
      align,
      setAlign
    }}>
      {children}
    </DropdownContext.Provider>
  )
}

// Trigger component - registers itself with context
const DropdownMenuTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }
>(({ className, children, asChild, ...props }, ref) => {
  const context = React.useContext(DropdownContext)
  
  React.useEffect(() => {
    if (context) {
      context.setTriggerElement(children)
    }
  }, [children, context])
  
  if (asChild && React.isValidElement(children)) {
    return <>{children}</>
  }
  
  return <>{children}</>
})
DropdownMenuTrigger.displayName = "DropdownMenuTrigger"

// Content component - registers itself and renders SimpleDropdown
const DropdownMenuContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    align?: "start" | "end" | "center"
    sideOffset?: number
  }
>(({ className, children, align = "start", sideOffset = 4, ...props }, ref) => {
  const context = React.useContext(DropdownContext)
  
  React.useEffect(() => {
    if (context) {
      context.setAlign(align)
    }
  }, [align, context])
  
  if (!context) return null
  
  // Render SimpleDropdown with trigger and content
  return (
    <SimpleDropdown
      trigger={context.triggerElement}
      align={align}
      className={className}
    >
      {children}
    </SimpleDropdown>
  )
})
DropdownMenuContent.displayName = "DropdownMenuContent"

// Menu item component - uses SimpleDropdownItem
const DropdownMenuItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    inset?: boolean
    disabled?: boolean
  }
>(({ className, children, inset, disabled, onClick, ...props }, ref) => {
  return (
    <SimpleDropdownItem
      onClick={onClick as (() => void) | undefined}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
        inset && "pl-8",
        disabled && "pointer-events-none opacity-50",
        className
      )}
    >
      {children}
    </SimpleDropdownItem>
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
  return (
    <SimpleDropdownItem
      onClick={onClick as (() => void) | undefined}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors",
        disabled && "pointer-events-none opacity-50",
        className
      )}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {checked && <CheckIcon className="h-4 w-4" />}
      </span>
      {children}
    </SimpleDropdownItem>
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
  return (
    <SimpleDropdownItem
      onClick={onClick as (() => void) | undefined}
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors",
        disabled && "pointer-events-none opacity-50",
        className
      )}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <CircleIcon className="h-2 w-2 fill-current" />
      </span>
      {children}
    </SimpleDropdownItem>
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

export {
  DropdownMenu,
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
