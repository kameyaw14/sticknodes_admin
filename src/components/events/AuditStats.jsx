import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const AuditStats = ({ stats, isLoading }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
      >
        <h3 className="text-lg font-semibold text-gray-900">Audit Statistics</h3>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {isOpen && (
        <div className="px-6 pb-6 border-t border-gray-200 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.totalActions.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Total Actions</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Top Actions</p>
              {Object.entries(stats.actionCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 4)
                .map(([action, count]) => (
                  <div key={action} className="text-sm text-gray-600">
                    {action.replace(/_/g, ' ')}: <strong>{count}</strong>
                  </div>
                ))}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Categories</p>
              {Object.entries(stats.categoryCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 4)
                .map(([cat, count]) => (
                  <div key={cat} className="text-sm text-gray-600">
                    {cat}: <strong>{count}</strong>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditStats;