import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, LogOut, Phone, ShieldCheck, User, Info, ArrowLeft, Search, X } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/BottomNav';

export const AdminSettingsScreen = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeUserDetails, setActiveUserDetails] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const list = await api.users.getAll();
      setUsers(list);
      setFilteredUsers(list);
    } catch (err) {
      console.error('Failed to load CRM user list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(
          (u) =>
            u.full_name?.toLowerCase().includes(query) ||
            u.email?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, users]);

  const selectUser = async (id) => {
    try {
      setLoadingDetails(true);
      const details = await api.users.getDetails(id);
      setActiveUserDetails({
        ...details.user,
        orders: details.orders,
        activities: details.activities,
        reviews: details.reviews
      });
    } catch (err) {
      console.error('Failed to load user profile details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleResetAndShare = async (client) => {
    const tempPassword = 'Yashu@' + Math.floor(1000 + Math.random() * 9000);
    const confirmMessage = `Are you sure you want to reset ${client.full_name || 'Client'}'s password to "${tempPassword}" and share their account details via WhatsApp?`;
    if (!window.confirm(confirmMessage)) {
      return;
    }
    try {
      await api.users.resetPassword(client._id, tempPassword);
      const text = `🎨 *YashuArts Account Recovery*\n\n` +
                   `Hello *${client.full_name || 'Client'}*,\n` +
                   `Here are your requested account login details:\n\n` +
                   `📧 *Email:* ${client.email}\n` +
                   `🔑 *Password:* ${tempPassword}\n` +
                   `📱 *Mobile:* ${client.mobile_number || 'Not provided'}\n\n` +
                   `You can log in now: http://localhost:5173/login`;
      let phone = client.mobile_number || '';
      phone = phone.replace(/\D/g, '');
      if (phone.length === 10) {
        phone = '91' + phone;
      }
      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
      window.open(whatsappUrl, '_blank');
    } catch (err) {
      console.error('Failed to reset and share password:', err);
      alert('Failed to reset password. Please try again.');
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/admin', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#030303] text-slate-100 pb-24 selection:bg-[#D4AF37] selection:text-slate-950">
      {/* Header bar settings panel */}
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
                Enterprise Settings
              </h1>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest" style={{ fontFamily: "'Inter', sans-serif" }}>
                Control & CRM Panel
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-4 py-2 border border-red-500/25 bg-red-500/5 hover:bg-red-500/10 text-red-400 font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>

      {/* Main Settings Panel */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6 animate-scale-up">
        {/* Administrator credentials section */}
        <section className="bg-[#0D0D0D] border border-white/5 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 bottom-0 w-40 h-40 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-xs font-black uppercase text-[#D4AF37] tracking-widest mb-4 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Administrator Credentials
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-[#060606] border border-white/5 p-4 rounded-2xl flex items-center gap-3">
              <div className="p-2 bg-[#D4AF37]/10 text-[#D4AF37] rounded-xl">
                <User className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Full Name</span>
                <p className="font-bold text-sm text-slate-200 truncate">{user?.full_name || 'Admin Manager'}</p>
              </div>
            </div>

            <div className="bg-[#060606] border border-white/5 p-4 rounded-2xl flex items-center gap-3">
              <div className="p-2 bg-[#D4AF37]/10 text-[#D4AF37] rounded-xl">
                <Info className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Email Address</span>
                <p className="font-bold text-sm text-slate-200 truncate">{user?.email || 'admin@yashuarts.com'}</p>
              </div>
            </div>

            <div className="bg-[#060606] border border-white/5 p-4 rounded-2xl flex items-center gap-3">
              <div className="p-2 bg-[#D4AF37]/10 text-[#D4AF37] rounded-xl">
                <Phone className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">System Status</span>
                <p className="font-bold text-sm text-[#D4AF37] truncate">Active Root Owner</p>
              </div>
            </div>
          </div>
        </section>

        {/* CRM directory section */}
        <section className="bg-[#0D0D0D] border border-[#D4AF37]/20 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5" style={{ fontFamily: "'Cinzel', serif" }}>
                <UsersIcon className="w-4.5 h-4.5 text-[#D4AF37]" /> CRM Client Directory
              </h2>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">
                Manage and audit registered customer profiles
              </p>
            </div>
            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-white/5 border border-white/5 text-slate-400 rounded-md">
              {filteredUsers.length} Clients
            </span>
          </div>

          {/* Search bar input */}
          <div className="relative">
            <Search className="absolute left-4 top-3.5 h-4.5 w-4.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clients by name, email..."
              className="w-full bg-[#060606] border border-white/5 text-white placeholder-slate-650 pl-11 pr-5 py-3 rounded-2xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all text-xs shadow-inner"
            />
          </div>

          {/* Users Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="bg-[#060606] border border-white/5 p-4 rounded-2xl animate-pulse flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#161616] rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-[#161616] rounded w-3/4" />
                    <div className="h-3 bg-[#161616] rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-10 bg-[#060606] border border-white/5 rounded-2xl">
              <Info className="w-8 h-8 text-slate-750 mx-auto mb-2" />
              <p className="text-slate-500 text-xs font-semibold">No clients matching search filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredUsers.map((client) => (
                <div
                  key={client._id}
                  onClick={() => selectUser(client._id)}
                  className="bg-[#060606] border border-white/5 hover:border-[#D4AF37]/35 p-4 rounded-2xl flex items-center gap-3.5 cursor-pointer transition-all duration-300 hover:scale-[1.02] shadow-md"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] border border-[#D4AF37]/20 flex-shrink-0 font-bold text-sm">
                    {client.avatar_url ? (
                      <img src={client.avatar_url} alt="client avatar" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      client.full_name?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-xs text-slate-200 truncate">{client.full_name || 'Anonymous User'}</h3>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{client.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* User profile drawer overlay modal */}
      {activeUserDetails && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0D0D0D] border border-[#D4AF37]/35 rounded-[32px] p-6 max-w-md w-full shadow-2xl relative max-h-[85vh] overflow-y-auto animate-scale-up">
            <button
              onClick={() => setActiveUserDetails(null)}
              aria-label="Close client details"
              title="Close client details"
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 border-b border-white/5 pb-4 mb-5">
              <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] border border-[#D4AF37]/20 text-lg font-bold">
                {activeUserDetails.avatar_url ? (
                  <img src={activeUserDetails.avatar_url} alt="client avatar" className="w-full h-full object-cover rounded-full" />
                ) : (
                  activeUserDetails.full_name?.charAt(0).toUpperCase() || 'U'
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-base text-white truncate">{activeUserDetails.full_name || 'Anonymous Client'}</h3>
                <p className="text-xs text-[#D4AF37] truncate mt-0.5">{activeUserDetails.email}</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-[#060606] border border-white/5 p-4 rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-slate-400">
                  <span className="font-semibold">Registered on:</span>
                  <span className="font-mono text-[10px] text-slate-200">
                    {new Date(activeUserDetails.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </span>
                </div>
                {activeUserDetails.mobile_number && (
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="font-semibold">Mobile number:</span>
                    <span className="font-mono text-slate-200">{activeUserDetails.mobile_number}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-slate-400">
                  <span className="font-semibold">Role assignment:</span>
                  <span className="font-black uppercase tracking-wider text-[9px] px-2 py-0.5 bg-white/5 border border-white/5 text-slate-300 rounded">
                    {activeUserDetails.role || 'client'}
                  </span>
                </div>
              </div>

              {/* Reset and Share via WhatsApp Button */}
              <button
                type="button"
                onClick={() => handleResetAndShare(activeUserDetails)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-slate-950 bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-amber-500/10 cursor-pointer text-xs uppercase tracking-wider mb-2"
              >
                <svg className="w-4 h-4 fill-current text-slate-950" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.703 1.456h.004c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413" />
                </svg>
                Reset Password & Share via WhatsApp
              </button>

              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase text-[#D4AF37] tracking-widest flex items-center gap-1">
                  <ClipboardList className="w-3.5 h-3.5" /> Order History Summary
                </h4>
                {activeUserDetails.orders && activeUserDetails.orders.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {activeUserDetails.orders.map((ord) => (
                      <div key={ord._id} className="bg-[#060606] border border-white/5 p-3 rounded-xl flex justify-between items-center">
                        <div>
                          <span className="text-[10px] text-slate-500 font-mono block">#{ord._id.slice(-6)}</span>
                          <span className="font-bold text-slate-250 block">
                            {ord.artwork_type} ({ord.artwork_size})
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-amber-400 font-bold block">₹{ord.amount}</span>
                          <span className="text-[9px] text-slate-400 block uppercase tracking-wider font-semibold">
                            {ord.order_status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#060606]/60 border border-white/5 p-4 rounded-xl text-center">
                    <Info className="w-5 h-5 text-slate-600 mx-auto mb-1" />
                    <p className="text-slate-500 text-[10px]">This client hasn't placed any commissions yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

// SVG component replacement for User group icon
const UsersIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export default AdminSettingsScreen;
