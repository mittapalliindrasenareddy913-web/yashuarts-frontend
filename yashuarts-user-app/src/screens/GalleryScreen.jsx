import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Paintbrush, Heart, Sparkles, X, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ArtworkCard from '../components/ArtworkCard';
import BottomNav from '../components/BottomNav';
import { io } from 'socket.io-client';

const categories = ['All', 'Pencil Sketch', 'Color Portrait', 'Couple Sketch', 'Custom Drawing'];

export const GalleryScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [artworks, setArtworks] = useState([]);
  const [filteredArtworks, setFilteredArtworks] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [likedIds, setLikedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedArtwork, setSelectedArtwork] = useState(null);

  const fetchArtworks = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const [list, likes] = await Promise.all([
        api.artworks.getAll(),
        user ? api.artworks.getLikes() : Promise.resolve([])
      ]);
      setArtworks(list.filter((item) => item.is_visible));
      setLikedIds(new Set(likes));
    } catch (err) {
      console.error('Error loading gallery artworks:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchArtworks(true);

    // Setup socket connection for real-time updates
    const backendRootUrl = 'https://yashuarts-backend.onrender.com';
    const socket = io(backendRootUrl, {
      transports: ['websocket', 'polling']
    });

    socket.on('artwork_published', (item) => {
      if (item.is_visible) {
        setArtworks((prev) => {
          if (prev.some((a) => a.id === item.id)) return prev;
          return [item, ...prev];
        });
      }
    });

    socket.on('artwork_updated', (item) => {
      setArtworks((prev) => {
        if (item.is_visible) {
          return prev.map((a) => (a.id === item.id ? item : a));
        } else {
          return prev.filter((a) => a.id !== item.id);
        }
      });
    });

    socket.on('artwork_deleted', (id) => {
      setArtworks((prev) => prev.filter((a) => a.id !== id));
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchArtworks]);

  useEffect(() => {
    let result = artworks;
    if (selectedCategory !== 'All') {
      result = result.filter((a) => a.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(query) ||
          a.category.toLowerCase().includes(query) ||
          (a.description && a.description.toLowerCase().includes(query))
      );
    }
    setFilteredArtworks(result);
  }, [artworks, selectedCategory, searchQuery]);

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
      
      setArtworks((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, likes_count: isAlreadyLiked ? Math.max(0, a.likes_count - 1) : a.likes_count + 1 }
            : a
        )
      );

      if (selectedArtwork && selectedArtwork.id === id) {
        setSelectedArtwork((prev) =>
          prev
            ? { ...prev, likes_count: isAlreadyLiked ? Math.max(0, prev.likes_count - 1) : prev.likes_count + 1 }
            : null
        );
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-slate-100 pb-24 selection:bg-[#D4AF37] selection:text-slate-950">
      
      {/* Header */}
      <header className="bg-[#060606]/95 border-b border-[#D4AF37]/15 sticky top-0 z-50 backdrop-blur-xl transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
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
                  Art Gallery
                </h1>
                <p className="text-[8px] text-slate-500 uppercase tracking-[0.2em]">
                  Exquisite Handcrafted Sketched Masterpieces
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
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
            </div>
          </div>

          {/* Search Bar */}
          {showSearch && (
            <div className="mt-4 transform origin-top transition-all duration-300">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search drawings, portraits, sketch categories..."
                className="w-full bg-[#0D0D0D] border border-[#D4AF37]/35 text-white placeholder-slate-600 px-5 py-3 rounded-2xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all duration-300 text-sm shadow-inner"
              />
            </div>
          )}

          {/* Categories Horizontal Scroll */}
          <div className="flex gap-2.5 overflow-x-auto pb-1 mt-4 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all duration-300 border ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-slate-950 border-transparent shadow-lg shadow-amber-500/10 hover:scale-105'
                    : 'bg-[#121212] text-slate-400 border-white/5 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Gallery Artworks */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {selectedCategory === 'All' && !searchQuery && (
          <div className="mb-8 relative overflow-hidden rounded-3xl border border-[#D4AF37]/20 bg-gradient-to-br from-[#0B0B0B] via-[#050505] to-[#0A0A0A] p-6 shadow-xl">
            <div className="absolute right-0 top-0 w-1/3 h-full bg-radial-gradient from-[#D4AF37]/10 to-transparent blur-2xl pointer-events-none" />
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5" /> Premium Artworks & Sketches
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white mb-2" style={{ fontFamily: "'Cinzel', serif" }}>
                Handcrafted Museum-Grade Sketches
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm mb-4 leading-relaxed">
                Browse our curated collection of fine art portraits, pencil drawings, and sketch masterpieces. Tap any card for a full-screen detailed preview.
              </p>
            </div>
          </div>
        )}

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
            <Paintbrush className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-sm font-semibold">No artwork masterpieces found</p>
            <p className="text-slate-500 text-xs mt-1">
              Try selecting a different category or search term.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredArtworks.map((art) => (
              <ArtworkCard
                key={art.id}
                artwork={art}
                onLike={handleLike}
                isLiked={likedIds.has(art.id)}
                onClick={() => setSelectedArtwork(art)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Expanded Artwork Full Screen Modal */}
      {selectedArtwork && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 animate-in fade-in duration-300">
          <div className="flex justify-end p-2">
            <button
              onClick={() => setSelectedArtwork(null)}
              className="p-2.5 bg-[#121212]/80 border border-white/10 hover:border-[#D4AF37]/50 text-white hover:text-[#D4AF37] rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center p-2">
            <img
              src={selectedArtwork.image_url}
              alt={selectedArtwork.title}
              className="max-h-[65vh] max-w-full object-contain rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8),0_0_20px_rgba(212,175,55,0.1)] border border-[#D4AF37]/15"
            />
          </div>

          <div className="max-w-xl mx-auto w-full bg-[#0D0D0D]/90 border border-white/5 rounded-[28px] p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-black uppercase text-[#D4AF37] tracking-widest">
                  {selectedArtwork.category}
                </span>
                <h2 className="text-xl font-bold text-white mt-1 leading-tight" style={{ fontFamily: "'Cinzel', serif" }}>
                  {selectedArtwork.title}
                </h2>
              </div>
              <span className="text-lg font-black text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/25 px-3 py-1 rounded-xl">
                ₹{selectedArtwork.price.toLocaleString('en-IN')}
              </span>
            </div>

            {selectedArtwork.description && (
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-h-24 overflow-y-auto pr-1">
                {selectedArtwork.description}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleLike(selectedArtwork.id)}
                className="p-4 bg-white/5 hover:bg-red-500/10 border border-white/10 rounded-2xl transition-all text-red-500 flex items-center justify-center"
              >
                <Heart className={`w-5 h-5 ${likedIds.has(selectedArtwork.id) ? 'fill-red-500 text-red-500' : 'text-slate-400'}`} />
              </button>
              <button
                onClick={() => {
                  setSelectedArtwork(null);
                  navigate(`/artwork/${selectedArtwork.id}`);
                }}
                className="flex-1 py-4 bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2"
              >
                Place Commission / Details
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default GalleryScreen;
