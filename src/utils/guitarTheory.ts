import { NoteName, NamingConvention } from '../types/music';
import { NOTE_NAMES, getNoteLabel } from './musicTheory';

export interface GuitarStringInfo {
  index: number; // 0 to 5 (0 = low E, 5 = high e)
  name: NoteName;
  midi: number;
  label: string;
  gaugeWidth: number; // in pixels
  color: string;
}

// Standard Guitar Tuning (E2, A2, D3, G3, B3, E4)
export const GUITAR_STRINGS: GuitarStringInfo[] = [
  { index: 0, name: 'E', midi: 40, label: '6 - E (Gruba basowa)', gaugeWidth: 4.0, color: '#ca8a04' },
  { index: 1, name: 'A', midi: 45, label: '5 - A', gaugeWidth: 3.4, color: '#eab308' },
  { index: 2, name: 'D', midi: 50, label: '4 - D', gaugeWidth: 2.8, color: '#facc15' },
  { index: 3, name: 'G', midi: 55, label: '3 - G', gaugeWidth: 2.2, color: '#e2e8f0' },
  { index: 4, name: 'B', midi: 59, label: '2 - B / H', gaugeWidth: 1.6, color: '#f8fafc' },
  { index: 5, name: 'E', midi: 64, label: '1 - e (Cienka wiolinowa)', gaugeWidth: 1.1, color: '#ffffff' },
];

export type GuitarFretPosition = number | 'x'; // 0 = open string, 'x' = muted, 1..12 = fret number

export interface GuitarChordDefinition {
  id: string;
  name: string; // e.g. "C"
  polishName: string; // e.g. "C-dur"
  root: NoteName;
  quality: string; // e.g. "major", "minor", "7", "maj7", "m7", "sus2", "sus4", "add9"
  frets: GuitarFretPosition[]; // length 6: string 6 down to string 1
  fingers: (number | null)[]; // 1 = index (wskazujący), 2 = middle (środkowy), 3 = ring (serdeczny), 4 = pinky (mały), null = open/muted
  barreFret?: number; // if barre chord (np. 1 dla F-dur)
  barreStartString?: number; // 0 (struna 6) to 5
  formula: string; // e.g. "C - E - G"
  leftHandTips: string; // Left-hand fretting ergonomics advice
  category: 'podstawowe' | 'molowe' | 'septymowe' | 'barrowe' | 'otwarte';
}

/**
 * Rich Guitar Chord Database for chord guessing and fretboard practice.
 * Covers standard open chords, essential barres, 7ths, and extended grips.
 */
