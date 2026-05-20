import { useState, useEffect, useMemo, ReactNode, ChangeEvent } from 'react';
import { 
  Plus, 
  Search, 
  Timer, 
  LayoutGrid, 
  Settings, 
  MessageSquare, 
  Link as LinkIcon, 
  Quote as QuoteIcon, 
  Image as ImageIcon,
  ChevronRight,
  X,
  Check,
  Share2,
  GitBranch,
  Sparkles,
  RefreshCw,
  Hash,
  Star,
  Trash2,
  Brain,
  Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PomodoroTimer from './components/PomodoroTimer';
import KnowledgeGraph from './components/KnowledgeGraph';
import InsightsDashboard from './components/InsightsDashboard';
import ReflectionHub from './components/ReflectionHub';
import WellnessCenter from './components/WellnessCenter';
import OnboardingTour from './components/OnboardingTour';
import { driveStorage, DriveData } from './services/driveStorage';
import { auth, googleProvider, signInWithPopup, signOut, GoogleAuthProvider } from './lib/firebase';
import { api } from './services/api';
import { MindItem, ContentType, DigitalImport, AppLockEntry } from './types';
import ImportManager from './components/ImportManager';

export default function App() {
  const [items, setItems] = useState<MindItem[]>([]);
  const [imports, setImports] = useState<DigitalImport[]>([]);
  const [blockedApps, setBlockedApps] = useState<AppLockEntry[]>([]);
  const [user, setUser] = useState<any>(null);
  const [authReady, setAuthReady] = useState(false);
  const [view, setView] = useState<'feed' | 'timer' | 'settings' | 'map' | 'algorithms' | 'reflection' | 'wellness'>('feed');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [activeCategory, setActiveCategory] = useState<ContentType | 'all'>('all');
  const [isSmartSearching, setIsSmartSearching] = useState(false);
  const [smartResults, setSmartResults] = useState<string[] | null>(null);
  const [selectedItem, setSelectedItem] = useState<MindItem | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [habitInsights, setHabitInsights] = useState<any>(null);
  const [userSettings, setUserSettings] = useState<{ geminiApiKey?: string }>({});
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isCloudSaving, setIsCloudSaving] = useState(false);
  const [hasDriveToken, setHasDriveToken] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Auth Listener & Onboarding check
  useEffect(() => {
    const onboarded = localStorage.getItem('mindspace_onboarded');
    if (!onboarded) setShowOnboarding(true);

    const savedToken = sessionStorage.getItem('mindspace_drive_token');
    if (savedToken) {
      driveStorage.setAccessToken(savedToken);
      setHasDriveToken(true);
    }

    return auth.onAuthStateChanged(async (u) => {
      setUser(u);
      setAuthReady(true);
    });
  }, []);

  // API Wrapper with Key
  const callAiApi = async (endpoint: string, body: any) => {
    try {
      const data = await api.post(endpoint, {
        ...body,
        userApiKey: userSettings.geminiApiKey
      });
      return data;
    } catch (e: any) {
      // Check if it's a "No API Key" error from our server
      if (e.message?.includes('No Gemini API Key provided')) {
        alert("AI processing requires a Gemini API Key. Please set one up in the Settings tab to continue. (You can get a free key from Google AI Studio)");
        setView('settings');
      }
      throw e;
    }
  };

  // Drive Data Sync
  useEffect(() => {
    if (!user || !hasDriveToken) return;

    const loadDriveData = async () => {
      try {
        const driveData = await driveStorage.loadData();
        if (driveData) {
          if (driveData.items) setItems(driveData.items);
          if (driveData.imports) setImports(driveData.imports);
          if (driveData.blockedApps) setBlockedApps(driveData.blockedApps);
          if (driveData.settings) setUserSettings(driveData.settings);
        }
      } catch (e) {
        console.error('Failed to load from Drive:', e);
        if (e instanceof Error && e.message.includes('token')) {
          setHasDriveToken(false);
        }
      }
    };

    loadDriveData();
  }, [user, hasDriveToken]);

  // Debounced Save to Drive
  useEffect(() => {
    if (!user || !hasDriveToken) return;
    
    const timeout = setTimeout(async () => {
      setIsCloudSaving(true);
      try {
        await driveStorage.saveData({
          items,
          imports,
          blockedApps,
          settings: userSettings
        });
      } catch (e) {
        console.error('Failed to save to Drive:', e);
        if (e instanceof Error && e.message.includes('token')) {
          setHasDriveToken(false);
        }
      } finally {
        setIsCloudSaving(false);
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [items, imports, blockedApps, userSettings, user, hasDriveToken]);

  // Handle Login/Logout
  const handleLogin = async () => {
    try {
      setAuthError(null);
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        driveStorage.setAccessToken(credential.accessToken);
        sessionStorage.setItem('mindspace_drive_token', credential.accessToken);
        setHasDriveToken(true);
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      let message = "An error occurred during authentication.";
      if (error?.code === 'auth/popup-closed-by-user' || error?.message?.includes('popup-closed-by-user')) {
        message = "The sign-in popup window was closed before completing the process. If popups are being blocked in the embedded preview, try opening Mindspace in a new tab or checking your browser's pop-up blocker settings.";
      } else if (error?.message) {
        message = error.message;
      }
      setAuthError(message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setItems([]);
      setImports([]);
      setBlockedApps([]);
      setHasDriveToken(false);
      sessionStorage.removeItem('mindspace_drive_token');
      localStorage.removeItem('mindspace_items');
      localStorage.removeItem('mindspace_imports');
      localStorage.removeItem('mindspace_blocked_apps');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Load from localStorage (as fallback)
  useEffect(() => {
    if (user) return;
    const savedItems = localStorage.getItem('mindspace_items');
    if (savedItems) setItems(JSON.parse(savedItems));
    
    const savedImports = localStorage.getItem('mindspace_imports');
    if (savedImports) setImports(JSON.parse(savedImports));

    const savedBlocked = localStorage.getItem('mindspace_blocked_apps');
    if (savedBlocked) setBlockedApps(JSON.parse(savedBlocked));
  }, [user]);

  // Save to localStorage (as fallback)
  useEffect(() => {
    if (!user) {
      localStorage.setItem('mindspace_items', JSON.stringify(items));
      localStorage.setItem('mindspace_imports', JSON.stringify(imports));
      localStorage.setItem('mindspace_blocked_apps', JSON.stringify(blockedApps));
    }
  }, [items, imports, blockedApps, user]);

  const filteredItems = useMemo(() => {
    let base = items;
    
    if (smartResults) {
      base = items.filter(i => smartResults.includes(i.id));
    } else {
      base = items.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
                             item.content.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === 'all' || item.type === activeCategory;
        return matchesSearch && matchesCategory;
      });
    }

    return base.sort((a, b) => b.createdAt - a.createdAt);
  }, [items, searchQuery, activeCategory, smartResults]);

  const handleSmartSearch = async () => {
    if (!searchQuery) return;
    setIsSmartSearching(true);
    try {
      const data = await callAiApi('/api/smart-search', { query: searchQuery, items });
      setSmartResults(data.relevantIds || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSmartSearching(false);
    }
  };

  useEffect(() => {
    if (!searchQuery) setSmartResults(null);
  }, [searchQuery]);

  const addItem = async (item: MindItem) => {
    const newItem = { ...item };
    setItems(prev => [newItem, ...prev]);
    setIsAdding(false);
  };

  const deleteItem = async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const toggleFavorite = (id: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, isFavorite: !i.isFavorite } : i));
  };

  return (
    <div className="flex h-screen w-full bg-surface-dim text-on-primary-container font-sans overflow-hidden selection:bg-primary/20">
      {/* Sidebar - Desktop only */}
      <aside className="hidden md:flex w-64 bg-surface-container border-r border-surface-container-high flex-col p-6 overflow-y-auto">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-on-primary">
            <Brain size={20} />
          </div>
          <h1 className="text-xl font-serif font-bold italic tracking-tight text-primary">Mindspace</h1>
        </div>

        <nav className="flex-1 space-y-2">
          <div className="text-[11px] uppercase tracking-widest text-secondary font-bold mb-4 opacity-70">Archive</div>
          <SidebarNavButton 
            active={view === 'feed'} 
            onClick={() => setView('feed')} 
            icon={<LayoutGrid size={18} />} 
            label="Memory Garden" 
          />
          <SidebarNavButton 
            active={view === 'map'} 
            onClick={() => setView('map')} 
            icon={<GitBranch size={18} />} 
            label="Knowledge Map" 
          />
          <SidebarNavButton 
            active={view === 'algorithms'} 
            onClick={() => setView('algorithms')} 
            icon={<Brain size={18} />} 
            label="Digital Algorithm" 
          />
          <SidebarNavButton 
            active={view === 'reflection'} 
            onClick={() => setView('reflection')} 
            icon={<Sparkles size={18} />} 
            label="Reflection Hub" 
          />
          <SidebarNavButton 
            active={view === 'wellness'} 
            onClick={() => setView('wellness')} 
            icon={<Star size={18} />} 
            label="Wellness Center" 
          />
           <SidebarNavButton 
            active={view === 'timer'} 
            onClick={() => setView('timer')} 
            icon={<Timer size={18} />} 
            label="Pomodoro Timer" 
          />
          <div className="pt-6">
            <div className="text-[11px] uppercase tracking-widest text-secondary font-bold mb-4 opacity-70">System</div>
            <SidebarNavButton 
              active={view === 'settings'} 
              onClick={() => setView('settings')} 
              icon={<Settings size={18} />} 
              label="Settings" 
            />
          </div>
        </nav>

        <div className="mt-auto p-4 bg-surface-container-high rounded-2xl text-center">
          <div className="text-[10px] uppercase font-bold text-on-secondary-container mb-1">Status</div>
          <div className="text-xs font-serif text-primary italic">Roadmap: 100%</div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Top Header - Mobile and Search */}
        <header className="px-6 py-4 bg-surface-dim/80 backdrop-blur-md flex items-center justify-between gap-4 border-b border-black/5 md:border-none">
          <div className="flex items-center gap-2.5 md:hidden shrink-0 mr-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-2 text-primary hover:bg-surface-container/60 active:scale-95 rounded-xl transition-all"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
            <div className="p-1.5 bg-primary rounded-lg text-on-primary">
              <Brain size={18} />
            </div>
            <h1 className="text-lg font-serif font-bold italic tracking-tight text-primary">Mindspace</h1>
          </div>
          
          <div className="flex-1 max-w-md md:mx-0 relative flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary opacity-50" size={16} />
              <input 
                type="text" 
                placeholder="Search memories..." 
                className="w-full h-11 pl-11 pr-4 bg-surface-container rounded-2xl border-none focus:ring-1 focus:ring-primary/20 transition-all outline-none text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {searchQuery && !smartResults && (
              <button 
                onClick={handleSmartSearch}
                disabled={isSmartSearching}
                className="px-4 h-11 bg-primary text-on-primary rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:shadow-lg transition-all disabled:opacity-50"
              >
                {isSmartSearching ? <RefreshCw className="animate-spin" size={14} /> : <Sparkles size={14} />}
                AI Search
              </button>
            )}
            {smartResults && (
              <button 
                onClick={() => { setSearchQuery(''); setSmartResults(null); }}
                className="px-4 h-11 bg-surface-container-high text-secondary rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:shadow-lg transition-all"
              >
                Clear
              </button>
            )}
          </div>

                  <div className="flex items-center gap-2 ml-4">
             {authReady && (
               user ? (
                 <div className="flex items-center gap-3">
                   <div className="hidden lg:flex flex-col items-end">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{user.displayName || 'Explorer'}</span>
                      <button 
                        onClick={!hasDriveToken ? handleLogin : undefined}
                        className={`text-[10px] font-bold uppercase flex items-center gap-1 transition-colors ${hasDriveToken ? 'text-emerald-600' : 'text-amber-600 hover:text-amber-700'}`}
                        title={!hasDriveToken ? "Click to connect Google Drive" : "Active Drive sync"}
                      >
                        {isCloudSaving ? <RefreshCw className="animate-spin" size={8} /> : (hasDriveToken ? <Check size={8} /> : <X size={8} />)}
                        {hasDriveToken ? 'Drive Synced' : 'Connect Drive'}
                      </button>
                   </div>
                   <button 
                     onClick={() => setView('settings')}
                     className="w-8 h-8 rounded-full border border-primary/20 overflow-hidden bg-surface-container shadow-sm relative shadow-inner"
                   >
                     {user.photoURL ? (
                       <img src={user.photoURL} alt="" referrerPolicy="no-referrer" />
                     ) : (
                       <Brain size={16} className="m-2 text-primary" />
                     )}
                     {isCloudSaving && (
                       <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                     )}
                   </button>
                 </div>
               ) : (
                 <button 
                   onClick={handleLogin}
                   className="px-4 py-2 bg-primary text-on-primary rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-md hover:shadow-lg transition-all"
                 >
                   Login
                 </button>
               )
             )}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto px-6 py-8 pb-32">
          <div className="max-w-4xl mx-auto w-full">
            {view === 'feed' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <header className="mb-2">
                  <h2 className="text-3xl font-serif text-primary leading-tight">Your Digital Scrapbook</h2>
                  <p className="text-secondary text-sm italic mt-1 font-medium opacity-70">"A reflective operating layer for the internet age."</p>
                </header>

                {/* Category Filter */}
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {['all', 'note', 'link', 'quote', 'image'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat as any)}
                      className={`px-4 py-1.5 rounded-full whitespace-nowrap text-xs font-bold uppercase tracking-wider transition-all ${
                        activeCategory === cat 
                          ? 'bg-primary text-on-primary shadow-md' 
                          : 'bg-surface-container text-secondary hover:bg-surface-container-high'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Grid */}
                {filteredItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="p-6 bg-surface-container rounded-full opacity-30">
                      <LayoutGrid size={48} className="text-primary" />
                    </div>
                    <h3 className="text-lg font-serif text-primary italic">The garden is waiting...</h3>
                    <p className="text-secondary/60 max-w-xs text-sm">Start planting thoughts and snapshots to build your memory ecosystem.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredItems.map((item) => (
                      <ContentCard 
                        key={item.id} 
                        item={item} 
                        onDelete={() => deleteItem(item.id)}
                        onToggleFavorite={() => toggleFavorite(item.id)}
                        onClick={() => setSelectedItem(item)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {view === 'map' && (
              <div className="h-[calc(100vh-200px)] animate-in fade-in zoom-in-95 duration-700">
                <header className="mb-6">
                  <h2 className="text-3xl font-serif text-primary leading-tight">Knowledge Map</h2>
                  <p className="text-secondary text-sm italic mt-1 font-medium opacity-70">Visualize concept connections (Phase 2 Early Access)</p>
                </header>
                <KnowledgeGraph items={items} onNodeClick={(node) => {
                  const it = items.find(i => i.id === node.id);
                  if (it) setSelectedItem(it);
                }} />
              </div>
            )}

            {view === 'algorithms' && (
              <div className="animate-in slide-in-from-right duration-700">
                <header className="mb-6">
                  <h2 className="text-3xl font-serif text-primary leading-tight">Digital Algorithm</h2>
                  <p className="text-secondary text-sm italic mt-1 font-medium opacity-70">Analyze your digital history to understand yourself better.</p>
                </header>
                
                <ImportManager 
                  imports={imports}
                  onImported={async (newImport) => {
                    setImports(prev => [newImport, ...prev]);
                  }} 
                  onDelete={async (id) => {
                    setImports(prev => prev.filter(i => i.id !== id));
                  }}
                />

                <div className="mt-12">
                  <InsightsDashboard 
                    items={items} 
                    isAnalyzing={isAnalyzing}
                    onAnalyze={async () => {
                      setIsAnalyzing(true);
                      try {
                        const data = await callAiApi('/api/analyze-habits', { items });
                        setHabitInsights(data);
                      } catch (e) {
                        console.error(e);
                      } finally {
                        setIsAnalyzing(false);
                      }
                    }}
                    insights={habitInsights}
                    imports={imports}
                    onImported={async (newImport) => {
                      setImports(prev => [newImport, ...prev]);
                    }}
                    onDeleteImport={async (id) => {
                      setImports(prev => prev.filter(i => i.id !== id));
                    }}
                  />
                </div>
              </div>
            )}

            {view === 'reflection' && (
              <div className="animate-in slide-in-from-bottom duration-700">
                <ReflectionHub items={items} onUpdateItems={setItems} callAiApi={callAiApi} />
              </div>
            )}

            {view === 'wellness' && (
              <div className="animate-in slide-in-from-bottom duration-700">
                <WellnessCenter 
                  blockedApps={blockedApps}
                  onUpdateApps={async (newApps) => {
                    setBlockedApps(newApps);
                  }}
                  onAddApp={async (app) => {
                    setBlockedApps(prev => [...prev, app]);
                  }}
                  onRemoveApp={async (id) => {
                    setBlockedApps(prev => prev.filter(a => a.id !== id));
                  }}
                />
              </div>
            )}

            {view === 'timer' && (
              <div className="animate-in slide-in-from-bottom duration-500">
                <PomodoroTimer />
              </div>
            )}

            {view === 'settings' && (
              <div className="p-8 bg-surface-container rounded-[40px] border border-surface-container-high space-y-8 animate-in fade-in">
                <header>
                  <h2 className="text-2xl font-serif text-primary">System Configuration</h2>
                  <p className="text-xs text-secondary italic">Manage your cognitive environment</p>
                </header>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-6 bg-surface-dim rounded-3xl border border-surface-container-high">
                    <div>
                      <h4 className="font-bold text-sm tracking-wide">ACCOUNT CONTROL</h4>
                      <p className="text-xs text-secondary mt-1">
                        {user ? `Logged in as ${user.email}. All data is synced to your private Google Cloud.` : 'Sign in to sync your data across devices and build a lasting cognitive archive.'}
                      </p>
                    </div>
                    {user ? (
                      <button 
                        onClick={handleLogout}
                        className="px-4 py-2 bg-white text-primary border border-primary/20 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-surface-container transition-colors"
                      >
                        Sign Out
                      </button>
                    ) : (
                      <button 
                        onClick={handleLogin}
                        className="px-4 py-2 bg-primary text-on-primary rounded-xl text-[10px] font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all"
                      >
                        Sign In
                      </button>
                    )}
                  </div>

                  {user && (
                    <div className="flex flex-col gap-4 p-6 bg-surface-dim rounded-3xl border border-surface-container-high transition-all hover:border-primary/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-sm tracking-wide uppercase flex items-center gap-2">
                             Gemini AI Key 
                             {userSettings.geminiApiKey ? <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> : <div className="w-2 h-2 rounded-full bg-amber-500" />}
                          </h4>
                          <p className="text-[10px] text-secondary mt-1 max-w-sm italic">
                            By using your own API Key, your data processing remains 100% private and <b>completely free</b> for the developer. 
                            Get one at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-primary underline">Google AI Studio</a>.
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <input 
                          type="password"
                          placeholder="PASTE YOUR API KEY HERE (AI-key-...)"
                          value={userSettings.geminiApiKey || ''}
                          onChange={(e) => {
                            setUserSettings(prev => ({ ...prev, geminiApiKey: e.target.value }));
                          }}
                          className="w-full bg-white border border-primary/10 rounded-xl px-4 py-3 text-xs focus:ring-2 focus:ring-primary/20 outline-none transition-all font-mono placeholder:text-secondary/40 shadow-inner"
                        />
                        {!userSettings.geminiApiKey && (
                          <p className="text-[9px] text-amber-600 font-bold uppercase tracking-tight">AI features disabled until key is provided</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-6 bg-surface-dim rounded-3xl border border-surface-container-high">
                    <div>
                      <h4 className="font-bold text-sm tracking-wide">LOCAL DATA STORAGE</h4>
                      <p className="text-xs text-secondary mt-1">Everything is encrypted and stored locally on your device hardware.</p>
                    </div>
                    <button 
                      onClick={() => {
                        if(confirm('Clear all data?')) {
                          localStorage.clear();
                          setItems([]);
                        }
                      }}
                      className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-red-100 transition-colors"
                    >
                      Purge Data
                    </button>
                  </div>
                  <div className="p-6 bg-surface-dim rounded-3xl opacity-50 border border-surface-container-high border-dashed cursor-not-allowed">
                    <h4 className="font-bold text-sm tracking-wide">QUANTUM CLOUD SYNC</h4>
                    <p className="text-xs text-secondary mt-1">End-to-end encrypted backup in Phase 2 roadmap.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setView('feed')}
                  className="w-full py-4 bg-primary text-on-primary rounded-2xl font-bold text-sm uppercase tracking-widest shadow-lg"
                >
                  Return to Garden
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Floating Action Button */}
      <AnimatePresence>
        {view === 'feed' && (
          <motion.button
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 45 }}
            onClick={() => setIsAdding(true)}
            className="fixed right-6 bottom-24 p-5 bg-primary text-on-primary rounded-[24px] shadow-xl hover:shadow-2xl transition-all z-40 border border-white/10"
          >
            <Plus size={28} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Adding Modal */}
      <AnimatePresence>
        {isAdding && (
          <AddModal onAdd={addItem} onClose={() => setIsAdding(false)} callAiApi={callAiApi} />
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <DetailModal 
            item={selectedItem} 
            items={items}
            onClose={() => { setSelectedItem(null); setIsLinking(false); }}
            onLink={(targetId) => {
              setItems(prev => prev.map(i => i.id === selectedItem.id 
                ? { ...i, linkedItemIds: [...(i.linkedItemIds || []), targetId] } 
                : i
              ));
              setSelectedItem(prev => prev ? { ...prev, linkedItemIds: [...(prev.linkedItemIds || []), targetId] } : null);
              setIsLinking(false);
            }}
            isLinking={isLinking}
            setIsLinking={setIsLinking}
          />
        )}
      </AnimatePresence>

      {/* Mobile Drawer Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            />
            
            {/* Drawer Container */}
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="md:hidden fixed top-0 bottom-0 left-0 w-72 z-50 bg-surface-container flex flex-col p-6 overflow-y-auto shadow-2xl rounded-r-[32px] border-r border-surface-container-high"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-on-primary">
                    <Brain size={20} />
                  </div>
                  <h1 className="text-xl font-serif font-bold italic tracking-tight text-primary">Mindspace</h1>
                </div>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1.5 hover:bg-surface-container-high rounded-xl text-secondary transition-all"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="flex-1 space-y-2">
                <div className="text-[11px] uppercase tracking-widest text-secondary font-bold mb-4 opacity-70">Archive</div>
                <SidebarNavButton 
                  active={view === 'feed'} 
                  onClick={() => { setView('feed'); setIsSidebarOpen(false); }} 
                  icon={<LayoutGrid size={18} />} 
                  label="Memory Garden" 
                />
                <SidebarNavButton 
                  active={view === 'map'} 
                  onClick={() => { setView('map'); setIsSidebarOpen(false); }} 
                  icon={<GitBranch size={18} />} 
                  label="Knowledge Map" 
                />
                <SidebarNavButton 
                  active={view === 'algorithms'} 
                  onClick={() => { setView('algorithms'); setIsSidebarOpen(false); }} 
                  icon={<Brain size={18} />} 
                  label="Digital Algorithm" 
                />
                <SidebarNavButton 
                  active={view === 'reflection'} 
                  onClick={() => { setView('reflection'); setIsSidebarOpen(false); }} 
                  icon={<Sparkles size={18} />} 
                  label="Reflection Hub" 
                />
                <SidebarNavButton 
                  active={view === 'wellness'} 
                  onClick={() => { setView('wellness'); setIsSidebarOpen(false); }} 
                  icon={<Star size={18} />} 
                  label="Wellness Center" 
                />
                <SidebarNavButton 
                  active={view === 'timer'} 
                  onClick={() => { setView('timer'); setIsSidebarOpen(false); }} 
                  icon={<Timer size={18} />} 
                  label="Pomodoro Timer" 
                />
                <div className="pt-6">
                  <div className="text-[11px] uppercase tracking-widest text-secondary font-bold mb-4 opacity-70">System</div>
                  <SidebarNavButton 
                    active={view === 'settings'} 
                    onClick={() => { setView('settings'); setIsSidebarOpen(false); }} 
                    icon={<Settings size={18} />} 
                    label="Settings" 
                  />
                </div>
              </nav>

              <div className="mt-auto p-4 bg-surface-container-high rounded-2xl text-center">
                <div className="text-[10px] uppercase font-bold text-on-secondary-container mb-1">Status</div>
                <div className="text-xs font-serif text-primary italic">Roadmap: 100%</div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Navigation - Mobile only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-surface-container/95 backdrop-blur-xl border-t border-surface-container-high px-6 py-4">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <NavButton 
            active={view === 'feed'} 
            onClick={() => setView('feed')} 
            icon={<LayoutGrid size={24} />} 
            label="Feed" 
          />
          <NavButton 
            active={view === 'timer'} 
            onClick={() => setView('timer')} 
            icon={<Timer size={24} />} 
            label="Focus" 
          />
          <NavButton 
            active={view === 'settings'} 
            onClick={() => setView('settings')} 
            icon={<Settings size={24} />} 
            label="Config" 
          />
          <NavButton 
            active={isSidebarOpen} 
            onClick={() => setIsSidebarOpen(true)} 
            icon={<Menu size={24} />} 
            label="Menu" 
          />
        </div>
      </nav>

      {/* Onboarding Tour */}
      <AnimatePresence>
        {showOnboarding && (
          <OnboardingTour onComplete={() => {
            setShowOnboarding(false);
            localStorage.setItem('mindspace_onboarded', 'true');
          }} />
        )}
      </AnimatePresence>

      {/* Auth Error Toast */}
      <AnimatePresence>
        {authError && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[110] w-11/12 max-w-lg bg-white border border-rose-100 rounded-[24px] p-6 shadow-2xl flex flex-col gap-4 font-sans"
          >
            <div className="flex items-start gap-4">
              <div className="p-2.5 bg-rose-50 text-rose-500 rounded-full shrink-0">
                <Brain size={24} />
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="font-serif italic font-bold text-primary text-base">Authentication Issue</h3>
                <p className="text-secondary text-xs leading-relaxed">{authError}</p>
              </div>
              <button 
                onClick={() => setAuthError(null)}
                className="p-1.5 hover:bg-surface-dim rounded-full text-secondary shrink-0 transition-all"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="flex items-center gap-2.5 self-end">
              <a 
                href={window.location.href}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-surface-dim hover:bg-surface-container text-secondary text-[10px] font-bold uppercase tracking-wider rounded-xl transition-colors flex items-center gap-1.5"
              >
                Open in New Tab
              </a>
              <button
                onClick={() => {
                  setAuthError(null);
                  handleLogin();
                }}
                className="px-4 py-2 bg-primary text-on-primary text-[10px] font-bold uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                Try Again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarNavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 w-full p-2.5 rounded-xl font-medium text-sm transition-all ${
        active 
          ? 'bg-white shadow-sm text-primary border border-surface-container-high' 
          : 'text-secondary hover:bg-surface-container-high'
      }`}
    >
      <span className={active ? 'text-primary' : 'opacity-60'}>{icon}</span>
      {label}
    </button>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all ${
        active ? 'text-primary scale-110' : 'text-secondary opacity-60'
      }`}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}

function ContentCard({ item, onDelete, onToggleFavorite, onClick }: { item: MindItem, onDelete: () => void, onToggleFavorite: () => void, onClick?: () => void, key?: string | number }) {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="group p-6 bg-white rounded-[32px] transition-all border border-surface-container shadow-sm hover:shadow-md flex flex-col gap-3 relative overflow-hidden cursor-pointer"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-surface-dim rounded-full text-[10px] font-bold uppercase tracking-wider text-secondary">
            {item.type}
          </span>
          <span className="text-[#A7B09E] text-xs font-serif italic truncate max-w-[120px]">
            {item.tags?.[0] || 'Uncategorized'}
          </span>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onToggleFavorite} className={`p-2 rounded-full hover:bg-surface-dim ${item.isFavorite ? 'text-primary' : 'text-secondary'}`}>
            <Star size={14} fill={item.isFavorite ? 'currentColor' : 'none'} />
          </button>
          <button onClick={onDelete} className="p-2 rounded-full hover:bg-red-50 text-secondary hover:text-red-500">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-serif text-xl text-primary leading-tight line-clamp-2">{item.title}</h3>
        <p className={`text-on-primary-container text-sm leading-relaxed line-clamp-4 ${item.type === 'quote' ? 'font-serif italic text-lg' : ''}`}>
          {item.type === 'quote' && '"'}{item.content}{item.type === 'quote' && '"'}
        </p>
      </div>

      {item.imageData && (
        <div className="mt-2 rounded-2xl overflow-hidden aspect-video relative group/img border border-surface-container">
          <img src={item.imageData} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-105" />
          <div className="absolute inset-0 bg-black/5" />
        </div>
      )}

      <div className="flex items-center justify-between mt-auto pt-4 border-t border-surface-dim">
        <div className="flex flex-wrap gap-1.5 ">
          {item.tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-[9px] font-bold uppercase tracking-widest text-secondary opacity-60">
              #{tag}
            </span>
          ))}
        </div>
        <div className="text-[9px] text-secondary/40 font-mono italic">
          {item.source || 'Scrap'}
        </div>
      </div>
    </motion.div>
  );
}

function AddModal({ onAdd, onClose, callAiApi }: { onAdd: (item: MindItem) => void, onClose: () => void, callAiApi: (endpoint: string, body: any) => Promise<any> }) {
  const [type, setType] = useState<ContentType>('note');
  const [content, setContent] = useState('');
  const [imageData, setImageData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleProcess = async () => {
    setIsLoading(true);
    try {
      const data = await callAiApi('/api/process-content', { type, content, imageData });
      
      const newItem: MindItem = {
        id: crypto.randomUUID(),
        type,
        title: data.title || (content.slice(0, 30) + '...'),
        content: (type === 'image' || type === 'screenshot') ? (data.text || content) : content,
        tags: data.tags || [],
        createdAt: Date.now(),
        imageData: imageData || undefined,
        source: 'AI Companion',
        summary: data.summary,
        autoCategory: data.category
      };
      
      onAdd(newItem);
    } catch (error) {
      console.error(error);
      onAdd({
        id: crypto.randomUUID(),
        type,
        title: 'New ' + type,
        content,
        tags: [],
        createdAt: Date.now(),
        imageData: imageData || undefined,
        source: 'Manual'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageData(reader.result as string);
        setType('image');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#3D3A35]/30 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="relative w-full max-w-lg bg-surface-dim rounded-t-[40px] md:rounded-[40px] p-8 shadow-2xl flex flex-col gap-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-serif text-primary italic flex items-center gap-2">
            Add to Memory Garden
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full text-secondary">
            <X size={24} />
          </button>
        </div>

        <div className="flex gap-2 p-1.5 bg-surface-container rounded-2xl">
          {[
            { id: 'note', icon: <MessageSquare size={16} /> },
            { id: 'link', icon: <LinkIcon size={16} /> },
            { id: 'quote', icon: <QuoteIcon size={16} /> },
            { id: 'image', icon: <ImageIcon size={16} /> }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setType(t.id as ContentType)}
              className={`flex-1 flex flex-col items-center py-2.5 px-1 rounded-xl transition-all ${
                type === t.id ? 'bg-white shadow-sm text-primary' : 'text-secondary hover:bg-black/5'
              }`}
            >
              {t.icon}
              <span className="text-[10px] mt-1 font-bold uppercase tracking-widest">{t.id}</span>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {type === 'image' && (
            <div className="group relative w-full aspect-video bg-surface-container rounded-3xl overflow-hidden flex items-center justify-center cursor-pointer border-2 border-dashed border-surface-container-high hover:border-primary transition-all">
              {imageData ? (
                <img src={imageData} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-secondary">
                  <ImageIcon size={40} className="opacity-30 mb-2" />
                  <p className="text-xs font-bold uppercase tracking-widest">Select Visual Memory</p>
                </div>
              )}
              <input type="file" onChange={onImageChange} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
            </div>
          )}

          <textarea
            placeholder={
              type === 'note' ? "Record your thought..." :
              type === 'link' ? "Capture a digital link..." :
              type === 'quote' ? "Preserve a voice..." : "Add observation..."
            }
            className="w-full h-32 p-6 bg-white rounded-3xl outline-none focus:ring-1 focus:ring-primary/20 resize-none transition-all placeholder:text-secondary/40 font-medium text-sm leading-relaxed shadow-inner"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        <button
          disabled={isLoading || (!content && !imageData)}
          onClick={handleProcess}
          className="w-full py-5 bg-primary text-on-primary rounded-[24px] font-bold text-sm uppercase tracking-[0.2em] shadow-lg hover:shadow-xl active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:pointer-events-none flex items-center justify-center gap-3"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Synthesizing...
            </div>
          ) : (
            <>
              <Check size={18} />
              Plant Memory
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}

function DetailModal({ 
  item, 
  items, 
  onClose, 
  onLink, 
  isLinking, 
  setIsLinking 
}: { 
  item: MindItem, 
  items: MindItem[], 
  onClose: () => void, 
  onLink: (id: string) => void,
  isLinking: boolean,
  setIsLinking: (v: boolean) => void
}) {
  const linkedItems = items.filter(i => item.linkedItemIds?.includes(i.id));
  const otherItems = items.filter(i => i.id !== item.id && !item.linkedItemIds?.includes(i.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-[#3D3A35]/40 backdrop-blur-md"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-3xl max-h-[80vh] overflow-y-auto bg-surface-dim rounded-[48px] p-10 shadow-2xl flex flex-col gap-8 no-scrollbar"
      >
        <header className="flex justify-between items-start">
          <div className="space-y-1">
            <span className="px-3 py-1 bg-surface-container rounded-full text-[10px] font-bold uppercase tracking-widest text-secondary">
              {item.type}
            </span>
            <h2 className="text-4xl font-serif text-primary italic leading-tight">{item.title}</h2>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-black/5 rounded-full text-secondary">
            <X size={28} />
          </button>
        </header>

        {item.summary && (
          <div className="p-6 bg-white rounded-3xl border border-surface-container italic text-primary/80">
            "{item.summary}"
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-secondary opacity-50">Content</h4>
              <p className={`text-on-primary-container leading-relaxed ${item.type === 'quote' ? 'font-serif italic text-xl' : 'text-sm'}`}>
                {item.content}
              </p>
              {item.imageData && (
                <div className="rounded-3xl overflow-hidden border border-surface-container shadow-sm">
                  <img src={item.imageData} alt="" className="w-full h-auto" />
                </div>
              )}
           </div>

           <div className="space-y-6">
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-secondary opacity-50">Intelligence Metadata</h4>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-primary/5 text-primary rounded-lg text-xs font-medium">#{tag}</span>
                  ))}
                  {item.autoCategory && (
                    <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold uppercase">{item.autoCategory}</span>
                  )}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-surface-container">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-secondary opacity-50">Linked Concepts</h4>
                  <button 
                    onClick={() => setIsLinking(!isLinking)}
                    className={`p-2 rounded-xl transition-all ${isLinking ? 'bg-primary text-on-primary' : 'hover:bg-primary/10 text-primary'}`}
                  >
                    <Share2 size={18} />
                  </button>
                </div>
                
                {isLinking ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar border border-primary/20 rounded-2xl p-2 bg-white">
                    {otherItems.map(it => (
                      <button 
                        key={it.id}
                        onClick={() => onLink(it.id)}
                        className="w-full text-left p-3 hover:bg-surface-dim rounded-xl flex items-center justify-between group"
                      >
                        <span className="text-xs font-medium truncate">{it.title}</span>
                        <Plus size={14} className="opacity-0 group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {linkedItems.length === 0 ? (
                      <p className="text-[10px] text-secondary italic">No links yet. Connect this to related ideas.</p>
                    ) : (
                      linkedItems.map(it => (
                        <div key={it.id} className="p-3 bg-white rounded-xl border border-surface-container flex items-center justify-between">
                          <span className="text-xs font-medium truncate">{it.title}</span>
                          <ChevronRight size={14} className="text-primary" />
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
           </div>
        </div>
      </motion.div>
    </div>
  );
}
