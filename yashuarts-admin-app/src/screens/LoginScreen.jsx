import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader2, Palette, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginScreen = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorText('');
    setSuccessText('');
    setToast(null);

    if (!email.trim() || !password.trim()) {
      const msg = 'Please enter both email and password.';
      setErrorText(msg);
      setToast({ message: msg, type: 'error' });
      return;
    }

    setLoading(true);
    try {
      console.log(`Admin attempting login: ${email}`);
      const res = await signIn(email, password);
      
      if (res.error) {
        console.error('Admin login error details:', res.error);
        setErrorText(res.error.message);
        setToast({ message: res.error.message, type: 'error' });
        setLoading(false);
      } else {
        // Validate admin access email
        const userEmail = res.user?.email || email;
        if (userEmail !== 'yasaswinilalli@gmail.com') {
          const unauthorizedMsg = 'Access Denied. You do not have administrator permissions.';
          setErrorText(unauthorizedMsg);
          setToast({ message: unauthorizedMsg, type: 'error' });
          setLoading(false);
          return;
        }

        console.log('Admin login successful! Access granted.');
        setSuccessText('Authorizing Secure Access...');
        setToast({ message: 'Welcome back, Admin!', type: 'success' });
        
        setTimeout(() => {
          setLoading(false);
          navigate('/admin/dashboard', { replace: true });
        }, 1200);
      }
    } catch (err) {
      console.error('Admin login error:', err);
      const msg = err.message || 'An unexpected error occurred during admin login.';
      setErrorText(msg);
      setToast({ message: msg, type: 'error' });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0B0B0B] via-[#121212] to-black text-slate-100 flex items-center justify-center p-4 selection:bg-amber-500 selection:text-slate-950">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 max-w-sm w-full animate-slide-in">
          <div className={`p-4 rounded-2xl border backdrop-blur-md flex items-start gap-3 shadow-2xl ${
            toast.type === 'success' ? 'bg-[#121212]/90 border-emerald-500/20 text-emerald-400' : 'bg-[#121212]/90 border-red-500/20 text-red-400'
          }`}>
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
            ) : (
              <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0" />
            )}
            <div className="flex-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                {toast.type === 'success' ? 'Success' : 'Access Alert'}
              </h4>
              <p className="text-xs text-slate-400 mt-1">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="text-slate-500 hover:text-slate-300 text-xs font-bold px-1">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Login Box */}
      <div className="w-full max-w-md space-y-4">
        <div className="bg-[#161616]/70 border border-white/5 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] rounded-full bg-radial-glow opacity-10 pointer-events-none" />
          
          {/* Logo & Headline */}
          <div className="flex flex-col items-center text-center space-y-3 relative z-10">
            <div className="relative">
              <div className="absolute inset-0 bg-[#D4AF37]/20 blur-xl rounded-full scale-125 animate-pulse" />
              <div className="bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] p-4 rounded-2xl relative z-10 shadow-lg shadow-amber-500/10">
                <Palette className="w-8 h-8 text-slate-950" />
              </div>
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-black uppercase tracking-wider text-white" style={{ fontFamily: "'Cinzel', serif" }}>
                YashuArts
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" /> Secure Artist Portal
              </p>
            </div>
          </div>

          {/* Form Status Messages */}
          {errorText && (
            <div className="bg-red-500/5 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-xs leading-relaxed text-center relative z-10 font-medium">
              {errorText}
            </div>
          )}
          {successText && (
            <div className="bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-xs leading-relaxed text-center relative z-10">
              {successText}
            </div>
          )}

          {/* Form Fields */}
          <form onSubmit={handleLoginSubmit} className="space-y-5 relative z-10">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Admin Email</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full bg-slate-950/60 border border-white/10 text-white placeholder-slate-750 pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] text-xs sm:text-sm transition-all"
                  placeholder="admin@yashuarts.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Admin Password</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full bg-slate-950/60 border border-white/10 text-white placeholder-slate-750 pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] text-xs sm:text-sm transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-slate-950 py-4 rounded-xl font-extrabold uppercase tracking-wider text-xs transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-amber-500/10 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authorizing Portal...</span>
                </>
              ) : (
                <span>Access Dashboard</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
