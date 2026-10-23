import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FamousProgression,
  ChordDefinition,
  NoteName,
  NamingConvention,
  WorkshopStepResult,
} from '../types/music';
import {
  FAMOUS_PROGRESSIONS,
  createChordDefinition,
  parseChordSymbol,
  NOTE_NAMES,
  getNoteLabel,
} from '../utils/musicTheory';
import { sound } from '../utils/audioEngine';
import { scrollToLoadedProgressionCard } from '../utils/scrollHelper';
import {
  Play,
  Square,
  ArrowRight,
  Sparkles,
  Music,
  RotateCcw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Compass,
  Eye,
  EyeOff,
  Search,
  Shuffle,
  Dice5,
} from 'lucide-react';

export interface LoadedProgressionMetadata {
  keyName: string;
  progName?: string;
  progId?: string;
  degrees?: string;
  root?: NoteName;
  mode?: 'major' | 'minor';
}

export function formatDegreeLabel(degree: string): string {
  if (!degree) return '';
  const beforeParen = degree.split('(')[0].trim();
  if (beforeParen) return beforeParen;
  return degree.trim();
}

export function getProgressionRomanFormula(prog: FamousProgression): {
  fullFormula: string;
  sectionFormulas: { name: string; formula: string }[];
  hasSections: boolean;
} {
  const allDegrees = prog.steps.map((s) => formatDegreeLabel(s.degree));
  const fullFormula = allDegrees.join(' – ');

  const hasSections = prog.steps.some((s) => Boolean(s.section));
  const sectionFormulas: { name: string; formula: string }[] = [];

  if (hasSections) {
    const groups: { name: string; degrees: string[] }[] = [];
    prog.steps.forEach((st) => {
      const secName = st.section || 'Główna fraza';
      const last = groups[groups.length - 1];
      const deg = formatDegreeLabel(st.degree);
      if (last && last.name === secName) {
        last.degrees.push(deg);
      } else {
        groups.push({ name: secName, degrees: [deg] });
      }
    });

    groups.forEach((g) => {
      sectionFormulas.push({
        name: g.name,
        formula: g.degrees.join(' – '),
      });
    });
  }

  return {
    fullFormula,
    sectionFormulas,
    hasSections,
  };
}

export type ProgressionFormType = 'all' | 'progression' | 'song';

export function isProgressionFullSong(prog: FamousProgression): boolean {
  return prog.steps.some((s) => Boolean(s.section)) || prog.id.startsWith('song_');
}

export interface ProgressionDifficultyInfo {
  score: number;
  level: 1 | 2 | 3 | 4 | 5;
  label: 'Bardzo łatwy' | 'Łatwy' | 'Średni' | 'Zaawansowany' | 'Mistrzowski';
  badgeColor: string;
}

export function calculateProgressionDifficulty(prog: FamousProgression): ProgressionDifficultyInfo {
  let score = 0;
  const isFullSong = isProgressionFullSong(prog);

  // 1. Długość progresji
  score += Math.min(prog.steps.length * 1.5, 18);

  // 2. Struktura wieloczęściowa (Zwrotka, Refren, Bridge itp.)
  if (isFullSong) {
    const sections = new Set(prog.steps.map((s) => s.section).filter(Boolean));
    score += Math.max(sections.size * 5, 12);
  }

  // 3. Liczba unikalnych akordów
  const uniqueChords = new Set(prog.steps.map((s) => s.symbol));
  score += uniqueChords.size * 1.6;

  // 4. Zaawansowanie harmoniczne akordów (septymy, zawieszenia, seksty, aug, dim)
  prog.steps.forEach((st) => {
    const sym = st.symbol;
    const deg = st.degree || '';

    if (
      sym.includes('dim') ||
      sym.includes('°') ||
      sym.includes('m7b5') ||
      sym.includes('ø') ||
      deg.includes('dim') ||
      deg.includes('°')
    ) {
      score += 7;
    } else if (sym.includes('aug') || sym.includes('+') || deg.includes('+')) {
      score += 6;
    } else if (sym.includes('6') || sym.includes('m6') || deg.includes('6')) {
      score += 5;
    } else if (sym.includes('maj7') || sym.includes('7sus4') || deg.includes('maj7')) {
      score += 3.5;
    } else if (
      sym.includes('sus2') ||
      sym.includes('sus4') ||
      sym.includes('add9') ||
      deg.includes('sus') ||
      deg.includes('add9')
    ) {
      score += 2.5;
    } else if (sym.includes('7') || sym.includes('m7') || deg.includes('7')) {
      score += 2;
    } else {
      score += 0.5; // prosty trójdźwięk dur / moll
    }

    // Dominanty wtrącone, medianty chromatyczne, substytuty
    if (
      deg.includes('V/') ||
      deg.includes('bVI') ||
      deg.includes('bIII') ||
      deg.includes('#I') ||
      deg.includes('SubV') ||
      deg.includes('Dorycki')
    ) {
      score += 4;
    }
  });

  // Cykl Coltrane'a to szczyt zaawansowania jazzowego
  if (prog.id === 'jazz_coltrane_changes') {
    score += 45;
  }

  if (score < 20) {
    return {
      score,
      level: 1,
      label: 'Bardzo łatwy',
      badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    };
  } else if (score < 30) {
    return {
      score,
      level: 2,
      label: 'Łatwy',
      badgeColor: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
    };
  } else if (score < 45) {
    return {
      score,
      level: 3,
      label: 'Średni',
      badgeColor: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    };
  } else if (score < 65) {
    return {
      score,
      level: 4,
      label: 'Zaawansowany',
      badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    };
  } else {
    return {
      score,
      level: 5,
      label: 'Mistrzowski',
      badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    };
  }
}

