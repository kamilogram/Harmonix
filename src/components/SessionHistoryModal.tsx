import React from 'react';
import { X, Clock, Calendar, CheckCircle2, History, RotateCcw } from 'lucide-react';

export interface SessionHistoryEntry {
  id: string;
  timestamp: number;
  timeString: string;
  dateString: string;
  isCurrent?: boolean;
}

interface SessionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: SessionHistoryEntry[];
  onClearHistory?: () => void;
}

export const SessionHistoryModal: React.FC<SessionHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  const formatRelativeTime = (timestamp: number, isCurrent?: boolean) => {
    if (isCurrent) return 'obecna sesja';
    const diffMs = Date.now() - timestamp;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${diffSec} s temu`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} min temu`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} godz. temu`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} dni temu`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Historia Uruchomień Aplikacji</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {history.length} / 10
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Ostatnie 10 zarejestrowanych momentów rozpoczęcia sesji (co do sekundy)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Zamknij"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5 scrollbar-thin scrollbar-thumb-slate-800">
          {history.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              Brak zarejestrowanych wcześniejszych uruchomień.
            </div>
          ) : (
            history.map((entry, idx) => {
              const isCurrent = entry.isCurrent || idx === 0;
              return (
                <div
                  key={entry.id || `sess_${idx}`}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                    isCurrent
                      ? 'bg-amber-400/10 border-amber-400/40 shadow-sm'
                      : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Index badge */}
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                        isCurrent
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      #{idx + 1}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-sm text-white flex items-center gap-1.5">
                          <Clock className={`w-3.5 h-3.5 ${isCurrent ? 'text-amber-400' : 'text-slate-400'}`} />
                          <span>{entry.timeString}</span>
                        </span>

                        {isCurrent && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Obecna sesja</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>{entry.dateString}</span>
                        </span>
                        <span>·</span>
                        <span className="text-slate-500 italic">
                          {formatRelativeTime(entry.timestamp, isCurrent)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
                      co do sekundy
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-2">
          {onClearHistory && history.length > 1 ? (
            <button
              type="button"
              onClick={onClearHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
              title="Wyczyść historię wcześniejszych uruchomień"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Wyczyść historię</span>
            </button>
          ) : (
            <span className="text-[11px] text-slate-400">
              Historia przechowuje maksymalnie 10 ostatnich uruchomień
            </span>
          )}

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
  );
};
