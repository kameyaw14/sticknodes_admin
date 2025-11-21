import React from 'react';
import { format } from 'date-fns';

const AuditCard = React.forwardRef(({ log }, ref) => {
  return (
    <div ref={ref} className="p-4 hover:bg-gray-50 transition">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <img src={log.actor?.avatarUrl || '/default-avatar.png'} alt="" className="w-10 h-10 rounded-full" />
          <div>
            <p className="font-medium text-gray-900">{log.actor?.name || 'Unknown User'}</p>
            <p className="text-xs text-gray-500">{log.actor?.email || log.actorId}</p>
          </div>
        </div>
        <span className="text-xs text-gray-500">
          {format(new Date(log.createdAt), 'MMM dd, HH:mm')}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <p className="font-semibold text-blue-600">{log.action.replace(/_/g, ' ')}</p>
        <p className="text-gray-700">
          <strong>Resource:</strong> {log.resourceType} {log.resourceId && `#${log.resourceId.slice(-6)}`}
        </p>
        {log.details && <p className="text-gray-600"><strong>Details:</strong> {log.details}</p>}
        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          <span>IP: {log.ipAddress || '—'}</span>
          <span>•</span>
          <span>{log.country || '—'}</span>
          <span>•</span>
          <span>{log.deviceInfo || '—'}</span>
        </div>
      </div>
    </div>
  );
});

export default AuditCard;