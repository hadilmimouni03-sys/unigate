import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { applicationApi, documentApi } from '../../services/api';
import { connectWebSocket, disconnectWebSocket } from '../../services/websocket';

const STEPS = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED'];
const STEP_LABELS = { DRAFT: 'Draft', SUBMITTED: 'Submitted', UNDER_REVIEW: 'Under Review', APPROVED: 'Approved' };

const DOC_ICONS = {
  DIPLOMA: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
    </svg>
  ),
  TRANSCRIPT: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
    </svg>
  ),
  ID_CARD: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="12" r="2"/><path d="M14 10h4M14 14h4"/>
    </svg>
  ),
  PHOTO: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/>
    </svg>
  ),
  MEDICAL_CERT: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12h6M12 9v6"/>
    </svg>
  ),
  AGREEMENT: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  ),
};

const DOC_COLORS = {
  VALID: { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-600', badge: 'bg-green-100 text-green-700' },
  INVALID: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-500', badge: 'bg-red-100 text-red-700' },
  PENDING: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-500', badge: 'bg-amber-100 text-amber-700' },
  null: { bg: 'bg-gray-50', border: 'border-gray-200', icon: 'text-gray-400', badge: 'bg-gray-100 text-gray-600' },
};

const DOC_TYPES = ['DIPLOMA', 'TRANSCRIPT', 'ID_CARD', 'PHOTO', 'MEDICAL_CERT', 'AGREEMENT'];
const DOC_NAMES = {
  DIPLOMA: 'Diploma / Baccalaureate', TRANSCRIPT: 'Academic Transcript',
  ID_CARD: 'National ID Card', PHOTO: 'Passport Photo',
  MEDICAL_CERT: 'Medical Certificate', AGREEMENT: 'Enrolment Agreement',
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [uploading, setUploading] = useState({});
  const [liveMsg, setLiveMsg] = useState(null);

  useEffect(() => {
    loadApplication();
    const ws = connectWebSocket(user.email, {
      onApplicationStatus: (d) => { setLiveMsg(d.message || 'Status updated'); loadApplication(); },
      onDocumentValidation: (d) => { setLiveMsg(d.message || 'Document validated'); loadApplication(); },
    });
    return () => disconnectWebSocket();
  }, [user.email]);

  const loadApplication = () => {
    applicationApi.getMy()
      .then(({ data }) => setApplication(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const handleSubmit = async () => {
    if (!window.confirm('Submit your application for review?')) return;
    setSubmitting(true);
    try {
      const { data } = await applicationApi.submit(application.id);
      setApplication(data);
    } catch (err) {
      alert(err.response?.data?.detail || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpload = async (type, file) => {
    if (!file) return;
    setUploading((p) => ({ ...p, [type]: true }));
    try {
      await documentApi.upload(application.id, type, file);
      loadApplication();
    } catch {
      alert('Upload failed. Please try again.');
    } finally {
      setUploading((p) => ({ ...p, [type]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const canEdit = application?.status === 'DRAFT' || application?.status === 'INCOMPLETE';
  const stepIndex = STEPS.indexOf(application?.status);
  const effectiveStep = application?.status === 'INCOMPLETE' ? 2 : stepIndex;
  const progressPct = effectiveStep <= 0 ? 0 : (effectiveStep / (STEPS.length - 1)) * 100;

  const docs = application?.documents || [];
  const docMap = {};
  docs.forEach((d) => { docMap[d.type] = d; });
  const validCount = docs.filter((d) => d.status === 'VALID').length;
  const totalDocs = DOC_TYPES.length;

  return (
    <div className="px-6 py-6 max-w-5xl mx-auto">

      {/* Live update toast */}
      {liveMsg && (
        <div className="mb-4 flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl shadow-lg animate-pulse text-sm font-medium">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
          </svg>
          {liveMsg}
          <button onClick={() => setLiveMsg(null)} className="ml-auto opacity-70 hover:opacity-100">×</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Hello, {user.firstName} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {application?.registrationType?.replace(/_/g, ' ')} Application
          </p>
        </div>
        {canEdit && (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl text-sm transition shadow-sm shadow-blue-200"
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            )}
            {application?.status === 'INCOMPLETE' ? 'Resubmit' : 'Submit Application'}
          </button>
        )}
      </div>

      {/* Status alerts */}
      {application?.status === 'INCOMPLETE' && (
        <div className="mb-5 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <div>
            <p className="font-semibold text-amber-900 text-sm">Action Required</p>
            <p className="text-amber-800 text-sm mt-0.5">
              {application.reviewerComment || 'Some documents need to be re-uploaded. Please check the Documents tab.'}
            </p>
          </div>
        </div>
      )}

      {application?.status === 'APPROVED' && (
        <div className="mb-5 flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center shrink-0 text-green-600 text-lg">🎉</div>
          <div>
            <p className="font-semibold text-green-900 text-sm">Application Approved!</p>
            <p className="text-green-800 text-sm mt-0.5">
              Welcome to UniGate! Your timetable, grades, and other modules are now available.
              {application.classGroupName && (
                <> You have been assigned to class group <strong>{application.classGroupName}</strong>.</>
              )}
            </p>
          </div>
        </div>
      )}

      {application?.status === 'REFUSED' && (
        <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div>
            <p className="font-semibold text-red-900 text-sm">Application Refused</p>
            <p className="text-red-800 text-sm mt-0.5">
              {application.refusalReason || 'Contact the administration for more details.'}
            </p>
          </div>
        </div>
      )}

      {/* Progress card */}
      {application && application.status !== 'REFUSED' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">Application Progress</h2>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              application.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
              application.status === 'INCOMPLETE' ? 'bg-amber-100 text-amber-700' :
              application.status === 'UNDER_REVIEW' ? 'bg-blue-100 text-blue-700' :
              application.status === 'SUBMITTED' ? 'bg-indigo-100 text-indigo-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {application.status.replace(/_/g, ' ')}
            </span>
          </div>

          {/* Progress bar */}
          <div className="relative mb-6">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="flex justify-between">
            {STEPS.map((step, i) => {
              const done = i < effectiveStep;
              const active = i === effectiveStep;
              return (
                <div key={step} className="flex flex-col items-center gap-1.5 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                    done ? 'bg-blue-600 text-white' :
                    active ? 'bg-white border-2 border-blue-600 text-blue-600' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {done ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path d="M5 13l4 4L19 7"/>
                      </svg>
                    ) : i + 1}
                  </div>
                  <span className={`text-xs font-medium text-center ${active ? 'text-blue-600' : done ? 'text-gray-700' : 'text-gray-400'}`}>
                    {STEP_LABELS[step]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-5 gap-1">
        {[['overview', 'Overview'], ['documents', 'Documents'], ['timeline', 'Timeline']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2.5 text-sm font-medium transition border-b-2 ${
              activeTab === key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Personal Information</h3>
            <div className="space-y-3">
              {[
                { label: 'Full Name', value: `${user.firstName} ${user.lastName}` },
                { label: 'Email', value: user.email },
                { label: 'Role', value: user.role?.replace(/_/g, ' ') },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                  <p className="text-sm font-medium text-gray-800">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Application Details</h3>
            <div className="space-y-3">
              {[
                { label: 'Programme', value: application?.registrationType?.replace(/_/g, ' ') || '—' },
                { label: 'Status', value: application?.status || '—' },
                { label: 'Submitted', value: application?.submittedAt ? new Date(application.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not yet' },
                { label: 'Documents', value: `${validCount} / ${totalDocs} valid` },
                ...(application?.classGroupName ? [{ label: 'Class Group', value: application.classGroupName }] : []),
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                  <p className="text-sm font-medium text-gray-800">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-5">
            <h3 className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3">Document Completion</h3>
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 shrink-0">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e0e7ff" strokeWidth="3"/>
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#3b82f6" strokeWidth="3"
                    strokeDasharray={`${(validCount / totalDocs) * 100} 100`}
                    strokeLinecap="round"/>
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-blue-700">
                  {validCount}/{totalDocs}
                </span>
              </div>
              <div className="flex-1">
                <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${(validCount / totalDocs) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-blue-700 mt-1.5 font-medium">
                  {validCount === totalDocs
                    ? 'All documents validated!'
                    : `${totalDocs - validCount} document${totalDocs - validCount > 1 ? 's' : ''} remaining`}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Documents tab */}
      {activeTab === 'documents' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DOC_TYPES.map((type) => {
            const doc = docMap[type];
            const status = doc?.status || null;
            const colors = DOC_COLORS[status] || DOC_COLORS[null];
            return (
              <div key={type} className={`rounded-2xl border p-4 ${colors.bg} ${colors.border} flex flex-col gap-3`}>
                <div className="flex items-start justify-between">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors.icon} bg-white shadow-sm`}>
                    {DOC_ICONS[type]}
                  </div>
                  {status && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors.badge}`}>
                      {status}
                    </span>
                  )}
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-800">{DOC_NAMES[type]}</p>
                  {doc?.fileName && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{doc.fileName}</p>
                  )}
                  {doc?.validationMessage && (
                    <p className="text-xs text-red-600 mt-1">{doc.validationMessage}</p>
                  )}
                  {!doc && (
                    <p className="text-xs text-gray-400 mt-0.5">Not uploaded yet</p>
                  )}
                </div>

                {canEdit && (
                  <label className={`mt-auto flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-semibold cursor-pointer transition ${
                    uploading[type]
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm'
                  }`}>
                    {uploading[type] ? (
                      <span className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                      </svg>
                    )}
                    {doc ? 'Replace' : 'Upload'}
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      disabled={uploading[type]}
                      onChange={(e) => handleUpload(type, e.target.files[0])}
                    />
                  </label>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Timeline tab */}
      {activeTab === 'timeline' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-5">Application Timeline</h3>
          <div className="relative pl-6 border-l-2 border-gray-100 space-y-6">
            {[
              { label: 'Application Created', date: application?.createdAt, color: 'bg-gray-400', done: true },
              { label: 'Application Submitted', date: application?.submittedAt, color: 'bg-blue-500', done: !!application?.submittedAt },
              { label: 'Under Review', date: null, color: 'bg-indigo-500', done: ['UNDER_REVIEW', 'APPROVED', 'REFUSED', 'INCOMPLETE'].includes(application?.status) },
              { label: 'Decision', date: application?.decidedAt, color: application?.status === 'APPROVED' ? 'bg-green-500' : application?.status === 'REFUSED' ? 'bg-red-500' : 'bg-gray-300', done: ['APPROVED', 'REFUSED'].includes(application?.status) },
            ].map((item) => (
              <div key={item.label} className="relative flex items-start gap-3">
                <div className={`absolute -left-[25px] w-4 h-4 rounded-full border-2 border-white shadow ${item.done ? item.color : 'bg-gray-200'}`} />
                <div>
                  <p className={`text-sm font-medium ${item.done ? 'text-gray-800' : 'text-gray-400'}`}>{item.label}</p>
                  {item.date && (
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(item.date).toLocaleString()}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
