import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Move, RotateCw, Truck, ZoomIn, ArrowLeft, Check, Camera, RefreshCw, X } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';

// Image Cropper Component
const ImageCropperModal = ({ isOpen, onClose, imageSrc, onSave }) => {
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [aspectRatio, setAspectRatio] = useState(1); // default 1:1 square
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [imageEl, setImageEl] = useState(null);

  useEffect(() => {
    if (imageSrc) {
      const img = new Image();
      img.onload = () => {
        setImageEl(img);
        setZoom(1);
        setRotation(0);
        setPanX(0);
        setPanY(0);
      };
      img.src = imageSrc;
    }
  }, [imageSrc]);

  useEffect(() => {
    if (imageEl && canvasRef.current) {
      drawCanvas();
    }
  }, [imageEl, zoom, rotation, aspectRatio, panX, panY]);

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageEl) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 500;
    canvas.height = 400;

    // Background fill
    ctx.fillStyle = '#121212';
    ctx.fillRect(0, 0, 500, 400);

    ctx.save();
    ctx.translate(500 / 2, 400 / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);

    // Apply panning adjusted for zoom
    const translateX = (panX / 100) * 150;
    const translateY = (panY / 100) * 150;
    ctx.translate(translateX, translateY);

    // Draw image inside guidelines
    const imageRatio = imageEl.width / imageEl.height;
    let drawWidth = 300;
    let drawHeight = 300 / imageRatio;

    if (drawHeight > 240) {
      drawHeight = 240;
      drawWidth = 240 * imageRatio;
    }

    ctx.drawImage(imageEl, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();

    // Semi-transparent overlay outside cropping frame
    ctx.fillStyle = 'rgba(11, 11, 11, 0.6)';
    let frameWidth = 280;
    let frameHeight = 280;

    if (aspectRatio !== 'free') {
      if (aspectRatio > 1) {
        frameWidth = 280;
        frameHeight = 280 / aspectRatio;
      } else {
        frameHeight = 280;
        frameWidth = 280 * aspectRatio;
      }
    }

    const startX = (500 - frameWidth) / 2;
    const startY = (400 - frameHeight) / 2;

    ctx.fillRect(0, 0, startX, 400); // left
    ctx.fillRect(startX + frameWidth, 0, 500 - (startX + frameWidth), 400); // right
    ctx.fillRect(startX, 0, frameWidth, startY); // top
    ctx.fillRect(startX, startY + frameHeight, frameWidth, 400 - (startY + frameHeight)); // bottom

    // Draw cropping frame boundary
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(startX, startY, frameWidth, frameHeight);

    // Draw crop corners
    ctx.fillStyle = '#D4AF37';
    // Top-Left Corner
    ctx.fillRect(startX - 2, startY - 2, 12, 4);
    ctx.fillRect(startX - 2, startY - 2, 4, 12);
    // Top-Right Corner
    ctx.fillRect(startX + frameWidth - 12 + 2, startY - 2, 12, 4);
    ctx.fillRect(startX + frameWidth - 2, startY - 2, 4, 12);
    // Bottom-Left Corner
    ctx.fillRect(startX - 2, startY + frameHeight - 4 + 2, 12, 4);
    ctx.fillRect(startX - 2, startY + frameHeight - 12 + 2, 4, 12);
    // Bottom-Right Corner
    ctx.fillRect(startX + frameWidth - 12 + 2, startY + frameHeight - 4 + 2, 12, 4);
    ctx.fillRect(startX + frameWidth - 2, startY + frameHeight - 12 + 2, 4, 12);
  };

  const handleSave = () => {
    if (!imageEl || !canvasRef.current) return;
    
    // Create high-res destination canvas for final crop
    const saveCanvas = document.createElement('canvas');
    let cropWidth = 280;
    let cropHeight = 280;

    if (aspectRatio !== 'free') {
      if (aspectRatio > 1) {
        cropWidth = 280;
        cropHeight = 280 / aspectRatio;
      } else {
        cropHeight = 280;
        cropWidth = 280 * aspectRatio;
      }
    }

    // Multiply by 3 for high-res output
    saveCanvas.width = cropWidth * 3;
    saveCanvas.height = cropHeight * 3;

    const ctx = saveCanvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#121212';
    ctx.fillRect(0, 0, saveCanvas.width, saveCanvas.height);

    ctx.save();
    ctx.translate(saveCanvas.width / 2, saveCanvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom * 3, zoom * 3);

    const translateX = (panX / 100) * 150;
    const translateY = (panY / 100) * 150;
    ctx.translate(translateX, translateY);

    const imageRatio = imageEl.width / imageEl.height;
    let drawWidth = 300;
    let drawHeight = 300 / imageRatio;

    if (drawHeight > 240) {
      drawHeight = 240;
      drawWidth = 240 * imageRatio;
    }

    ctx.drawImage(imageEl, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();

    // Export as JPEG blob
    saveCanvas.toBlob(
      (blob) => {
        if (blob) {
          onSave(blob, saveCanvas.toDataURL('image/jpeg', 0.95));
          onClose();
        }
      },
      'image/jpeg',
      0.95
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#121212] border border-slate-800 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-scale-up">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <h3 className="text-base font-bold uppercase tracking-wider text-amber-400">
            Position & Crop Photo
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas Display */}
        <div className="flex justify-center bg-[#0B0B0B] p-4 border-b border-slate-900 overflow-hidden">
          <canvas ref={canvasRef} className="max-w-full rounded-xl border border-slate-800 shadow-inner" style={{ height: '300px' }} />
        </div>

        {/* Aspect Ratio Options */}
        <div className="px-6 py-3 bg-[#161616] border-b border-slate-900 flex items-center gap-3 overflow-x-auto scrollbar-none">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Aspect Ratio:</span>
          <div className="flex gap-1.5">
            {[
              { label: '1:1 Square', val: 1 },
              { label: '3:4 Portrait', val: 3 / 4 },
              { label: '4:3 Classic', val: 4 / 3 },
              { label: '16:9 Cinema', val: 16 / 9 },
              { label: 'Free Form', val: 'free' }
            ].map((ratio) => (
              <button
                key={ratio.label}
                type="button"
                onClick={() => setAspectRatio(ratio.val)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all ${
                  aspectRatio === ratio.val ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {ratio.label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Control Sliders */}
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <ZoomIn className="w-3.5 h-3.5 text-amber-400" /> Zoom Scale
              </span>
              <span className="text-amber-400 font-bold text-xs">{zoom.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium flex items-center gap-1.5">
                  <Move className="w-3.5 h-3.5 text-amber-400" /> Pan Horizontal
                </span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={panX}
                onChange={(e) => setPanX(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
            
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium flex items-center gap-1.5">
                  <Move className="w-3.5 h-3.5 text-amber-400 rotate-90" /> Pan Vertical
                </span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={panY}
                onChange={(e) => setPanY(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="flex-1 flex items-center justify-center gap-2 border border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-900 text-slate-200 py-3 rounded-2xl font-bold uppercase tracking-wider text-xs transition-colors"
            >
              <RotateCw className="w-4 h-4 text-amber-400" /> Rotate 90°
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 py-3 rounded-2xl font-bold uppercase tracking-wider text-xs transition-all hover:scale-[1.02] shadow-lg shadow-amber-500/10"
            >
              <Check className="w-4 h-4" /> Save Crop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main CustomOrderScreen Component
export const CustomOrderScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [step, setStep] = useState(1);
  const [croppedBlob, setCroppedBlob] = useState(null);
  const [croppedUrl, setCroppedUrl] = useState('');
  const [isCroppingOpen, setIsCroppingOpen] = useState(false);
  const [sourceImageUrl, setSourceImageUrl] = useState('');
  
  // Pricing lists
  const [styles, setStyles] = useState([]);
  const [dimensions, setDimensions] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  
  // Selections
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [selectedDimension, setSelectedDimension] = useState(null);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  
  const [loadingPricing, setLoadingPricing] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  
  // Customer details form states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [completeAddress, setCompleteAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  useEffect(() => {
    if (user) {
      setCustomerName(user.full_name || '');
      setCustomerPhone(user.mobile_number || '');
      setEmailAddress(user.email || '');
    }
    
    // Load pricing configurations
    (async () => {
      const cached = localStorage.getItem('yashuarts_cached_pricing');
      const processPricing = (items) => {
        const styleItems = items.filter((x) => x.category === 'style');
        const dimItems = items.filter((x) => x.category === 'dimension');
        const delItems = items.filter((x) => x.category === 'delivery');
        
        setStyles(styleItems);
        setDimensions(dimItems);
        setDeliveries(delItems);
        
        setSelectedStyle((prev) => prev || (styleItems.length > 0 ? styleItems[0] : null));
        setSelectedDimension((prev) => prev || (dimItems.length > 0 ? dimItems[0] : null));
        setSelectedDelivery((prev) => prev || (delItems.length > 0 ? delItems[0] : null));
      };

      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            processPricing(parsed);
            setLoadingPricing(false);
          }
        } catch (e) {
          console.error('Failed to parse cached pricing:', e);
        }
      }

      try {
        const pricingList = await api.pricing.getPublicPricing();
        localStorage.setItem('yashuarts_cached_pricing', JSON.stringify(pricingList));
        processPricing(pricingList);
      } catch (err) {
        console.error('Failed to load pricing:', err);
      } finally {
        setLoadingPricing(false);
      }
    })();
  }, [user]);

  const totalAmount = (selectedStyle?.price || 0) + (selectedDimension?.price || 0) + (selectedDelivery?.price || 0);

  const handleFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSourceImageUrl(reader.result);
        setIsCroppingOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCroppedSave = (blob, dataUrl) => {
    setCroppedBlob(blob);
    setCroppedUrl(dataUrl);
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!selectedStyle || !selectedDimension) {
        setErrorMessage('Please select a style and size');
        return;
      }
      setErrorMessage(null);
      setStep(2);
    } else if (step === 2) {
      if (!croppedBlob) {
        setErrorMessage('Please select and crop a reference photo to proceed');
        return;
      }
      setErrorMessage(null);
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    setStep((s) => Math.max(1, s - 1));
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!croppedBlob || !selectedStyle || !selectedDimension || !selectedDelivery) {
      setErrorMessage('Please ensure all required fields and images are provided.');
      return;
    }

    if (!user) {
      navigate('/login');
      return;
    }

    setSubmitting(true);
    try {
      // Upload cropped image to cloud
      const fileObject = new File([croppedBlob], 'reference_crop.jpg', { type: 'image/jpeg' });
      const uploadedUrl = await api.upload.uploadImage(fileObject, 'orders');

      // Create Order on Backend
      const orderData = {
        customer_name: customerName,
        customer_phone: customerPhone,
        email_address: emailAddress,
        complete_address: completeAddress,
        city: city,
        state: state,
        pincode: pincode,
        artwork_type: selectedStyle.name,
        artwork_size: selectedDimension.name.split(' (')[0],
        reference_image_url: uploadedUrl,
        special_instructions: specialInstructions,
        amount: totalAmount,
        payment_method: 'UPI',
        delivery_preference: selectedDelivery.name
      };

      const finalOrder = await api.orders.create(orderData);
      
      // Navigate to success page
      navigate('/order-success', { state: { order: finalOrder } });
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit your commission request. Please try again.');
      setSubmitting(false);
    }
  };

  if (loadingPricing) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-slate-100 selection:bg-amber-500 selection:text-slate-950 pb-24">
      {/* Header */}
      <header className="bg-slate-950/80 backdrop-blur-xl sticky top-0 z-10 border-b border-slate-800/60">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-900/60 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-white" style={{ fontFamily: "'Cinzel', serif" }}>
              Commission Custom Art
            </h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">
              Handcrafted Original Portraits
            </p>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Step Progress Bar */}
        <div className="flex justify-between items-center bg-[#121212]/80 border border-slate-850 rounded-2xl p-4 mb-6 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
          <div className={`flex items-center gap-2 ${step >= 1 ? 'text-amber-400' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border ${
              step >= 1 ? 'bg-amber-500 text-slate-950 border-transparent' : 'border-slate-800'
            }`}>
              1
            </span>
            Style & Size
          </div>
          <div className="h-[1px] bg-slate-800 flex-1 mx-4" />
          <div className={`flex items-center gap-2 ${step >= 2 ? 'text-amber-400' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border ${
              step >= 2 ? 'bg-amber-500 text-slate-950 border-transparent' : 'border-slate-800'
            }`}>
              2
            </span>
            Photo Upload
          </div>
          <div className="h-[1px] bg-slate-800 flex-1 mx-4" />
          <div className={`flex items-center gap-2 ${step >= 3 ? 'text-amber-400' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] border ${
              step >= 3 ? 'bg-amber-500 text-slate-950 border-transparent' : 'border-slate-800'
            }`}>
              3
            </span>
            Shipping Info
          </div>
        </div>

        {/* Step Details & Forms */}
        <form
          onSubmit={handleSubmitOrder}
          className="bg-[#121212]/60 border border-white/5 backdrop-blur-md rounded-3xl p-6 sm:p-8 space-y-8 shadow-2xl"
        >
          {errorMessage && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3.5 rounded-xl text-xs sm:text-sm leading-relaxed animate-fade-in">
              {errorMessage}
            </div>
          )}

          {/* STEP 1: Select Style & Size */}
          {step === 1 && (
            <div className="space-y-6 animate-scale-up">
              {/* Style Selection */}
              <div className="space-y-3">
                <label className="block text-xs font-extrabold uppercase tracking-widest text-slate-400">
                  Select Artistic Style & Medium
                </label>
                {styles.length === 0 ? (
                  <p className="text-sm text-slate-500">No styles available.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {styles.map((style) => (
                      <button
                        key={style._id}
                        type="button"
                        onClick={() => setSelectedStyle(style)}
                        className={`p-5 rounded-2xl text-left border transition-all relative ${
                          selectedStyle?._id === style._id
                            ? 'border-amber-500 bg-amber-500/5 shadow-lg shadow-amber-500/5'
                            : 'border-slate-850 hover:border-slate-700 bg-slate-900/30'
                        }`}
                      >
                        {selectedStyle?._id === style._id && (
                          <span className="absolute top-3 right-3 bg-amber-500 text-slate-950 p-0.5 rounded-full">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <h4 className="font-bold text-white text-sm uppercase tracking-wider">{style.name}</h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed min-h-[48px]">
                          {style.description}
                        </p>
                        <div className="text-amber-400 font-extrabold text-lg mt-3">₹{style.price}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Dimensions Selection */}
              <div className="space-y-3 pt-4 border-t border-slate-900">
                <label className="block text-xs font-extrabold uppercase tracking-widest text-slate-400">
                  Select Artwork Dimensions
                </label>
                {dimensions.length === 0 ? (
                  <p className="text-sm text-slate-500">No dimensions available.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {dimensions.map((dim) => (
                      <button
                        key={dim._id}
                        type="button"
                        onClick={() => setSelectedDimension(dim)}
                        className={`p-5 rounded-2xl text-left border transition-all relative ${
                          selectedDimension?._id === dim._id
                            ? 'border-amber-500 bg-amber-500/5 shadow-lg shadow-amber-500/5'
                            : 'border-slate-850 hover:border-slate-700 bg-slate-900/30'
                        }`}
                      >
                        {selectedDimension?._id === dim._id && (
                          <span className="absolute top-3 right-3 bg-amber-500 text-slate-950 p-0.5 rounded-full">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <h4 className="font-bold text-white text-sm uppercase tracking-wider">
                          {dim.name.split(' (')[0]}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed min-h-[32px]">
                          {dim.description}
                        </p>
                        <div className="text-amber-400 font-bold text-xs mt-3">
                          {dim.price === 0 ? 'Included' : `+₹${dim.price}`}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Step Navigation */}
              <div className="flex pt-4 border-t border-slate-900 justify-end">
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={!selectedStyle || !selectedDimension}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold px-8 py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all hover:scale-[1.02] shadow-lg shadow-amber-500/10 disabled:opacity-50"
                >
                  Configure Reference Photo
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Photo Upload */}
          {step === 2 && (
            <div className="space-y-6 animate-scale-up">
              <div className="space-y-2">
                <label className="block text-xs font-extrabold uppercase tracking-widest text-slate-400">
                  Upload Reference Portrait Photo
                </label>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Upload high resolution pictures with clear lighting details. Click below to scale, zoom, and crop the image to direct composition.
                </p>
              </div>

              {/* Cropper preview display */}
              <div>
                {croppedUrl ? (
                  <div className="relative border border-slate-850 rounded-2xl overflow-hidden bg-slate-950/40 p-2">
                    <img
                      src={croppedUrl}
                      alt="Portrait reference preview"
                      className="w-full h-80 object-contain rounded-xl bg-[#090909]"
                    />
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 w-max">
                      <label className="bg-slate-950 border border-slate-850 text-slate-300 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:text-white cursor-pointer shadow-2xl flex items-center justify-center">
                        Change Portrait
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileSelected} />
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsCroppingOpen(true)}
                        className="bg-amber-500 text-slate-950 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-amber-400 shadow-2xl flex items-center justify-center"
                      >
                        Adjust Position / Crop
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-80 border border-dashed border-slate-800 hover:border-amber-500/50 rounded-3xl cursor-pointer hover:bg-slate-900/10 transition-all bg-slate-950/20 group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                      <div className="bg-slate-900 p-4 rounded-full border border-slate-800 group-hover:border-amber-500/20 group-hover:bg-slate-900/60 transition-colors mb-4">
                        <Camera className="w-8 h-8 text-slate-400 group-hover:text-amber-400" />
                      </div>
                      <p className="mb-1 text-sm text-slate-200 font-bold uppercase tracking-wider">
                        Upload Reference Image
                      </p>
                      <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">
                        Supports JPEG, PNG formats (up to 10MB)
                      </p>
                      <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-semibold px-3 py-1 rounded-full">
                        Cropper tool starts automatically
                      </span>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileSelected} />
                  </label>
                )}
              </div>

              {/* Special instructions */}
              <div className="space-y-2 pt-4 border-t border-slate-900">
                <label className="block text-xs font-extrabold uppercase tracking-widest text-slate-400">
                  Special Artistic Requests
                </label>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-950/60 border border-slate-850 text-white placeholder-slate-650 px-4 py-3 rounded-2xl focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500 text-xs sm:text-sm resize-none"
                  placeholder="Examples: 'Remove glasses from subject', 'Combine background into a solid vignette', 'Keep contrast soft'..."
                />
              </div>

              {/* Step Navigation */}
              <div className="flex pt-4 border-t border-slate-900 justify-between items-center">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider"
                >
                  Back to Styles
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={!croppedBlob}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold px-8 py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all hover:scale-[1.02] shadow-lg shadow-amber-500/10 disabled:opacity-50"
                >
                  Configure Shipping Address
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Shipping & Checkout */}
          {step === 3 && (
            <div className="space-y-6 animate-scale-up">
              {/* Contact Details */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-900 pb-2">
                  Client & Contact details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      required
                      className="w-full bg-slate-950/60 border border-slate-850 text-white placeholder-slate-700 px-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500 text-xs sm:text-sm"
                      placeholder="Indrasena Reddy"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                      WhatsApp Phone Number
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      required
                      className="w-full bg-slate-950/60 border border-slate-850 text-white placeholder-slate-700 px-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500 text-xs sm:text-sm"
                      placeholder="+91 93980 29785"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    required
                    className="w-full bg-slate-950/60 border border-slate-850 text-white placeholder-slate-700 px-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500 text-xs sm:text-sm"
                    placeholder="mittapalli@gmail.com"
                  />
                </div>
              </div>

              {/* Delivery Address */}
              <div className="space-y-4 pt-4 border-t border-slate-900">
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-900 pb-2">
                  Shipping Delivery Address
                </h4>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                    Complete Address (Flat, Street, Area)
                  </label>
                  <input
                    type="text"
                    value={completeAddress}
                    onChange={(e) => setCompleteAddress(e.target.value)}
                    required
                    className="w-full bg-slate-950/60 border border-slate-850 text-white placeholder-slate-700 px-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500 text-xs sm:text-sm"
                    placeholder="H-No 4/25, Ramachandra Street"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                      City
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                      className="w-full bg-slate-950/60 border border-slate-850 text-white placeholder-slate-700 px-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500 text-xs sm:text-sm"
                      placeholder="Cuddapah"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                      State
                    </label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      required
                      className="w-full bg-slate-950/60 border border-slate-850 text-white placeholder-slate-700 px-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500 text-xs sm:text-sm"
                      placeholder="Andhra Pradesh"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                      Pincode
                    </label>
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      required
                      className="w-full bg-slate-950/60 border border-slate-850 text-white placeholder-slate-700 px-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500 text-xs sm:text-sm"
                      placeholder="516001"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Speed Option */}
              <div className="space-y-3 pt-4 border-t border-slate-900">
                <label className="block text-xs font-extrabold uppercase tracking-widest text-slate-400">
                  Select Delivery Mode
                </label>
                {deliveries.length === 0 ? (
                  <p className="text-sm text-slate-500">No delivery options available.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {deliveries.map((del) => (
                      <button
                        key={del._id}
                        type="button"
                        onClick={() => setSelectedDelivery(del)}
                        className={`p-4 rounded-xl text-left border transition-all relative ${
                          selectedDelivery?._id === del._id
                            ? 'border-amber-500 bg-amber-500/5 shadow-lg shadow-amber-500/5'
                            : 'border-slate-850 hover:border-slate-700 bg-slate-900/30'
                        }`}
                      >
                        {selectedDelivery?._id === del._id && (
                          <span className="absolute top-3 right-3 bg-amber-500 text-slate-950 p-0.5 rounded-full">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        )}
                        <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                          {del.name === 'Express' ? <Truck className="w-3.5 h-3.5 text-amber-400" /> : null}
                          {del.name} Mode
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed min-h-[30px]">
                          {del.description}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Pricing breakdown summary */}
              {selectedStyle && selectedDimension && selectedDelivery && (
                <div className="bg-slate-950 border border-slate-850 rounded-2xl p-5 mt-6 space-y-2.5">
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>Style base amount ({selectedStyle.name}):</span>
                    <span>₹{selectedStyle.price}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>Size adjustment ({selectedDimension.name.split(' (')[0]}):</span>
                    <span>{selectedDimension.price === 0 ? '₹0' : `+₹${selectedDimension.price}`}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>Delivery fee ({selectedDelivery.name}):</span>
                    <span>{selectedDelivery.price === 0 ? '₹0' : `+₹${selectedDelivery.price}`}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-slate-900">
                    <span className="text-sm text-slate-350 font-bold uppercase tracking-wider">
                      Total Commission Amount:
                    </span>
                    <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500">
                      ₹{totalAmount}
                    </span>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex pt-4 border-t border-slate-900 justify-between items-center">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider"
                >
                  Back to Reference
                </button>
                <button
                  type="submit"
                  disabled={submitting || !croppedBlob || !selectedStyle || !selectedDimension || !selectedDelivery}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-extrabold px-10 py-4 rounded-2xl text-xs uppercase tracking-wider transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-amber-500/10 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Processing...
                    </>
                  ) : (
                    'Confirm Commission Order'
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </main>

      {/* Cropper Modal Overlay */}
      <ImageCropperModal
        isOpen={isCroppingOpen}
        onClose={() => setIsCroppingOpen(false)}
        imageSrc={sourceImageUrl}
        onSave={handleCroppedSave}
      />
    </div>
  );
};

export default CustomOrderScreen;
