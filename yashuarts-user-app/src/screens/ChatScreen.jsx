import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Send } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import BottomNav from '../components/BottomNav';
import { io } from 'socket.io-client';

export const ChatScreen = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();
  const location = useLocation();

  const chatUser = location.state?.chatUser;
  const chatUserId = chatUser?.id; // If defined, we are chatting with this specific user (used in admin or user-specific chat)

  useEffect(() => {
    if (!user) return;

    loadChatHistory();

    // Setup Socket connection
    const backendRootUrl = 'https://yashuarts-backend.onrender.com';
    const socket = io(backendRootUrl, {
      transports: ['websocket', 'polling']
    });

    socket.emit('join', user.id);

    socket.on('new_message', (msg) => {
      const formattedMsg = {
        id: msg._id,
        sender_id: msg.sender_id,
        recipient_id: msg.recipient_id,
        message: msg.message,
        created_at: msg.createdAt
      };

      // Check if message belongs to current conversation
      const isFromCurrentPartner = chatUserId ? formattedMsg.sender_id === chatUserId : true;
      const isToCurrentPartner = chatUserId ? formattedMsg.recipient_id === chatUserId : true;

      if (isFromCurrentPartner || isToCurrentPartner) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === formattedMsg.id)) return prev;
          return [...prev, formattedMsg];
        });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user, chatUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatHistory = async () => {
    try {
      setLoading(true);
      const history = await api.messages.getHistory(chatUserId);
      setMessages(history);
    } catch (err) {
      console.error('Error loading chat history:', err);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !user) return;

    try {
      const text = input.trim();
      setInput(''); // clear input early for responsive UI
      const sentMsg = await api.messages.send(text, chatUserId);
      
      setMessages((prev) => {
        if (prev.some((m) => m.id === sentMsg.id)) return prev;
        return [...prev, sentMsg];
      });
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  return (
    <div className="h-screen bg-[#030303] flex flex-col pb-16 text-slate-100 selection:bg-[#D4AF37] selection:text-slate-950">
      <header className="bg-[#060606]/95 border-b border-[#D4AF37]/15">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
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
            <h1 className="text-base font-bold text-white uppercase tracking-wider" style={{ fontFamily: "'Cinzel', serif" }}>
              {chatUser ? chatUser.full_name : 'YashuArts Studio'}
            </h1>
            <p className="text-[9px] text-[#D4AF37] uppercase tracking-widest font-black">
              {chatUser ? 'Client Support' : 'Direct Chat with Artist'}
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 overflow-y-auto scrollbar-none space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37]" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20 bg-[#0B0B0B]/50 border border-white/5 rounded-[24px]">
            <p className="text-slate-400 text-sm font-semibold">No messages yet</p>
            <p className="text-slate-500 text-xs mt-1">
              Start chatting with the artist about portrait commissions!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isMe = msg.sender_id === user?.id;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
                >
                  <div
                    className={`max-w-[75%] px-4.5 py-3 rounded-[20px] shadow-lg ${
                      isMe
                        ? 'bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-[#1a1a1a] font-medium rounded-tr-none'
                        : 'bg-[#161616] border border-white/5 text-slate-100 rounded-tl-none'
                    }`}
                  >
                    <p className="break-words text-sm leading-relaxed">{msg.message}</p>
                    <p
                      className={`text-[9px] mt-1.5 font-bold uppercase tracking-wider ${
                        isMe ? 'text-[#1a1a1a]/70' : 'text-slate-500'
                      }`}
                    >
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      <div className="bg-[#060606] border-t border-white/5 p-4 z-10">
        <div className="max-w-3xl mx-auto flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type a message to artist..."
            rows={1}
            className="flex-1 px-4 py-3 bg-[#0D0D0D] border border-white/10 rounded-xl focus:outline-none focus:border-[#D4AF37] text-white placeholder-slate-600 resize-none text-sm"
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim()}
            className="px-5 bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-slate-950 rounded-xl font-black hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default ChatScreen;
