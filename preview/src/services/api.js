import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hubToken') || localStorage.getItem('adminToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

export default api;

/** Admin/Super → /admin ; Support Agent → /support */
export const crmBase = () =>
  useAuthStore.getState().user?.role === 'support_agent' ? '/support' : '/admin';

/** Download a blob API response as a file (Excel exports). */
export async function downloadBlob(requestPromise, fallbackFilename = 'export.xlsx') {
  const res = await requestPromise;
  const disposition = res.headers?.['content-disposition'] || '';
  const match = disposition.match(/filename="?([^"]+)"?/i);
  const filename = match?.[1] || fallbackFilename;
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const getFeaturedProjects = (params) => api.get('/projects/featured', { params });
export const getProjects = (params) => api.get('/projects', { params });
export const getProjectBySlug = (slug) => api.get(`/projects/${slug}`);
export const getProjectReviews = (slug, params) => api.get(`/projects/${slug}/reviews`, { params });
export const getRecommendedProjects = (params) => api.get('/projects/recommend', { params });
export const incrementProjectView = (id) => api.post(`/projects/${id}/view`);
export const buyNowProject = (slug) => api.post(`/client/projects/${slug}/buy-now`);
export const createClientReview = (data) => api.post('/client/reviews', data);

export const getMySupportTickets = (params) => api.get('/client/support', { params });
export const createSupportTicket = (data) => api.post('/client/support', data);
export const getMySupportTicket = (id) => api.get(`/client/support/${id}`);
export const replyMySupportTicket = (id, data) => api.post(`/client/support/${id}/reply`, data);

export const getDeveloperSupportTickets = (params) => api.get('/developer/support', { params });
export const createDeveloperSupportTicket = (data) => api.post('/developer/support', data);
export const getDeveloperSupportTicket = (id) => api.get(`/developer/support/${id}`);
export const replyDeveloperSupportTicket = (id, data) =>
  api.post(`/developer/support/${id}/reply`, data);

export const getAdminSupportTickets = (params) => api.get(`${crmBase()}/support`, { params });
export const getAdminSupportTicket = (id) => api.get(`${crmBase()}/support/${id}`);
export const updateAdminSupportTicket = (id, data) =>
  api.patch(`${crmBase()}/support/${id}`, data);

/** Public live chat */
export const startLiveChat = (data) => api.post('/chat/start', data);
export const getLiveChat = (id, token) =>
  api.get(`/chat/${id}`, { params: { token } });
export const sendLiveChatMessage = (id, data) => api.post(`/chat/${id}/messages`, data);

/** Staff live chat inbox */
export const getStaffLiveChats = (params) => api.get(`${crmBase()}/live-chat`, { params });
export const getStaffLiveChat = (id) => api.get(`${crmBase()}/live-chat/${id}`);
export const replyStaffLiveChat = (id, data) => api.post(`${crmBase()}/live-chat/${id}/reply`, data);
export const updateStaffLiveChat = (id, data) => api.patch(`${crmBase()}/live-chat/${id}`, data);

export const getDirectoryUsers = (params) =>
  api.get(`${crmBase()}/directory/users`, { params });
export const getDirectoryUser = (id) => api.get(`${crmBase()}/directory/users/${id}`);
export const createDirectoryUser = (data) => api.post('/admin/directory/users', data);
export const updateDirectoryUser = (id, data) => api.patch(`/admin/directory/users/${id}`, data);
export const getProjectOpsDetail = (id) => api.get(`${crmBase()}/projects/${id}/ops`);
export const getFollowUps = (params) => api.get(`${crmBase()}/follow-ups`, { params });
export const createFollowUp = (data) => api.post(`${crmBase()}/follow-ups`, data);
export const updateFollowUp = (id, data) => api.patch(`${crmBase()}/follow-ups/${id}`, data);
export const getFollowUpReport = (params) =>
  api.get(`${crmBase()}/follow-ups/report`, { params });
export const getSupportDashboard = () => api.get('/support/dashboard');

export const getAdminReviews = (params) => api.get('/admin/reviews', { params });
export const moderateAdminReview = (id, data) => api.patch(`/admin/reviews/${id}`, data);
export const curateAdminProject = (id, data) => api.patch(`/admin/projects/${id}/curate`, data);

export const getAuditLogs = (params) => api.get('/super-admin/audit-logs', { params });
export const updateSuperBillingSettings = (data) =>
  api.put('/super-admin/settings/billing', data);
export const updateSuperSmtpSettings = (data) => api.put('/super-admin/settings/smtp', data);
export const updateSuperCompanySettings = (data) =>
  api.put('/super-admin/settings/company', data);
export const getSuperAnalytics = () => api.get('/super-admin/analytics');
export const getAbandonedQuotes = (params) =>
  api.get('/super-admin/analytics/abandoned-quotes', { params });
