export type NoteName =
  | 'C'
  | 'C#'
  | 'D'
  | 'D#'
  | 'E'
  | 'F'
  | 'F#'
  | 'G'
  | 'G#'
  | 'A'
  | 'A#'
  | 'B';

export type PolishNoteName =
  | 'C'
  | 'Cis'
  | 'D'
  | 'Dis'
  | 'E'
  | 'F'
  | 'Fis'
  | 'G'
  | 'Gis'
  | 'A'
  | 'B'
  | 'H';

export type ChordQuality =
  | 'major'
  | 'minor'
  | 'dom7'
  | 'maj7'
  | 'min7'
  | 'major6'
  | 'minor6'
  | 'diminished'
  | 'dim7'
  | 'm7b5'
  | 'augmented'
  | 'sus2'
  | 'sus4'
  | 'dom7sus4'
  | 'add9';

export interface ChordDefinition {
  root: NoteName;
  quality: ChordQuality;
  displayQuality: string; // e.g. "dur", "moll", "7", "maj7", "m7", "sus2", "sus4", "6", "dim", "aug"
  symbol: string; // e.g. "C", "Am", "G7", "Fmaj7", "Csus4"
  polishSymbol: string; // e.g. "C-dur", "A-moll", "G7", "Fmaj7"
  semitones: number[]; // relative to root: e.g. [0, 4, 7] for major
  defaultNotes: { note: NoteName; octave: number; midi: number }[];
  functionDegree?: string; // e.g. "I", "IV", "V", "vi", "V7", "IVmaj7"
  description?: string;
  emotionalRole?: string;
}

export interface ProgressionStep {
  chord: ChordDefinition;
  degreeName: string;
  roleExplanation: string;
  voiceLeadingTip?: string;
}

export type ChordFitTier = 'perfect' | 'good' | 'weak' | 'dissonant';

export interface QuizChoice {
  id: string;
  chord: ChordDefinition;
  degreeName: string;
  moodLabel: string;
  explanation: string;
  isRecommended: boolean;
  whyItWorks: string;
  category?: 'classic' | 'seventh' | 'suspended' | 'altered';
  fitTier: ChordFitTier;
  fitScore: number;
  fitVerdict: string;
}

export interface FamousProgressionStep {
  symbol: string;
  degree: string;
  role: string;
  section?: string; // e.g. "Zwrotka", "Refren", "Bridge", "Pre-Chorus", "Outro", "Część A", "Część B"
}

export interface FamousProgression {
  id: string;
  name: string;
  genre: string;
  description: string;
  key: string;
  structure?: string; // e.g. "Zwrotka ➔ Refren ➔ Bridge", "12-Taktowy Blues", "AABA"
  steps: FamousProgressionStep[];
}

export type NamingConvention = 'polish' | 'international';

export interface WorkshopStepResult {
  stepIndex: number; // 1-based
  status: 'correct' | 'incorrect' | 'unattempted';
  playedNotes?: string[];
  playedMidis?: number[];
  playedChordSymbol?: string;
  expectedChordSymbol?: string;
}
