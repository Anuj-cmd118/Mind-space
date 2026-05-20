import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Coffee, 
  Brain, 
  Timer as TimerIcon, 
  Volume2, 
  VolumeX, 
  Plus, 
  Minus, 
  Sparkles, 
  Award,
  Bell,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

interface ModeConfig {
  label: string;
  minutes: number;
  colorClass: string;
  glowColor: string;
  accentText: string;
  bgHexClass: string;
}

const MODES: Record<TimerMode, ModeConfig> = {
  work: { 
    label: 'Focus State', 
    minutes: 25, 
    colorClass: 'text-amber-500', 
    glowColor: 'rgba(245, 158, 11, 0.25)', 
    accentText: 'text-amber-800 bg-amber-50 border-amber-200/50',
    bgHexClass: 'from-amber-50/40 via-white to-stone-50/40'
  },
  shortBreak: { 
    label: 'Short Break', 
    minutes: 5, 
    colorClass: 'text-emerald-500', 
    glowColor: 'rgba(16, 185, 129, 0.25)', 
    accentText: 'text-emerald-800 bg-emerald-54 border-emerald-200/50',
    bgHexClass: 'from-emerald-50/40 via-white to-stone-50/40'
  },
  longBreak: { 
    label: 'Deep Integration', 
    minutes: 15, 
    colorClass: 'text-blue-500', 
    glowColor: 'rgba(59, 130, 246, 0.25)', 
    accentText: 'text-blue-800 bg-blue-50 border-blue-200/50',
    bgHexClass: 'from-blue-50/40 via-white to-stone-50/40'
  },
};

// Web Audio API Synthesizer Engine
const playAcousticCue = (type: 'workDone' | 'breakDone' | 'tick' | 'tap' | 'start' | 'stop') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    if (type === 'workDone') {
      // Harmonic Ascent (peaceful meditation chime: E5 -> A5 -> C#6 -> E6)
      const freqs = [659.25, 880.00, 1109.73, 1318.51];
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.18);
        
        gain.gain.setValueAtTime(0, now + idx * 0.18);
        gain.gain.linearRampToValueAtTime(0.3, now + idx * 0.18 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.18 + 1.5);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.18);
        osc.stop(now + idx * 0.18 + 1.6);
      });
    } else if (type === 'breakDone') {
      // Warm alert sweep (high-clarity notification: G5 -> C6)
      const notes = [783.99, 1046.50];
      notes.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + idx * 0.15);
        
        gain.gain.setValueAtTime(0, now + idx * 0.15);
        gain.gain.linearRampToValueAtTime(0.24, now + idx * 0.15 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.15 + 0.4);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.15);
        osc.stop(now + idx * 0.15 + 0.5);
      });
    } else if (type === 'tick') {
      // Ultra-gentle woody metronome tick (high freq decay)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(450, now + 0.015);
      
      gain.gain.setValueAtTime(0.015, now); // soft
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.025);
    } else if (type === 'tap') {
      // Crisp subtle button feedback
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.setValueAtTime(120, now + 0.02);
      
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'start') {
      // Beautiful upward organic synthesizer sweep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(261.63, now); // C4
      osc.frequency.exponentialRampToValueAtTime(523.25, now + 0.25); // C5
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'stop') {
      // Low grounding hum when pausing
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(329.63, now); // E4
      osc.frequency.exponentialRampToValueAtTime(164.81, now + 0.2); // E3
      
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch (e) {
    console.debug('AudioContext not permitted or blocked:', e);
  }
};