export const remindAbandonedQuotes = (data) =>
  api.post('/super-admin/analytics/abandoned-quotes/remind', data);
export const getPublicDeveloper = (id) => api.get(`/developers/${id}`);
export const getPublicDevelopers = () => api.get('/developers');
export const getCategories = () => api.get('/categories');
export const submitRequirement = (data) => api.post('/requirements', data);
export const submitCustomization = (data) => api.post('/customization-requests', data);

export const uploadImage = (file) => {
  const formData = new FormData();
  formData.append('image', file);
  return api.post('/upload/image', formData);
};

export const uploadImages = async (files) => {
  const results = [];
  for (const file of files) {
    const res = await uploadImage(file);
    results.push(res.data.data);
  }
  return results;
};

export const loginUser = (data) => api.post('/auth/login', data);
export const registerUser = (data) => api.post('/auth/register', data);
export const getMe = () => api.get('/auth/me');

export const loginAdmin = loginUser;

export const getDashboard = () => api.get('/admin/dashboard');
export const getAdminReports = (params) => api.get('/admin/reports', { params });
export const exportAdminReportsExcel = (params) =>
  api.get('/admin/reports/export', { params, responseType: 'blob' });
export const getAdminProjects = (params) => api.get('/admin/projects', { params });
export const getAdminProject = (id) => api.get(`/admin/projects/${id}`);
export const createAdminProject = (data) => api.post('/admin/projects', data);
export const updateAdminProject = (id, data) => api.put(`/admin/projects/${id}`, data);
export const deleteAdminProject = (id) => api.delete(`/admin/projects/${id}`);
export const getAdminRequirements = (params) =>
  api.get(`${crmBase()}/requirements`, { params });
export const getAdminCustomizations = (params) =>
  api.get(`${crmBase()}/customization-requests`, { params });
export const exportAdminRequirementsExcel = (params) =>
  api.get('/admin/requirements/export', { params, responseType: 'blob' });
export const exportAdminCustomizationsExcel = (params) =>
  api.get('/admin/customization-requests/export', { params, responseType: 'blob' });
export const getAdminDevelopers = (params) => api.get('/admin/developers', { params });
export const updateDeveloperVerification = (id, data) => api.patch(`/admin/developers/${id}`, data);
export const updateRequirementStatus = (id, data) =>
  api.patch(`${crmBase()}/requirements/${id}/status`, data);
export const updateCustomizationStatus = (id, data) =>
  api.patch(`${crmBase()}/customization-requests/${id}/status`, data);
export const updateProjectStatus = (id, data) => api.patch(`/admin/projects/${id}/status`, data);

export const getAdminCategories = (params) => api.get('/admin/categories', { params });
export const createAdminCategory = (data) => api.post('/admin/categories', data);
export const updateAdminCategory = (id, data) => api.put(`/admin/categories/${id}`, data);
export const deleteAdminCategory = (id) => api.delete(`/admin/categories/${id}`);

export const getSuperDashboard = () => api.get('/super-admin/dashboard');
export const getSuperReports = (params) => api.get('/super-admin/reports', { params });
export const exportSuperReportsExcel = (params) =>
  api.get('/super-admin/reports/export', { params, responseType: 'blob' });
export const getSuperUsers = (params) => api.get('/super-admin/users', { params });
export const updateSuperUser = (id, data) => api.patch(`/super-admin/users/${id}`, data);
export const createAdminUser = (data) => api.post('/super-admin/admins', data);

export const getSuperSettings = () => api.get('/super-admin/settings');
export const updateSuperPaymentSettings = (data) =>
  api.put('/super-admin/settings/payments', data);
export const updateSuperCloudinarySettings = (data) =>
  api.put('/super-admin/settings/cloudinary', data);

export const getPaymentReportSummary = (params) =>
  api.get('/super-admin/payment-reports/summary', { params });
export const getPaymentReportDevelopers = (params) =>
  api.get('/super-admin/payment-reports/developers', { params });
export const getPaymentReportDeveloperDetail = (id, params) =>
  api.get(`/super-admin/payment-reports/developers/${id}`, { params });
export const getPaymentReportTransactions = (params) =>
  api.get('/super-admin/payment-reports/transactions', { params });
export const exportPaymentReportTransactionsExcel = (params) =>
  api.get('/super-admin/payment-reports/transactions/export', { params, responseType: 'blob' });
export const exportAbandonedQuotesExcel = (params) =>
  api.get('/super-admin/analytics/abandoned-quotes/export', { params, responseType: 'blob' });


export const getDeveloperDashboard = () => api.get('/developer/dashboard');
export const getDeveloperProjects = (params) => api.get('/developer/projects', { params });
export const submitDeveloperProject = (data) => api.post('/developer/projects', data);
export const getDeveloperRequests = (params) => api.get('/developer/requests', { params });
export const submitDeveloperQuote = (id, data) => api.post(`/developer/requests/${id}/quote`, data);
export const updateDeveloperProfile = (data) => api.patch('/developer/profile', data);

