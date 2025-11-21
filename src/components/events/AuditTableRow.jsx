import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const AuditTableRow = React.forwardRef(({ log }, ref) => {
  const formattedTime = format(new Date(log.createdAt), 'MMM dd, yyyy HH:mm:ss');

  return (
    <tr ref={ref} className="hover:bg-gray-50 transition">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formattedTime}</td>
     -you- <td className="px-6 py-4 text-sm">
        <div className="flex items-center gap-2">
          <img src={log.actor?.avatarUrl || '/default-avatar.png'} alt="" className="w-8 h-8 rounded-full" />
          <div>
            <div className="font-medium text-gray-900">{log.actor?.name || 'Unknown'}</div>
            <div className="text-xs text-gray-500">{log.actor?.email || log.actorId}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm font-medium text-blue-600">{log.action.replace(/_/g, ' ')}</td>
      <td className="px-6 py-4 text-sm">
        {log.resourceType} {log.resourceId && (
          <Link to={`/admin/videos/${log.resourceId}`} className="text-blue-600 hover:underline">
            #{log.resourceId.slice(-6)}
          </Link>
        )}
      </td>
      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{log.details || '—'}</td>
      <td className="px-6 py-4 text-sm text-gray-600">{log.ipAddress || '—'}</td>
      <td className="px-6 py-4 text-sm">{log.country || '—'}</td>
      <td className="px-6 py-4 text-sm text-gray-600">{log.deviceInfo || '—'}</td>
    </tr>
  );
});

export default AuditTableRow;