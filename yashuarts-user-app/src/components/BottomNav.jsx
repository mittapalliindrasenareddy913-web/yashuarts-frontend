import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Image, ShoppingBag, MessageSquare, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { io } from 'socket.io-client';

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [badge, setBadge] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Load initial unread message badge count
    (async () => {
      try {
        const history = await api.messages.getHistory();
        const lastChatOpen = localStorage.getItem('yashuarts_last_chat_open_time');
        const lastOpenTime = lastChatOpen ? parseInt(lastChatOpen, 10) : 0;
        
        // Filter messages sent by the other party (sender !== current user ID) that are newer than last open time
        const unreadCount = history.filter(
          (msg) => msg.sender_id !== user.id && new Date(msg.created_at).getTime() > lastOpenTime
        ).length;
        
        setBadge(unreadCount);
      } catch (err) {
        console.error('[BottomNav] Failed to load message history for badge count:', err);
      }
    })();

    // Setup Socket connection for real-time notifications
    const backendRootUrl = 'https://yashuarts-backend.onrender.com';
    const socket = io(backendRootUrl, {
      transports: ['websocket', 'polling']
    });

    socket.emit('join', user.id);

    socket.on('new_message', (msg) => {
      if (location.pathname === '/chat') {
        localStorage.setItem('yashuarts_last_chat_open_time', String(Date.now()));
        setBadge(0);
        return;
      }
      if (msg.sender_id !== user.id) {
        setBadge((prev) => prev + 1);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user, location.pathname]);

  useEffect(() => {
    if (location.pathname === '/chat') {
      localStorage.setItem('yashuarts_last_chat_open_time', String(Date.now()));
      setBadge(0);
    }
  }, [location.pathname]);

  const navItems = [
    { label: 'Home', icon: Home, path: '/' },
    { label: 'Gallery', icon: Image, path: '/gallery' },
    { label: 'Orders', icon: ShoppingBag, path: '/my-orders' },
    { label: 'Messages', icon: MessageSquare, path: '/chat', badge },
    { label: 'Profile', icon: User, path: '/profile' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#060606] border-t border-[#D4AF37]/25 px-4 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.8)] h-16 flex items-center justify-around">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;
        
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="relative flex flex-col items-center justify-center py-1 w-12 h-12 transition-transform duration-200 active:scale-90"
          >
            {isActive && (
              <span className="absolute top-0 w-8 h-1 bg-[#D4AF37] rounded-full shadow-[0_0_8px_#D4AF37]" />
            )}
            <Icon
              className={`w-5.5 h-5.5 transition-colors ${
                isActive ? 'text-[#D4AF37]' : 'text-slate-500 hover:text-slate-350'
              }`}
            />
            <span
              className={`text-[9px] font-bold mt-1 tracking-wider uppercase ${
                isActive ? 'text-[#D4AF37]' : 'text-slate-500'
              }`}
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {item.label}
            </span>
            {item.badge > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default BottomNav;
