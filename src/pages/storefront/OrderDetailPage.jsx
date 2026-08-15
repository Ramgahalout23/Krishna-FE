import { Star, Bell, Mail, Phone, CheckCircle } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

;
import { motion, AnimatePresence } from 'framer-motion';
import SEOHead from '../../components/seo/SEOHead';
import Breadcrumb from '../../components/common/Breadcrumb';
import { ordersAPI } from '../../api/orders';
import { formatCurrency, formatDate, getImageUrl } from '../../utils/formatters';
import { ORDER_STATUSES, SHIPPING_STATUSES } from '../../utils/constants';
import { useSettings } from '../../store/useSettings';
import toast from '../../utils/toast';
import OrderDetailSkeleton from '../../components/ui/OrderDetailSkeleton';
import ReviewFormModal from '../../components/product/ReviewFormModal';

export default function OrderDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { getSetting } = useSettings();
  const storeName = getSetting('storeName', 'Krishna Store');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState({ open: false, productId: '', productName: '' });

  // ── Order Subscription State ──
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);
  const [subEmail, setSubEmail] = useState('');
  const [subPhone, setSubPhone] = useState('');
  const [subEmailUpdates, setSubEmailUpdates] = useState(true);
  const [subSmsUpdates, setSubSmsUpdates] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await ordersAPI.getById(id);
        setOrder(res.data?.data || null);
      } catch (err) {
        const status = err?.response?.status;
        const serverMsg = err?.response?.data?.error?.message || err?.response?.data?.message || '';

        if (status === 404) {
          toast.error(t('orders.detail.not_found'));
        } else if (status === 403) {
          toast.error(t('orders.detail.forbidden', { defaultValue: 'You do not have permission to view this order' }));
        } else if (status === 401) {
          toast.error(t('orders.detail.login_required', { defaultValue: 'Please log in to view this order' }));
        } else if (status >= 500) {
          toast.error(serverMsg || t('orders.detail.server_error', { defaultValue: 'Server error. Please try again later.' }));
        } else {
          toast.error(serverMsg || t('orders.detail.not_found'));
        }

        // Log the full error for debugging
        console.warn('[OrderDetailPage] Failed to fetch order:', { id, status, message: serverMsg || err.message });
      } finally { setLoading(false); }
    };
    fetch();
  }, [id]);

  const handleCancel = async () => {
    try { await ordersAPI.cancel(id); setOrder((o) => ({ ...o, status: 'CANCELLED' })); toast.success(t('orders.detail.order_cancelled')); } catch { toast.error(t('orders.detail.failed_cancel')); }
  };

  const handleReviewSubmitted = useCallback(() => {
    toast.success(t('orders.detail.review_submitted'));
  }, []);

  const isDelivered = order?.status === 'DELIVERED' || order?.status === 'COMPLETED';

  if (loading) return <OrderDetailSkeleton />;
  if (!order) return (
    <div className="min-h-screen bg-stone-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-stone-200">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-stone-400">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h3 className="text-lg font-bold text-stone-900 mb-2">{t('orders.detail.not_found')}</h3>
          <p className="text-sm text-stone-500 mb-6">{t('orders.detail.not_found_desc', { defaultValue: 'We couldn\'t find this order. It may have been removed or you may not have access.' })}</p>
          <button
            onClick={() => navigate('/orders')}
            className="px-5 py-2.5 rounded-xl bg-amber-500 text-stone-950 text-sm font-bold hover:bg-amber-400 transition-all duration-200 inline-flex items-center gap-2 shadow-md shadow-amber-500/20"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            {t('orders.back_to_orders', { defaultValue: 'Back to Orders' })}
          </button>
        </div>
      </div>
    </div>
  );

  const steps = SHIPPING_STATUSES;
  const currentStep = steps.indexOf(order.shippingStatus || 'PENDING');

  return (
    <div className="min-h-screen bg-stone-100">
      <SEOHead
        title={`Order #${id?.slice(0, 8) || id} | ${storeName}`}
        description={`View order details and track shipping status for order at ${storeName}.`}
        noIndex={true}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        <Breadcrumb
          items={[
            { label: t('nav.home'), href: '/' },
            { label: t('profile.title'), href: '/profile' },
            { label: t('orders.title'), href: '/orders' },
            { label: `#${order.id?.slice(0, 8) || id}` },
          ]}
          variant="light"
          className="mb-6"
        />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16">
        {/* Order Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <span className="text-xs font-bold text-amber-600 uppercase tracking-widest block mb-1">{t('orders.detail.placed', { date: formatDate(order.createdAt) })}</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">#{order.id?.slice(0, 8) || id}</h2>
          </div>
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold w-fit ${
            ['CONFIRMED','PROCESSING','SHIPPED','DELIVERED','COMPLETED'].includes(order.status)
              ? 'bg-amber-100 text-amber-800'
              : order.status === 'CANCELLED' || order.status === 'FAILED'
              ? 'bg-red-50 text-red-700'
              : order.status === 'PENDING'
              ? 'bg-amber-50 text-amber-700'
              : order.status === 'RETURNED'
              ? 'bg-purple-50 text-purple-700'
              : 'bg-stone-100 text-stone-600'
          }`}>{ORDER_STATUSES[order.status]?.label || order.status}</span>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 md:p-7 mb-6 shadow-sm hover:shadow-md hover:border-amber-200 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-stone-900 text-base">
              <span className="inline-flex items-center gap-2">📦 {t('orders.detail.order_timeline')}</span>
            </h3>
          </div>
          <div className="space-y-3">
            {steps.map((step, i) => {
              const isCompleted = i <= currentStep;
              return (
                <div key={step} className="flex items-center gap-3 md:gap-4">
                  {/* Step circle */}
                  <div className={`w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center shrink-0 text-xs md:text-sm font-bold transition-all ${
                    isCompleted
                      ? 'bg-amber-500 text-stone-950 shadow-md shadow-amber-500/20'
                      : 'bg-stone-100 text-stone-400 border border-stone-200'
                  }`}>
                    {isCompleted ? '✓' : i + 1}
                  </div>
                  {/* Connector line */}
                  {i < steps.length - 1 && (
                    <div className={`w-px h-8 md:h-10 shrink-0 mx-1 ${
                      i + 1 <= currentStep ? 'bg-amber-300' : 'bg-stone-200'
                    }`} />
                  )}
                  {/* Step label */}
                  <span className={`text-xs md:text-sm font-semibold ${
                    isCompleted ? 'text-stone-900' : 'text-stone-400'
                  }`}>
                    {step.replace(/_/g, ' ')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 md:p-7 mb-6 shadow-sm hover:shadow-md hover:border-amber-200 transition-all duration-300">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-stone-900 text-base">
              <span className="inline-flex items-center gap-2">🛍️ {t('orders.detail.items')} <span className="text-sm font-normal text-stone-500">({order.items?.length || 0})</span></span>
            </h3>
          </div>
          <div className="space-y-3">
            {(order.items || []).map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-stone-200 hover:border-amber-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
                {/* Product Image with Hover Zoom */}
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-stone-50 border border-stone-200 overflow-hidden flex-shrink-0 group-hover:ring-2 group-hover:ring-amber-300/60 group-hover:shadow-lg transition-all duration-500">
                  {item.imageUrl ? (
                    <img
                      src={getImageUrl(item.imageUrl)}
                      alt={item.name || item.productName || 'Product'}
                      className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-500 ease-out cursor-zoom-in"
                      loading="lazy"
                    />
                  ) : item.images?.[0]?.url ? (
                    <img
                      src={getImageUrl(item.images[0].url)}
                      alt={item.name || item.productName || 'Product'}
                      className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-500 ease-out cursor-zoom-in"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                  )}
                </div>
                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-stone-900 line-clamp-1">{item.name || item.productName || `Product ${item.productId}`}</h4>
                  {item.size || item.color ? (
                    <p className="text-xs text-stone-500 mt-0.5">{ [item.size, item.color].filter(Boolean).join(' / ') }</p>
                  ) : null}
                </div>
                {/* Qty */}
                <div className="text-center shrink-0">
                  <p className="text-xs text-stone-500 font-medium">{t('orders.detail.qty')}</p>
                  <p className="font-bold text-stone-900">{item.quantity}</p>
                </div>
                {/* Price */}
                <div className="text-right shrink-0 min-w-[80px]">
                  <p className="text-xs text-stone-500 font-medium">{t('orders.detail.price')}</p>
                  <p className="font-bold text-stone-900">{formatCurrency(item.price)}</p>
                  <p className="text-[10px] text-stone-400">{t('cart.total')}: {formatCurrency(item.price * item.quantity)}</p>
                </div>
                {/* Review Button */}
                {isDelivered && (
                  <button
                    onClick={() => setReviewModal({
                      open: true,
                      productId: item.productId,
                      productName: item.name || item.productName || 'Product',
                    })}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold hover:bg-amber-100 hover:border-amber-300 transition-all duration-200 active:scale-95"
                  >
                    <Star size={12} />
                    {t('orders.write_review')}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {order.notes && (
          <div className="bg-white rounded-2xl border border-stone-200 p-5 md:p-7 mb-6 shadow-sm">
            <h3 className="font-bold text-sm text-stone-900 mb-2 flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              Additional Comments
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">{order.notes}</p>
          </div>
        )}

        {/* Total & Actions */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 md:p-7 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-amber-600 uppercase tracking-widest block mb-1">{t('orders.detail.payment_summary')}</span>
              <span className="text-2xl font-extrabold text-stone-900">{formatCurrency(order.total || order.totalAmount)}</span>
            </div>
            {order.status === 'PENDING' && (
              <button
                onClick={handleCancel}
                className="px-5 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-bold hover:bg-red-100 transition-all duration-200 active:scale-95"
              >
                {t('orders.detail.cancel_order')}
              </button>
            )}
          </div>
        </div>

        {/* ── Order Updates Subscription ── */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 md:p-7 mt-6 shadow-sm hover:shadow-md hover:border-amber-200 transition-all duration-300">
          <button
            onClick={() => setSubscriptionOpen(!subscriptionOpen)}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${subscribed ? 'bg-amber-100 text-amber-600' : 'bg-stone-100 text-stone-400'}`}>
                {subscribed ? <CheckCircle size={20} /> : <Bell size={20} />}
              </div>
              <div>
                <h3 className="font-bold text-base text-stone-900">
                  {t('orders.detail.subscription_title')}
                </h3>
                <p className="text-xs md:text-sm text-stone-500 mt-0.5">
                  {subscribed
                    ? t('orders.detail.subscription_active')
                    : t('orders.detail.subscription_desc')}
                </p>
              </div>
            </div>
            <svg
              className={`w-5 h-5 text-text-muted transition-transform duration-200 ${subscriptionOpen ? 'rotate-180' : ''}`}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          <AnimatePresence initial={false}>
            {subscriptionOpen && !subscribed && (
              <motion.div
                key="subscription-form"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div className="pt-4 border-t border-stone-200 mt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Email */}
                    <div>
                      <label className="block text-xs font-bold text-stone-900 mb-1.5 uppercase tracking-wider">
                        <Mail size={12} />
                        {t('checkout.email')}
                      </label>
                      <input
                        type="email"
                        value={subEmail}
                        onChange={(e) => setSubEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                      />
                    </div>
                    {/* Phone */}
                    <div>
                      <label className="block text-xs font-bold text-stone-900 mb-1.5 uppercase tracking-wider">
                        <Phone size={12} />
                        {t('checkout.phone')}
                      </label>
                      <input
                        type="tel"
                        value={subPhone}
                        onChange={(e) => setSubPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Toggles */}
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={subEmailUpdates}
                        onChange={() => setSubEmailUpdates(!subEmailUpdates)}
                        className="w-4 h-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500/30"
                      />
                      <span className="text-sm font-bold text-stone-700 group-hover:text-stone-900 transition-colors">
                        {t('orders.detail.email_updates')}
                      </span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={subSmsUpdates}
                        onChange={() => setSubSmsUpdates(!subSmsUpdates)}
                        className="w-4 h-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500/30"
                      />
                      <span className="text-sm font-bold text-stone-700 group-hover:text-stone-900 transition-colors">
                        {t('orders.detail.sms_updates')}
                      </span>
                    </label>
                  </div>

                  <button
                    onClick={async () => {
                      if (!subEmail && !subPhone) { toast.error(t('orders.detail.subscription_required')); return; }
                      setSubscribing(true);
                      try {
                        await ordersAPI.subscribeUpdates(id, {
                          email: subEmail || null,
                          phone: subPhone || null,
                          email_updates: subEmailUpdates,
                          sms_updates: subSmsUpdates,
                        });
                        setSubscribed(true);
                        setSubscriptionOpen(false);
                        toast.success(t('orders.detail.subscribed_success'));
                      } catch {
                        toast.error(t('orders.detail.subscribed_failed'));
                      } finally {
                        setSubscribing(false);
                      }
                    }}
                    disabled={subscribing}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 text-stone-950 text-sm font-bold hover:bg-amber-400 transition-all duration-200 active:scale-[0.97] disabled:opacity-50 inline-flex items-center justify-center gap-2 shadow-md shadow-amber-500/20"
                  >
                    {subscribing ? (
                      <><div className="spinner w-4 h-4 border-2 border-amber-800/30 border-t-amber-900 rounded-full" /> Subscribing...</>
                    ) : (
                      <><Bell size={14} /> {t('orders.detail.subscribe_btn')}</>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {subscribed && (
            <div className="flex items-center gap-2.5 pt-4 border-t border-stone-200 mt-4">
              <span className="text-sm font-medium text-amber-800">
                {subEmail && `${t('checkout.email')}: ${subEmail}`}
                {subEmail && subPhone && ' — '}
                {subPhone && `${t('checkout.phone')}: ${subPhone}`}
              </span>
              <button
                onClick={() => {
                  setSubscribed(false);
                  setSubscriptionOpen(true);
                }}
                className="text-xs font-bold text-amber-600 underline-offset-2 hover:underline ml-auto"
              >
                {t('common.edit')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Review Form Modal */}
      <ReviewFormModal
        isOpen={reviewModal.open}
        onClose={() => setReviewModal({ open: false, productId: '', productName: '' })}
        productId={reviewModal.productId}
        productName={reviewModal.productName}
        orderId={id}
        onSuccess={handleReviewSubmitted}
      />
    </div>
  );
}
