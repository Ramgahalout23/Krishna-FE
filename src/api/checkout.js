import client from './client';

export const checkoutAPI = {
  getSummary: (params) => client.get('/checkout/summary', { params }),
  calculateShipping: (data) => client.post('/checkout/shipping', data),
  applyCoupon: (data) => client.post('/checkout/coupon', data),
  removeCoupon: () => client.delete('/checkout/coupon'),
  calculateVolumeDiscount: (data) => client.post('/checkout/volume-discount', data),
  process: (data) => client.post('/checkout', data),
};
