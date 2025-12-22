import { Button } from "@/components/ui/button";
import { X, Trash2, MessageSquare, CheckCircle, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BulkActionToolbarProps {
  selectedCount: number;
  onClear: () => void;
  onDelete?: () => void;
  onSendSMS?: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export function BulkActionToolbar({
  selectedCount,
  onClear,
  onDelete,
  onSendSMS,
  onConfirm,
  onCancel,
  isLoading = false,
}: BulkActionToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-blue-600 to-orange-500 text-white rounded-lg shadow-2xl p-4"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 rounded-full px-3 py-1 text-sm font-semibold">
              {selectedCount} valgt
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onDelete && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onDelete}
                disabled={isLoading}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Slett
              </Button>
            )}

            {onSendSMS && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onSendSMS}
                disabled={isLoading}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Send SMS
              </Button>
            )}

            {onConfirm && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onConfirm}
                disabled={isLoading}
                className="bg-green-500/80 hover:bg-green-600 text-white border-green-400/20"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Bekreft
              </Button>
            )}

            {onCancel && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onCancel}
                disabled={isLoading}
                className="bg-red-500/80 hover:bg-red-600 text-white border-red-400/20"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Avbryt
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              disabled={isLoading}
              className="text-white hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
