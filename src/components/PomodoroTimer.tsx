import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Coffee, Brain, Timer as TimerIcon } from 'lucide-react';
import { motion } from 'motion/react';

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

const MODES: Record<TimerMode, { label: string, minutes: number, color: string }> = {
  work: { label: 'Focus', minutes: 25, color: 'bg-primary' },
  shortBreak: { label: 'Short Break', minutes: 5, color: 'bg-emerald-500' },
  longBreak: { label: 'Long Break', minutes: 15, color: 'bg-blue-500' },
};

export default function PomodoroTimer() {
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(MODES.work.minutes * 60);
  const [isActive, setIsActive] = useState(false);

  const resetTimer = useCallback(() => {
    setIsActive(false);
    setTimeLeft(MODES[mode].minutes * 60);
  }, [mode]);

  useEffect(() => {
    resetTimer();
  }, [mode, resetTimer]);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      // Play a subtle sound or notify
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`${MODES[mode].label} finished!`);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode]);

  const toggleTimer = () => setIsActive(!isActive);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = 1 - timeLeft / (MODES[mode].minutes * 60);

  return (
    <div className="flex flex-col items-center justify-center py-10 space-y-12 bg-white/60 backdrop-blur-md rounded-[56px] border border-surface-container p-16 shadow-lg">
      <div className="flex gap-2 p-1.5 bg-surface-container rounded-[28px] shadow-inner">
        {(Object.keys(MODES) as TimerMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-8 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${
              mode === m 
                ? 'bg-white shadow-md text-primary scale-105' 
                : 'text-secondary hover:bg-black/5 opacity-60'
            }`}
          >
            {MODES[m].label}
          </button>
        ))}
      </div>

      <div className="relative w-80 h-80 flex items-center justify-center">
        {/* Decorative Ring */}
        <div className="absolute inset-0 rounded-full border-[12px] border-surface-dim opacity-40 blur-sm" />
        
        {/* Progress Ring */}
        <svg className="absolute inset-0 w-full h-full -rotate-90 drop-shadow-sm">
          <circle
            cx="160"
            cy="160"
            r="140"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-surface-container"
          />
          <motion.circle
            cx="160"
            cy="160"
            r="140"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="879.6" // 2 * PI * 140
            animate={{ strokeDashoffset: 879.6 * (1 - progress) }}
            transition={{ duration: 1, ease: "linear" }}
            className={`text-primary transition-all duration-1000`}
          />
        </svg>

        <div className="flex flex-col items-center gap-2 relative z-10">
          <motion.div 
            key={timeLeft}
            initial={{ scale: 0.95, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-8xl font-serif italic text-primary tracking-tighter tabular-nums"
          >
            {formatTime(timeLeft)}
          </motion.div>
          <div className="text-secondary font-bold uppercase tracking-[0.3em] text-[10px] flex items-center gap-2 opacity-50 bg-surface-container/50 px-4 py-1.5 rounded-full">
            {mode === 'work' ? <Brain size={14} className="text-primary" /> : <Coffee size={14} className="text-emerald-600" />}
            {MODES[mode].label}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <button
          onClick={resetTimer}
          className="p-5 hover:bg-surface-container rounded-full transition-all text-secondary opacity-60 hover:opacity-100"
        >
          <RotateCcw size={28} />
        </button>

        <button
          onClick={toggleTimer}
          className={`p-10 rounded-[44px] shadow-2xl transition-all active:scale-95 border-4 border-white/20 group relative overflow-hidden ${
            isActive ? 'bg-surface-container text-primary' : 'bg-primary text-on-primary'
          }`}
        >
          {isActive ? <Pause size={44} fill="currentColor" /> : <Play size={44} fill="currentColor" className="translate-x-1" />}
          
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        <button
          className="p-5 hover:bg-surface-container rounded-full transition-all text-secondary opacity-20 pointer-events-none"
        >
          <TimerIcon size={28} />
        </button>
      </div>

      <div className="max-w-xs text-center border-t border-surface-container pt-8 w-full">
        <p className="text-[11px] text-secondary font-serif italic opacity-70 leading-relaxed uppercase tracking-wider">
          "The present moment is the only one in which we truly live."
        </p>
      </div>
    </div>
  );
}