export const getDeveloperEarnings = (params) => api.get('/developer/earnings', { params });
export const getDeveloperWallet = () => api.get('/developer/wallet');
export const getDeveloperSettlements = (params) => api.get('/developer/settlements', { params });
export const getDeveloperPayouts = (params) => api.get('/developer/payouts', { params });
export const createDeveloperPayout = (data) => api.post('/developer/payouts', data);

export const getAdminPayouts = (params) => api.get('/admin/payouts', { params });
export const exportAdminPayoutsExcel = (params) =>
  api.get('/admin/payouts/export', { params, responseType: 'blob' });
export const reviewAdminPayout = (id, data) => api.patch(`/admin/payouts/${id}`, data);

const couponBase = () => {
  try {
    const user = JSON.parse(localStorage.getItem('hubUser') || 'null');
    return user?.role === 'developer' ? '/developer/coupons' : '/admin/coupons';
  } catch {
    return '/admin/coupons';
  }
};

export const getCoupons = (params) => api.get(couponBase(), { params });
export const createCoupon = (data) => api.post(couponBase(), data);
export const updateCoupon = (id, data) => api.patch(`${couponBase()}/${id}`, data);

export const previewClientCoupon = (data) => api.post('/client/coupons/preview', data);
export const markAdminQuotationDelivered = (id) => api.post(`/admin/quotations/${id}/deliver`);
export const refundAdminTransaction = (id, data) =>
  api.post(`/admin/transactions/${id}/refund`, data);

export const getClientDashboard = () => api.get('/client/dashboard');
export const getClientRequirements = (params) => api.get('/client/requirements', { params });
export const getClientCustomizations = (params) => api.get('/client/customizations', { params });
export const updateClientProfile = (data) => api.patch('/client/profile', data);

export const submitContact = (data) => api.post('/contact', data);
export const getAdminContacts = (params) => api.get(`${crmBase()}/contacts`, { params });
export const updateAdminContactStatus = (id, data) =>
  api.patch(`${crmBase()}/contacts/${id}`, data);

export const getAdminApprovals = (params) => api.get('/admin/approvals', { params });
export const reviewAdminApproval = (id, data) => api.patch(`/admin/approvals/${id}`, data);

export const getAdminQuotations = (params) => api.get('/admin/quotations', { params });
export const exportAdminQuotationsExcel = (params) =>
  api.get('/admin/quotations/export', { params, responseType: 'blob' });
export const getAdminQuotation = (id) => api.get(`/admin/quotations/${id}`);
export const createAdminQuotation = (data) => api.post('/admin/quotations', data);
export const updateAdminQuotation = (id, data) => api.put(`/admin/quotations/${id}`, data);
export const sendAdminQuotation = (id) => api.post(`/admin/quotations/${id}/send`);
export const downloadAdminQuotationPdf = (id) =>
  api.get(`/admin/quotations/${id}/pdf`, { responseType: 'blob' });

export const getAdminInvoices = (params) => api.get('/admin/invoices', { params });
export const exportAdminInvoicesExcel = (params) =>
  api.get('/admin/invoices/export', { params, responseType: 'blob' });
export const downloadAdminInvoicePdf = (id) =>
  api.get(`/admin/invoices/${id}/pdf`, { responseType: 'blob' });
export const getAdminTransactions = (params) => api.get('/admin/transactions', { params });
export const exportAdminTransactionsExcel = (params) =>
  api.get('/admin/transactions/export', { params, responseType: 'blob' });
export const getAdminSettlements = (params) => api.get('/admin/settlements', { params });
export const exportAdminSettlementsExcel = (params) =>
  api.get('/admin/settlements/export', { params, responseType: 'blob' });
export const createAdminSettlement = (data) => api.post('/admin/settlements', data);
export const updateAdminSettlement = (id, data) => api.patch(`/admin/settlements/${id}`, data);

export const getClientQuotations = (params) => api.get('/client/quotations', { params });
export const respondClientQuotation = (id, data) => api.post(`/client/quotations/${id}/respond`, data);
export const payClientQuotation = (id, body = {}) =>
  api.post(`/client/quotations/${id}/pay`, body);
export const confirmClientPayment = (data) => api.post('/client/payments/confirm', data);
export const downloadClientQuotationPdf = (id) =>
  api.get(`/client/quotations/${id}/pdf`, { responseType: 'blob' });
export const getClientInvoices = (params) => api.get('/client/invoices', { params });
export const exportClientInvoicesExcel = (params) =>
  api.get('/client/invoices/export', { params, responseType: 'blob' });
export const downloadClientInvoicePdf = (id) =>
  api.get(`/client/invoices/${id}/pdf`, { responseType: 'blob' });

