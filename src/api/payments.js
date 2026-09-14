import client from './client';
import { adminClient } from './client';

export const paymentsAPI = {
  getMethods: () => client.get('/payments/methods'),
  initiate: (data) => client.post('/payments/initiate', data),
  verify: (id, data) => client.post(`/payments/${id}/verify`, data),
  getUserPayments: () => client.get('/payments'),
  getDetails: (id) => client.get(`/payments/${id}`),
  requestRefund: (id, data) => client.post(`/payments/${id}/refund`, data),
  getUserRefunds: () => client.get('/payments/refunds/list'),
  // Admin
  getAll: (params) => adminClient.get('/admin/payments/all', { params }),
  getStats: () => adminClient.get('/admin/payments/stats'),
  // Processed refunds (the `refunds` table — carries amount + payment_id, which
  // is what the admin refunds table renders). Distinct from refund *requests*.
  getRefunds: (params) => adminClient.get('/admin/refunds/all', { params }),
  approveRefund: (id) => adminClient.post(`/admin/refunds/${id}/approve`),
  rejectRefund: (id) => adminClient.post(`/admin/refunds/${id}/reject`),
  // Razorpay
  createRazorpayOrder: (data) => client.post('/payments/razorpay/create-order', data),
  verifyRazorpayPayment: (data) => client.post('/payments/razorpay/verify', data),
  // Custom gateways
  initiateCustomGateway: (data) => client.post('/payments/custom/initiate', data),
};
