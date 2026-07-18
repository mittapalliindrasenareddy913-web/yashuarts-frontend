import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Pen, Trash2, PowerOff, Power, RotateCcw, Plus, X, Save, CheckCircle2, ArrowLeft, Palette } from 'lucide-react';
import api from '../services/api';
import BottomNav from '../components/BottomNav';

export const PricingManagementScreen = () => {
  const navigate = useNavigate();
  const [pricingList, setPricingList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [formData, setFormData] = useState({
    category: 'style',
    name: '',
    description: '',
    price: 0,
    isActive: true
  });

  const loadPricing = async () => {
    try {
      setLoading(true);
      const data = await api.pricing.getAllPricing();
      setPricingList(data);
    } catch (err) {
      console.error('Error fetching pricing:', err);
      alert('Failed to load pricing data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPricing();
  }, []);

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      category: 'style',
      name: '',
      description: '',
      price: 0,
      isActive: true
    });
    setIsFormOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      category: item.category,
      name: item.name,
      description: item.description,
      price: item.price,
      isActive: item.isActive
    });
    setIsFormOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.pricing.updatePricing(editingItem._id, formData);
      } else {
        await api.pricing.addPricing(formData);
      }
      setIsFormOpen(false);
      loadPricing();
    } catch (err) {
      console.error('Save pricing error:', err);
      alert('Failed to save pricing option');
    }
  };

  const toggleActiveStatus = async (item) => {
    try {
      await api.pricing.updatePricing(item._id, { isActive: !item.isActive });
      loadPricing();
    } catch (err) {
      console.error('Toggle pricing error:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this option?')) {
      try {
        await api.pricing.deletePricing(id);
        loadPricing();
      } catch (err) {
        console.error('Delete pricing error:', err);
      }
    }
  };

  const handleResetDefaults = async () => {
    const confirmation = window.confirm(
      'WARNING: This will delete ALL custom pricing and restore system defaults. Proceed?'
    );
    if (confirmation) {
      try {
        await api.pricing.seedDefaults();
        loadPricing();
      } catch (err) {
        console.error('Reset defaults error:', err);
        alert('Failed to reset defaults');
      }
    }
  };

  const styles = pricingList.filter((x) => x.category === 'style');
  const dimensions = pricingList.filter((x) => x.category === 'dimension');

  return (
    <div className="min-h-screen bg-[#030303] text-slate-100 pb-24 selection:bg-[#D4AF37] selection:text-slate-950">
      
      {/* Header bar panel */}
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
                Pricing Management
              </h1>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest" style={{ fontFamily: "'Inter', sans-serif" }}>
                Manage styles, dimensions, and live prices
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleResetDefaults}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors text-sm font-semibold border border-white/5"
            >
              <RotateCcw className="w-4 h-4" /> Reset Defaults
            </button>
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl transition-colors text-sm font-bold shadow-md shadow-amber-500/10"
            >
              <Plus className="w-4 h-4" /> Add Option
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* Loader status */}
        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
          </div>
        ) : pricingList.length === 0 ? (
          <div className="bg-[#1A1A1A] rounded-2xl border border-white/5 p-16 flex flex-col items-center justify-center text-center space-y-4 shadow-lg">
            <Settings className="w-12 h-12 text-slate-650 mb-2 animate-pulse" />
            <h2 className="text-xl font-bold text-white">No pricing records found. Create one or reset defaults.</h2>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              Your database is currently empty. You can click 'Reset Defaults' to automatically populate the standard styles and sizes.
            </p>
            <button
              onClick={handleResetDefaults}
              className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl transition-colors font-bold mt-6 shadow-lg shadow-amber-500/20"
            >
              <RotateCcw className="w-5 h-5" /> Auto-Seed Defaults
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-scale-up">
            
            {/* Style medium grid column */}
            <div className="bg-[#1A1A1A] rounded-2xl border border-white/5 overflow-hidden shadow-lg">
              <div className="p-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
                <h2 className="text-base font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                  <Palette className="w-5 h-5 text-amber-500" /> Artistic Styles
                </h2>
              </div>
              <div className="divide-y divide-white/5">
                {styles.map((item) => (
                  <div
                    key={item._id}
                    className={`p-4 flex items-start justify-between gap-4 transition-colors hover:bg-white/5 ${
                      item.isActive ? '' : 'opacity-50 grayscale'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white text-sm">{item.name}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 font-bold border border-white/5 font-mono">
                          ₹{item.price}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleActiveStatus(item)}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        title={item.isActive ? 'Disable' : 'Enable'}
                      >
                        {item.isActive ? (
                          <Power className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <PowerOff className="w-4 h-4 text-red-400" />
                        )}
                      </button>
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
                      >
                        <Pen className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {styles.length === 0 && (
                  <div className="p-6 text-center text-slate-500 text-xs font-semibold">No styles found.</div>
                )}
              </div>
            </div>

            {/* Sizes & dimensions column */}
            <div className="bg-[#1A1A1A] rounded-2xl border border-white/5 overflow-hidden shadow-lg">
              <div className="p-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
                <h2 className="text-base font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                  <Settings className="w-5 h-5 text-amber-500" /> Dimensions & Sizes
                </h2>
              </div>
              <div className="divide-y divide-white/5">
                {dimensions.map((item) => (
                  <div
                    key={item._id}
                    className={`p-4 flex items-start justify-between gap-4 transition-colors hover:bg-white/5 ${
                      item.isActive ? '' : 'opacity-50 grayscale'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white text-sm">{item.name}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 font-bold border border-white/5 font-mono">
                          +{item.price === 0 ? 'Included' : `₹${item.price}`}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleActiveStatus(item)}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
                        title={item.isActive ? 'Disable' : 'Enable'}
                      >
                        {item.isActive ? (
                          <Power className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <PowerOff className="w-4 h-4 text-red-400" />
                        )}
                      </button>
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
                      >
                        <Pen className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {dimensions.length === 0 && (
                  <div className="p-6 text-center text-slate-500 text-xs font-semibold">No dimensions found.</div>
                )}
              </div>
            </div>

          </div>
        )}
      </main>

      {/* Edit Form Modal Drawer overlay */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1A1A1A] w-full max-w-md rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between p-5 border-b border-white/5 bg-black/20">
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                {editingItem ? 'Edit Pricing Option' : 'Add Pricing Option'}
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-xs sm:text-sm font-semibold"
                >
                  <option value="style">Artistic Style</option>
                  <option value="dimension">Artwork Dimension</option>
                  <option value="delivery">Delivery Mode</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">
                  Name / Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-amber-500 outline-none text-xs sm:text-sm"
                  placeholder="e.g. A3 Portrait (Large)"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">
                  Price (₹)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-amber-500 outline-none text-xs sm:text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-1.5">
                  Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-amber-500 outline-none resize-none text-xs sm:text-sm leading-relaxed"
                  placeholder="e.g. 11.7 x 16.5 in - Eye-catching size..."
                />
              </div>

              <div className="pt-4 border-t border-white/5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white font-semibold text-xs uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-md shadow-amber-500/10"
                >
                  <Save className="w-4 h-4" /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default PricingManagementScreen;
