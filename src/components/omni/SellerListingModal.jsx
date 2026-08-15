import { useState } from 'react';
import { X, Upload, Sparkles, CheckCircle2, Store, HelpCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { showSuccess } from '../../utils/toast';

const CATEGORY_LABELS = {
  ethnic: 'Sarees & Ethnic',
  kitchen: 'Kitchen & Dining',
  toys: 'Kids & Toys',
  home: 'Home & Bedding',
  tech: 'Electronics & Audio',
  lifestyle: 'Lifestyle',
};

const QUICK_PRESETS = [
  { type: 'saree', label: '🥻 Silk Saree', price: '₹649' },
  { type: 'kurti', label: '👗 Kurti Set', price: '₹529' },
  { type: 'chopper', label: '🧅 Veg Chopper', price: '₹249' },
  { type: 'earbuds', label: '🎧 TWS Earbuds', price: '₹599' },
];

const PRESET_DATA = {
  saree: {
    name: 'Banarasi Jacquard Soft Silk Saree with Blouse Piece',
    category: 'ethnic',
    supplierPrice: 399,
    sellingPrice: 649,
    mrpPrice: 1899,
    imageUrl: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    description: 'Grand Banarasi soft jacquard silk saree with rich woven gold zari border and matching unstitched blouse.',
    sellerName: 'Surat Silk House',
    stockCount: 50,
  },
  kurti: {
    name: 'Anarkali Printed Cotton Kurta with Dupatta Set',
    category: 'ethnic',
    supplierPrice: 320,
    sellingPrice: 529,
    mrpPrice: 1499,
    imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80',
    description: '100% Fine cotton flared Anarkali kurta set with intricate neck embroidery and matching printed dupatta.',
    sellerName: 'Jaipur Fashion Hub',
    stockCount: 40,
  },
  chopper: {
    name: 'Multipurpose Stainless Steel Dry Fruit & Veggie Chopper',
    category: 'kitchen',
    supplierPrice: 120,
    sellingPrice: 249,
    mrpPrice: 599,
    imageUrl: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=800&q=80',
    description: 'Instant string pull manual chopper with 3 stainless steel blades. BPA free unbreakable body.',
    sellerName: 'Apex Kitchen Suppliers',
    stockCount: 120,
  },
  earbuds: {
    name: 'Pro Wireless TWS Earbuds with LED Digital Battery Case',
    category: 'tech',
    supplierPrice: 350,
    sellingPrice: 599,
    mrpPrice: 1799,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    description: 'Deep bass Bluetooth earbuds with environmental noise cancellation for crystal clear calls.',
    sellerName: 'Digital India Electronics',
    stockCount: 95,
  },
};

export default function SellerListingModal({ isOpen, onClose, onAddProduct }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('ethnic');
  const [supplierPrice, setSupplierPrice] = useState(299);
  const [sellingPrice, setSellingPrice] = useState(499);
  const [mrpPrice, setMrpPrice] = useState(1299);
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [sellerName, setSellerName] = useState('My Store');
  const [stockCount, setStockCount] = useState(50);
  const [isSuccess, setIsSuccess] = useState(false);

  const profitMargin = Math.max(0, sellingPrice - supplierPrice);
  const discountPct = mrpPrice > sellingPrice ? Math.round(((mrpPrice - sellingPrice) / mrpPrice) * 100) : 0;

  const handleQuickPreset = (presetType) => {
    const preset = PRESET_DATA[presetType];
    if (!preset) return;
    setName(preset.name);
    setCategory(preset.category);
    setSupplierPrice(preset.supplierPrice);
    setSellingPrice(preset.sellingPrice);
    setMrpPrice(preset.mrpPrice);
    setImageUrl(preset.imageUrl);
    setDescription(preset.description);
    setSellerName(preset.sellerName);
    setStockCount(preset.stockCount);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalImage = imageUrl.trim() || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80';
    const categoryLabel = CATEGORY_LABELS[category] || 'General';

    const newProd = {
      id: `seller-${Date.now()}`,
      name: name.trim(),
      category,
      categoryLabel,
      price: Number(sellingPrice) || 499,
      oldPrice: Number(mrpPrice) || 1299,
      supplierPrice: Number(supplierPrice) || 299,
      rating: 4.9,
      reviewCount: 0,
      imageUrl: finalImage,
      images: [finalImage],
      description: description.trim() || 'High quality product listed by verified seller.',
      highlights: [
        '100% Quality Checked Product',
        'Free Delivery on All Orders across India',
        'Cash on Delivery (COD) Available',
        'Easy 7 Days Free Returns & Refunds',
      ],
      isNew: true,
      isBestSeller: true,
      discountPercentage: discountPct > 0 ? discountPct : 0,
      stockCount: Number(stockCount) || 50,
      quantity: Number(stockCount) || 50,
      codAvailable: true,
      freeDelivery: true,
      sellerName: sellerName || 'Verified Seller',
      tags: ['New Arrival', 'Free Delivery', 'COD Available'],
    };

    if (onAddProduct) onAddProduct(newProd);
    showSuccess('Product added to catalog successfully!');
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
      // Reset form
      setName('');
      setCategory('ethnic');
      setSupplierPrice(299);
      setSellingPrice(499);
      setMrpPrice(1299);
      setImageUrl('');
      setDescription('');
      setSellerName('My Store');
      setStockCount(50);
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-stone-200 overflow-hidden my-auto"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-700 p-4 sm:p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/20 rounded-xl backdrop-blur-md border border-amber-400/30">
                  <Store className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-base sm:text-lg font-extrabold tracking-tight">Store Owner Portal</h2>
                    <span className="bg-amber-400 text-stone-950 text-[10px] font-black px-1.5 py-0.5 rounded-md uppercase">Add Product</span>
                  </div>
                  <p className="text-xs text-stone-300">Quickly add products to your store catalog</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {isSuccess ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-extrabold text-stone-900">Product Published Successfully!</h3>
                <p className="text-xs text-stone-600 max-w-sm mx-auto">Your product is now live on the store catalog for customers across India.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                
                {/* Quick Presets */}
                <div className="bg-stone-50 border border-stone-200 p-3 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-stone-700 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Quick Auto-Fill:
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {QUICK_PRESETS.map((preset) => (
                      <button
                        key={preset.type}
                        type="button"
                        onClick={() => handleQuickPreset(preset.type)}
                        className="py-1.5 px-2 bg-white border border-stone-200 hover:border-amber-500 rounded-xl text-[11px] font-semibold text-stone-800 text-left truncate transition-all shadow-xs"
                      >
                        {preset.label} <span className="text-amber-700">({preset.price})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Product Name */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Pure Cotton Designer Jaipuri Print Kurti Set"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Pricing Row */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">Supplier Price (₹)</label>
                    <input type="number" required value={supplierPrice} min={0}
                      onChange={(e) => setSupplierPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">Selling Price (₹)</label>
                    <input type="number" required value={sellingPrice} min={0}
                      onChange={(e) => setSellingPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">MRP (₹)</label>
                    <input type="number" required value={mrpPrice} min={0}
                      onChange={(e) => setMrpPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                </div>

                {/* Profit Calculator */}
                {sellingPrice > supplierPrice && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-800">💰 Profit Margin:</span>
                    <span className="font-extrabold text-emerald-700">₹{profitMargin} per unit</span>
                    <span className="font-extrabold text-emerald-700">({Math.round((profitMargin / sellingPrice) * 100)}% margin)</span>
                  </div>
                )}

                {/* Image URL */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Image URL</label>
                  <input type="url" value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/product-image.jpg"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  <p className="text-[10px] text-stone-400 mt-1">Leave empty to use a default product image</p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1">Description</label>
                  <textarea value={description} rows={2}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief product description..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none" />
                </div>

                {/* Seller Name & Stock */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">Seller Name</label>
                    <input type="text" value={sellerName}
                      onChange={(e) => setSellerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">Stock Count</label>
                    <input type="number" required value={stockCount} min={0}
                      onChange={(e) => setStockCount(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  </div>
                </div>

                {/* Submit */}
                <div className="pt-3 border-t border-stone-200">
                  <button
                    type="submit"
                    className="w-full py-3 bg-stone-900 hover:bg-amber-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-md"
                  >
                    <Upload className="w-4 h-4" /> Publish Product to Store
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-[10px] text-stone-400 text-center mt-2">
                    <HelpCircle className="w-3 h-3 inline mr-0.5" /> Product will be added with COD, Free Delivery & 7-Day Returns
                  </p>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
