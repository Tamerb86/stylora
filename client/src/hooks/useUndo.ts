import { useState, useCallback } from "react";
import { toast } from "sonner";

interface UndoState<T> {
  data: T;
  action: () => void;
  message: string;
}

export function useUndo<T = any>() {
  const [undoStack, setUndoStack] = useState<UndoState<T>[]>([]);

  const addUndo = useCallback(
    (data: T, action: () => void, message: string) => {
      const undoState: UndoState<T> = { data, action, message };

      setUndoStack(prev => [...prev, undoState]);

      // Show toast with undo button
      toast.success(message, {
        action: {
          label: "Undo",
          onClick: () => {
            action();
            setUndoStack(prev => prev.filter(item => item !== undoState));
          },
        },
        duration: 5000,
      });

      // Auto-remove from stack after 5 seconds
      setTimeout(() => {
        setUndoStack(prev => prev.filter(item => item !== undoState));
      }, 5000);
    },
    []
  );

  const clearUndo = useCallback(() => {
    setUndoStack([]);
  }, []);

  return {
    addUndo,
    clearUndo,
    undoStack,
  };
}
