import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Info, 
  Youtube, 
  Instagram, 
  Twitter, 
  Clock, 
  ShieldCheck, 
  X, 
  ChevronRight,
  Database,
  Trash2,
  Lock,
  Globe,
  FileJson,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DigitalImport } from '../types';

interface ImportManagerProps {
  onImported: (data: DigitalImport) => void;
  imports: DigitalImport[];
  onDelete: (id: string) => void;
}

const SOURCES = [
  { id: 'youtube', name: 'YouTube', icon: <Youtube className="text-red-500" />, desc: 'Watch history & preferences' },
  { id: 'instagram', name: 'Instagram', icon: <Instagram className="text-pink-500" />, desc: 'Saved posts & reels' },
  { id: 'tiktok', name: 'TikTok', icon: <Database className="text-black" />, desc: 'Engagement patterns' },
  { id: 'screentime', name: 'Screen Time', icon: <Clock className="text-blue-500" />, desc: 'Daily device metrics' },
];

export default function ImportManager({ onImported, imports, onDelete }: ImportManagerProps) {
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedSource) return;

    setIsProcessing(true);
    // Simulate local processing
    setTimeout(() => {
      const newImport: DigitalImport = {
        id: crypto.randomUUID(),
        source: selectedSource as any,
        fileName: file.name,
        importedAt: Date.now(),
        dataCount: Math.floor(Math.random() * 1000) + 100, // Simulated count
        status: 'ready'
      };
      setIsProcessing(false);
      setSelectedSource(null);
      onImported(newImport);
    }, 2000);
  };

  const deleteImport = (id: string) => {
    onDelete(id);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <section className="bg-primary/5 rounded-[40px] p-8 border border-primary/10">
             <div className="flex items-center gap-3 mb-4">
                <ShieldCheck size={20} className="text-primary" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Privacy First Protocol</h3>
             </div>
             <p className="text-xs text-secondary leading-relaxed font-medium italic opacity-70">
              "You choose what Mindspace sees. Imports are optional and processed locally. We don't sell your data—ever."
             </p>
          </section>

          <div className="grid grid-cols-2 gap-4">
            {SOURCES.map(source => (
              <button 
                key={source.id}
                onClick={() => setSelectedSource(source.id)}
                className="p-6 bg-white rounded-3xl border border-surface-container hover:shadow-md transition-all text-left flex flex-col gap-4 group"
              >
                <div className="w-10 h-10 bg-surface-dim rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  {source.icon}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider">{source.name}</h4>
                  <p className="text-[10px] text-secondary opacity-60 mt-1">{source.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-[48px] border border-surface-container p-8 shadow-sm">
           <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary mb-6 opacity-50">Active Influences</h3>
           <div className="space-y-4">
              {imports.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                  <Database size={40} />
                  <p className="text-sm font-serif italic italic">No digital history imported yet.</p>
                </div>
              ) : (
                imports.map(item => (
                  <div key={item.id} className="p-4 bg-surface-dim rounded-2xl border border-surface-container flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                          {SOURCES.find(s => s.id === item.source)?.icon}
                       </div>
                       <div>
                          <p className="text-xs font-bold text-primary">{item.fileName}</p>
                          <p className="text-[10px] text-secondary opacity-60">
                            {item.dataCount} events synced • {new Date(item.importedAt).toLocaleDateString()}
                          </p>
                       </div>
                    </div>
                    <button onClick={() => deleteImport(item.id)} className="p-2 text-secondary hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
           </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedSource && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSource(null)}
              className="absolute inset-0 bg-black/20 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-2xl bg-white rounded-[48px] p-10 shadow-2xl flex flex-col gap-8"
            >
              <header className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-surface-dim rounded-2xl flex items-center justify-center">
                    {SOURCES.find(s => s.id === selectedSource)?.icon}
                  </div>
                  <div>
                    <h3 className="text-2xl font-serif italic text-primary">Import from {SOURCES.find(s => s.id === selectedSource)?.name}</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-secondary opacity-50">Local Processing Only</p>
                  </div>
                </div>
                <button onClick={() => setSelectedSource(null)} className="p-3 bg-surface-dim rounded-full text-secondary">
                  <X size={20} />
                </button>
              </header>

              <div className="space-y-6">
                <div className="bg-surface-dim rounded-3xl p-6 space-y-4">
                  <div className="flex items-center gap-2">
                    <Info size={16} className="text-primary" />
                    <h4 className="text-xs font-bold uppercase tracking-widest text-primary">How to get your data</h4>
                  </div>
                  <ol className="space-y-3 text-sm text-secondary font-medium list-decimal list-inside px-2">
                    <li>Go to your {SOURCES.find(s => s.id === selectedSource)?.name} account settings.</li>
                    <li>Look for "Download Your Information" or "Google Takeout".</li>
                    <li>Select "{selectedSource === 'screentime' ? 'Digital Wellbeing' : 'Watch History'}" the format should be <strong>JSON</strong> or <strong>CSV</strong>.</li>
                    <li>Once you receive the file, upload it here.</li>
                  </ol>
                </div>

                <div className="p-8 border-2 border-dashed border-surface-container rounded-3xl flex flex-col items-center justify-center text-center gap-4 hover:border-primary/20 transition-all">
                  {isProcessing ? (
                    <div className="flex flex-col items-center gap-4">
                      <Zap className="animate-pulse text-amber-500" size={48} />
                      <p className="text-sm font-serif italic">Analyzing data locally...</p>
                    </div>
                  ) : (
                    <>
                      <FileJson size={48} className="text-primary opacity-20" />
                      <p className="text-sm font-serif italic text-primary">Drop your data export file here</p>
                      <button 
                        onClick={() => fileRef.current?.click()}
                        className="px-8 py-4 bg-primary text-on-primary rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2"
                      >
                        <Upload size={16} /> Select File
                      </button>
                      <input 
                        type="file" 
                        ref={fileRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                        accept=".json,.csv"
                      />
                    </>
                  )}
                </div>
              </div>

              <footer className="pt-6 border-t border-surface-dim flex items-center gap-3">
                 <Lock size={16} className="text-emerald-600" />
                 <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">End-to-End Local Analysis</p>
              </footer>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
