import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Layers,
  MapPin,
  Calendar,
  MessageCircle,
  RefreshCw,
  ShoppingBag
} from 'lucide-react';
import api from '../services/api';
import BottomNav from '../components/BottomNav';

const timelineSteps = [
  { status: 'Pending', label: 'Pending', desc: 'Reference image & custom requirements registered.' },
  { status: 'Accepted', label: 'Accepted', desc: 'Artist has accepted your order and commission.' },
  { status: 'In Progress', label: 'In Progress', desc: 'Handcrafting your drawing with premium charcoal/color.' },
  { status: 'Completed', label: 'Completed', desc: 'Masterpiece is finished. High-res scans ready.' },
  { status: 'Delivered', label: 'Delivered', desc: 'Carefully packaged and delivered to your doorstep.' }
];

const getNormalizedStatus = (statusStr) => {
  const status = statusStr ? statusStr.toLowerCase() : '';
  if (status.includes('received') || status.includes('pending')) return 'Pending';
  if (status.includes('review') || status.includes('contacted') || status.includes('accepted')) return 'Accepted';
  if (status.includes('progress') || status.includes('artwork')) return 'In Progress';
  if (status.includes('completed')) return 'Completed';
  if (status.includes('delivered')) return 'Delivered';
  return 'Pending';
};