export const GUITAR_CHORD_DATABASE: GuitarChordDefinition[] = [
  // C major
  {
    id: 'c_major',
    name: 'C',
    polishName: 'C-dur',
    root: 'C',
    quality: 'major',
    frets: ['x', 3, 2, 0, 1, 0],
    fingers: [null, 3, 2, null, 1, null],
    formula: 'C – E – G',
    leftHandTips: 'Palec 1 (wskazujący) na 1. progu struny B, palec 2 na 2. progu D, palec 3 na 3. progu A. Kciuk oparty z tyłu gryfu.',
    category: 'podstawowe',
  },
  // G major
  {
    id: 'g_major',
    name: 'G',
    polishName: 'G-dur',
    root: 'G',
    quality: 'major',
    frets: [3, 2, 0, 0, 0, 3],
    fingers: [2, 1, null, null, null, 3],
    formula: 'G – B(H) – D',
    leftHandTips: 'Palec 2 na basie 6. struny, palec 1 na 5. strunie, mały lub serdeczny palec 3 na wiolinowej e. Stawiaj palce pod kątem prostym.',
    category: 'podstawowe',
  },
  // D major
  {
    id: 'd_major',
    name: 'D',
    polishName: 'D-dur',
    root: 'D',
    quality: 'major',
    frets: ['x', 'x', 0, 2, 3, 2],
    fingers: [null, null, null, 1, 3, 2],
    formula: 'D – F# – A',
    leftHandTips: 'Trójkąt na pierwszych 3 strunach: palce 1 i 2 na 2. progu, palec 3 wysunięty na 3. próg struny B. Nie uderzaj basowych strun 6 i 5.',
    category: 'podstawowe',
  },
  // E minor
  {
    id: 'e_minor',
    name: 'Em',
    polishName: 'E-moll',
    root: 'E',
    quality: 'minor',
    frets: [0, 2, 2, 0, 0, 0],
    fingers: [null, 2, 3, null, null, null],
    formula: 'E – G – B(H)',
    leftHandTips: 'Jeden z najprostszych chwytów: tylko 2 palce (2 i 3) na 2. progu strun A i D. Wszystkie pozostałe struny wybrzmiewają puste.',
    category: 'molowe',
  },
  // A minor
  {
    id: 'a_minor',
    name: 'Am',
    polishName: 'A-moll',
    root: 'A',
    quality: 'minor',
    frets: ['x', 0, 2, 2, 1, 0],
    fingers: [null, null, 2, 3, 1, null],
    formula: 'A – C – E',
    leftHandTips: 'Układ identyczny jak E-dur, przesunięty o jedną strunę w dół. Palec 1 na 1. progu struny B, palce 2 i 3 na 2. progu strun D i G.',
    category: 'molowe',
  },
  // E major
  {
    id: 'e_major',
    name: 'E',
    polishName: 'E-dur',
    root: 'E',
    quality: 'major',
    frets: [0, 2, 2, 1, 0, 0],
    fingers: [null, 2, 3, 1, null, null],
    formula: 'E – G# – B(H)',
    leftHandTips: 'Mocny, pełny akord. Palec 1 na 1. progu struny G (tercja dur), palce 2 i 3 na 2. progu strun A i D.',
    category: 'podstawowe',
  },
  // A major
  {
    id: 'a_major',
    name: 'A',
    polishName: 'A-dur',
    root: 'A',
    quality: 'major',
    frets: ['x', 0, 2, 2, 2, 0],
    fingers: [null, null, 1, 2, 3, null],
    formula: 'A – C# – E',
    leftHandTips: 'Wszystkie 3 palce (1, 2, 3) stłoczone na 2. progu strun D, G, B. Uważaj, by palec 3 nie tłumił cienkiej struny wiolinowej e.',
    category: 'podstawowe',
  },
  // D minor
  {
    id: 'd_minor',
    name: 'Dm',
    polishName: 'D-moll',
    root: 'D',
    quality: 'minor',
    frets: ['x', 'x', 0, 2, 3, 1],
    fingers: [null, null, null, 2, 3, 1],
    formula: 'D – F – A',
    leftHandTips: 'Palec 1 na 1. progu struny wiolinowej e, palec 2 na 2. progu G, palec 3 na 3. progu B. Melancholijne, głębokie brzmienie.',
    category: 'molowe',
  },
  // F major (Easy open variant)
  {
    id: 'f_major',
    name: 'F',
    polishName: 'F-dur',
    root: 'F',
    quality: 'major',
    frets: ['x', 'x', 3, 2, 1, 1],
    fingers: [null, null, 3, 2, 1, 1],
    barreFret: 1,
    barreStartString: 4,
    formula: 'F – A – C',
    leftHandTips: 'Małe barre palcem 1 na 1. progu dwóch cienkich strun (B i e). Palec 2 na 2. progu G, palec 3 na 3. progu D.',
    category: 'barrowe',
  },
  // F major (Full Barre)
  {
    id: 'f_barre',
    name: 'F (Barre)',
    polishName: 'F-dur (Pełne Barre)',
    root: 'F',
    quality: 'major',
    frets: [1, 3, 3, 2, 1, 1],
    fingers: [1, 3, 4, 2, 1, 1],
    barreFret: 1,
    barreStartString: 0,
    formula: 'F – A – C',
    leftHandTips: 'Klasyczny chwyt poprzeczkowy: palec 1 kładzie się wzdłuż całego 1. progu. Palec 2 na 2. progu G, palce 3 i 4 na 3. progu A i D.',
    category: 'barrowe',
  },
  // B minor (Barre)
  {
    id: 'b_minor',
    name: 'Bm',
    polishName: 'H-moll (Bm)',
    root: 'B',
    quality: 'minor',
    frets: ['x', 2, 4, 4, 3, 2],
    fingers: [null, 1, 3, 4, 2, 1],
    barreFret: 2,
    barreStartString: 1,
    formula: 'B(H) – D – F#',
    leftHandTips: 'Barre na 2. progu od struny A. Palec 2 na 3. progu struny B, palce 3 i 4 na 4. progu strun D i G.',
    category: 'barrowe',
  },
  // C7
  {
    id: 'c7',
    name: 'C7',
    polishName: 'C7 (dominantowy)',
    root: 'C',
    quality: '7',
    frets: ['x', 3, 2, 3, 1, 0],
    fingers: [null, 3, 2, 4, 1, null],
    formula: 'C – E – G – Bb',
    leftHandTips: 'Klasyczny C-dur z dodatkowym małym palcem 4 na 3. progu struny G. Bluesowy, dążący akord.',
    category: 'septymowe',
  },
  // G7
  {
    id: 'g7',
    name: 'G7',
    polishName: 'G7 (dominantowy)',
    root: 'G',
    quality: '7',
    frets: [3, 2, 0, 0, 0, 1],
    fingers: [3, 2, null, null, null, 1],
    formula: 'G – B(H) – D – F',
    leftHandTips: 'Palec 1 na 1. progu struny wiolinowej e, palec 2 na 2. progu A, palec 3 na 3. progu basowego E. Napięty akord dominantowy.',
    category: 'septymowe',
  },
  // D7
  {
    id: 'd7',
    name: 'D7',
    polishName: 'D7',
    root: 'D',
    quality: '7',
    frets: ['x', 'x', 0, 2, 1, 2],
    fingers: [null, null, null, 2, 1, 3],
    formula: 'D – F# – A – C',
    leftHandTips: 'Odwrócony trójkąt chwytu D: palec 1 na 1. progu B, palec 2 na 2. progu G, palec 3 na 2. progu e.',
    category: 'septymowe',
  },
  // E7
  {
    id: 'e7',
    name: 'E7',
    polishName: 'E7',
    root: 'E',
    quality: '7',
    frets: [0, 2, 0, 1, 0, 0],
    fingers: [null, 2, null, 1, null, null],
    formula: 'E – G# – B(H) – D',
    leftHandTips: 'Bardzo prosty chwyt: tylko 2 palce. Palec 1 na 1. progu G, palec 2 na 2. progu A. Pusta struna D daje dźwięk septymy.',
    category: 'septymowe',
  },
  // A7
  {
    id: 'a7',
    name: 'A7',
    polishName: 'A7',
    root: 'A',
    quality: '7',
    frets: ['x', 0, 2, 0, 2, 0],
    fingers: [null, null, 2, null, 3, null],
    formula: 'A – C# – E – G',
    leftHandTips: 'Dwa palce na 2. progu: palec 2 na strunie D i palec 3 na strunie B. Pusta struna G w środku.',
    category: 'septymowe',
  },
  // Cadd9
  {
    id: 'cadd9',
    name: 'Cadd9',
    polishName: 'Cadd9',
    root: 'C',
    quality: 'add9',
    frets: ['x', 3, 2, 0, 3, 3],
    fingers: [null, 2, 1, null, 3, 4],
    formula: 'C – E – G – D',
    leftHandTips: 'Kultowy akustyczny akord balladowy (Coldplay, Wonderwall). Palce 3 i 4 trzymają 3. próg na strunach B i e.',
    category: 'otwarte',
  },
  // Dsus4
  {
    id: 'dsus4',
    name: 'Dsus4',
    polishName: 'Dsus4',
    root: 'D',
    quality: 'sus4',
    frets: ['x', 'x', 0, 2, 3, 3],
    fingers: [null, null, null, 1, 2, 4],
    formula: 'D – G – A',
    leftHandTips: 'Zwykły akord D z małym palcem 4 na 3. progu wiolinowej struny e.',
    category: 'otwarte',
  },
  // Asus4
  {
    id: 'asus4',
    name: 'Asus4',
    polishName: 'Asus4',
    root: 'A',
    quality: 'sus4',
    frets: ['x', 0, 2, 2, 3, 0],
    fingers: [null, null, 1, 2, 3, null],
    formula: 'A – D – E',
    leftHandTips: 'Chwyt A z palcem 3 przesuniętym na 3. próg struny B.',
    category: 'otwarte',
  },
  // Cmaj7
  {
    id: 'cmaj7',
    name: 'Cmaj7',
    polishName: 'Cmaj7',
    root: 'C',
    quality: 'maj7',
    frets: ['x', 3, 2, 0, 0, 0],
    fingers: [null, 3, 2, null, null, null],
    formula: 'C – E – G – B(H)',
    leftHandTips: 'C-dur z puszczonym palcem wskazującym na strunie B. Aksamitne, chilloutowe brzmienie.',
    category: 'septymowe',
  },
  // Am7
  {
    id: 'am7',
    name: 'Am7',
    polishName: 'A-moll 7',
    root: 'A',
    quality: 'min7',
    frets: ['x', 0, 2, 0, 1, 0],
    fingers: [null, null, 2, null, 1, null],
    formula: 'A – C – E – G',
    leftHandTips: 'A-moll z puszczonym palcem 3 ze struny G. Pusta struna G nadaje ciepłą soulową barwę.',
    category: 'septymowe',
  },
  // Em7
  {
    id: 'em7',
    name: 'Em7',
    polishName: 'E-moll 7',
    root: 'E',
    quality: 'min7',
    frets: [0, 2, 2, 0, 3, 0],
    fingers: [null, 1, 2, null, 3, null],
    formula: 'E – G – B(H) – D',
    leftHandTips: 'E-moll z dodanym palcem 3 na 3. progu struny B. Głębokie, akustyczne brzmienie.',
    category: 'septymowe',
  },
];

