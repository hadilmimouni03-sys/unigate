import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE}/api/auth/refresh`, { refreshToken });
          localStorage.setItem('accessToken', data.accessToken);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  refresh: (token) => api.post('/api/auth/refresh', { refreshToken: token }),
  logout: () => api.post('/api/auth/logout'),
};

export const applicationApi = {
  getMy: () => api.get('/api/applications/my'),
  submit: (id) => api.post(`/api/applications/${id}/submit`),
  getById: (id) => api.get(`/api/applications/${id}`),
};

export const documentApi = {
  upload: (applicationId, type, file) => {
    const form = new FormData();
    form.append('applicationId', applicationId);
    form.append('type', type);
    form.append('file', file);
    return api.post('/api/documents/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  listForApplication: (appId) => api.get(`/api/documents/application/${appId}`),
  annotate: (docId, annotation) => api.patch(`/api/documents/${docId}/annotate`, { annotation }),
  downloadUrl: (docId) => `${API_BASE}/api/documents/${docId}/download`,
  download: (docId) => api.get(`/api/documents/${docId}/download`, { responseType: 'blob' }),
};

export const adminApi = {
  getApplications: (status) =>
    api.get('/api/admin/applications', { params: status ? { status } : {} }),
  getApplication: (id) => api.get(`/api/applications/${id}`),
  review: (id, data) => api.post(`/api/admin/applications/${id}/review`, data),
  annotateDocument: (docId, annotation) =>
    api.patch(`/api/documents/${docId}/annotate`, { annotation }),
};

export const notificationApi = {
  getMy: () => api.get('/api/notifications'),
  getUnreadCount: () => api.get('/api/notifications/unread-count'),
  markAllRead: () => api.post('/api/notifications/read-all'),
};

export const timetableApi = {
  getByGroup: (groupId) => api.get(`/api/timetable/group/${groupId}`),
  create: (data) => api.post('/api/timetable', data),
  delete: (id) => api.delete(`/api/timetable/${id}`),
};

export const gradeApi = {
  myGrades: () => api.get('/api/grades/my'),
  mySubjects: (semester) =>
    api.get('/api/grades/subjects', { params: semester ? { semester } : {} }),
  enterMyGrade: (data) => api.post('/api/grades/my', data),
  studentGrades: (studentId, semester) =>
    api.get(`/api/grades/student/${studentId}`, { params: semester ? { semester } : {} }),
  enter: (data) => api.post('/api/grades', data),
  simulate: (data) => api.post('/api/grades/simulate', data),
  getConfig: (department, semester) =>
    api.get('/api/grades/config', { params: { department, semester } }),
  saveConfig: (configs) => api.put('/api/grades/config', configs),
};

export const eligibilityApi = {
  getRules: (department, yearLevel) =>
    api.get('/api/eligibility/rules', { params: { department, yearLevel } }),
  saveRules: (yearLevel, rules) =>
    api.put('/api/eligibility/rules', rules, { params: { yearLevel } }),
};

export const skillSwapApi = {
  getMarketplace: () => api.get('/api/skillswap/marketplace'),
  getMyMatches: () => api.get('/api/skillswap/matches'),
  createOrUpdateOffer: (data) => api.put('/api/skillswap/offer', data),
  requestSwap: (providerOfferId, message) =>
    api.post('/api/skillswap/request', { providerOfferId, message }),
  respond: (swapId, accept, responseMessage) =>
    api.post(`/api/skillswap/${swapId}/respond`, { accept, responseMessage }),
  complete: (swapId) => api.post(`/api/skillswap/${swapId}/complete`),
  mySwaps: () => api.get('/api/skillswap/my-swaps'),
};

export const internshipApi = {
  getOffers: (department) =>
    api.get('/api/internships/offers', { params: department ? { department } : {} }),
  createOffer: (data) => api.post('/api/internships/offers', data),
  publishOffer: (offerId) => api.post(`/api/internships/offers/${offerId}/publish`),
  apply: (offerId, coverLetter, cvFile) => {
    const form = new FormData();
    form.append('offerId', offerId);
    if (coverLetter) form.append('coverLetter', coverLetter);
    if (cvFile) form.append('cv', cvFile);
    return api.post('/api/internships/apply', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  myApplications: () => api.get('/api/internships/my-applications'),
  applicationsForOffer: (offerId) => api.get(`/api/internships/offers/${offerId}/applications`),
  updateStatus: (appId, status, note) =>
    api.patch(`/api/internships/applications/${appId}/status`, { status, note }),
};

export default api;
