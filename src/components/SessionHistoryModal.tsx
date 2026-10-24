import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Clock,
  Calendar,
  CheckCircle2,
  History,
  RotateCcw,
  Music,
  Power,
  ChevronDown,
  ChevronUp,
  Filter,
} from 'lucide-react';
import { ActivityHistoryEntry } from '../utils/sessionTracker';

export type { ActivityHistoryEntry };

interface SessionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: ActivityHistoryEntry[];
  onClearHistory?: () => void;
}

export const SessionHistoryModal: React.FC<SessionHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onClearHistory,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'patterns' | 'launches'>('all');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatRelativeTime = (timestamp: number) => {
    const diffMs = Date.now() - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 45) return 'przed chwilą';
    if (diffSec < 60) return `${diffSec} s temu`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} min temu`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} godz. temu`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} dni temu`;
  };

  const filteredHistory = history.filter((item) => {
    if (filterType === 'patterns') return item.type === 'pattern_load';
    if (filterType === 'launches') return item.type === 'app_start';
    return true;
  });

  const patternsCount = history.filter((e) => e.type === 'pattern_load').length;
  const launchesCount = history.filter((e) => e.type === 'app_start').length;

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh] max-h-[720px] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - fixed height, never shrinks */}
        <div className="shrink-0 px-5 py-3.5 border-b border-slate-800 bg-slate-950/90">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/35 flex items-center justify-center text-amber-300 shrink-0">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Historia Ćwiczeń i Wzorców</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700">
                    {history.length} wpisów
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Uruchomienia aplikacji i załadowane wzorce z tej oraz poprzednich sesji
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              title="Zamknij"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Pills & Quick Scroll Controls Strip */}
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
                <Filter className="w-3 h-3 text-amber-400" />
                <span>Pokaż:</span>
              </span>
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-2 py-0.5 rounded-lg font-semibold text-[11px] cursor-pointer transition-all ${
                  filterType === 'all'
                    ? 'bg-amber-400 text-slate-950 shadow-sm font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Wszystkie ({history.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('patterns')}
                className={`px-2 py-0.5 rounded-lg font-semibold text-[11px] cursor-pointer transition-all ${
                  filterType === 'patterns'
                    ? 'bg-amber-400 text-slate-950 shadow-sm font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Wzorce ({patternsCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('launches')}
                className={`px-2 py-0.5 rounded-lg font-semibold text-[11px] cursor-pointer transition-all ${
                  filterType === 'launches'
                    ? 'bg-amber-400 text-slate-950 shadow-sm font-bold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Starty ({launchesCount})
              </button>
            </div>

            {/* Quick scroll slider buttons */}
            {filteredHistory.length > 4 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={scrollToTop}
                  className="px-2 py-0.5 text-[10px] font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded flex items-center gap-1 cursor-pointer"
                  title="Przewiń na samą górę"
                >
                  <ChevronUp className="w-3 h-3" />
                  <span>Góra</span>
                </button>
                <button
                  type="button"
                  onClick={scrollToBottom}
                  className="px-2 py-0.5 text-[10px] font-semibold text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded flex items-center gap-1 cursor-pointer"
                  title="Przewiń na sam dół"
                >
                  <ChevronDown className="w-3 h-3" />
                  <span>Dół</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content list with prominent visible scrollbar (suwak) */}
        <div
          ref={scrollContainerRef}
          className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-2.5 history-modal-scrollbar pr-3 sm:pr-4"
        >
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Brak wpisów dla wybranego filtra.
            </div>
          ) : (
            filteredHistory.map((entry, idx) => {
              const isStart = entry.type === 'app_start';
              const isCurrentSessionStart = isStart && entry.isCurrentSession;

              return (
                <div
                  key={entry.id || `act_${idx}`}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                    isCurrentSessionStart
                      ? 'bg-amber-400/10 border-amber-400/40 shadow-sm'
                      : isStart
                      ? 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                      : 'bg-slate-900/90 border-slate-800 hover:border-amber-500/35'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Icon badge */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                        isStart
                          ? isCurrentSessionStart
                            ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                      }`}
                    >
                      {isStart ? (
                        <Power className="w-4 h-4 stroke-[2.5]" />
                      ) : (
                        <Music className="w-4 h-4 stroke-[2.5]" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-white truncate max-w-[280px]">
                          {entry.title}
                        </span>

                        {isCurrentSessionStart && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold shrink-0">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Obecna sesja</span>
                          </span>
                        )}

                        {entry.keyName && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-400/15 text-amber-300 border border-amber-400/30 text-[10px] font-bold shrink-0">
                            {entry.keyName}
                          </span>
                        )}
                      </div>

                      {entry.formula && (
                        <div className="text-[11px] font-mono text-slate-300 mt-0.5 truncate max-w-sm">
                          {entry.formula}
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 font-mono font-semibold text-slate-300">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>{entry.timeString}</span>
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>{entry.dateString}</span>
                        </span>
                        <span>·</span>
                        <span className="text-slate-500 italic">
                          {formatRelativeTime(entry.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-950 px-2 py-1 rounded-md border border-slate-800">
                      {isStart ? 'Start aplikacji' : 'Wzorzec'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer - fixed height, never shrinks */}
        <div className="shrink-0 px-5 py-3 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between gap-2">
          {onClearHistory && history.length > 0 ? (
            <button
              type="button"
              onClick={onClearHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
              title="Wyczyść całą historię sesji i wzorców"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Wyczyść historię</span>
            </button>
          ) : (
            <span className="text-[11px] text-slate-500">
              Przechowywane do 50 ostatnich zdarzeń
            </span>
          )}

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Użyj suwaka lub kółka myszy, aby przewijać
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer shadow-sm active:scale-95"
            >
              Zamknij
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