export interface GuitarProgressionQuest {
  id: string;
  name: string;
  description: string;
  chords: string[]; // Chord IDs in database
}

export const GUITAR_PROGRESSIONS_QUESTS: GuitarProgressionQuest[] = [
  {
    id: 'pop_axis',
    name: 'Popowy Hit wszech czasów (C - G - Am - F)',
    description: 'Najsłynniejsza progresja popowa 4 akordów (I – V – vi – IV).',
    chords: ['c_major', 'g_major', 'a_minor', 'f_major'],
  },
  {
    id: 'acoustic_campfire',
    name: 'Ogniskowy klasyk akustyczny (G - D - Em - C)',
    description: 'Ciepła balladowa progresja na gitarę akustyczną.',
    chords: ['g_major', 'd_major', 'e_minor', 'c_major'],
  },
  {
    id: 'doowop_ballad',
    name: 'Romantyczna ballada lat 60. (C - Am - F - G)',
    description: 'Klasyczna kadencja Stand By Me / Doo-Wop.',
    chords: ['c_major', 'a_minor', 'f_major', 'g_major'],
  },
  {
    id: 'minor_mood',
    name: 'Melancholijny klimat molowy (Am - F - C - G)',
    description: 'Emocjonalna progresja filmowa i rockowa.',
    chords: ['a_minor', 'f_major', 'c_major', 'g_major'],
  },
  {
    id: 'folk_renaissance',
    name: 'Folk & Country (Em - D - C - G)',
    description: 'Opada melancholijnie w dół do jasnego G-dur.',
    chords: ['e_minor', 'd_major', 'c_major', 'g_major'],
  },
  {
    id: 'blues_dominant',
    name: 'Bluesowe 12 taktów (E7 - A7 - B7)',
    description: 'Surowy, porywający blues z septymami.',
    chords: ['e7', 'a7', 'e7', 'b7'],
  },
];

