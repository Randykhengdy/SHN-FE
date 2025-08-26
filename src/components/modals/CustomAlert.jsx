import React from "react";
import { AlertTriangle, XCircle, CheckCircle, Info, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const CustomAlert = ({ 
  open, 
  onOpenChange, 
  title, 
  message, 
  type = "warning",
  onConfirm,
  confirmText = "OK",
  showCancel = false,
  cancelText = "Batal"
}) => {
  const getIcon = () => {
    switch (type) {
      case "error":
        return <XCircle className="h-6 w-6 text-red-500" />;
      case "success":
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case "info":
        return <Info className="h-6 w-6 text-blue-500" />;
      default:
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
    }
  };

  const getTitleColor = () => {
    switch (type) {
      case "error":
        return "text-red-600";
      case "success":
        return "text-green-600";
      case "info":
        return "text-blue-600";
      default:
        return "text-yellow-600";
    }
  };

  const getButtonVariant = () => {
    switch (type) {
      case "error":
        return "bg-red-600 hover:bg-red-700";
      case "success":
        return "bg-green-600 hover:bg-green-700";
      case "info":
        return "bg-blue-600 hover:bg-blue-700";
      default:
        return "bg-yellow-600 hover:bg-yellow-700";
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader className="flex flex-row items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            {getIcon()}
          </div>
          <div className="flex-1">
            <AlertDialogTitle className={`font-semibold ${getTitleColor()}`}>
              {title}
            </AlertDialogTitle>
            {message && (
              <AlertDialogDescription className="mt-2 text-gray-600">
                {message}
              </AlertDialogDescription>
            )}
          </div>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="flex gap-2">
          {showCancel && (
            <AlertDialogAction
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 sm:flex-none"
            >
              {cancelText}
            </AlertDialogAction>
          )}
          <AlertDialogAction
            onClick={handleConfirm}
            className={`flex-1 sm:flex-none text-white ${getButtonVariant()}`}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CustomAlert;
