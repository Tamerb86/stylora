import { useState, useCallback } from "react";

export function useBulkSelection<T extends { id: number | string }>(items: T[] = []) {
  const [selectedIds, setSelectedIds] = useState<Set<number | string>>(new Set());

  const toggleSelection = useCallback((id: number | string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (selectedIds.size === items.length) {
      // Deselect all
      setSelectedIds(new Set());
    } else {
      // Select all
      setSelectedIds(new Set(items.map((item) => item.id)));
    }
  }, [items, selectedIds.size]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback(
    (id: number | string) => selectedIds.has(id),
    [selectedIds]
  );

  const isAllSelected = items.length > 0 && selectedIds.size === items.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < items.length;

  return {
    selectedIds: Array.from(selectedIds),
    selectedCount: selectedIds.size,
    isSelected,
    toggleSelection,
    toggleAll,
    clearSelection,
    isAllSelected,
    isSomeSelected,
  };
}
