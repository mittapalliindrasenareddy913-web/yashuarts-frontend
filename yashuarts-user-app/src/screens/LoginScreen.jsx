import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Loader2, KeyRound, Palette, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export const LoginScreen = () => {
  const navigate = useNavigate();
  const { signIn, updateUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');
  
  // Auth view mode: 'login' | 'forgot' | 'verify' | 'reset' | 'force-reset'
  const [mode, setMode] = useState('login');
  
  // Forgot / Reset states
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [countdown, setCountdown] = useState(0);
  
  // Notification Toast state
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const showToast = (message, type) => {
    setToast({ message, type });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorText('');
    setSuccessText('');
    setToast(null);

    if (!email.trim() || !password.trim()) {
      const msg = 'Please enter both email and password.';
      setErrorText(msg);
      showToast(msg, 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await signIn(email, password);
      if (res.error) {
        setErrorText(res.error.message);
        showToast(res.error.message, 'error');
        setLoading(false);
      } else if (res.mustChangePassword) {
        setLoading(false);
        setSuccessText('Please update your password to proceed.');
        showToast('First-time login: Password change required.', 'info');
        setMode('force-reset');
      } else {
        setSuccessText('Logged in successfully!');
        showToast('Welcome to YashuArts!', 'success');
        setTimeout(() => {
          setLoading(false);
          navigate('/');
        }, 1500);
      }
    } catch (err) {
      const msg = err.message || 'An unexpected error occurred during login.';
      setErrorText(msg);
      showToast(msg, 'error');
      setLoading(false);
    }
  };

  const handleForceResetSubmit = async (e) => {
    e.preventDefault();
    setErrorText('');
    setSuccessText('');
    setToast(null);

    if (!newPassword.trim() || !confirmPassword.trim()) {
      const msg = 'Please enter both password fields.';
      setErrorText(msg);
      showToast(msg, 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      const msg = 'New passwords do not match.';
      setErrorText(msg);
      showToast(msg, 'error');
      return;
    }

    if (newPassword === password) {
      const msg = 'New password must be different from the temporary password.';
      setErrorText(msg);
      showToast(msg, 'error');
      return;
    }

    setLoading(true);
    try {
      await api.auth.updateProfile({ password: newPassword });
      updateUser({ mustChangePassword: false });
      setSuccessText('Password updated successfully!');
      showToast('Password changed! Logging in...', 'success');
      setTimeout(() => {
        setLoading(false);
        navigate('/');
      }, 1500);
    } catch (err) {
      const msg = err.message || 'Failed to update password. Please try again.';
      setErrorText(msg);
      showToast(msg, 'error');
      setLoading(false);
    }
  };

  const handleWhatsAppForgotRequest = (e) => {
    if (e) e.preventDefault();
    setErrorText('');
    setSuccessText('');
    setToast(null);

    if (!email.trim()) {
      const msg = 'Please enter your registered email address.';
      setErrorText(msg);
      showToast(msg, 'error');
      return;
    }

    const adminPhone = '919398029785';
    const text = `This is my email: ${email}. My password is forget pls give my details`;
    const whatsappUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(text)}`;
    
    window.open(whatsappUrl, '_blank');
    setSuccessText('Redirecting to WhatsApp to contact Admin...');
    showToast('Redirecting to WhatsApp to send request to admin.', 'success');
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorText('');
    setSuccessText('');
    setToast(null);

    if (!otpCode.trim()) {
      const msg = 'Please enter the 6-digit OTP code.';
      setErrorText(msg);
      showToast(msg, 'error');
      return;
    }

    setLoading(true);
    try {
      await api.auth.verifyOtp(email, otpCode);
      setSuccessText('OTP verified successfully!');
      showToast('OTP verified. You can now reset your password.', 'success');
      setMode('reset');
      setLoading(false);
    } catch (err) {
      const msg = err.message || 'Invalid or expired OTP code.';
      setErrorText(msg);
      showToast(msg, 'error');
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorText('');
    setSuccessText('');
    setToast(null);

    if (!newPassword.trim()) {
      const msg = 'Please enter your new password.';
      setErrorText(msg);
      showToast(msg, 'error');
      return;
    }

    if (newPassword.length < 6) {
      const msg = 'Password must be at least 6 characters.';
      setErrorText(msg);
      showToast(msg, 'error');
      return;
    }

    setLoading(true);
    try {
      await api.auth.resetPassword(email, otpCode, newPassword);
      setSuccessText('Password reset successfully. You can now login.');
      showToast('Your password was updated. Please sign in.', 'success');
      setPassword(newPassword);
      setOtpCode('');
      setMode('login');
      setLoading(false);
    } catch (err) {
      const msg = err.message || 'Failed to reset password. Check if OTP is correct.';
      setErrorText(msg);
      showToast(msg, 'error');
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
              <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
            )}
            <div className="flex-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                {toast.type === 'success' ? 'Success' : 'Notification'}
              </h4>
              <p className="text-xs text-slate-400 mt-1">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="text-slate-500 hover:text-slate-300 text-xs font-bold px-1">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Form Box */}
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
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                {mode === 'login' && 'Luxury Digital Art Gallery'}
                {mode === 'forgot' && 'Request Password OTP'}
                {mode === 'verify' && 'Verify OTP Code'}
                {mode === 'reset' && 'Reset Secure Password'}
              </p>
            </div>
          </div>

          {/* Form Status Messages */}
          {errorText && (
            <div className="bg-red-500/5 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-xs leading-relaxed text-center relative z-10">
              {errorText}
            </div>
          )}
          {successText && (
            <div className="bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-xs leading-relaxed text-center relative z-10">
              {successText}
            </div>
          )}

          {/* MODE 1: LOGIN */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-5 relative z-10">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Email Address</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-slate-950/60 border border-white/10 text-white placeholder-slate-700 pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] text-xs sm:text-sm transition-all"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorText('');
                      setSuccessText('');
                      setMode('forgot');
                    }}
                    className="text-[10px] text-[#D4AF37] hover:text-[#F3E5AB] font-bold uppercase tracking-wider hover:underline transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-slate-950/60 border border-white/10 text-white placeholder-slate-700 pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] text-xs sm:text-sm transition-all"
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
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>
          )}

          {/* MODE 2: FORGOT PASSWORD */}
          {mode === 'forgot' && (
            <form onSubmit={handleWhatsAppForgotRequest} className="space-y-5 relative z-10">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Registered Email Address</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-slate-950/60 border border-white/10 text-white placeholder-slate-700 pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] text-xs sm:text-sm transition-all"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-slate-950 py-4 rounded-xl font-extrabold uppercase tracking-wider text-xs transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-amber-500/10 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Request Recovery via WhatsApp</span>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setErrorText('');
                  setSuccessText('');
                  setMode('login');
                }}
                className="w-full bg-transparent border border-white/10 hover:border-white/20 text-slate-400 py-3 rounded-xl font-extrabold uppercase tracking-wider text-[10px] transition-colors"
              >
                Back to Login
              </button>
            </form>
          )}

          {/* MODE 5: FORCE PASSWORD RESET */}
          {mode === 'force-reset' && (
            <form onSubmit={handleForceResetSubmit} className="space-y-5 relative z-10">
              <div className="space-y-1 bg-[#121212]/85 border border-[#D4AF37]/35 p-4 rounded-2xl mb-4 text-center">
                <p className="text-xs text-[#D4AF37] font-black uppercase tracking-wider">Password Reset Required</p>
                <p className="text-[10px] text-slate-400 leading-relaxed mt-1">
                  You are logged in with a temporary password. Please set a new secure password to proceed.
                </p>
              </div>

              {/* Temporary Password */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Temporary Password</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={password}
                    readOnly
                    className="w-full bg-slate-950/20 border border-white/5 text-slate-500 pl-11 pr-4 py-3 rounded-xl focus:outline-none text-xs sm:text-sm font-mono cursor-not-allowed"
                  />
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">New Password</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <Lock className="w-4 h-4 text-[#D4AF37]" />
                  </span>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full bg-slate-950/60 border border-white/10 text-white placeholder-slate-700 pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] text-xs sm:text-sm transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Confirm New Password</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <Lock className="w-4 h-4 text-[#D4AF37]" />
                  </span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full bg-slate-950/60 border border-white/10 text-white placeholder-slate-700 pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] text-xs sm:text-sm transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-slate-950 py-4 rounded-xl font-extrabold uppercase tracking-wider text-xs transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-amber-500/10 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <span>Update Password</span>
                )}
              </button>
            </form>
          )}

          {/* MODE 3: VERIFY OTP */}
          {mode === 'verify' && (
            <form onSubmit={handleVerifyOtp} className="space-y-5 relative z-10">
              <div className="text-center text-xs text-slate-400 bg-slate-950/40 p-3 rounded-xl border border-white/5 space-y-1">
                <p>An OTP code has been dispatched to:</p>
                <p className="font-bold text-white tracking-wide">{email}</p>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-[10px] text-[#D4AF37] hover:text-[#F3E5AB] hover:underline uppercase tracking-wider font-extrabold block mx-auto mt-1"
                >
                  Change Email
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">6-Digit OTP Code</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <KeyRound className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    required
                    className="w-full bg-slate-950/60 border border-white/10 text-white placeholder-slate-700 pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] text-xs sm:text-sm tracking-[0.25em] text-center font-bold"
                    placeholder="000000"
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
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Verify OTP</span>
                )}
              </button>

              <button
                type="button"
                disabled={countdown > 0 || loading}
                onClick={handleSendOtp}
                className="w-full bg-transparent border border-white/10 hover:border-white/20 text-slate-400 py-3 rounded-xl font-extrabold uppercase tracking-wider text-[10px] transition-colors disabled:opacity-50"
              >
                {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
              </button>
            </form>
          )}

          {/* MODE 4: RESET PASSWORD */}
          {mode === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-5 relative z-10">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  New Password (Min. 6 chars)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full bg-slate-950/60 border border-white/10 text-white placeholder-slate-700 pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] text-xs sm:text-sm transition-all"
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
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <span>Confirm New Password</span>
                )}
              </button>
            </form>
          )}

          {/* Link to Signup */}
          <p className="mt-6 text-center text-xs text-slate-400 relative z-10">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[#D4AF37] hover:text-[#F3E5AB] font-semibold transition-colors">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