interface ProgressionLibraryProps {
  onLoadProgression: (chords: ChordDefinition[], metadata?: LoadedProgressionMetadata) => void;
  convention?: NamingConvention;
  workshopResults?: Record<number, WorkshopStepResult>;
  loadedProgressionId?: string | null;
  onClearWorkshopResults?: () => void;
  isActiveView?: boolean;
}

const STORAGE_KEY = 'harmonix_progression_library_settings_v1';

interface StoredLibrarySettings {
  globalKeyRoot?: NoteName;
  globalKeyMode?: 'major' | 'minor';
  selectedGenre?: string;
  selectedType?: ProgressionFormType;
  searchQuery?: string;
  cardKeyOverrides?: Record<string, NoteName>;
  revealedCardIds?: string[];
  lastLoadedProgressionId?: string;
}

function loadStoredSettings(): StoredLibrarySettings {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          globalKeyRoot: typeof parsed.globalKeyRoot === 'string' && NOTE_NAMES.includes(parsed.globalKeyRoot as NoteName) ? parsed.globalKeyRoot : 'C',
          globalKeyMode: parsed.globalKeyMode === 'minor' ? 'minor' : 'major',
          selectedGenre: typeof parsed.selectedGenre === 'string' ? parsed.selectedGenre : 'all',
          selectedType: parsed.selectedType === 'progression' || parsed.selectedType === 'song' ? parsed.selectedType : 'all',
          searchQuery: typeof parsed.searchQuery === 'string' ? parsed.searchQuery : '',
          cardKeyOverrides: parsed.cardKeyOverrides && typeof parsed.cardKeyOverrides === 'object' && !Array.isArray(parsed.cardKeyOverrides) ? parsed.cardKeyOverrides : {},
          revealedCardIds: Array.isArray(parsed.revealedCardIds) ? parsed.revealedCardIds : [],
          lastLoadedProgressionId: typeof parsed.lastLoadedProgressionId === 'string' ? parsed.lastLoadedProgressionId : undefined,
        };
      }
    }
  } catch (e) {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  return {
    globalKeyRoot: 'C',
    globalKeyMode: 'major',
    selectedGenre: 'all',
    selectedType: 'all',
    searchQuery: '',
    cardKeyOverrides: {},
    revealedCardIds: [],
  };
}

function saveStoredSettings(settings: StoredLibrarySettings) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
  } catch (e) {
    // ignore
  }
}

// Key signatures explanation helper
const KEY_SIGNATURE_DATA: Record<NoteName, { name: string; sharps: number; flats: number; accidentals: string }> = {
  C: { name: 'C-dur / a-moll', sharps: 0, flats: 0, accidentals: 'Brak znaków' },
  G: { name: 'G-dur / e-moll', sharps: 1, flats: 0, accidentals: '1 krzyżyk (# Fis)' },
  D: { name: 'D-dur / h-moll', sharps: 2, flats: 0, accidentals: '2 krzyżyki (Fis, Cis)' },
  A: { name: 'A-dur / fis-moll', sharps: 3, flats: 0, accidentals: '3 krzyżyki (Fis, Cis, Gis)' },
  E: { name: 'E-dur / cis-moll', sharps: 4, flats: 0, accidentals: '4 krzyżyki (Fis, Cis, Gis, Dis)' },
  B: { name: 'H-dur / gis-moll', sharps: 5, flats: 0, accidentals: '5 krzyżyków (H-dur / B-dur)' },
  'F#': { name: 'Fis-dur / dis-moll', sharps: 6, flats: 0, accidentals: '6 krzyżyków (Fis-dur)' },
  F: { name: 'F-dur / d-moll', sharps: 0, flats: 1, accidentals: '1 bemol (b B)' },
  'A#': { name: 'B-dur / g-moll', sharps: 0, flats: 2, accidentals: '2 bemole (B, Es)' },
  'D#': { name: 'Es-dur / c-moll', sharps: 0, flats: 3, accidentals: '3 bemole (B, Es, As)' },
  'G#': { name: 'As-dur / f-moll', sharps: 0, flats: 4, accidentals: '4 bemole (B, Es, As, Des)' },
  'C#': { name: 'Des-dur / b-moll', sharps: 0, flats: 5, accidentals: '5 bemoli (Des-dur)' },
};

