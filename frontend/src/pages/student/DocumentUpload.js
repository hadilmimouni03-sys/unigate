import React, { useState } from 'react';
import { applicationApi } from '../../services/api';

const DOCUMENT_TYPES = [
  { value: 'DIPLOMA', label: 'Diploma / Baccalaureate', accept: '.pdf,.jpg,.jpeg', required: true },
  { value: 'TRANSCRIPT', label: 'Academic Transcript', accept: '.pdf', required: true },
  { value: 'ID_CARD', label: 'National ID Card', accept: '.pdf,.jpg,.jpeg,.png', required: true },
  { value: 'PHOTO', label: 'Identity Photo (3.5x4.5cm)', accept: '.jpg,.jpeg,.png', required: true },
  { value: 'MEDICAL_CERT', label: 'Medical Certificate', accept: '.pdf,.jpg,.jpeg', required: false },
  { value: 'AGREEMENT', label: 'Institutional Agreement', accept: '.pdf', required: false },
];

const STATUS_ICON = {
  VALID: { icon: '✓', cls: 'text-green-600 bg-green-50 border-green-200' },
  INVALID: { icon: '✗', cls: 'text-red-600 bg-red-50 border-red-200' },
  PENDING: { icon: '⏳', cls: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  NEEDS_CORRECTION: { icon: '⚠️', cls: 'text-orange-600 bg-orange-50 border-orange-200' },
};

const DocumentUpload = ({ application, onUpload, canUpload }) => {
  const [uploading, setUploading] = useState({});
  const [errors, setErrors] = useState({});

  const existingDocs = {};
  (application?.documents || []).forEach((d) => { existingDocs[d.type] = d; });

  const handleUpload = async (type, file) => {
    setErrors((prev) => ({ ...prev, [type]: null }));
    setUploading((prev) => ({ ...prev, [type]: true }));
    try {
      await applicationApi.uploadDocument(type, file);
      onUpload();
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        [type]: err.response?.data?.detail || 'Upload failed',
      }));
    } finally {
      setUploading((prev) => ({ ...prev, [type]: false }));
    }
  };

  return (
    <div>
      <p className="text-sm text-gray-500 mb-5">
        Upload the required documents below. Files are validated automatically after upload.
        {!canUpload && ' (Documents can only be uploaded in DRAFT or INCOMPLETE state)'}
      </p>

      <div className="space-y-3">
        {DOCUMENT_TYPES.map(({ value, label, accept, required }) => {
          const existing = existingDocs[value];
          const statusInfo = existing ? STATUS_ICON[existing.status] : null;
          const isUploading = uploading[value];

          return (
            <div key={value}
              className={`border rounded-xl p-4 transition
                ${existing ? STATUS_ICON[existing.status]?.cls : 'border-gray-200 bg-white'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg
                    ${existing ? '' : 'bg-gray-100'}`}>
                    {statusInfo ? statusInfo.icon : '📄'}
                  </div>
                  <div>
                    <div className="font-medium text-sm text-gray-800">
                      {label}
                      {required && <span className="text-red-500 ml-1">*</span>}
                    </div>
                    {existing && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        {existing.fileName}
                        {existing.validationMessage && ` — ${existing.validationMessage}`}
                      </div>
                    )}
                    {existing?.reviewerAnnotation && (
                      <div className="text-xs text-orange-700 mt-0.5 font-medium">
                        Admin note: {existing.reviewerAnnotation}
                      </div>
                    )}
                  </div>
                </div>

                {canUpload && (
                  <label className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-semibold transition
                    ${isUploading
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-primary-700 hover:bg-primary-800 text-white'}`}>
                    {isUploading ? 'Uploading...' : existing ? 'Replace' : 'Upload'}
                    <input type="file" className="hidden" accept={accept} disabled={isUploading}
                      onChange={(e) => e.target.files[0] && handleUpload(value, e.target.files[0])} />
                  </label>
                )}
              </div>

              {errors[value] && (
                <p className="text-red-600 text-xs mt-2">{errors[value]}</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-xs text-gray-400">
        * Required documents. Max file size: 10MB. Accepted formats vary by document type.
      </div>
    </div>
  );
};

export default DocumentUpload;
