// NEW ADDITION: Custom hook for all audit log logic (fetching, filters, infinite scroll)
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { toast } from 'sonner';

export const useAuditLogs = () => {
  const { fetchAuditLogs } = useAppContext();

  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    totalActions: 0,
    actionCounts: {},
    categoryCounts: {},
  });
  const [filters, setFilters] = useState({
    actionType: '',
    resourceType: '',
    userSearch: '',
    startDate: null,
    endDate: null,
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  const observer = useRef();

  // NEW ADDITION: Fetch logs with current filters and page
  const fetchLogs = useCallback(async (pageNum = 1, append = true) => {
    if (pageNum === 1) setIsLoading(true);
    else setIsFetching(true);

    try {
      const params = {
        page: pageNum,
        limit: 20,
        ...(filters.actionType && { action: filters.actionType }), // FIXED: backend uses 'action', not 'actionType'
        ...(filters.resourceType && { resourceType: filters.resourceType }),
        ...(filters.userSearch && { actorId: filters.userSearch }), // FIXED: backend uses 'actorId'
        ...(filters.startDate && { startDate: filters.startDate.toISOString() }),
        ...(filters.endDate && { endDate: filters.endDate.toISOString() }),
      };

      const response = await fetchAuditLogs(params);

      if (response.success) {
        const newLogs = response.data.logs;

        // UPDATED: Properly merge or replace logs
        setLogs(prev => append ? [...prev, ...newLogs] : newLogs);
        setHasMore(newLogs.length === 20);

        // UPDATED: Accurate stats accumulation (only on append or full replace)
        const baseActionCounts = append ? { ...stats.actionCounts } : {};
        const baseCategoryCounts = append ? { ...stats.categoryCounts } : {};

        newLogs.forEach(log => {
          // Count actions
          baseActionCounts[log.action] = (baseActionCounts[log.action] || 0) + 1;

          // Count categories from metadata
          if (log.metadata?.category) {
            baseCategoryCounts[log.metadata.category] = (baseCategoryCounts[log.metadata.category] || 0) + 1;
          }
        });

        setStats({
          totalActions: response.data.pagination.total,
          actionCounts: baseActionCounts,
          categoryCounts: baseCategoryCounts,
        });
      } else {
        toast.error(response.message || 'Failed to load logs');
      }
    } catch (err) {
      console.error('Fetch audit logs error:', err);
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, [fetchAuditLogs, filters, stats.actionCounts, stats.categoryCounts]);

  // NEW ADDITION: Load on mount + when filters change
  useEffect(() => {
    setPage(1);
    setLogs([]);
    fetchLogs(1, false);
  }, [filters.actionType, filters.resourceType, filters.userSearch, filters.startDate, filters.endDate]);

  // NEW ADDITION: Reset filters and reload
  const resetFilters = () => {
    setFilters({
      actionType: '',
      resourceType: '',
      userSearch: '',
      startDate: null,
      endDate: null,
    });
    setPage(1);
  };

  const refetchCurrent = () => {
    setPage(1);
    setLogs([]);
    fetchLogs(1, false);
  };

  const refetchAll = () => {
    resetFilters();
    // Note: resetFilters will trigger useEffect → fetchLogs
  };

  const loadMore = () => {
    if (!isFetching && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchLogs(nextPage, true);
    }
  };

  // NEW ADDITION: Intersection Observer for infinite scroll
  const lastLogRef = useCallback(node => {
    if (isLoading || isFetching) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    });

    if (node) observer.current.observe(node);
  }, [isLoading, isFetching, hasMore, loadMore]);

  return {
    logs,
    stats,
    filters,
    setFilters,
    isLoading,
    isFetching,
    hasMore,
    lastLogRef,
    refetchCurrent,
    refetchAll,
    resetFilters,
  };
};