import { useState, useCallback } from 'react';

interface CursorPage<T> {
  items: T[];
  hasMore: boolean;
  nextCursor: { created_at: string; id: string } | null;
}

interface UseCursorPaginationOptions<T> {
  pageSize?: number;
  fetchPage: (cursor: { created_at: string; id: string } | null, limit: number) => Promise<CursorPage<T>>;
}

export function useCursorPagination<T extends { id: string; created_at: string }>({
  pageSize = 20,
  fetchPage,
}: UseCursorPaginationOptions<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<{ created_at: string; id: string } | null>(null);

  const loadInitial = useCallback(async () => {
    setIsLoading(true);
    setCursor(null);
    try {
      const page = await fetchPage(null, pageSize);
      setItems(page.items);
      setHasMore(page.hasMore);
      setCursor(page.nextCursor);
    } finally {
      setIsLoading(false);
    }
  }, [fetchPage, pageSize]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const page = await fetchPage(cursor, pageSize);
      setItems(prev => [...prev, ...page.items]);
      setHasMore(page.hasMore);
      setCursor(page.nextCursor);
    } finally {
      setIsLoadingMore(false);
    }
  }, [fetchPage, cursor, pageSize, isLoadingMore, hasMore]);

  return {
    items,
    setItems,
    isLoading,
    isLoadingMore,
    hasMore,
    loadInitial,
    loadMore,
  };
}
