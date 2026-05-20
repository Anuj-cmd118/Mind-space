import { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  MessageSquare, 
  BookOpen, 
  TrendingUp, 
  Brain, 
  Send,
  Loader2,
  ChevronRight,
  RefreshCw,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MindItem, JournalEntry } from '../types';

import { api } from '../services/api';

export default function ReflectionHub({ 
  items, 
  onUpdateItems,
  callAiApi,
  hasApiKey
}: { 
  items: MindItem[], 
  onUpdateItems: (items: MindItem[]) => void,
  callAiApi: (endpoint: string, body: any) => Promise<any>,
  hasApiKey: boolean
}) {
  const [activeTab, setActiveTab] = useState<'chat' | 'growth' | 'journal'>('chat');
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [newJournal, setNewJournal] = useState('');
  const [isJournaling, setIsJournaling] = useState(false);
  const [growthInsight, setGrowthInsight] = useState<any>(null);
  const [isGrowthLoading, setIsGrowthLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('mindspace_journals');
    if (saved) setJournals(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('mindspace_journals', JSON.stringify(journals));
  }, [journals]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = { role: 'user' as const, text: chatInput };
    setChatHistory(prev => [...prev, userMsg]);
    const currentInput = chatInput;
    setChatInput('');
    setIsChatLoading(true);

    if (!hasApiKey) {
      setTimeout(() => {
        setChatHistory(prev => [...prev, { 
          role: 'ai', 
          text: "I noticed your Gemini API Key is not set up yet. To enable personal reflections, please click on the Settings gear icon in the top header panel and enter your Gemini API Key in the 'AI Settings' section. You can obtain a free key from Google AI Studio (ai.google.dev). This key resides locally on your device for absolute privacy and security." 
        }]);
        setIsChatLoading(false);
      }, 600);
      return;
    }

    try {
      const data = await callAiApi('/api/chat', { message: currentInput, history: chatHistory, contextItems: items });
      setChatHistory(prev => [...prev, { role: 'ai', text: data.text }]);
    } catch (e: any) {
      const errMsg = e.message || '';
      if (errMsg.includes('API Key') || errMsg.includes('api_key') || errMsg.includes('No Gemini API Key')) {
        setChatHistory(prev => [...prev, { 
          role: 'ai', 
          text: "Your Gemini API Key is missing or invalid. Please click the Settings gear icon in the top-right header and verify your API Key under 'AI Settings'." 
        }]);
      } else {
        setChatHistory(prev => [...prev, { role: 'ai', text: "I'm having trouble reflecting right now. Please verify your internet connection or check if your Gemini API key is valid." }]);
      }
    } finally {
      setIsChatLoading(false);
    }
  };

  const generateGrowthTimeline = async () => {
    setIsGrowthLoading(true);
    try {
      const data = await callAiApi('/api/deep-reflection', { items, type: 'growth' });
      setGrowthInsight(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGrowthLoading(false);
    }
  };

  const saveJournal = async () => {
    if (!newJournal.trim()) return;
    const entry: JournalEntry = {
      id: crypto.randomUUID(),
      content: newJournal,
      createdAt: Date.now()
    };
    setJournals([entry, ...journals]);
    setNewJournal('');
    setIsJournaling(false);
  };

  return (
    <div className="space-y-8 pb-10">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-serif text-primary leading-tight">Reflection Hub</h2>
          <p className="text-secondary text-sm italic mt-1 font-medium opacity-70">
            Synthesize your memories into wisdom.
          </p>
        </div>
        
        <div className="flex gap-1 p-1 bg-surface-container rounded-2xl">
          <button 
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'chat' ? 'bg-white shadow-sm text-primary' : 'text-secondary'}`}
          >
            Ask Mind
          </button>
          <button 
            onClick={() => setActiveTab('growth')}
            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'growth' ? 'bg-white shadow-sm text-primary' : 'text-secondary'}`}
          >
            Growth
          </button>
          <button 
            onClick={() => setActiveTab('journal')}
            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'journal' ? 'bg-white shadow-sm text-primary' : 'text-secondary'}`}
          >
            Journal
          </button>
        </div>
      </header>

      <div className="min-h-[500px]">
        {activeTab === 'chat' && (
          <div className="bg-white rounded-[48px] border border-surface-container shadow-sm flex flex-col h-[600px] overflow-hidden">
            <div className="p-6 border-b border-surface-container flex items-center gap-3">
               <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                 <MessageSquare size={20} />
               </div>
               <div>
                  <h3 className="font-serif italic text-primary">Conversation with Memory</h3>
                  <p className="text-[10px] text-secondary font-bold uppercase tracking-widest opacity-60">AI Reflection Assistant</p>
               </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
              {chatHistory.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                  <Sparkles size={48} className="text-primary" />
                  <p className="text-sm font-serif italic max-w-xs">"What recurring themes have you noticed in my filmmaking collection?"</p>
                </div>
              )}
              {chatHistory.map((chat, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={i} 
                  className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] p-5 rounded-[28px] text-sm leading-relaxed ${
                    chat.role === 'user' 
                      ? 'bg-primary text-on-primary rounded-tr-none' 
                      : 'bg-surface-dim text-on-primary-container rounded-tl-none border border-surface-container'
                  }`}>
                    {chat.text}
                  </div>
                </motion.div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-surface-dim p-4 rounded-[28px] rounded-tl-none border border-surface-container">
                    <Loader2 className="animate-spin text-primary" size={20} />
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-surface-container bg-surface-dim/30">
               <div className="flex gap-2">
                 <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                  placeholder="Ask about your thoughts or memories..."
                  className="flex-1 px-6 py-4 bg-white rounded-2xl border border-surface-container outline-none focus:ring-1 focus:ring-primary/20 text-sm font-medium"
                 />
                 <button 
                  onClick={handleChat}
                  disabled={!chatInput.trim() || isChatLoading}
                  className="p-4 bg-primary text-on-primary rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
                 >
                   <Send size={20} />
                 </button>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'growth' && (
          <div className="space-y-6">
            <div className="bg-primary rounded-[48px] p-10 text-white shadow-xl relative overflow-hidden">
               <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-2 opacity-70">
                    <TrendingUp size={20} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Personal Growth Analysis</span>
                  </div>
                  <h3 className="text-4xl font-serif italic max-w-xl">How has your perspective shifted this month?</h3>
                  <button 
                    onClick={generateGrowthTimeline}
                    disabled={isGrowthLoading || items.length < 5}
                    className="px-8 py-4 bg-white text-primary rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-white/90 transition-all shadow-lg disabled:opacity-50"
                  >
                    {isGrowthLoading ? <RefreshCw className="animate-spin" size={16} /> : <Brain size={16} />}
                    Deep Reflect
                  </button>
                  {items.length < 5 && (
                    <p className="text-xs opacity-60">Record at least 5 memories to see your evolution.</p>
                  )}
               </div>
               <Sparkles className="absolute bottom-[-20px] right-[-20px] text-white/10 w-64 h-64 rotate-12" />
            </div>

            {growthInsight && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                 <div className="bg-white rounded-[40px] p-8 border border-surface-container scroll-container overflow-y-auto max-h-[400px]">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-secondary mb-6 opacity-60">Growth Timeline</h4>
                    <div className="space-y-6">
                      {growthInsight.timeline.map((item: any, i: number) => (
                        <div key={i} className="flex gap-4 group">
                           <div className="flex flex-col items-center">
                              <div className="w-2 h-2 rounded-full bg-primary mt-1" />
                              {i < growthInsight.timeline.length - 1 && <div className="w-px h-full bg-surface-container mt-1" />}
                           </div>
                           <div className="pb-6">
                              <div className="text-[10px] font-bold text-secondary uppercase tracking-tighter opacity-50">{item.label}</div>
                              <div className="text-sm font-serif italic text-primary mt-1 line-clamp-2">{item.value}</div>
                           </div>
                        </div>
                      ))}
                    </div>
                 </div>
                 <div className="bg-surface-container rounded-[40px] p-8 border border-surface-container-high flex flex-col justify-center">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-on-secondary-container mb-4 opacity-60">Major Cognitive Shift</h4>
                    <p className="text-xl font-serif text-primary italic leading-relaxed">
                      "{growthInsight.majorShift}"
                    </p>
                    <div className="mt-8 p-4 bg-white rounded-2xl flex items-center gap-3">
                       <Sparkles size={20} className="text-primary opacity-40" />
                       <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">Phase 3 Intelligence</span>
                    </div>
                 </div>
              </motion.div>
            )}
          </div>
        )}

        {activeTab === 'journal' && (
          <div className="space-y-6">
             <div className="flex justify-between items-center">
                <h3 className="text-xl font-serif italic text-primary">Unstructured Awareness</h3>
                <button 
                  onClick={() => setIsJournaling(true)}
                  className="px-6 py-3 bg-white border border-surface-container rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-surface-dim transition-all"
                >
                  <Plus size={16} /> New Entry
                </button>
             </div>

             <AnimatePresence>
                {isJournaling && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-white rounded-[32px] p-8 border-2 border-primary/10 shadow-lg space-y-6">
                       <textarea 
                        value={newJournal}
                        onChange={(e) => setNewJournal(e.target.value)}
                        placeholder="Write without judgment..."
                        className="w-full h-48 bg-surface-dim rounded-2xl p-6 outline-none focus:ring-1 focus:ring-primary/20 text-sm italic font-serif leading-relaxed"
                       />
                       <div className="flex justify-end gap-3">
                          <button onClick={() => setIsJournaling(false)} className="text-[10px] font-bold uppercase tracking-widest text-secondary hover:text-primary transition-all">Discard</button>
                          <button onClick={saveJournal} className="px-8 py-3 bg-primary text-on-primary rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-md">Seal Memory</button>
                       </div>
                    </div>
                  </motion.div>
                )}
             </AnimatePresence>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {journals.map(j => (
                  <div key={j.id} className="p-6 bg-white rounded-[32px] border border-surface-container hover:shadow-md transition-all group">
                     <div className="text-[10px] font-bold text-secondary uppercase tracking-widest opacity-40 mb-3">{new Date(j.createdAt).toLocaleDateString()}</div>
                     <p className="text-sm font-serif italic text-primary line-clamp-3 leading-relaxed">
                       {j.content}
                     </p>
                     <div className="mt-4 pt-4 border-t border-surface-dim opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-primary">
                        <span>Reflection</span>
                        <ChevronRight size={14} />
                     </div>
                  </div>
                ))}
                {journals.length === 0 && (
                  <div className="col-span-full py-20 bg-white/40 rounded-[40px] border border-dashed border-surface-container flex flex-col items-center justify-center text-center space-y-4">
                    <BookOpen size={40} className="text-secondary opacity-20" />
                    <p className="text-secondary text-sm font-serif italic mb-4">You have no recorded journals.</p>
                  </div>
                )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