export default function PomodoroTimer() {
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(MODES.work.minutes * 60);
  const [isActive, setIsActive] = useState(false);
  
  // Custom states for user experience options
  const [customMinutes, setCustomMinutes] = useState<Record<TimerMode, number>>({
    work: 25,
    shortBreak: 5,
    longBreak: 15
  });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [tickingPulse, setTickingPulse] = useState(false);
  const [completedSessionsCount, setCompletedSessionsCount] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('mindspace_pomodoro_completed');
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  });
  const [celebrateMsg, setCelebrateMsg] = useState<string | null>(null);

  // Sync timing if custom bounds are requested
  const resetTimer = useCallback(() => {
    setIsActive(false);
    setTimeLeft(customMinutes[mode] * 60);
  }, [mode, customMinutes]);

  useEffect(() => {
    resetTimer();
  }, [mode, resetTimer]);

  // Audio trigger abstraction
  const triggerAudio = useCallback((type: 'workDone' | 'breakDone' | 'tick' | 'tap' | 'start' | 'stop') => {
    if (soundEnabled) {
      playAcousticCue(type);
    }
  }, [soundEnabled]);

  // Main tick loop
  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            return 0;
          }
          if (tickingPulse) {
            triggerAudio('tick');
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      
      if (mode === 'work') {
        const nextCount = completedSessionsCount + 1;
        setCompletedSessionsCount(nextCount);
        try {
          localStorage.setItem('mindspace_pomodoro_completed', String(nextCount));
        } catch {}
        
        triggerAudio('workDone');
        setCelebrateMsg("Glorious work! Your mind is a glowing garden. Take an exquisite break.");
      } else {
        triggerAudio('breakDone');
        setCelebrateMsg("Refreshed & Recharged. Ready to align back into focus?");
      }
      
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(mode === 'work' ? "Focus session completed!" : "Break is over! Time to focus.");
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode, tickingPulse, triggerAudio, completedSessionsCount]);

  const toggleTimer = () => {
    if (isActive) {
      triggerAudio('stop');
      setIsActive(false);
    } else {
      triggerAudio('start');
      setIsActive(true);
    }
  };

  const handleReset = () => {
    triggerAudio('tap');
    resetTimer();
  };

  const changeDuration = (amount: number) => {
    triggerAudio('tap');
    setCustomMinutes(prev => {
      const updated = {
        ...prev,
        [mode]: Math.max(1, Math.min(120, prev[mode] + amount))
      };
      // Shift current time left too if timer hasn't started yet
      if (!isActive) {
        setTimeLeft(updated[mode] * 60);
      }
      return updated;
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const selectMode = (m: TimerMode) => {
    triggerAudio('tap');
    setMode(m);
  };

  const currentMaxSeconds = customMinutes[mode] * 60;
  const progress = currentMaxSeconds > 0 ? 1 - timeLeft / currentMaxSeconds : 0;
  const activeColor = MODES[mode].colorClass;
  const config = MODES[mode];

  return (
    <div className={`transition-all duration-700 bg-gradient-to-b ${config.bgHexClass} border border-surface-container/50 rounded-[48px] p-8 md:p-14 shadow-2xl flex flex-col md:flex-row gap-10 items-center justify-between`}>
      {/* Visual Workspace & Controllers */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-8 w-full">
        {/* Toggle Controls & Presets */}
        <div className="flex flex-wrap justify-between items-center w-full gap-4 pb-4 border-b border-surface-container/30">
          <div className="flex items-center gap-1.5 p-1 bg-surface-container/50 backdrop-blur-sm rounded-full border border-surface-container/30">
            {(Object.keys(MODES) as TimerMode[]).map((m) => (
              <button
                key={m}
                onClick={() => selectMode(m)}
                className={`px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.16em] transition-all duration-300 ${
                  mode === m 
                    ? 'bg-primary text-on-primary shadow-lg scale-105' 
                    : 'text-secondary hover:bg-black/5 opacity-60'
                }`}
              >
                {MODES[m].label.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Quick Audio Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                triggerAudio('tap');
                setTickingPulse(!tickingPulse);
              }}
              title={tickingPulse ? "Disable Ticking Beats" : "Enable Ticking Beats"}
              className={`p-2.5 rounded-xl border transition-all text-xs flex items-center gap-1.5 uppercase font-sans font-bold tracking-wider ${
                tickingPulse 
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-200' 
                  : 'bg-white/60 hover:bg-white text-secondary border-surface-container'
              }`}
            >
              <RefreshCw size={14} className={isActive && tickingPulse ? 'animate-spin' : ''} />
              <span className="text-[9px]">Tick</span>
            </button>

            <button
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) playAcousticCue('tap');
              }}
              className="p-2.5 rounded-xl border border-surface-container bg-white/60 hover:bg-white text-secondary transition-all"
              title={soundEnabled ? "Mute Acoustic Cues" : "Unmute Acoustic Cues"}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>
        </div>

        {/* Timer Radial Sphere */}
        <div className="relative w-72 h-72 md:w-80 md:h-80 flex items-center justify-center">
          {/* Breathing ambient backdrop glow */}
          <motion.div 
            animate={isActive ? {
              scale: [1, 1.08, 1],
              opacity: [0.18, 0.32, 0.18],
            } : { scale: 1, opacity: 0.1 }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            style={{ backgroundColor: config.glowColor }}
            className="absolute inset-[15px] rounded-full blur-3xl filter transition-all duration-1000"
          />

          {/* Svg Radial Ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="144"
              cy="144"
              r="132"
              fill="none"
              stroke="rgba(0,0,0,0.03)"
              strokeWidth="5"
              className="md:cx-[160] md:cy-[160] md:r-[144]"
            />
            <motion.circle
              cx="144"
              cy="144"
              r="132"
              fill="none"
              stroke="currentColor"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray="829.38" // 2 * PI * 132
              animate={{ strokeDashoffset: 829.38 * (1 - progress) }}
              transition={{ duration: 1, ease: "linear" }}
              className={`${activeColor} transition-all duration-1000 md:cx-[160] md:cy-[160] md:r-[144] md:strokeDasharray-[904.77]`} // Adapt values seamlessly
              style={{
                strokeDasharray: typeof window !== 'undefined' && window.innerWidth >= 768 ? '904.77' : '829.38',
              }}
            />
          </svg>

          {/* Inside Circle Data */}
          <div className="flex flex-col items-center gap-3 relative z-10 text-center">
            {/* Visual status indicators */}
            <div className={`px-3 py-1 text-[8px] uppercase tracking-widest font-extrabold rounded-full border border-current scale-90 ${activeColor}`}>
              {isActive ? "Flow Active" : "Paused state"}
            </div>

            <motion.div 
              key={timeLeft}
              initial={{ scale: 0.97, opacity: 0.95 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-7xl md:text-8xl font-serif italic text-primary tracking-tighter tabular-nums"
            >
              {formatTime(timeLeft)}
            </motion.div>

            {/* Visual state icon */}
            <div className={`px-4 py-1.5 rounded-full border text-[9px] uppercase tracking-wider font-semibold font-serif flex items-center gap-2 ${config.accentText}`}>
              {mode === 'work' ? (
                <Brain size={12} className="text-amber-500 animate-pulse" />
              ) : (
                <Coffee size={12} className="text-emerald-500" />
              )}
              {config.label}
            </div>
          </div>
        </div>

        {/* Dynamic Adjustments & Start controls */}
        <div className="flex flex-col items-center gap-4 w-full">
          {/* Increment / Decrement Time */}
          <div className="flex items-center gap-5">
            <button
              onClick={() => changeDuration(-5)}
              className="p-2.5 rounded-full bg-white hover:bg-stone-50 border border-surface-container active:scale-95 text-secondary transition-all"
              title="Minus 5 Minutes"
            >
              <Minus size={14} />
            </button>
            <span className="text-[10px] uppercase font-bold tracking-widest text-secondary opacity-60">
              {customMinutes[mode]} Min Target
            </span>
            <button
              onClick={() => changeDuration(5)}
              className="p-2.5 rounded-full bg-white hover:bg-stone-50 border border-surface-container active:scale-95 text-secondary transition-all"
              title="Add 5 Minutes"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-8 pt-2">
            <button
              onClick={handleReset}
              className="p-4 hover:bg-surface-container/60 bg-white/40 border border-surface-container rounded-full transition-all text-secondary active:scale-90"
              title="Reset Timer"
              aria-label="Reset Timer"
            >
              <RotateCcw size={22} className="text-secondary" />
            </button>

            <button
              onClick={toggleTimer}
              className={`p-9 rounded-[36px] shadow-xl text-white transition-all active:scale-95 border-4 border-white/60 group relative overflow-hidden ${
                isActive ? 'bg-primary text-on-primary' : `${mode === 'work' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-primary'}`
              }`}
              aria-label={isActive ? "Pause Timer" : "Start Timer"}
            >
              {isActive ? <Pause size={38} fill="currentColor" /> : <Play size={38} fill="currentColor" className="translate-x-0.5" />}
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <div className="w-[56px] h-[56px] flex items-center justify-center pointer-events-none opacity-0">
              <TimerIcon size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Visual Zen Dashboard Sidebar */}
      <div className="w-full md:w-80 bg-white/40 backdrop-blur-md rounded-[32px] p-6 border border-surface-container/50 flex flex-col gap-6 justify-between shrink-0 self-stretch">
        <div className="space-y-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-surface-container/30">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <Sparkles size={16} />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-primary">Garden Stats</h4>
              <p className="text-[10px] text-secondary font-medium">Cognitive stamina logger</p>
            </div>
          </div>

          {/* Spark completes list */}
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-2xl border border-surface-container/50 space-y-1">
              <div className="text-[9px] uppercase font-bold text-secondary opacity-50 tracking-wider">Completed Pulses</div>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-serif italic text-primary font-bold">{completedSessionsCount}</span>
                <span className="text-[10px] text-secondary leading-normal italic">sessions grown today</span>
              </div>
            </div>

            {/* Custom completed streak container */}
            <div className="space-y-2">
              <div className="text-[9px] uppercase font-bold text-secondary opacity-50 tracking-wider flex justify-between">
                <span>Memory Garden State</span>
                <span>{completedSessionsCount % 4} / 4 Loop</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 bg-surface-dim/50 rounded-xl border border-surface-container/30">
                {Array.from({ length: 4 }).map((_, idx) => {
                  const isFilled = (completedSessionsCount % 4) > idx || completedSessionsCount > 0 && (completedSessionsCount % 4 === 0);
                  const isCurrent = completedSessionsCount % 4 === idx && isActive && mode === 'work';
                  return (
                    <motion.div
                      key={idx}
                      animate={isCurrent ? { scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] } : {}}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className={`h-5 w-5 rounded-full flex items-center justify-center border transition-all ${
                        isFilled 
                          ? 'bg-amber-100 border-amber-300 text-amber-600' 
                          : 'bg-white border-surface-container text-secondary opacity-40'
                      }`}
                    >
                      <Award size={10} className={isFilled ? 'stroke-[2.5px]' : 'stroke-[1.5px]'} />
                    </motion.div>
                  );
                })}
              </div>
              <p className="text-[10px] leading-relaxed text-secondary italic opacity-60">
                Every index of 4 complete cycles grants you a Deep Integration slot of 15 minutes.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-surface-container/20 space-y-2">
          <div className="flex gap-2 items-center text-[10px] font-sans font-bold uppercase tracking-wider text-primary">
            <Bell size={12} className="text-secondary" />
            <span>Audio & Visual Cues</span>
          </div>
          <p className="text-[10px] leading-relaxed text-secondary italic opacity-60">
            Sounds originate organically via high-clarity synthesized chimes, clicks and gentle second pulses.
          </p>
        </div>
      </div>

      {/* Completion congratulations dialog */}
      <AnimatePresence>
        {celebrateMsg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="max-w-md w-full bg-white rounded-[36px] p-8 text-center space-y-6 shadow-2xl border border-surface-container"
            >
              <div className="w-16 h-16 bg-amber-50 rounded-full mx-auto flex items-center justify-center text-amber-600">
                <Sparkles size={28} className="animate-spin" style={{ animationDuration: '6s' }} />
              </div>
              <div className="space-y-2">
                <h3 className="font-serif italic font-bold text-2xl text-primary leading-tight">Stage Completed</h3>
                <p className="text-secondary text-sm font-medium leading-relaxed italic">{celebrateMsg}</p>
              </div>
              <button
                onClick={() => setCelebrateMsg(null)}
                className="w-full py-4 bg-primary text-on-primary rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all"
              >
                Acknowledge & Continue
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
