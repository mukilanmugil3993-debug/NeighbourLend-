import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { Conversation, Message } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Send,
  MessageSquare,
  Search,
  CheckCheck,
  Wrench,
  Clock,
  ArrowLeft
} from 'lucide-react';

interface MessagesPageProps {
  initialConversationId?: string;
  onNavigate: (path: string, params?: any) => void;
}

export const MessagesPage: React.FC<MessagesPageProps> = ({
  initialConversationId,
  onNavigate
}) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(initialConversationId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function loadConversations() {
      if (!user) return;
      try {
        const list = await api.getConversations();
        setConversations(list);
        if (!activeConvId && list.length > 0) {
          setActiveConvId(list[0].conversationId);
        } else if (initialConversationId) {
          setActiveConvId(initialConversationId);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadConversations();
  }, [user, initialConversationId]);

  useEffect(() => {
    async function loadMessages() {
      if (!activeConvId) return;
      try {
        const msgs = await api.getMessages(activeConvId);
        setMessages(msgs);
      } catch (err) {
        console.error(err);
      }
    }
    loadMessages();
  }, [activeConvId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConvId || !newMessage.trim()) return;

    setSending(true);
    try {
      const sent = await api.sendMessage(activeConvId, newMessage.trim());
      setMessages(prev => [...prev, sent]);
      setNewMessage('');

      // Update conversation in list
      setConversations(prev =>
        prev.map(c => c.conversationId === activeConvId ? { ...c, lastMessageText: sent.message, lastMessageAt: sent.createdAt } : c)
      );
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-stone-900">Sign in to view messages</h2>
        <button
          onClick={() => onNavigate('/login')}
          className="px-5 py-2.5 bg-emerald-800 text-white rounded-xl text-xs font-semibold"
        >
          Sign In
        </button>
      </div>
    );
  }

  const activeConversation = conversations.find(c => c.conversationId === activeConvId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs grid grid-cols-1 md:grid-cols-12 h-[750px]">
        {/* Left column: Conversations List (4 cols) */}
        <aside className={`md:col-span-4 border-r border-stone-200 flex flex-col ${activeConvId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-stone-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-stone-900">Neighbor Messages</h2>
            <span className="text-xs text-stone-500">{conversations.length} active</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
            {conversations.length === 0 ? (
              <div className="p-8 text-center space-y-2 text-stone-400">
                <MessageSquare className="w-8 h-8 mx-auto stroke-[1.5]" />
                <p className="text-xs">No conversations yet.</p>
                <p className="text-[11px] text-stone-400">Contact equipment owners from listing pages to coordinate.</p>
              </div>
            ) : (
              conversations.map(c => {
                const isSelected = c.conversationId === activeConvId;
                const other = c.otherParticipant;

                return (
                  <button
                    key={c.conversationId}
                    onClick={() => setActiveConvId(c.conversationId)}
                    className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                      isSelected ? 'bg-emerald-50/60' : 'hover:bg-stone-50'
                    }`}
                  >
                    <img
                      src={other?.profileImage || 'https://images.unsplash.com/photo-1534528741775?auto=format&fit=crop&w=100&q=80'}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover shrink-0 border border-emerald-700/20"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-stone-900 truncate">
                          {other?.fullName || 'Neighbour'}
                        </h4>
                        <span className="text-[10px] text-stone-400 tabular-nums">
                          {new Date(c.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>

                      {c.equipmentName && (
                        <p className="text-[10px] text-emerald-800 font-medium truncate flex items-center gap-1 mt-0.5">
                          <Wrench className="w-2.5 h-2.5" />
                          <span>{c.equipmentName}</span>
                        </p>
                      )}

                      <p className="text-xs text-stone-500 truncate mt-1">
                        {c.lastMessageText}
                      </p>
                    </div>

                    {c.unreadCount && c.unreadCount > 0 ? (
                      <span className="w-4 h-4 rounded-full bg-emerald-700 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {c.unreadCount}
                      </span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Right column: Active Thread (8 cols) */}
        <main className={`md:col-span-8 flex flex-col ${!activeConvId ? 'hidden md:flex' : 'flex'}`}>
          {activeConversation ? (
            <>
              {/* Header */}
              <div className="p-3.5 border-b border-stone-200 flex items-center justify-between bg-stone-50/50">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveConvId(null)}
                    className="md:hidden p-1 text-stone-500 hover:text-stone-800"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <img
                    src={activeConversation.otherParticipant?.profileImage || 'https://images.unsplash.com/photo-1534528741775?auto=format&fit=crop&w=100&q=80'}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="text-xs font-bold text-stone-900">
                      {activeConversation.otherParticipant?.fullName || 'Neighbour'}
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      {activeConversation.otherParticipant?.location || 'Verified Community Member'}
                    </p>
                  </div>
                </div>

                {activeConversation.equipmentName && (
                  <div className="text-right">
                    <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                      Gear: {activeConversation.equipmentName}
                    </span>
                  </div>
                )}
              </div>

              {/* Message History */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#fdfdfc]">
                {messages.map(m => {
                  const isMine = m.senderId === user.memberId;
                  return (
                    <div
                      key={m.messageId}
                      className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                          isMine
                            ? 'bg-emerald-800 text-white rounded-br-xs'
                            : 'bg-white text-stone-800 border border-stone-200 rounded-bl-xs shadow-2xs'
                        }`}
                      >
                        {m.message}
                      </div>
                      <span className="text-[10px] text-stone-400 mt-1 tabular-nums px-1">
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Input composer */}
              <form onSubmit={handleSend} className="p-3 border-t border-stone-200 bg-white flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type a message to coordinate pickup or ask questions..."
                  className="flex-1 px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600"
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="p-2.5 bg-emerald-800 hover:bg-emerald-900 disabled:bg-stone-200 text-white rounded-xl transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-stone-400 p-8 text-center space-y-2">
              <MessageSquare className="w-10 h-10 mx-auto stroke-[1.5]" />
              <p className="text-sm font-medium text-stone-600">Select a conversation</p>
              <p className="text-xs text-stone-400">Choose a chat on the left to message your neighbour.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
