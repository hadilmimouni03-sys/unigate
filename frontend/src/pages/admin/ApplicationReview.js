import React, { useEffect, useState } from 'react';
import { adminApi, documentApi } from '../../services/api';

const ApplicationReview = ({ applicationId, onBack }) => {
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [comment, setComment] = useState('');
  const [refusalReason, setRefusalReason] = useState('');
  const [annotatingDocId, setAnnotatingDocId] = useState(null);
  const [annotation, setAnnotation] = useState('');

  useEffect(() => {
    adminApi.getApplication(applicationId)
      .then(({ data }) => setApp(data))
      .finally(() => setLoading(false));
  }, [applicationId]);

  const handleReview = async (action) => {
    if (action === 'REFUSE' && !refusalReason.trim()) {
      alert('Please provide a refusal reason');
      return;
    }
    setSubmitting(true);
    try {
      await adminApi.review(applicationId, { action, comment, refusalReason });
      onBack();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async (doc) => {
    try {
      const { data } = await documentApi.download(doc.id);
      const url = URL.createObjectURL(new Blob([data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName || `document-${doc.id}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Download failed');
    }
  };

  const handleAnnotate = async (docId) => {
    if (!annotation.trim()) return;
    try {
      await adminApi.annotateDocument(docId, annotation);
      setAnnotatingDocId(null);
      setAnnotation('');
      const { data } = await adminApi.getApplication(applicationId);
      setApp(data);
    } catch (err) {
      alert('Annotation failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  const canReview = ['SUBMITTED', 'UNDER_REVIEW'].includes(app?.status);
  const isSelective = ['MASTER_M1', 'MASTER_M2', 'DOUBLE_DIPLOMA', 'EXCHANGE_PROGRAM']
    .includes(app?.registrationType);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <button onClick={onBack} className="text-primary-600 hover:text-primary-800 text-sm font-medium mb-6 flex items-center gap-1">
        ← Back to Applications
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Application Info */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-lg text-gray-900 mb-4">Application #{app?.id}</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <Info label="Student" value={app?.studentName} />
              <Info label="Email" value={app?.studentEmail} />
              <Info label="Type" value={app?.registrationType?.replace(/_/g, ' ')} />
              <Info label="Status" value={app?.status} />
              <Info label="Submitted" value={app?.submittedAt ? new Date(app.submittedAt).toLocaleString() : '—'} />
              {app?.classGroupName && <Info label="Class Group" value={app.classGroupName} />}
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Documents ({app?.documents?.length || 0})</h3>
            <div className="space-y-3">
              {app?.documents?.map((doc) => (
                <div key={doc.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm text-gray-800">
                        {doc.type.replace(/_/g, ' ')}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{doc.fileName}</div>
                      {doc.validationMessage && (
                        <div className="text-xs text-gray-500 mt-1">{doc.validationMessage}</div>
                      )}
                      {doc.reviewerAnnotation && (
                        <div className="text-xs text-orange-700 font-medium mt-1">
                          Admin note: {doc.reviewerAnnotation}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusPill status={doc.status} />
                      <button
                        onClick={() => handleDownload(doc)}
                        className="text-xs text-gray-500 hover:text-gray-800 font-medium flex items-center gap-1"
                        title="Download document"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                        </svg>
                        Download
                      </button>
                      {canReview && (
                        <button onClick={() => { setAnnotatingDocId(doc.id); setAnnotation(''); }}
                          className="text-xs text-primary-600 hover:text-primary-800 font-medium">
                          Annotate
                        </button>
                      )}
                    </div>
                  </div>

                  {annotatingDocId === doc.id && (
                    <div className="mt-3">
                      <input
                        value={annotation}
                        onChange={(e) => setAnnotation(e.target.value)}
                        placeholder="Enter annotation for student..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                      />
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => handleAnnotate(doc.id)}
                          className="px-3 py-1.5 bg-primary-700 text-white text-xs rounded-lg font-medium">
                          Save
                        </button>
                        <button onClick={() => setAnnotatingDocId(null)}
                          className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-lg font-medium">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {!app?.documents?.length && (
                <p className="text-gray-400 text-sm">No documents uploaded yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Review Panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Review Actions</h3>

            {canReview ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
                  <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                    placeholder="Optional comment for the student..." />
                </div>

                <button onClick={() => handleReview('APPROVE')} disabled={submitting}
                  className="w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded-xl font-semibold text-sm transition">
                  ✓ Approve
                </button>

                <button onClick={() => handleReview('REQUEST_INCOMPLETE')} disabled={submitting}
                  className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white rounded-xl font-semibold text-sm transition">
                  ⚠ Request Incomplete
                </button>

                {isSelective && (
                  <div className="space-y-2">
                    <textarea value={refusalReason}
                      onChange={(e) => setRefusalReason(e.target.value)} rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400 outline-none resize-none"
                      placeholder="Refusal reason (required)..." />
                    <button onClick={() => handleReview('REFUSE')} disabled={submitting}
                      className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-xl font-semibold text-sm transition">
                      ✗ Refuse
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Application is <strong>{app?.status?.replace(/_/g, ' ')}</strong>. No further review actions available.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Info = ({ label, value }) => (
  <div>
    <div className="text-xs text-gray-400">{label}</div>
    <div className="font-medium text-gray-800 mt-0.5">{value || '—'}</div>
  </div>
);

const STATUS_COLORS = {
  VALID: 'bg-green-100 text-green-700',
  INVALID: 'bg-red-100 text-red-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  NEEDS_CORRECTION: 'bg-orange-100 text-orange-700',
};

const StatusPill = ({ status }) => (
  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-600'}`}>
    {status}
  </span>
);

export default ApplicationReview;
