import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ChevronRight, Headphones, LogOut, ShieldCheck, Mail, Phone, Calendar, Check, AlertTriangle, RefreshCw, ShoppingBag, User } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/BottomNav';

export const UserProfileScreen = () => {
  const { user, signOut, updateUser } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form states
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Alert & Confirmation states
  const [alert, setAlert] = useState(null); // { message, type: 'success' | 'error' }
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  const loadProfile = async () => {
    const cachedData = localStorage.getItem('yashuarts_cached_profile_data');
    let hasLoadedCached = false;
    
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        if (parsed) {
          setProfileData(parsed);
          setFullName(parsed.full_name || '');
          setMobileNumber(parsed.mobile_number || parsed.phone || '');
          setEmail(parsed.email || '');
          setAvatarUrl(parsed.avatar_url || parsed.profileImage || '');
          setLoading(false);
          hasLoadedCached = true;
        }
      } catch (e) {
        console.error('Failed to parse cached profile data:', e);
      }
    }

    try {
      if (!hasLoadedCached) setLoading(true);
      const data = await api.profile.get();
      const userProfile = data?.user || data;
      
      localStorage.setItem('yashuarts_cached_profile_data', JSON.stringify(userProfile));
      setProfileData(userProfile);
      setFullName(userProfile.full_name || '');
      setMobileNumber(userProfile.mobile_number || userProfile.phone || '');
      setEmail(userProfile.email || '');
      setAvatarUrl(userProfile.avatar_url || userProfile.profileImage || '');
    } catch (err) {
      console.error('Error loading profile:', err);
      if (!hasLoadedCached) {
        showAlert('Unable to load profile details.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message, type) => {
    setAlert({ message, type });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showAlert('Image size must be less than 5MB', 'error');
        return;
      }
      setSelectedFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = async () => {
    if (!fullName.trim() || !email.trim()) {
      showAlert('Name and email are required', 'error');
      return;
    }

    setSaving(true);
    try {
      let finalAvatarUrl = profileData?.avatar_url || profileData?.profileImage || '';
      
      if (selectedFile) {
        const uploadRes = await api.profile.uploadPhoto(selectedFile);
        const updatedUser = uploadRes?.user || uploadRes;
        finalAvatarUrl = updatedUser?.avatar_url || updatedUser?.profileImage || '';
        setProfileData(updatedUser);
        localStorage.setItem('yashuarts_cached_profile_data', JSON.stringify(updatedUser));
      }

      const updates = {};
      if (fullName !== profileData?.full_name) {
        updates.full_name = fullName;
      }
      if (mobileNumber !== (profileData?.mobile_number || profileData?.phone)) {
        updates.mobile_number = mobileNumber;
      }
      if (email !== profileData?.email) {
        updates.email = email;
      }

      if (Object.keys(updates).length > 0) {
        const updateRes = await api.profile.update(updates);
        const updatedUser = updateRes?.user || updateRes;
        setProfileData(updatedUser);
        localStorage.setItem('yashuarts_cached_profile_data', JSON.stringify(updatedUser));
        
        updateUser({
          full_name: updatedUser.full_name,
          mobile_number: updatedUser.mobile_number || updatedUser.phone,
          email: updatedUser.email,
          avatar_url: updatedUser.avatar_url || updatedUser.profileImage
        });
      } else if (selectedFile) {
        const mockUpdatedUser = { ...profileData, avatar_url: finalAvatarUrl };
        setProfileData(mockUpdatedUser);
        localStorage.setItem('yashuarts_cached_profile_data', JSON.stringify(mockUpdatedUser));
        updateUser({ avatar_url: finalAvatarUrl });
      }

      showAlert('Profile updated successfully.', 'success');
      setIsEditing(false);
      setSelectedFile(null);
    } catch (err) {
      console.error('Error saving profile:', err);
      showAlert('Unable to save profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSelectedFile(null);
    setFullName(profileData?.full_name || '');
    setMobileNumber(profileData?.mobile_number || '');
    setEmail(profileData?.email || '');
    setAvatarUrl(profileData?.avatar_url || '');
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-[#D4AF37] animate-spin" />
      </div>
    );
  }

  const memberSinceStr = profileData?.member_since
    ? new Date(profileData.member_since).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'New';

  return (
    <div className="min-h-screen bg-[#030303] text-slate-100 pb-24 selection:bg-[#D4AF37] selection:text-slate-950">
      
      {/* Alert Banner */}
      {alert && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm animate-slide-in">
          <div className={`p-4 rounded-2xl border backdrop-blur-md flex items-center gap-3 shadow-2xl ${
            alert.type === 'success' ? 'bg-[#121212]/90 border-emerald-500/20 text-emerald-400' : 'bg-[#121212]/90 border-red-500/20 text-red-400'
          }`}>
            {alert.type === 'success' ? <Check className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            <p className="text-sm font-semibold">{alert.message}</p>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#0D0D0D] border border-[#D4AF37]/30 rounded-[28px] p-6 max-w-sm w-full shadow-2xl text-center animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Cinzel', serif" }}>
              Logout
            </h2>
            <p className="text-slate-400 mb-6 text-xs sm:text-sm">
              Are you sure you want to logout from YashuArts?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
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
      <header className="sticky top-0 z-40 bg-[#060606]/95 border-b border-[#D4AF37]/15 px-4 h-16 flex items-center justify-between backdrop-blur-xl">
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
          <h1 className="text-lg font-black tracking-[0.12em] text-[#D4AF37] uppercase" style={{ fontFamily: "'Cinzel', serif" }}>
            {isEditing ? 'Edit Profile' : 'My Profile'}
          </h1>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider px-3.5 py-2 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 hover:bg-[#D4AF37]/20 transition-all duration-300"
          >
            Edit
          </button>
        )}
      </header>

      {/* Main Profile Info */}
      <main className="p-4 space-y-6 max-w-lg mx-auto">
        <div className="bg-[#0D0D0D] border border-[#D4AF37]/25 rounded-[28px] p-6 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 blur-3xl rounded-full translate-x-10 -translate-y-10" />
          <div className="flex flex-col items-center relative z-10">
            <div className="relative mb-4">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#D4AF37]/30 bg-slate-950 flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-slate-500" />
                )}
              </div>
              {isEditing && (
                <label className="absolute bottom-0 right-0 p-2 bg-[#D4AF37] text-slate-950 rounded-full cursor-pointer hover:bg-[#F3E5AB] transition-colors shadow-lg shadow-amber-500/20">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={handleFileChange}
                  />
                </label>
              )}
            </div>

            {!isEditing && (
              <div className="text-center">
                <h2 className="text-xl font-bold text-white mb-1 flex items-center justify-center gap-2" style={{ fontFamily: "'Cinzel', serif" }}>
                  {profileData?.full_name || 'Art Enthusiast'}
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </h2>
                <p className="text-xs text-slate-400 mb-3">{profileData?.email}</p>
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase text-[#D4AF37] tracking-widest">
                  Gold Member
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Profile Details (Editing vs Static) */}
        {isEditing ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="bg-[#0D0D0D] border border-white/5 rounded-[24px] p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#030303] border border-white/10 text-white rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Mobile Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="w-full bg-[#030303] border border-white/10 text-white rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#030303] border border-white/10 text-white rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCancelEdit}
                disabled={saving}
                className="flex-1 py-3.5 rounded-xl font-bold text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChanges}
                disabled={saving}
                className="flex-[2] py-3.5 rounded-xl font-black text-slate-950 bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-300">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-[#0D0D0D] border border-white/5 rounded-2xl p-4 flex flex-col justify-center items-center text-center shadow-lg">
                <ShoppingBag className="w-5 h-5 text-[#D4AF37] mb-1" />
                <span className="text-xl font-bold text-white">{profileData?.total_orders || 0}</span>
                <span className="text-[8px] font-bold uppercase tracking-wider text-slate-500">Orders</span>
              </div>
              <div className="bg-[#0D0D0D] border border-white/5 rounded-2xl p-4 flex flex-col justify-center items-center text-center shadow-lg">
                <Check className="w-5 h-5 text-emerald-400 mb-1" />
                <span className="text-xl font-bold text-white">{profileData?.completed_orders || 0}</span>
                <span className="text-[8px] font-bold uppercase tracking-wider text-slate-500">Completed</span>
              </div>
              <div className="bg-[#0D0D0D] border border-white/5 rounded-2xl p-4 flex flex-col justify-center items-center text-center shadow-lg">
                <Calendar className="w-5 h-5 text-blue-400 mb-1" />
                <span className="text-[10px] font-bold text-white leading-tight mt-1 truncate max-w-full">
                  {memberSinceStr}
                </span>
                <span className="text-[8px] font-bold uppercase tracking-wider text-slate-500">Since</span>
              </div>
            </div>

            {/* Account Information Card */}
            <div className="bg-[#0D0D0D] border border-white/5 rounded-[24px] p-2">
              <div className="flex items-center gap-4 p-4 border-b border-white/5">
                <Phone className="w-5 h-5 text-slate-500" />
                <div className="flex-1">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Mobile Number</p>
                  <p className="text-sm font-medium text-slate-200">{profileData?.mobile_number || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4">
                <Mail className="w-5 h-5 text-slate-500" />
                <div className="flex-1">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Email Address</p>
                  <p className="text-sm font-medium text-slate-200 truncate">{profileData?.email}</p>
                </div>
              </div>
            </div>

            {/* Navigation Options */}
            <div className="bg-[#0D0D0D] border border-white/5 rounded-[24px] p-2">
              <button
                onClick={() => navigate('/my-orders')}
                className="w-full flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <ShoppingBag className="w-4.5 h-4.5 text-[#D4AF37]" />
                </div>
                <span className="flex-1 font-semibold text-slate-200 text-sm">My Orders</span>
                <ChevronRight className="w-5 h-5 text-slate-500" />
              </button>
              <button
                onClick={() => navigate('/chat')}
                className="w-full flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Headphones className="w-4.5 h-4.5 text-emerald-500" />
                </div>
                <span className="flex-1 font-semibold text-slate-200 text-sm">Support & Chat</span>
                <ChevronRight className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full flex items-center justify-center gap-2.5 p-4 mt-6 rounded-[20px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all duration-300"
            >
              <LogOut className="w-4.5 h-4.5" />
              Logout from Device
            </button>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default UserProfileScreen;
