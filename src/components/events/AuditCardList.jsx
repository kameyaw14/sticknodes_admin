import React from 'react';
import AuditCard from './AuditCard.jsx';

const AuditCardList = ({ logs, lastLogRef }) => {
  return (
    <div className="divide-y divide-gray-200">
      {logs.map((log, index) => (
        <AuditCard
          key={log.id}
          log={log}
          ref={index === logs.length - 5 ? lastLogRef : null}
        />
      ))}
    </div>
  );
};

export default AuditCardList;