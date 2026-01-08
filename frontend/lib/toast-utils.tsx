import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"

export const showToast = {
  success: (message: string, title?: string) => {
    toast({
      title: title || "Success",
      description: message,
      variant: "success",
    })
  },
  
  error: (message: string, title?: string) => {
    toast({
      title: title || "Error",
      description: message,
      variant: "destructive",
    })
  },
  
  warning: (message: string, title?: string) => {
    toast({
      title: title || "Warning",
      description: message,
      variant: "warning",
    })
  },
  
  info: (message: string, title?: string) => {
    toast({
      title: title || "Info",
      description: message,
      variant: "default",
    })
  }
}

export const showConfirm = (
  message: string,
  onConfirm: () => void,
  title?: string
) => {
  toast({
    title: title || "Confirm Action",
    description: message,
    variant: "default",
    action: (
      <Button
        onClick={() => {
          onConfirm()
        }}
        size="sm"
        className="bg-red-600 text-white hover:bg-red-700 border-red-600"
      >
        Confirm
      </Button>
    ),
  })
}