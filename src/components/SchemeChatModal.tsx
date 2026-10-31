import React, { useState, useEffect, useRef } from 'react';
import { CitizenProfile, Scheme, ChatMessage } from '../types';
import { ApiClient } from '../services/apiClient';
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
  RotateCcw,
  ShieldCheck,
  Building2,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react';

interface SchemeChatModalProps {
  scheme: Scheme | null;
  isOpen: boolean;
  onClose: () => void;
  citizenProfile?: CitizenProfile;
}

export const SchemeChatModal: React.FC<SchemeChatModalProps> = ({
  scheme,
  isOpen,
  onClose,
  citizenProfile,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [modelUsed, setModelUsed] = useState<string>('gemini-3.8-flash');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize or reset conversation when scheme changes
  useEffect(() => {
    if (scheme && isOpen) {
      const initialGreeting: ChatMessage = {
        id: 'msg_init',
        role: 'model',
        content: `Namaste! I am your dedicated advisory assistant for **${scheme.title}** (${scheme.code}).\n\nI have complete access to the official gazette guidelines, statutory eligibility conditions, required document lists, and application steps for this scheme.\n\nHow can I assist you with your application today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([initialGreeting]);
      setInput('');
      setModelUsed('gemini-3.8-flash');
    }
  }, [scheme, isOpen]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!isOpen || !scheme) return null;

  const quickPrompts = [
    'What documents do I need to prepare?',
    'What are the exact step-by-step application procedures?',
    'How is the financial benefit disbursed?',
    'What are the strict disqualifying exclusions?',
    'What is the official helpline and website?',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMessage: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const apiMessages = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await ApiClient.chatWithSchemeAssistant(
        scheme.id,
        apiMessages,
        citizenProfile,
        'gemini-3.8-flash'
      );

      const botMessage: ChatMessage = {
        id: `msg_model_${Date.now()}`,
        role: 'model',
        content: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMessage]);
      if (res.modelUsed) {
        setModelUsed(res.modelUsed);
      }
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        role: 'model',
        content: `I encountered an issue retrieving official details: ${err.message}. Please check your connection or try asking again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    if (!scheme) return;
    const initialGreeting: ChatMessage = {
      id: `msg_init_${Date.now()}`,
      role: 'model',
      content: `Conversation restarted. I am ready to answer your questions regarding **${scheme.title}** (${scheme.code}). What would you like to know?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([initialGreeting]);
  };

  // Helper to render bold markdown and lists
  const renderMessageContent = (content: string) => {
    return (
      <div className="space-y-1.5 whitespace-pre-line leading-relaxed text-xs sm:text-sm">
        {content.split('\n').map((line, idx) => {
          // Replace **text** with <strong>
          const parts = line.split(/(\*\*[^*]+\*\*)/g);
          return (
            <div key={idx}>
              {parts.map((part, pIdx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return (
                    <strong key={pIdx} className="font-bold text-slate-950">
                      {part.slice(2, -2)}
                    </strong>
                  );
                }
                return part;
              })}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Chat Modal Header */}
        <div className="bg-slate-900 text-white px-5 py-4 border-b border-slate-800 flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="w-5 h-5 text-amber-400" />
            </div>
            <div className="space-y-0.5">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-mono font-bold text-amber-400">{scheme.code}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-300 font-medium">{scheme.sector}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-300">{scheme.level}</span>
                <span className="bg-slate-800 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded border border-slate-700">
                  {modelUsed}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight line-clamp-1">
                {scheme.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleResetChat}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Reset conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Grounding & Guardrail Sub-Banner */}
        <div className="bg-amber-50/80 border-b border-amber-200/80 px-4 py-2 flex items-center justify-between gap-2 text-[11px] text-amber-950 shrink-0">
          <div className="flex items-center gap-1.5 line-clamp-1">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>
              Dedicated context: <strong>{scheme.title}</strong> only. Responses are grounded in official gazette provisions.
            </span>
          </div>
          <a
            href={scheme.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-900 font-semibold hover:underline flex items-center gap-0.5 shrink-0"
          >
            Official Portal
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/60">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs ${
                    isUser
                      ? 'bg-blue-900 text-white'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-amber-800" />}
                </div>

                <div className={`max-w-[85%] space-y-1 ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`p-3.5 rounded-2xl shadow-xs text-xs sm:text-sm ${
                      isUser
                        ? 'bg-blue-900 text-white rounded-tr-xs'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
                    }`}
                  >
                    {renderMessageContent(msg.content)}
                  </div>
                  {msg.timestamp && (
                    <span className="text-[10px] text-slate-400 px-1 font-mono block text-right">
                      {msg.timestamp}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-amber-800" />
              </div>
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs text-xs text-slate-500 flex items-center gap-2">
                <span className="w-3 h-3 border-2 border-blue-900/30 border-t-blue-900 rounded-full animate-spin" />
                <span>Checking verified scheme clauses...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompt Chips */}
        <div className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto shrink-0">
          <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap pl-2">
            Suggested:
          </span>
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              disabled={loading}
              className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg whitespace-nowrap transition-colors cursor-pointer border border-slate-200"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask a question about ${scheme.code} (e.g. documents, eligibility, steps)...`}
              disabled={loading}
              className="flex-1 py-2.5 px-3.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-900 focus:bg-white transition-all"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 bg-blue-900 hover:bg-blue-800 disabled:opacity-40 text-white rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
              title="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
