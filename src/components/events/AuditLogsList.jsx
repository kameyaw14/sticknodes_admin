// NEW ADDITION: Responsive list — Table on large screens, Cards on mobile
import React from 'react';
import AuditTable from './AuditTable.jsx';
import AuditCardList from './AuditCardList.jsx';
import SkeletonRow from './SkeletonRow.jsx';
import SkeletonCard from './SkeletonCard.jsx';

const AuditLogsList = ({ logs, isLoading, isFetching, hasMore, loadMore, lastLogRef }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="hidden lg:block">
          {[...Array(8)].map((_, i) => <SkeletonRow key={i} />)}
        </div>
        <div className="block lg:hidden">
          {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Desktop: Table */}
      <div className="hidden lg:block">
        <AuditTable logs={logs} lastLogRef={lastLogRef} hasMore={hasMore} />
      </div>

      {/* Mobile: Cards */}
      <div className="block lg:hidden">
        <AuditCardList logs={logs} lastLogRef={lastLogRef} hasMore={hasMore} />
      </div>

      {isFetching && (
        <div className="p-6 text-center text-gray-500">
          <span>Loading more logs...</span>
        </div>
      )}

      {!hasMore && logs.length > 0 && (
        <div className="p-6 text-center text-gray-500 border-t">
          No more logs to load
        </div>
      )}
    </div>
  );
};

export default AuditLogsList;