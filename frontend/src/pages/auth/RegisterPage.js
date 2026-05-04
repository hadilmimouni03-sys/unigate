import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const REGISTRATION_TYPES = [
  { value: 'FIRST_YEAR_ING', label: '1st Year Engineering' },
  { value: 'SECOND_YEAR_ING', label: '2nd Year Engineering' },
  { value: 'THIRD_YEAR_ING', label: '3rd Year Engineering' },
  { value: 'MASTER_M1', label: 'Master M1' },
  { value: 'MASTER_M2', label: 'Master M2' },
  { value: 'DOUBLE_DIPLOMA', label: 'Double Diploma' },
  { value: 'EXCHANGE_PROGRAM', label: 'Exchange Program' },
];

const DEPARTMENTS = ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering',
  'Civil Engineering', 'Industrial Engineering'];

const RegisterPage = () => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
    registrationType: '', department: '', speciality: '',
    partnerUniversity: '', partnerCountry: '', targetSemester: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const isSelectiveType = ['MASTER_M1', 'MASTER_M2', 'DOUBLE_DIPLOMA', 'EXCHANGE_PROGRAM']
    .includes(form.registrationType);
  const isExchangeOrDD = ['DOUBLE_DIPLOMA', 'EXCHANGE_PROGRAM'].includes(form.registrationType);

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const validateStep1 = () => {
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      setError('All fields are required');
      return false;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!form.registrationType || !form.department) {
      setError('Please fill all required fields');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError('');
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/student');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-700 to-primary-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-bold text-xl">UG</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition
                ${step >= s ? 'bg-primary-700 text-white' : 'bg-gray-100 text-gray-400'}`}>
                {s}
              </div>
              {s < 3 && <div className={`h-1 w-12 mx-1 rounded transition ${step > s ? 'bg-primary-700' : 'bg-gray-200'}`} />}
            </React.Fragment>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Step 1: Personal Info */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-700 mb-3">Personal Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input type="text" required value={form.firstName}
                    onChange={(e) => set('firstName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input type="text" required value={form.lastName}
                    onChange={(e) => set('lastName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" required value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" required value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input type="password" required value={form.confirmPassword}
                  onChange={(e) => set('confirmPassword', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
            </div>
          )}

          {/* Step 2: Registration Type */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-700 mb-3">Registration Type</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Program Type *</label>
                <select value={form.registrationType}
                  onChange={(e) => set('registrationType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                  <option value="">Select program...</option>
                  {REGISTRATION_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {form.registrationType && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                    <select value={form.department}
                      onChange={(e) => set('department', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                      <option value="">Select department...</option>
                      {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  {isSelectiveType && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Speciality</label>
                      <input type="text" value={form.speciality}
                        onChange={(e) => set('speciality', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        placeholder="e.g. Artificial Intelligence" />
                    </div>
                  )}

                  {isExchangeOrDD && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Partner University</label>
                        <input type="text" value={form.partnerUniversity}
                          onChange={(e) => set('partnerUniversity', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                          <input type="text" value={form.partnerCountry}
                            onChange={(e) => set('partnerCountry', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Target Semester</label>
                          <input type="text" value={form.targetSemester} placeholder="e.g. S5"
                            onChange={(e) => set('targetSemester', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" />
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-700 mb-3">Confirm Registration</h2>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Name:</span>
                  <span className="font-medium">{form.firstName} {form.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Email:</span>
                  <span className="font-medium">{form.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Program:</span>
                  <span className="font-medium">
                    {REGISTRATION_TYPES.find(t => t.value === form.registrationType)?.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Department:</span>
                  <span className="font-medium">{form.department}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                After registration, you will need to upload the required documents to complete your application.
              </p>
            </div>
          )}

          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <button type="button" onClick={() => setStep(step - 1)}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition">
                Back
              </button>
            ) : (
              <Link to="/login" className="px-5 py-2.5 text-gray-500 hover:text-gray-700 font-medium transition">
                Already have an account?
              </Link>
            )}

            {step < 3 ? (
              <button type="button" onClick={handleNext}
                className="px-5 py-2.5 bg-primary-700 hover:bg-primary-800 text-white rounded-lg font-medium transition">
                Next
              </button>
            ) : (
              <button type="submit" disabled={loading}
                className="px-5 py-2.5 bg-primary-700 hover:bg-primary-800 disabled:bg-primary-400 text-white rounded-lg font-medium transition">
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
