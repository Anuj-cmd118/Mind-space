import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  Wind, 
  AlertCircle, 
  Lock, 
  Globe, 
  ExternalLink,
  Brain,
  Timer as TimerIcon,
  X,
  Plus,
  Check,
  Smartphone,
  Zap,
  BarChart2,
  Fingerprint
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppLockEntry } from '../types';
import { nativeBridge, NativeScreenTime } from '../services/nativeBridge';

interface WellnessCenterProps {
  blockedApps: AppLockEntry[];
  onAddApp: (app: AppLockEntry) => void;
  onRemoveApp: (id: string) => void;
  onUpdateApps: (apps: AppLockEntry[]) => void;
}

export default function WellnessCenter({ blockedApps, onAddApp, onRemoveApp, onUpdateApps }: WellnessCenterProps) {
  const [activeTab, setActiveTab] = useState<'interceptor' | 'breathing' | 'phone'>('phone');
  const [isAddingApp, setIsAddingApp] = useState(false);
  const [newApp, setNewApp] = useState({ name: '', url: '', category: 'Entertainment' });
  
  const [isBreathActive, setIsBreathActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'in' | 'hold' | 'out' | 'hold-exhale'>('in');
  const [showInterstitial, setShowInterstitial] = useState<{ name: string, url: string } | null>(null);
  
  const [nativeMetrics, setNativeMetrics] = useState<NativeScreenTime[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!isBreathActive) {
      setBreathPhase('in');
      return;
    }
    const interval = setInterval(() => {
      setBreathPhase((prev) => {
        if (prev === 'in') return 'hold';
        if (prev === 'hold') return 'out';
        if (prev === 'out') return 'hold-exhale';
        return 'in';
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [isBreathActive]);

  const addApp = () => {
    if (!newApp.name || !newApp.url) return;
    const entry: AppLockEntry = {
      id: crypto.randomUUID(),
      ...newApp
    };
    onAddApp(entry);
    setNewApp({ name: '', url: '', category: 'Entertainment' });
    setIsAddingApp(false);
    nativeBridge.vibrate();
  };

  const removeApp = (id: string) => {
    onRemoveApp(id);
  };

  const openAppWithFriction = (app: AppLockEntry) => {
    setShowInterstitial({ name: app.name, url: app.url });
    nativeBridge.vibrate();
  };

  const syncAndroidMetrics = async () => {
    setIsSyncing(true);
    const metrics = await nativeBridge.getScreenTimeMetrics();
    setNativeMetrics(metrics);
    setTimeout(() => setIsSyncing(false), 1000);
  };

  return (
    <div className="space-y-8 pb-10">
      <header className="flex flex-col gap-4 pb-2 border-b border-surface-container">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-3xl font-serif text-primary leading-tight">Cognitive Wellness</h2>
          </div>
          <p className="text-secondary text-sm italic font-medium opacity-70">
            Reclaim your attention from the dopamine loop.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-1 p-1 bg-surface-container rounded-2xl w-fit">
          <button 
            onClick={() => setActiveTab('phone')}
            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'phone' ? 'bg-white shadow-sm text-primary' : 'text-secondary'}`}
          >
            Phone
          </button>
          <button 
            onClick={() => setActiveTab('interceptor')}
            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'interceptor' ? 'bg-white shadow-sm text-primary' : 'text-secondary'}`}
          >
            Interceptor
          </button>
          <button 
            onClick={() => setActiveTab('breathing')}
            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'breathing' ? 'bg-white shadow-sm text-primary' : 'text-secondary'}`}
          >
            Breathe
          </button>
        </div>
      </header>

      <div className="min-h-[500px]">
        {activeTab === 'phone' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-surface-dim rounded-[40px] p-8 border border-surface-container flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone size={20} className="text-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-widest text-primary">Native System Hooks</h3>
                  </div>
                  <button 
                    onClick={syncAndroidMetrics}
                    disabled={isSyncing}
                    className="p-2 hover:bg-primary/10 rounded-full text-primary transition-all"
                  >
                    <Zap size={18} className={isSyncing ? 'animate-pulse' : ''} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-surface-container">
                    <div className="flex items-center gap-3">
                      <Fingerprint size={18} className="opacity-40" />
                      <span className="text-xs font-medium">Usage Stats Access</span>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-bold uppercase">Granted</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-surface-container">
                    <div className="flex items-center gap-3">
                      <Lock size={18} className="opacity-40" />
                      <span className="text-xs font-medium">Overlay Permission</span>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-bold uppercase">Active</span>
                  </div>
                </div>

                <div className="mt-auto p-4 bg-amber-50 rounded-2xl flex gap-3 items-start border border-amber-100">
                  <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-800 leading-relaxed italic">
                    Mindspace is monitoring background app behavior to identify habitual opening patterns.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-[40px] p-8 border border-surface-container shadow-sm flex flex-col gap-6">
                <div className="flex items-center gap-2">
                  <BarChart2 size={20} className="text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-widest text-primary">Native Screen Time</h3>
                </div>
                
                <div className="space-y-3">
                  {nativeMetrics.length > 0 ? nativeMetrics.map(m => (
                    <div key={m.appName} className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight">
                        <span className="text-primary">{m.appName}</span>
                        <span className="text-secondary">{m.minutes}m</span>
                      </div>
                      <div className="w-full h-1.5 bg-surface-dim rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (m.minutes / 150) * 100)}%` }}
                          className="h-full bg-primary/40 rounded-full"
                        />
                      </div>
                    </div>
                  )) : (
                    <div className="py-10 text-center opacity-30">
                      <p className="text-xs font-serif italic">Sync to load device metrics</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-primary rounded-[40px] p-8 text-white shadow-xl flex items-center justify-between group">
              <div className="space-y-2">
                <h3 className="text-2xl font-serif italic text-white/90">System-Wide Interceptor</h3>
                <p className="text-xs opacity-70 max-w-md">The Interceptor creates a cognitive pause before any blocked phone app launches.</p>
              </div>
              <div className="p-4 bg-white/10 rounded-full group-hover:scale-110 transition-transform">
                <ShieldCheck size={32} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'interceptor' && (
          <div className="space-y-6 animate-in fade-in duration-300">
             <div className="bg-primary rounded-[48px] p-10 text-white shadow-xl flex flex-col md:flex-row items-center gap-8">
                <div className="p-6 bg-white/10 rounded-[32px] border border-white/20">
                  <ShieldCheck size={64} className="text-white/80" />
                </div>
                <div className="space-y-4 text-center md:text-left">
                   <h3 className="text-3xl font-serif italic">The Intentionality Interceptor</h3>
                   <p className="text-sm opacity-80 leading-relaxed max-w-md">
                     Break unconscious scrolling habits by introducing a <strong>Pause Layer</strong> between you and distracting platforms.
                   </p>
                   <button 
                    onClick={() => setIsAddingApp(true)}
                    className="px-6 py-3 bg-white text-primary rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-white/90 transition-all shadow-lg mx-auto md:mx-0"
                   >
                     <Plus size={16} /> Add Anchor
                   </button>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {blockedApps.map(app => (
                  <div key={app.id} className="bg-white rounded-3xl p-6 border border-surface-container flex items-center justify-between group shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-surface-dim rounded-xl flex items-center justify-center text-primary">
                          <Globe size={20} />
                       </div>
                       <div>
                          <h4 className="font-bold text-sm text-primary uppercase tracking-wider">{app.name}</h4>
                          <p className="text-[10px] text-secondary font-medium tracking-tight opacity-50">{app.category}</p>
                       </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button 
                        onClick={() => openAppWithFriction(app)}
                        className="p-2 hover:bg-primary/5 text-primary rounded-full"
                       >
                         <ExternalLink size={18} />
                       </button>
                       <button onClick={() => removeApp(app.id)} className="p-2 hover:bg-red-50 text-red-400 rounded-full">
                         <X size={18} />
                       </button>
                    </div>
                  </div>
                ))}
                {blockedApps.length === 0 && (
                  <div className="col-span-full py-20 text-center space-y-4 opacity-30">
                    <Lock size={48} className="mx-auto" />
                    <p className="font-serif italic">No apps listed for system interception.</p>
                  </div>
                )}
             </div>

             <AnimatePresence>
                {isAddingApp && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsAddingApp(false)}
                      className="absolute inset-0 bg-[#3D3A35]/40 backdrop-blur-sm"
                    />
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="relative w-full max-w-md bg-surface-dim rounded-[40px] p-8 shadow-2xl space-y-6"
                    >
                      <h3 className="text-2xl font-serif italic text-primary">New Cognitive Anchor</h3>
                      <div className="space-y-4">
                        <input 
                          type="text" 
                          placeholder="App Name (e.g. Instagram)" 
                          className="w-full px-5 py-4 bg-white rounded-2xl border border-surface-container outline-none"
                          value={newApp.name}
                          onChange={(e) => setNewApp({...newApp, name: e.target.value})}
                        />
                        <input 
                          type="text" 
                          placeholder="URL (e.g. instagram.com)" 
                          className="w-full px-5 py-4 bg-white rounded-2xl border border-surface-container outline-none"
                          value={newApp.url}
                          onChange={(e) => setNewApp({...newApp, url: e.target.value})}
                        />
                        <select 
                          className="w-full px-5 py-4 bg-white rounded-2xl border border-surface-container outline-none appearance-none"
                          value={newApp.category}
                          onChange={(e) => setNewApp({...newApp, category: e.target.value})}
                        >
                          <option>Entertainment</option>
                          <option>Social Media</option>
                          <option>News</option>
                          <option>Shopping</option>
                        </select>
                      </div>
                      <button 
                        onClick={addApp}
                        className="w-full py-4 bg-primary text-on-primary rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl"
                      >
                        Create Intercept Hook
                      </button>
                    </motion.div>
                  </div>
                )}
             </AnimatePresence>
          </div>
        )}

        {activeTab === 'breathing' && (
          <div className="h-[500px] flex flex-col items-center justify-center text-center space-y-12 animate-in fade-in duration-300">
             <div className="space-y-2">
                <h3 className="text-4xl font-serif italic text-primary">Simple Decompression</h3>
                <p className="text-secondary text-sm font-medium opacity-60">Reset your nervous system with intentional breath.</p>
             </div>

             <div className="relative w-80 h-80 flex items-center justify-center">
                <motion.div 
                  animate={isBreathActive ? {
                    scale: (breathPhase === 'in' || breathPhase === 'hold') ? 1.5 : 1,
                  } : { scale: 1 }}
                  transition={{ duration: 4, ease: "easeInOut" }}
                  className="w-40 h-40 bg-primary/10 rounded-full border border-primary/20 flex items-center justify-center"
                >
                  <motion.div 
                    animate={isBreathActive ? {
                      scale: (breathPhase === 'in' || breathPhase === 'hold') ? 0.8 : 0.2,
                    } : { scale: 0.5 }}
                    className="w-full h-full bg-primary/20 rounded-full blur-2xl"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-serif italic text-primary uppercase tracking-widest transition-all">
                      {isBreathActive ? 
                        (breathPhase === 'in' ? 'Inhale' : 
                         breathPhase === 'hold' ? 'Hold' : 
                         breathPhase === 'out' ? 'Exhale' : 'Hold Exhale') 
                        : 'Calm'
                      }
                    </span>
                  </div>
                </motion.div>
             </div>

             <button 
              onClick={() => {
                setIsBreathActive(!isBreathActive);
                setBreathPhase('in');
              }}
              className={`px-12 py-5 rounded-[24px] font-bold text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl ${
                isBreathActive ? 'bg-surface-container text-primary' : 'bg-primary text-on-primary'
              }`}
             >
                {isBreathActive ? 'Deactivate' : 'Begin Breathing'}
             </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showInterstitial && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-surface-dim">
             <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-xl w-full bg-white rounded-[48px] p-12 text-center space-y-12 shadow-2xl border border-surface-container"
             >
                <div className="space-y-4">
                   <div className="w-16 h-16 bg-primary/5 rounded-3xl mx-auto flex items-center justify-center text-primary">
                     <Brain size={32} />
                   </div>
                   <h2 className="text-4xl font-serif italic text-primary leading-tight">Wait, take a moment.</h2>
                   <p className="text-secondary text-sm font-medium leading-relaxed italic opacity-70">
                     You are about to open <strong>{showInterstitial.name}</strong>. 
                     Are you opening this for a real purpose, or is this an unconscious reaction?
                   </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setShowInterstitial(null)}
                    className="py-5 bg-surface-dim text-secondary rounded-2xl font-bold text-[10px] uppercase tracking-widest"
                  >
                    Close & Reflect
                  </button>
                  <a 
                    href={showInterstitial.url.startsWith('http') ? showInterstitial.url : `https://${showInterstitial.url}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setShowInterstitial(null)}
                    className="py-5 bg-primary text-on-primary rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2"
                  >
                    I am sure <ExternalLink size={14} />
                  </a>
                </div>

                <p className="text-[10px] text-secondary italic opacity-50 underline cursor-pointer" onClick={() => setShowInterstitial(null)}>
                  "One breath can change the trajectory of an hour."
                </p>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