/**
 * Calculate MIDI pitch for a given string index (0..5) and fret (0..12)
 */
export function getFretMidi(stringIndex: number, fret: number): number {
  if (stringIndex < 0 || stringIndex >= GUITAR_STRINGS.length) return 60;
  return GUITAR_STRINGS[stringIndex].midi + fret;
}

/**
 * Get note name for a string and fret
 */
export function getFretNote(stringIndex: number, fret: number): NoteName {
  const midi = getFretMidi(stringIndex, fret);
  return NOTE_NAMES[midi % 12];
}

/**
 * Extract MIDI notes played in an active grip
 */
export function getActiveGripMidis(grip: GuitarFretPosition[]): number[] {
  const midis: number[] = [];
  grip.forEach((fret, stringIdx) => {
    if (fret !== 'x') {
      midis.push(getFretMidi(stringIdx, fret));
    }
  });
  return midis;
}

/**
 * Validate user's placed grip against target chord definition
 */
export function validateGuitarGrip(
  activeGrip: GuitarFretPosition[],
  targetChord: GuitarChordDefinition
): {
  isCorrect: boolean;
  isExactGrip: boolean;
  playedPitchClasses: string[];
  expectedPitchClasses: string[];
  missingPitchClasses: string[];
  extraPitchClasses: string[];
  feedback: string;
} {
  // Check exact fretboard grip
  const isExactGrip = activeGrip.every((fret, idx) => {
    return fret === targetChord.frets[idx];
  });

  // Check pitch classes played
  const playedMidis = getActiveGripMidis(activeGrip);
  const playedPitchClasses = Array.from(
    new Set(playedMidis.map((m) => NOTE_NAMES[m % 12]))
  );

  const targetMidis = getActiveGripMidis(targetChord.frets);
  const expectedPitchClasses = Array.from(
    new Set(targetMidis.map((m) => NOTE_NAMES[m % 12]))
  );

  const missingPitchClasses = expectedPitchClasses.filter(
    (pc) => !playedPitchClasses.includes(pc)
  );
  const extraPitchClasses = playedPitchClasses.filter(
    (pc) => !expectedPitchClasses.includes(pc)
  );

  const isNotesMatch =
    playedPitchClasses.length >= 2 &&
    missingPitchClasses.length === 0 &&
    extraPitchClasses.length === 0;

  const isCorrect = isExactGrip || isNotesMatch;

  let feedback = '';
  if (isExactGrip) {
    feedback = `Brawo! Idealny, czysty chwyt ${targetChord.polishName}!`;
  } else if (isNotesMatch) {
    feedback = `Świetnie! Prawidłowe składowe akordu ${targetChord.polishName} (alternatywny układ chwytu)!`;
  } else if (missingPitchClasses.length > 0) {
    feedback = `Brakuje dźwięków: ${missingPitchClasses.join(', ')}`;
  } else if (extraPitchClasses.length > 0) {
    feedback = `Niepotrzebny dźwięk na strunie: ${extraPitchClasses.join(', ')}`;
  } else {
    feedback = 'Złap struny na odpowiednich progach i uderz w struny';
  }

  return {
    isCorrect,
    isExactGrip,
    playedPitchClasses,
    expectedPitchClasses,
    missingPitchClasses,
    extraPitchClasses,
    feedback,
  };
}
