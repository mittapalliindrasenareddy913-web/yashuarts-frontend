import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Palette, ClipboardList, MessageSquare, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { io } from 'socket.io-client';

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [badge, setBadge] = useState(0);

  const calculateBadgeCount = async () => {
    if (!user) return;
    try {
      let unreadCount = 0;
      const chatUsers = await api.messages.getActiveChatUsers();
      
      const promises = chatUsers.map(async (chatUser) => {
        try {
          const history = await api.messages.getHistory(chatUser._id);
          if (history.length > 0) {
            const lastMsg = history[history.length - 1];
            // If the last message is sent by the client (sender_id === chatUser._id)
            if (lastMsg.sender_id === chatUser._id) {
              const lastRead = localStorage.getItem(`yashuarts_last_admin_chat_read_${chatUser._id}`);
              const lastReadTime = lastRead ? parseInt(lastRead, 10) : 0;
              const msgTime = new Date(lastMsg.created_at).getTime();
              
              if (msgTime > lastReadTime) {
                unreadCount++;
              }
            }
          }
        } catch (err) {
          console.error(`Failed to fetch history for user ${chatUser._id}:`, err);
        }
      });

      await Promise.all(promises);
      setBadge(unreadCount);
    } catch (err) {
      console.error('[AdminBottomNav] Failed to load message list for badge:', err);
    }
  };

  useEffect(() => {
    if (!user) return;

    calculateBadgeCount();

    const backendRootUrl = 'https://yashuarts-backend.onrender.com';
    const socket = io(backendRootUrl, {
      transports: ['websocket', 'polling']
    });

    socket.emit('join', user.id);
    
    // Refresh badge count on new message
    socket.on('new_message', () => {
      calculateBadgeCount();
    });

    // Handle local window read event
    const handleReadEvent = () => {
      calculateBadgeCount();
    };

    window.addEventListener('yashuarts_admin_chat_read', handleReadEvent);

    return () => {
      socket.disconnect();
      window.removeEventListener('yashuarts_admin_chat_read', handleReadEvent);
    };
  }, [user]);

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { label: 'Artworks', icon: Palette, path: '/admin/artworks' },
    { label: 'Orders', icon: ClipboardList, path: '/admin/orders' },
    { label: 'Messages', icon: MessageSquare, path: '/admin/messages', badge },
    { label: 'Settings', icon: Settings, path: '/admin/settings' }
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
