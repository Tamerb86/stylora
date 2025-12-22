import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Trash2, X, Edit } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  actionLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => void;
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  actionLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
}: ConfirmDialogProps) {
  const icons = {
    danger: Trash2,
    warning: AlertTriangle,
    info: Edit,
  };

  const colors = {
    danger: "text-red-600",
    warning: "text-yellow-600",
    info: "text-blue-600",
  };

  const bgColors = {
    danger: "bg-red-50",
    warning: "bg-yellow-50",
    info: "bg-blue-50",
  };

  const Icon = icons[variant];

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full ${bgColors[variant]}`}>
              <Icon className={`w-6 h-6 ${colors[variant]}`} />
            </div>
            <div className="flex-1">
              <AlertDialogTitle className="text-xl">{title}</AlertDialogTitle>
              <AlertDialogDescription className="mt-2 text-base">
                {description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={
              variant === "danger"
                ? "bg-red-600 hover:bg-red-700"
                : variant === "warning"
                ? "bg-yellow-600 hover:bg-yellow-700"
                : "bg-blue-600 hover:bg-blue-700"
            }
          >
            {actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
