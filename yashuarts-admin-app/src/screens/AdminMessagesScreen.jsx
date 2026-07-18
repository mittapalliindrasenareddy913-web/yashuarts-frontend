import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, Info, Search, MessageSquare, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import BottomNav from '../components/BottomNav';

export const AdminMessagesScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeClient, setActiveClient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [activeChats, setActiveChats] = useState([]);
  const [filteredChats, setFilteredChats] = useState([]);
  const [loadingChats, setLoadingChats] = useState(true);
  
  const [metaMap, setMetaMap] = useState({});
  const messageEndRef = useRef(null);
  const socketRef = useRef(null);

  const loadActiveChats = async (showLoader = true) => {
    if (!user) return;
    try {
      if (showLoader) setLoadingChats(true);
      const directory = await api.messages.getActiveChatUsers();
      setActiveChats(directory);
      setFilteredChats(directory);

      const metadata = {};
      await Promise.all(
        directory.map(async (client) => {
          try {
            const history = await api.messages.getHistory(client._id);
            if (history.length > 0) {
              const lastMsg = history[history.length - 1];
              const lastRead = localStorage.getItem(`yashuarts_last_admin_chat_read_${client._id}`);
              const lastReadTime = lastRead ? parseInt(lastRead, 10) : 0;
              const msgTime = new Date(lastMsg.created_at).getTime();

              metadata[client._id] = {
                lastMsg: lastMsg.message,
                time: new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                unread: lastMsg.sender_id === client._id && msgTime > lastReadTime
              };
            } else {
              metadata[client._id] = { lastMsg: 'No messages yet', time: '', unread: false };
            }
          } catch (err) {
            metadata[client._id] = { lastMsg: 'Error fetching log', time: '', unread: false };
          }
        })
      );
      setMetaMap(metadata);
    } catch (err) {
      console.error('Failed to load active chat directory:', err);
    } finally {
      setLoadingChats(false);
    }
  };

  // Sync directory on mount
  useEffect(() => {
    loadActiveChats(true);
  }, [user]);

  // Socket IO connection
  useEffect(() => {
    if (!user) return;

    const backendRootUrl = 'https://yashuarts-backend.onrender.com';
    const socket = io(backendRootUrl, {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.emit('join', user.id);

    socket.on('new_message', (msg) => {
      loadActiveChats(false); // silent refresh directory

      if (activeClient) {
        const payload = {
          id: msg._id,
          sender_id: msg.sender_id,
          recipient_id: msg.recipient_id,
          message: msg.message,
          created_at: msg.createdAt
        };

        const isFromActive = payload.sender_id === activeClient._id;
        const isToActive = payload.recipient_id === activeClient._id;

        if (isFromActive || isToActive) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.id)) return prev;
            return [...prev, payload];
          });

          if (isFromActive) {
            localStorage.setItem(`yashuarts_last_admin_chat_read_${activeClient._id}`, String(Date.now()));
            window.dispatchEvent(new Event('yashuarts_admin_chat_read'));
          }
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user, activeClient]);

  // Client list search filtering
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredChats(activeChats);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredChats(
        activeChats.filter(
          (c) =>
            c.full_name?.toLowerCase().includes(query) ||
            c.email?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, activeChats]);

  // Auto-scroll chat history
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectClient = async (client) => {
    setActiveClient(client);
    setLoadingHistory(true);
    try {
      const history = await api.messages.getHistory(client._id);
      setMessages(history);
      
      localStorage.setItem(`yashuarts_last_admin_chat_read_${client._id}`, String(Date.now()));
      window.dispatchEvent(new Event('yashuarts_admin_chat_read'));

      setMetaMap((prev) => ({
        ...prev,
        [client._id]: { ...prev[client._id], unread: false }
      }));
    } catch (err) {
      console.error('Error loading chat history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !activeClient) return;

    try {
      const sentMsg = await api.messages.send(messageText.trim(), activeClient._id);
      setMessages((prev) => {
        if (prev.some((m) => m.id === sentMsg.id)) return prev;
        return [...prev, sentMsg];
      });

      setMetaMap((prev) => ({
        ...prev,
        [activeClient._id]: {
          lastMsg: messageText.trim(),
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unread: false
        }
      }));

      setMessageText('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  return (
    <div className="h-screen bg-[#030303] text-slate-100 flex flex-col pb-16 selection:bg-[#D4AF37] selection:text-slate-950">
      {activeClient ? (
        // Mode A: Detailed client chat box
        <>
          <header className="bg-[#060606]/95 border-b border-[#D4AF37]/15 sticky top-0 z-50">
            <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveClient(null)}
                  aria-label="Back to message directory"
                  title="Back to message directory"
                  className="p-2 text-slate-400 hover:text-[#D4AF37] hover:bg-white/5 rounded-xl transition-all"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                
                {/* Client Profile Avatar */}
                <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] border border-[#D4AF37]/20 font-bold text-sm">
                  {activeClient.avatar_url ? (
                    <img src={activeClient.avatar_url} alt="client avatar" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    activeClient.full_name?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>

                <div>
                  <h1 className="text-sm font-bold text-white uppercase tracking-wider" style={{ fontFamily: "'Cinzel', serif" }}>
                    {activeClient.full_name || 'Anonymous client'}
                  </h1>
                  <p className="text-[8px] text-slate-500 font-mono tracking-wider truncate max-w-xs">
                    {activeClient.email}
                  </p>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-5 overflow-y-auto scrollbar-none space-y-4">
            {loadingHistory ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D4AF37]" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-20 bg-[#0B0B0B]/50 border border-white/5 rounded-[24px]">
                <MessageSquare className="w-10 h-10 text-slate-650 mx-auto mb-2" />
                <p className="text-slate-400 text-xs font-semibold">No message records</p>
                <p className="text-slate-500 text-[10px] mt-1">Send a message to start direct customer assistance chat.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => {
                  const isSentByAdmin = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isSentByAdmin ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}>
                      <div
                        className={`max-w-[78%] px-4.5 py-3 rounded-[20px] shadow-lg ${
                          isSentByAdmin
                            ? 'bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-[#1a1a1a] font-medium rounded-tr-none'
                            : 'bg-[#161616] border border-white/5 text-slate-100 rounded-tl-none'
                        }`}
                      >
                        <p className="break-words text-xs sm:text-sm leading-relaxed">{msg.message}</p>
                        <p
                          className={`text-[8px] mt-1.5 font-bold uppercase tracking-wider text-right ${
                            isSentByAdmin ? 'text-[#1a1a1a]/60' : 'text-slate-550'
                          }`}
                        >
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={messageEndRef} />
              </div>
            )}
          </main>

          {/* Typing response toolbar */}
          <div className="bg-[#060606] border-t border-[#D4AF37]/15 py-3 px-4 sticky bottom-16 z-30">
            <div className="max-w-3xl mx-auto flex gap-2.5">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your response to the client..."
                className="flex-1 bg-[#0D0D0D] border border-white/5 text-white placeholder-slate-650 px-4.5 py-3.5 rounded-2xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all text-xs"
              />
              <button
                onClick={handleSendMessage}
                aria-label="Send message"
                title="Send message"
                className="p-3.5 bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] text-slate-950 rounded-2xl hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center justify-center shadow-lg shadow-amber-500/10"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      ) : (
        // Mode B: Active chats list directory
        <>
          <header className="bg-[#060606]/90 border-b border-[#D4AF37]/15 py-4 px-4 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
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
                    Messages Center
                  </h1>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest" style={{ fontFamily: "'Inter', sans-serif" }}>
                    Enterprise Client Chats
                  </p>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-5 overflow-y-auto space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 h-4.5 w-4.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search active chats..."
                className="w-full bg-[#0D0D0D] border border-white/5 text-white placeholder-slate-650 pl-11 pr-5 py-3 rounded-2xl focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all text-xs"
              />
            </div>

            {loadingChats ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="bg-[#0D0D0D] border border-white/5 p-4 rounded-2xl animate-pulse flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#161616] rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-[#161616] rounded w-1/3" />
                      <div className="h-3 bg-[#161616] rounded w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="text-center py-20 bg-[#0B0B0B]/50 border border-white/5 rounded-3xl">
                <MessageSquare className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-400 text-sm font-semibold">No active conversations</p>
                <p className="text-slate-500 text-xs mt-1">Direct client chat requests will populate instantly here.</p>
              </div>
            ) : (
              <div className="space-y-2 animate-scale-up">
                {filteredChats.map((client) => {
                  const meta = metaMap[client._id] || { lastMsg: '', time: '', unread: false };
                  return (
                    <div
                      key={client._id}
                      onClick={() => selectClient(client)}
                      className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center justify-between gap-3 ${
                        meta.unread
                          ? 'bg-[#121212] border-[#D4AF37]/45 shadow-lg'
                          : 'bg-[#0D0D0D] border-white/5 hover:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Avatar */}
                        <div className="w-11 h-11 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-[#D4AF37] border border-[#D4AF37]/20 flex-shrink-0 font-bold text-sm">
                          {client.avatar_url ? (
                            <img src={client.avatar_url} alt="client avatar" className="w-full h-full object-cover rounded-full" />
                          ) : (
                            client.full_name?.charAt(0).toUpperCase() || 'U'
                          )}
                        </div>

                        <div className="min-w-0">
                          <h3 className="font-bold text-sm text-slate-200 truncate flex items-center gap-1.5">
                            {client.full_name || 'Anonymous User'}
                            {meta.unread && (
                              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse inline-block" />
                            )}
                          </h3>
                          <p className={`text-xs truncate mt-1.5 ${meta.unread ? 'text-slate-100 font-semibold' : 'text-slate-500'}`}>
                            {meta.lastMsg}
                          </p>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0 space-y-1">
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block font-mono">
                          {meta.time}
                        </span>
                        {meta.unread && (
                          <span className="inline-block px-1.5 py-0.5 rounded bg-red-650/10 border border-red-650/20 text-red-400 text-[8px] font-black uppercase tracking-wider font-mono">
                            New Chat
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </>
      )}

      <BottomNav />
    </div>
  );
};

export default AdminMessagesScreen;
