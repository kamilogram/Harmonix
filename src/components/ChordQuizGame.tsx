import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  NoteName,
  ChordQuality,
  NamingConvention,
  ChordDefinition,
} from '../types/music';
import {
  NOTE_NAMES,
  CHORD_INTERVALS,
  CHORD_QUALITY_NAMES,
  createChordDefinition,
  getNoteLabel,
  getFullNoteLabel,
} from '../utils/musicTheory';
import { sound } from '../utils/audioEngine';
import { PianoKeyboard } from './PianoKeyboard';
import {
  Volume2,
  Play,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Flame,
  Trophy,
  Filter,
  Eye,
  EyeOff,
  Music2,
  Info,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';

export interface ChordQuizGameProps {
  convention: NamingConvention;
  isActiveTab?: boolean;
}

// Available filter categories for chord pools
type ChordCategoryFilter = 'all' | 'five_note' | 'triads_power' | 'sevenths' | 'suspended_add' | 'tension_sixths';

interface QuizFilterOption {
  id: ChordCategoryFilter;
  label: string;
  badge: string;
  qualities: ChordQuality[];
  description: string;
}

const QUIZ_FILTER_OPTIONS: QuizFilterOption[] = [
  {
    id: 'all',
    label: 'Wszystkie akordy (w tym 5-dźwięki)',
    badge: '24 typy',
    qualities: [
      'power5', 'major', 'minor', 'dom7', 'maj7', 'min7', 'major6', 'minor6',
      'diminished', 'dim7', 'm7b5', 'augmented', 'sus2', 'sus4', 'dom7sus4', 'add9',
      'dom9', 'maj9', 'min9', 'sixNine', 'minSixNine', 'dom7b9', 'dom7sharp9', 'nineSus4'
    ],
    description: 'Pełny repertuar: od surowego power chordu 5 i trójdźwięków po 5-klawiszowe jazzowe i funkowe harmonie (9, maj9, m9, 6/9, 7b9, 7#9, 9sus4).',
  },
  {
    id: 'five_note',
    label: 'Akordy 5-dźwiękowe (5 klawiszy)',
    badge: '9, maj9, 6/9...',
    qualities: ['dom9', 'maj9', 'min9', 'sixNine', 'minSixNine', 'dom7b9', 'dom7sharp9', 'nineSus4'],
    description: 'Bogate, wielodźwiękowe akordy jazzowe, neo-soul i fusion wymagające aż 5 klawiszy.',
  },
  {
    id: 'triads_power',
    label: 'Trójdźwięki & Power chord 5',
    badge: '5, dur & moll',
    qualities: ['power5', 'major', 'minor'],
    description: 'Podstawowe trójdźwięki durowe i molowe oraz rockowy dwudźwięk 5 (pryma + kwinta).',
  },
  {
    id: 'sevenths',
    label: 'Akordy septymowe (Jazz & Soul)',
    badge: '7, maj7, m7, m7b5',
    qualities: ['dom7', 'maj7', 'min7', 'm7b5'],
    description: 'Nastrojowe akordy czterodźwiękowe z septymą wielką, małą lub zmniejszoną.',
  },
  {
    id: 'suspended_add',
    label: 'Zawieszone & Nony',
    badge: 'sus2, sus4, 9sus4, add9',
    qualities: ['sus2', 'sus4', 'dom7sus4', 'nineSus4', 'add9'],
    description: 'Przestrzenne, otwarte brzmienia popowe, filmowe i gospelowe.',
  },
  {
    id: 'tension_sixths',
    label: 'Szóstki & Napięcia',
    badge: '6, m6, dim, dim7, aug, 7#9',
    qualities: ['major6', 'minor6', 'diminished', 'dim7', 'augmented', 'dom7sharp9'],
    description: 'Filmowe, retro i suspensowe harmonie oraz psychodeliczny blues.',
  },
];

// Definition of Chromatic Roots (Row 1)
interface RootOption {
  index: number;
  rootName: NoteName;
  intlLabel: string;
  intlSub: string;
  polishLabel: string;
  polishSub: string;
}

const ROOT_OPTIONS: RootOption[] = [
  { index: 0, rootName: 'C', intlLabel: 'C', intlSub: '1', polishLabel: 'C', polishSub: '1' },
  { index: 1, rootName: 'C#', intlLabel: 'C# / Db', intlSub: 'Cis/Des', polishLabel: 'Cis / Des', polishSub: 'C#' },
  { index: 2, rootName: 'D', intlLabel: 'D', intlSub: '2', polishLabel: 'D', polishSub: '2' },
  { index: 3, rootName: 'D#', intlLabel: 'D# / Eb', intlSub: 'Dis/Es', polishLabel: 'Dis / Es', polishSub: 'D#' },
  { index: 4, rootName: 'E', intlLabel: 'E', intlSub: '3', polishLabel: 'E', polishSub: '3' },
  { index: 5, rootName: 'F', intlLabel: 'F', intlSub: '4', polishLabel: 'F', polishSub: '4' },
  { index: 6, rootName: 'F#', intlLabel: 'F# / Gb', intlSub: 'Fis/Ges', polishLabel: 'Fis / Ges', polishSub: 'F#' },
  { index: 7, rootName: 'G', intlLabel: 'G', intlSub: '5', polishLabel: 'G', polishSub: '5' },
  { index: 8, rootName: 'G#', intlLabel: 'G# / Ab', intlSub: 'Gis/As', polishLabel: 'Gis / As', polishSub: 'G#' },
  { index: 9, rootName: 'A', intlLabel: 'A', intlSub: '6', polishLabel: 'A', polishSub: '6' },
  { index: 10, rootName: 'A#', intlLabel: 'Bb / A#', intlSub: 'B/Ais', polishLabel: 'B / Ais', polishSub: 'A#' },
  { index: 11, rootName: 'B', intlLabel: 'B (H)', intlSub: '7', polishLabel: 'H', polishSub: 'B' },
];

// Definition of Base Quality / Mode (Row 2)
interface BaseQualityOption {
  id: string; // '', 'm', 'maj', 'dim', 'aug'
  label: string;
  sub: string;
  desc: string;
}

const BASE_QUALITY_OPTIONS: BaseQualityOption[] = [
  { id: '', label: '"" (dur)', sub: 'czysty / durowy', desc: 'Podstawa durowa (tercja wielka)' },
  { id: 'm', label: 'm (moll)', sub: 'molowy', desc: 'Podstawa molowa (tercja mała)' },
  { id: 'maj', label: 'maj', sub: 'wielka septyma', desc: 'Durowy z wielką septymą (jazz/soul)' },
  { id: 'dim', label: 'dim', sub: 'zmniejszony', desc: 'Zmniejszona kwinta (tercja m. + kwinta zm.)' },
  { id: 'aug', label: 'aug', sub: 'zwiększony (+)', desc: 'Zwiększona kwinta (tercja w. + kwinta zw.)' },
];

// Definition of Extension / Modifier (Row 3)
interface ExtensionOption {
  id: string; // 'brak', '5', '6', '7', '7b5', '9', '6/9', '7b9', '7#9', 'sus2', 'sus4', '7sus4', '9sus4', 'add9'
  label: string;
  sub: string;
  desc: string;
}

const EXTENSION_OPTIONS: ExtensionOption[] = [
  { id: 'brak', label: '— (brak)', sub: 'trójdźwięk', desc: 'Trójdźwięk bez dodatków' },
  { id: '5', label: '5', sub: 'kwinta (power)', desc: 'Akord kwintowy (2 dźwięki: pryma + kwinta)' },
  { id: '6', label: '6', sub: 'seksta', desc: 'Dodana seksta wielka' },
  { id: '7', label: '7', sub: 'septyma', desc: 'Septyma mała lub zmniejszona' },
  { id: '7b5', label: '7b5', sub: 'półzmniejszony', desc: 'Półzmniejszony (m7b5)' },
  { id: '9', label: '9', sub: 'nona (5 kl.)', desc: 'Akord nonowy (9 / m9 / maj9) - 5 dźwięków' },
  { id: '6/9', label: '6/9', sub: 'seksta + nona (5 kl.)', desc: 'Akord sekstowo-nonowy (6/9 / m6/9) - 5 dźwięków' },
  { id: '7b9', label: '7b9', sub: 'septyma + b9 (5 kl.)', desc: 'Dominanta z małą noną (7b9) - 5 dźwięków' },
  { id: '7#9', label: '7#9', sub: 'Hendrix (#9) (5 kl.)', desc: 'Kultowy akord Hendrixa (7#9) - 5 dźwięków' },
  { id: 'sus2', label: 'sus2', sub: 'zawieszona 2', desc: 'Zawieszona sekunda (zamiast tercji)' },
  { id: 'sus4', label: 'sus4', sub: 'zawieszona 4', desc: 'Zawieszona kwarta (zamiast tercji)' },
  { id: '7sus4', label: '7sus4', sub: 'septyma + 4', desc: 'Septyma dominantowa z zawieszoną kwartą' },
  { id: '9sus4', label: '9sus4', sub: 'nona + 4 (5 kl.)', desc: 'Zawieszona kwarta i dodana nona (5 dźwięków)' },
  { id: 'add9', label: 'add9', sub: 'dodana nona', desc: 'Trójdźwięk z dodaną noną wielką' },
];

// Valid chord interpretation calculated for active pitch classes
interface ValidChordInterpretation {
  rootIndex: number;
  root: NoteName;
  quality: ChordQuality;
  symbol: string;
  polishSymbol: string;
  description: string;
  // Matching combinations of (base, ext) in rows 2 & 3
  matchingKeys: { base: string; ext: string }[];
}

/**
 * Given MIDI notes, calculate ALL legitimate chord interpretations for this pitch class set.
 * E.g. {C, E, G, A} yields BOTH C6 and Am7!
 * {D#, F#, A, C} yields D#dim7, F#dim7, Adim7, Cdim7!
 * {C, D, G} yields Csus2 and Gsus4!
 */
function findAllValidChordsForNotes(midiNotes: number[]): ValidChordInterpretation[] {
  if (midiNotes.length === 0) return [];

  // Extract unique pitch classes 0..11
  const pitchClasses = Array.from(new Set(midiNotes.map((m) => ((m % 12) + 12) % 12))).sort((a, b) => a - b);
  const validChords: ValidChordInterpretation[] = [];

  // All 24 supported qualities
  const allQualities: ChordQuality[] = [
    'power5', 'major', 'minor', 'dom7', 'maj7', 'min7', 'major6', 'minor6',
    'diminished', 'dim7', 'm7b5', 'augmented', 'sus2', 'sus4', 'dom7sus4', 'add9',
    'dom9', 'maj9', 'min9', 'sixNine', 'minSixNine', 'dom7b9', 'dom7sharp9', 'nineSus4'
  ];

  for (let r = 0; r < 12; r++) {
    const rootName = NOTE_NAMES[r];

    for (const q of allQualities) {
      const intervals = CHORD_INTERVALS[q];
      // Normalize intervals modulo 12 for pitch-class comparison
      const normalizedIntervals = Array.from(new Set(intervals.map((iv) => iv % 12))).sort((a, b) => a - b);
      if (normalizedIntervals.length !== pitchClasses.length) continue;

      const targetPitches = normalizedIntervals.map((iv) => (r + iv) % 12).sort((a, b) => a - b);

      // Check if targetPitches identical to pitchClasses
      let isMatch = true;
      for (let i = 0; i < pitchClasses.length; i++) {
        if (targetPitches[i] !== pitchClasses[i]) {
          isMatch = false;
          break;
        }
      }

      if (isMatch) {
        const chordDef = createChordDefinition(rootName, q);
        const matchingKeys: { base: string; ext: string }[] = [];

        // Map quality to acceptable (base, ext) pairs
        if (q === 'power5') matchingKeys.push({ base: '', ext: '5' });
        else if (q === 'major') matchingKeys.push({ base: '', ext: 'brak' });
        else if (q === 'minor') matchingKeys.push({ base: 'm', ext: 'brak' });
        else if (q === 'dom7') matchingKeys.push({ base: '', ext: '7' });
        else if (q === 'maj7') {
          matchingKeys.push({ base: 'maj', ext: '7' });
          matchingKeys.push({ base: 'maj', ext: 'brak' });
        } else if (q === 'min7') matchingKeys.push({ base: 'm', ext: '7' });
        else if (q === 'major6') matchingKeys.push({ base: '', ext: '6' });
        else if (q === 'minor6') matchingKeys.push({ base: 'm', ext: '6' });
        else if (q === 'diminished') matchingKeys.push({ base: 'dim', ext: 'brak' });
        else if (q === 'dim7') matchingKeys.push({ base: 'dim', ext: '7' });
        else if (q === 'm7b5') {
          matchingKeys.push({ base: 'm', ext: '7b5' });
          matchingKeys.push({ base: 'dim', ext: '7b5' });
        } else if (q === 'augmented') matchingKeys.push({ base: 'aug', ext: 'brak' });
        else if (q === 'sus2') matchingKeys.push({ base: '', ext: 'sus2' });
        else if (q === 'sus4') matchingKeys.push({ base: '', ext: 'sus4' });
        else if (q === 'dom7sus4') matchingKeys.push({ base: '', ext: '7sus4' });
        else if (q === 'add9') matchingKeys.push({ base: '', ext: 'add9' });
        else if (q === 'dom9') matchingKeys.push({ base: '', ext: '9' });
        else if (q === 'maj9') matchingKeys.push({ base: 'maj', ext: '9' });
        else if (q === 'min9') matchingKeys.push({ base: 'm', ext: '9' });
        else if (q === 'sixNine') matchingKeys.push({ base: '', ext: '6/9' });
        else if (q === 'minSixNine') matchingKeys.push({ base: 'm', ext: '6/9' });
        else if (q === 'dom7b9') matchingKeys.push({ base: '', ext: '7b9' });
        else if (q === 'dom7sharp9') matchingKeys.push({ base: '', ext: '7#9' });
        else if (q === 'nineSus4') matchingKeys.push({ base: '', ext: '9sus4' });

        validChords.push({
          rootIndex: r,
          root: rootName,
          quality: q,
          symbol: chordDef.symbol,
          polishSymbol: chordDef.polishSymbol,
          description: CHORD_QUALITY_NAMES[q].desc,
          matchingKeys,
        });
      }
    }
  }

  return validChords;
}

/**
 * Format user's composed chord name given selected root, base, and extension
 */
function formatComposedChord(
  rootIndex: number | null,
  baseId: string | null,
  extId: string | null,
  convention: NamingConvention
): { fullSymbol: string; plSymbol: string; description: string; isValidCombination: boolean } {
  if (rootIndex === null) {
    return { fullSymbol: '—', plSymbol: '—', description: 'Wybierz prymę w pierwszym wierszu', isValidCombination: false };
  }

  const rootName = NOTE_NAMES[rootIndex];
  const plRoot = getNoteLabel(rootName, 'polish');

  const base = baseId ?? '';
  const ext = extId ?? '';

  let quality: ChordQuality | null = null;

  if (ext === '5') {
    quality = 'power5';
  } else if (ext === '9') {
    if (base === 'maj') quality = 'maj9';
    else if (base === 'm') quality = 'min9';
    else quality = 'dom9';
  } else if (ext === '6/9') {
    if (base === 'm') quality = 'minSixNine';
    else quality = 'sixNine';
  } else if (ext === '7b9') {
    quality = 'dom7b9';
  } else if (ext === '7#9') {
    quality = 'dom7sharp9';
  } else if (ext === '9sus4') {
    quality = 'nineSus4';
  } else if (base === 'maj') {
    if (ext === '7' || ext === 'brak' || ext === '') quality = 'maj7';
  } else if (base === 'dim') {
    if (ext === 'brak' || ext === '') quality = 'diminished';
    else if (ext === '7') quality = 'dim7';
    else if (ext === '7b5') quality = 'm7b5';
  } else if (base === 'aug') {
    if (ext === 'brak' || ext === '') quality = 'augmented';
  } else if (base === 'm') {
    if (ext === 'brak' || ext === '') quality = 'minor';
    else if (ext === '7') quality = 'min7';
    else if (ext === '6') quality = 'minor6';
    else if (ext === '7b5') quality = 'm7b5';
  } else if (base === '') {
    if (ext === 'brak' || ext === '') quality = 'major';
    else if (ext === '7') quality = 'dom7';
    else if (ext === '6') quality = 'major6';
    else if (ext === 'sus2') quality = 'sus2';
    else if (ext === 'sus4') quality = 'sus4';
    else if (ext === '7sus4') quality = 'dom7sus4';
    else if (ext === 'add9') quality = 'add9';
  }

  if (quality) {
    const chordDef = createChordDefinition(rootName, quality);
    return {
      fullSymbol: chordDef.symbol,
      plSymbol: chordDef.polishSymbol,
      description: CHORD_QUALITY_NAMES[quality].desc,
      isValidCombination: true,
    };
  }

  // Fallback string concatenation if rare combo
  const rawIntl = `${rootName}${base}${ext !== 'brak' ? ext : ''}`;
  const rawPl = `${plRoot}${base}${ext !== 'brak' ? ext : ''}`;
  return {
    fullSymbol: rawIntl,
    plSymbol: rawPl,
    description: 'Nietypowa kombinacja modyfikatorów',
    isValidCombination: false,
  };
}

export const ChordQuizGame: React.FC<ChordQuizGameProps> = ({ convention, isActiveTab = true }) => {
  // Settings & Filters
  const [selectedCategory, setSelectedCategory] = useState<ChordCategoryFilter>('all');
  const [allowInversions, setAllowInversions] = useState(false);
  const [showNoteNamesOnKeys, setShowNoteNamesOnKeys] = useState(false);
  const [autoPlaySound, setAutoPlaySound] = useState(true);

  // Stats
  const [stats, setStats] = useState<{ total: number; correct: number; streak: number; bestStreak: number }>(() => {
    try {
      const saved = localStorage.getItem('harmonix_chord_quiz_stats_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return { total: 0, correct: 0, streak: 0, bestStreak: 0 };
  });

  const saveStats = (newStats: { total: number; correct: number; streak: number; bestStreak: number }) => {
    setStats(newStats);
    try {
      localStorage.setItem('harmonix_chord_quiz_stats_v2', JSON.stringify(newStats));
    } catch {}
  };

  // Current Drawn Question
  const [currentMidiNotes, setCurrentMidiNotes] = useState<number[]>([]);
  const [currentInversion, setCurrentInversion] = useState<number>(0);
  const [validChords, setValidChords] = useState<ValidChordInterpretation[]>([]);

  // User Row Selections
  const [selectedRootIndex, setSelectedRootIndex] = useState<number | null>(null);
  const [selectedBaseId, setSelectedBaseId] = useState<string | null>(null);
  const [selectedExtId, setSelectedExtId] = useState<string | null>(null);

  // Status
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [matchedChord, setMatchedChord] = useState<ValidChordInterpretation | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [activeArpeggioMidi, setActiveArpeggioMidi] = useState<number | null>(null);
  const arpeggioTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

  // Refs for independently scrollable rows
  const row1Ref = useRef<HTMLDivElement>(null);
  const row2Ref = useRef<HTMLDivElement>(null);
  const row3Ref = useRef<HTMLDivElement>(null);

  const scrollRow = (ref: React.RefObject<HTMLDivElement | null>, delta: number) => {
    if (ref.current) {
      ref.current.scrollBy({ left: delta, behavior: 'smooth' });
    }
  };

  // Clear arpeggio timeouts on unmount or question change
  const clearArpeggioTimeouts = () => {
    arpeggioTimeoutsRef.current.forEach(clearTimeout);
    arpeggioTimeoutsRef.current = [];
    setActiveArpeggioMidi(null);
  };

  useEffect(() => {
    return () => clearArpeggioTimeouts();
  }, []);

  // Generate a new random chord question
  const loadNextQuestion = useCallback(() => {
    clearArpeggioTimeouts();
    const activeFilter = QUIZ_FILTER_OPTIONS.find((f) => f.id === selectedCategory) || QUIZ_FILTER_OPTIONS[0];
    const qualities = activeFilter.qualities;

    // Pick random root and random quality from pool
    const root = NOTE_NAMES[Math.floor(Math.random() * NOTE_NAMES.length)];
    const quality = qualities[Math.floor(Math.random() * qualities.length)];
    const chord = createChordDefinition(root, quality);

    let midiNotes = chord.defaultNotes.map((n) => n.midi);
    let inversion = 0;

    if (allowInversions && midiNotes.length >= 3) {
      const maxInv = midiNotes.length >= 4 ? 2 : 1;
      inversion = Math.floor(Math.random() * (maxInv + 1));

      if (inversion === 1) {
        const first = midiNotes[0];
        midiNotes = [...midiNotes.slice(1), first + 12];
      } else if (inversion === 2) {
        const first = midiNotes[0];
        const second = midiNotes[1];
        midiNotes = [...midiNotes.slice(2), first + 12, second + 12];
      }
    }

    // Keep comfortably in 37-key piano range (48 to 84)
    let minMidi = Math.min(...midiNotes);
    let maxMidi = Math.max(...midiNotes);
    while (maxMidi > 84) {
      midiNotes = midiNotes.map((m) => m - 12);
      maxMidi = Math.max(...midiNotes);
      minMidi = Math.min(...midiNotes);
    }
    while (minMidi < 48) {
      midiNotes = midiNotes.map((m) => m + 12);
      minMidi = Math.min(...midiNotes);
      maxMidi = Math.max(...midiNotes);
    }

    // Calculate ALL valid chords for this pitch class set
    const allValid = findAllValidChordsForNotes(midiNotes);

    setCurrentMidiNotes(midiNotes);
    setCurrentInversion(inversion);
    setValidChords(allValid);

    // Reset user selection
    setSelectedRootIndex(null);
    setSelectedBaseId(null);
    setSelectedExtId(null);
    setIsAnswered(false);
    setIsCorrect(false);
    setMatchedChord(null);
    setShowHint(false);

    if (autoPlaySound) {
      setTimeout(() => {
        sound.playChord(midiNotes, 2.2);
      }, 150);
    }
  }, [selectedCategory, allowInversions, autoPlaySound]);

  // Initial load
  useEffect(() => {
    loadNextQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, allowInversions]);

  // Check if current user selection in rows 1, 2, 3 matches ANY valid chord
  useEffect(() => {
    if (isAnswered) return;
    if (selectedRootIndex === null || selectedBaseId === null || selectedExtId === null) {
      return;
    }

    // Test against all valid chord interpretations
    const found = validChords.find((vc) => {
      if (vc.rootIndex !== selectedRootIndex) return false;
      return vc.matchingKeys.some((k) => k.base === selectedBaseId && k.ext === selectedExtId);
    });

    if (found) {
      // MATCH! User identified a correct chord name!
      setIsAnswered(true);
      setIsCorrect(true);
      setMatchedChord(found);

      const newStreak = stats.streak + 1;
      const newBest = Math.max(newStreak, stats.bestStreak);
      saveStats({
        total: stats.total + 1,
        correct: stats.correct + 1,
        streak: newStreak,
        bestStreak: newBest,
      });

      // Confetti celebration
      try {
        confetti({
          particleCount: 55,
          spread: 60,
          origin: { y: 0.65 },
          colors: ['#f59e0b', '#10b981', '#38bdf8', '#fbbf24'],
        });
      } catch {}

      // Audio celebration
      sound.playChord(currentMidiNotes, 2.4);
    }
  }, [selectedRootIndex, selectedBaseId, selectedExtId, validChords, isAnswered, stats, currentMidiNotes]);

  // Handler for row 2 (Base)
  const handleSelectBase = (baseId: string) => {
    if (isAnswered) return;
    setSelectedBaseId(baseId);
    // If user selects 'maj', ext defaults to '7' or 'brak'
    if (baseId === 'maj' && selectedExtId !== '7' && selectedExtId !== 'brak') {
      setSelectedExtId('7');
    }
    // If user selects 'dim' and ext was 6 or sus, adjust
    if (baseId === 'dim' && (selectedExtId === '6' || selectedExtId?.startsWith('sus'))) {
      setSelectedExtId('brak');
    }
  };

  // Handler for row 3 (Extension)
  const handleSelectExt = (extId: string) => {
    if (isAnswered) return;
    setSelectedExtId(extId);

    // Specific modifier base couplings
    if (
      extId === '5' ||
      extId === '7b9' ||
      extId === '7#9' ||
      extId === '9sus4' ||
      extId === 'sus2' ||
      extId === 'sus4' ||
      extId === '7sus4' ||
      extId === 'add9'
    ) {
      if (selectedBaseId !== '') {
        setSelectedBaseId('');
      }
    } else if (extId === '6/9') {
      if (selectedBaseId !== '' && selectedBaseId !== 'm') {
        setSelectedBaseId('');
      }
    } else if (extId === '9') {
      if (selectedBaseId === 'dim' || selectedBaseId === 'aug') {
        setSelectedBaseId('');
      }
    } else if (extId === '7b5' && selectedBaseId !== 'm' && selectedBaseId !== 'dim') {
      setSelectedBaseId('m');
    }
  };

  // Give up / Reveal solution
  const handleRevealSolution = () => {
    if (isAnswered || validChords.length === 0) return;
    setIsAnswered(true);
    setIsCorrect(false);
    setMatchedChord(validChords[0]);

    // Select the first valid chord in the rows
    const first = validChords[0];
    setSelectedRootIndex(first.rootIndex);
    if (first.matchingKeys.length > 0) {
      setSelectedBaseId(first.matchingKeys[0].base);
      setSelectedExtId(first.matchingKeys[0].ext);
    }

    saveStats({
      total: stats.total + 1,
      correct: stats.correct,
      streak: 0,
      bestStreak: stats.bestStreak,
    });
  };

  // Reset score
  const handleResetStats = () => {
    saveStats({ total: 0, correct: 0, streak: 0, bestStreak: 0 });
  };

  // Audio Playback
  const handlePlayChord = () => {
    if (currentMidiNotes.length === 0) return;
    clearArpeggioTimeouts();
    sound.playChord(currentMidiNotes, 2.5);
  };

  const handlePlayArpeggio = () => {
    if (currentMidiNotes.length === 0) return;
    clearArpeggioTimeouts();

    const sortedMidis = [...currentMidiNotes].sort((a, b) => a - b);
    sortedMidis.forEach((midi, index) => {
      const timeout = setTimeout(() => {
        setActiveArpeggioMidi(midi);
        sound.playNote(midi, 1.4);
        if (index === sortedMidis.length - 1) {
          const finalTimeout = setTimeout(() => setActiveArpeggioMidi(null), 1200);
          arpeggioTimeoutsRef.current.push(finalTimeout);
        }
      }, index * 260);
      arpeggioTimeoutsRef.current.push(timeout);
    });
  };

  // Keyboard shortcut Space / Enter for next question
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (isAnswered && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault();
        loadNextQuestion();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswered, loadNextQuestion]);

  // Highlight map for keyboard
  const highlightMap = useMemo(() => {
    const map: Record<number, 'correct' | 'incorrect' | 'hint' | 'active'> = {};
    currentMidiNotes.forEach((midi) => {
      if (activeArpeggioMidi === midi) {
        map[midi] = 'active';
      } else if (isAnswered) {
        map[midi] = isCorrect ? 'correct' : 'hint';
      } else {
        map[midi] = 'active';
      }
    });
    return map;
  }, [currentMidiNotes, activeArpeggioMidi, isAnswered, isCorrect]);

  // Current composed preview
  const composedPreview = useMemo(() => {
    return formatComposedChord(selectedRootIndex, selectedBaseId, selectedExtId, convention);
  }, [selectedRootIndex, selectedBaseId, selectedExtId, convention]);

  // Other valid interpretations if multiple exist (e.g. C6 & Am7)
  const otherValidChords = useMemo(() => {
    if (!matchedChord) return [];
    return validChords.filter(
      (c) => !(c.rootIndex === matchedChord.rootIndex && c.quality === matchedChord.quality)
    );
  }, [validChords, matchedChord]);

  // Actual pitch class note names
  const actualNoteNames = useMemo(() => {
    const pitchClasses = Array.from(new Set(currentMidiNotes.map((m) => ((m % 12) + 12) % 12))).sort((a, b) => a - b);
    return pitchClasses.map((p) => {
      const note = NOTE_NAMES[p];
      return convention === 'polish' ? getFullNoteLabel(note, 'polish') : note;
    });
  }, [currentMidiNotes, convention]);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-6 backdrop-blur-md shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1.5 rounded-lg bg-amber-400/20 text-amber-400">
                <Music2 className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Odgadnij Akord na Klawiaturze
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Sprawdź swój słuch i znajomość układu klawiszy! Zobacz podświetlone nuty, wybierz w poniższych
              wierszach prymę, rdzeń i rozszerzenie. System zaliczy akord, jeśli złoży się na{' '}
              <strong className="text-amber-300">dowolną poprawną nazwę</strong> tego zestawu klawiszy
              (np. zarówno <em>C6</em> jak i <em>Am7</em>, <em>D#dim7</em> jak i <em>Adim7</em>)!
            </p>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center gap-3 sm:gap-4 bg-slate-950/80 border border-slate-800/90 px-4 py-2.5 rounded-xl self-start lg:self-auto">
            <div className="text-center pr-3 border-r border-slate-800">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Wynik</div>
              <div className="text-sm sm:text-base font-black text-white">
                {stats.correct} <span className="text-xs text-slate-400">/ {stats.total}</span>
              </div>
              <div className="text-[10px] text-amber-400 font-medium">
                {stats.total > 0 ? `${Math.round((stats.correct / stats.total) * 100)}%` : '0%'}
              </div>
            </div>

            <div className="text-center pr-3 border-r border-slate-800">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-center gap-1">
                <Flame className="w-3 h-3 text-orange-400" />
                <span>Seria</span>
              </div>
              <div className="text-sm sm:text-base font-black text-orange-400">{stats.streak}</div>
              <div className="text-[10px] text-slate-400">bez błędu</div>
            </div>

            <div className="text-center">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center justify-center gap-1">
                <Trophy className="w-3 h-3 text-amber-300" />
                <span>Rekord</span>
              </div>
              <div className="text-sm sm:text-base font-black text-amber-300">{stats.bestStreak}</div>
              <button
                type="button"
                onClick={handleResetStats}
                title="Zresetuj statystyki"
                className="text-[10px] text-slate-400 hover:text-slate-200 transition-colors underline cursor-pointer"
              >
                zeruj
              </button>
            </div>
          </div>
        </div>

        {/* Filter & Preferences Row */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Category Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-400 font-semibold flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5 text-amber-400" />
              Zakres akordów:
            </span>
            {QUIZ_FILTER_OPTIONS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedCategory(f.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === f.id
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-400/20'
                    : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
                }`}
              >
                <span>{f.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    selectedCategory === f.id ? 'bg-slate-950 text-amber-400' : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  {f.badge}
                </span>
              </button>
            ))}
          </div>

          {/* Controls: Inversions & Note labels on keys */}
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white select-none">
              <input
                type="checkbox"
                checked={allowInversions}
                onChange={(e) => setAllowInversions(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-amber-400 focus:ring-amber-400/30 cursor-pointer"
              />
              <span>Losowe przewroty</span>
            </label>

            <button
              type="button"
              onClick={() => setShowNoteNamesOnKeys(!showNoteNamesOnKeys)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 border border-slate-700/60 transition-colors cursor-pointer"
            >
              {showNoteNamesOnKeys ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ukryj nazwy dźwięków</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  <span>Pokaż nazwy na klawiszach</span>
                </>
              )}
            </button>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white select-none">
              <input
                type="checkbox"
                checked={autoPlaySound}
                onChange={(e) => setAutoPlaySound(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-amber-400 focus:ring-amber-400/30 cursor-pointer"
              />
              <span>Auto-odtwarzanie</span>
            </label>
          </div>
        </div>
      </div>

      {/* Main Piano Keyboard Area */}
      <div className="rounded-2xl border border-slate-800 bg-[#080d1a] p-4 sm:p-6 shadow-xl relative overflow-hidden">
        {/* Sub-bar above keyboard: Audio playback controls & hint */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePlayChord}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-md shadow-amber-400/20 active:scale-95 cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
              <span>Odsłuchaj akord</span>
            </button>

            <button
              type="button"
              onClick={handlePlayArpeggio}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-semibold text-xs sm:text-sm transition-all hover:text-white active:scale-95 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 text-amber-400" />
              <span>Zagraj arpeggio</span>
            </button>

            <button
              type="button"
              onClick={() => setShowHint(!showHint)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-amber-300 border border-amber-400/30 text-xs font-semibold transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{showHint ? 'Ukryj podpowiedź' : 'Podpowiedź'}</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span>Klawisze są interaktywne – kliknij, aby odsłuchać pojedyncze nuty</span>
          </div>
        </div>

        {/* Hint Box (if enabled) */}
        {showHint && (
          <div className="mb-4 p-3 rounded-xl bg-amber-400/10 border border-amber-400/30 text-xs text-amber-200 flex items-start gap-2 animate-fadeIn">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div>
                <span className="font-bold text-amber-300">Podświetlone dźwięki ({actualNoteNames.length}):</span>{' '}
                <span className="font-mono font-bold text-white">
                  {actualNoteNames.join(' — ')}
                </span>
              </div>
              <div className="text-slate-300">
                Liczba możliwych interpretacji akordowych dla tego zestawu nut:{' '}
                <strong className="text-amber-300">{validChords.length}</strong>.
                {currentInversion > 0 && (
                  <span className="text-amber-300 ml-1.5">(Uwaga: akord ułożony w przewrocie!)</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Piano Keyboard Component */}
        <div className="w-full flex justify-center py-2">
          <PianoKeyboard
            startMidi={48}
            keyCount={37} // C3 to C6
            selectedMidiNotes={currentMidiNotes}
            activeMidiNotes={activeArpeggioMidi ? [activeArpeggioMidi] : []}
            highlightMap={highlightMap}
            selectionMode="playOnly"
            showLabels={showNoteNamesOnKeys}
            convention={convention}
            idPrefix="quiz-keyboard"
            autoCenterOnNotes={true}
            activeTabVisible={isActiveTab}
          />
        </div>
      </div>

      {/* Interactive 3-Row Chord Constructor Panel */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 sm:p-6 shadow-xl space-y-5">
        {/* Live Assembled Preview Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#090e1c] border border-slate-800/90">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Twój wybór:
            </span>

            {/* Assembled symbol badge */}
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1 rounded-xl bg-amber-400 text-slate-950 font-black text-lg sm:text-xl shadow-md shadow-amber-400/20">
                {convention === 'polish' ? composedPreview.plSymbol : composedPreview.fullSymbol}
              </span>

              {composedPreview.isValidCombination && (
                <span className="text-xs text-slate-400 font-medium hidden md:inline">
                  ({composedPreview.description})
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isAnswered && (
              <button
                type="button"
                onClick={handleRevealSolution}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-amber-300 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
              >
                Pokaż rozwiązanie
              </button>
            )}

            {isAnswered && (
              <button
                type="button"
                onClick={loadNextQuestion}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-md shadow-amber-400/20 active:scale-95 cursor-pointer"
              >
                <span>Następny akord ➔</span>
              </button>
            )}
          </div>
        </div>

        {/* =========================================================================
            ROW 1: Pryma / Root Note (12 chromatic keys) with independent horizontal scroll
            ========================================================================= */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-[10px]">
                1
              </span>
              <span>Wiersz 1: Dźwięk podstawowy (Pryma akordu)</span>
            </div>
            <div className="flex items-center gap-1 sm:hidden">
              <button
                type="button"
                onClick={() => scrollRow(row1Ref, -120)}
                className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                title="Przewiń w lewo"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => scrollRow(row1Ref, 120)}
                className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                title="Przewiń w prawo"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div
            ref={row1Ref}
            className="overflow-x-auto no-scrollbar scroll-smooth flex items-center gap-1.5 py-1.5 px-0.5"
          >
            {ROOT_OPTIONS.map((opt) => {
              const isSelected = selectedRootIndex === opt.index;
              const displayLabel = convention === 'polish' ? opt.polishLabel : opt.intlLabel;

              return (
                <button
                  key={opt.index}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => setSelectedRootIndex(opt.index)}
                  className={`px-3 sm:px-4 py-2.5 rounded-xl border text-center transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 font-black border-amber-300 shadow-md shadow-amber-400/25 scale-[1.02]'
                      : 'bg-slate-950/80 hover:bg-slate-800/90 text-slate-200 border-slate-800 hover:border-slate-700'
                  } ${isAnswered ? 'opacity-80 cursor-default' : 'active:scale-95'}`}
                >
                  <div className="text-sm sm:text-base font-extrabold leading-tight">{displayLabel}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            ROW 2: Typ podstawowy / Rdzeń akordu ("", "m", "maj", "dim", "aug")
            ========================================================================= */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-[10px]">
                2
              </span>
              <span>Wiersz 2: Typ podstawowy / Rdzeń akordu</span>
            </div>
            <div className="flex items-center gap-1 sm:hidden">
              <button
                type="button"
                onClick={() => scrollRow(row2Ref, -120)}
                className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                title="Przewiń w lewo"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => scrollRow(row2Ref, 120)}
                className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                title="Przewiń w prawo"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div
            ref={row2Ref}
            className="overflow-x-auto no-scrollbar scroll-smooth flex items-center gap-2 py-1.5 px-0.5"
          >
            {BASE_QUALITY_OPTIONS.map((opt) => {
              const isSelected = selectedBaseId === opt.id;

              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleSelectBase(opt.id)}
                  className={`px-4 sm:px-5 py-2.5 rounded-xl border text-left transition-all shrink-0 cursor-pointer min-w-[100px] ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 font-black border-amber-300 shadow-md shadow-amber-400/25 scale-[1.02]'
                      : 'bg-slate-950/80 hover:bg-slate-800/90 text-slate-200 border-slate-800 hover:border-slate-700'
                  } ${isAnswered ? 'opacity-80 cursor-default' : 'active:scale-95'}`}
                >
                  <div className="text-sm sm:text-base font-extrabold">{opt.label}</div>
                  <div
                    className={`text-[10px] ${
                      isSelected ? 'text-slate-900 font-semibold' : 'text-slate-400'
                    }`}
                  >
                    {opt.sub}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            ROW 3: Rozszerzenie / Modyfikator (—, 6, 7, 7b5, sus2, sus4, 7sus4, add9)
            ========================================================================= */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-[10px]">
                3
              </span>
              <span>Wiersz 3: Rozszerzenie / Modyfikator (6, 7, sus, add9...)</span>
            </div>
            <div className="flex items-center gap-1 sm:hidden">
              <button
                type="button"
                onClick={() => scrollRow(row3Ref, -120)}
                className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                title="Przewiń w lewo"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => scrollRow(row3Ref, 120)}
                className="p-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                title="Przewiń w prawo"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div
            ref={row3Ref}
            className="overflow-x-auto no-scrollbar scroll-smooth flex items-center gap-2 py-1.5 px-0.5"
          >
            {EXTENSION_OPTIONS.map((opt) => {
              const isSelected = selectedExtId === opt.id;

              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleSelectExt(opt.id)}
                  className={`px-3.5 sm:px-4 py-2.5 rounded-xl border text-center transition-all shrink-0 cursor-pointer min-w-[85px] ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 font-black border-amber-300 shadow-md shadow-amber-400/25 scale-[1.02]'
                      : 'bg-slate-950/80 hover:bg-slate-800/90 text-slate-200 border-slate-800 hover:border-slate-700'
                  } ${isAnswered ? 'opacity-80 cursor-default' : 'active:scale-95'}`}
                >
                  <div className="text-sm sm:text-base font-extrabold">{opt.label}</div>
                  <div
                    className={`text-[10px] ${
                      isSelected ? 'text-slate-900 font-semibold' : 'text-slate-400'
                    }`}
                  >
                    {opt.sub}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Real-time status / Educational Result Card */}
        {selectedRootIndex !== null && selectedBaseId !== null && selectedExtId !== null && (
          <div
            className={`p-4 sm:p-5 rounded-xl border transition-all ${
              isCorrect
                ? 'bg-emerald-950/35 border-emerald-500/40 text-emerald-200 shadow-lg shadow-emerald-950/30'
                : isAnswered
                ? 'bg-slate-900/90 border-slate-800 text-slate-300'
                : 'bg-amber-950/20 border-amber-500/30 text-amber-200'
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                {isCorrect ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                ) : isAnswered ? (
                  <Info className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <Sparkles className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                )}

                <div>
                  <h4 className="text-base sm:text-lg font-bold text-white">
                    {isCorrect ? (
                      <>
                        🎉 Znakomicie! Rozpoznano poprawny akord:
                        <span className="ml-2 font-black text-amber-300">
                          {convention === 'polish' ? matchedChord?.polishSymbol : matchedChord?.symbol}
                        </span>
                      </>
                    ) : isAnswered ? (
                      <>
                        Prawidłowe nazwy tego zestawu klawiszy:
                        <span className="ml-2 font-black text-amber-300">
                          {validChords
                            .map((c) => (convention === 'polish' ? c.polishSymbol : c.symbol))
                            .join(' / ')}
                        </span>
                      </>
                    ) : (
                      <>
                        Złożony akord:{' '}
                        <span className="font-black text-white">
                          {convention === 'polish' ? composedPreview.plSymbol : composedPreview.fullSymbol}
                        </span>
                        . Jeszcze nie pasuje do zaznaczonych klawiszy — zmień prymę lub rozszerzenie!
                      </>
                    )}
                  </h4>

                  {/* Multivalence / Inversion explanation note */}
                  {isCorrect && otherValidChords.length > 0 && (
                    <div className="mt-2 text-xs text-emerald-200/90 bg-emerald-950/50 p-2.5 rounded-lg border border-emerald-500/30">
                      <strong className="text-emerald-300">💡 Ciekawostka harmoniczna:</strong> Ten sam
                      zestaw klawiszy tworzy również akord{' '}
                      <span className="font-bold text-white">
                        {otherValidChords
                          .map((c) => (convention === 'polish' ? c.polishSymbol : c.symbol))
                          .join(', ')}
                      </span>{' '}
                      w zależności od tego, który dźwięk potraktujemy jako prymę (lub jaki jest bas w zespole)!
                    </div>
                  )}

                  {matchedChord && (
                    <p className="text-xs text-slate-300 mt-1.5">{matchedChord.description}</p>
                  )}
                </div>
              </div>

              {isAnswered && (
                <button
                  type="button"
                  onClick={loadNextQuestion}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm transition-all shadow-md shadow-amber-400/20 active:scale-95 cursor-pointer self-start md:self-auto shrink-0"
                >
                  <span>Kolejny akord ➔</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
