
import React from 'react';
import AuditStats from '../components/events/AuditStats.jsx';
import AuditFilters from '../components/events/AuditFilters.jsx';
import AuditLogsList from '../components/events/AuditLogsList.jsx';
import RefreshControls from '../components/events/RefreshControls.jsx';
import { useAuditLogs } from '../hooks/useAuditLogs.js';

const Events = () => {
  // NEW ADDITION: Centralized hook handles all fetching, filters, infinite scroll
  const {
    logs,
    stats,
    filters,
    setFilters,
    isLoading,
    isFetching,
    hasMore,
    loadMore,
    refetchCurrent,
    refetchAll,
    resetFilters,
  } = useAuditLogs();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      {/* NEW ADDITION: Header with title and refresh controls */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Events & Audit Logs</h1>
        <RefreshControls
          onRefreshCurrent={refetchCurrent}
          onRefreshAll={() => {
            resetFilters();
            refetchAll();
          }}
          isFetching={isFetching}
        />
      </div>

      {/* NEW ADDITION: Collapsible Stats Section */}
      <AuditStats stats={stats} isLoading={isLoading} />

      {/* NEW ADDITION: Filters */}
      <AuditFilters filters={filters} setFilters={setFilters} />

      {/* NEW ADDITION: Responsive Logs List (Table on desktop, Cards on mobile) */}
      <AuditLogsList
        logs={logs}
        isLoading={isLoading}
        isFetching={isFetching}
        hasMore={hasMore}
        loadMore={loadMore}
      />
    </div>
  );
};

export default Events;