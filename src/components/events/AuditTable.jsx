import React from 'react';
import AuditTableRow from './AuditTableRow';

const AuditTable = ({ logs, lastLogRef }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-blue-600">
          <tr>
            {['Time', 'User', 'Action', 'Resource', 'Details', 'IP', 'Country', 'Device'].map(header => (
              <th key={header} className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {logs.map((log, index) => (
            <AuditTableRow
              key={log.id}
              log={log}
              ref={index === logs.length - 5 ? lastLogRef : null}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AuditTable;