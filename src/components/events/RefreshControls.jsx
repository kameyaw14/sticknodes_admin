import React from 'react';
import { RefreshCw, RotateCcw } from 'lucide-react';

const RefreshControls = ({ onRefreshCurrent, onRefreshAll, isFetching }) => {
  return (
    <div className="flex gap-3">
      <button
        onClick={onRefreshCurrent}
        disabled={isFetching}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
      >
        <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
        Refresh View
      </button>
      <button
        onClick={onRefreshAll}
        disabled={isFetching}
        className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition"
      >
        <RotateCcw size={16} />
        Reset & Reload All
      </button>
    </div>
  );
};

export default RefreshControls;