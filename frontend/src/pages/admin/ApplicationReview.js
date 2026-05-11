import React, { useEffect, useState } from 'react';
import { adminApi, documentApi, timetableApi } from '../../services/api';

const DOC_STATUS_STYLE = {
  VALID:            'bg-green-100 text-green-700 border-green-200',
  INVALID:          'bg-red-100 text-red-700 border-red-200',
  PENDING:          'bg-amber-100 text-amber-700 border-amber-200',
  NEEDS_CORRECTION: 'bg-orange-100 text-orange-700 border-orange-200',
};

const APP_STATUS_CFG = {
  DRAFT:        { bg: 'bg-slate-100',  text: 'text-slate-600',  dot: 'bg-slate-400' },
  SUBMITTED:    { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500' },
  UNDER_REVIEW: { bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-500' },
  INCOMPLETE:   { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  APPROVED:     { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-500' },
  REFUSED:      { bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500' },
};

const InfoRow = ({ label, value }) => (
  <div className="flex items-start gap-3 py-2.5 border-b border-slate-50 last:border-0">
    <span className="text-xs text-slate-400 w-28 shrink-0 pt-0.5">{label}</span>
    <span className="text-sm font-medium text-slate-800 flex-1">{value || '—'}</span>
  </div>
);

const ApplicationReview = ({ applicationId, onBack }) => {
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [comment, setComment] = useState('');
  const [refusalReason, setRefusalReason] = useState('');
  const [annotatingDocId, setAnnotatingDocId] = useState(null);
  const [annotation, setAnnotation] = useState('');
  const [allGroups, setAllGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');

  useEffect(() => {
    adminApi.getApplication(applicationId)
      .then(({ data }) => setApp(data))
      .finally(() => setLoading(false));
  }, [applicationId]);

  useEffect(() => {
    timetableApi.getGroups()
      .then(({ data }) => setAllGroups(data))
      .catch(() => {});
  }, []);

  const handleReview = async (action) => {
    if (action === 'REFUSE' && !refusalReason.trim()) {
      alert('Please provide a refusal reason');
      return;
    }
    if (action === 'APPROVE' && relevantGroups.length > 0 && !selectedGroupId) {
      if (!window.confirm('No class group selected. The system will attempt to auto-assign. Continue?')) return;
    }
    setSubmitting(true);
    try {
      const body = { action, comment, refusalReason };
      if (action === 'APPROVE' && selectedGroupId) {
        body.classGroupId = Number(selectedGroupId);
      }
      await adminApi.review(applicationId, body);
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
    } catch {
      alert('Annotation failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const canReview = ['SUBMITTED', 'UNDER_REVIEW'].includes(app?.status);
  const isSelective = ['MASTER_M1', 'MASTER_M2', 'DOUBLE_DIPLOMA', 'EXCHANGE_PROGRAM'].includes(app?.registrationType);
  const statusCfg = APP_STATUS_CFG[app?.status] || APP_STATUS_CFG.DRAFT;
  const validDocs = app?.documents?.filter((d) => d.status === 'VALID').length || 0;
  const totalDocs = app?.documents?.length || 0;

  const REG_TYPE_TO_YEAR = {
    FIRST_YEAR_ING: 1, SECOND_YEAR_ING: 2, THIRD_YEAR_ING: 3, MASTER_M1: 4, MASTER_M2: 5,
  };
  const studentYear = REG_TYPE_TO_YEAR[app?.registrationType];
  const relevantGroups = allGroups
    .filter((g) => g.department === app?.studentDepartment && (studentYear == null || g.year === studentYear))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">

      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition group"
      >
        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        Back to Applications
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Application #{app?.id}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{app?.registrationType?.replace(/_/g, ' ')} — {app?.studentName}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${statusCfg.bg} ${statusCfg.text}`}>
          <span className={`w-2 h-2 rounded-full ${statusCfg.dot}`} />
          {app?.status?.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        <div className="lg:col-span-2 space-y-4">

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {(app?.studentName || ' ')[0].toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">{app?.studentName}</p>
                <p className="text-xs text-slate-400">{app?.studentEmail}</p>
              </div>
            </div>
            <div className="px-5 py-2">
              <InfoRow label="Registration Type" value={app?.registrationType?.replace(/_/g, ' ')} />
              <InfoRow label="Class Group"        value={app?.classGroupName} />
              <InfoRow label="Submitted"          value={app?.submittedAt ? new Date(app.submittedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : null} />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">Documents</h3>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">{validDocs}/{totalDocs} valid</span>
            </div>

            <div className="px-5 pt-3 pb-1">
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: totalDocs ? `${(validDocs / totalDocs) * 100}%` : '0%' }}
                />
              </div>
            </div>

            <div className="px-5 py-3 space-y-2.5">
              {app?.documents?.length ? app.documents.map((doc) => {
                const dStyle = DOC_STATUS_STYLE[doc.status] || 'bg-slate-100 text-slate-600 border-slate-200';
                return (
                  <div key={doc.id} className="rounded-xl border border-slate-100 p-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800">{doc.type?.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{doc.fileName}</p>
                        {doc.reviewerAnnotation && (
                          <p className="text-xs text-orange-700 bg-orange-50 rounded-lg px-2 py-1 mt-1.5">
                            Note: {doc.reviewerAnnotation}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${dStyle}`}>
                          {doc.status}
                        </span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleDownload(doc)} className="text-xs text-slate-500 hover:text-blue-600 transition font-medium">
                            Download
                          </button>
                          {canReview && (
                            <button onClick={() => { setAnnotatingDocId(doc.id); setAnnotation(''); }} className="text-xs text-blue-600 hover:text-blue-800 transition font-medium">
                              Annotate
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    {annotatingDocId === doc.id && (
                      <div className="mt-3 pt-3 border-t border-slate-100">
                        <input
                          value={annotation}
                          onChange={(e) => setAnnotation(e.target.value)}
                          placeholder="Enter annotation for student..."
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-400 outline-none bg-slate-50"
                        />
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => handleAnnotate(doc.id)} className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg font-semibold hover:bg-blue-700 transition">Save</button>
                          <button onClick={() => setAnnotatingDocId(null)} className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs rounded-lg font-semibold hover:bg-slate-200 transition">Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }) : (
                <p className="text-sm text-slate-400 py-2">No documents uploaded yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Eligibility Check</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Document Completion', ok: totalDocs > 0 && validDocs === totalDocs, detail: `${validDocs}/${totalDocs} documents valid` },
                { label: 'Programme Type',      ok: !!app?.registrationType, detail: app?.registrationType?.replace(/_/g, ' ') || 'Not specified' },
                { label: 'Submission Status',   ok: ['SUBMITTED','UNDER_REVIEW','APPROVED'].includes(app?.status), detail: app?.status?.replace(/_/g, ' ') },
                { label: 'Selective Programme', ok: !isSelective, detail: isSelective ? 'Requires manual approval' : 'Standard admission' },
              ].map(({ label, ok, detail }) => (
                <div key={label} className={`rounded-xl p-3.5 border ${ok ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${ok ? 'bg-green-500' : 'bg-amber-400'}`}>
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        {ok ? <path d="M5 13l4 4L19 7"/> : <path d="M12 9v2m0 4h.01"/>}
                      </svg>
                    </div>
                    <span className="text-xs font-semibold text-slate-700">{label}</span>
                  </div>
                  <p className="text-xs text-slate-500 ml-7">{detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Review Decision</h3>

            {canReview ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Comment for student</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    placeholder="Optional comment visible to the student after review..."
                    className="w-full px-3.5 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:ring-2 focus:ring-blue-400 outline-none resize-none"
                  />
                </div>

                {isSelective && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                      Refusal Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={refusalReason}
                      onChange={(e) => setRefusalReason(e.target.value)}
                      rows={2}
                      placeholder="Required if refusing a selective programme..."
                      className="w-full px-3.5 py-3 border border-slate-200 rounded-xl text-sm bg-slate-50 focus:ring-2 focus:ring-red-400 outline-none resize-none"
                    />
                  </div>
                )}

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Class Group Assignment
                  </label>
                  {relevantGroups.length > 0 ? (
                    <>
                      <div className="relative">
                        <select
                          value={selectedGroupId}
                          onChange={(e) => setSelectedGroupId(e.target.value)}
                          className="w-full h-10 pl-3 pr-8 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none"
                        >
                          <option value="">— Select a group (required for approval) —</option>
                          {relevantGroups.map((g) => (
                            <option key={g.id} value={g.id}>
                              {g.name}{g.yearLevel ? ` · ${g.yearLevel}` : ''}{g.semester ? ` · ${g.semester}` : ''}
                            </option>
                          ))}
                        </select>
                        <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path d="M19 9l-7 7-7-7"/>
                        </svg>
                      </div>
                      <p className="text-xs text-slate-400 mt-1.5">
                        Determines which timetable the student sees after approval.
                      </p>
                    </>
                  ) : (
                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                      <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <p className="text-xs text-amber-700">
                        No class groups found for <strong>{app?.studentDepartment}</strong>
                        {studentYear ? ` — Year ${studentYear}` : ''}. Create groups in the Timetable section first.
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-3 pt-1">
                  <button
                    onClick={() => handleReview('APPROVE')}
                    disabled={submitting}
                    className="w-full h-12 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
                    Approve Application
                  </button>
                  <button
                    onClick={() => handleReview('REQUEST_INCOMPLETE')}
                    disabled={submitting}
                    className="w-full h-12 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    Request Missing Documents
                  </button>
                  {isSelective && (
                    <button
                      onClick={() => handleReview('REFUSE')}
                      disabled={submitting || !refusalReason.trim()}
                      className="w-full h-12 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
                      Refuse Application
                    </button>
                  )}
                </div>

                {submitting && (
                  <div className="flex items-center justify-center gap-2 py-2 text-sm text-slate-500">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"/>
                    Processing…
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 ${statusCfg.bg}`}>
                  <svg className={`w-6 h-6 ${statusCfg.text}`} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <p className="text-sm font-semibold text-slate-700">{app?.status?.replace(/_/g, ' ')}</p>
                <p className="text-xs text-slate-400 mt-1">No further review actions available.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationReview;