export const MyOrdersScreen = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'completed'
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await api.orders.getAll();
      setOrders(data);
    } catch (err) {
      console.error('Error fetching user orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTimelineIndex = (statusStr) => {
    const norm = getNormalizedStatus(statusStr);
    return timelineSteps.findIndex((step) => step.status === norm);
  };

  const isOrderCompletedOrDelivered = (statusStr) => {
    const norm = getNormalizedStatus(statusStr);
    return norm === 'Completed' || norm === 'Delivered';
  };

  const filteredOrders = orders.filter((order) => {
    const isFinished = isOrderCompletedOrDelivered(order.order_status);
    return activeTab === 'completed' ? isFinished : !isFinished;
  });

  const toggleExpand = (id) => {
    setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-[#030303] text-slate-100 pb-24 selection:bg-[#D4AF37] selection:text-slate-950">
      <header className="bg-[#060606]/95 border-b border-[#D4AF37]/15 sticky top-0 z-10 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
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
                My Commissions
              </h1>
              <p className="text-[8px] text-slate-500 uppercase tracking-[0.2em]">
                Track Custom Sketches & Orders
              </p>
            </div>
          </div>
          <button
            onClick={fetchOrders}
            className="p-2.5 rounded-xl border text-[#D4AF37] border-white/5 bg-white/5 hover:bg-[#D4AF37]/10 transition-all duration-300"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Navigation Tabs */}
        <div className="flex bg-[#060606] p-1 border border-white/5 rounded-2xl mb-6">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
              activeTab === 'active'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Active ({orders.filter((o) => !isOrderCompletedOrDelivered(o.order_status)).length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
              activeTab === 'completed'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Completed ({orders.filter((o) => isOrderCompletedOrDelivered(o.order_status)).length})
          </button>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, idx) => (
              <div key={idx} className="bg-[#0D0D0D] border border-white/5 rounded-[22px] p-5 animate-pulse h-32" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-[#0B0B0B]/50 border border-white/5 rounded-3xl p-12 text-center shadow-xl">
            <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-sm font-semibold">No commissions found here</p>
            <p className="text-slate-500 text-xs mt-1 mb-6">
              Create customized sketched portraits of your photographs.
            </p>
            <button
              onClick={() => navigate('/custom-order')}
              className="bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-slate-950 font-black px-6 py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-lg"
            >
              Order Custom Art
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const currentStepIndex = getTimelineIndex(order.order_status);
              const isExpanded = expandedOrderId === order.id;
              
              return (
                <div
                  key={order.id}
                  className="bg-[#0D0D0D] border border-[#D4AF37]/25 rounded-[24px] overflow-hidden shadow-2xl transition-all duration-300"
                >
                  {/* Summary Card Header */}
                  <div className="p-5 sm:p-6 flex flex-col sm:flex-row gap-4 items-start justify-between border-b border-white/5">
                    <div className="flex gap-4">
                      <img
                        src={order.reference_image_url}
                        alt="Reference Portrait"
                        className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-2xl border border-white/10 shadow-lg"
                      />
                      <div>
                        <span className="text-[9px] text-[#D4AF37] uppercase tracking-widest font-black">
                          {order.artwork_type}
                        </span>
                        <h3 className="text-sm sm:text-base font-bold text-white mt-0.5" style={{ fontFamily: "'Cinzel', serif" }}>
                          {order.artwork_size} Portrait
                        </h3>
                        <div className="flex items-center gap-4 text-[10px] text-slate-400 mt-2">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                            {new Date(order.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                          </span>
                          <span className="flex items-center gap-1.5 font-bold text-[#D4AF37]">
                            <Layers className="w-3.5 h-3.5" />
                            ₹{order.amount}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 border-t border-white/5 sm:border-t-0 pt-3 sm:pt-0">
                      <span className="inline-flex px-3 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/25 text-[#D4AF37] text-[9px] font-bold uppercase tracking-wider rounded-full shadow-inner animate-pulse">
                        {getNormalizedStatus(order.order_status)}
                      </span>
                      <button
                        onClick={() => toggleExpand(order.id)}
                        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-semibold transition-colors"
                      >
                        {isExpanded ? (
                          <>
                            Hide Progress <ChevronUp className="w-4 h-4 text-[#D4AF37]" />
                          </>
                        ) : (
                          <>
                            Track Order <ChevronDown className="w-4 h-4 text-[#D4AF37]" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="p-5 sm:p-6 bg-[#060606] border-t border-white/5 space-y-6 animate-scale-up">
                      <div className="grid md:grid-cols-2 gap-4 bg-[#0D0D0D] rounded-2xl border border-white/5 p-4 text-xs sm:text-sm">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                            <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                            Shipping Details
                          </div>
                          <p className="text-white font-medium">{order.customer_name}</p>
                          <p className="text-slate-400 leading-relaxed">
                            {order.complete_address}, {order.city}, {order.state} - {order.pincode}
                          </p>
                          <p className="text-slate-400">Phone: {order.customer_phone}</p>
                          <p className="text-slate-400">Email: {order.email_address}</p>
                        </div>

                        <div className="space-y-1.5 border-t md:border-t-0 md:border-l border-white/5 pt-3 md:pt-0 md:pl-4">
                          <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                            <FileText className="w-3.5 h-3.5 text-[#D4AF37]" />
                            Order Info
                          </div>
                          <p className="text-slate-400">
                            Delivery Mode:{' '}
                            <span className="text-white font-semibold">{order.delivery_preference}</span>
                          </p>
                          <p className="text-slate-400">
                            Payment:{' '}
                            <span className="text-white font-semibold">{order.payment_method}</span>{' '}
                            ({order.payment_status === 'paid' ? 'Paid' : 'Pending Verification'})
                          </p>
                          {order.special_instructions && (
                            <p className="text-slate-400 italic">"Instructions: {order.special_instructions}"</p>
                          )}
                          {order.internal_notes && (
                            <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/10 rounded-lg p-2.5 mt-2">
                              <span className="text-[10px] text-[#D4AF37] uppercase tracking-widest font-black block">
                                Artist Message:
                              </span>
                              <p className="text-xs text-amber-200 mt-0.5 leading-relaxed">
                                {order.internal_notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Live Tracking Timeline */}
                      <div>
                        <h4 className="text-[9px] text-slate-400 uppercase tracking-widest font-black mb-4">
                          Live Timeline Tracker
                        </h4>
                        <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-white/5">
                          {timelineSteps.map((step, idx) => {
                            const isDone = idx <= currentStepIndex;
                            const isCurrent = idx === currentStepIndex;
                            
                            return (
                              <div key={step.status} className="relative flex gap-4">
                                <div
                                  className={`absolute -left-[19px] top-1 w-[8px] h-[8px] rounded-full border-2 transition-all ${
                                    isCurrent
                                      ? 'bg-[#D4AF37] border-[#D4AF37] scale-[2] ring-4 ring-[#D4AF37]/20 shadow-lg'
                                      : isDone
                                      ? 'bg-[#D4AF37] border-[#D4AF37]'
                                      : 'bg-[#121212] border-slate-700'
                                  }`}
                                />
                                <div>
                                  <h5
                                    className={`text-xs sm:text-sm font-bold uppercase tracking-wider ${
                                      isCurrent ? 'text-[#D4AF37]' : isDone ? 'text-slate-200' : 'text-slate-500'
                                    }`}
                                  >
                                    {step.label}
                                  </h5>
                                  <p
                                    className={`text-[10px] sm:text-xs leading-relaxed mt-0.5 ${
                                      isCurrent ? 'text-slate-300' : isDone ? 'text-slate-400' : 'text-slate-600'
                                    }`}
                                  >
                                    {step.desc}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Direct Message Button */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-white/5 justify-between items-center text-xs">
                        <span className="text-slate-500">For customizations or direct status updates:</span>
                        <a
                          href={`https://wa.me/919398029785?text=Hello%20YashuArts,%20I%20would%20like%20to%20discuss%20my%20commission%20order%20(${order.id})`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 bg-[#25D366] hover:bg-[#20ba5a] text-slate-950 font-black py-2 px-4 rounded-xl transition-all shadow-md"
                        >
                          <MessageCircle className="w-4 h-4" /> Message Artist on WhatsApp
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default MyOrdersScreen;
