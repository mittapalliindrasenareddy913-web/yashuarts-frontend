import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, EyeOff, Eye, Heart, LayoutGrid, Pen, Star, Trash2, Search, ArrowLeft, RefreshCw } from 'lucide-react';
import api from '../services/api';
import BottomNav from '../components/BottomNav';
import { optimizeImage } from '../utils/image';

export const AdminArtworksScreen = () => {
  const navigate = useNavigate();
  
  const [artworks, setArtworks] = useState([]);
  const [filteredArtworks, setFilteredArtworks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modal / status triggers
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [actionInProgressId, setActionInProgressId] = useState(null);

  const fetchArtworks = async () => {
    try {
      setLoading(true);
      const data = await api.artworks.getAll();
      setArtworks(data);
      setFilteredArtworks(data);
    } catch (err) {
      console.error('Error loading artworks for manager:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtworks();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredArtworks(artworks);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredArtworks(
        artworks.filter(
          (a) =>
            a.title.toLowerCase().includes(query) ||
            a.category.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, artworks]);

  const handleDelete = async (id) => {
    try {
      setActionInProgressId(id);
      await api.artworks.delete(id);
      setDeleteConfirmId(null);
      await fetchArtworks();
    } catch (err) {
      console.error('Error deleting artwork:', err);
      alert('Failed to delete artwork.');
    } finally {
      setActionInProgressId(null);
    }
  };

  const toggleVisibility = async (art) => {
    try {
      setActionInProgressId(art.id);
      const nextVisible = art.is_visible === false;
      await api.artworks.update(art.id, { is_visible: nextVisible });
      setArtworks((prev) =>
        prev.map((item) => (item.id === art.id ? { ...item, is_visible: nextVisible } : item))
      );
    } catch (err) {
      console.error('Error updating visibility:', err);
    } finally {
      setActionInProgressId(null);
    }
  };

  const toggleFeatured = async (art) => {
    try {
      setActionInProgressId(art.id);
      const nextFeatured = !art.is_featured;
      await api.artworks.update(art.id, { is_featured: nextFeatured });
      setArtworks((prev) =>
        prev.map((item) => (item.id === art.id ? { ...item, is_featured: nextFeatured } : item))
      );
    } catch (err) {
      console.error('Error updating featured status:', err);
    } finally {
      setActionInProgressId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-slate-100 pb-24 selection:bg-[#D4AF37] selection:text-slate-950">
      {/* Header */}
      <header className="bg-[#060606]/90 border-b border-[#D4AF37]/15 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => navigate('/admin/dashboard')}
              aria-label="Back to dashboard"
              title="Back to dashboard"
              className="p-2 text-slate-400 hover:text-[#D4AF37] hover:bg-white/5 rounded-xl transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-black tracking-wider text-[#D4AF37] uppercase" style={{ fontFamily: "'Cinzel', serif" }}>
                Gallery Masterlist
              </h1>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest" style={{ fontFamily: "'Inter', sans-serif" }}>
                Portfolio & Catalog Control
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/admin/artwork/new')}
            className="bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center gap-1.5 shadow-lg shadow-amber-500/10"
          >
            <Pen className="w-4 h-4" /> Add Artwork
          </button>
        </div>
      </header>

      {/* Search Input bar */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 h-4.5 w-4.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search artworks by title, size, categories..."
              className="w-full bg-[#0D0D0D] border border-white/5 text-white placeholder-slate-650 pl-11 pr-5 py-3 rounded-2xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all text-sm shadow-inner"
            />
          </div>
        </div>

        {/* Loading placeholders */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="bg-[#0D0D0D] border border-white/5 rounded-3xl p-4 animate-pulse flex gap-4 h-44">
                <div className="bg-[#161616] w-36 h-full rounded-2xl" />
                <div className="flex-1 space-y-3 py-1">
                  <div className="h-4 bg-[#161616] rounded-md w-3/4" />
                  <div className="h-3.5 bg-[#161616] rounded-md w-1/2" />
                  <div className="h-3 bg-[#161616] rounded-md w-1/3" />
                  <div className="flex gap-2 pt-3">
                    <div className="h-8 w-8 bg-[#161616] rounded-lg" />
                    <div className="h-8 w-8 bg-[#161616] rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredArtworks.length === 0 ? (
          <div className="text-center py-20 bg-[#0B0B0B]/50 border border-white/5 rounded-3xl">
            <LayoutGrid className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-400 text-sm font-semibold">No artworks catalogued</p>
            <p className="text-slate-500 text-xs mt-1">Add items to start listing them on the client application.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredArtworks.map((art) => (
              <div
                key={art.id}
                className={`bg-[#0D0D0D] border rounded-3xl p-4 flex gap-4 transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)] ${
                  art.is_visible === false ? 'border-white/5 opacity-55' : 'border-[#D4AF37]/20 hover:border-[#D4AF37]/50'
                }`}
              >
                {/* Artwork Thumbnail Image */}
                <div className="w-32 sm:w-36 h-36 flex-shrink-0 overflow-hidden rounded-2xl bg-slate-950 border border-white/5">
                  <img
                    src={optimizeImage(art.image_url, 400, 400)}
                    alt={art.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Details description */}
                <div className="flex-1 flex flex-col justify-between py-0.5 min-w-0">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] font-black uppercase text-[#D4AF37] tracking-wider px-2 py-0.5 rounded bg-[#D4AF37]/10 border border-[#D4AF37]/20 truncate">
                        {art.category}
                      </span>
                      {art.is_featured && (
                        <span className="text-[9px] font-black uppercase text-amber-500 tracking-wider flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Featured
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-100 truncate mt-1.5" title={art.title}>
                      {art.title}
                    </h3>
                    <p className="text-[#D4AF37] font-black text-sm mt-0.5">
                      ₹{art.price.toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="space-y-1 my-2">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Added: {new Date(art.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-slate-400 font-mono">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-slate-500" /> {art.views_count || 0} views
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-slate-500 fill-slate-500/10" /> {art.likes_count || 0} likes
                      </span>
                    </div>
                  </div>

                  {/* Actions buttons toolbar */}
                  <div className="flex items-center gap-2 border-t border-white/5 pt-2">
                    <button
                      onClick={() => navigate(`/admin/artwork/${art.id}`)}
                      className="p-1.5 text-slate-400 hover:text-[#D4AF37] hover:bg-white/5 rounded-lg transition-colors"
                      title="Edit details"
                      disabled={actionInProgressId === art.id}
                    >
                      <Pen className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleVisibility(art)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        art.is_visible === false
                          ? 'text-slate-500 hover:text-white hover:bg-white/5'
                          : 'text-[#D4AF37] hover:bg-[#D4AF37]/5'
                      }`}
                      title={art.is_visible === false ? 'Show artwork' : 'Hide artwork'}
                      disabled={actionInProgressId === art.id}
                    >
                      {art.is_visible === false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => toggleFeatured(art)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        art.is_featured ? 'text-amber-500 hover:bg-amber-500/5' : 'text-slate-500 hover:text-amber-500 hover:bg-white/5'
                      }`}
                      title={art.is_featured ? 'Unfeature artwork' : 'Feature artwork'}
                      disabled={actionInProgressId === art.id}
                    >
                      <Star className={`w-4 h-4 ${art.is_featured ? 'fill-amber-500' : ''}`} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(art.id)}
                      className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-500/5 rounded-lg transition-colors ml-auto"
                      title="Delete Artwork"
                      disabled={actionInProgressId === art.id}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Delete Confirmation Overlay Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D0D0D] border border-red-500/20 rounded-[28px] p-6 max-w-sm w-full shadow-2xl text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4 text-red-500">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: "'Cinzel', serif" }}>
              Delete Masterpiece?
            </h3>
            <p className="text-slate-400 text-xs mb-6 leading-relaxed">
              Are you sure you want to permanently delete this artwork catalog record? This action is irreversible.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl font-bold text-slate-300 bg-white/5 hover:bg-white/10 transition-colors text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2.5 rounded-xl font-black text-white bg-red-650 hover:bg-red-750 transition-colors text-xs"
              >
                Delete Now
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default AdminArtworksScreen;
