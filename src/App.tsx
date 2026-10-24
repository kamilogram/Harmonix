import React, { useState, useCallback, useEffect } from 'react';
import {
  ChordDefinition,
  QuizChoice,
  NamingConvention,
  NoteName,
  WorkshopStepResult,
} from './types/music';
import {
  STARTER_CHORDS,
  createChordDefinition,
  getSmartNextChordOptions,
  getNoteLabel,
  NOTE_NAMES,
} from './utils/musicTheory';
import { sound } from './utils/audioEngine';
import { Header } from './components/Header';
import { ChessboardProgressionBoard } from './components/ChessboardProgressionBoard';
import { TheoryModal } from './components/TheoryModal';
import { CircleOfFifths } from './components/CircleOfFifths';
import { ProgressionLibrary, LoadedProgressionMetadata } from './components/ProgressionLibrary';
import { FreePlaySandbox } from './components/FreePlaySandbox';
import { scrollToTonalityProgressionBar, scrollToLoadedProgressionCard } from './utils/scrollHelper';
import { recordPatternLoad } from './utils/sessionTracker';
import {
  Sparkles,
  Music,
  BookOpen,
} from 'lucide-react';

export default function App() {
  const [activeView, setActiveView] = useState<'workshop' | 'library' | 'circle' | 'sandbox'>('workshop');
  const [isTheoryOpen, setIsTheoryOpen] = useState(false);
  const [convention, setConvention] = useState<NamingConvention>('international');
  const [isMuted, setIsMuted] = useState(false);
  const [loadedProgression, setLoadedProgression] = useState<ChordDefinition[] | null>(null);
  const [loadedKeyInfo, setLoadedKeyInfo] = useState<LoadedProgressionMetadata | null>(null);
  const [loadedProgressionId, setLoadedProgressionId] = useState<string | null>(() => {
    try {
      const raw = localStorage.getItem('harmonix_progression_library_settings_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed?.lastLoadedProgressionId || null;
      }
    } catch {}
    return null;
  });
  const [workshopResults, setWorkshopResults] = useState<Record<number, WorkshopStepResult>>(() => {
    try {
      const raw = localStorage.getItem('harmonix_workshop_results_v1');
      if (raw) return JSON.parse(raw);
    } catch {}
    return {};
  });

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const handleUpdateWorkshopResults = useCallback((results: Record<number, WorkshopStepResult>) => {
    setWorkshopResults(results);
    try {
      localStorage.setItem('harmonix_workshop_results_v1', JSON.stringify(results));
    } catch {}
  }, []);

  const handleClearWorkshopResults = useCallback(() => {
    setWorkshopResults({});
    try {
      localStorage.removeItem('harmonix_workshop_results_v1');
    } catch {}
  }, []);

  const handleLoadFromLibrary = (chords: ChordDefinition[], metadata?: LoadedProgressionMetadata) => {
    setLoadedProgression(chords);
    setLoadedKeyInfo(metadata || null);
    if (metadata?.progId) {
      setLoadedProgressionId(metadata.progId);
    }
    setWorkshopResults({});
    try {
      localStorage.removeItem('harmonix_workshop_results_v1');
    } catch {}
    setActiveView('workshop');
    if (metadata?.progName) {
      recordPatternLoad(metadata.progName, metadata.keyName, metadata.degrees);
    }
    scrollToTonalityProgressionBar();
  };

  const handleViewChange = useCallback((view: 'workshop' | 'library' | 'circle' | 'sandbox') => {
    setActiveView(view);
    if (view === 'library') {
      scrollToLoadedProgressionCard(loadedProgressionId);
    }
  }, [loadedProgressionId]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Top Bar Header */}
      <Header
        activeView={activeView}
        onViewChange={handleViewChange}
        onOpenTheory={() => setIsTheoryOpen(true)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-5 sm:py-8 space-y-6">
        {/* VIEW 1: Main Workshop (Chessboard Row-by-Row Layout) */}
        <div className={activeView === 'workshop' ? 'block space-y-6' : 'hidden'}>
          {/* Top Sub-Bar with Notation switch and prominent active tonality */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span className="text-sm font-semibold text-slate-300">
                Warsztat Harmoniczny
              </span>
              <div className="flex items-center gap-1.5 ml-1">
                <span className="text-xs text-slate-400">Tonacja ćwiczenia:</span>
                <span className="px-2.5 py-0.5 rounded-lg bg-amber-400 text-slate-950 font-black text-xs shadow-sm">
                  {loadedKeyInfo?.keyName || (convention === 'polish' ? 'C-dur' : 'C')}
                </span>
                {loadedKeyInfo?.progName && (
                  <span className="text-[11px] text-amber-300/80 font-medium hidden md:inline">
                    ({loadedKeyInfo.progName})
                  </span>
                )}
                {loadedKeyInfo?.degrees && (
                  <span className="text-[11px] font-mono font-bold text-white bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800 hidden lg:inline">
                    {loadedKeyInfo.degrees}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setConvention('polish')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    convention === 'polish'
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Polskie (C - H)
                </button>
                <button
                  type="button"
                  onClick={() => setConvention('international')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                    convention === 'international'
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Intl (C - B)
                </button>
              </div>
            </div>
          </div>

          {/* Chessboard Progression Board */}
          <ChessboardProgressionBoard
            convention={convention}
            onOpenTheory={() => setIsTheoryOpen(true)}
            loadedProgression={loadedProgression}
            loadedKeyInfo={loadedKeyInfo}
            onClearLoadedProgression={() => {
              setLoadedProgression(null);
              setLoadedKeyInfo(null);
              setLoadedProgressionId(null);
              setWorkshopResults({});
            }}
            onUpdateWorkshopResults={handleUpdateWorkshopResults}
            onNavigateToLibrary={() => handleViewChange('library')}
          />
        </div>

        {/* VIEW 2: Progression Library with key change capability (persistent when switching tabs) */}
        <div className={activeView === 'library' ? 'block' : 'hidden'}>
          <ProgressionLibrary
            convention={convention}
            onLoadProgression={handleLoadFromLibrary}
            workshopResults={workshopResults}
            loadedProgressionId={loadedProgressionId}
            onClearWorkshopResults={handleClearWorkshopResults}
            isActiveView={activeView === 'library'}
          />
        </div>

        {/* VIEW 3: Interactive Circle of Fifths */}
        {activeView === 'circle' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <CircleOfFifths convention={convention} />
          </div>
        )}

        {/* VIEW 4: Free Play Sandbox */}
        {activeView === 'sandbox' && (
          <FreePlaySandbox
            convention={convention}
            onStartProgressionWithChord={(chord) => {
              setLoadedProgression([chord]);
              setActiveView('workshop');
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-5 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">Harmonix</span>
            <span>·</span>
            <span>Szachownica Progresji Fortepianowych</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsTheoryOpen(true)}
              className="hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-1"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Podręcznik Teorii</span>
            </button>
            <button
              type="button"
              onClick={() => handleViewChange('workshop')}
              className="hover:text-amber-400 transition-colors cursor-pointer"
            >
              Ćwiczenia
            </button>
            <button
              type="button"
              onClick={() => handleViewChange('library')}
              className="hover:text-amber-400 transition-colors cursor-pointer"
            >
              Wzorce
            </button>
            <button
              type="button"
              onClick={() => handleViewChange('circle')}
              className="hover:text-amber-400 transition-colors cursor-pointer"
            >
              Koło Kwintowe
            </button>
            <button
              type="button"
              onClick={() => handleViewChange('sandbox')}
              className="hover:text-amber-400 transition-colors cursor-pointer"
            >
              Swobodne Pianino
            </button>
          </div>
        </div>
      </footer>

      {/* Theory Guide Modal */}
      <TheoryModal
        isOpen={isTheoryOpen}
        onClose={() => setIsTheoryOpen(false)}
      />
    </div>
  );
}
