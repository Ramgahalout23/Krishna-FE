import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Heart, Eye, ShoppingBag, Check, Flame, Share2, ShieldCheck, Truck } from 'lucide-react';
import useCartStore from '../../store/cartStore';
import useWishlistStore from '../../store/wishlistStore';
import { getImageUrl, formatCurrency } from '../../utils/formatters';
import { wishlistAPI } from '../../api/wishlist';
import { addedToCart, addedToWishlist, removedFromWishlist } from '../../utils/toast';

export default function ProductCard({ product, onQuickView, isCompact = false }) {
  const navigate = useNavigate();
  const { addItem } = useCartStore();
  const { isInWishlist, addItem: addToWL, removeItem: removeFromWL } = useWishlistStore();
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [isAddedAnim, setIsAddedAnim] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const images = product.productimage || product.images || [];
  const imgUrl = images.length > 0 ? (images[0]?.url || images[0]) : (product.imageUrl || null);
  const hoverImgUrl = images.length > 1 ? (images[1]?.url || images[1]) : '';
  const inWishlist = isInWishlist(product.id);
  const discount = product.oldPrice ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : product.discountPercentage;

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addItem({ ...product, productId: product.id, quantity: 1 });
    setIsAddedAnim(true);
    addedToCart(product.name);
    setTimeout(() => setIsAddedAnim(false), 1200);
  };

  const handleWishlist = async (e) => {
    e.stopPropagation();
    try {
      if (inWishlist) {
        await wishlistAPI.remove(product.id);
        removeFromWL(product.id);
        removedFromWishlist();
      } else {
        await wishlistAPI.add({ productId: product.id });
        addToWL(product);
        addedToWishlist();
      }
    } catch {
      inWishlist ? removeFromWL(product.id) : addToWL(product);
    }
  };

  const handleWhatsappShare = (e) => {
    e.stopPropagation();
    const shareText = `*${product.name}*\n\n🔥 Offer Price: ₹${product.price} (MRP: ₹${product.oldPrice || product.price * 2})\n🚚 Free Delivery + Cash on Delivery Available!\n\nOrder Now: ${window.location.origin}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  return (
    <div 
      className="group relative bg-white rounded-3xl border border-stone-200/90 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col h-full hover:-translate-y-1 cursor-pointer"
      onMouseEnter={() => hoverImgUrl && setCurrentImgIndex(1)}
      onMouseLeave={() => setCurrentImgIndex(0)}
      onClick={() => navigate(`/products/${product.slug || product.id}`)}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/5] sm:aspect-square bg-stone-100 overflow-hidden">
        <img
          src={getImageUrl(currentImgIndex === 1 && hoverImgUrl ? hoverImgUrl : imgUrl)}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          decoding="async"
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1 z-10">
          {product.isFlashDeal && discount && (
            <span className="bg-rose-600 text-white text-[9px] sm:text-xs font-black uppercase tracking-wider px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg shadow-md flex items-center gap-0.5 sm:gap-1">
              <Flame className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 animate-pulse" /> -{discount}%
            </span>
          )}
          {product.isBestSeller && (
            <span className="bg-amber-500 text-stone-950 text-[9px] sm:text-xs font-black uppercase tracking-wider px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg shadow-md">Best Seller</span>
          )}
          {product.isNew && (
            <span className="bg-emerald-600 text-white text-[9px] sm:text-xs font-black uppercase tracking-wider px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg shadow-md">New</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex flex-col gap-1 z-10">
          <button
            onClick={handleWishlist}
            className={`p-1.5 sm:p-2 rounded-full backdrop-blur-md transition-all shadow-md ${inWishlist ? 'bg-rose-500 text-white scale-105' : 'bg-white/90 hover:bg-white text-stone-700 hover:text-rose-500 hover:scale-110'}`}
            title="Add to Wishlist"
          >
            <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${inWishlist ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={handleWhatsappShare}
            className="p-1.5 sm:p-2 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 backdrop-blur-md transition-all shadow-md hover:scale-110"
            title="Share on WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Quick View Hover */}
        {onQuickView && (
          <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden sm:block">
            <button
              onClick={(e) => { e.stopPropagation(); onQuickView(product); }}
              className="w-full py-2 bg-stone-900/90 hover:bg-stone-950 text-white text-xs font-bold rounded-2xl backdrop-blur-md shadow-lg flex items-center justify-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" /> Quick View
            </button>
          </div>
        )}
      </div>

      {/* Product Info — Premium Compact Design */}        <div className="p-1 sm:p-3 flex flex-col flex-1 justify-between gap-0 sm:gap-1.5">
        <div className="space-y-0.5 sm:space-y-1">
          {/* Category & Free Delivery */}
          <div className="flex items-center justify-between text-[9px] sm:text-xs text-stone-500 font-bold">
            <span className="truncate">{product.categoryLabel || product.category?.name || ''}</span>
            <span className="text-emerald-700 bg-emerald-50 px-1 py-0.5 sm:px-1.5 sm:py-0.5 rounded font-extrabold flex items-center gap-0.5 text-[8px] sm:text-[10px] flex-shrink-0">
              <Truck className="w-2 h-2 sm:w-3 sm:h-3" /> Free
            </span>
          </div>

          <h3 className="text-xs sm:text-sm font-extrabold text-stone-900 line-clamp-2 hover:text-amber-600 transition-colors leading-tight">
            {product.name}
          </h3>

          {/* Rating & COD */}
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-0.5 sm:gap-1">
              <div className="flex items-center text-amber-400">
                <Star className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 fill-amber-400" />
                <span className="text-[9px] sm:text-xs font-bold text-stone-800 ml-0.5">{product.rating || product.averageRating || 0}</span>
              </div>
              <span className="text-[10px] sm:text-xs text-stone-400 font-medium">({product.reviewCount || product._count?.reviews || 0})</span>
            </div>
            <span className="text-[9px] sm:text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-1 sm:px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> COD
            </span>
          </div>

          {/* Savings Badge */}
          {product.oldPrice && (
            <div className="text-[8px] sm:text-[10px] text-amber-900 bg-amber-50 px-1 sm:px-1.5 py-0.5 rounded font-black border border-amber-200/80 flex items-center justify-between">
              <span className="hidden xs:inline">Best Price</span>
              <span>Save ₹{product.oldPrice - product.price}</span>
            </div>
          )}
        </div>

        {/* Price & Add to Cart */}
        <div className="pt-0.5 sm:pt-2 border-t border-stone-100 flex items-center justify-between gap-1 sm:gap-2 mt-auto">
          <div className="min-w-0">
            <div className="flex items-baseline gap-1 flex-wrap">
              <span className="text-sm sm:text-lg font-black text-stone-950">{formatCurrency(product.price)}</span>
              {product.oldPrice && (
                <span className="text-[9px] sm:text-xs text-stone-400 line-through font-medium">{formatCurrency(product.oldPrice)}</span>
              )}
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            className={`px-3 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-xs font-black transition-all flex items-center gap-1 sm:gap-1 flex-shrink-0 shadow-sm ${isAddedAnim ? 'bg-emerald-600 text-white scale-105' : 'bg-stone-900 hover:bg-amber-600 text-white hover:shadow-md'}`}
          >
            {isAddedAnim ? <><Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Added</> : <><ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Add</>}
          </button>
        </div>

        {copiedShare && (
          <div className="text-xs font-bold text-emerald-700 text-center bg-emerald-50 rounded-lg py-1 border border-emerald-200">
            WhatsApp Link Copied!
          </div>
        )}
      </div>
    </div>
  );
}
