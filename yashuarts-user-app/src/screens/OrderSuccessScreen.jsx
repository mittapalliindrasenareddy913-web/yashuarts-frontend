import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight, Clock, Phone, CheckCircle, Check } from 'lucide-react';

export const OrderSuccessScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const order = location.state?.order;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-slate-100 flex flex-col justify-center items-center p-4 selection:bg-amber-500 selection:text-slate-950">
      <div className="w-full max-w-md bg-[#121212]/60 border border-white/5 backdrop-blur-md rounded-3xl p-6 sm:p-8 text-center shadow-2xl space-y-6">
        
        {/* Animated Checkmark */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full scale-125 animate-pulse" />
            <CheckCircle className="w-16 h-16 text-amber-400 relative z-10 animate-bounce" />
          </div>
        </div>

        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2 leading-tight">
            Order Confirmed!
          </h1>
          <p className="text-sm text-slate-400">
            Thank you for commissioning your custom artwork with YashuArts.
          </p>
        </div>

        {/* Invoice Card */}
        <div className="bg-[#181818]/80 border border-slate-800/80 rounded-2xl p-5 text-left space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800/60 pb-3">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                Order ID
              </span>
              <p className="font-mono text-xs text-amber-400 font-bold">
                {order?.id || 'YA-CUSTOM-XXXX'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                Date
              </span>
              <p className="text-xs text-slate-300 font-semibold">
                {order?.created_at
                  ? new Date(order.created_at).toLocaleDateString()
                  : new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs sm:text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Client Name:</span>
              <span className="text-slate-200 font-semibold">
                {order?.customer_name || 'Valued Art Lover'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Artistic Style:</span>
              <span className="text-amber-400 font-bold">
                {order?.artwork_type || 'Custom Sketch'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Dimensions:</span>
              <span className="text-slate-200 font-semibold">
                {order?.artwork_size || 'Standard Size'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Delivery:</span>
              <span className="text-slate-200 font-semibold">
                {order?.delivery_preference || 'Standard Shipping'}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-800/60 pt-3 text-base">
              <span className="text-slate-300 font-semibold">Total Amount:</span>
              <span className="text-amber-400 font-extrabold">
                ₹{order?.amount || '0'}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Support Info */}
        <div className="bg-slate-900/40 border border-slate-800/40 rounded-2xl p-4 text-left space-y-3">
          <div className="flex gap-3 items-start">
            <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Estimated Response
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed mt-1">
                The artist will review your reference image and get in touch within 24-48 hours via WhatsApp or call to finalize composition.
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-start pt-2 border-t border-slate-800/40">
            <Phone className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Direct Support
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed mt-1">
                For questions, reference changes, or direct queries, feel free to text or call our helpline:{' '}
                <span className="text-amber-400 font-semibold">+91 93980 29785</span>.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => navigate('/my-orders')}
            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 py-3.5 px-4 rounded-2xl font-bold uppercase tracking-wider text-xs transition-all hover:scale-[1.02] shadow-lg shadow-amber-500/10"
          >
            <Check className="w-4 h-4" />
            Track My Orders
          </button>
          <button
            onClick={() => navigate('/gallery')}
            className="flex-1 flex items-center justify-center gap-2 border border-slate-850 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/80 text-slate-300 py-3.5 px-4 rounded-2xl font-bold uppercase tracking-wider text-xs transition-all hover:text-white"
          >
            Explore Gallery <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default OrderSuccessScreen;