export const ProgressionLibrary: React.FC<ProgressionLibraryProps> = ({
  onLoadProgression,
  convention = 'international',
  workshopResults = {},
  loadedProgressionId = null,
  onClearWorkshopResults,
  isActiveView = false,
}) => {
  const stored = useMemo(() => loadStoredSettings(), []);

  // Global active tonality root (persisted across sessions and tab transitions)
  const [globalKeyRoot, setGlobalKeyRoot] = useState<NoteName>(() => stored.globalKeyRoot || 'C');
  // Global mode: Major (dur) or Minor (moll) (persisted)
  const [globalKeyMode, setGlobalKeyMode] = useState<'major' | 'minor'>(() => stored.globalKeyMode || 'major');

  // Per-progression key overrides (persisted)
  const [cardKeyOverrides, setCardKeyOverrides] = useState<Record<string, NoteName>>(() => stored.cardKeyOverrides || {});
  // Card key picker popover open state
  const [openCardKeyPickerId, setOpenCardKeyPickerId] = useState<string | null>(null);

  // Active genre filter & search query (persisted)
  const [selectedGenre, setSelectedGenre] = useState<string>(() => stored.selectedGenre || 'all');
  const [searchQuery, setSearchQuery] = useState<string>(() => stored.searchQuery || '');

  // Track the ID of the progression that was loaded into the workshop
  const [lastLoadedProgressionId, setLastLoadedProgressionId] = useState<string | null>(
    () => loadedProgressionId || stored.lastLoadedProgressionId || null
  );

  useEffect(() => {
    if (loadedProgressionId) {
      setLastLoadedProgressionId(loadedProgressionId);
    }
  }, [loadedProgressionId]);

  // When switching to the Wzorce tab, smoothly scroll the view to the loaded progression
  const prevActiveViewRef = useRef(isActiveView);
  useEffect(() => {
    const becameActive = Boolean(isActiveView && !prevActiveViewRef.current);
    prevActiveViewRef.current = isActiveView;

    if (becameActive) {
      const targetId = loadedProgressionId || lastLoadedProgressionId;
      if (targetId) {
        // Ensure the loaded progression is visible by resetting genre/search if it was filtered out
        const targetProg = FAMOUS_PROGRESSIONS.find((p) => p.id === targetId);
        if (targetProg && selectedGenre !== 'all' && !targetProg.genre.toLowerCase().includes(selectedGenre.toLowerCase())) {
          setSelectedGenre('all');
        }
        if (searchQuery.trim()) {
          setSearchQuery('');
        }

        scrollToLoadedProgressionCard(targetId);
      }
    }
  }, [isActiveView, loadedProgressionId, lastLoadedProgressionId, selectedGenre, searchQuery]);

  // Set of progression IDs for which chords are currently revealed
  // DEFAULT: empty set (all hidden by default as requested!)
  const [revealedCardIds, setRevealedCardIds] = useState<Set<string>>(
    () => new Set(Array.isArray(stored.revealedCardIds) ? stored.revealedCardIds : [])
  );

  // Save parameters to localStorage whenever they change
  useEffect(() => {
    saveStoredSettings({
      globalKeyRoot,
      globalKeyMode,
      selectedGenre,
      searchQuery,
      cardKeyOverrides,
      revealedCardIds: Array.from(revealedCardIds),
      lastLoadedProgressionId: lastLoadedProgressionId || undefined,
    });
  }, [globalKeyRoot, globalKeyMode, selectedGenre, searchQuery, cardKeyOverrides, revealedCardIds, lastLoadedProgressionId]);

  const toggleCardChords = (progId: string) => {
    setRevealedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(progId)) next.delete(progId);
      else next.add(progId);
      return next;
    });
  };

  const handleRevealAllChords = () => {
    setRevealedCardIds(new Set(FAMOUS_PROGRESSIONS.map((p) => p.id)));
  };

  const handleHideAllChords = () => {
    setRevealedCardIds(new Set());
  };

  // Audio playback state
  const [playingId, setPlayingId] = useState<string | null>(null);

  // Helper to determine original base root of a progression
  const getProgressionOriginalRoot = (prog: FamousProgression): NoteName => {
    const match = prog.key.trim().match(/^([A-G][#b]?|H|Cis|Dis|Fis|Gis|Ais)/i);
    if (match) {
      const parsed = parseChordSymbol(match[1]);
      return parsed.root;
    }
    if (prog.id === 'andalusian_cadence' || prog.id === 'epic_cinematic' || prog.key.toLowerCase().includes('moll')) {
      return 'A';
    }
    return 'C';
  };

  // Check if a progression is natively minor
  const isProgressionMinor = (prog: FamousProgression): boolean => {
    return prog.key.toLowerCase().includes('moll') || Boolean(prog.steps[0]?.symbol.endsWith('m')) || Boolean(prog.steps[0]?.symbol.endsWith('m7'));
  };

  // Get active key root for a given progression (custom override or global)
  const getActiveKeyForProg = (prog: FamousProgression): NoteName => {
    if (cardKeyOverrides[prog.id]) {
      return cardKeyOverrides[prog.id];
    }
    const isMinor = isProgressionMinor(prog);
    if (globalKeyMode === 'minor') {
      // If user selected global minor mode (e.g. A-moll or E-moll):
      if (isMinor) {
        return globalKeyRoot;
      } else {
        // Major song in minor key selection -> use parallel/relative major (+3 semitones)
        const idx = NOTE_NAMES.indexOf(globalKeyRoot);
        return NOTE_NAMES[(idx + 3) % 12];
      }
    } else {
      // Global major mode:
      if (!isMinor) {
        return globalKeyRoot;
      } else {
        // Minor song in major key selection -> use relative minor (+9 semitones)
        const idx = NOTE_NAMES.indexOf(globalKeyRoot);
        return NOTE_NAMES[(idx + 9) % 12];
      }
    }
  };

  // Compute transposed steps and chords for a progression
  const getTransposedData = (prog: FamousProgression, targetKey: NoteName) => {
    const origRoot = getProgressionOriginalRoot(prog);
    const origRootIdx = NOTE_NAMES.indexOf(origRoot);
    const targetRootIdx = NOTE_NAMES.indexOf(targetKey);
    const semitonesDelta = (targetRootIdx - origRootIdx + 12) % 12;

    const isMinorBase = isProgressionMinor(prog);
    const targetLabel = getNoteLabel(targetKey, convention);
    const tonalityLabel = isMinorBase ? `${targetLabel}-moll` : `${targetLabel}-dur`;

    const steps = prog.steps.map((st, idx) => {
      const parsed = parseChordSymbol(st.symbol);
      const oldRootIdx = NOTE_NAMES.indexOf(parsed.root);
      const newRoot = NOTE_NAMES[(oldRootIdx + semitonesDelta) % 12];
      const chord = createChordDefinition(newRoot, parsed.quality, st.degree, st.role);

      let displaySymbol = chord.symbol;
      if (convention === 'polish') {
        const rootLabel = getNoteLabel(newRoot, 'polish');
        if (parsed.quality === 'minor') displaySymbol = `${rootLabel}m`;
        else if (parsed.quality === 'major') displaySymbol = rootLabel;
        else if (parsed.quality === 'dom7') displaySymbol = `${rootLabel}7`;
        else if (parsed.quality === 'maj7') displaySymbol = `${rootLabel}maj7`;
        else if (parsed.quality === 'min7') displaySymbol = `${rootLabel}m7`;
        else if (parsed.quality === 'm7b5') displaySymbol = `${rootLabel}m7b5`;
        else if (parsed.quality === 'augmented') displaySymbol = `${rootLabel}aug`;
        else if (parsed.quality === 'diminished') displaySymbol = `${rootLabel}dim`;
        else if (parsed.quality === 'dim7') displaySymbol = `${rootLabel}dim7`;
        else if (parsed.quality === 'sus4') displaySymbol = `${rootLabel}sus4`;
        else if (parsed.quality === 'sus2') displaySymbol = `${rootLabel}sus2`;
        else if (parsed.quality === 'dom7sus4') displaySymbol = `${rootLabel}7sus4`;
        else if (parsed.quality === 'major6') displaySymbol = `${rootLabel}6`;
        else if (parsed.quality === 'minor6') displaySymbol = `${rootLabel}m6`;
        else if (parsed.quality === 'add9') displaySymbol = `${rootLabel}add9`;
        else displaySymbol = `${rootLabel}${chord.displayQuality}`;
      }

      return {
        overallIndex: idx,
        symbol: displaySymbol,
        degree: st.degree,
        role: st.role,
        section: st.section,
        chord,
      };
    });

    return {
      tonalityLabel,
      semitonesDelta,
      steps,
      chords: steps.map((s) => s.chord),
    };
  };

  const handlePlayProg = async (prog: FamousProgression) => {
    if (playingId) return;
    setPlayingId(prog.id);

    const activeKey = getActiveKeyForProg(prog);
    const { chords } = getTransposedData(prog, activeKey);
    const midiList = chords.map((c) => c.defaultNotes.map((n) => n.midi));

    try {
      await sound.playProgression(midiList, 84);
    } finally {
      setPlayingId(null);
    }
  };

  const handleLoad = (prog: FamousProgression) => {
    setLastLoadedProgressionId(prog.id);
    setRevealedCardIds((prev) => new Set([...prev, prog.id]));
    const activeKey = getActiveKeyForProg(prog);
    const { chords, tonalityLabel } = getTransposedData(prog, activeKey);
    const isMinor = isProgressionMinor(prog);
    const formulaInfo = getProgressionRomanFormula(prog);
    const formulaString = formulaInfo.hasSections
      ? formulaInfo.sectionFormulas.map((s) => `${s.name}: ${s.formula}`).join(' | ')
      : formulaInfo.fullFormula;

    onLoadProgression(chords, {
      keyName: tonalityLabel,
      progName: prog.name,
      progId: prog.id,
      degrees: formulaString,
      root: activeKey,
      mode: isMinor ? 'minor' : 'major',
    });
  };

  // Helper when changing/randomizing global tonality:
  // 1. Clears green/red colors from previous exercise attempts
  // 2. Hides all chords across all progressions
  const handleTonalityChange = (newRoot: NoteName, newMode?: 'major' | 'minor') => {
    setGlobalKeyRoot(newRoot);
    if (newMode) setGlobalKeyMode(newMode);
    setCardKeyOverrides({});
    // Schowaj akordy we wszystkich wzorcach
    setRevealedCardIds(new Set());
    // Usuń kolory czerwony i zielony z akordów
    onClearWorkshopResults?.();
  };

  // Randomize global tonality (picks a random root note, preserving current major/minor mode)
  const handleRandomizeGlobalKey = () => {
    const otherRoots = NOTE_NAMES.filter((r) => r !== globalKeyRoot);
    const randomRoot = otherRoots[Math.floor(Math.random() * otherRoots.length)];
    handleTonalityChange(randomRoot);
  };

  // Transpose global key by +/- semitones
  const handleShiftGlobalKey = (delta: number) => {
    const currentIdx = NOTE_NAMES.indexOf(globalKeyRoot);
    const nextIdx = (currentIdx + delta + 12) % 12;
    handleTonalityChange(NOTE_NAMES[nextIdx]);
  };

  // Transpose individual progression key by +/- semitones
  const handleShiftCardKey = (progId: string, currentKey: NoteName, delta: number) => {
    const currentIdx = NOTE_NAMES.indexOf(currentKey);
    const nextIdx = (currentIdx + delta + 12) % 12;
    setCardKeyOverrides((prev) => ({
      ...prev,
      [progId]: NOTE_NAMES[nextIdx],
    }));
  };

  const handleSetCardKeyDirect = (progId: string, note: NoteName) => {
    setCardKeyOverrides((prev) => ({
      ...prev,
      [progId]: note,
    }));
    setOpenCardKeyPickerId(null);
  };

  const handleResetCardKey = (progId: string) => {
    setCardKeyOverrides((prev) => {
      const copy = { ...prev };
      delete copy[progId];
      return copy;
    });
    setOpenCardKeyPickerId(null);
  };

  const genres = ['all', 'Pop', 'Rock', 'Film', 'Jazz', 'Blues', 'Neo-Soul', 'Klasyka'];

  const filteredProgressions = useMemo(() => {
    const list = FAMOUS_PROGRESSIONS.filter((prog) => {
      if (selectedGenre !== 'all' && !prog.genre.toLowerCase().includes(selectedGenre.toLowerCase())) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = prog.name.toLowerCase().includes(q);
        const matchDesc = prog.description.toLowerCase().includes(q);
        const matchGenre = prog.genre.toLowerCase().includes(q);
        const matchKey = prog.key.toLowerCase().includes(q);
        const matchSteps = prog.steps.some(
          (s) => s.symbol.toLowerCase().includes(q) || s.degree.toLowerCase().includes(q)
        );
        if (!matchName && !matchDesc && !matchGenre && !matchKey && !matchSteps) {
          return false;
        }
      }
      return true;
    });

    // Jeśli wzorzec został załadowany do warsztatu, przesuń go na pierwsze miejsce (#1) w otwartym gatunku/liście
    if (lastLoadedProgressionId) {
      const idx = list.findIndex((p) => p.id === lastLoadedProgressionId);
      if (idx > 0) {
        const [loadedProg] = list.splice(idx, 1);
        list.unshift(loadedProg);
      }
    }

    return list;
  }, [selectedGenre, searchQuery, lastLoadedProgressionId]);

  // Popular key presets
  const popularMajorKeys: NoteName[] = ['C', 'G', 'D', 'F', 'A', 'E', 'B'];
  const popularMinorKeys: NoteName[] = ['A', 'E', 'D', 'B', 'F#', 'C'];

  const signatureInfo = KEY_SIGNATURE_DATA[globalKeyRoot];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Music className="w-6 h-6 text-amber-400" />
              <span>Wzorce Progresji Harmonicznych</span>
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Przeglądaj legendarne schematy akordowe. Możesz <strong>zmieniać tonację wzorcową</strong> na dowolną z 12 tonacji (C-dur, G-dur, D-dur, A-dur, a-moll itp.) i natychmiast załadować ją do warsztatu!
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MASTER REFERENCE TONALITY & TRANSPOSITION CONTROL BAR   */}
      {/* ======================================================== */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#090d16] border border-amber-500/30 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-white">
                  Tonacja Wzorcowa (Transpozycja):
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-amber-400 text-slate-950 font-black text-xs shadow-sm">
                  {getNoteLabel(globalKeyRoot, convention)}-{globalKeyMode === 'major' ? 'dur' : 'moll'}
                </span>
                <button
                  type="button"
                  onClick={handleRandomizeGlobalKey}
                  title="Wylosuj losową tonację (np. G-dur, D-dur, d-moll, F-dur itp.)"
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-amber-300 hover:text-slate-950 bg-amber-400/20 hover:bg-amber-400 border border-amber-400/40 rounded-lg cursor-pointer transition-all active:scale-95 shadow-sm"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Losuj tonację</span>
                </button>
                <span className="text-[11px] text-amber-400/80 font-medium hidden sm:inline">
                  · {signatureInfo.accidentals}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Wszystkie schematy automatycznie przeliczają się do wybranej tonacji.
              </p>
            </div>
          </div>

          {/* Quick semitone, random & reset buttons */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto flex-wrap">
            <button
              type="button"
              onClick={handleRandomizeGlobalKey}
              title="Wylosuj losową tonację"
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-300 hover:text-slate-950 bg-amber-400/20 hover:bg-amber-400 border border-amber-400/40 rounded-lg cursor-pointer transition-colors active:scale-95"
            >
              <Dice5 className="w-3.5 h-3.5" />
              <span>Losuj</span>
            </button>
            <button
              type="button"
              onClick={() => handleShiftGlobalKey(-1)}
              title="Obniż o półton w dół (-1)"
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors active:scale-95"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>-1 półton</span>
            </button>
            <button
              type="button"
              onClick={() => handleShiftGlobalKey(1)}
              title="Podwyższ o półton w górę (+1)"
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors active:scale-95"
            >
              <span>+1 półton</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleTonalityChange('C', 'major')}
              title="Przywróć tonację wyjściową (C-dur / A-moll)"
              className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-amber-400 bg-slate-800/80 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors ml-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Reset (C-dur)</span>
            </button>
          </div>
        </div>

        {/* Mode Toggle: Dur (Major) vs Moll (Minor) */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-semibold text-slate-400 mr-1">Tryb:</span>
          <div className="inline-flex rounded-xl bg-slate-900 border border-slate-800 p-0.5">
            <button
              type="button"
              onClick={() => handleTonalityChange(globalKeyRoot, 'major')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                globalKeyMode === 'major'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tonacja Durowa (Dur)
            </button>
            <button
              type="button"
              onClick={() => handleTonalityChange(globalKeyRoot, 'minor')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                globalKeyMode === 'minor'
                  ? 'bg-purple-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tonacja Molowa (Moll)
            </button>
          </div>

          {/* Quick Popular Presets */}
          <div className="flex items-center gap-1.5 ml-auto overflow-x-auto text-xs">
            <span className="text-slate-400 font-medium text-[11px]">Szybki wybór:</span>
            {(globalKeyMode === 'major' ? popularMajorKeys : popularMinorKeys).map((note) => {
              const label = getNoteLabel(note, convention);
              const isSelected = globalKeyRoot === note;
              return (
                <button
                  key={`quick_${note}`}
                  type="button"
                  onClick={() => handleTonalityChange(note)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 ring-1 ring-amber-300'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {label}-{globalKeyMode === 'major' ? 'dur' : 'moll'}
                </button>
              );
            })}
          </div>
        </div>

        {/* 12 Key Selector Chips */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span>Wszystkie 12 prym tonacji:</span>
            <span className="text-slate-400 text-[10px]">
              Kliknij klawisz, aby natychmiast przestawić wzorce
            </span>
          </div>
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
            {NOTE_NAMES.map((note) => {
              const isSelected = globalKeyRoot === note;
              const label = getNoteLabel(note, convention);

              return (
                <button
                  key={`global_key_${note}`}
                  type="button"
                  onClick={() => handleTonalityChange(note)}
                  className={`px-2 py-2 rounded-xl font-black text-xs cursor-pointer transition-all text-center flex flex-col items-center justify-center ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 shadow-md scale-105 ring-2 ring-amber-300'
                      : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/60'
                  }`}
                >
                  <span className="text-sm">{label}</span>
                  <span className={`text-[9px] font-semibold ${isSelected ? 'text-slate-900' : 'text-slate-400'}`}>
                    {globalKeyMode === 'major' ? 'dur' : 'moll'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Szukaj wzorca (np. Pop, Jazz, Pachelbel, Kadencja)..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer p-0.5"
            >
              ✕
            </button>
          )}
        </div>

        {/* Global Show/Hide all chords toggle */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="text-[11px] text-slate-400 hidden sm:inline">Karty wzorców:</span>
          {revealedCardIds.size > 0 ? (
            <button
              type="button"
              onClick={handleHideAllChords}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 cursor-pointer transition-colors"
              title="Ukryj akordy we wszystkich wzorcach"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Ukryj wszystkie akordy</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRevealAllChords}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-xl bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 cursor-pointer transition-colors"
              title="Pokaż akordy we wszystkich wzorcach"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Odkryj wszystkie akordy</span>
            </button>
          )}
        </div>
      </div>

      {/* Genre Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-slate-400 font-medium mr-1">Filtruj gatunek:</span>
        {genres.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setSelectedGenre(g)}
            className={`px-3 py-1 rounded-xl font-semibold cursor-pointer transition-all shrink-0 ${
              selectedGenre === g
                ? 'bg-slate-100 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {g === 'all' ? 'Wszystkie wzorce' : g}
          </button>
        ))}
      </div>

      {/* Progressions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredProgressions.map((prog) => {
          const isPlaying = playingId === prog.id;
          const activeKey = getActiveKeyForProg(prog);
          const { tonalityLabel, steps, semitonesDelta } = getTransposedData(prog, activeKey);
          const hasOverride = Boolean(cardKeyOverrides[prog.id]);
          const isPickerOpen = openCardKeyPickerId === prog.id;
          const isLastLoaded = lastLoadedProgressionId === prog.id;
          const formulaInfo = getProgressionRomanFormula(prog);

          const isCurrentLoadedProg = prog.id === (loadedProgressionId || lastLoadedProgressionId);
          const relevantResults = isCurrentLoadedProg ? workshopResults || {} : {};
          const correctCount = Object.values(relevantResults).filter((r) => r.status === 'correct').length;
          const incorrectCount = Object.values(relevantResults).filter((r) => r.status === 'incorrect').length;
          const hasAnyAttempt = isCurrentLoadedProg && (correctCount > 0 || incorrectCount > 0);

          {/* Render single chord tile with green (correct) or red (incorrect) styling */}
          const renderChordTile = (st: (typeof steps)[0]) => {
            const stepNumber = (st.overallIndex ?? 0) + 1;
            const result = isCurrentLoadedProg ? relevantResults[stepNumber] : undefined;
            const isCorrect = result?.status === 'correct';
            const isIncorrect = result?.status === 'incorrect';

            let containerClass =
              'bg-slate-900 sm:bg-slate-950 border border-slate-800 text-white hover:border-amber-400/40';
            let badgeEl = null;

            if (isCorrect) {
              containerClass =
                'bg-emerald-950/85 border-2 border-emerald-500 text-emerald-100 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-950/50 scale-[1.02]';
              badgeEl = (
                <div className="mt-1 flex items-center justify-center gap-1 text-[9px] font-black text-emerald-300 bg-emerald-500/25 px-1.5 py-0.5 rounded border border-emerald-500/40">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                  <span>Poprawny</span>
                </div>
              );
            } else if (isIncorrect) {
              containerClass =
                'bg-rose-950/85 border-2 border-rose-500 text-rose-100 ring-2 ring-rose-500/40 shadow-lg shadow-rose-950/50 scale-[1.02]';
              badgeEl = (
                <div className="mt-1 flex flex-col items-center">
                  <div className="flex items-center justify-center gap-1 text-[9px] font-black text-rose-300 bg-rose-500/25 px-1.5 py-0.5 rounded border border-rose-500/40">
                    <X className="w-2.5 h-2.5 stroke-[3]" />
                    <span>Błędny</span>
                  </div>
                  {result?.playedChordSymbol && (
                    <span
                      className="text-[8px] text-rose-300/90 font-mono mt-0.5 truncate max-w-[66px]"
                      title={`Zagrany z klawiatury: ${result.playedChordSymbol}`}
                    >
                      Zagr: {result.playedChordSymbol}
                    </span>
                  )}
                </div>
              );
            } else if (isCurrentLoadedProg) {
              badgeEl = (
                <div className="mt-1 text-[9px] text-slate-500 font-medium">Krok {stepNumber}</div>
              );
            }

            return (
              <div
                key={`${prog.id}_chord_${st.overallIndex ?? stepNumber}`}
                className={`p-2 rounded-xl min-w-[68px] sm:min-w-[72px] text-center shadow-sm transition-all ${containerClass}`}
                title={`${st.symbol} (${st.degree}): ${st.role}${
                  result
                    ? ` · Status w ćwiczeniu: ${
                        result.status === 'correct'
                          ? 'Poprawnie zagrany na klawiaturze (zielony)'
                          : result.status === 'incorrect'
                          ? 'Błędnie zagrany na klawiaturze (czerwony)'
                          : 'Brak próby'
                      }`
                    : ''
                }`}
              >
                <div className="text-sm sm:text-base font-black tracking-tight">
                  {st.symbol}
                </div>
                <div
                  className={`text-[10px] font-mono font-semibold mt-0.5 truncate max-w-[70px] ${
                    isCorrect
                      ? 'text-emerald-300 font-bold'
                      : isIncorrect
                      ? 'text-rose-300 font-bold'
                      : 'text-amber-400/90'
                  }`}
                >
                  {st.degree}
                </div>
                {badgeEl}
              </div>
            );
          };

          return (
            <div
              key={prog.id}
              id={`progression-card-${prog.id}`}
              data-progression-id={prog.id}
              data-loaded-progression={isLastLoaded ? 'true' : undefined}
              className={`p-5 rounded-2xl flex flex-col justify-between transition-all duration-500 shadow-xl scroll-mt-24 ${
                isLastLoaded
                  ? 'bg-slate-900 border-2 border-amber-400 ring-4 ring-amber-400/20 shadow-amber-500/10'
                  : 'bg-slate-900/90 border border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {isLastLoaded && (
                        <span className="text-[10px] font-black text-slate-950 bg-amber-400 px-2 py-0.5 rounded-full border border-amber-300 shadow-sm flex items-center gap-1">
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>Aktywny w warsztacie (#1)</span>
                        </span>
                      )}
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                        {prog.genre}
                      </span>
                      <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700/60">
                        Oryginał: {prog.key}
                      </span>
                      {semitonesDelta !== 0 && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                          {semitonesDelta > 0 ? `+${semitonesDelta}` : semitonesDelta} półtonów
                        </span>
                      )}
                      <span className="text-[10px] font-semibold text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700/60">
                        {steps.length} {steps.length === 1 ? 'akord' : steps.length < 5 ? 'akordy' : 'akordów'}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mt-1">
                      {prog.name}
                    </h3>

                    {/* Prominent Roman Numeral Progression (e.g. I - V - vi - ii7) */}
                    {formulaInfo.hasSections ? (
                      <div className="mt-2 space-y-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-semibold text-slate-400 font-sans flex items-center gap-1">
                            <Music className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>Progresja:</span>
                          </span>
                          {formulaInfo.sectionFormulas.map((sec) => (
                            <span
                              key={`${prog.id}_sec_badge_${sec.name}`}
                              className="text-[11px] font-bold font-mono px-2 py-0.5 rounded-lg bg-slate-950 border border-amber-500/35 text-amber-300 flex items-center gap-1.5 shadow-sm"
                            >
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-sans">
                                {sec.name}:
                              </span>
                              <span className="text-white font-black">{sec.formula}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold font-mono px-2.5 py-1 rounded-xl bg-slate-950 border border-amber-500/35 text-amber-300 flex items-center gap-1.5 shadow-sm">
                          <Music className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="text-[11px] font-semibold text-slate-400 font-sans">Progresja:</span>
                          <span className="text-white font-black tracking-wide">{formulaInfo.fullFormula}</span>
                        </span>
                      </div>
                    )}

                    {prog.structure && (
                      <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/70 border border-emerald-500/40 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                          <Sparkles className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                          <span>Forma: {prog.structure}</span>
                        </span>
                      </div>
                    )}
                    {hasAnyAttempt && (
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        {correctCount > 0 && (
                          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>
                              {correctCount} {correctCount === 1 ? 'poprawny' : correctCount < 5 ? 'poprawne' : 'poprawnych'}
                            </span>
                          </span>
                        )}
                        {incorrectCount > 0 && (
                          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm">
                            <X className="w-3.5 h-3.5 stroke-[3]" />
                            <span>
                              {incorrectCount} {incorrectCount === 1 ? 'błąd' : incorrectCount < 5 ? 'błędy' : 'błędów'} w ćwiczeniu
                            </span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePlayProg(prog)}
                    disabled={isPlaying}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer border shrink-0 ${
                      isPlaying
                        ? 'bg-amber-400 text-slate-950 border-amber-400 animate-pulse'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 active:scale-95'
                    }`}
                  >
                    {isPlaying ? (
                      <Square className="w-3.5 h-3.5 fill-current" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" />
                    )}
                    <span>{isPlaying ? 'Gra...' : 'Odsłuchaj'}</span>
                  </button>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  {prog.description}
                </p>

                {/* Chords Reveal Section: Hidden by default, shown upon clicking button */}
                {revealedCardIds.has(prog.id) ? (
                  <div className="my-3 space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => toggleCardChords(prog.id)}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 cursor-pointer transition-colors active:scale-95"
                        title="Ukryj akordy tego wzorca"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Ukryj akordy</span>
                      </button>
                      <span className="text-[11px] text-amber-400/90 font-mono font-medium">
                        Akordy w {tonalityLabel}
                      </span>
                    </div>

                    {/* Section-Aware Chord Steps Display */}
                    {(() => {
                      const hasSections = steps.some((st) => Boolean(st.section));
                      if (hasSections) {
                        const sectionGroups: { name: string; steps: typeof steps }[] = [];
                        steps.forEach((st) => {
                          const secName = st.section || 'Główna fraza';
                          const lastGroup = sectionGroups[sectionGroups.length - 1];
                          if (lastGroup && lastGroup.name === secName) {
                            lastGroup.steps.push(st);
                          } else {
                            sectionGroups.push({ name: secName, steps: [st] });
                          }
                        });

                        return (
                          <div className="space-y-2.5 pt-1">
                            {sectionGroups.map((group, gIdx) => (
                              <div
                                key={`${prog.id}_sec_${gIdx}`}
                                className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/90 shadow-inner"
                              >
                                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[10px] font-bold text-amber-300 tracking-wide uppercase px-2 py-0.5 rounded-md bg-amber-400/10 border border-amber-400/25">
                                      {group.name}
                                    </span>
                                    <span className="text-[11px] font-mono font-bold text-amber-300 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                                      {group.steps.map((st) => formatDegreeLabel(st.degree)).join(' – ')}
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    {group.steps.length} {group.steps.length === 1 ? 'akord' : group.steps.length < 5 ? 'akordy' : 'akordów'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-800">
                                  {group.steps.map((st, sIdx) => (
                                    <React.Fragment key={`${prog.id}_${gIdx}_${sIdx}`}>
                                      {renderChordTile(st)}
                                      {sIdx < group.steps.length - 1 && (
                                        <ArrowRight className="w-3 h-3 text-slate-700 shrink-0" />
                                      )}
                                    </React.Fragment>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-1.5">
                          <div className="text-[11px] font-mono font-bold text-amber-300 flex items-center gap-1.5 bg-slate-950 px-2.5 py-0.5 rounded-lg border border-slate-800 w-fit">
                            <span className="text-[10px] text-slate-400 font-sans font-medium">Progresja:</span>
                            <span className="text-white font-black">{steps.map((st) => formatDegreeLabel(st.degree)).join(' – ')}</span>
                          </div>
                          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
                            {steps.map((st, sIdx) => (
                              <React.Fragment key={`${prog.id}_step_${sIdx}`}>
                                {renderChordTile(st)}
                                {sIdx < steps.length - 1 && (
                                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                                )}
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="my-3">
                    <button
                      type="button"
                      onClick={() => toggleCardChords(prog.id)}
                      className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl cursor-pointer transition-all active:scale-95 shadow-sm group ${
                        hasAnyAttempt
                          ? 'bg-slate-900 text-slate-100 border-2 border-amber-400/70 shadow-amber-500/10'
                          : 'bg-slate-950/90 hover:bg-slate-800 text-amber-400 hover:text-amber-300 border border-slate-800 hover:border-amber-400/50'
                      }`}
                      title="Kliknij, aby odkryć jakie akordy wchodzą w skład tego wzorca w tonacji"
                    >
                      <Eye className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform stroke-[2.5]" />
                      <span>Pokaż akordy wzorca ({steps.length})</span>
                      {hasAnyAttempt && (
                        <span className="flex items-center gap-1.5 ml-1">
                          {correctCount > 0 && (
                            <span className="text-emerald-400 font-bold">({correctCount} ✓)</span>
                          )}
                          {incorrectCount > 0 && (
                            <span className="text-rose-400 font-bold">({incorrectCount} ✗)</span>
                          )}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-400 font-normal">w {tonalityLabel}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Card Footer with Individual Key Selector & Load Button */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  {/* Local Tonality Changer for this specific progression */}
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="text-slate-400 text-[11px] font-medium">Tonacja wzorca:</span>
                    <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => handleShiftCardKey(prog.id, activeKey, -1)}
                        title="Obniż o półton (-1)"
                        className="px-1.5 py-0.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded cursor-pointer transition-colors"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>

                      {/* Clickable tonality badge to toggle key picker */}
                      <button
                        type="button"
                        onClick={() => setOpenCardKeyPickerId(isPickerOpen ? null : prog.id)}
                        className="px-2 font-bold text-amber-400 hover:text-amber-300 text-xs cursor-pointer flex items-center gap-1"
                        title="Kliknij, aby wybrać dowolną tonację dla tego wzorca"
                      >
                        <span>{tonalityLabel}</span>
                        <Compass className="w-3 h-3 opacity-60" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleShiftCardKey(prog.id, activeKey, 1)}
                        title="Podwyższ o półton (+1)"
                        className="px-1.5 py-0.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded cursor-pointer transition-colors"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>

                    {hasOverride && (
                      <button
                        type="button"
                        onClick={() => handleResetCardKey(prog.id)}
                        title="Wróć do globalnej tonacji wzorcowej"
                        className="p-1 text-slate-400 hover:text-amber-400 rounded cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Load into workshop button */}
                  <button
                    type="button"
                    onClick={() => handleLoad(prog)}
                    className={`flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md active:scale-95 ${
                      isLastLoaded
                        ? 'bg-amber-400 text-slate-950 font-black ring-2 ring-amber-300 shadow-amber-400/20'
                        : 'text-slate-950 bg-amber-400 hover:bg-amber-300'
                    }`}
                    title="Wstaw ten schemat do warsztatu progresji"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isLastLoaded ? `Załadowany do warsztatu (#1) · ${tonalityLabel}` : `Wstaw do warsztatu (${tonalityLabel})`}</span>
                  </button>
                </div>

                {/* Inline 12-key picker for this individual card when opened */}
                {isPickerOpen && (
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-amber-500/40 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold mb-1.5">
                      <span>Wybierz tonację dla "{prog.name}":</span>
                      <button
                        type="button"
                        onClick={() => setOpenCardKeyPickerId(null)}
                        className="text-slate-400 hover:text-white cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="grid grid-cols-6 gap-1">
                      {NOTE_NAMES.map((note) => {
                        const isCardKeySelected = activeKey === note;
                        const label = getNoteLabel(note, convention);
                        return (
                          <button
                            key={`${prog.id}_key_${note}`}
                            type="button"
                            onClick={() => handleSetCardKeyDirect(prog.id, note)}
                            className={`px-2 py-1 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                              isCardKeySelected
                                ? 'bg-amber-400 text-slate-950 shadow-sm'
                                : 'bg-slate-900 hover:bg-slate-800 text-slate-200'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
