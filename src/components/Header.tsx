import React, { useState, useEffect } from 'react';
import { BookOpen, Volume2, VolumeX, Clock, PowerOff, History } from 'lucide-react';
import { sound } from '../utils/audioEngine';
import { SessionHistoryModal, SessionHistoryEntry } from './SessionHistoryModal';
import {
  recordSessionStart,
  clearPreviousSessionHistory,
  getLastClosedTime,
  recordCurrentClosedTime,
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
  // Session tracking: records current start time and stores last 10 session start times
  const [{ current: currentSession, history: initialHistory }] = useState(() => recordSessionStart());
  const [sessionHistory, setSessionHistory] = useState<SessionHistoryEntry[]>(initialHistory);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [lastClosedTime, setLastClosedTime] = useState(() => getLastClosedTime());

  // Heartbeat & exit listener to track the exact second the user leaves or closes the app
  useEffect(() => {
    const updateExitTime = () => {
      recordCurrentClosedTime();
      setLastClosedTime(getLastClosedTime());
    };

    // Heartbeat interval (1s) so even sudden power-off/browser termination has exact second
    const interval = setInterval(updateExitTime, 1000);

    const handleBeforeUnload = () => updateExitTime();
    const handlePageHide = () => updateExitTime();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        updateExitTime();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      {/* Top Utility Ribbon: Session Launch Time & Previous Exit Time (co do sekundy) */}
      <div className="w-full bg-[#070b13] border-b border-slate-900 py-1 px-4 sm:px-6 text-[11px] text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>
                Sesja uruchomiona o:{' '}
                <strong className="text-amber-300 font-mono font-semibold">{currentSession.timeString}</strong>
              </span>
            </div>

            {/* Przycisk otwierający ostatnie 10 czasów rozpoczęcia */}
            <button
              type="button"
              onClick={() => setIsHistoryModalOpen(true)}
              title="Wyświetl listę ostatnich 10 czasów uruchomienia aplikacji"
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-400/20 hover:bg-amber-400 text-amber-300 hover:text-slate-950 border border-amber-400/40 text-[11px] font-bold transition-all cursor-pointer shadow-sm active:scale-95"
            >
              <History className="w-3 h-3 text-amber-400 group-hover:text-slate-950 shrink-0" />
              <span>Ostatnie uruchomienia ({sessionHistory.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <PowerOff className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>
              Aplikacja poprzednio wyłączona o:{' '}
              {lastClosedTime ? (
                <strong className="text-slate-200 font-mono font-semibold">{lastClosedTime}</strong>
              ) : (
                <span className="text-slate-500 italic">brak danych (pierwsze uruchomienie)</span>
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 py-3.5">
        {/* Zone 1: Brand Wordmark (one line, single element) */}
        <div
          onClick={() => onViewChange('workshop')}
          className="text-lg sm:text-xl font-black tracking-tight text-white whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-2"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
          <span>Harmonix</span>
        </div>

        {/* Zone 2: Navigation tabs with small info directly above */}
        <div className="hidden md:flex flex-col items-center gap-1.5">
          {/* Mała informacja nad zakładkami typu "ćwiczenia", "wzorce" itd */}
          <div className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 shadow-inner">
            <PowerOff className="w-3 h-3 text-rose-400 shrink-0" />
            <span>
              Aplikacja wyłączona o:{' '}
              {lastClosedTime ? (
                <strong className="text-slate-200 font-mono font-semibold">{lastClosedTime}</strong>
              ) : (
                <span className="text-slate-500 italic">brak wcześniejszego wyłączenia (pierwsze uruchomienie)</span>
              )}
            </span>
          </div>

          <nav className="flex items-center gap-6 text-sm font-medium text-slate-300">
            <button
              type="button"
              onClick={() => onViewChange('workshop')}
              className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeView === 'workshop'
                  ? 'text-amber-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Ćwiczenia
            </button>
            <button
              type="button"
              onClick={() => onViewChange('library')}
              className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeView === 'library'
                  ? 'text-amber-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Wzorce
            </button>
            <button
              type="button"
              onClick={() => onViewChange('circle')}
              className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeView === 'circle'
                  ? 'text-amber-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Koło Kwintowe
            </button>
            <button
              type="button"
              onClick={() => onViewChange('sandbox')}
              className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeView === 'sandbox'
                  ? 'text-amber-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Swobodne Pianino
            </button>
          </nav>
        </div>

        {/* Zone 3: 1 primary action */}
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

      {/* Mobile nav bar row with info directly above tabs */}
      <div className="md:hidden border-t border-slate-900 bg-slate-950">
        <div className="flex flex-wrap items-center justify-between gap-1.5 py-1 px-3 bg-[#060a12] text-[10.5px] text-slate-400 border-b border-slate-900/60">
          <div className="flex items-center gap-1.5">
            <PowerOff className="w-3 h-3 text-rose-400 shrink-0" />
            <span>
              Wył. o:{' '}
              {lastClosedTime ? (
                <strong className="text-slate-200 font-mono font-semibold">{lastClosedTime}</strong>
              ) : (
                <span className="text-slate-500 italic">brak</span>
              )}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsHistoryModalOpen(true)}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px] font-bold border border-amber-400/30 active:scale-95 cursor-pointer"
          >
            <History className="w-3 h-3 text-amber-400" />
            <span>Starty ({sessionHistory.length})</span>
          </button>
        </div>
        <div className="flex items-center justify-around px-2 py-2 text-xs">
          <button
            type="button"
            onClick={() => onViewChange('workshop')}
            className={`px-2 py-1 rounded ${activeView === 'workshop' ? 'text-amber-400 font-bold bg-slate-900' : 'text-slate-400'}`}
          >
            Ćwiczenia
          </button>
          <button
            type="button"
            onClick={() => onViewChange('library')}
            className={`px-2 py-1 rounded ${activeView === 'library' ? 'text-amber-400 font-bold bg-slate-900' : 'text-slate-400'}`}
          >
            Wzorce
          </button>
          <button
            type="button"
            onClick={() => onViewChange('circle')}
            className={`px-2 py-1 rounded ${activeView === 'circle' ? 'text-amber-400 font-bold bg-slate-900' : 'text-slate-400'}`}
          >
            Koło Kwintowe
          </button>
          <button
            type="button"
            onClick={() => onViewChange('sandbox')}
            className={`px-2 py-1 rounded ${activeView === 'sandbox' ? 'text-amber-400 font-bold bg-slate-900' : 'text-slate-400'}`}
          >
            Pianino
          </button>
        </div>
      </div>

      {/* Session History Modal displaying the last 10 session start times */}
      <SessionHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        history={sessionHistory}
        onClearHistory={() => {
          const updated = clearPreviousSessionHistory(currentSession);
          setSessionHistory(updated);
        }}
      />
    </header>
  );
};
