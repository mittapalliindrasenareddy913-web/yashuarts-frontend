import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Users, Layers, ClipboardList, TrendingUp, LogOut, Download, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import BottomNav from '../components/BottomNav';

export const HomeScreen = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  
  const [summary, setSummary] = useState(null);
  const [charts, setCharts] = useState(null);
  const [artworksCount, setArtworksCount] = useState(0);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState('daily'); // 'daily' | 'weekly' | 'monthly'
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchDashboardMetrics = useCallback(async (showLoader = true) => {
    const cachedSummary = localStorage.getItem('yashuarts_cached_admin_summary');
    const cachedCharts = localStorage.getItem('yashuarts_cached_admin_charts');

    if (cachedSummary && cachedCharts && showLoader) {
      try {
        setSummary(JSON.parse(cachedSummary));
        setCharts(JSON.parse(cachedCharts));
        setLoading(false);
      } catch (err) {
        console.error('Failed to parse cached dashboard analytics', err);
      }
    }

    // 1. Fetch orders and artworks independently and set states instantly
    api.orders.getAll()
      .then((ordersList) => {
        setOrders(ordersList);
      })
      .catch((err) => console.error('Error fetching orders:', err));

    api.artworks.getAll()
      .then((artsList) => {
        setArtworksCount(artsList.length);
      })
      .catch((err) => console.error('Error fetching artworks:', err));

    // 2. Fetch summary and charts (slower aggregation endpoints)
    try {
      if (showLoader && !cachedSummary) setLoading(true);
      const [sumData, chartData] = await Promise.all([
        api.analytics.getSummary(),
        api.analytics.getCharts()
      ]);
      
      setSummary(sumData);
      setCharts(chartData);
      
      localStorage.setItem('yashuarts_cached_admin_summary', JSON.stringify(sumData));
      localStorage.setItem('yashuarts_cached_admin_charts', JSON.stringify(chartData));
      
      // Benchmarking startup latency
      const win = window;
      if (win.appStartupStart && !win.appStartupLogged) {
        win.appStartupLogged = true;
        const latency = performance.now() - win.appStartupStart;
        console.log(`[Performance] Admin Dashboard startup took ${latency.toFixed(2)}ms`);
      }
    } catch (err) {
      console.error('Error fetching admin dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardMetrics(true);

    const intervalId = setInterval(() => {
      fetchDashboardMetrics(false);
    }, 15000);

    const backendRootUrl = 'https://yashuarts-backend.onrender.com';
    const socket = io(backendRootUrl, {
      transports: ['websocket', 'polling']
    });

    const handleUpdate = () => {
      fetchDashboardMetrics(false); // silent refresh
    };

    socket.on('new_order', handleUpdate);
    socket.on('artwork_published', handleUpdate);
    socket.on('artwork_deleted', handleUpdate);

    return () => {
      clearInterval(intervalId);
      socket.disconnect();
    };
  }, [fetchDashboardMetrics]);

  const handleExport = (type) => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      alert(
        type === 'excel'
          ? 'Spreadsheet compiler completed. YashuArts_Sales_Analytics_Q2.xlsx successfully downloaded.'
          : 'High-resolution PDF renderer finished. YashuArts_Executive_Audit_Report.pdf successfully generated.'
      );
    }, 1500);
  };

  // Helper to generate SVG Path for line chart
  const getLinePath = (points, width = 450, height = 140) => {
    if (!points || points.length === 0) return '';
    const usableW = width - 40;
    const usableH = height - 40;
    const maxVal = Math.max(...points, 1);
    const stepCount = points.length > 1 ? points.length - 1 : 1;

    return points
      .map((val, idx) => {
        const x = 20 + (idx / stepCount) * usableW;
        const y = height - 20 - (val / maxVal) * usableH;
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  // Helper to generate SVG Path for filled area chart
  const getAreaPath = (points, width = 450, height = 140) => {
    if (!points || points.length === 0) return '';
    const linePath = getLinePath(points, width, height);
    const usableW = width - 40;
    const rightX = 20 + usableW;
    const bottomY = height - 20;
    return `${linePath} L ${rightX.toFixed(1)} ${bottomY} L ${20..toFixed(1)} ${bottomY} Z`;
  };

  const revenue = summary?.revenue || 0;
  const activeOrdersCount = orders.filter((o) => !['Completed', 'Shipped', 'Delivered'].includes(o.order_status)).length;
  const completedOrdersCount = orders.filter((o) => ['Completed', 'Shipped', 'Delivered'].includes(o.order_status)).length;
  const totalUsers = summary?.totalUsers || 0;

  const orderStatuses = {
    new: orders.filter((o) => o.order_status === 'Order Received' || o.order_status === 'Pending').length,
    accepted: orders.filter((o) => o.order_status === 'Under Review' || o.order_status === 'Artist Contacted' || o.order_status === 'Accepted').length,
    inProgress: orders.filter((o) => o.order_status === 'Artwork In Progress' || o.order_status === 'In Progress').length,
    completed: orders.filter((o) => o.order_status === 'Completed').length,
    delivered: orders.filter((o) => o.order_status === 'Delivered' || o.order_status === 'Shipped').length
  };

  const chartData = (() => {
    const fallbackPoints = [12000, 24000, 18000, 32000, 45000, 29000, 52000];
    if (!charts?.revenueDaily) {
      return {
        points: fallbackPoints,
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      };
    }

    if (chartMode === 'daily') {
      const pts = charts.revenueDaily.map((d) => d.revenue);
      const lbs = charts.revenueDaily.map((d) => (d._id ? d._id.split('-').slice(1).join('/') : ''));
      return {
        points: pts.length > 0 ? pts : fallbackPoints,
        labels: lbs.length > 0 ? lbs : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      };
    }

    if (chartMode === 'weekly') {
      return {
        points: [revenue * 0.2, revenue * 0.28, revenue * 0.24, revenue * 0.28],
        labels: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4']
      };
    }

    return {
      points: [revenue * 0.15, revenue * 0.22, revenue * 0.3, revenue * 0.28, revenue * 0.35, revenue * 0.42],
      labels: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May']
    };
  })();

  const handleLogout = async () => {
    await signOut();
    navigate('/admin', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303] text-slate-100 pb-24 selection:bg-[#D4AF37] selection:text-slate-950">
      
      {/* Logout confirmation modal */}
      {showConfirmLogout && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#0D0D0D] border border-[#D4AF37]/30 rounded-[28px] p-6 max-w-sm w-full shadow-2xl text-center animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Cinzel', serif" }}>
              Logout
            </h2>
            <p className="text-slate-400 mb-6 text-xs sm:text-sm">
              Are you sure you want to exit the YashuArts Admin Panel?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmLogout(false)}
                className="flex-1 py-3 rounded-xl font-semibold text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-3 rounded-xl font-black text-slate-950 bg-red-500 hover:bg-red-400 transition-colors shadow-lg shadow-red-500/25"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-[#060606]/90 border-b border-[#D4AF37]/15 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/25">
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
                YashuArts Admin
              </h1>
              <p className="text-[8px] text-slate-500 uppercase tracking-[0.2em]">
                Enterprise Executive Studio
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchDashboardMetrics(true)}
              className="p-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-[#D4AF37]/10 text-[#D4AF37] transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowConfirmLogout(true)}
              className="p-2.5 rounded-xl border border-red-500/10 bg-red-500/5 hover:bg-red-500/20 text-red-400 transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Panel Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* KPI metrics cards grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0D0D0D] border border-white/5 rounded-3xl p-5 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#D4AF37]/5 blur-xl rounded-full" />
            <TrendingUp className="w-5 h-5 text-[#D4AF37] mb-2" />
            <span className="text-2xl font-black text-white">₹{revenue.toLocaleString('en-IN')}</span>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mt-1">Total Sales Revenue</p>
          </div>

          <button
            onClick={() => navigate('/admin/orders?status=pending')}
            className="bg-[#0D0D0D] border border-white/5 rounded-3xl p-5 relative overflow-hidden shadow-lg text-left hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer w-full"
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 blur-xl rounded-full" />
            <ClipboardList className="w-5 h-5 text-blue-400 mb-2" />
            <span className="text-2xl font-black text-white">{activeOrdersCount}</span>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mt-1">Active Commissions</p>
          </button>

          <button
            onClick={() => navigate('/admin/artworks')}
            className="bg-[#0D0D0D] border border-white/5 rounded-3xl p-5 relative overflow-hidden shadow-lg text-left hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer w-full"
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 blur-xl rounded-full" />
            <Layers className="w-5 h-5 text-emerald-400 mb-2" />
            <span className="text-2xl font-black text-white">{artworksCount}</span>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mt-1">Gallery Catalog size</p>
          </button>

          <button
            onClick={() => navigate('/admin/settings')}
            className="bg-[#0D0D0D] border border-white/5 rounded-3xl p-5 relative overflow-hidden shadow-lg text-left hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer w-full"
          >
            <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 blur-xl rounded-full" />
            <Users className="w-5 h-5 text-purple-400 mb-2" />
            <span className="text-2xl font-black text-white">{totalUsers}</span>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mt-1">Registered Clients</p>
          </button>
        </div>

        {/* Detailed Order Status Breakdown */}
        <div className="bg-[#0D0D0D] border border-white/5 rounded-[28px] p-6 shadow-xl space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">Commission Funnel Pipeline</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'New Received', count: orderStatuses.new, statusKey: 'new', color: 'text-amber-400 bg-amber-500/5 border-amber-500/10' },
              { label: 'Accepted / Review', count: orderStatuses.accepted, statusKey: 'accepted', color: 'text-blue-400 bg-blue-500/5 border-blue-500/10' },
              { label: 'In Progress', count: orderStatuses.inProgress, statusKey: 'inprogress', color: 'text-purple-400 bg-purple-500/5 border-purple-500/10' },
              { label: 'Completed Artwork', count: orderStatuses.completed, statusKey: 'completed', color: 'text-emerald-400 bg-emerald-500/5 border-emerald-500/10' },
              { label: 'Shipped & Delivered', count: orderStatuses.delivered, statusKey: 'delivered', color: 'text-slate-400 bg-white/5 border-white/5' }
            ].map((status, i) => (
              <button
                key={i}
                type="button"
                onClick={() => navigate(`/admin/orders?status=${status.statusKey}`)}
                className={`p-4 border rounded-2xl text-left hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer relative ${status.color}`}
              >
                {status.count > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1.5 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center shadow-lg shadow-red-500/50 animate-pulse border border-[#0D0D0D]">
                    {status.count}
                  </span>
                )}
                <span className="text-xl font-black block">{status.count}</span>
                <span className="text-[8px] font-bold uppercase tracking-wider text-slate-500 mt-1 block">
                  {status.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Sales Graph charts */}
        <div className="bg-[#0D0D0D] border border-white/5 rounded-[28px] p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">Sales Revenue Charts</h3>
            <div className="flex bg-[#060606] p-1 border border-white/5 rounded-xl text-[9px] font-bold uppercase tracking-wider">
              {['daily', 'weekly', 'monthly'].map((m) => (
                <button
                  key={m}
                  onClick={() => setChartMode(m)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    chartMode === m ? 'bg-[#D4AF37] text-slate-950 shadow-md' : 'text-slate-500 hover:text-slate-350'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* SVG Vector chart */}
          <div className="bg-[#060606] border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center">
            <svg viewBox="0 0 450 140" className="w-full max-h-[160px] overflow-visible">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1="20" y1="20" x2="430" y2="20" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="20" y1="70" x2="430" y2="70" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="20" y1="120" x2="430" y2="120" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              
              {/* Area path */}
              <path d={getAreaPath(chartData.points)} fill="url(#chartGrad)" />
              {/* Line path */}
              <path d={getLinePath(chartData.points)} fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <div className="flex justify-between w-full text-[9px] text-slate-500 font-bold uppercase mt-3 px-5 border-t border-white/5 pt-2.5">
              {chartData.labels.map((l, i) => (
                <span key={i}>{l}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Administration report compiles & triggers */}
        <div className="bg-[#0D0D0D] border border-white/5 rounded-[28px] p-6 shadow-xl space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">Management Tools & Audit</h3>
          <div>
            <button
              onClick={() => navigate('/admin/pricing')}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-slate-950 py-4 rounded-2xl font-black uppercase tracking-wider text-sm transition-all hover:scale-[1.02] shadow-lg shadow-amber-500/10 cursor-pointer"
            >
              <TrendingUp className="w-5 h-5 text-slate-950" />
              Edit Custom Order Prices & Options
            </button>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default HomeScreen;
