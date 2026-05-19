import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { Brain, Zap, Sparkles, Clock, AlertCircle, RefreshCw, Database, BarChart2, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import { MindItem } from '../types';
import { useState } from 'react';
import ImportManager from './ImportManager';

import { DigitalImport } from '../types';

interface DashboardProps {
  items: MindItem[];
  insights: any;
  isAnalyzing: boolean;
  onAnalyze: () => void;
  imports: DigitalImport[];
  onImported: (data: DigitalImport) => void;
  onDeleteImport: (id: string) => void;
}

export default function InsightsDashboard({ 
  items, 
  insights, 
  isAnalyzing, 
  onAnalyze,
  imports,
  onImported,
  onDeleteImport
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'insights' | 'history'>('insights');
  const typeDistribution = items.reduce((acc: any, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(typeDistribution).map(([name, value]) => ({ name, value }));
  const COLORS = ['#5A5A40', '#A7B09E', '#D9C5B2', '#7D6B5D', '#EBE7E0'];

  return (
    <div className="space-y-8 pb-10">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-serif text-primary leading-tight">Know Your Algorithm</h2>
          <p className="text-secondary text-sm italic mt-1 font-medium opacity-70">
            "Patterns are not identity. You are the best judge of your own character."
          </p>
        </div>

        <div className="flex gap-1 p-1 bg-surface-container rounded-2xl">
          <button 
            onClick={() => setActiveTab('insights')}
            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'insights' ? 'bg-white shadow-sm text-primary' : 'text-secondary'}`}
          >
            <BarChart2 size={14} className="inline mr-2" />
            Insights
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-white shadow-sm text-primary' : 'text-secondary'}`}
          >
            <Database size={14} className="inline mr-2" />
            Digital History
          </button>
        </div>
      </header>

      {activeTab === 'insights' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Stats */}
          <section className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-[40px] p-8 border border-surface-container shadow-sm flex flex-col gap-6">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary opacity-50">Content Composition</h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-4 justify-center">
                {pieData.map((d, index) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">{d.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-primary rounded-[40px] p-8 shadow-xl text-white flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles size={20} className="text-primary-container" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">Reflection Companion</span>
                </div>
                {insights ? (
                   <p className="text-sm leading-relaxed mb-6 italic opacity-90">
                    {insights.reflection}
                  </p>
                ) : (
                  <p className="text-sm leading-relaxed mb-6 opacity-70">
                    Your digital scraps hold the keys to your cognitive focus. Let AI analyze your recent patterns.
                  </p>
                )}
              </div>
              
              <button 
                onClick={onAnalyze}
                disabled={isAnalyzing || items.length < 3}
                className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-[24px] text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isAnalyzing ? <RefreshCw className="animate-spin" size={16} /> : <Zap size={16} />}
                {insights ? 'Re-Analyze Patterns' : 'Synthesize Insights'}
              </button>
            </div>
            
            <div className="bg-white rounded-[40px] p-8 border border-surface-container shadow-sm space-y-6 md:col-span-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary opacity-50">Attention Distribution (Digital Wellbeing)</h3>
                <Activity size={16} className="text-primary opacity-30" />
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Social', value: 120 },
                    { name: 'Prod', value: 80 },
                    { name: 'Edu', value: 45 },
                    { name: 'Video', value: 150 },
                    { name: 'Gaming', value: 30 }
                  ]}>
                    <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#5A5A40" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-secondary italic opacity-60 text-center">"Your attention is your most scarce resource. Spend it with intention."</p>
            </div>
          </div>

          {insights && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[40px] p-8 border border-surface-container shadow-sm space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-4 text-center">
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary opacity-50">Core Themes</h4>
                  <div className="flex flex-col gap-2">
                    {insights.themes.map((t: string) => (
                      <span key={t} className="px-3 py-2 bg-surface-dim rounded-xl text-xs font-serif italic text-primary">{t}</span>
                    ))}
                  </div>
                </div>
                <div className="space-y-4 text-center">
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary opacity-50">Cognitive Balance</h4>
                  <p className="text-xs text-on-primary-container font-medium px-4">{insights.balance}</p>
                </div>
                <div className="space-y-4 text-center">
                  <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary opacity-50">Consumption Rhythm</h4>
                  <p className="text-xs text-on-primary-container font-medium px-4">{insights.rhythm}</p>
                </div>
              </div>
            </motion.div>
          )}
        </section>

        {/* Right Sidebar Stats */}
        <section className="lg:col-span-4 space-y-6">
           <div className="bg-surface-container rounded-[40px] p-8 border border-surface-container-high space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-widest text-secondary opacity-70">Cognitive Metrics</h3>
              <div className="space-y-6">
                <MetricBar 
                  label="Clarity" 
                  value={insights?.metrics?.['Cognitive Clarity'] || 0} 
                  color="bg-primary" 
                />
                <MetricBar 
                  label="Attention" 
                  value={insights?.metrics?.['Attention Span'] || 0} 
                  color="bg-primary-container" 
                />
                <MetricBar 
                  label="Creativity" 
                  value={insights?.metrics?.['Creative Input'] || 0} 
                  color="bg-[#7D6B5D]" 
                />
              </div>
              
              <div className="pt-6 border-t border-surface-container-high flex gap-3 items-start">
                <AlertCircle size={16} className="text-secondary opacity-50 shrink-0" />
                <p className="text-[10px] text-secondary italic opacity-60 leading-relaxed italic">
                  Metrics are based on your saved items and interactions. Use them for reflection, not diagnosis.
                </p>
              </div>
           </div>

           <div className="bg-white rounded-[40px] p-8 border border-surface-container shadow-sm flex flex-col items-center justify-center text-center gap-4">
              <div className="p-4 bg-surface-dim rounded-full">
                <Clock size={24} className="text-primary" />
              </div>
              <h4 className="text-sm font-bold uppercase tracking-widest text-primary">Intentional Pauses</h4>
              <p className="text-xs text-secondary italic">You have recorded {items.length} moments of digital intentionality.</p>
           </div>
        </section>
      </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="animate-in fade-in duration-500"
        >
          <ImportManager 
            imports={imports} 
            onImported={onImported} 
            onDelete={onDeleteImport} 
          />
        </motion.div>
      )}
    </div>
  );
}

function MetricBar({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">{label}</span>
        <span className="text-lg font-serif italic text-primary">{value}%</span>
      </div>
      <div className="w-full h-1.5 bg-white rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className={`h-full ${color}`} 
        />
      </div>
    </div>
  );
}
