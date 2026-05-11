import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { applicationApi, documentApi, eligibilityApi, timetableApi } from '../../services/api';
import { connectWebSocket, disconnectWebSocket } from '../../services/websocket';

const STEPS = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED'];
const STEP_LABELS = { DRAFT: 'Draft', SUBMITTED: 'Submitted', UNDER_REVIEW: 'Under Review', APPROVED: 'Approved' };
const STEP_SUBLABELS = { DRAFT: 'In preparation', SUBMITTED: 'Awaiting review', UNDER_REVIEW: 'Being processed', APPROVED: 'Admission granted' };

const DOC_ICONS = {
  DIPLOMA: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>,
  TRANSCRIPT: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>,
  ID_CARD: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2"/><circle cx="8" cy="12" r="2"/><path d="M14 10h4M14 14h4"/></svg>,
  PHOTO: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>,
  MEDICAL_CERT: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12h6M12 9v6"/></svg>,
  AGREEMENT: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
};

const DOC_COLORS = {
  VALID:            { bg: 'bg-green-50',  border: 'border-green-200',  icon: 'text-green-600',  badge: 'bg-green-100 text-green-700' },
  INVALID:          { bg: 'bg-red-50',    border: 'border-red-200',    icon: 'text-red-500',    badge: 'bg-red-100 text-red-700' },
  PENDING:          { bg: 'bg-amber-50',  border: 'border-amber-200',  icon: 'text-amber-500',  badge: 'bg-amber-100 text-amber-700' },
  NEEDS_CORRECTION: { bg: 'bg-orange-50', border: 'border-orange-300', icon: 'text-orange-500', badge: 'bg-orange-100 text-orange-700' },
  null:             { bg: 'bg-slate-50',  border: 'border-slate-200',  icon: 'text-slate-400',  badge: 'bg-slate-100 text-slate-600' },
};

const DOC_TYPES = ['DIPLOMA', 'TRANSCRIPT', 'ID_CARD', 'PHOTO', 'MEDICAL_CERT', 'AGREEMENT'];
const DOC_NAMES = {
  DIPLOMA: 'Diploma / Baccalaureate', TRANSCRIPT: 'Academic Transcript',
  ID_CARD: 'National ID Card', PHOTO: 'Passport Photo',
  MEDICAL_CERT: 'Medical Certificate', AGREEMENT: 'Enrolment Agreement',
};
const DOC_ACCEPT = {
  DIPLOMA: '.pdf', TRANSCRIPT: '.pdf',
  ID_CARD: '.pdf,.jpg,.jpeg,.png', PHOTO: '.jpg,.jpeg,.png',
  MEDICAL_CERT: '.pdf,.jpg,.jpeg', AGREEMENT: '.pdf',
};

const STEP_ICONS = {
  DRAFT: (
    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
    </svg>
  ),
  SUBMITTED: (
    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  ),
  UNDER_REVIEW: (
    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
    </svg>
  ),
  APPROVED: (
    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M12 14l9-5-9-5-9 5 9 5z"/><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
    </svg>
  ),
};

