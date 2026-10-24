import React, { useState, useEffect } from 'react';
import { BookOpen, Volume2, VolumeX, Clock, History, Music, Sparkles } from 'lucide-react';
import { sound } from '../utils/audioEngine';
import { SessionHistoryModal } from './SessionHistoryModal';
import {
  recordSessionStart,
  getActivityHistory,
  clearActivityHistory,
  ActivityHistoryEntry,
} from '../utils/sessionTracker';

interface HeaderProps {
  activeView: 'workshop' | 'library' | 'circle' | 'sandbox';
  onViewChange: (view: 'workshop' | 'library' | 'circle' | 'sandbox') => void;
  onOpenTheory: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onViewChange,
  onOpenTheory,
  isMuted,
  onToggleMute,
}) => {
  // Session tracking: records current start time and stores history in localStorage
  const [{ current: currentSession }] = useState(() => recordSessionStart());
  const [activityHistory, setActivityHistory] = useState<ActivityHistoryEntry[]>(() => getActivityHistory());
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Sync activity history dynamically when new patterns are loaded or history is cleared
  useEffect(() => {
    const handleUpdate = () => {
      setActivityHistory(getActivityHistory());
    };

    window.addEventListener('harmonix:activity-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('harmonix:activity-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Most recent pattern load entry, if any
  const lastPatternLoad = activityHistory.find((entry) => entry.type === 'pattern_load');

  // Measure exact header height so pinned elements can sit flush right below it
  const headerRef = React.useRef<HTMLElement>(null);
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.offsetHeight;
        document.documentElement.style.setProperty('--app-header-height', `${height}px`);
      }
    };
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && headerRef.current) {
      ro = new ResizeObserver(updateHeaderHeight);
      ro.observe(headerRef.current);
    }
    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
      ro?.disconnect();
    };
  }, []);

  return (
    <header
      ref={headerRef}
      id="app-main-header"
      className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md"
    >
      {/* Top Utility Ribbon: Session Launch Time & Last Loaded Pattern */}
      <div className="w-full bg-[#070b13] border-b border-slate-900 py-1.5 px-4 sm:px-6 text-[11px] text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                Uruchomiono:{' '}
                <strong className="text-amber-300 font-mono font-semibold">{currentSession.timeString}</strong>
              </span>
            </div>

            {lastPatternLoad ? (
              <div className="flex items-center gap-1.5 text-slate-300">
                <Music className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>
                  Ostatni wzorzec:{' '}
                  <strong className="text-sky-300 font-semibold">{lastPatternLoad.title}</strong>{' '}
                  <span className="text-slate-400 font-mono text-[10px]">({lastPatternLoad.timeString})</span>
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-slate-500 italic hidden sm:flex">
                <Sparkles className="w-3 h-3 text-slate-500" />
                <span>Brak załadowanego wzorca z biblioteki</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsHistoryModalOpen(true)}
              title="Wyświetl historię uruchomień i załadowanych wzorców"
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-400/15 hover:bg-amber-400 text-amber-300 hover:text-slate-950 border border-amber-400/35 text-[11px] font-bold transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <History className="w-3 h-3 shrink-0" />
              <span>Historia ćwiczeń ({activityHistory.length})</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 py-3">
        {/* Zone 1: Brand Wordmark */}
        <div
          onClick={() => onViewChange('workshop')}
          className="text-lg sm:text-xl font-black tracking-tight text-white whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-2"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
          <span>Harmonix</span>
        </div>

        {/* Zone 2: Navigation tabs */}
        <div className="hidden md:flex items-center">
          <nav className="flex items-center gap-6 text-sm font-medium text-slate-300">
            <button
              type="button"
              onClick={() => onViewChange('workshop')}
              className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 ${
                activeView === 'workshop'
                  ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ćwiczenia
            </button>
            <button
              type="button"
              onClick={() => onViewChange('library')}
              className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 ${
                activeView === 'library'
                  ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Wzorce
            </button>
            <button
              type="button"
              onClick={() => onViewChange('circle')}
              className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 ${
                activeView === 'circle'
                  ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Koło Kwintowe
            </button>
            <button
              type="button"
              onClick={() => onViewChange('sandbox')}
              className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 ${
                activeView === 'sandbox'
                  ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Swobodne Pianino
            </button>
          </nav>
        </div>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onToggleMute}
            title={isMuted ? 'Włącz dźwięk' : 'Wycisz dźwięk'}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            type="button"
            onClick={onOpenTheory}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-md shadow-amber-400/20 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Teoria Muzyki</span>
          </button>
        </div>
      </div>

      {/* Mobile nav bar row */}
      <div className="md:hidden border-t border-slate-900 bg-slate-950">
        <div className="flex items-center justify-around px-2 py-2 text-xs">
          <button
            type="button"
            onClick={() => onViewChange('workshop')}
            className={`px-2.5 py-1 rounded-lg ${activeView === 'workshop' ? 'text-amber-400 font-bold bg-slate-900' : 'text-slate-400'}`}
          >
            Ćwiczenia
          </button>
          <button
            type="button"
            onClick={() => onViewChange('library')}
            className={`px-2.5 py-1 rounded-lg ${activeView === 'library' ? 'text-amber-400 font-bold bg-slate-900' : 'text-slate-400'}`}
          >
            Wzorce
          </button>
          <button
            type="button"
            onClick={() => onViewChange('circle')}
            className={`px-2.5 py-1 rounded-lg ${activeView === 'circle' ? 'text-amber-400 font-bold bg-slate-900' : 'text-slate-400'}`}
          >
            Koło Kwintowe
          </button>
          <button
            type="button"
            onClick={() => onViewChange('sandbox')}
            className={`px-2.5 py-1 rounded-lg ${activeView === 'sandbox' ? 'text-amber-400 font-bold bg-slate-900' : 'text-slate-400'}`}
          >
            Pianino
          </button>
        </div>
      </div>

      {/* Session & Activity History Modal */}
      <SessionHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        history={activityHistory}
        onClearHistory={() => {
          const cleared = clearActivityHistory();
          setActivityHistory(cleared);
        }}
      />
    </header>
  );
};
