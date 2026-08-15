import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, CheckCircle2, CreditCard, Truck, ShieldCheck, ShoppingBag, ArrowLeft, ArrowRight, Wallet, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useCartStore from '../../store/cartStore';
import { formatCurrency } from '../../utils/formatters';

export default function CheckoutModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { items: cartItems, subtotal, clearCart } = useCartStore();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: 'Maharashtra',
    zipCode: '',
    paymentMethod: 'cod',
  });
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');

  const total = subtotal;

  const handleNext = (e) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      const newId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
      setOrderId(newId);
      setOrderPlaced(true);
      clearCart();
      setTimeout(() => {
        onClose();
        setStep(1);
        setOrderPlaced(false);
        navigate(`/order/thank-you/${newId}`);
      }, 2000);
    }
  };

  const handleClose = () => {
    onClose();
    setStep(1);
    setOrderPlaced(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-stone-200 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-stone-900 via-rose-950 to-stone-900 text-white flex items-center justify-between border-b border-stone-800">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-bold">
                  {orderPlaced ? 'Order Confirmed!' : 'Fast Checkout • Free Shipping'}
                </h2>
              </div>
              <button onClick={handleClose} className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step Progress */}
            {!orderPlaced && (
              <div className="bg-stone-50 border-b border-stone-200 px-6 py-3 flex items-center justify-between text-xs font-bold text-stone-600">
                <div className={`flex items-center gap-2 ${step === 1 ? 'text-amber-700 font-extrabold' : 'text-stone-400'}`}>
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center text-[11px]">1</span>
                  <span>Delivery Address</span>
                </div>
                <div className="h-0.5 w-12 bg-stone-200" />
                <div className={`flex items-center gap-2 ${step === 2 ? 'text-amber-700 font-extrabold' : 'text-stone-400'}`}>
                  <span className="w-5 h-5 rounded-full bg-stone-300 text-stone-800 flex items-center justify-center text-[11px]">2</span>
                  <span>Payment & COD</span>
                </div>
              </div>
            )}

            {/* Order Confirmed */}
            {orderPlaced ? (
              <div className="p-8 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-extrabold text-stone-900">Order Confirmed Successfully!</h3>
                <p className="text-xs text-stone-600 max-w-sm mx-auto">
                  Your order ID <strong className="text-stone-900 font-mono">{orderId}</strong> has been booked. Tracking updates will be sent via SMS & WhatsApp.
                </p>
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 max-w-md mx-auto text-left text-xs space-y-2">
                  <div className="flex justify-between font-semibold text-stone-700">
                    <span>Deliver To:</span>
                    <span>{formData.fullName}, {formData.city}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-stone-700">
                    <span>Payment:</span>
                    <span className="text-amber-700 uppercase font-bold">{formData.paymentMethod === 'cod' ? 'Cash on Delivery' : formData.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-stone-700">
                    <span>Delivery:</span>
                    <span className="text-emerald-700 font-bold">3-4 Days</span>
                  </div>
                </div>
              </div>
            ) : step === 1 ? (
              <form onSubmit={handleNext} className="p-6 space-y-4">
                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-2">Delivery Address</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Full Name *</label>
                    <input type="text" required value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Mobile Number *</label>
                    <input type="tel" required value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="10-digit mobile number"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Address *</label>
                    <input type="text" required value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">City *</label>
                    <input type="text" required value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">State *</label>
                    <select value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-amber-500">
                      <option>Maharashtra</option>
                      <option>Delhi / NCR</option>
                      <option>Karnataka</option>
                      <option>Uttar Pradesh</option>
                      <option>Gujarat</option>
                      <option>Tamil Nadu</option>
                      <option>West Bengal</option>
                      <option>Rajasthan</option>
                      <option>Telangana</option>
                      <option>Punjab</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">Pincode *</label>
                    <input type="text" required maxLength={6} value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-medium outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                </div>
                <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
                  <div className="text-xs text-stone-500">Total: <strong className="text-stone-900 text-sm">{formatCurrency(total)}</strong></div>
                  <button type="submit" className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 shadow-md">
                    Proceed To Payment <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleNext} className="p-6 space-y-4">
                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider mb-2">Select Payment Method</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { id: 'cod', label: 'Cash on Delivery', icon: <Truck className="w-4 h-4 text-emerald-600" /> },
                    { id: 'upi', label: 'UPI / GPay / PhonePe', icon: <QrCode className="w-4 h-4 text-amber-600" /> },
                    { id: 'card', label: 'Credit / Debit Card', icon: <CreditCard className="w-4 h-4 text-amber-600" /> },
                    { id: 'netbanking', label: 'Net Banking', icon: <Wallet className="w-4 h-4 text-stone-600" /> },
                  ].map((p) => (
                    <button key={p.id} type="button" onClick={() => setFormData({ ...formData, paymentMethod: p.id })}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${formData.paymentMethod === p.id ? 'border-amber-600 bg-amber-50/80 ring-1 ring-amber-500' : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'}`}>
                      {p.icon}
                      <span className="block text-xs font-bold mt-2">{p.label}</span>
                    </button>
                  ))}
                </div>

                {formData.paymentMethod === 'cod' && (
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-xs text-emerald-900 space-y-1">
                    <div className="font-extrabold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" /> Cash on Delivery Selected
                    </div>
                    <p className="text-[11px]">Pay {formatCurrency(total)} in cash when your parcel arrives!</p>
                  </div>
                )}

                <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
                  <button type="button" onClick={() => setStep(1)} className="text-xs font-bold text-stone-600 hover:text-stone-900 flex items-center gap-1">
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                  <button type="submit" className="px-6 py-3.5 bg-stone-900 hover:bg-amber-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all">
                    Place Order ({formatCurrency(total)})
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