const TIMETABLE_DAYS  = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const TIMETABLE_SLOTS = ['08:00', '10:00', '12:00', '14:00', '16:00'];
const TIMETABLE_STYLE = {
  LECTURE: { bg: 'bg-blue-50',   border: 'border-blue-300',   badge: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500'   },
  TD:      { bg: 'bg-green-50',  border: 'border-green-300',  badge: 'bg-green-100 text-green-700', dot: 'bg-green-500'  },
  TP:      { bg: 'bg-violet-50', border: 'border-violet-300', badge: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500' },
};
const TT_DEFAULT = { bg: 'bg-slate-50', border: 'border-slate-300', badge: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' };
const ttTimeRow = (t) => { const h = parseInt(('' + t).split(':')[0], 10); return TIMETABLE_SLOTS.findIndex((s) => parseInt(s.split(':')[0], 10) === h); };
const ttToday = new Date().toLocaleString('en-US', { weekday: 'long' }).toUpperCase();

const COND_LABELS = { GPA_GTE: 'Minimum GPA', CREDITS_GTE: 'Minimum Credits', STATUS_EQ: 'Status Required' };

const StudentDashboard = () => {
  const { user } = useAuth();
  const [application,   setApplication]  = useState(null);
  const [loading,       setLoading]      = useState(true);
  const [submitting,    setSubmitting]   = useState(false);
  const [activeTab,     setActiveTab]    = useState('overview');
  const [uploading,     setUploading]    = useState({});
  const [liveMsg,       setLiveMsg]      = useState(null);
  const [eligRules,     setEligRules]    = useState([]);
  const [timetable,     setTimetable]    = useState([]);
  const [ttLoading,     setTtLoading]    = useState(false);

  useEffect(() => {
    loadApplication();
    eligibilityApi.getMyRules().then(({ data }) => setEligRules(data)).catch(() => {});
    setTtLoading(true);
    timetableApi.getMy()
      .then(({ data }) => setTimetable(data))
      .catch(() => {})
      .finally(() => setTtLoading(false));
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
      alert(err.response?.data?.message || 'Submission failed');
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

  const docs = application?.documents || [];
  const docMap = {};
  docs.forEach((d) => { docMap[d.type] = d; });
  const validCount = docs.filter((d) => d.status === 'VALID').length;
  const totalDocs = DOC_TYPES.length;

  const circumference = 2 * Math.PI * 48;
  const docProgress = totalDocs > 0 ? validCount / totalDocs : 0;

  return (
    <div className="p-6 space-y-6">

      {/* Live update toast */}
      {liveMsg && (
        <div className="flex items-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
          </svg>
          {liveMsg}
          <button onClick={() => setLiveMsg(null)} className="ml-auto text-lg leading-none opacity-70 hover:opacity-100">×</button>
        </div>
      )}

      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Hello, {user.firstName}! 👋</h1>
            <p className="text-blue-100 mb-5">
              {application?.registrationType?.replace(/_/g, ' ') || 'Student'} Portal
            </p>
            {canEdit && (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-white text-blue-700 font-semibold rounded-xl text-sm transition hover:bg-blue-50 shadow-sm disabled:opacity-60"
              >
                {submitting ? (
                  <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                )}
                {application?.status === 'INCOMPLETE' ? 'Resubmit Application' : 'Submit Application'}
              </button>
            )}
          </div>

          {/* Document progress circle */}
          <div className="text-center shrink-0">
            <div className="relative inline-flex items-center justify-center">
              <svg className="w-28 h-28 -rotate-90">
                <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="6" fill="none" className="text-white/20" />
                <circle
                  cx="56" cy="56" r="48"
                  stroke="currentColor" strokeWidth="6" fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - docProgress)}
                  className="text-white transition-all duration-1000"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-3xl font-bold">{validCount}</div>
                <div className="text-xs text-blue-200">/{totalDocs}</div>
              </div>
            </div>
            <div className="mt-2 text-sm text-blue-200">Documents Valid</div>
          </div>
        </div>
      </div>

      {/* Status Alerts */}
      {application?.status === 'INCOMPLETE' && (
        <div className="flex items-start gap-3 bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
          <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <div>
            <p className="font-semibold text-amber-900">Action Required</p>
            <p className="text-amber-800 text-sm mt-0.5">
              {application.reviewerComment || 'Some documents need to be re-uploaded. Please check the Documents tab.'}
            </p>
          </div>
        </div>
      )}

      {application?.status === 'APPROVED' && (
        <div className="flex items-start gap-3 bg-green-50 border-2 border-green-200 rounded-xl p-4">
          <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center shrink-0 text-xl">🎉</div>
          <div>
            <p className="font-semibold text-green-900">Application Approved!</p>
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
        <div className="flex items-start gap-3 bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div>
            <p className="font-semibold text-red-900">Application Refused</p>
            <p className="text-red-800 text-sm mt-0.5">
              {application.refusalReason || 'Contact the administration for more details.'}
            </p>
          </div>
        </div>
      )}

      {/* Application Journey (Phase Stepper) */}
      {application && application.status !== 'REFUSED' && (
        <div className="bg-white rounded-2xl border-2 border-blue-100 shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Application Journey</h2>
            <p className="text-slate-500">Track your progress through each phase</p>
          </div>

          <div className="relative">
            {/* Connection line */}
            <div className="absolute top-[72px] left-[14%] right-[14%] h-1 bg-slate-200 rounded-full">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-1000"
                style={{ width: effectiveStep <= 0 ? '0%' : `${(effectiveStep / (STEPS.length - 1)) * 100}%` }}
              />
            </div>

            {/* Phase cards */}
            <div className="relative grid grid-cols-4 gap-4">
              {STEPS.map((step, i) => {
                const isCompleted = i < effectiveStep;
                const isActive = i === effectiveStep;
                const isLocked = i > effectiveStep;

                return (
                  <div key={step} className="flex flex-col items-center">
                    <div className={`relative w-full max-w-[148px] h-36 rounded-2xl flex flex-col items-center justify-center transition-all duration-300 p-3 ${
                      isCompleted ? 'bg-green-50 border-2 border-green-500' :
                      isActive ? 'bg-blue-50 border-2 border-blue-500 shadow-xl shadow-blue-200 ring-4 ring-blue-100 scale-105' :
                      'bg-slate-50 border-2 border-slate-200 opacity-50'
                    }`}>
                      {/* Status badge */}
                      <div className={`absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center ${
                        isCompleted ? 'bg-green-500' : isActive ? 'bg-blue-500' : 'bg-slate-300'
                      }`}>
                        {isCompleted && (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
                        )}
                        {isActive && (
                          <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                        )}
                        {isLocked && (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                        )}
                      </div>

                      {/* Phase icon */}
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-2 ${
                        isCompleted ? 'bg-green-500' : isActive ? 'bg-blue-500' : 'bg-slate-300'
                      }`}>
                        {STEP_ICONS[step]}
                      </div>

                      {/* Phase name */}
                      <div className={`text-center font-bold text-sm leading-tight ${
                        isCompleted ? 'text-green-700' : isActive ? 'text-blue-700' : 'text-slate-400'
                      }`}>
                        {STEP_LABELS[step]}
                      </div>
                    </div>

                    {/* Status label below card */}
                    <div className="mt-3">
                      {isCompleted && (
                        <span className="text-xs bg-green-500 text-white px-2.5 py-1 rounded-full font-medium">Complete</span>
                      )}
                      {isActive && (
                        <span className="text-xs bg-blue-500 text-white px-2.5 py-1 rounded-full font-medium">
                          {application?.status === 'INCOMPLETE' ? 'Action Needed' : 'In Progress'}
                        </span>
                      )}
                      {isLocked && (
                        <span className="text-xs text-slate-400 font-medium">{STEP_SUBLABELS[step]}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-500">Enrollment</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              application?.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
            }`}>
              {application?.status === 'APPROVED' ? 'Active' : 'Pending'}
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {application?.status === 'APPROVED' ? 'Enrolled' : 'Pending'}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-500">Documents</span>
            {validCount === totalDocs && (
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            )}
          </div>
          <div className="text-2xl font-bold text-slate-900">{validCount}/{totalDocs}</div>
          <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${(validCount / totalDocs) * 100}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="text-sm text-slate-500 mb-3">Programme</div>
          <div className="text-lg font-bold text-slate-900 leading-tight">
            {application?.registrationType?.replace(/_/g, ' ') || '—'}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="text-sm text-slate-500 mb-3">Status</div>
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
            application?.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
            application?.status === 'INCOMPLETE' ? 'bg-amber-100 text-amber-700' :
            application?.status === 'UNDER_REVIEW' ? 'bg-blue-100 text-blue-700' :
            application?.status === 'SUBMITTED' ? 'bg-indigo-100 text-indigo-700' :
            application?.status === 'REFUSED' ? 'bg-red-100 text-red-700' :
            'bg-slate-100 text-slate-600'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              application?.status === 'APPROVED' ? 'bg-green-500' :
              application?.status === 'INCOMPLETE' ? 'bg-amber-500' :
              application?.status === 'UNDER_REVIEW' ? 'bg-blue-500' :
              application?.status === 'SUBMITTED' ? 'bg-indigo-500' :
              application?.status === 'REFUSED' ? 'bg-red-500' :
              'bg-slate-400'
            }`}/>
            {application?.status?.replace(/_/g, ' ') || '—'}
          </div>
        </div>
      </div>

      {/* Tabs Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-slate-200 px-2">
          {[
            ['overview',  'Overview'],
            ['documents', 'Documents'],
            ['timeline',  'Timeline'],
            ...(application?.status === 'APPROVED' ? [['timetable', 'Timetable']] : []),
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-5 py-4 text-sm font-medium transition border-b-2 ${
                activeTab === key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Overview tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">Personal Information</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Full Name', value: `${user.firstName} ${user.lastName}` },
                    { label: 'Email', value: user.email },
                    { label: 'Role', value: user.role?.replace(/_/g, ' ') },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                      <p className="text-sm font-medium text-slate-800">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">Application Details</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Programme', value: application?.registrationType?.replace(/_/g, ' ') || '—' },
                    { label: 'Status', value: application?.status || '—' },
                    { label: 'Submitted', value: application?.submittedAt ? new Date(application.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not yet' },
                    { label: 'Documents', value: `${validCount} / ${totalDocs} valid` },
                    ...(application?.classGroupName ? [{ label: 'Class Group', value: application.classGroupName }] : []),
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                      <p className="text-sm font-medium text-slate-800">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-5">
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

              {/* Eligibility Requirements — always visible in Overview */}
              <div className="md:col-span-2 bg-amber-50 border border-amber-200 rounded-xl p-5">
                <div className="flex items-start gap-2 mb-3">
                  <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                  <div>
                    <h4 className="text-sm font-bold text-amber-900">Eligibility Requirements for Your Level</h4>
                    <p className="text-xs text-amber-700 mt-0.5">
                      {application?.registrationType?.replace(/_/g, ' ')}
                      {eligRules.filter((r) => r.enabled).length > 0
                        ? ` · ${eligRules.filter((r) => r.enabled).length} active rule${eligRules.filter((r) => r.enabled).length !== 1 ? 's' : ''} — make sure you meet these criteria before submitting`
                        : ' · No specific requirements defined for your level yet'}
                    </p>
                  </div>
                </div>
                {eligRules.filter((r) => r.enabled).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {eligRules.filter((r) => r.enabled).map((rule) => (
                      <div key={rule.id} className="flex items-start gap-3 bg-white border border-amber-100 rounded-lg p-3 shadow-sm">
                        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800">{rule.ruleName}</p>
                          <p className="text-xs text-amber-700 mt-0.5">
                            {COND_LABELS[rule.conditionType] || rule.conditionType}: <strong>{rule.targetValue}</strong>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-amber-600 italic">The administrator has not defined eligibility rules for your programme yet.</p>
                )}
              </div>
            </div>
          )}

          {/* Documents tab */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {DOC_TYPES.map((type) => {
                const doc = docMap[type];
                const status = doc?.status || null;
                const colors = DOC_COLORS[status] || DOC_COLORS[null];
                return (
                  <div key={type} className={`rounded-xl border p-4 flex flex-col gap-3 ${colors.bg} ${colors.border}`}>
                    <div className="flex items-start justify-between">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm ${colors.icon}`}>
                        {DOC_ICONS[type]}
                      </div>
                      {status && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors.badge}`}>
                          {status}
                        </span>
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-800">{DOC_NAMES[type]}</p>
                      {doc?.fileName && (
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{doc.fileName}</p>
                      )}
                      {doc?.validationMessage && (
                        <p className="text-xs text-red-600 mt-1">{doc.validationMessage}</p>
                      )}
                      {doc?.reviewerAnnotation && (
                        <div className="mt-2 flex items-start gap-1.5 bg-orange-50 border border-orange-200 rounded-lg px-2.5 py-2">
                          <svg className="w-3.5 h-3.5 text-orange-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                          </svg>
                          <div>
                            <p className="text-xs font-semibold text-orange-700">Admin note</p>
                            <p className="text-xs text-orange-800 mt-0.5">{doc.reviewerAnnotation}</p>
                          </div>
                        </div>
                      )}
                      {!doc && (
                        <p className="text-xs text-slate-400 mt-0.5">Not uploaded yet</p>
                      )}
                    </div>

                    {canEdit && (
                      <label className={`mt-auto flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-semibold cursor-pointer transition ${
                        uploading[type]
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm'
                      }`}>
                        {uploading[type] ? (
                          <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                          </svg>
                        )}
                        {doc ? 'Replace' : 'Upload'}
                        <input
                          type="file"
                          className="hidden"
                          accept={DOC_ACCEPT[type]}
                          disabled={uploading[type]}
                          onChange={(e) => handleUpload(type, e.target.files[0])}
                        />
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
            </div>
          )}

          {/* Timeline tab */}
          {activeTab === 'timeline' && (
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-5">Application Timeline</h3>
              <div className="relative pl-6 border-l-2 border-slate-100 space-y-6">
                {[
                  { label: 'Application Created', date: application?.createdAt, color: 'bg-slate-400', done: true },
                  { label: 'Application Submitted', date: application?.submittedAt, color: 'bg-blue-500', done: !!application?.submittedAt },
                  { label: 'Under Review', date: null, color: 'bg-indigo-500', done: ['UNDER_REVIEW', 'APPROVED', 'REFUSED', 'INCOMPLETE'].includes(application?.status) },
                  { label: 'Decision', date: application?.decidedAt, color: application?.status === 'APPROVED' ? 'bg-green-500' : application?.status === 'REFUSED' ? 'bg-red-500' : 'bg-slate-300', done: ['APPROVED', 'REFUSED'].includes(application?.status) },
                ].map((item) => (
                  <div key={item.label} className="relative flex items-start gap-3">
                    <div className={`absolute -left-[25px] w-4 h-4 rounded-full border-2 border-white shadow ${item.done ? item.color : 'bg-slate-200'}`} />
                    <div>
                      <p className={`text-sm font-medium ${item.done ? 'text-slate-800' : 'text-slate-400'}`}>{item.label}</p>
                      {item.date && (
                        <p className="text-xs text-slate-400 mt-0.5">{new Date(item.date).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timetable tab */}
          {activeTab === 'timetable' && (
            <div className="space-y-4">
              {ttLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/>
                </div>
              ) : timetable.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  {application?.classGroupName ? (
                    <p className="text-slate-500 text-sm">No sessions scheduled for <strong>{application.classGroupName}</strong> yet. Check back soon.</p>
                  ) : (
                    <p className="text-slate-500 text-sm">Your timetable will appear here once you are assigned to a class group.</p>
                  )}
                </div>
              ) : (
                <>
                  {/* Group info */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-semibold border border-blue-100">
                      Group: {timetable[0]?.groupName || application?.classGroupName}
                    </span>
                    <span className="text-xs text-slate-400">{timetable.length} sessions / week</span>
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap gap-4">
                    {Object.entries(TIMETABLE_STYLE).map(([type, cfg]) => (
                      <div key={type} className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`}/>
                        <span className="text-xs text-slate-500 font-medium">{type}</span>
                      </div>
                    ))}
                  </div>

                  {/* Grid */}
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full border-collapse text-xs" style={{ minWidth: '600px' }}>
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="w-20 px-3 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wide border-r border-slate-200">Time</th>
                          {TIMETABLE_DAYS.map((d) => (
                            <th key={d} className={`px-3 py-3 text-center text-xs font-bold uppercase tracking-wide border-r border-slate-200 last:border-r-0 ${d === ttToday ? 'text-blue-600 bg-blue-50' : 'text-slate-500'}`}>
                              {d.slice(0, 3)}
                              {d === ttToday && <span className="ml-1.5 inline-block w-1.5 h-1.5 bg-blue-600 rounded-full align-middle"/>}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {TIMETABLE_SLOTS.map((_, rowIdx) => (
                          <tr key={rowIdx} className="border-b border-slate-100 last:border-b-0">
                            <td className="px-2 py-3 text-center text-slate-400 font-medium bg-slate-50/50 border-r border-slate-200 whitespace-nowrap">
                              {TIMETABLE_SLOTS[rowIdx]}<br/><span className="text-slate-300">–</span><br/>{TIMETABLE_SLOTS[rowIdx+1] || '18:00'}
                            </td>
                            {TIMETABLE_DAYS.map((day) => {
                              const slot = timetable.find((s) => s.dayOfWeek === day && ttTimeRow(s.startTime) === rowIdx);
                              const cfg  = slot ? (TIMETABLE_STYLE[slot.slotType] || TT_DEFAULT) : null;
                              const isToday = day === ttToday;
                              return (
                                <td key={day} className={`px-2 py-2 min-h-[72px] border-r border-slate-100 last:border-r-0 ${isToday ? 'bg-blue-50/30' : ''}`}>
                                  {slot && cfg ? (
                                    <div className={`${cfg.bg} border ${cfg.border} rounded-lg p-2 h-full flex flex-col gap-1`}>
                                      <p className="font-bold text-slate-800 leading-tight">{slot.courseName}</p>
                                      <p className="text-slate-500">{('' + slot.startTime).slice(0,5)}–{('' + slot.endTime).slice(0,5)}</p>
                                      {slot.room && <p className="text-slate-400">📍 {slot.room}</p>}
                                      {slot.instructor && <p className="text-slate-400 truncate">{slot.instructor}</p>}
                                      <span className={`mt-auto self-start px-1.5 py-0.5 rounded-full text-xs font-semibold ${cfg.badge}`}>{slot.slotType}</span>
                                    </div>
                                  ) : null}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Course list */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[...new Map(timetable.map((s) => [s.courseName, s])).values()].map((s) => {
                      const cfg = TIMETABLE_STYLE[s.slotType] || TT_DEFAULT;
                      return (
                        <div key={s.courseName} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50">
                          <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${cfg.dot}`}/>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{s.courseName}</p>
                            {s.instructor && <p className="text-xs text-slate-400 truncate">{s.instructor}</p>}
                          </div>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${cfg.badge}`}>{s.slotType}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
