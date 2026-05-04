import React from 'react';

const ApplicationStatus = ({ application, liveUpdates }) => {
  if (!application) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-4xl mb-3">📋</p>
        <p>No application found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Registration Type" value={application.registrationType?.replace(/_/g, ' ')} />
        <Stat label="Status" value={application.status} highlight />
        <Stat label="Documents" value={`${application.documentsValid} / ${application.documentsTotal} valid`} />
        <Stat label="Submitted" value={application.submittedAt
          ? new Date(application.submittedAt).toLocaleDateString() : '—'} />
      </div>

      {liveUpdates.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Live Updates</h3>
          <div className="space-y-2">
            {liveUpdates.map((update, idx) => (
              <div key={idx}
                className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2 text-sm text-blue-800 flex items-center gap-2">
                <span className="animate-pulse w-2 h-2 bg-blue-500 rounded-full" />
                {update.message || JSON.stringify(update)}
              </div>
            ))}
          </div>
        </div>
      )}

      {application.documents?.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Document Summary</h3>
          <div className="space-y-2">
            {application.documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">{doc.type.replace(/_/g, ' ')}</span>
                  <span className="text-xs text-gray-400">{doc.fileName}</span>
                </div>
                <StatusBadge status={doc.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Stat = ({ label, value, highlight }) => (
  <div className="bg-gray-50 rounded-xl p-3">
    <div className="text-xs text-gray-400 mb-1">{label}</div>
    <div className={`font-semibold text-sm ${highlight ? 'text-primary-700' : 'text-gray-800'}`}>
      {value || '—'}
    </div>
  </div>
);

const STATUS_COLORS = {
  VALID: 'bg-green-100 text-green-700',
  INVALID: 'bg-red-100 text-red-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  NEEDS_CORRECTION: 'bg-orange-100 text-orange-700',
};

const StatusBadge = ({ status }) => (
  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}>
    {status}
  </span>
);

export default ApplicationStatus;
