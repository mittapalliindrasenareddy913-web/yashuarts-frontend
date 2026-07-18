import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Eye, Share2, ShoppingCart, Star, MessageSquare, X, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';

export const ArtworkDetailScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [artwork, setArtwork] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isLiked, setIsLiked] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Direct checkout states
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [checkoutAddress, setCheckoutAddress] = useState('');
  const [checkoutCity, setCheckoutCity] = useState('');
  const [checkoutState, setCheckoutState] = useState('');
  const [checkoutPincode, setCheckoutPincode] = useState('');
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      loadArtworkDetails();
    }
  }, [id, user]);

  useEffect(() => {
    if (user) {
      setCheckoutName(user.full_name || '');
    }
  }, [user]);

  const handleBuyNowSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please log in to continue.');
      return;
    }

    try {
      setCheckoutSubmitting(true);
      const order = await api.orders.create({
        customer_name: checkoutName,
        customer_phone: checkoutPhone,
        email_address: user.email,
        complete_address: checkoutAddress,
        city: checkoutCity,
        state: checkoutState,
        pincode: checkoutPincode,
        artwork_type: artwork.category,
        artwork_size: artwork.title,
        reference_image_url: artwork.image_url,
        special_instructions: "Direct purchase of published artwork",
        amount: artwork.price,
        payment_method: 'UPI',
        delivery_preference: 'Standard'
      });

      setShowCheckoutModal(false);
      alert('Order placed successfully! Proceeding to payment...');
      navigate('/payment', { state: { order } });
    } catch (err) {
      console.error('Buy Now checkout failed:', err);
      alert(err.message || 'Checkout failed. Please try again.');
    } finally {
      setCheckoutSubmitting(false);
    }
  };

  const loadArtworkDetails = async () => {
    let hasLoadedCached = false;
    const cachedStr = localStorage.getItem('yashuarts_cached_artworks');
    if (cachedStr) {
      try {
        const cachedList = JSON.parse(cachedStr);
        const cachedItem = cachedList.find(a => a.id === id || a._id === id);
        if (cachedItem) {
          setArtwork(cachedItem);
          setLoading(false);
          hasLoadedCached = true;
        }
      } catch (e) {
        console.error('Failed to parse cached artworks:', e);
      }
    }

    try {
      if (!hasLoadedCached) setLoading(true);
      setError(null);
      const [artData, reviewList, likes, cartRes] = await Promise.all([
        api.artworks.getById(id),
        api.reviews.getByArtwork(id),
        user ? api.artworks.getLikes() : Promise.resolve([]),
        user ? api.cart.get() : Promise.resolve({ items: [] })
      ]);
      setArtwork(artData);
      setReviews(reviewList);
      setIsLiked(likes.some(likeId => likeId?.toString() === id?.toString()));
      if (cartRes && cartRes.items) {
        setIsInCart(cartRes.items.some(item => item.artworkId?.toString() === id?.toString()));
      }
    } catch (err) {
      console.error('Error loading artwork details:', err);
      if (!hasLoadedCached) {
        setError(err.message || 'Error loading artwork details');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLikeToggle = async () => {
    if (!user || !id) {
      navigate('/login');
      return;
    }
    
    try {
      let currentLikes = [];
      try {
        currentLikes = JSON.parse(localStorage.getItem('yashuarts_liked_ids') || '[]');
      } catch (e) {}

      if (isLiked) {
        await api.artworks.unlike(id);
        setIsLiked(false);
        currentLikes = currentLikes.filter(x => x !== id);
        setArtwork((prev) => (prev ? { ...prev, likes_count: Math.max(0, prev.likes_count - 1) } : null));
      } else {
        await api.artworks.like(id);
        setIsLiked(true);
        currentLikes.push(id);
        setArtwork((prev) => (prev ? { ...prev, likes_count: prev.likes_count + 1 } : null));
      }
      localStorage.setItem('yashuarts_liked_ids', JSON.stringify(currentLikes));
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share && artwork) {
      try {
        await navigator.share({
          title: artwork.title,
          text: `Check out this amazing artwork: ${artwork.title}`,
          url: window.location.href
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      } catch (err) {
        console.error('Could not copy text: ', err);
      }
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (error || !artwork) {
    return (
      <div className="min-h-screen bg-[#030303] text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <p className="text-[#D4AF37] font-black text-lg mb-2">
          {error ? 'Error Loading Artwork' : 'Artwork Not Found'}
        </p>
        <p className="text-slate-400 text-xs max-w-xs mb-6 leading-relaxed">
          {error ? error : `The requested artwork ID "${id}" could not be found or retrieved.`}
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={loadArtworkDetails}
            className="w-full py-3 bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            Retry Connection
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 bg-[#121212] border border-white/10 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-2xl hover:bg-slate-900 transition-all cursor-pointer"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303] text-slate-100 pb-20 selection:bg-[#D4AF37] selection:text-slate-950">
      <header className="bg-[#060606]/90 border-b border-[#D4AF37]/15 sticky top-0 z-10 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="text-[#D4AF37] hover:scale-110 active:scale-95 transition-all p-1 flex items-center justify-center"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-base font-black tracking-[0.15em] text-[#D4AF37] uppercase" style={{ fontFamily: "'Cinzel', serif" }}>
            Artwork Details
          </h1>
          <div className="w-6" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-[#0D0D0D] border border-white/5 rounded-3xl overflow-hidden mb-6 shadow-xl">
          <div className="relative">
            <div className="h-[320px] sm:h-[450px] bg-slate-950/60 border-b border-white/5 flex items-center justify-center p-4">
              <img
                src={artwork.image_url}
                alt={artwork.title}
                className="max-h-full max-w-full object-contain rounded-xl shadow-lg"
              />
            </div>
            <div className="absolute bottom-4 right-4 bg-black/70 border border-[#D4AF37]/35 text-[#D4AF37] px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest">
              YashuArts © PRO PROTECTED
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-2 leading-tight" style={{ fontFamily: "'Cinzel', serif" }}>
                  {artwork.title}
                </h2>
                <span className="inline-block bg-[#D4AF37]/15 border border-[#D4AF37]/25 text-[#D4AF37] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                  {artwork.category}
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleLikeToggle}
                  className="p-3 bg-[#121212] border border-white/10 rounded-full hover:border-[#D4AF37]/50 active:scale-95 transition-all shadow-sm flex items-center justify-center"
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-slate-400'}`} />
                </button>
                <button
                  onClick={handleShare}
                  className="p-3 bg-[#121212] border border-white/10 rounded-full hover:border-[#D4AF37]/50 active:scale-95 transition-all shadow-sm flex items-center justify-center"
                >
                  <Share2 className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-6 text-slate-400 text-xs">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                <span className="font-bold text-[#D4AF37]">{artwork.likes_count}</span>
                <span>Likes</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#D4AF37]" />
                <span className="font-bold text-[#D4AF37]">{artwork.views_count}</span>
                <span>Views</span>
              </div>
            </div>

            <div>
              <span className="text-3xl font-black text-[#D4AF37]">₹{artwork.price.toLocaleString('en-IN')}</span>
            </div>

            {artwork.description && (
              <div className="border-t border-white/5 pt-5">
                <h3 className="text-sm font-black uppercase text-[#D4AF37] tracking-widest mb-2">The Vision</h3>
                <p className="text-slate-350 text-xs leading-relaxed max-w-3xl">{artwork.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-5 text-xs">
              <div className="bg-[#121212] border border-white/5 p-4 rounded-2xl">
                <h4 className="font-black uppercase text-slate-500 tracking-wider mb-1">Medium</h4>
                <p className="text-slate-200 font-bold">{artwork.category}</p>
              </div>
              <div className="bg-[#121212] border border-white/5 p-4 rounded-2xl">
                <h4 className="font-black uppercase text-slate-500 tracking-wider mb-1">Artist</h4>
                <p className="text-[#D4AF37] font-bold">YashuArts Studio</p>
              </div>
            </div>

            {/* Customer Reviews */}
            {reviews.length > 0 && (
              <div className="border-t border-white/5 pt-5 space-y-4">
                <h3 className="text-sm font-black uppercase text-[#D4AF37] tracking-widest">Customer Reviews</h3>
                <div className="space-y-3">
                  {reviews.slice(0, 3).map((review) => (
                    <div key={review.id} className="bg-[#121212] border border-white/5 p-4 rounded-2xl">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, starIdx) => (
                            <Star
                              key={starIdx}
                              className={`w-3.5 h-3.5 ${
                                starIdx < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] text-slate-500 font-semibold font-mono">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-300 text-xs leading-relaxed">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-black uppercase tracking-wider">
          <button
            onClick={async () => {
              try {
                if (isInCart) {
                  await api.cart.remove(artwork.id);
                  setIsInCart(false);
                  
                  // Update cached cart count instantly
                  const currentCount = Math.max(0, parseInt(localStorage.getItem('yashuarts_cart_count') || '0', 10) - 1);
                  localStorage.setItem('yashuarts_cart_count', String(currentCount));
                  
                  alert('Removed from cart successfully!');
                } else {
                  await api.cart.add(artwork.id);
                  setIsInCart(true);
                  
                  // Update cached cart count instantly
                  const currentCount = parseInt(localStorage.getItem('yashuarts_cart_count') || '0', 10) + 1;
                  localStorage.setItem('yashuarts_cart_count', String(currentCount));
                  
                  alert('Added to cart successfully!');
                }
              } catch (e) {
                console.error(e);
                alert(`Failed to ${isInCart ? 'remove' : 'add'} item. Please try again.`);
              }
            }}
            className={`flex items-center justify-center gap-2 py-4 rounded-2xl transition-all shadow-md cursor-pointer border ${
              isInCart
                ? 'bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20'
                : 'bg-[#121212] border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/5'
            }`}
          >
            <ShoppingCart className="w-4.5 h-4.5" />
            {isInCart ? 'Remove from Cart' : 'Add to Cart'}
          </button>
          
          <button
            onClick={() => setShowCheckoutModal(true)}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-slate-950 py-4 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-amber-500/10 cursor-pointer"
          >
            <ShoppingCart className="w-4.5 h-4.5" />
            Buy Now
          </button>
          
          <a
            href="https://wa.me/919398029785"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-[#25D366] text-slate-950 py-4 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md md:col-span-2 cursor-pointer"
          >
            <MessageSquare className="w-4.5 h-4.5" />
            Chat with YashuArts via WhatsApp
          </a>
        </div>
      </main>

      {/* DIRECT CHECKOUT MODAL */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D0D0D] border border-white/5 w-full max-w-md p-6 rounded-3xl shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm font-black uppercase text-[#D4AF37] tracking-wider font-cinzel" style={{ fontFamily: "'Cinzel', serif" }}>
                📍 Shipping Details
              </h3>
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBuyNowSubmit} className="space-y-4 text-xs">
              {/* Customer Info (Name & Phone) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Full Name</label>
                  <input
                    type="text"
                    value={checkoutName}
                    onChange={(e) => setCheckoutName(e.target.value)}
                    required
                    placeholder="Your Name"
                    className="w-full bg-[#121212] border border-white/5 text-slate-200 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#D4AF37] text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Phone Number</label>
                  <input
                    type="tel"
                    value={checkoutPhone}
                    onChange={(e) => setCheckoutPhone(e.target.value)}
                    required
                    placeholder="10-digit mobile"
                    className="w-full bg-[#121212] border border-white/5 text-slate-200 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#D4AF37] text-xs"
                  />
                </div>
              </div>

              {/* Complete Address */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Complete Address</label>
                <textarea
                  value={checkoutAddress}
                  onChange={(e) => setCheckoutAddress(e.target.value)}
                  required
                  rows={2}
                  placeholder="House No, Building, Street, Area..."
                  className="w-full bg-[#121212] border border-white/5 text-slate-200 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#D4AF37] text-xs resize-none"
                />
              </div>

              {/* City, State, Pincode */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">City</label>
                  <input
                    type="text"
                    value={checkoutCity}
                    onChange={(e) => setCheckoutCity(e.target.value)}
                    required
                    placeholder="City"
                    className="w-full bg-[#121212] border border-white/5 text-slate-200 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#D4AF37] text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">State</label>
                  <input
                    type="text"
                    value={checkoutState}
                    onChange={(e) => setCheckoutState(e.target.value)}
                    required
                    placeholder="State"
                    className="w-full bg-[#121212] border border-white/5 text-slate-200 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#D4AF37] text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Pincode</label>
                  <input
                    type="text"
                    value={checkoutPincode}
                    onChange={(e) => setCheckoutPincode(e.target.value)}
                    required
                    placeholder="Pincode"
                    className="w-full bg-[#121212] border border-white/5 text-slate-200 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#D4AF37] text-xs"
                  />
                </div>
              </div>

              {/* Actions */}
              <button
                type="submit"
                disabled={checkoutSubmitting}
                className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-slate-950 py-3.5 rounded-2xl font-black uppercase tracking-wider text-[11px] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-amber-500/10 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {checkoutSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <span>Confirm & Pay</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtworkDetailScreen;
