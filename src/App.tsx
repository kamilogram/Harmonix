import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
  isTonicDegree,
  isTonicDegreeMinor,
} from './utils/musicTheory';
import { sound } from './utils/audioEngine';
import { Header } from './components/Header';
import { ChessboardProgressionBoard } from './components/ChessboardProgressionBoard';
import { TheoryModal } from './components/TheoryModal';
import { CircleOfFifths } from './components/CircleOfFifths';
import { ProgressionLibrary, LoadedProgressionMetadata } from './components/ProgressionLibrary';
import { FreePlaySandbox } from './components/FreePlaySandbox';
import { ChordQuizGame } from './components/ChordQuizGame';
import { GuitarFretboardGame } from './components/GuitarFretboardGame';
import { scrollToTonalityProgressionBar, scrollToLoadedProgressionCard, scrollToFirstPianoKeyboard } from './utils/scrollHelper';
import { recordPatternLoad } from './utils/sessionTracker';
import {
  Sparkles,
  Music,
  BookOpen,
} from 'lucide-react';

const WORKSHOP_PROG_STORAGE_KEY = 'harmonix_workshop_loaded_progression_v1';

export default function App() {
  const [activeView, setActiveView] = useState<'workshop' | 'library' | 'guess' | 'circle' | 'sandbox'>('workshop');
  const [isTheoryOpen, setIsTheoryOpen] = useState(false);
  const [convention, setConvention] = useState<NamingConvention>('international');
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getIsMuted());

  // Instrument switcher: 'piano' | 'guitar' (persisted in localStorage)
  const [instrument, setInstrument] = useState<'piano' | 'guitar'>(() => {
    try {
      return localStorage.getItem('harmonix_active_instrument') === 'guitar' ? 'guitar' : 'piano';
    } catch {
      return 'piano';
    }
  });

  const handleSelectInstrument = (inst: 'piano' | 'guitar') => {
    setInstrument(inst);
    try {
      localStorage.setItem('harmonix_active_instrument', inst);
    } catch {}
  };

  // User Request: Wczytywanie ostatnio wstawionego do warsztatu wzorca po ponownym uruchomieniu aplikacji
  const [loadedProgression, setLoadedProgression] = useState<ChordDefinition[] | null>(() => {
    try {
      const raw = localStorage.getItem(WORKSHOP_PROG_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.chords) && parsed.chords.length > 0) {
          return parsed.chords;
        }
      }
    } catch {}
    return null;
  });

  const [loadedKeyInfo, setLoadedKeyInfo] = useState<LoadedProgressionMetadata | null>(() => {
    try {
      const raw = localStorage.getItem(WORKSHOP_PROG_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.metadata) {
          return parsed.metadata;
        }
      }
    } catch {}
    return null;
  });

  const [loadedProgressionId, setLoadedProgressionId] = useState<string | null>(() => {
    try {
      const rawWorkshop = localStorage.getItem(WORKSHOP_PROG_STORAGE_KEY);
      if (rawWorkshop) {
        const parsed = JSON.parse(rawWorkshop);
        if (parsed?.metadata?.progId) return parsed.metadata.progId;
        if (parsed?.progressionId) return parsed.progressionId;
      }
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

  const handleClearLoadedProgression = useCallback(() => {
    setLoadedProgression(null);
    setLoadedKeyInfo(null);
    setLoadedProgressionId(null);
    setWorkshopResults({});
    try {
      localStorage.removeItem(WORKSHOP_PROG_STORAGE_KEY);
      localStorage.removeItem('harmonix_workshop_results_v1');
    } catch {}
  }, []);

  const handleLoadFromLibrary = (
    chords: ChordDefinition[],
    metadata?: LoadedProgressionMetadata,
    options?: { skipScrollToTonalityBar?: boolean }
  ) => {
    setLoadedProgression(chords);
    setLoadedKeyInfo(metadata || null);
    if (metadata?.progId) {
      setLoadedProgressionId(metadata.progId);
    }
    try {
      localStorage.setItem(
        WORKSHOP_PROG_STORAGE_KEY,
        JSON.stringify({
          chords,
          metadata: metadata || null,
          progressionId: metadata?.progId || null,
        })
      );
    } catch {}
    setWorkshopResults({});
    try {
      localStorage.removeItem('harmonix_workshop_results_v1');
    } catch {}
    setActiveView('workshop');
    if (metadata?.progName) {
      recordPatternLoad(metadata.progName, metadata.keyName, metadata.degrees);
    }
    // User Request: Na kliknięcie "wstaw do warsztatu" w zakładce wzorce jak aplikacja przechodzi do zakładki "ćwiczenia" niech też się scrolluje do pierwszej klawiatury
    scrollToFirstPianoKeyboard();
  };

  const handleViewChange = useCallback((view: 'workshop' | 'library' | 'guess' | 'circle' | 'sandbox') => {
    setActiveView(view);
    setInstrument('piano');
    if (view === 'library') {
      scrollToLoadedProgressionCard(loadedProgressionId);
    }
  }, [loadedProgressionId]);

  const renderFooter = () => (
    <footer className="border-t border-slate-800/80 pt-6 pb-4 mt-8 text-xs text-slate-400">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-300">Harmonix</span>
          <span>·</span>
          <span>Szachownica Progresji Fortepianowych i Gitarowych</span>
        </div>
        <div className="flex items-center gap-4 flex-wrap justify-center">
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
            onClick={() => handleViewChange('guess')}
            className="hover:text-amber-400 transition-colors cursor-pointer"
          >
            Odgadnij Akord
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
  );

  return (
    <div className="h-screen h-[100dvh] bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950 overflow-hidden">
      {/* Top Bar Header (Docked at top, does not scroll away) */}
      <Header
        activeView={activeView}
        onViewChange={handleViewChange}
        onOpenTheory={() => setIsTheoryOpen(true)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        instrument={instrument}
        onSelectInstrument={handleSelectInstrument}
      />

      {/* Main Tab Panels Container: Independent native scroll containers for each tab */}
      <div className="flex-1 min-h-0 relative w-full overflow-hidden">
        {/* TAB 1: Main Workshop (Physical Tab with independent scroll) */}
        <div
          id="tabpanel-workshop"
          role="tabpanel"
          aria-label="Ćwiczenia"
          className={`absolute inset-0 overflow-y-auto ${
            instrument === 'piano' && activeView === 'workshop' ? 'block' : 'hidden'
          }`}
        >
          <div className="max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6 flex flex-col min-h-full">
            <div className="flex-1 space-y-4">
              {/* Chessboard Progression Board */}
              <ChessboardProgressionBoard
                convention={convention}
                onSetConvention={setConvention}
                onOpenTheory={() => setIsTheoryOpen(true)}
                loadedProgression={loadedProgression}
                loadedKeyInfo={loadedKeyInfo}
                onClearLoadedProgression={handleClearLoadedProgression}
                onUpdateWorkshopResults={handleUpdateWorkshopResults}
                onNavigateToLibrary={() => handleViewChange('library')}
                onLoadProgression={handleLoadFromLibrary}
              />
            </div>
            {renderFooter()}
          </div>
        </div>

        {/* TAB 2: Progression Library (Physical Tab with independent scroll) */}
        <div
          id="tabpanel-library"
          role="tabpanel"
          aria-label="Wzorce"
          className={`absolute inset-0 overflow-y-auto ${
            instrument === 'piano' && activeView === 'library' ? 'block' : 'hidden'
          }`}
        >
          <div className="max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6 flex flex-col min-h-full">
            <div className="flex-1">
              <ProgressionLibrary
                convention={convention}
                onLoadProgression={handleLoadFromLibrary}
                workshopResults={workshopResults}
                loadedProgressionId={loadedProgressionId}
                onClearWorkshopResults={handleClearWorkshopResults}
                isActiveView={instrument === 'piano' && activeView === 'library'}
              />
            </div>
            {renderFooter()}
          </div>
        </div>

        {/* TAB 3: Odgadnij Akord (Reverse Chord Quiz - Physical Tab with independent scroll) */}
        <div
          id="tabpanel-guess"
          role="tabpanel"
          aria-label="Odgadnij Akord"
          className={`absolute inset-0 overflow-y-auto ${
            instrument === 'piano' && activeView === 'guess' ? 'block' : 'hidden'
          }`}
        >
          <div className="max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6 flex flex-col min-h-full">
            <div className="flex-1">
              <ChordQuizGame
                convention={convention}
                isActiveTab={instrument === 'piano' && activeView === 'guess'}
              />
            </div>
            {renderFooter()}
          </div>
        </div>

        {/* TAB 4: Interactive Circle of Fifths (Physical Tab with independent scroll) */}
        <div
          id="tabpanel-circle"
          role="tabpanel"
          aria-label="Koło Kwintowe"
          className={`absolute inset-0 overflow-y-auto ${
            instrument === 'piano' && activeView === 'circle' ? 'block' : 'hidden'
          }`}
        >
          <div className="max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6 flex flex-col min-h-full">
            <div className="flex-1 max-w-4xl mx-auto w-full space-y-6">
              <CircleOfFifths convention={convention} />
            </div>
            {renderFooter()}
          </div>
        </div>

        {/* TAB 5: Free Play Sandbox (Physical Tab with independent scroll) */}
        <div
          id="tabpanel-sandbox"
          role="tabpanel"
          aria-label="Swobodne Pianino"
          className={`absolute inset-0 overflow-y-auto ${
            instrument === 'piano' && activeView === 'sandbox' ? 'block' : 'hidden'
          }`}
        >
          <div className="max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6 flex flex-col min-h-full">
            <div className="flex-1">
              <FreePlaySandbox
                convention={convention}
                onStartProgressionWithChord={(chord) => {
                  setLoadedProgression([chord]);
                  setActiveView('workshop');
                }}
              />
            </div>
            {renderFooter()}
          </div>
        </div>

        {/* TAB 6: Rączka i Gryf Gitary (Guitar Fretboard & Chord Guessing) */}
        <div
          id="tabpanel-guitar"
          role="tabpanel"
          aria-label="Gryf Gitary"
          className={`absolute inset-0 overflow-y-auto ${
            instrument === 'guitar' ? 'block' : 'hidden'
          }`}
        >
          <div className="max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6 flex flex-col min-h-full">
            <div className="flex-1">
              <GuitarFretboardGame
                convention={convention}
                onOpenTheory={() => setIsTheoryOpen(true)}
                onBackToPiano={() => handleSelectInstrument('piano')}
              />
            </div>
            {renderFooter()}
          </div>
        </div>
      </div>

      {/* Theory Guide Modal */}
      <TheoryModal
        isOpen={isTheoryOpen}
        onClose={() => setIsTheoryOpen(false)}
      />
    </div>
  );
}
