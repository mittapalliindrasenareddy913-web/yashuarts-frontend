import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Sparkles, Plus, Image, RefreshCw, X, Palette, Star, ArrowRight, Camera, Heart, ShoppingCart, Trash2, Minus } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ArtworkCard from '../components/ArtworkCard';
import BottomNav from '../components/BottomNav';
import { io } from 'socket.io-client';

export const HomeScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [artworks, setArtworks] = useState([]);
  const [filteredArtworks, setFilteredArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [likedIds, setLikedIds] = useState(new Set());

  // Quick Order states
  const [showQuickOrderModal, setShowQuickOrderModal] = useState(false);
  const [pricingOptions, setPricingOptions] = useState([]);
  const [quickOrderFile, setQuickOrderFile] = useState(null);
  const [quickOrderFilePreview, setQuickOrderFilePreview] = useState('');
  const [quickOrderStyle, setQuickOrderStyle] = useState('');
  const [quickOrderName, setQuickOrderName] = useState('');
  const [quickOrderPhone, setQuickOrderPhone] = useState('');
  const [quickOrderAddress, setQuickOrderAddress] = useState('');
  const [quickOrderCity, setQuickOrderCity] = useState('');
  const [quickOrderState, setQuickOrderState] = useState('');
  const [quickOrderPincode, setQuickOrderPincode] = useState('');
  const [quickOrderInstructions, setQuickOrderInstructions] = useState('');
  const [quickOrderSubmitting, setQuickOrderSubmitting] = useState(false);

  // Cart & Wishlist states
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [showCart, setShowCart] = useState(false);
  const [showWishlist, setShowWishlist] = useState(false);

  // Cart checkout shipping states
  const [showCartCheckoutModal, setShowCartCheckoutModal] = useState(false);
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [checkoutAddress, setCheckoutAddress] = useState('');
  const [checkoutCity, setCheckoutCity] = useState('');
  const [checkoutState, setCheckoutState] = useState('');
  const [checkoutPincode, setCheckoutPincode] = useState('');
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);

  const updateArtworksState = (list) => {
    setArtworks(list.filter((x) => x.is_visible));
  };

  const loadData = useCallback(async (showLoader = true) => {
    const cached = localStorage.getItem('yashuarts_cached_artworks');
    const cachedLikes = localStorage.getItem('yashuarts_liked_ids');
    const cachedCartCount = localStorage.getItem('yashuarts_cart_count');
    let hasLoadedCached = false;

    if (cachedLikes) {
      try {
        setLikedIds(new Set(JSON.parse(cachedLikes).map(id => id.toString())));
      } catch (e) {}
    }
    if (cachedCartCount) {
      setCartCount(parseInt(cachedCartCount, 10));
    }
    
    if (cached && showLoader) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          updateArtworksState(parsed);
          setLoading(false);
          hasLoadedCached = true;
        }
      } catch (e) {
        console.error('Failed to load cached artworks:', e);
      }
    }

    try {
      if (!hasLoadedCached && showLoader) setLoading(true);
      
      const [list, likes, cart] = await Promise.all([
        api.artworks.getAll(),
        user ? api.artworks.getLikes() : Promise.resolve([]),
        user ? api.cart.get() : Promise.resolve({ items: [], count: 0, total: 0 })
      ]);
      
      localStorage.setItem('yashuarts_cached_artworks', JSON.stringify(list));
      updateArtworksState(list);
      setLikedIds(new Set(likes.map(id => id.toString())));
      localStorage.setItem('yashuarts_liked_ids', JSON.stringify(likes));
      if (cart && cart.items) {
        setCartItems(cart.items);
        setCartCount(cart.count);
        setCartTotal(cart.total);
        localStorage.setItem('yashuarts_cart_count', String(cart.count));
      }
      
      // Startup latency benchmarking helper
      const win = window;
      if (win.appStartupStart && !win.appStartupLogged) {
        win.appStartupLogged = true;
        const startLatency = performance.now() - win.appStartupStart;
        console.log(`[Performance] User App startup took ${startLatency.toFixed(2)}ms`);
      }
    } catch (err) {
      console.error('Error fetching home screen data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData(true);

    // Setup socket connection for real-time updates
    const backendRootUrl = 'https://yashuarts-backend.onrender.com';
    const socket = io(backendRootUrl, {
      transports: ['websocket', 'polling']
    });

    socket.on('artwork_published', (item) => {
      if (item.is_visible) {
        setArtworks((prev) => {
          if (prev.some((a) => a.id === item.id)) return prev;
          const newList = [item, ...prev];
          localStorage.setItem('yashuarts_cached_artworks', JSON.stringify(newList));
          return newList;
        });
      }
    });

    socket.on('artwork_updated', (item) => {
      setArtworks((prev) => {
        let newList;
        if (!item.is_visible) {
          newList = prev.filter((a) => a.id !== item.id);
        } else {
          newList = prev.map((a) => (a.id === item.id ? item : a));
        }
        localStorage.setItem('yashuarts_cached_artworks', JSON.stringify(newList));
        return newList;
      });
    });

    socket.on('artwork_deleted', (id) => {
      setArtworks((prev) => {
        const newList = prev.filter((a) => a.id !== id);
        localStorage.setItem('yashuarts_cached_artworks', JSON.stringify(newList));
        return newList;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [loadData]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredArtworks(artworks);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredArtworks(
        artworks.filter(
          (a) =>
            a.title.toLowerCase().includes(query) ||
            a.category.toLowerCase().includes(query) ||
            (a.description && a.description.toLowerCase().includes(query))
        )
      );
    }
  }, [searchQuery, artworks]);

  // Load public pricing options on mount
  useEffect(() => {
    const loadPricing = async () => {
      try {
        const data = await api.pricing.getPublicPricing();
        setPricingOptions(data || []);
      } catch (e) {
        console.error('Failed to load pricing options:', e);
      }
    };
    loadPricing();
  }, []);

  // Pre-fill user details on opening modal
  useEffect(() => {
    if (showQuickOrderModal && user) {
      setQuickOrderName(user.full_name || '');
      setQuickOrderPhone(user.mobile_number || '');
    }
  }, [showQuickOrderModal, user]);

  const handleQuickOrderSubmit = async (e) => {
    e.preventDefault();
    if (!quickOrderFile) {
      alert('Please select and upload a reference photo.');
      return;
    }
    if (!quickOrderStyle) {
      alert('Please select an artwork size and price.');
      return;
    }
    if (!quickOrderName.trim() || !quickOrderPhone.trim() || !quickOrderAddress.trim() || !quickOrderCity.trim() || !quickOrderState.trim() || !quickOrderPincode.trim()) {
      alert('Please fill out all shipping details.');
      return;
    }

    setQuickOrderSubmitting(true);
    try {
      // 1. Upload the reference photo
      const uploadedUrl = await api.upload.uploadImage(quickOrderFile, 'orders');

      // 2. Locate the selected pricing item
      const selectedPricing = pricingOptions.find((opt) => opt._id === quickOrderStyle);
      if (!selectedPricing) {
        throw new Error('Selected pricing option not found');
      }

      // 3. Create the order on backend
      const order = await api.orders.create({
        customer_name: quickOrderName,
        customer_phone: quickOrderPhone,
        email_address: user.email,
        complete_address: quickOrderAddress,
        city: quickOrderCity,
        state: quickOrderState,
        pincode: quickOrderPincode,
        artwork_type: selectedPricing.category,
        artwork_size: selectedPricing.name,
        reference_image_url: uploadedUrl,
        special_instructions: quickOrderInstructions,
        amount: selectedPricing.price,
        payment_method: 'UPI',
        delivery_preference: 'Standard'
      });

      // 4. Close modal and reset states
      setShowQuickOrderModal(false);
      setQuickOrderFile(null);
      setQuickOrderFilePreview('');
      setQuickOrderStyle('');
      setQuickOrderAddress('');
      setQuickOrderCity('');
      setQuickOrderState('');
      setQuickOrderPincode('');
      setQuickOrderInstructions('');

      alert('Quick Custom Order placed successfully! Proceeding to payment...');
      // 5. Navigate to payment screen
      navigate('/payment', { state: { order } });
    } catch (err) {
      console.error('Quick order submission failed:', err);
      alert(err.message || 'Failed to place order. Please try again.');
    } finally {
      setQuickOrderSubmitting(false);
    }
  };

  const fetchCart = async () => {
    if (!user) return;
    try {
      const res = await api.cart.get();
      if (res.success || res.items) {
        setCartItems(res.items || []);
        setCartCount(res.count || 0);
        setCartTotal(res.total || 0);
        localStorage.setItem('yashuarts_cart_count', String(res.count || 0));
      }
    } catch (e) {
      console.error('Failed to fetch cart:', e);
    }
  };

  const handleCartQuantityChange = async (artworkId, newQty) => {
    if (newQty < 1 || newQty > 10) return;
    try {
      await api.cart.updateQuantity(artworkId, newQty);
      await fetchCart();
    } catch (e) {
      console.error(e);
      alert('Failed to update quantity.');
    }
  };

  const handleCartRemove = async (artworkId) => {
    try {
      await api.cart.remove(artworkId);
      await fetchCart();
    } catch (e) {
      console.error(e);
      alert('Failed to remove item.');
    }
  };

  const handleCartCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      alert('Your cart is empty.');
      return;
    }
    if (!checkoutName.trim() || !checkoutPhone.trim() || !checkoutAddress.trim() || !checkoutCity.trim() || !checkoutState.trim() || !checkoutPincode.trim()) {
      alert('Please fill out all shipping fields.');
      return;
    }

    setCheckoutSubmitting(true);
    try {
      const orders = [];
      for (const item of cartItems) {
        const order = await api.orders.create({
          customer_name: checkoutName,
          customer_phone: checkoutPhone,
          email_address: user.email,
          complete_address: checkoutAddress,
          city: checkoutCity,
          state: checkoutState,
          pincode: checkoutPincode,
          artwork_type: item.category,
          artwork_size: item.title,
          reference_image_url: item.image_url,
          special_instructions: `Cart Order (Qty: ${item.quantity})`,
          amount: item.subtotal,
          payment_method: 'UPI',
          delivery_preference: 'Standard'
        });
        orders.push(order);
      }
      
      await api.cart.clear();
      
      setShowCartCheckoutModal(false);
      setShowCart(false);
      setCartItems([]);
      setCartCount(0);
      setCartTotal(0);

      alert('Order placed successfully from cart! Proceeding to payment...');
      navigate('/payment', { state: { order: orders[0], multipleOrders: orders } });
    } catch (err) {
      console.error('Cart checkout failed:', err);
      alert(err.message || 'Checkout failed. Please try again.');
    } finally {
      setCheckoutSubmitting(false);
    }
  };

  useEffect(() => {
    if (showCartCheckoutModal && user) {
      setCheckoutName(user.full_name || '');
      setCheckoutPhone(user.mobile_number || '');
    }
  }, [showCartCheckoutModal, user]);

  const handleLike = async (id) => {
    if (!user) {
      navigate('/login');
      return;
    }

    const isAlreadyLiked = likedIds.has(id);
    const newLikedIds = new Set(likedIds);
    
    try {
      if (isAlreadyLiked) {
        newLikedIds.delete(id);
        await api.artworks.unlike(id);
      } else {
        newLikedIds.add(id);
        await api.artworks.like(id);
      }
      setLikedIds(newLikedIds);
      localStorage.setItem('yashuarts_liked_ids', JSON.stringify(Array.from(newLikedIds)));
      
      setArtworks((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, likes_count: isAlreadyLiked ? Math.max(0, a.likes_count - 1) : a.likes_count + 1 }
            : a
        )
      );
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-slate-100 pb-24 selection:bg-[#D4AF37] selection:text-slate-950">
      {/* Header */}
      <header className="bg-[#060606]/90 border-b border-[#D4AF37]/15 sticky top-0 z-50 backdrop-blur-xl transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#D4AF37"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m12 22 1-1c1.4-1.4 2.4-3.2 3-5.2L18 9l-5-5-6.8 2c-2 1-3.8 2-5.2 3l-1 1" />
                <path d="m18 9 3-3c1.1-1.1 1.1-2.9 0-4s-2.9-1.1-4 0l-3 3" />
                <path d="M5 16h6" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-black tracking-[0.12em] text-[#D4AF37] uppercase" style={{ fontFamily: "'Cinzel', serif" }}>
                YashuArts
              </h1>
              <p className="text-[8px] text-slate-500 uppercase tracking-[0.2em]">
                Luxury Art Studio
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setShowSearch(!showSearch);
                if (showSearch) setSearchQuery('');
              }}
              className={`p-2.5 rounded-xl border transition-all duration-300 ${
                showSearch
                  ? 'bg-[#D4AF37] text-[#030303] border-transparent'
                  : 'text-[#D4AF37] border-white/5 bg-white/5 hover:bg-[#D4AF37]/10'
              }`}
            >
              <Search className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={() => setShowWishlist(true)}
              className="p-2.5 rounded-xl border text-[#D4AF37] border-white/5 bg-white/5 hover:bg-[#D4AF37]/10 transition-all duration-300 relative"
            >
              <Heart className="w-4.5 h-4.5" />
              {likedIds.size > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-amber-500 text-slate-950 text-[8px] font-black flex items-center justify-center">
                  {likedIds.size}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                fetchCart();
                setShowCart(true);
              }}
              className="p-2.5 rounded-xl border text-[#D4AF37] border-white/5 bg-white/5 hover:bg-[#D4AF37]/10 transition-all duration-300 relative"
            >
              <ShoppingCart className="w-4.5 h-4.5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#D4AF37] text-slate-950 text-[8px] font-black flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowNotifications(true)}
              className="p-2.5 rounded-xl border text-[#D4AF37] border-white/5 bg-white/5 hover:bg-[#D4AF37]/10 transition-all duration-300 relative"
            >
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            </button>
          </div>
        </div>
      </header>

      {/* Notifications Drawer */}
      {showNotifications && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex justify-end animate-in fade-in duration-300">
          <div className="bg-[#0B0B0B] border-l border-white/5 w-full max-w-sm p-6 shadow-2xl h-full flex flex-col justify-between animate-in slide-in-from-right duration-300">
            <div>
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                <h3 className="text-lg font-bold text-white uppercase tracking-wider" style={{ fontFamily: "'Cinzel', serif" }}>
                  Notifications
                </h3>
                <button onClick={() => setShowNotifications(false)} className="p-2 text-slate-400 hover:text-white rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-[#121212] border border-white/5 rounded-2xl">
                  <span className="text-[9px] font-black uppercase text-[#D4AF37] tracking-widest block mb-1">
                    Welcome
                  </span>
                  <p className="text-xs text-slate-350 leading-relaxed">
                    Welcome to YashuArts! Explore verified original sketched portraits and charcoal drawings.
                  </p>
                </div>
                <div className="p-4 bg-[#121212] border border-white/5 rounded-2xl">
                  <span className="text-[9px] font-black uppercase text-amber-500 tracking-widest block mb-1">
                    Commission Update
                  </span>
                  <p className="text-xs text-slate-350 leading-relaxed">
                    Your portrait request has been approved. You can track progress in the Orders tab.
                  </p>
                </div>
                <div className="p-4 bg-[#121212] border border-white/5 rounded-2xl">
                  <span className="text-[9px] font-black uppercase text-blue-400 tracking-widest block mb-1">
                    Real-time Catalog
                  </span>
                  <p className="text-xs text-slate-350 leading-relaxed">
                    New pencil sketches added to the Gallery. Auto-refreshed via Socket.IO.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowNotifications(false)}
              className="w-full py-3 bg-[#121212] border border-white/10 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-colors"
            >
              Close Drawer
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Search Input field */}
        {showSearch && (
          <div className="mb-6 transform origin-top transition-all duration-300">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search masterpieces, pencil drawings, portraits..."
              className="w-full bg-[#0D0D0D] border border-[#D4AF37]/35 text-white placeholder-slate-600 px-5 py-3 rounded-2xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all duration-300 text-sm shadow-inner"
              autoFocus
            />
          </div>
        )}

        {/* Promo Hero Section */}
        <section className="mb-8">
          <div className="relative overflow-hidden rounded-3xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#0B0B0B] via-[#050505] to-[#0A0A0A] p-6 shadow-xl">
            <div className="absolute right-0 bottom-0 w-1/3 h-full bg-radial-gradient from-[#D4AF37]/10 to-transparent blur-3xl pointer-events-none" />
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/20 px-3 py-1 rounded-full">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Handcrafted Original Sketch Commissions
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white" style={{ fontFamily: "'Cinzel', serif" }}>
                  Commission Your Custom Artwork
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
                  Turn your favorite family photographs, portraits, and memories into high-grade charcoal drawings. Live tracking timeline included.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 relative z-10 w-full sm:w-auto">
                <button
                  onClick={() => setShowQuickOrderModal(true)}
                  className="bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-slate-950 font-black px-5 py-3.5 rounded-2xl text-[10px] sm:text-xs uppercase tracking-wider hover:scale-[1.03] active:scale-[0.97] transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer animate-pulse"
                >
                  <Plus className="w-3.5 h-3.5" /> ⚡ Quick Order Portrait
                </button>
                <button
                  onClick={() => navigate('/custom-order')}
                  className="bg-transparent border border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/5 font-black px-5 py-3.5 rounded-2xl text-[10px] sm:text-xs uppercase tracking-wider hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  Custom Canvas Crop
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Artworks List Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-white uppercase" style={{ fontFamily: "'Cinzel', serif", letterSpacing: '0.05em' }}>
            Discover Artworks
          </h2>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-white/5 border border-white/5 px-2.5 py-1 rounded-md">
            {filteredArtworks.length} Published
          </span>
        </div>

        {/* Artworks Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="bg-[#0D0D0D] border border-white/5 rounded-[22px] p-3 animate-pulse">
                <div className="bg-[#161616] aspect-square rounded-[16px] w-full" />
                <div className="h-4 bg-[#161616] rounded-md mt-3 w-3/4" />
                <div className="flex justify-between items-center mt-3">
                  <div className="h-5 w-5 bg-[#161616] rounded-full" />
                  <div className="h-5 w-16 bg-[#161616] rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredArtworks.length === 0 ? (
          <div className="text-center py-20 bg-[#0B0B0B]/50 border border-white/5 rounded-[24px]">
            <svg className="w-12 h-12 text-slate-600 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            <p className="text-slate-400 text-sm font-semibold">No masterpiece artworks found</p>
            <p className="text-slate-500 text-xs mt-1">Try modifying your search query or refresh.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredArtworks.map((art) => (
              <ArtworkCard key={art.id} artwork={art} onLike={handleLike} isLiked={likedIds.has(art.id)} />
            ))}
          </div>
        )}
      </main>

      {/* QUICK ORDER MODAL */}
      {showQuickOrderModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D0D0D] border border-white/5 w-full max-w-md p-6 rounded-3xl shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm font-black uppercase text-[#D4AF37] tracking-wider" style={{ fontFamily: "'Cinzel', serif" }}>
                ⚡ Quick Custom Order
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowQuickOrderModal(false);
                  setQuickOrderFile(null);
                  setQuickOrderFilePreview('');
                  setQuickOrderStyle('');
                }}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickOrderSubmit} className="space-y-4 text-xs">
              {/* Photo Upload */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Reference Photo</label>
                {quickOrderFilePreview ? (
                  <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-slate-950 border border-white/5">
                    <img src={quickOrderFilePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setQuickOrderFile(null);
                        setQuickOrderFilePreview('');
                      }}
                      className="absolute top-2.5 right-2.5 p-1.5 bg-black/75 hover:bg-black text-white hover:text-red-500 rounded-full border border-white/10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 hover:border-[#D4AF37]/50 rounded-2xl p-6 cursor-pointer bg-slate-950/40 hover:bg-slate-950/60 transition-all group">
                    <Camera className="w-8 h-8 text-slate-500 group-hover:text-[#D4AF37] mb-2" />
                    <span className="text-[11px] font-bold text-slate-350 uppercase tracking-wider">Select Reference Portrait</span>
                    <span className="text-[9px] text-slate-600 mt-1">JPEG, PNG (up to 10MB)</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          setQuickOrderFile(file);
                          setQuickOrderFilePreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              {/* Price / Category Option Select */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Select Portrait Option & Price</label>
                <select
                  value={quickOrderStyle}
                  onChange={(e) => setQuickOrderStyle(e.target.value)}
                  required
                  className="w-full bg-[#121212] border border-white/5 text-slate-200 px-4 py-3 rounded-xl focus:outline-none focus:border-[#D4AF37] text-xs font-semibold"
                >
                  <option value="">-- Select Option --</option>
                  {pricingOptions.map((opt) => (
                    <option key={opt._id} value={opt._id} className="bg-[#0D0D0D]">
                      {opt.category} - {opt.name} (₹{opt.price.toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer Info (Name & Phone) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Full Name</label>
                  <input
                    type="text"
                    value={quickOrderName}
                    onChange={(e) => setQuickOrderName(e.target.value)}
                    required
                    placeholder="Your Name"
                    className="w-full bg-[#121212] border border-white/5 text-slate-200 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#D4AF37] text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Phone Number</label>
                  <input
                    type="tel"
                    value={quickOrderPhone}
                    onChange={(e) => setQuickOrderPhone(e.target.value)}
                    required
                    placeholder="Mobile Number"
                    className="w-full bg-[#121212] border border-white/5 text-slate-200 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#D4AF37] text-xs"
                  />
                </div>
              </div>

              {/* Complete Address */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Shipping Address</label>
                <textarea
                  value={quickOrderAddress}
                  onChange={(e) => setQuickOrderAddress(e.target.value)}
                  required
                  placeholder="Street Name, House No, Landmark"
                  rows={2}
                  className="w-full bg-[#121212] border border-white/5 text-slate-200 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#D4AF37] text-xs resize-none"
                />
              </div>

              {/* City, State, Pincode Grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">City</label>
                  <input
                    type="text"
                    value={quickOrderCity}
                    onChange={(e) => setQuickOrderCity(e.target.value)}
                    required
                    placeholder="City"
                    className="w-full bg-[#121212] border border-white/5 text-slate-200 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#D4AF37] text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">State</label>
                  <input
                    type="text"
                    value={quickOrderState}
                    onChange={(e) => setQuickOrderState(e.target.value)}
                    required
                    placeholder="State"
                    className="w-full bg-[#121212] border border-white/5 text-slate-200 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#D4AF37] text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Pincode</label>
                  <input
                    type="text"
                    value={quickOrderPincode}
                    onChange={(e) => setQuickOrderPincode(e.target.value)}
                    required
                    placeholder="Pincode"
                    className="w-full bg-[#121212] border border-white/5 text-slate-200 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#D4AF37] text-xs"
                  />
                </div>
              </div>

              {/* Special Instructions */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Special Instructions (Optional)</label>
                <input
                  type="text"
                  value={quickOrderInstructions}
                  onChange={(e) => setQuickOrderInstructions(e.target.value)}
                  placeholder="e.g., Draw single face, Add customized background..."
                  className="w-full bg-[#121212] border border-white/5 text-slate-200 px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#D4AF37] text-xs"
                />
              </div>

              {/* Actions */}
              <button
                type="submit"
                disabled={quickOrderSubmitting}
                className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-slate-950 py-3.5 rounded-2xl font-black uppercase tracking-wider text-[11px] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-amber-500/10 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {quickOrderSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Uploading Reference & Ordering...</span>
                  </>
                ) : (
                  <span>Place Quick Custom Order</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* WISHLIST DRAWER */}
      {showWishlist && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex justify-end animate-in fade-in duration-300">
          <div className="bg-[#060606] border-l border-[#D4AF37]/15 w-full max-w-md p-6 shadow-2xl h-full flex flex-col justify-between animate-in slide-in-from-right duration-300">
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between border-b border-[#D4AF37]/15 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-[#D4AF37] fill-[#D4AF37]" />
                  <h3 className="text-base font-bold text-white uppercase tracking-wider font-cinzel" style={{ fontFamily: "'Cinzel', serif" }}>
                    My Wishlist
                  </h3>
                </div>
                <button onClick={() => setShowWishlist(false)} className="p-2 text-slate-400 hover:text-white rounded-lg cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
                {artworks.filter(a => likedIds.has(a.id)).length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center text-slate-500 gap-2">
                    <Heart className="w-8 h-8 text-slate-600" />
                    <span className="text-xs">Your wishlist is empty</span>
                  </div>
                ) : (
                  artworks.filter(a => likedIds.has(a.id)).map((art) => (
                    <div key={art.id} className="flex gap-4 p-3 bg-[#0d0d0d] border border-white/5 rounded-2xl">
                      <img src={art.image_url} alt={art.title} className="w-20 h-20 object-cover rounded-xl border border-white/5" />
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-white text-sm truncate">{art.title}</h4>
                          <p className="text-[10px] text-slate-400 capitalize">{art.category}</p>
                        </div>
                        <div className="text-[#D4AF37] font-black text-xs">₹{art.price.toLocaleString('en-IN')}</div>
                      </div>
                      <div className="flex flex-col justify-between items-end">
                        <button
                          onClick={() => handleLike(art.id)}
                          className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg cursor-pointer"
                          title="Remove from Wishlist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await api.cart.add(art.id);
                              fetchCart();
                              alert('Added to cart!');
                            } catch (e) {
                              alert('Failed to add to cart.');
                            }
                          }}
                          className="px-2.5 py-1.5 bg-[#D4AF37]/10 hover:bg-[#D4AF37] hover:text-slate-950 text-[#D4AF37] text-[10px] font-bold uppercase rounded-lg transition-colors cursor-pointer"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CART DRAWER */}
      {showCart && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex justify-end animate-in fade-in duration-300">
          <div className="bg-[#060606] border-l border-[#D4AF37]/15 w-full max-w-md p-6 shadow-2xl h-full flex flex-col justify-between animate-in slide-in-from-right duration-300">
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between border-b border-[#D4AF37]/15 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-[#D4AF37]" />
                  <h3 className="text-base font-bold text-white uppercase tracking-wider font-cinzel" style={{ fontFamily: "'Cinzel', serif" }}>
                    Shopping Cart
                  </h3>
                </div>
                <button onClick={() => setShowCart(false)} className="p-2 text-slate-400 hover:text-white rounded-lg cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
                {cartItems.length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center text-slate-500 gap-2">
                    <ShoppingCart className="w-8 h-8 text-slate-600" />
                    <span className="text-xs">Your cart is empty</span>
                  </div>
                ) : (
                  cartItems.map((item) => (
                    <div key={item._id} className="flex gap-4 p-3 bg-[#0d0d0d] border border-white/5 rounded-2xl">
                      <img src={item.image_url} alt={item.title} className="w-20 h-20 object-cover rounded-xl border border-white/5" />
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-white text-sm truncate">{item.title}</h4>
                          <p className="text-[10px] text-slate-400 capitalize">{item.category}</p>
                        </div>
                        <div className="text-[#D4AF37] font-black text-xs">₹{item.price.toLocaleString('en-IN')}</div>
                      </div>
                      <div className="flex flex-col justify-between items-end">
                        <button
                          onClick={() => handleCartRemove(item.artworkId)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-2 bg-[#121212] border border-white/5 rounded-lg p-0.5">
                          <button
                            onClick={() => handleCartQuantityChange(item.artworkId, item.quantity - 1)}
                            className="p-1 text-slate-400 hover:text-white cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-bold text-slate-200 w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => handleCartQuantityChange(item.artworkId, item.quantity + 1)}
                            className="p-1 text-slate-400 hover:text-white cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {cartItems.length > 0 && (
              <div className="border-t border-[#D4AF37]/15 pt-4 mt-4 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Subtotal:</span>
                  <span className="text-[#D4AF37] font-black text-base">₹{cartTotal.toLocaleString('en-IN')}</span>
                </div>
                <button
                  onClick={() => setShowCartCheckoutModal(true)}
                  className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-slate-950 py-3.5 rounded-2xl font-black uppercase tracking-wider text-[11px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-amber-500/10 cursor-pointer"
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CART CHECKOUT MODAL */}
      {showCartCheckoutModal && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D0D0D] border border-white/5 w-full max-w-md p-6 rounded-3xl shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm font-black uppercase text-[#D4AF37] tracking-wider font-cinzel" style={{ fontFamily: "'Cinzel', serif" }}>
                📍 Shipping Details
              </h3>
              <button
                type="button"
                onClick={() => setShowCartCheckoutModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCartCheckoutSubmit} className="space-y-4 text-xs">
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
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">City</label>
                  <input
                    type="text"
                    value={checkoutCity}
                    onChange={(e) => setCheckoutCity(e.target.value)}
                    required
                    placeholder="City"
                    className="w-full bg-[#121212] border border-white/5 text-slate-200 px-3 py-2.5 rounded-xl focus:outline-none focus:border-[#D4AF37] text-xs"
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
                    className="w-full bg-[#121212] border border-white/5 text-slate-200 px-3 py-2.5 rounded-xl focus:outline-none focus:border-[#D4AF37] text-xs"
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
                    className="w-full bg-[#121212] border border-white/5 text-slate-200 px-3 py-2.5 rounded-xl focus:outline-none focus:border-[#D4AF37] text-xs"
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
                    <span>Placing Orders & Navigating...</span>
                  </>
                ) : (
                  <span>Place Order (₹{cartTotal.toLocaleString('en-IN')})</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default HomeScreen;
