
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Brain, Key, Check, ChevronRight, X, ExternalLink } from 'lucide-react';

interface OnboardingTourProps {
  onComplete: () => void;
}

export default function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Welcome to Mindspace",
      description: "A private, AI-native scrapbook for your digital life. Your data is stored 100% in your own Google Drive, keeping it free and private forever.",
      icon: <Brain className="text-primary" size={48} />,
      action: "Get Started"
    },
    {
      title: "Zero-Cost Intelligence",
      description: "To keep this app free for everyone, you use your own Gemini API key. This means zero developer costs and maximum privacy for your thoughts.",
      icon: <Sparkles className="text-primary" size={48} />,
      action: "Next"
    },
    {
      title: "How to get your Key",
      description: "1. Visit Google AI Studio\n2. Click 'Get API Key'\n3. Copy the key and paste it here in Settings.",
      icon: <Key className="text-primary" size={48} />,
      link: "https://aistudio.google.com/app/apikey",
      action: "Got it!"
    }
  ];

  const current = steps[step];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-surface-dim/80 backdrop-blur-xl">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-white rounded-[40px] p-10 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-surface-container flex">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={`flex-1 transition-all duration-500 ${i <= step ? 'bg-primary' : ''}`} 
            />
          ))}
        </div>

        <button 
          onClick={onComplete}
          className="absolute top-6 right-6 p-2 hover:bg-surface-dim rounded-full text-secondary"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center gap-6 mt-4">
          <motion.div
            key={step}
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            className="p-6 bg-surface-dim rounded-[32px]"
          >
            {current.icon}
          </motion.div>

          <div className="space-y-3">
            <h2 className="text-2xl font-serif text-primary italic font-bold">{current.title}</h2>
            <p className="text-sm text-secondary leading-relaxed whitespace-pre-line">
              {current.description}
            </p>
          </div>

          {current.link && (
            <a 
              href={current.link} 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary hover:underline"
            >
              Get my API Key <ExternalLink size={14} />
            </a>
          )}

          <button
            onClick={() => {
              if (step < steps.length - 1) {
                setStep(step + 1);
              } else {
                onComplete();
              }
            }}
            className="w-full py-4 bg-primary text-on-primary rounded-2xl font-bold text-sm uppercase tracking-widest shadow-lg flex items-center justify-center gap-2"
          >
            {current.action}
            {step < steps.length - 1 ? <ChevronRight size={18} /> : <Check size={18} />}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
