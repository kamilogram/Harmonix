import React, { useState, useEffect } from 'react';
import { BookOpen, Volume2, VolumeX, History } from 'lucide-react';
import { sound } from '../utils/audioEngine';
import { SessionHistoryModal } from './SessionHistoryModal';
import {
  recordSessionStart,
  getActivityHistory,
  clearActivityHistory,
  ActivityHistoryEntry,
} from '../utils/sessionTracker';

interface HeaderProps {
  activeView: 'workshop' | 'library' | 'guess' | 'circle' | 'sandbox';
  onViewChange: (view: 'workshop' | 'library' | 'guess' | 'circle' | 'sandbox') => void;
  onOpenTheory: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  instrument: 'piano' | 'guitar';
  onSelectInstrument: (inst: 'piano' | 'guitar') => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onViewChange,
  onOpenTheory,
  isMuted,
  onToggleMute,
  instrument,
  onSelectInstrument,
}) => {
  // Session tracking: records current start time and stores history in localStorage
  useEffect(() => {
    recordSessionStart();
  }, []);
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
      {/* Top Utility Strip: Only History Button as requested */}
      <div className="w-full bg-[#070b13] border-b border-slate-900 py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-end">
          <button
            type="button"
            onClick={() => setIsHistoryModalOpen(true)}
            title="Otwórz historię uruchomień i załadowanych wzorców"
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-400/15 hover:bg-amber-400 text-amber-300 hover:text-slate-950 border border-amber-400/35 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <History className="w-3.5 h-3.5 shrink-0" />
            <span>Historia ({activityHistory.length})</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 sm:gap-8 px-4 sm:px-6 py-3">
        {/* Zone 1: Brand Wordmark & Instrument Switcher (Pianino vs Gitara) */}
        <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
          <div
            onClick={() => {
              if (instrument === 'guitar') {
                onSelectInstrument('piano');
              }
              onViewChange('workshop');
            }}
            className="text-lg sm:text-xl font-black tracking-tight text-white whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-2"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span>Harmonix</span>
          </div>

          {/* User Request: Przycisk przy tytule Harmonix do przełączania pianina na gitarę */}
          <div className="flex items-center bg-slate-900/90 p-0.5 rounded-xl border border-slate-800 text-xs shadow-inner">
            <button
              type="button"
              onClick={() => onSelectInstrument('piano')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                instrument === 'piano'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Przełącz na tryb fortepianu / pianina"
            >
              <span className="text-sm">🎹</span>
              <span className="hidden sm:inline">Pianino</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectInstrument('guitar')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                instrument === 'guitar'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Przełącz na rączkę i gryf gitary"
            >
              <span className="text-sm">🎸</span>
              <span className="hidden sm:inline">Gitara</span>
            </button>
          </div>
        </div>

        {/* Zone 2: Navigation tabs (Independent from Guitar!) */}
        <div className="hidden md:flex items-center">
          {instrument === 'guitar' ? (
            <div className="flex items-center gap-2.5 bg-slate-900/80 px-3.5 py-1.5 rounded-xl border border-amber-500/30 text-xs shadow-inner">
              <span className="text-amber-400 font-black flex items-center gap-1.5">
                <span>🎸</span>
                <span>Niezależny Tryb Gitary</span>
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-300 font-medium">Gryf, Chwyty & Wielodotyk</span>
            </div>
          ) : (
            <nav className="flex items-center gap-5 lg:gap-6 text-sm font-medium text-slate-300">
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
                onClick={() => onViewChange('guess')}
                className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 ${
                  activeView === 'guess'
                    ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Odgadnij Akord
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
          )}
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
      {instrument === 'guitar' ? (
        <div className="md:hidden border-t border-slate-900 bg-slate-950 px-4 py-2 flex items-center justify-between text-xs">
          <span className="text-amber-400 font-bold flex items-center gap-1.5">
            <span>🎸</span>
            <span>Rączka & Gryf Gitary</span>
          </span>
          <button
            type="button"
            onClick={() => onSelectInstrument('piano')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold border border-slate-700 cursor-pointer"
          >
            🎹 Wróć do Pianina
          </button>
        </div>
      ) : (
        <div className="md:hidden border-t border-slate-900 bg-slate-950 px-3 py-2 flex items-center justify-between text-xs overflow-x-auto gap-1">
          <button
            type="button"
            onClick={() => onViewChange('workshop')}
            className={`px-2 py-1 rounded-lg ${activeView === 'workshop' ? 'text-amber-400 font-bold bg-slate-900' : 'text-slate-400'}`}
          >
            Ćwiczenia
          </button>
          <button
            type="button"
            onClick={() => onViewChange('library')}
            className={`px-2 py-1 rounded-lg ${activeView === 'library' ? 'text-amber-400 font-bold bg-slate-900' : 'text-slate-400'}`}
          >
            Wzorce
          </button>
          <button
            type="button"
            onClick={() => onViewChange('guess')}
            className={`px-2 py-1 rounded-lg ${activeView === 'guess' ? 'text-amber-400 font-bold bg-slate-900' : 'text-slate-400'}`}
          >
            Odgadnij
          </button>
          <button
            type="button"
            onClick={() => onViewChange('circle')}
            className={`px-2 py-1 rounded-lg ${activeView === 'circle' ? 'text-amber-400 font-bold bg-slate-900' : 'text-slate-400'}`}
          >
            Koło
          </button>
          <button
            type="button"
            onClick={() => onViewChange('sandbox')}
            className={`px-2 py-1 rounded-lg ${activeView === 'sandbox' ? 'text-amber-400 font-bold bg-slate-900' : 'text-slate-400'}`}
          >
            Pianino
          </button>
        </div>
      )}

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
