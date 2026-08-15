import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Eye, ShoppingBag, Check, Flame, Share2 } from 'lucide-react';
import useCartStore from '../../store/cartStore';
import useWishlistStore from '../../store/wishlistStore';
import { getImageUrl, formatPrice } from '../../utils/formatters';
import { wishlistAPI } from '../../api/wishlist';
import { addedToCart, addedToWishlist, removedFromWishlist } from '../../utils/toast';

export default function ProductCard({ product, onQuickView }) {
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

  // Robust price/discount — API sends camelCase (oldPrice) or snake_case (old_price)
  const oldPrice = product.oldPrice ?? product.old_price;
  const price = Number(product.price ?? 0);
  const discount = oldPrice
    ? Math.round(((Number(oldPrice) - price) / Number(oldPrice)) * 100)
    : product.discountPercentage;

  // Stock awareness — only trust explicit numeric stock fields
  const rawStock = product.quantity ?? product.stockCount ?? product.stock;
  const hasStockField = rawStock !== undefined && rawStock !== null;
  const stockQty = hasStockField ? Number(rawStock) : null;
  const isOutOfStock = hasStockField && !Number.isNaN(stockQty) && stockQty <= 0;
  const isLowStock = !isOutOfStock && hasStockField && !Number.isNaN(stockQty) && stockQty > 0 && stockQty <= 5;

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
    const shareText = `*${product.name}*\n\n🔥 Offer Price: ₹${product.price} (MRP: ₹${oldPrice || product.price * 2})\n🚚 Free Delivery + Cash on Delivery Available!\n\nOrder Now: ${window.location.origin}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  return (
    <div
      className="group relative bg-white rounded-xl border border-stone-200/80 overflow-hidden shadow-sm transition-all duration-300 ease-out flex flex-col h-full hover:-translate-y-0.5 hover:shadow-lg hover:border-stone-300 cursor-pointer"
      onMouseEnter={() => hoverImgUrl && setCurrentImgIndex(1)}
      onMouseLeave={() => setCurrentImgIndex(0)}
      onClick={() => navigate(`/products/${product.slug || product.id}`)}
    >
      {/* ════ Image Area ════ */}
      <div className="relative aspect-square sm:aspect-[4/5] bg-stone-50 overflow-hidden">
        <img
          src={getImageUrl(currentImgIndex === 1 && hoverImgUrl ? hoverImgUrl : imgUrl)}
          alt={product.name}
          className={`w-full h-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.05] ${isOutOfStock ? 'grayscale opacity-60' : ''}`}
          loading="lazy"
          decoding="async"
        />

        {/* Badges — clean marketplace chips */}
        <div className="absolute top-2 left-2 sm:top-2.5 sm:left-2.5 flex flex-col items-start gap-1 z-10">
          {!isOutOfStock && discount > 0 && (
            <span className={`inline-flex items-center gap-0.5 text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded ${product.isFlashDeal ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'}`}>
              {product.isFlashDeal && <Flame className="w-2.5 h-2.5 animate-pulse" />}
              {discount}% OFF
            </span>
          )}
          {isOutOfStock && (
            <span className="inline-flex items-center bg-stone-900/80 text-white text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded">
              Sold Out
            </span>
          )}
          {product.isBestSeller && (
            <span className="inline-flex items-center bg-amber-500 text-stone-950 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded">
              Best Seller
            </span>
          )}
          {product.isNew && (
            <span className="inline-flex items-center bg-stone-900 text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded">
              New
            </span>
          )}
        </div>

        {/* Actions — clean white circles */}
        <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 flex flex-col gap-1.5 z-10">
          <button
            onClick={handleWishlist}
            aria-label={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border flex items-center justify-center shadow-sm transition-all duration-200 ${
              inWishlist
                ? 'border-rose-200 text-rose-500 scale-110'
                : 'border-stone-100 text-stone-500 hover:text-rose-500 hover:shadow-md hover:scale-110'
            }`}
          >
            <Heart
              key={inWishlist ? 'in' : 'out'}
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${inWishlist ? 'fill-current animate-[badgePop_.35s_ease]' : ''}`}
            />
          </button>
          <button
            onClick={handleWhatsappShare}
            aria-label="Share on WhatsApp"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border border-stone-100 text-stone-500 shadow-sm transition-all duration-200 hover:text-emerald-600 hover:shadow-md hover:scale-110 sm:opacity-0 sm:pointer-events-none sm:group-hover:opacity-100 sm:group-hover:pointer-events-auto"
          >
            <Share2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 mx-auto" />
          </button>
        </div>

        {/* Quick View — desktop hover */}
        {onQuickView && (
          <div className="absolute inset-x-0 bottom-0 z-10 hidden sm:block translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <div className="p-2 bg-gradient-to-t from-black/50 via-black/20 to-transparent">
              <button
                onClick={(e) => { e.stopPropagation(); onQuickView(product); }}
                className="w-full py-1.5 rounded-md bg-white/95 text-stone-900 text-[11px] font-semibold shadow flex items-center justify-center gap-1 hover:bg-amber-500 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" /> Quick View
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ════ Product Info ════ */}
      <div className="p-2 sm:p-3 flex flex-col flex-1">
        {/* Name */}
        <h3 className="text-[11px] sm:text-xs font-semibold text-stone-900 leading-snug line-clamp-2 mb-1.5 transition-colors group-hover:text-amber-700">
          {product.name}
        </h3>

        {/* Low stock hint (rating removed) */}
        {isLowStock && (
          <div className="flex items-center mb-1">
            <span className="text-[9px] font-semibold text-rose-600">Only {stockQty} left</span>
          </div>
        )}

        {/* Price row */}
        <div className="flex items-baseline gap-1 sm:gap-1.5 flex-wrap">
          <span className="text-xs sm:text-sm font-extrabold tracking-tight text-stone-900">
            {formatPrice(price)}
          </span>
          {oldPrice && (
            <span className="text-[9px] sm:text-[11px] text-stone-400 line-through font-medium">
              {formatPrice(oldPrice)}
            </span>
          )}
          {!isOutOfStock && discount > 0 && (
            <span className="text-[9px] sm:text-[11px] font-bold text-emerald-600">
              {discount}% off
            </span>
          )}
        </div>

        {/* Add to Cart */}
        <div className="mt-auto pt-2 mt-2">
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`w-full h-8 sm:h-9 rounded-lg text-[10px] sm:text-xs font-bold tracking-wide transition-all duration-200 flex items-center justify-center gap-1 ${
              isOutOfStock
                ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                : isAddedAnim
                  ? 'bg-emerald-600 text-white'
                  : 'bg-amber-500 text-stone-950 hover:bg-amber-400 active:scale-[0.98]'
            }`}
          >
            {isAddedAnim ? <><Check className="w-3.5 h-3.5" /> Added</> : isOutOfStock ? 'Sold Out' : <><ShoppingBag className="w-3.5 h-3.5" /> Add to Cart</>}
          </button>
        </div>

        {copiedShare && (
          <div className="text-[10px] font-bold text-emerald-700 text-center bg-emerald-50 rounded-md py-1 border border-emerald-200 mt-1.5">
            WhatsApp Link Copied!
          </div>
        )}
      </div>
    </div>
  );
}
