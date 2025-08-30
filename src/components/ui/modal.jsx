"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon, AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

// Main Modal Component
const Modal = DialogPrimitive.Root

const ModalTrigger = DialogPrimitive.Trigger

const ModalPortal = DialogPrimitive.Portal

const ModalOverlay = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
ModalOverlay.displayName = DialogPrimitive.Overlay.displayName

const ModalContent = React.forwardRef(({ 
  className, 
  children, 
  showCloseButton = true,
  size = "default", // "sm", "default", "lg", "xl", "full"
  ...props 
}, ref) => {
  const sizeClasses = {
    sm: "max-w-sm",
    default: "max-w-lg", 
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-[95vw]"
  }

  return (
    <ModalPortal>
      <ModalOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <XIcon className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </ModalPortal>
  )
})
ModalContent.displayName = DialogPrimitive.Content.displayName

const ModalHeader = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
ModalHeader.displayName = "ModalHeader"

const ModalFooter = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
ModalFooter.displayName = "ModalFooter"

const ModalTitle = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
ModalTitle.displayName = DialogPrimitive.Title.displayName

const ModalDescription = React.forwardRef(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
ModalDescription.displayName = DialogPrimitive.Description.displayName

// Alert Modal Component (for confirmations and alerts)
const AlertModal = ({ 
  open, 
  onOpenChange, 
  title, 
  message, 
  type = "info", // "info", "success", "warning", "error"
  onConfirm, 
  onCancel,
  confirmText = "OK",
  cancelText = "Batal",
  showCancel = false,
  size = "default"
}) => {
  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return <Info className="h-5 w-5 text-blue-600" />
    }
  }

  const getButtonVariant = (type) => {
    switch (type) {
      case 'error':
        return 'destructive'
      case 'success':
        return 'default'
      case 'warning':
        return 'default'
      default:
        return 'default'
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent size={size} showCloseButton={false}>
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            {getIcon(type)}
            {title}
          </ModalTitle>
          <ModalDescription>
            {message}
          </ModalDescription>
        </ModalHeader>
        <ModalFooter>
          {showCancel && (
            <Button variant="outline" onClick={onCancel}>
              {cancelText}
            </Button>
          )}
          <Button 
            variant={getButtonVariant(type)} 
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

// Simple Alert Hook
export function useAlert() {
  const [alertState, setAlertState] = React.useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
    onCancel: null,
    showCancel: false,
    confirmText: 'OK',
    cancelText: 'Batal',
  })

  const showAlert = (title, message, type = 'info', onConfirm = null) => {
    setAlertState({
      isOpen: true,
      title,
      message,
      type,
      onConfirm: () => {
        setAlertState(prev => ({ ...prev, isOpen: false }))
        if (onConfirm) onConfirm()
      },
      onCancel: () => {
        setAlertState(prev => ({ ...prev, isOpen: false }))
      },
      showCancel: false,
      confirmText: 'OK',
      cancelText: 'Batal',
    })
  }

  const showConfirm = (title, message, onConfirm, onCancel = null, confirmText = 'Ya', cancelText = 'Batal') => {
    setAlertState({
      isOpen: true,
      title,
      message,
      type: 'warning',
      onConfirm: () => {
        setAlertState(prev => ({ ...prev, isOpen: false }))
        if (onConfirm) onConfirm()
      },
      onCancel: () => {
        setAlertState(prev => ({ ...prev, isOpen: false }))
        if (onCancel) onCancel()
      },
      showCancel: true,
      confirmText,
      cancelText,
    })
  }

  const closeAlert = () => {
    setAlertState(prev => ({ ...prev, isOpen: false }))
  }

  const AlertComponent = () => (
    <AlertModal
      open={alertState.isOpen}
      onOpenChange={(open) => setAlertState(prev => ({ ...prev, isOpen: open }))}
      title={alertState.title}
      message={alertState.message}
      type={alertState.type}
      onConfirm={alertState.onConfirm}
      onCancel={alertState.onCancel}
      showCancel={alertState.showCancel}
      confirmText={alertState.confirmText}
      cancelText={alertState.cancelText}
    />
  )

  return {
    showAlert,
    showConfirm,
    closeAlert,
    AlertComponent,
  }
}

export {
  Modal,
  ModalTrigger,
  ModalPortal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalTitle,
  ModalDescription,
  AlertModal,
}
