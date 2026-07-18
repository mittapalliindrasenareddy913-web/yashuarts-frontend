import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Upload, Trash2, Check } from 'lucide-react';
import api from '../services/api';
import Loader from '../components/Loader';

const CATEGORIES = ['Pencil Sketch', 'Color Portrait', 'Couple Sketch', 'Custom Drawing'];

export const AddEditArtworkScreen = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = id && id !== 'new';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [price, setPrice] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const [imagePreview, setImagePreview] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  
  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      loadArtwork();
    }
  }, [isEditMode]);

  const loadArtwork = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await api.artworks.getById(id);
      if (data) {
        setTitle(data.title);
        setDescription(data.description || '');
        setCategory(data.category);
        setPrice(data.price.toString());
        setIsFeatured(data.is_featured || false);
        setIsVisible(data.is_visible !== false);
        setCurrentImageUrl(data.image_url);
        setImagePreview(data.image_url);
      }
    } catch (err) {
      console.error('Error loading artwork:', err);
      setErrorMessage('Failed to load artwork details.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSubmitting(true);

    try {
      let uploadedUrl = currentImageUrl;
      if (imageFile) {
        uploadedUrl = await api.upload.uploadImage(imageFile, 'artworks');
      }

      if (!uploadedUrl) {
        setErrorMessage('Please upload an image to publish');
        setSubmitting(false);
        return;
      }

      const payload = {
        title,
        description,
        category,
        price: parseFloat(price),
        image_url: uploadedUrl,
        is_featured: isFeatured,
        is_visible: isVisible
      };

      if (isEditMode && id) {
        await api.artworks.update(id, payload);
      } else {
        await api.artworks.create(payload);
      }

      navigate('/admin/dashboard');
    } catch (err) {
      console.error('Error saving artwork:', err);
      setErrorMessage(err.message || 'Failed to save artwork');
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setSubmitting(true);
      if (isEditMode && id) {
        await api.artworks.delete(id);
        navigate('/admin/dashboard');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete artwork.');
    } finally {
      setSubmitting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-slate-100 selection:bg-amber-500 selection:text-slate-950 pb-24">
      {/* Header */}
      <header className="bg-slate-950/80 backdrop-blur-xl sticky top-0 z-10 border-b border-slate-800/60">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/admin/dashboard')}
            aria-label="Back to dashboard"
            title="Back to dashboard"
            className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-900/60 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-white" style={{ fontFamily: "'Cinzel', serif" }}>
              {isEditMode ? 'Edit Showpiece' : 'Publish New Artwork'}
            </h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">
              Gallery Catalog Manager
            </p>
          </div>
        </div>
      </header>

      {/* Main Form container */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        <form
          onSubmit={handleSubmit}
          className="bg-[#121212]/60 border border-white/5 backdrop-blur-md rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl"
        >
          {errorMessage && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-xs sm:text-sm animate-fade-in">
              {errorMessage}
            </div>
          )}

          {/* Reference Photo Input upload */}
          <div className="space-y-2">
            <label className="block text-xs font-extrabold uppercase tracking-widest text-slate-400">
              Artwork Image file
            </label>
            {imagePreview ? (
              <div className="relative border border-slate-850 rounded-2xl overflow-hidden bg-slate-950/40 p-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-80 object-contain rounded-xl bg-[#090909]"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(currentImageUrl);
                  }}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-950 border border-slate-850 text-slate-350 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:text-white shadow-2xl"
                >
                  Change Image file
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-80 border border-dashed border-slate-800 hover:border-amber-500/50 rounded-3xl cursor-pointer hover:bg-slate-900/10 transition-all bg-slate-950/20 group">
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                  <div className="bg-slate-900 p-4 rounded-full border border-slate-800 group-hover:border-amber-500/20 group-hover:bg-slate-900/60 transition-colors mb-4">
                    <Upload className="w-8 h-8 text-slate-400 group-hover:text-amber-400" />
                  </div>
                  <p className="mb-1 text-sm text-slate-200 font-bold uppercase tracking-wider">
                    Upload Artwork Scan
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Supports JPG, PNG up to 10MB
                  </p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>
            )}
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              Artwork Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-slate-950/60 border border-slate-850 text-white placeholder-slate-700 px-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-xs sm:text-sm"
              placeholder="e.g., Portrait of Elegance"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              Description / Notes
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full bg-slate-950/60 border border-slate-850 text-white placeholder-slate-700 px-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-xs sm:text-sm resize-none"
              placeholder="Describe the medium, details, and context..."
            />
          </div>

          {/* Category Select grid */}
          <div className="space-y-3">
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              Category / Medium
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`p-3.5 border rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all relative ${
                    category === cat
                      ? 'border-amber-500 bg-amber-500/5 text-amber-400 shadow-md shadow-amber-500/5'
                      : 'border-slate-850 hover:border-slate-700 bg-slate-900/30 text-slate-400'
                  }`}
                >
                  {category === cat && (
                    <span className="absolute top-1.5 right-1.5 bg-amber-500 text-slate-950 p-0.5 rounded-full scale-75 animate-scale-up">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Price */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              Base Price (₹)
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              min="0"
              step="1"
              className="w-full bg-slate-950/60 border border-slate-850 text-white placeholder-slate-700 px-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-xs sm:text-sm font-mono"
              placeholder="1500"
            />
          </div>

          {/* Featured checkbox banner */}
          <div className="flex items-center gap-3.5 p-4 bg-slate-950/40 border border-slate-850 rounded-2xl">
            <input
              type="checkbox"
              id="featured"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="w-5 h-5 bg-slate-900 border-slate-800 text-amber-550 rounded focus:ring-amber-500 focus:ring-offset-slate-900"
            />
            <label
              htmlFor="featured"
              className="text-xs font-bold uppercase tracking-wider text-slate-300 cursor-pointer select-none flex items-center gap-1.5"
            >
              Set as Artwork of the Day (Featured Banner)
            </label>
          </div>

          {/* Visible checkbox toggle */}
          <div className="flex items-center gap-3.5 p-4 bg-slate-950/40 border border-slate-850 rounded-2xl">
            <input
              type="checkbox"
              id="visible"
              checked={isVisible}
              onChange={(e) => setIsVisible(e.target.checked)}
              className="w-5 h-5 bg-slate-900 border-slate-800 text-amber-550 rounded focus:ring-amber-500 focus:ring-offset-slate-900"
            />
            <label
              htmlFor="visible"
              className="text-xs font-bold uppercase tracking-wider text-slate-300 cursor-pointer select-none"
            >
              Show in Customer App Gallery
            </label>
          </div>

          {/* Actions toolbar */}
          <div className="flex gap-4">
            {isEditMode && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={submitting}
                className="flex-1 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 py-4 rounded-2xl font-extrabold uppercase tracking-wider text-xs transition-all hover:scale-[1.01] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                Delete Artwork
              </button>
            )}
            <button
              type="submit"
              disabled={submitting}
              className={`${
                isEditMode ? 'flex-[2]' : 'w-full'
              } bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 py-4 rounded-2xl font-extrabold uppercase tracking-wider text-xs transition-all hover:scale-[1.01] disabled:opacity-50 shadow-xl shadow-amber-500/10 flex items-center justify-center gap-2`}
            >
              <Save className="w-4 h-4" />
              {submitting
                ? 'Saving changes...'
                : isEditMode
                ? 'Save Masterpiece Changes'
                : 'Publish Masterpiece'}
            </button>
          </div>
        </form>
      </main>

      {/* Delete Confirmation Modal Overlay */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#121212] border border-white/5 rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Cinzel', serif" }}>
              Delete Masterpiece
            </h2>
            <p className="text-slate-400 mb-6 text-xs sm:text-sm leading-relaxed">
              Are you sure you want to permanently delete this artwork? This will remove the image from Cloudinary and the record from database.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-5 py-2.5 rounded-xl font-semibold text-slate-350 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2.5 rounded-xl font-bold text-slate-950 bg-red-500 hover:bg-red-400 transition-colors shadow-lg shadow-red-500/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddEditArtworkScreen;
