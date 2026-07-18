import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapPin, ArrowLeft, Info, Trash2, RefreshCw, X, Download } from 'lucide-react';
import api from '../services/api';
import BottomNav from '../components/BottomNav';

const STATUS_OPTIONS = [
  'Order Received',
  'Under Review',
  'Artist Contacted',
  'Artwork In Progress',
  'Completed',
  'Shipped',
  'Delivered'
];

const PAYMENT_METHODS = ['UPI', 'Cash', 'Online'];

export const OrdersScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const filterParam = queryParams.get('status');

  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [zoomedImageUrl, setZoomedImageUrl] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [internalNotes, setInternalNotes] = useState({});

  const handleDownloadImage = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'download.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Failed to download image:', err);
      window.open(url, '_blank');
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const list = await api.orders.getAll();
      setOrders(list);
      
      const notesMap = {};
      list.forEach((ord) => {
        notesMap[ord.id] = ord.internal_notes || '';
      });
      setInternalNotes(notesMap);
      
      applyFilters(list);
    } catch (err) {
      console.error('Error loading admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (list) => {
    if (!filterParam) {
      setFilteredOrders(list);
      return;
    }

    const param = filterParam.toLowerCase();
    if (param === 'pending') {
      setFilteredOrders(
        list.filter((o) => !['Completed', 'Shipped', 'Delivered'].includes(o.order_status))
      );
    } else if (param === 'completed') {
      setFilteredOrders(
        list.filter((o) => ['Completed', 'Shipped', 'Delivered'].includes(o.order_status))
      );
    } else if (param === 'new') {
      setFilteredOrders(
        list.filter((o) => o.order_status === 'Order Received' || o.order_status === 'Pending')
      );
    } else if (param === 'accepted') {
      setFilteredOrders(
        list.filter((o) => o.order_status === 'Under Review' || o.order_status === 'Artist Contacted' || o.order_status === 'Accepted')
      );
    } else if (param === 'inprogress') {
      setFilteredOrders(
        list.filter((o) => o.order_status === 'Artwork In Progress' || o.order_status === 'In Progress')
      );
    } else if (param === 'delivered') {
      setFilteredOrders(
        list.filter((o) => o.order_status === 'Delivered' || o.order_status === 'Shipped')
      );
    } else {
      setFilteredOrders(
        list.filter((o) => o.order_status.toLowerCase() === param)
      );
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filterParam]);

  const handleStatusChange = async (id, status) => {
    try {
      await api.orders.updateStatus(id, status);
      fetchOrders();
    } catch (err) {
      console.error('Error changing order status:', err);
    }
  };

  const handlePaymentStatusChange = async (id, payStatus) => {
    try {
      await api.orders.updateStatus(id, undefined, payStatus);
      fetchOrders();
    } catch (err) {
      console.error('Error changing payment status:', err);
    }
  };

  const handlePaymentMethodChange = async (id, payMethod) => {
    try {
      await api.orders.updateStatus(id, undefined, undefined, payMethod);
      fetchOrders();
    } catch (err) {
      console.error('Error changing payment method:', err);
    }
  };

  const handleNoteTextChange = (id, text) => {
    setInternalNotes((prev) => ({ ...prev, [id]: text }));
  };

  const handleSaveNote = async (id) => {
    try {
      const note = internalNotes[id] || '';
      await api.orders.updateStatus(id, undefined, undefined, undefined, note);
      alert('Internal note saved successfully');
      fetchOrders();
    } catch (err) {
      console.error('Error saving notes:', err);
    }
  };

  const handleDelete = async (id) => {
    if (confirmDeleteId !== id) {
      // First click: arm delete
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
      return;
    }

    // Second click: execute delete
    try {
      await api.orders.delete(id);
      setConfirmDeleteId(null);
      fetchOrders();
    } catch (err) {
      console.error('Error deleting order:', err);
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Order Received':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'Under Review':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case 'Artist Contacted':
        return 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
      case 'Artwork In Progress':
        return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
      case 'Completed':
        return 'bg-green-500/10 text-green-400 border border-green-500/20';
      case 'Delivered':
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
      default:
        return 'bg-slate-800 text-slate-350 border border-transparent';
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-slate-100 pb-24 selection:bg-[#D4AF37] selection:text-slate-950">
      {/* Header bar panel */}
      <header className="bg-[#060606]/90 border-b border-[#D4AF37]/15 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="p-2 text-slate-400 hover:text-[#D4AF37] hover:bg-white/5 rounded-xl transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-black tracking-wider text-[#D4AF37] uppercase" style={{ fontFamily: "'Cinzel', serif" }}>
                Commissions Manager
              </h1>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest" style={{ fontFamily: "'Inter', sans-serif" }}>
                {filterParam ? `${filterParam} Orders Catalog` : 'Complete Orders Catalog'}
              </p>
            </div>
          </div>
          <button
            onClick={fetchOrders}
            className="p-2 text-slate-400 hover:text-[#D4AF37] border border-white/5 bg-[#121212] hover:bg-white/5 rounded-xl transition-all text-xs flex items-center gap-1 font-bold uppercase tracking-wider px-3"
          >
            <RefreshCw className="w-4 h-4 animate-scale-up" /> Refresh
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37]" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-[#0D0D0D] border border-white/5 rounded-3xl p-12 text-center shadow-xl">
            <Info className="w-12 h-12 text-slate-650 mx-auto mb-4" />
            <p className="text-slate-400 text-sm font-semibold">No commission records found</p>
            <p className="text-slate-500 text-xs mt-1">Orders matching this filter will populate automatically here.</p>
          </div>
        ) : (
          <div className="space-y-6 animate-scale-up">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-[#0D0D0D] border border-[#D4AF37]/15 rounded-3xl p-5 sm:p-6 shadow-2xl transition-all hover:border-[#D4AF37]/35"
              >
                <div className="grid lg:grid-cols-12 gap-6">
                  {/* Left Column (Image & ID) */}
                  <div className="lg:col-span-3 space-y-2">
                    <div
                      className="relative group cursor-pointer overflow-hidden rounded-2xl border border-white/5 shadow-inner"
                      onClick={() => setZoomedImageUrl(order.reference_image_url)}
                    >
                      <div className="absolute inset-0 bg-black/50 group-hover:bg-transparent transition-colors flex items-center justify-center text-[10px] font-bold text-[#D4AF37] opacity-0 group-hover:opacity-100 z-10">
                        Zoom Masterpiece
                      </div>
                      <img
                        src={order.reference_image_url}
                        alt="Reference Portrait"
                        className="w-full h-48 object-cover rounded-2xl transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadImage(order.reference_image_url, `order_${order.id || 'photo'}.jpg`);
                      }}
                      className="w-full py-2 bg-[#121212] border border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10 active:scale-95 transition-all text-[10px] font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Reference Photo
                    </button>
                    <div className="text-center">
                      <span className="text-[9px] text-slate-600 font-mono block mt-1.5">Order ID: {order.id}</span>
                    </div>
                  </div>

                  {/* Right Column (Client info & update statuses) */}
                  <div className="lg:col-span-9 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-3 border-b border-white/5">
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                          {order.customer_name}
                          <span className="text-[11px] text-slate-500 font-medium">({order.customer_phone})</span>
                        </h3>
                        <p className="text-xs text-[#D4AF37] font-semibold mt-0.5">{order.email_address}</p>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-full ${getStatusBadgeStyle(order.order_status)}`}>
                          {order.order_status}
                        </span>
                        <button
                          onClick={() => handleDelete(order.id)}
                          className={`p-2 rounded-xl transition-all ${
                            confirmDeleteId === order.id
                              ? 'bg-red-500/20 text-red-400 border border-red-500/20'
                              : 'text-slate-500 hover:bg-red-500/10 hover:text-red-500 border border-transparent'
                          }`}
                          title="Delete Order"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Order specification details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#060606] p-4 rounded-2xl border border-white/5 text-xs">
                      <div>
                        <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider block">Artwork Category</span>
                        <p className="font-bold text-slate-200 mt-1">{order.artwork_type}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider block">Portrait Size</span>
                        <p className="font-bold text-slate-200 mt-1">{order.artwork_size}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider block">Shipping Mode</span>
                        <p className="font-bold text-slate-200 mt-1">{order.delivery_preference}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider block font-medium">Committed Date</span>
                        <p className="font-bold text-slate-200 mt-1">
                          {new Date(order.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </p>
                      </div>
                    </div>

                    {/* Shipping Address destination */}
                    <div className="space-y-1 text-xs">
                      <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" /> Shipping Destination
                      </span>
                      <p className="text-slate-350 pl-4.5 leading-relaxed">
                        {order.complete_address}, {order.city}, {order.state} -{' '}
                        <span className="font-bold text-[#D4AF37]">{order.pincode}</span>
                      </p>
                    </div>

                    {/* Special requests comments */}
                    {order.special_instructions && (
                      <div className="bg-[#080808]/75 p-3 rounded-2xl border border-white/5 text-xs">
                        <span className="text-slate-500 font-bold uppercase tracking-wider text-[9px] block mb-1">
                          Client instructions
                        </span>
                        <p className="text-slate-355 italic">"{order.special_instructions}"</p>
                      </div>
                    )}

                    {/* Status modify dropdown triggers */}
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-end justify-between pt-3 border-t border-white/5">
                      <div className="flex flex-wrap gap-3 items-center">
                        <div className="space-y-1">
                          <label className="block text-[8px] font-black uppercase tracking-widest text-slate-500">
                            Commission Status
                          </label>
                          <select
                            value={order.order_status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className="bg-[#060606] border border-white/5 text-slate-200 text-xs font-bold py-2 px-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                          >
                            {STATUS_OPTIONS.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[8px] font-black uppercase tracking-widest text-slate-500">
                            Payment Method
                          </label>
                          <select
                            value={order.payment_method || 'UPI'}
                            onChange={(e) => handlePaymentMethodChange(order.id, e.target.value)}
                            className="bg-[#060606] border border-white/5 text-slate-200 text-xs font-bold py-2 px-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                          >
                            {PAYMENT_METHODS.map((pm) => (
                              <option key={pm} value={pm}>
                                {pm}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[8px] font-black uppercase tracking-widest text-slate-500">
                            Payment Status
                          </label>
                          <select
                            value={order.payment_status || 'pending'}
                            onChange={(e) => handlePaymentStatusChange(order.id, e.target.value)}
                            className="bg-[#060606] border border-white/5 text-slate-250 text-xs font-bold py-2 px-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
                          >
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                          </select>
                        </div>
                      </div>

                      {/* Summary prices */}
                      <div className="text-right border-t md:border-t-0 pt-3 md:pt-0 w-full md:w-auto flex md:flex-col justify-between items-center md:items-end">
                        <span className="text-[10px] text-slate-550 font-bold uppercase tracking-wider">Gross Amount</span>
                        <span className="text-xl font-black text-[#D4AF37]">₹{order.amount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    {/* Internal Notes area */}
                    <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row gap-3 items-end">
                      <div className="flex-1 w-full space-y-1">
                        <label className="block text-[8px] font-black uppercase tracking-widest text-slate-550 flex items-center gap-1">
                          Internal Artist Note (Shared with Customer)
                        </label>
                        <input
                          type="text"
                          value={internalNotes[order.id] || ''}
                          onChange={(e) => handleNoteTextChange(order.id, e.target.value)}
                          placeholder="Add Canvas details or Package Tracking ID..."
                          className="w-full bg-[#060606] border border-white/5 text-white placeholder-slate-700 px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] text-xs"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSaveNote(order.id)}
                        className="bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-slate-950 font-black px-5 py-2.5 rounded-xl text-[10px] uppercase tracking-wider hover:scale-[1.02] transition-transform w-full sm:w-auto shadow-md"
                      >
                        Save Note
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Expanded zoom Image overlay modal */}
      {zoomedImageUrl && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setZoomedImageUrl(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setZoomedImageUrl(null)}
              className="absolute -top-12 right-0 bg-[#060606] border border-white/5 text-white p-2 rounded-full hover:bg-slate-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={zoomedImageUrl}
              alt="Expanded reference scan"
              className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-white/10 shadow-2xl"
            />
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default OrdersScreen;
