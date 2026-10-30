import React, { useState, useRef, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  ChordDefinition,
  ChordQuality,
  QuizChoice,
  NamingConvention,
  NoteName,
  WorkshopStepResult,
} from '../types/music';
import {
  createChordDefinition,
  changeChordQuality,
  getSmartNextChordOptions,
  getNoteLabel,
  NOTE_NAMES,
  detectChordFromNotes,
} from '../utils/musicTheory';
import { sound } from '../utils/audioEngine';
import { PianoKeyboard } from './PianoKeyboard';
import {
  Play,
  Square,
  Volume2,
  Check,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Info,
  Award,
  AlertTriangle,
  X,
  Plus,
  Trash2,
  Link,
  ChevronDown,
  ChevronUp,
  Layers,
  Shuffle,
  Eye,
  EyeOff,
  Compass,
  Pin,
  PinOff,
  ArrowLeftRight,
  Wand2,
} from 'lucide-react';
import { LoadedProgressionMetadata, formatDegreeLabel, getProgressionRomanFormula } from './ProgressionLibrary';
import { scrollToTonalityProgressionBar } from '../utils/scrollHelper';
import { generateSmartProgression, saveCustomProgression } from '../utils/progressionGenerator';
import { parseChordSymbol } from '../utils/musicTheory';

export interface CardTheme {
  id: string;
  name: string;
  bg: string;
  hover: string;
  border: string;
  text: string;
  ring: string;
}

export const DIVERSE_COLOR_THEMES: CardTheme[] = [
  { id: 'sky', name: 'Błękitny', bg: 'bg-[#70b4f8]', hover: 'hover:bg-[#5ca8f6]', border: 'border-[#5ca8f6]', text: 'text-slate-950', ring: 'ring-sky-400' },
  { id: 'emerald', name: 'Miętowy', bg: 'bg-[#86efac]', hover: 'hover:bg-[#74e89e]', border: 'border-[#74e89e]', text: 'text-slate-950', ring: 'ring-emerald-400' },
  { id: 'yellow', name: 'Słoneczny', bg: 'bg-[#fde047]', hover: 'hover:bg-[#fcd32d]', border: 'border-[#fcd32d]', text: 'text-slate-950', ring: 'ring-yellow-400' },
  { id: 'purple', name: 'Liliowy', bg: 'bg-[#c084fc]', hover: 'hover:bg-[#b573f8]', border: 'border-[#b573f8]', text: 'text-slate-950', ring: 'ring-purple-400' },
  { id: 'rose', name: 'Koralowy', bg: 'bg-[#fda4af]', hover: 'hover:bg-[#fb7185]', border: 'border-[#fb7185]', text: 'text-slate-950', ring: 'ring-rose-400' },
  { id: 'cyan', name: 'Turkusowy', bg: 'bg-[#67e8f9]', hover: 'hover:bg-[#22d3ee]', border: 'border-[#22d3ee]', text: 'text-slate-950', ring: 'ring-cyan-400' },
  { id: 'orange', name: 'Morelowy', bg: 'bg-[#fdba74]', hover: 'hover:bg-[#fb923c]', border: 'border-[#fb923c]', text: 'text-slate-950', ring: 'ring-orange-400' },
  { id: 'teal', name: 'Szmaragdowy', bg: 'bg-[#5eead4]', hover: 'hover:bg-[#2dd4bf]', border: 'border-[#2dd4bf]', text: 'text-slate-950', ring: 'ring-teal-400' },
  { id: 'indigo', name: 'Lawendowy', bg: 'bg-[#a5b4fc]', hover: 'hover:bg-[#818cf8]', border: 'border-[#818cf8]', text: 'text-slate-950', ring: 'ring-indigo-400' },
  { id: 'lime', name: 'Limonkowy', bg: 'bg-[#bef264]', hover: 'hover:bg-[#a3e635]', border: 'border-[#a3e635]', text: 'text-slate-950', ring: 'ring-lime-400' },
];

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function shuffleAndColorChoices(choices: QuizChoice[]): {
  shuffledChoices: QuizChoice[];
  themeMap: Record<string, CardTheme>;
} {
  const shuffledChoices = shuffleArray(choices);
  const shuffledThemes = shuffleArray(DIVERSE_COLOR_THEMES);
  const themeMap: Record<string, CardTheme> = {};

  shuffledChoices.forEach((ch, idx) => {
    themeMap[ch.id] = shuffledThemes[idx % shuffledThemes.length];
  });

  return { shuffledChoices, themeMap };
}

interface BoardStep {
  stepIndex: number;
  baseChord: ChordDefinition;
  choices: QuizChoice[];
  choiceThemeMap?: Record<string, CardTheme>;
  selectedChoice: QuizChoice | null;
  selectedMidis: number[];
  highlightMap: Record<number, 'correct' | 'incorrect' | 'hint' | 'active'>;
  isSolved: boolean;
  showHint: boolean;
  expandedChoices?: boolean;
}

interface ChessboardProgressionBoardProps {
  convention: NamingConvention;
  onOpenTheory: () => void;
  loadedProgression?: ChordDefinition[] | null;
  loadedKeyInfo?: LoadedProgressionMetadata | null;
  onClearLoadedProgression?: () => void;
  onUpdateWorkshopResults?: (results: Record<number, WorkshopStepResult>) => void;
  onNavigateToLibrary?: () => void;
  onLoadProgression?: (chords: ChordDefinition[], metadata?: LoadedProgressionMetadata) => void;
}

// Helper to generate the exact starter steps matching the screenshot
function createScreenshotStarterSteps(): BoardStep[] {
  // Row 1 choices: C, Cmaj7, Csus4, Fm, D7, G#m
  const cChord = createChordDefinition('C', 'major', 'I', 'Tonika (C-dur) – Czysty punkt wyjścia');
  const cmaj7Chord = createChordDefinition('C', 'maj7', 'Imaj7', 'Aksamitna septyma wielka – Neo-soul / modern chill');
  const csus4Chord = createChordDefinition('C', 'sus4', 'Isus4', 'Zawieszenie kwartowe – Stadionowe uniesienie');
  const fmChord = createChordDefinition('F', 'minor', 'iv', 'Zapożyczenie molowe – Emocjonalny twist');
  const d7Chord = createChordDefinition('D', 'dom7', 'II7', 'Dominanta wtrącona – Kierunek do G');
  const gsmChord = createChordDefinition('G#', 'minor', 'vi#', 'Odległy akord chromatyczny – Niezwykła barwa');

  const row1Choices: QuizChoice[] = [
    {
      id: 'r1_c',
      chord: cChord,
      degreeName: 'I (Tonika – C-dur)',
      moodLabel: 'Klasyczny, czysty punkt wyjścia',
      explanation: 'Akord C to centrum tonalne C-dur. Daje pełną stabilność i jasność.',
      whyItWorks: 'Tonika to baza i punkt odniesienia całej harmonii.',
      isRecommended: true,
      fitTier: 'perfect',
      fitScore: 100,
      fitVerdict: 'Znakomity wybór! (100% dopasowania) – Idealna baza progresji w C-dur',
    },
    {
      id: 'r1_cmaj7',
      chord: cmaj7Chord,
      degreeName: 'Imaj7 (C-dur z wielką septymą)',
      moodLabel: 'Aksamitny, marzycielski chillout neo-soul',
      explanation: 'Dodaje dźwięk H do C-dur, tworząc luksusowe, gładkie brzmienie jazzowo-popowe.',
      whyItWorks: 'Wielka septyma nie burzy stabilności toniki, ale nadaje jej głębi.',
      isRecommended: false,
      fitTier: 'perfect',
      fitScore: 95,
      fitVerdict: 'Świetny, nowoczesny wybór! (95% dopasowania) – Aksamitne maj7',
    },
    {
      id: 'r1_csus4',
      chord: csus4Chord,
      degreeName: 'Isus4 (Zawieszenie kwartowe C)',
      moodLabel: 'Tajemnicze, unoszące się w powietrzu oczekiwanie',
      explanation: 'Zastępuje tercję E kwartą F, która czeka na powrót do stabilnego C-dur.',
      whyItWorks: 'Charakterystyczny motyw stadionowych ballad i rocka progresywnego.',
      isRecommended: false,
      fitTier: 'good',
      fitScore: 86,
      fitVerdict: 'Bardzo ciekawy wariant! (86% dopasowania) – Napięcie zawieszenia sus4',
    },
    {
      id: 'r1_fm',
      chord: fmChord,
      degreeName: 'iv (Zapożyczenie molowe – F-moll)',
      moodLabel: 'Głęboki, wzruszający twist filmowy',
      explanation: 'F-moll w tonacji C-dur to legendarne zapożyczenie z tonacji molowej ("In My Life", "Creep").',
      whyItWorks: 'Dźwięk As opada chromatycznie na G w kolejnym akordzie.',
      isRecommended: false,
      fitTier: 'good',
      fitScore: 82,
      fitVerdict: 'Dobry, ciekawy wybór! (82% dopasowania) – Magiczny, kinowy melancholijny zwrot',
    },
    {
      id: 'r1_d7',
      chord: d7Chord,
      degreeName: 'V/V (Dominanta wtrącona – D7)',
      moodLabel: 'Jazzowo-bluesowe napięcie ku dominantzie',
      explanation: 'D7 to dominanta drugiego stopnia, która nieodparcie ciągnie w stronę akordu G.',
      whyItWorks: 'Tercja Fis prowadzi w górę prosto do prymy akordu G.',
      isRecommended: false,
      fitTier: 'good',
      fitScore: 78,
      fitVerdict: 'Dobry wybór! (78% dopasowania) – Jazzowy krok przygotowujący akord G',
    },
    {
      id: 'r1_gsm',
      chord: gsmChord,
      degreeName: 'Akord obcy (G#-moll)',
      moodLabel: 'Ostry kontrast harmoniczny',
      explanation: 'G#-moll leży bardzo daleko od tonacji C-dur. Wymaga wprawnego przygotowania słuchowego.',
      whyItWorks: 'Tworzy dysonans i niepokój, jeśli nie jest częścią świadomej modulacji chromatycznej.',
      isRecommended: false,
      fitTier: 'weak',
      fitScore: 35,
      fitVerdict: 'Słabszy wybór w prostej progresji (35% dopasowania) – Ostry kontrast tonalny',
    },
  ];

  // Row 2 choices: Am, Am7, F, Fmaj7, E7, Bbm
  const amChord = createChordDefinition('A', 'minor', 'vi', 'Paralela molowa – Melancholijny pop');
  const am7Chord = createChordDefinition('A', 'min7', 'vi7', 'Molowa septyma – Ciepły, soulowy spokój');
  const fChord = createChordDefinition('F', 'major', 'IV', 'Subdominanta – Otwarte uniesienie');
  const fmaj7Chord = createChordDefinition('F', 'maj7', 'IVmaj7', 'Subdominanta maj7 – Szlachetna przestrzeń');
  const e7Chord = createChordDefinition('E', 'dom7', 'III7', 'Dominanta wtrącona do A-moll');
  const bbmChord = createChordDefinition('A#', 'minor', 'bvii', 'Akord neapolitański / obcy');

  const row2Choices: QuizChoice[] = [
    {
      id: 'r2_am',
      chord: amChord,
      degreeName: 'vi (Paralela molowa – A-moll)',
      moodLabel: 'Gładki, wzruszający popowy krok',
      explanation: 'A-moll dzieli z C-dur aż 2 dźwięki (C i E). Brzmi intymnie i naturalnie.',
      whyItWorks: 'Tylko jeden dźwięk (G -> A) porusza się w basie/głosie!',
      isRecommended: true,
      fitTier: 'perfect',
      fitScore: 100,
      fitVerdict: 'Znakomity wybór! (100% dopasowania) – Najpopularniejszy krok po C w muzyce pop',
    },
    {
      id: 'r2_am7',
      chord: am7Chord,
      degreeName: 'vi7 (A-moll z septymą – Am7)',
      moodLabel: 'Ciepły, aksamitny relaks neo-soul / lofi',
      explanation: 'Am7 łączy dźwięki A-C-E-G. Ostatni dźwięk G to tonika C-dur, co daje niesamowitą gładkość.',
      whyItWorks: 'Dźwięk G pozostaje wspólny, sprawiając że przejście z C jest niewymuszone.',
      isRecommended: false,
      fitTier: 'perfect',
      fitScore: 98,
      fitVerdict: 'Znakomity wybór! (98% dopasowania) – Aksamitny Am7',
    },
    {
      id: 'r2_f',
      chord: fChord,
      degreeName: 'IV (Subdominanta – F-dur)',
      moodLabel: 'Jasne otwarcie przestrzeni',
      explanation: 'F-dur daje poczucie wzięcia głębokiego oddechu i uniesienia emocjonalnego.',
      whyItWorks: 'Ruch o kwartę w górę to klasyczny filar harmonii.',
      isRecommended: false,
      fitTier: 'perfect',
      fitScore: 94,
      fitVerdict: 'Świetny wybór! (94% dopasowania) – Ciepła subdominanta otwierająca przestrzeń',
    },
    {
      id: 'r2_fmaj7',
      chord: fmaj7Chord,
      degreeName: 'IVmaj7 (F-dur z wielką septymą)',
      moodLabel: 'Rozmarzona, filmowa subdominanta',
      explanation: 'F-A-C-E zawiera w sobie cały trójdźwięk C-dur (C-E), co tworzy eteryczną więź z toniką.',
      whyItWorks: 'Dźwięk E śpiewa jako szlachetna wielka septyma.',
      isRecommended: false,
      fitTier: 'perfect',
      fitScore: 93,
      fitVerdict: 'Świetny wybór! (93% dopasowania) – Szlachetny Fmaj7',
    },
    {
      id: 'r2_e7',
      chord: e7Chord,
      degreeName: 'V/vi (Dominanta do Am – E7)',
      moodLabel: 'Dramatyczne hiszpańskie/balladowe napięcie',
      explanation: 'E7 prowadzi magnetycznie do A-moll. Dźwięk Gis tworzy piękny półtonowy ciąg.',
      whyItWorks: 'Klasyczna technika wprowadzania molowego punktu kulminacyjnego.',
      isRecommended: false,
      fitTier: 'good',
      fitScore: 80,
      fitVerdict: 'Dobry, ekspresyjny wybór! (80% dopasowania) – Znakomicie przygotowuje A-moll',
    },
    {
      id: 'r2_bbm',
      chord: bbmChord,
      degreeName: 'bvii (B-moll / A#-moll)',
      moodLabel: 'Dysonans i ciemność',
      explanation: 'Bardzo rzadki akord po C, mocno oddala od tonalności bazowej.',
      whyItWorks: 'Może brzmieć chaotycznie bez zaawansowanego prowadzenia głosów.',
      isRecommended: false,
      fitTier: 'weak',
      fitScore: 32,
      fitVerdict: 'Słabszy wybór (32% dopasowania) – Zbyt obcy harmonicznie na tym etapie',
    },
  ];

  // Row 3 choices: G, Gsus4, Cadd9, Em, C7, A#m
  const gChord = createChordDefinition('G', 'major', 'V', 'Dominanta – Zastrzyk energii');
  const gsus4Chord = createChordDefinition('G', 'sus4', 'Vsus4', 'Zawieszenie dominanty – Narastające uniesienie');
  const cadd9Chord = createChordDefinition('C', 'add9', 'Iadd9', 'Przestrzenny kolor pop/acoustic');
  const c7Chord = createChordDefinition('C', 'dom7', 'I7', 'Tonika septymowa – Blues/Funk');
  const emChord = createChordDefinition('E', 'minor', 'iii', 'Medianta – Nostalgiczny zmierzch');
  const ashmChord = createChordDefinition('A#', 'minor', 'vii#', 'Akord obcy');

  const row3Choices: QuizChoice[] = [
    {
      id: 'r3_g',
      chord: gChord,
      degreeName: 'V (Dominanta – G-dur)',
      moodLabel: 'Mocne uniesienie i dążenie do finału',
      explanation: 'Akord G gromadzi maksymalną energię harmoniczną.',
      whyItWorks: 'Nuta H ciągnie w górę prosto do C, bas G rozwiązuje się w I.',
      isRecommended: true,
      fitTier: 'perfect',
      fitScore: 100,
      fitVerdict: 'Znakomity wybór! (100% dopasowania) – Kluczowa dominanta spajająca utwór',
    },
    {
      id: 'r3_gsus4',
      chord: gsus4Chord,
      degreeName: 'Vsus4 (Zawieszenie kwartowe dominanty)',
      moodLabel: 'Podniosłe, stadionowe zawieszenie',
      explanation: 'Gsus4 (G-C-D) zawiesza rozwiązanie, podkręcając apetyt ucha na czyste G i C.',
      whyItWorks: 'Dźwięk C trzyma się w pamięci słuchacza przed rozwiązaniem na nutę H.',
      isRecommended: false,
      fitTier: 'perfect',
      fitScore: 96,
      fitVerdict: 'Świetny wybór! (96% dopasowania) – Epickie zawieszenie przed kadencją',
    },
    {
      id: 'r3_cadd9',
      chord: cadd9Chord,
      degreeName: 'Iadd9 (C-dur z dodaną dziewiątką D)',
      moodLabel: 'Krystaliczny, przestrzenny pop/rock',
      explanation: 'Dodanie nuty D do akordu C nadaje mu blask nowoczesnej ballady akustycznej.',
      whyItWorks: 'Druga/dziewiąta nuta skali nie wprowadza dysonansu septymy, lecz lśniący blask.',
      isRecommended: false,
      fitTier: 'good',
      fitScore: 88,
      fitVerdict: 'Bardzo dobry wybór! (88% dopasowania) – Przestrzenny Cadd9',
    },
    {
      id: 'r3_em',
      chord: emChord,
      degreeName: 'iii (Medianta – E-moll)',
      moodLabel: 'Pastelowy, kinowy most',
      explanation: 'Łagodne zmatowienie barwy, popularne w muzyce ambient i balladach.',
      whyItWorks: 'Dźwięki E i G łączą się z poprzednikami w naturalną całość.',
      isRecommended: false,
      fitTier: 'good',
      fitScore: 78,
      fitVerdict: 'Dobry wybór! (78% dopasowania) – Łagodny, pastelowy most molowy',
    },
    {
      id: 'r3_c7',
      chord: c7Chord,
      degreeName: 'I7 (Dominanta do F – C7)',
      moodLabel: 'Bluesowy zwrot ku subdominancie',
      explanation: 'Dodanie małej septymy (B) zamienia tonikę w dominantę prowadzącą do F-dur.',
      whyItWorks: 'Klasyczny chwyt jazzowo-bluesowy.',
      isRecommended: false,
      fitTier: 'good',
      fitScore: 84,
      fitVerdict: 'Bardzo dobry wybór! (84% dopasowania) – Bluesowy napęd ku akordowi F',
    },
    {
      id: 'r3_ashm',
      chord: ashmChord,
      degreeName: 'Akord dysonujący (A#-moll)',
      moodLabel: 'Obcy zgrzyt',
      explanation: 'Koliduje z tonacją C-dur, brak wspólnych nut z poprzednikami.',
      whyItWorks: 'Rozbija spójność melodii i harmonii.',
      isRecommended: false,
      fitTier: 'weak',
      fitScore: 28,
      fitVerdict: 'Słabszy wybór (28% dopasowania) – Psuje płynność harmoniczną',
    },
  ];

  // Row 4 choices: Dm, Dm7, Fm6, Bb, F#7, Ebm
  const dmChord = createChordDefinition('D', 'minor', 'ii', 'Subdominanta molowa – Jazz 2-5-1');
  const dm7Chord = createChordDefinition('D', 'min7', 'ii7', 'Jazzowo-soulowy filar kadencji 2-5-1');
  const fm6Chord = createChordDefinition('F', 'minor6', 'iv6', 'Melancholijny twist noir / Beatles cliché');
  const fs7Chord = createChordDefinition('F#', 'dom7', 'SubV', 'Substytut trytonowy');
  const bbChord = createChordDefinition('A#', 'major', 'bVII', 'Krok całotonowy – Epicki rock');
  const ebmChord = createChordDefinition('D#', 'minor', 'iii b', 'Akord obcy');

  const row4Choices: QuizChoice[] = [
    {
      id: 'r4_dm',
      chord: dmChord,
      degreeName: 'ii (D-moll – Subdominanta molowa)',
      moodLabel: 'Jazzowo-popowy fundament 2-5-1',
      explanation: 'D-moll idealnie przygotowuje powrót do dominanty G i toniki C.',
      whyItWorks: 'Ruch kwintowy w dół (D -> G -> C) to najpotężniejsza kadencja.',
      isRecommended: true,
      fitTier: 'perfect',
      fitScore: 100,
      fitVerdict: 'Znakomity wybór! (100% dopasowania) – Perfekcyjne przygotowanie kadencji ii-V-I',
    },
    {
      id: 'r4_dm7',
      chord: dm7Chord,
      degreeName: 'ii7 (D-moll z septymą – Dm7)',
      moodLabel: 'Aksamitny standard jazzowy i neo-soul',
      explanation: 'Dm7 (D-F-A-C) ma w sobie nutę C, tworząc miękkie, ciepłe spięcie z toniką.',
      whyItWorks: 'Klasyczna, wyrafinowana alternatywa dla prostego D-moll.',
      isRecommended: false,
      fitTier: 'perfect',
      fitScore: 98,
      fitVerdict: 'Znakomity wybór! (98% dopasowania) – Jazzowo-soulowy Dm7',
    },
    {
      id: 'r4_fm6',
      chord: fm6Chord,
      degreeName: 'iv6 (F-moll z sekstą wielką)',
      moodLabel: 'Tajemniczy, wzruszający klimat kina noir',
      explanation: 'Fm6 (F-As-C-D) zawiera sekstę D, która jest prymą Dm i płynnie wiąże się z C-dur.',
      whyItWorks: 'Legendarny zabieg The Beatles, Davida Bowiego i muzyki filmowej.',
      isRecommended: false,
      fitTier: 'good',
      fitScore: 86,
      fitVerdict: 'Świetny, wyrafinowany wybór! (86% dopasowania) – Wzruszający Fm6',
    },
    {
      id: 'r4_bb',
      chord: bbChord,
      degreeName: 'bVII (B-dur / A#-dur)',
      moodLabel: 'Epicki hymn rockowy',
      explanation: 'Ruch o cały ton poniżej toniki, kochany przez rocka i muzykę filmową.',
      whyItWorks: 'Daje potężne, filmowe poczucie rozmachu i przestrzeni.',
      isRecommended: false,
      fitTier: 'good',
      fitScore: 82,
      fitVerdict: 'Dobry wybór! (82% dopasowania) – Epicki, rockowo-filmowy akord bVII',
    },
    {
      id: 'r4_fs7',
      chord: fs7Chord,
      degreeName: 'subV (Substytut trytonowy – F#7)',
      moodLabel: 'Zaawansowany jazzowy smaczek',
      explanation: 'F#7 dzieli tryton z C7 i opada chromatycznie na F.',
      whyItWorks: 'Charakterystyczne brzmienie jazzu nowoczesnego.',
      isRecommended: false,
      fitTier: 'good',
      fitScore: 74,
      fitVerdict: 'Ciekawy wybór! (74% dopasowania) – Zaawansowany jazzowy substytut',
    },
    {
      id: 'r4_ebm',
      chord: ebmChord,
      degreeName: 'Akord obcy (Eb-moll)',
      moodLabel: 'Dysonujący zgrzyt',
      explanation: 'Brak łączników harmonicznych w tej progresji.',
      whyItWorks: 'Trudny do uzasadnienia w uchu bez skomplikowanego podkładu.',
      isRecommended: false,
      fitTier: 'weak',
      fitScore: 30,
      fitVerdict: 'Słabszy wybór (30% dopasowania) – Nie klei się z poprzednikami',
    },
  ];

  const { shuffledChoices: r1Shuffled, themeMap: r1Themes } = shuffleAndColorChoices(row1Choices);
  const { shuffledChoices: r2Shuffled, themeMap: r2Themes } = shuffleAndColorChoices(row2Choices);
  const { shuffledChoices: r3Shuffled, themeMap: r3Themes } = shuffleAndColorChoices(row3Choices);
  const { shuffledChoices: r4Shuffled, themeMap: r4Themes } = shuffleAndColorChoices(row4Choices);

  return [
    {
      stepIndex: 1,
      baseChord: cChord,
      choices: r1Shuffled,
      choiceThemeMap: r1Themes,
      selectedChoice: null,
      selectedMidis: [],
      highlightMap: {},
      isSolved: false,
      showHint: false,
      expandedChoices: false,
    },
    {
      stepIndex: 2,
      baseChord: amChord,
      choices: r2Shuffled,
      choiceThemeMap: r2Themes,
      selectedChoice: null,
      selectedMidis: [],
      highlightMap: {},
      isSolved: false,
      showHint: false,
      expandedChoices: false,
    },
    {
      stepIndex: 3,
      baseChord: gChord,
      choices: r3Shuffled,
      choiceThemeMap: r3Themes,
      selectedChoice: null,
      selectedMidis: [],
      highlightMap: {},
      isSolved: false,
      showHint: false,
      expandedChoices: false,
    },
    {
      stepIndex: 4,
      baseChord: dmChord,
      choices: r4Shuffled,
      choiceThemeMap: r4Themes,
      selectedChoice: null,
      selectedMidis: [],
      highlightMap: {},
      isSolved: false,
      showHint: false,
      expandedChoices: false,
    },
  ];
}

// Helper to build progression steps from a preset list
function buildStepsFromProgression(
  progression: { root: NoteName; quality: ChordQuality; deg: string }[]
): BoardStep[] {
  return progression.map((item, idx) => {
    const targetChord = createChordDefinition(item.root, item.quality, item.deg);
    const prevChords = progression
      .slice(0, idx)
      .map((p) => createChordDefinition(p.root, p.quality, p.deg));

    let choices = getSmartNextChordOptions(
      prevChords.length > 0 ? prevChords : [targetChord],
      'C',
      'major'
    );

    const alreadyPresent = choices.some((c) => c.chord.symbol === targetChord.symbol);
    if (!alreadyPresent) {
      const targetChoice: QuizChoice = {
        id: `preset_choice_${idx + 1}_${targetChord.symbol}`,
        chord: targetChord,
        degreeName: `${item.deg} (${targetChord.polishSymbol})`,
        moodLabel: targetChord.emotionalRole || 'Dopasowany akord',
        explanation: `Akord ${targetChord.polishSymbol} na stopniu ${item.deg}.`,
        whyItWorks: 'Stanowi kluczowe ogniwo w tej progresji harmonicznej.',
        isRecommended: true,
        fitTier: 'perfect',
        fitScore: 100,
        fitVerdict: 'Doskonałe dopasowanie! Kluczowy akord w wybranym schemacie',
      };
      choices = [targetChoice, ...choices.filter((c) => c.chord.symbol !== targetChord.symbol).slice(0, 5)];
    } else {
      choices = choices.slice(0, 6);
    }

    const { shuffledChoices, themeMap } = shuffleAndColorChoices(choices);

    return {
      stepIndex: idx + 1,
      baseChord: targetChord,
      choices: shuffledChoices,
      choiceThemeMap: themeMap,
      selectedChoice: null,
      selectedMidis: [],
      highlightMap: {},
      isSolved: false,
      showHint: false,
      expandedChoices: false,
    };
  });
}

// Generate 4 extended alternative choices for any step
function getExtendedChoices(primaryChoices: QuizChoice[]): QuizChoice[] {
  const base = primaryChoices[0]?.chord || createChordDefinition('C', 'major', 'I', 'Tonika');
  const root = base.root;
  return [
    {
      id: `ext_${base.symbol}_maj7`,
      chord: createChordDefinition(root, 'maj7', `${base.functionDegree}maj7`, 'Aksamitna wielka septyma'),
      degreeName: `${getNoteLabel(root)}-maj7 (Wielka septyma)`,
      moodLabel: 'Aksamitny, jazzowo-chilloutowy kolor',
      explanation: `Dodaje wielką septymę do ${base.symbol}. Brzmi nowocześnie i kojąco.`,
      whyItWorks: 'Wielka septyma nadaje bogaty, marzycielski charakter.',
      isRecommended: false,
      fitTier: 'perfect',
      fitScore: 95,
      fitVerdict: 'Znakomity wariant! Aksamitne jazzowe maj7',
    },
    {
      id: `ext_${base.symbol}_aug`,
      chord: createChordDefinition(root, 'augmented', `${base.functionDegree}+`, 'Napięcie zwiększone (aug)'),
      degreeName: `${getNoteLabel(root)}-aug (Zwiększony)`,
      moodLabel: 'Kosmiczny, unoszący się kolor',
      explanation: `Zwiększa kwintę o półton (np. C-E-G#). Tworzy tajemnicze, nierzeczywiste napięcie dążące do kolejnego stopnia.`,
      whyItWorks: 'Kwinta zwiększona prowadzi chromatycznie w górę do kolejnego akordu.',
      isRecommended: false,
      fitTier: 'good',
      fitScore: 84,
      fitVerdict: 'Świetny wariant! Intrygujące napięcie akordu zwiększonego (aug)',
    },
    {
      id: `ext_${base.symbol}_sus4`,
      chord: createChordDefinition(root, 'sus4', `${base.functionDegree}sus4`, 'Zawieszenie kwartowe'),
      degreeName: `${getNoteLabel(root)}-sus4 (Zawieszenie)`,
      moodLabel: 'Tajemnicze, unoszące się w powietrzu zawieszenie',
      explanation: `Zastępuje tercję kwartą czystą, tworząc oczekiwanie na rozwiązanie.`,
      whyItWorks: 'Klasyczny chwyt rocka stadionowego i ballady ("Pinball Wizard", Coldplay).',
      isRecommended: false,
      fitTier: 'good',
      fitScore: 82,
      fitVerdict: 'Bardzo ciekawy wariant! Efektowne zawieszenie sus4',
    },
    {
      id: `ext_${base.symbol}_dim`,
      chord: createChordDefinition(root, 'diminished', `${base.functionDegree}°`, 'Napięcie zmniejszone'),
      degreeName: `${getNoteLabel(root)}-dim (Zmniejszony)`,
      moodLabel: 'Ostry, dramatyczny kontrast',
      explanation: `Akord silnie niestabilny, używany jako przejście chromatyczne.`,
      whyItWorks: 'Dwa trytony tworzą gęste napięcie harmoniczne.',
      isRecommended: false,
      fitTier: 'weak',
      fitScore: 45,
      fitVerdict: 'Dramatyczny wariant: mocne napięcie i kontrast',
    },
  ];
}

// Helper to build progression steps from loaded ChordDefinition[]
function buildStepsFromChordDefinitions(chords: ChordDefinition[]): BoardStep[] {
  return chords.map((targetChord, idx) => {
    const prevChords = chords.slice(0, idx);
    let choices = getSmartNextChordOptions(
      prevChords.length > 0 ? prevChords : [targetChord],
      targetChord.root,
      targetChord.quality === 'minor' ? 'minor' : 'major'
    );

    const alreadyPresent = choices.some((c) => c.chord.symbol === targetChord.symbol);
    if (!alreadyPresent) {
      const targetChoice: QuizChoice = {
        id: `loaded_choice_${idx + 1}_${targetChord.symbol}`,
        chord: targetChord,
        degreeName: `${targetChord.functionDegree || ''} (${targetChord.polishSymbol})`,
        moodLabel: targetChord.emotionalRole || 'Załadowany akord ze wzorca',
        explanation: `Akord ${targetChord.polishSymbol}.`,
        whyItWorks: 'Kluczowe ogniwo w załadowanej progresji.',
        isRecommended: true,
        fitTier: 'perfect',
        fitScore: 100,
        fitVerdict: 'Znakomity wybór! (100% dopasowania) – Akord ze wzorca',
      };
      choices = [targetChoice, ...choices.filter((c) => c.chord.symbol !== targetChord.symbol).slice(0, 5)];
    } else {
      choices = choices.slice(0, 6);
    }

    const { shuffledChoices, themeMap } = shuffleAndColorChoices(choices);

    return {
      stepIndex: idx + 1,
      baseChord: targetChord,
      choices: shuffledChoices,
      choiceThemeMap: themeMap,
      selectedChoice: null,
      selectedMidis: [],
      highlightMap: {},
      isSolved: false,
      showHint: false,
      expandedChoices: false,
    };
  });
}

// Helper to determine if a progression step has been correctly chosen or played
export function isStepCorrect(step: BoardStep): boolean {
  const targetChord = step.baseChord;
  const targetPitchClasses = Array.from(
    new Set(targetChord.defaultNotes.map((n) => n.midi % 12))
  ).sort((a, b) => a - b);

  // If the user has notes selected on the keyboard, keyboard input MUST match the target chord:
  // EXACT count of pitch classes (e.g. 4 for 7th chords, 3 for triads) AND exact pitch class match
  if (step.selectedMidis.length > 0) {
    const playedPitchClasses = Array.from(
      new Set(step.selectedMidis.map((m) => m % 12))
    ).sort((a, b) => a - b);

    return (
      playedPitchClasses.length === targetPitchClasses.length &&
      playedPitchClasses.every((p, i) => p === targetPitchClasses[i])
    );
  }

  // If no notes on keyboard, check if user explicitly clicked the exact matching target chord tile:
  if (step.selectedChoice) {
    const choice = step.selectedChoice;
    return (
      choice.chord.root === targetChord.root &&
      choice.chord.quality === targetChord.quality
    );
  }

  return false;
}

export const ChessboardProgressionBoard: React.FC<ChessboardProgressionBoardProps> = ({
  convention,
  onOpenTheory,
  loadedProgression,
  loadedKeyInfo,
  onClearLoadedProgression,
  onUpdateWorkshopResults,
  onNavigateToLibrary,
  onLoadProgression,
}) => {
  // Pre-generate steps (default 4 matching screenshot or loadedProgression if present)
  const [steps, setSteps] = useState<BoardStep[]>(() => {
    if (loadedProgression && loadedProgression.length > 0) {
      return buildStepsFromChordDefinitions(loadedProgression);
    }
    return createScreenshotStarterSteps();
  });


  // When a new progression is loaded from Library or Sandbox, update the steps immediately
  // and smoothly scroll so that the tonality and progression bar is positioned at the top of the viewport
  useEffect(() => {
    if (loadedProgression && loadedProgression.length > 0) {
      setSteps(buildStepsFromChordDefinitions(loadedProgression));
      scrollToTonalityProgressionBar();
    }
  }, [loadedProgression]);

  // Report workshop step results to parent so that ProgressionLibrary can show green/red states
  useEffect(() => {
    if (!onUpdateWorkshopResults) return;

    const results: Record<number, WorkshopStepResult> = {};
    steps.forEach((step) => {
      const targetChord = step.baseChord;
      const targetPitchClasses = Array.from(
        new Set(targetChord.defaultNotes.map((n) => n.midi % 12))
      ).sort((a, b) => a - b);

      const playedPitchClasses = Array.from(
        new Set(step.selectedMidis.map((m) => m % 12))
      ).sort((a, b) => a - b);

      const hasPlayedMidis = step.selectedMidis.length > 0;
      const hasSelectedChoice = Boolean(step.selectedChoice);

      if (!hasPlayedMidis && !hasSelectedChoice && !step.isSolved) {
        results[step.stepIndex] = {
          stepIndex: step.stepIndex,
          status: 'unattempted',
          expectedChordSymbol: convention === 'international' ? targetChord.symbol : targetChord.polishSymbol,
        };
        return;
      }

      // Check if played pitch classes match target pitch classes
      const pitchClassesMatch =
        playedPitchClasses.length === targetPitchClasses.length &&
        playedPitchClasses.every((p, i) => p === targetPitchClasses[i]);

      // Check if chosen chord matches target chord
      const choiceMatchesBase =
        Boolean(step.selectedChoice) &&
        step.selectedChoice!.chord.root === targetChord.root &&
        step.selectedChoice!.chord.quality === targetChord.quality;

      const isCorrect = isStepCorrect(step);

      const playedNoteLabels = Array.from(
        new Set(step.selectedMidis.map((m) => getNoteLabel(NOTE_NAMES[m % 12], convention)))
      );

      let playedChordSymbol: string | undefined = undefined;
      if (step.selectedChoice) {
        playedChordSymbol = convention === 'international'
          ? step.selectedChoice.chord.symbol
          : step.selectedChoice.chord.polishSymbol;
      } else if (playedNoteLabels.length > 0) {
        playedChordSymbol = playedNoteLabels.join('-');
      }

      results[step.stepIndex] = {
        stepIndex: step.stepIndex,
        status: isCorrect ? 'correct' : 'incorrect',
        playedNotes: playedNoteLabels,
        playedMidis: step.selectedMidis,
        playedChordSymbol,
        expectedChordSymbol: convention === 'international' ? targetChord.symbol : targetChord.polishSymbol,
      };
    });

    onUpdateWorkshopResults(results);
  }, [steps, convention, onUpdateWorkshopResults]);

  // Long press inspecting chord detail modal state
  const [inspectingChordChoice, setInspectingChordChoice] = useState<{
    choice: QuizChoice;
    stepIndex: number;
  } | null>(null);

  // Global playback state
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [activePlaybackStep, setActivePlaybackStep] = useState<number | null>(null);

  // One-button toggle to hide chord choices rows (revealing only the piano keyboards for no-hint play)
  // User Request 1: Niech na starcie aplikacji będzie się włączał tryb bez podpowiedzi
  const [hideChordChoices, setHideChordChoices] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('harmonix_hide_chord_choices');
      if (saved !== null) return saved === 'true';
    } catch {}
    return true; // Default to true (tryb bez podpowiedzi na starcie aplikacji)
  });
  const [peekedStepIndices, setPeekedStepIndices] = useState<Set<number>>(new Set());

  const handleToggleHideChordChoices = (forcedVal?: boolean) => {
    setHideChordChoices((prev) => {
      const next = typeof forcedVal === 'boolean' ? forcedVal : !prev;
      try {
        localStorage.setItem('harmonix_hide_chord_choices', String(next));
      } catch {}
      return next;
    });
    setPeekedStepIndices(new Set());
  };

  const handleToggleStepPeek = (stepIdx: number) => {
    setPeekedStepIndices((prev) => {
      const next = new Set(prev);
      if (next.has(stepIdx)) next.delete(stepIdx);
      else next.add(stepIdx);
      return next;
    });
  };

  // User request: Pin tonality & progression bar right below navigation tabs
  const [isTonalityBarPinned, setIsTonalityBarPinned] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('harmonix_tonality_bar_pinned');
      if (saved !== null) return saved === 'true';
    } catch {}
    return true; // Default to true so it stays stuck to the top!
  });

  const handleTogglePinTonalityBar = () => {
    setIsTonalityBarPinned((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('harmonix_tonality_bar_pinned', String(next));
      } catch {}

      if (next) {
        // When user turns on pinning, smoothly scroll so it docks right under the header
        setTimeout(() => {
          const el = document.getElementById('workshop-tonality-progression-bar');
          const panel = document.getElementById('tabpanel-workshop');
          if (el && panel) {
            const panelRect = panel.getBoundingClientRect();
            const elRect = el.getBoundingClientRect();
            const targetY = panel.scrollTop + (elRect.top - panelRect.top);
            panel.scrollTo({
              top: Math.max(0, targetY),
              behavior: 'smooth',
            });
          }
        }, 50);
      }
      return next;
    });
  };

  // User Request: Toggle between Roman numeral progression notation and concrete chords in the active tonality
  const [progressionNotation, setProgressionNotation] = useState<'roman' | 'chords'>(() => {
    try {
      return localStorage.getItem('harmonix_progression_bar_notation') === 'chords' ? 'chords' : 'roman';
    } catch {
      return 'roman';
    }
  });

  const handleToggleProgressionNotation = () => {
    setProgressionNotation((prev) => {
      const next = prev === 'roman' ? 'chords' : 'roman';
      try {
        localStorage.setItem('harmonix_progression_bar_notation', next);
      } catch {}
      return next;
    });
  };

  // Synchronized keyboard scrolling state and registry across ALL levels
  const keyboardContainersRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const isSyncingRef = useRef(false);
  const currentScrollLeftRef = useRef<number>(0);

  const registerKeyboardRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) {
      keyboardContainersRef.current.set(id, el);
      // Immediately sync new keyboard to the current scroll position so all keys line up
      if (currentScrollLeftRef.current > 0) {
        el.scrollLeft = currentScrollLeftRef.current;
      }
    } else {
      keyboardContainersRef.current.delete(id);
    }
  }, []);

  const handleSyncScroll = useCallback((scrollLeft: number, sourceId: string) => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    currentScrollLeftRef.current = scrollLeft;

    keyboardContainersRef.current.forEach((el, id) => {
      if (id !== sourceId && el && Math.abs(el.scrollLeft - scrollLeft) > 1) {
        el.scrollLeft = scrollLeft;
      }
    });

    requestAnimationFrame(() => {
      isSyncingRef.current = false;
    });
  }, []);

  const handleSyncScrollBy = useCallback((delta: number) => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;

    const firstEl = keyboardContainersRef.current.values().next().value;
    const currentLeft = firstEl ? firstEl.scrollLeft : currentScrollLeftRef.current;
    const targetLeft = Math.max(0, currentLeft + delta);
    currentScrollLeftRef.current = targetLeft;

    keyboardContainersRef.current.forEach((el) => {
      if (el) {
        el.scrollTo({ left: targetLeft, behavior: 'smooth' });
      }
    });

    setTimeout(() => {
      isSyncingRef.current = false;
    }, 350);
  }, []);

  const handleSyncCenter = useCallback((targetLeft: number) => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    currentScrollLeftRef.current = targetLeft;

    keyboardContainersRef.current.forEach((el) => {
      if (el) {
        el.scrollTo({ left: targetLeft, behavior: 'smooth' });
      }
    });

    setTimeout(() => {
      isSyncingRef.current = false;
    }, 350);
  }, []);

  // Timer reference for long press detection (Hold)
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isHoldActionTriggeredRef = useRef(false);

  // Position tracking to distinguish between scrolling/swiping and intentional tapping
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const isScrollingOrMovedRef = useRef<boolean>(false);

  // Global scroll listener: any window or container scroll immediately aborts card tapping/holding
  useEffect(() => {
    const handleScroll = () => {
      isScrollingOrMovedRef.current = true;
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle chord option select (Click / Tap)
  const handleSelectChoice = (stepIdx: number, choice: QuizChoice) => {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.stepIndex !== stepIdx) return s;
        const targetChord = s.baseChord;
        const matchesTarget =
          choice.chord.root === targetChord.root && choice.chord.quality === targetChord.quality;
        return {
          ...s,
          selectedChoice: choice,
          selectedMidis: [],
          highlightMap: {},
          isSolved: matchesTarget,
          showHint: false,
        };
      })
    );

    sound.playChord(choice.chord.defaultNotes.map((n) => n.midi), 2.4, 0, 0.9);
  };

  // Reset/Clear a single step completely (keys and choice)
  const handleResetSingleStep = (stepIdx: number) => {
    setSteps((prev) =>
      prev.map((s) =>
        s.stepIndex === stepIdx
          ? {
              ...s,
              selectedChoice: null,
              selectedMidis: [],
              highlightMap: {},
              isSolved: false,
              showHint: false,
            }
          : s
      )
    );
  };

  // Long press and touch handlers with scroll prevention
  const handleCardPressStart = (
    stepIdx: number,
    choice: QuizChoice,
    e: React.MouseEvent | React.TouchEvent
  ) => {
    const clientX =
      'touches' in e && e.touches.length > 0
        ? e.touches[0].clientX
        : (e as React.MouseEvent).clientX;
    const clientY =
      'touches' in e && e.touches.length > 0
        ? e.touches[0].clientY
        : (e as React.MouseEvent).clientY;

    touchStartPosRef.current = { x: clientX, y: clientY };
    isScrollingOrMovedRef.current = false;
    isHoldActionTriggeredRef.current = false;

    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);

    holdTimerRef.current = setTimeout(() => {
      if (!isScrollingOrMovedRef.current) {
        isHoldActionTriggeredRef.current = true;
        setInspectingChordChoice({ choice, stepIndex: stepIdx });
        sound.playChord(choice.chord.defaultNotes.map((n) => n.midi), 2.2, 0, 0.85);
      }
    }, 420);
  };

  const handleCardPressMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!touchStartPosRef.current) return;

    const clientX =
      'touches' in e && e.touches.length > 0
        ? e.touches[0].clientX
        : (e as React.MouseEvent).clientX;
    const clientY =
      'touches' in e && e.touches.length > 0
        ? e.touches[0].clientY
        : (e as React.MouseEvent).clientY;

    const dx = Math.abs(clientX - touchStartPosRef.current.x);
    const dy = Math.abs(clientY - touchStartPosRef.current.y);

    if (dx > 7 || dy > 7) {
      isScrollingOrMovedRef.current = true;
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }
    }
  };

  const handleCardPressEnd = (
    stepIdx: number,
    choice: QuizChoice,
    e: React.MouseEvent | React.TouchEvent
  ) => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    if (isHoldActionTriggeredRef.current) {
      isHoldActionTriggeredRef.current = false;
      touchStartPosRef.current = null;
      return;
    }

    if (!isScrollingOrMovedRef.current) {
      handleSelectChoice(stepIdx, choice);
    }

    touchStartPosRef.current = null;
    isScrollingOrMovedRef.current = false;
  };

  const handleCardPressCancel = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    isHoldActionTriggeredRef.current = false;
    touchStartPosRef.current = null;
    isScrollingOrMovedRef.current = false;
  };

  // Add dynamic steps without limit
  const handleAddStep = () => {
    setSteps((prev) => {
      const prevChords = prev.map((s) => s.selectedChoice?.chord || s.baseChord);
      const nextChoices = getSmartNextChordOptions(prevChords, 'C', 'major');
      const { shuffledChoices, themeMap } = shuffleAndColorChoices(nextChoices);

      const newStep: BoardStep = {
        stepIndex: prev.length + 1,
        baseChord: nextChoices[0].chord,
        choices: shuffledChoices,
        choiceThemeMap: themeMap,
        selectedChoice: null,
        selectedMidis: [],
        highlightMap: {},
        isSolved: false,
        showHint: false,
        expandedChoices: false,
      };

      return [...prev, newStep];
    });
  };

  // Shuffle all choices and colors across all steps
  const handleShuffleAllChoices = () => {
    setSteps((prev) =>
      prev.map((step) => {
        const { shuffledChoices, themeMap } = shuffleAndColorChoices(step.choices);
        return {
          ...step,
          choices: shuffledChoices,
          choiceThemeMap: themeMap,
        };
      })
    );
  };

  // Shuffle choices and colors for a single specific step
  const handleShuffleStepChoices = (stepIdx: number) => {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.stepIndex !== stepIdx) return s;
        const { shuffledChoices, themeMap } = shuffleAndColorChoices(s.choices);
        return {
          ...s,
          choices: shuffledChoices,
          choiceThemeMap: themeMap,
        };
      })
    );
  };

  // Reset user's selections so they can retake the quiz from scratch
  const handleResetAllChoices = () => {
    setSteps((prev) =>
      prev.map((s) => ({
        ...s,
        selectedChoice: null,
        selectedMidis: [],
        highlightMap: {},
        isSolved: false,
        showHint: false,
      }))
    );
  };

  const handleRemoveStep = (stepIdx: number) => {
    setSteps((prev) => {
      if (prev.length <= 2) return prev;
      const filtered = prev.filter((s) => s.stepIndex !== stepIdx);
      return filtered.map((s, idx) => ({
        ...s,
        stepIndex: idx + 1,
      }));
    });
  };

  const handleToggleExpandedChoices = (stepIdx: number) => {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.stepIndex !== stepIdx) return s;
        return {
          ...s,
          expandedChoices: !s.expandedChoices,
        };
      })
    );
  };

  // Apply Progression Presets
  const handleApplyPreset = (presetType: '4_screen' | '6_ballad' | '8_pachelbel' | '8_jazz' | '12_blues') => {
    if (presetType === '4_screen') {
      setSteps(createScreenshotStarterSteps());
      return;
    }

    if (presetType === '6_ballad') {
      const chordSymbols = [
        { root: 'C' as NoteName, quality: 'major' as ChordQuality, deg: 'I' },
        { root: 'A' as NoteName, quality: 'minor' as ChordQuality, deg: 'vi' },
        { root: 'F' as NoteName, quality: 'major' as ChordQuality, deg: 'IV' },
        { root: 'D' as NoteName, quality: 'minor' as ChordQuality, deg: 'ii' },
        { root: 'G' as NoteName, quality: 'major' as ChordQuality, deg: 'V' },
        { root: 'C' as NoteName, quality: 'major' as ChordQuality, deg: 'I' },
      ];
      setSteps(buildStepsFromProgression(chordSymbols));
      return;
    }

    if (presetType === '8_pachelbel') {
      const chordSymbols = [
        { root: 'C' as NoteName, quality: 'major' as ChordQuality, deg: 'I' },
        { root: 'G' as NoteName, quality: 'major' as ChordQuality, deg: 'V' },
        { root: 'A' as NoteName, quality: 'minor' as ChordQuality, deg: 'vi' },
        { root: 'E' as NoteName, quality: 'minor' as ChordQuality, deg: 'iii' },
        { root: 'F' as NoteName, quality: 'major' as ChordQuality, deg: 'IV' },
        { root: 'C' as NoteName, quality: 'major' as ChordQuality, deg: 'I' },
        { root: 'F' as NoteName, quality: 'major' as ChordQuality, deg: 'IV' },
        { root: 'G' as NoteName, quality: 'major' as ChordQuality, deg: 'V' },
      ];
      setSteps(buildStepsFromProgression(chordSymbols));
      return;
    }

    if (presetType === '8_jazz') {
      const chordSymbols = [
        { root: 'C' as NoteName, quality: 'maj7' as ChordQuality, deg: 'Imaj7' },
        { root: 'A' as NoteName, quality: 'dom7' as ChordQuality, deg: 'VI7' },
        { root: 'D' as NoteName, quality: 'min7' as ChordQuality, deg: 'ii7' },
        { root: 'G' as NoteName, quality: 'dom7' as ChordQuality, deg: 'V7' },
        { root: 'E' as NoteName, quality: 'min7' as ChordQuality, deg: 'iii7' },
        { root: 'A' as NoteName, quality: 'dom7' as ChordQuality, deg: 'VI7' },
        { root: 'D' as NoteName, quality: 'min7' as ChordQuality, deg: 'ii7' },
        { root: 'G' as NoteName, quality: 'dom7' as ChordQuality, deg: 'V7' },
      ];
      setSteps(buildStepsFromProgression(chordSymbols));
      return;
    }

    if (presetType === '12_blues') {
      const bluesSeq: { root: NoteName; quality: ChordQuality; deg: string }[] = [
        { root: 'C', quality: 'dom7', deg: 'I7' },
        { root: 'C', quality: 'dom7', deg: 'I7' },
        { root: 'C', quality: 'dom7', deg: 'I7' },
        { root: 'C', quality: 'dom7', deg: 'I7' },
        { root: 'F', quality: 'dom7', deg: 'IV7' },
        { root: 'F', quality: 'dom7', deg: 'IV7' },
        { root: 'C', quality: 'dom7', deg: 'I7' },
        { root: 'C', quality: 'dom7', deg: 'I7' },
        { root: 'G', quality: 'dom7', deg: 'V7' },
        { root: 'F', quality: 'dom7', deg: 'IV7' },
        { root: 'C', quality: 'dom7', deg: 'I7' },
        { root: 'G', quality: 'dom7', deg: 'V7' },
      ];
      setSteps(buildStepsFromProgression(bluesSeq));
      return;
    }
  };

  // User Request: Generate on-the-fly rich progressions with extended chords (6, sus2, sus4, aug, dim, add9)
  const handleQuickGenerateExtended = () => {
    const keyRoot = loadedKeyInfo?.root || 'C';
    const mode = loadedKeyInfo?.mode || 'major';
    const targetLength = (steps.length === 6 ? 6 : steps.length >= 8 ? 8 : 4) as 4 | 6 | 8;
    const newProg = generateSmartProgression({
      keyRoot,
      mode,
      length: targetLength,
    });

    const parsedChords = newProg.steps.map((st) => {
      const parsed = parseChordSymbol(st.symbol);
      return createChordDefinition(parsed.root, parsed.quality, st.degree, st.role);
    });

    const formulaInfo = getProgressionRomanFormula(newProg);
    const formulaString = formulaInfo.hasSections
      ? formulaInfo.sectionFormulas.map((s) => `${s.name}: ${s.formula}`).join(' | ')
      : formulaInfo.fullFormula;

    // User Request: Niech każde kliknięcie wstawienia do warsztatu wygrywanej progresji automatycznie zapisuje ją do wzorców na stałe
    saveCustomProgression(newProg);

    setSteps(buildStepsFromChordDefinitions(parsedChords));

    if (onLoadProgression) {
      onLoadProgression(parsedChords, {
        keyName: newProg.key,
        progName: newProg.name,
        progId: newProg.id,
        degrees: formulaString,
        root: keyRoot,
        mode,
      });
    }

    scrollToTonalityProgressionBar();
  };

  // User Request: Randomize tonality in workshop and transpose all steps to the new key
  const handleRandomizeWorkshopKey = () => {
    const currentRoot = loadedKeyInfo?.root || 'C';
    const otherRoots = NOTE_NAMES.filter((r) => r !== currentRoot);
    const newRoot = otherRoots[Math.floor(Math.random() * otherRoots.length)];
    const oldIdx = NOTE_NAMES.indexOf(currentRoot);
    const newIdx = NOTE_NAMES.indexOf(newRoot);
    const delta = (newIdx - oldIdx + 12) % 12;

    const isMinor = loadedKeyInfo?.mode === 'minor';
    const keyLabel = getNoteLabel(newRoot, convention);
    const newKeyName = isMinor ? `${keyLabel}-moll` : `${keyLabel}-dur`;

    const transposedChords = steps.map((s) => {
      const parsed = parseChordSymbol(s.baseChord.symbol);
      const oldChordIdx = NOTE_NAMES.indexOf(parsed.root);
      const newChordRoot = NOTE_NAMES[(oldChordIdx + delta) % 12];
      return createChordDefinition(
        newChordRoot,
        parsed.quality,
        s.baseChord.functionDegree,
        s.baseChord.description
      );
    });

    if (onLoadProgression) {
      onLoadProgression(transposedChords, {
        keyName: newKeyName,
        progName: loadedKeyInfo?.progName || 'Ćwiczenie',
        progId: loadedKeyInfo?.progId,
        degrees: loadedKeyInfo?.degrees || '',
        root: newRoot,
        mode: loadedKeyInfo?.mode || 'major',
      });
    } else {
      setSteps(buildStepsFromChordDefinitions(transposedChords));
    }
  };

  // Helper to evaluate what chord matches the played MIDI notes on a step
  const evaluatePlayedChord = (
    step: BoardStep,
    updatedMidis: number[]
  ): {
    matchedChoice: QuizChoice | null;
    isSolved: boolean;
  } => {
    if (updatedMidis.length === 0) {
      return { matchedChoice: null, isSolved: false };
    }

    const selectedPitchClasses = Array.from(
      new Set(updatedMidis.map((m) => m % 12))
    ).sort((a, b) => a - b);

    const targetChord = step.baseChord;
    const targetPitchClasses = Array.from(
      new Set(targetChord.defaultNotes.map((n) => n.midi % 12))
    ).sort((a, b) => a - b);

    // 1. EXACT match check against targetChord of this step:
    // Requires exact pitch class count (triad = 3, 7th chord = 4) and exact matches!
    const isTargetMatched =
      selectedPitchClasses.length === targetPitchClasses.length &&
      selectedPitchClasses.every((p, i) => p === targetPitchClasses[i]);

    if (isTargetMatched) {
      const displayChoices = step.expandedChoices
        ? [...step.choices, ...getExtendedChoices(step.choices)]
        : step.choices;

      const existingChoice = displayChoices.find(
        (c) => c.chord.root === targetChord.root && c.chord.quality === targetChord.quality
      );

      if (existingChoice) {
        return { matchedChoice: existingChoice, isSolved: true };
      }

      const exactChoice: QuizChoice = {
        id: `played_target_${targetChord.symbol}_step_${step.stepIndex}`,
        chord: targetChord,
        degreeName: `${targetChord.functionDegree || ''} (${targetChord.polishSymbol})`,
        moodLabel: targetChord.emotionalRole || 'Poprawny akord progresji',
        explanation: `Akord ${targetChord.polishSymbol} został poprawnie ułożony na klawiaturze.`,
        whyItWorks: 'Idealne dopasowanie do wzorca.',
        isRecommended: true,
        fitTier: 'perfect',
        fitScore: 100,
        fitVerdict: 'Znakomity wybór! (100% dopasowania) – Prawidłowy akord',
      };
      return { matchedChoice: exactChoice, isSolved: true };
    }

    // 2. If not the exact target, detect what chord the user actually played
    // so the C3-C6 header row can show the recognized chord name, but isSolved is strictly FALSE!
    let detectedChord: { root: NoteName; quality: ChordQuality } | null = null;

    if (selectedPitchClasses.length >= 3) {
      for (const root of selectedPitchClasses) {
        const rootName = NOTE_NAMES[root];
        const intervals = selectedPitchClasses
          .map((p) => (p - root + 12) % 12)
          .sort((a, b) => a - b);

        let quality: ChordQuality | null = null;
        if (intervals.length === 3 && intervals[0] === 0 && intervals[1] === 4 && intervals[2] === 7) {
          quality = 'major';
        } else if (intervals.length === 3 && intervals[0] === 0 && intervals[1] === 3 && intervals[2] === 7) {
          quality = 'minor';
        } else if (intervals.length === 3 && intervals[0] === 0 && intervals[1] === 4 && intervals[2] === 8) {
          quality = 'augmented';
        } else if (intervals.length === 3 && intervals[0] === 0 && intervals[1] === 3 && intervals[2] === 6) {
          quality = 'diminished';
        } else if (intervals.length === 3 && intervals[0] === 0 && intervals[1] === 5 && intervals[2] === 7) {
          quality = 'sus4';
        } else if (intervals.length === 3 && intervals[0] === 0 && intervals[1] === 2 && intervals[2] === 7) {
          quality = 'sus2';
        } else if (intervals.length === 4 && intervals[0] === 0 && intervals[1] === 4 && intervals[2] === 8 && intervals[3] === 10) {
          quality = 'augmented';
        } else if (intervals.length === 4 && intervals[0] === 0 && intervals[1] === 4 && intervals[2] === 7 && intervals[3] === 10) {
          quality = 'dom7';
        } else if (intervals.length === 4 && intervals[0] === 0 && intervals[1] === 4 && intervals[2] === 7 && intervals[3] === 11) {
          quality = 'maj7';
        } else if (intervals.length === 4 && intervals[0] === 0 && intervals[1] === 3 && intervals[2] === 7 && intervals[3] === 10) {
          quality = 'min7';
        } else if (intervals.length === 4 && intervals[0] === 0 && intervals[1] === 3 && intervals[2] === 6 && intervals[3] === 10) {
          quality = 'm7b5';
        } else if (intervals.length === 4 && intervals[0] === 0 && intervals[1] === 3 && intervals[2] === 6 && intervals[3] === 9) {
          quality = 'dim7';
        }

        if (quality) {
          detectedChord = { root: rootName, quality };
          break;
        }
      }
    }

    if (detectedChord) {
      const chordDef = createChordDefinition(detectedChord.root, detectedChord.quality, 'Z klawiatury', 'Zagrany akord');
      const dynamicChoice: QuizChoice = {
        id: `played_${detectedChord.root}_${detectedChord.quality}_step_${step.stepIndex}`,
        chord: chordDef,
        degreeName: `${chordDef.functionDegree || ''} (${chordDef.polishSymbol})`,
        moodLabel: 'Inny akord ułożony z klawiatury',
        explanation: `Akord ${chordDef.polishSymbol} został ułożony na klawiaturze.`,
        whyItWorks: 'Nie zgadza się z oczekiwanym akordem wzorca w tym kroku.',
        isRecommended: false,
        fitTier: 'weak',
        fitScore: 50,
        fitVerdict: `Zagrany akord: ${convention === 'international' ? chordDef.symbol : chordDef.polishSymbol}`,
      };

      return { matchedChoice: dynamicChoice, isSolved: false };
    }

    return { matchedChoice: null, isSolved: false };
  };

  // Note toggle logic on piano keyboard - handles chord recognition & validation from keyboard
  const handleNoteToggleOnStep = (stepIdx: number, midi: number) => {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.stepIndex !== stepIdx) return s;

        const isCurrentlySelected = s.selectedMidis.includes(midi);
        const updatedMidis = isCurrentlySelected
          ? s.selectedMidis.filter((m) => m !== midi)
          : [...s.selectedMidis, midi];

        // 1. If all keys were unselected (empty keyboard):
        if (updatedMidis.length === 0) {
          return {
            ...s,
            selectedMidis: [],
            highlightMap: {},
            isSolved: false,
            selectedChoice: null,
          };
        }

        // 2. Evaluate whether the played MIDI notes match the target chord:
        const { matchedChoice, isSolved: isChordMatched } = evaluatePlayedChord(s, updatedMidis);

        if (isChordMatched && matchedChoice) {
          // Play celebration sound & confetti on newly matched chord
          if (!s.isSolved) {
            confetti({
              particleCount: 50,
              spread: 55,
              origin: { y: 0.7 },
            });
            sound.playChord(updatedMidis, 2.2, 0, 0.95);
          }

          const correctHighlightMap: Record<number, 'correct'> = {};
          updatedMidis.forEach((m) => {
            correctHighlightMap[m] = 'correct';
          });

          return {
            ...s,
            selectedChoice: matchedChoice,
            selectedMidis: updatedMidis,
            highlightMap: correctHighlightMap,
            isSolved: true,
          };
        }

        // 3. If chord is NOT matched or incomplete (e.g. 3 of 4 notes for 7th chord):
        const targetPitchClasses = new Set(s.baseChord.defaultNotes.map((n) => n.midi % 12));
        const newHighlightMap: Record<number, 'correct' | 'incorrect' | 'hint' | 'active'> = {};

        updatedMidis.forEach((m) => {
          const matches = targetPitchClasses.has(m % 12);
          newHighlightMap[m] = matches ? 'active' : 'incorrect';
        });

        if (s.showHint) {
          s.baseChord.defaultNotes.forEach((n) => {
            if (!newHighlightMap[n.midi]) {
              newHighlightMap[n.midi] = 'hint';
            }
          });
        }

        return {
          ...s,
          selectedChoice: matchedChoice,
          selectedMidis: updatedMidis,
          highlightMap: newHighlightMap,
          isSolved: false,
        };
      })
    );
  };

  const handleToggleHint = (stepIdx: number) => {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.stepIndex !== stepIdx || !s.selectedChoice) return s;
        const nextShow = !s.showHint;
        const newMap: Record<number, 'hint'> = {};
        if (nextShow) {
          s.selectedChoice.chord.defaultNotes.forEach((n) => {
            newMap[n.midi] = 'hint';
          });
        }
        return {
          ...s,
          showHint: nextShow,
          highlightMap: newMap,
        };
      })
    );
  };

  const handlePlayEntireProgression = async () => {
    if (isPlayingAll) return;
    setIsPlayingAll(true);

    const activeSteps = steps.filter((s) => s.selectedChoice);
    try {
      for (const step of activeSteps) {
        setActivePlaybackStep(step.stepIndex);
        sound.playChord(
          step.selectedChoice!.chord.defaultNotes.map((n) => n.midi),
          1.8,
          0,
          0.9
        );
        await new Promise((res) => setTimeout(res, 1400));
      }
    } finally {
      setIsPlayingAll(false);
      setActivePlaybackStep(null);
    }
  };

  // User Request: In the progression bar (pinned or unpinned), chords that are correctly selected turn font color from white to green
  // User Request: Toggle between Roman notation (I, vi, IV, V) and concrete chord names (C, Am, F, G)
  const renderProgressionDegreeList = () => {
    // 1. If loadedKeyInfo has section division (e.g., "Zwrotka: ... | Refren: ...")
    if (loadedKeyInfo?.degrees && (loadedKeyInfo.degrees.includes('|') || loadedKeyInfo.degrees.includes(':'))) {
      const sections = loadedKeyInfo.degrees.split('|').map((sec) => sec.trim());
      let overallStepIdx = 0;

      return sections.map((sec, secIdx) => {
        const colonIdx = sec.indexOf(':');
        const secTitle = colonIdx !== -1 ? sec.slice(0, colonIdx + 1).trim() : '';
        const formulaPart = colonIdx !== -1 ? sec.slice(colonIdx + 1).trim() : sec;
        const degreeTokens = formulaPart.split(/[-–—]/).map((d) => d.trim()).filter(Boolean);

        return (
          <div key={`sec_${secIdx}`} className="inline-flex items-center gap-1 flex-wrap">
            {secIdx > 0 && <span className="text-slate-600 mx-1 font-normal select-none">|</span>}
            {secTitle && <span className="text-amber-400/90 font-semibold text-[10px] select-none">{secTitle}</span>}
            {degreeTokens.map((degToken, dIdx) => {
              const currentStep = steps[overallStepIdx];
              overallStepIdx++;
              const isCorrect = currentStep ? isStepCorrect(currentStep) : false;

              const romanLabel = degToken;
              const chordLabel = currentStep
                ? convention === 'polish'
                  ? currentStep.baseChord.polishSymbol
                  : currentStep.baseChord.symbol
                : degToken;

              const displayLabel = progressionNotation === 'chords' ? chordLabel : romanLabel;

              return (
                <React.Fragment key={`sec_step_${secIdx}_${dIdx}`}>
                  {dIdx > 0 && <span className="text-slate-600 font-normal select-none">–</span>}
                  <span
                    className={`transition-colors duration-200 select-none ${
                      isCorrect
                        ? 'text-emerald-400 font-black drop-shadow-[0_0_8px_rgba(52,211,153,0.45)]'
                        : 'text-white font-bold'
                    }`}
                    title={
                      currentStep
                        ? `Krok ${currentStep.stepIndex}: ${chordLabel} (${romanLabel})${isCorrect ? ' (Zaliczony! ✓)' : ''}`
                        : degToken
                    }
                  >
                    {displayLabel}
                  </span>
                </React.Fragment>
              );
            })}
          </div>
        );
      });
    }

    // 2. Standard progression list: either from loadedKeyInfo.degrees ("I – vi – IV – V") or steps directly
    const rawTokens = loadedKeyInfo?.degrees
      ? loadedKeyInfo.degrees.split(/[-–—]/).map((d) => d.trim()).filter(Boolean)
      : null;

    const useLoadedTokens = rawTokens && rawTokens.length === steps.length;

    return steps.map((step, idx) => {
      const isCorrect = isStepCorrect(step);
      const romanLabel = useLoadedTokens
        ? rawTokens[idx]
        : (step.baseChord.functionDegree ? formatDegreeLabel(step.baseChord.functionDegree) : '') ||
          `Krok ${step.stepIndex}`;

      const chordLabel = convention === 'polish' ? step.baseChord.polishSymbol : step.baseChord.symbol;
      const displayLabel = progressionNotation === 'chords' ? chordLabel : romanLabel;

      return (
        <React.Fragment key={`prog_item_${step.stepIndex}`}>
          {idx > 0 && <span className="text-slate-600 font-normal select-none">–</span>}
          <span
            className={`transition-colors duration-200 select-none ${
              isCorrect
                ? 'text-emerald-400 font-black drop-shadow-[0_0_8px_rgba(52,211,153,0.45)]'
                : 'text-white font-bold'
            }`}
            title={`Krok ${step.stepIndex}: ${chordLabel} (${romanLabel})${isCorrect ? ' (Zaliczony! ✓)' : ''}`}
          >
            {displayLabel}
          </span>
        </React.Fragment>
      );
    });
  };

  return (
    <div className="w-full max-w-md sm:max-w-lg mx-auto space-y-3.5">
      {/* Top Header Controls Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-2 pt-1 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-400"></span>
          <h2 className="text-sm font-bold text-slate-200">
            Harmonix · Plansza Progresji
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* User Request: Prominent, highly accessible button to hide chord choices */}
          <button
            type="button"
            onClick={() => {
              setHideChordChoices((prev) => !prev);
              setPeekedStepIndices(new Set());
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md active:scale-95 border ${
              hideChordChoices
                ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-400/50 shadow-amber-400/20 font-black'
                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700 hover:border-slate-600'
            }`}
            title="Przełącz widoczność podpowiedzi (quiz ze słuchu na klawiaturze)"
          >
            {hideChordChoices ? (
              <>
                <EyeOff className="w-4 h-4 stroke-[2.5]" />
                <span>Bez podpowiedzi (Wł.)</span>
              </>
            ) : (
              <>
                <EyeOff className="w-4 h-4 text-amber-400 stroke-[2.5]" />
                <span>Schowaj podpowiedzi</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handlePlayEntireProgression}
            disabled={isPlayingAll}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md ${
              isPlayingAll
                ? 'bg-amber-400 text-slate-950'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 active:scale-95'
            }`}
          >
            {isPlayingAll ? (
              <>
                <Square className="w-3 h-3 fill-current animate-pulse" />
                <span>Odtwarzanie...</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span>Odtwórz całość ({steps.filter((s) => s.selectedChoice).length})</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenTheory}
            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Teoria Muzyki"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progression Length & Quick Presets Selector Bar */}
      <div className="p-2.5 rounded-2xl bg-[#090d16] border border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            Długość progresji: <strong className="text-amber-400">{steps.length} {steps.length === 4 ? 'akordy' : 'akordów'}</strong>
          </span>
          <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <Link className="w-3 h-3 stroke-[2.5]" />
            Klawiatury w 100% zsynchronizowane
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin scrollbar-thumb-slate-800">
          <button
            type="button"
            onClick={() => handleApplyPreset('4_screen')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-xl cursor-pointer transition-all shrink-0 ${
              steps.length === 4
                ? 'bg-amber-400 text-slate-950 shadow-md scale-105'
                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300'
            }`}
          >
            4 Akordy (Klasyk)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('6_ballad')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-xl cursor-pointer transition-all shrink-0 ${
              steps.length === 6
                ? 'bg-amber-400 text-slate-950 shadow-md scale-105'
                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300'
            }`}
          >
            6 Akordów (Ballada)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('8_pachelbel')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-xl cursor-pointer transition-all shrink-0 ${
              steps.length === 8
                ? 'bg-amber-400 text-slate-950 shadow-md scale-105'
                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300'
            }`}
          >
            8 Akordów (Pachelbel)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('8_jazz')}
            className="px-2.5 py-1 text-[11px] font-bold rounded-xl cursor-pointer transition-all shrink-0 bg-slate-800/90 hover:bg-slate-700 text-slate-300"
          >
            8 Akordów (Jazz Kadencja)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('12_blues')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-xl cursor-pointer transition-all shrink-0 ${
              steps.length === 12
                ? 'bg-amber-400 text-slate-950 shadow-md scale-105'
                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300'
            }`}
          >
            12 Akordów (Blues)
          </button>

          {/* User Request: Generator w locie z rozbudowanymi akordami (6, sus, aug, dim, add9) */}
          <button
            type="button"
            onClick={handleQuickGenerateExtended}
            className="px-2.5 py-1 text-[11px] font-black rounded-xl cursor-pointer transition-all shrink-0 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 flex items-center gap-1.5 shadow-md active:scale-95"
            title="Wygeneruj w locie nową progresję z rozbudowanymi akordami (sus2, sus4, 6, m6, aug, dim, add9)"
          >
            <Wand2 className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Generator w locie</span>
          </button>

          <button
            type="button"
            onClick={handleAddStep}
            className="px-2.5 py-1 text-[11px] font-bold rounded-xl cursor-pointer transition-all shrink-0 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 active:scale-95"
            title="Dodaj kolejny krok do progresji"
          >
            <Plus className="w-3 h-3 stroke-[3]" />
            <span>+ Dodaj krok</span>
          </button>

          <div className="h-4 w-px bg-slate-800 shrink-0 mx-0.5" />

          {/* User Request 8: Shuffle all choices order and random colors */}
          <button
            type="button"
            onClick={handleShuffleAllChoices}
            className="px-2.5 py-1 text-[11px] font-bold rounded-xl cursor-pointer transition-all shrink-0 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 flex items-center gap-1 active:scale-95"
            title="Przetasuj losowo układ i kolory wszystkich przycisków akordów"
          >
            <Shuffle className="w-3 h-3" />
            <span>Losowa kolejność</span>
          </button>

          {/* User Request 1: Hide chord choice rows to leave only keyboards */}
          <button
            type="button"
            onClick={() => {
              setHideChordChoices((prev) => !prev);
              setPeekedStepIndices(new Set());
            }}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-xl cursor-pointer transition-all shrink-0 flex items-center gap-1.5 shadow-sm active:scale-95 ${
              hideChordChoices
                ? 'bg-amber-400 text-slate-950 font-black ring-2 ring-amber-300 shadow-amber-400/20'
                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
            }`}
            title={
              hideChordChoices
                ? 'Pokaż wiersze z akordami (podpowiedzi)'
                : 'Schowaj wiersze z akordami – zostaw tylko klawiatury do wyboru ze słuchu bez podpowiedzi'
            }
          >
            {hideChordChoices ? (
              <>
                <Eye className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Pokaż podpowiedzi</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Schowaj podpowiedzi (Tylko klawiatury)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleResetAllChoices}
            className="px-2.5 py-1 text-[11px] font-bold rounded-xl cursor-pointer transition-all shrink-0 bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700/60 flex items-center gap-1 active:scale-95"
            title="Rozpocznij test od zera (wyczyść wybrane akordy)"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Nowy test</span>
          </button>
        </div>
      </div>

      {/* Prominent Learning Mode Switcher Bar - Very accessible & visible */}
      <div className="p-3 rounded-2xl bg-gradient-to-r from-slate-900 via-[#0d1424] to-slate-900 border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
              hideChordChoices
                ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 shadow-amber-400/20'
                : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
            }`}
          >
            {hideChordChoices ? (
              <EyeOff className="w-5 h-5 stroke-[2.5]" />
            ) : (
              <Eye className="w-5 h-5 stroke-[2.5]" />
            )}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <span>Tryb quizu:</span>
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider ${
                  hideChordChoices
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'bg-slate-800 text-slate-200 border border-slate-700'
                }`}
              >
                {hideChordChoices ? 'Tylko klawiatury (Bez podpowiedzi)' : 'Kafelki z akordami (Podpowiedzi)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {hideChordChoices
                ? 'Wiersze z nazwami akordów są ukryte. Zagraj kolejny akord na klawiaturze – system natychmiast go oceni i zaliczy!'
                : 'Wybierz akord klikając kolorowy kafelek LUB grając go na klawiaturze (oba sposoby są zaliczane).'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setHideChordChoices(false);
              setPeekedStepIndices(new Set());
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 ${
              !hideChordChoices
                ? 'bg-sky-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Z podpowiedziami</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setHideChordChoices(true);
              setPeekedStepIndices(new Set());
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5 ${
              hideChordChoices
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'text-amber-400/90 hover:text-amber-300'
            }`}
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>Bez podpowiedzi</span>
          </button>
        </div>
      </div>

      {/* Prominent Active Tonality & Progression Banner - exactly 2 clean rows */}
      <div
        id="workshop-tonality-progression-bar"
        data-tonality-bar="true"
        style={{
          position: isTonalityBarPinned ? 'sticky' : undefined,
          top: isTonalityBarPinned ? 0 : undefined,
          zIndex: isTonalityBarPinned ? 35 : undefined,
          scrollMarginTop: '0px',
        }}
        className={`flex flex-col gap-1.5 px-3.5 py-2.5 rounded-2xl transition-all duration-200 ${
          isTonalityBarPinned
            ? 'shadow-2xl bg-slate-950/98 backdrop-blur-md border-2 border-amber-400 ring-2 ring-amber-400/40'
            : 'bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 border border-amber-500/35 shadow-lg'
        }`}
      >
        {/* ROW 1: All action buttons in ONE single clean row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-md ring-2 ring-amber-400/30 shrink-0">
            <Compass className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Tonacja: {loadedKeyInfo?.keyName || (convention === 'polish' ? 'C-dur' : 'C')}</span>
          </div>

          {/* User Request 2: Button 'przypnij / odepnij' directly next to the tonality label */}
          <button
            type="button"
            onClick={handleTogglePinTonalityBar}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0 ${
              isTonalityBarPinned
                ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 shadow-amber-400/25 font-black'
                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/80'
            }`}
            title={isTonalityBarPinned ? 'Odepnij belkę tonacji (drugie naciśnięcie odpina)' : 'Przypnij belkę tonacji pod kartami nawigacji podczas scrollowania'}
          >
            {isTonalityBarPinned ? (
              <>
                <PinOff className="w-3.5 h-3.5" />
                <span>Odepnij</span>
              </>
            ) : (
              <>
                <Pin className="w-3.5 h-3.5 text-amber-400" />
                <span>Przypnij</span>
              </>
            )}
          </button>

          {/* User Request: Button to toggle Roman numerals to concrete chords and back */}
          <button
            type="button"
            onClick={handleToggleProgressionNotation}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0 ${
              progressionNotation === 'chords'
                ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 shadow-amber-400/25 font-black'
                : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/80'
            }`}
            title={
              progressionNotation === 'roman'
                ? 'Zamień zapis rzymski na konkretne akordy w tej tonacji'
                : 'Przywróć zapis rzymski progresji (I, IV, V...)'
            }
          >
            <ArrowLeftRight className={`w-3.5 h-3.5 ${progressionNotation === 'chords' ? 'text-slate-950' : 'text-amber-400'}`} />
            <span>
              {progressionNotation === 'roman' ? 'Pokaż akordy' : 'Pokaż rzymskie'}
            </span>
          </button>

          {/* Quick Randomize / Transpose Tonality button in workshop */}
          <button
            type="button"
            onClick={handleRandomizeWorkshopKey}
            className="px-2.5 py-1 text-[11px] font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0 bg-amber-400/20 hover:bg-amber-400 text-amber-300 hover:text-slate-950 border border-amber-400/40"
            title="Wylosuj nową tonację dla tego ćwiczenia – wszystkie akordy automatycznie się dostosują!"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Losuj tonację</span>
          </button>

          {/* User Request 3: Przycisk Reset w jednym rzędzie z pozostałymi przyciskami */}
          {loadedProgression && onClearLoadedProgression && (
            <button
              type="button"
              onClick={onClearLoadedProgression}
              className="px-2.5 py-1 text-[11px] font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95 shrink-0 text-slate-300 hover:text-rose-200 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30"
              title="Przywróć domyślne 4 akordy"
            >
              <RotateCcw className="w-3 h-3 text-rose-400" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* ROW 2: Complete Progression Display with individual chord highlight */}
        <div className="flex items-start gap-1.5 text-xs min-w-0">
          <span className="text-slate-400 text-[11px] shrink-0 font-semibold pt-0.5">
            {progressionNotation === 'chords' ? 'Akordy:' : 'Progresja:'}
          </span>
          <div className="font-mono bg-slate-950 px-2.5 py-1 rounded-lg border border-amber-500/35 text-[11px] sm:text-xs shadow-sm break-words whitespace-normal leading-relaxed w-full flex flex-wrap items-center gap-x-1.5 gap-y-1">
            {renderProgressionDegreeList()}
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* THE EXACT STACKED SCREENSHOT LAYOUT                      */}
      {/* 4 RECTANGLES -> PIANO KEYBOARD -> REPEAT                 */}
      {/* ======================================================== */}
      <div className={hideChordChoices ? 'space-y-2 sm:space-y-2.5' : 'space-y-4'}>
        {steps.map((step) => {
          const isActivePlayback = activePlaybackStep === step.stepIndex;
          const displayChoices = step.expandedChoices
            ? [...step.choices, ...getExtendedChoices(step.choices)]
            : step.choices;
          const isStepChoicesVisible = !hideChordChoices || peekedStepIndices.has(step.stepIndex);

          return (
            <div
              key={`screenshot_step_${step.stepIndex}`}
              className={`rounded-2xl transition-all duration-300 ${
                !isStepChoicesVisible ? 'p-1.5 sm:p-2' : 'p-2 sm:p-2.5'
              } ${
                isActivePlayback
                  ? 'bg-amber-500/10 ring-2 ring-amber-400/50 shadow-xl'
                  : 'bg-[#0f1422]/90 border border-slate-800/90 shadow-xl'
              }`}
            >
              {/* Step Header with index, delete and options toggle */}
              <div className="flex items-center justify-between px-1 mb-1 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 font-black text-[11px] flex items-center justify-center border border-slate-700 shadow-sm">
                    {step.stepIndex}
                  </span>
                  <span className="font-bold text-slate-200">
                    Krok {step.stepIndex}
                  </span>
                  {isStepChoicesVisible && step.selectedChoice && (
                    <span className="text-[11px] text-amber-400 font-semibold truncate max-w-[130px] sm:max-w-[180px]">
                      · {convention === 'international' ? step.selectedChoice.chord.symbol : step.selectedChoice.chord.polishSymbol}
                    </span>
                  )}
                  {!isStepChoicesVisible && (
                    <span className="text-[10px] text-amber-400/80 font-medium italic">
                      · (bez podpowiedzi)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {/* Single step peek toggle when hideChordChoices is active */}
                  {hideChordChoices && (
                    <button
                      type="button"
                      onClick={() => handleToggleStepPeek(step.stepIndex)}
                      className={`px-1.5 py-0.5 text-[10px] font-semibold rounded transition-colors cursor-pointer flex items-center gap-1 ${
                        peekedStepIndices.has(step.stepIndex)
                          ? 'bg-amber-400 text-slate-950 font-bold'
                          : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
                      }`}
                      title="Odkryj lub ukryj podpowiedzi dla tego jednego kroku"
                    >
                      {peekedStepIndices.has(step.stepIndex) ? (
                        <>
                          <EyeOff className="w-3 h-3" />
                          <span>Ukryj</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3" />
                          <span>Odkryj opcje</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Shuffle step buttons */}
                  {isStepChoicesVisible && (
                    <button
                      type="button"
                      onClick={() => handleShuffleStepChoices(step.stepIndex)}
                      className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 rounded transition-colors cursor-pointer flex items-center gap-1"
                      title="Przetasuj losowo układ i barwy przycisków w tym kroku"
                    >
                      <Shuffle className="w-3 h-3" />
                      <span className="hidden sm:inline">Tasuj</span>
                    </button>
                  )}

                  {isStepChoicesVisible && (
                    <button
                      type="button"
                      onClick={() => handleToggleExpandedChoices(step.stepIndex)}
                      className="px-2 py-0.5 text-[10px] font-semibold text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 rounded transition-colors cursor-pointer flex items-center gap-1"
                      title="Pokaż więcej alternatywnych akordów dla tego kroku"
                    >
                      {step.expandedChoices ? (
                        <>
                          <ChevronUp className="w-3 h-3" />
                          <span>Mniej opcji</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3" />
                          <span>+4 Alternatywy</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Reset/Clear this step (keys and selected choice) */}
                  {(step.selectedChoice || step.selectedMidis.length > 0) && (
                    <button
                      type="button"
                      onClick={() => handleResetSingleStep(step.stepIndex)}
                      className="px-1.5 py-0.5 text-[10px] font-semibold text-rose-300 hover:text-rose-100 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 rounded transition-colors cursor-pointer flex items-center gap-1 active:scale-95"
                      title="Wyczyść ten krok (klawisze i wybór akordu)"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>Wyczyść</span>
                    </button>
                  )}

                  {steps.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveStep(step.stepIndex)}
                      className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                      title="Usuń ten krok z progresji"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* ROW 1 of Pair: Chord Choices (visible or hidden with keyboard feedback) */}
              {isStepChoicesVisible ? (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-2.5">
                  {displayChoices.map((choice, colIdx) => {
                    const theme =
                      step.choiceThemeMap?.[choice.id] ||
                      DIVERSE_COLOR_THEMES[colIdx % DIVERSE_COLOR_THEMES.length];
                    const isSelected = step.selectedChoice?.id === choice.id;

                    return (
                      <div
                        key={`card_${step.stepIndex}_${choice.id}`}
                        onMouseDown={(e) => handleCardPressStart(step.stepIndex, choice, e)}
                        onMouseMove={handleCardPressMove}
                        onMouseUp={(e) => handleCardPressEnd(step.stepIndex, choice, e)}
                        onMouseLeave={handleCardPressCancel}
                        onTouchStart={(e) => handleCardPressStart(step.stepIndex, choice, e)}
                        onTouchMove={handleCardPressMove}
                        onTouchEnd={(e) => handleCardPressEnd(step.stepIndex, choice, e)}
                        onTouchCancel={handleCardPressCancel}
                        className={`relative flex flex-col items-center justify-center h-14 sm:h-16 rounded-2xl cursor-pointer select-none transition-all duration-150 active:scale-95 border-2 shadow-md ${theme.bg} ${theme.hover} ${theme.border} ${
                          isSelected
                            ? `ring-4 ring-white shadow-2xl scale-[1.03] z-10 brightness-105`
                            : 'opacity-95 hover:opacity-100'
                        }`}
                      >
                        {/* Discrete Info Button in top corner for desktop users */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectingChordChoice({ choice, stepIndex: step.stepIndex });
                          }}
                          title="Przytrzymaj lub kliknij, aby zobaczyć opis akordu"
                          className="absolute top-1 right-1 p-0.5 text-slate-900/40 hover:text-slate-950 rounded transition-colors cursor-pointer"
                        >
                          <Info className="w-3 h-3" />
                        </button>

                        {/* Chord Symbol Big & Bold */}
                        <span className="font-black text-lg sm:text-xl md:text-2xl text-slate-950 tracking-tight leading-none pointer-events-none">
                          {convention === 'international' ? choice.chord.symbol : choice.chord.polishSymbol}
                        </span>

                        {/* Small subtle degree / subtitle */}
                        <span className="text-[9px] font-bold text-slate-900/70 tracking-tight uppercase mt-0.5 pointer-events-none truncate max-w-full px-1">
                          {choice.chord.quality === 'major'
                            ? 'dur'
                            : choice.chord.quality === 'minor'
                            ? 'moll'
                            : choice.chord.quality === 'major6'
                            ? '6'
                            : choice.chord.quality === 'minor6'
                            ? 'm6'
                            : choice.chord.quality === 'diminished'
                            ? 'dim'
                            : choice.chord.quality === 'dim7'
                            ? 'dim7'
                            : choice.chord.quality === 'm7b5'
                            ? 'm7b5'
                            : choice.chord.quality === 'augmented'
                            ? 'aug'
                            : choice.chord.quality === 'dom7'
                            ? '7'
                            : choice.chord.quality === 'maj7'
                            ? 'maj7'
                            : choice.chord.quality === 'min7'
                            ? 'm7'
                            : choice.chord.quality === 'sus2'
                            ? 'sus2'
                            : choice.chord.quality === 'sus4'
                            ? 'sus4'
                            : choice.chord.quality === 'dom7sus4'
                            ? '7sus4'
                            : choice.chord.quality === 'add9'
                            ? 'add9'
                            : choice.chord.quality}
                        </span>

                        {/* Selected Indicator Checkmark */}
                        {isSelected && (
                          <span className="absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full bg-slate-950 text-white flex items-center justify-center shadow">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {/* Test Result Verdict Strip - ONLY shown when chord choices are visible, suppressed in hidden mode to prevent keyboard jumping */}
              {isStepChoicesVisible && step.selectedChoice && (
                <div className="mt-2 px-2.5 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2 flex-wrap">
                    {step.selectedChoice.fitTier === 'perfect' && (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" />
                        ★ 100% Znakomicie!
                      </span>
                    )}
                    {step.selectedChoice.fitTier === 'good' && (
                      <span className="text-sky-400 font-bold flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        ★ Dobry wybór ({step.selectedChoice.fitScore}%)
                      </span>
                    )}
                    {step.selectedChoice.fitTier === 'weak' && (
                      <span className="text-amber-400 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Słabszy wybór ({step.selectedChoice.fitScore}%)
                      </span>
                    )}
                    <span className="text-slate-200 font-bold truncate">
                      {convention === 'international' ? step.selectedChoice.chord.symbol : step.selectedChoice.chord.polishSymbol}
                    </span>
                    <span className="text-slate-400 text-[11px] hidden sm:inline truncate max-w-[200px]">
                      · {step.selectedChoice.moodLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        const midisToPlay =
                          step.selectedMidis.length > 0
                            ? step.selectedMidis
                            : step.selectedChoice!.chord.defaultNotes.map((n) => n.midi);
                        sound.playChord(midisToPlay, 2.2, 0, 0.95);
                      }}
                      className="px-2 py-0.5 text-[10px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer flex items-center gap-1"
                      title="Odsłuchaj ten akord"
                    >
                      <Volume2 className="w-3 h-3 text-amber-400" />
                      <span>Zagraj</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleHint(step.stepIndex)}
                      className="px-2 py-0.5 text-[10px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
                    >
                      {step.showHint ? 'Ukryj podpowiedź' : 'Podpowiedź klawiszy'}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setInspectingChordChoice({
                          choice: step.selectedChoice!,
                          stepIndex: step.stepIndex,
                        })
                      }
                      className="px-2 py-0.5 text-[10px] font-semibold text-amber-400 hover:text-amber-300 bg-amber-400/10 rounded transition-colors cursor-pointer"
                    >
                      Opis i teoria
                    </button>
                  </div>
                </div>
              )}

              {/* ROW 2 of Pair: The Matching Piano Keyboard Strip with synchronized scrolling */}
              <div
                className={isStepChoicesVisible ? 'mt-2' : 'mt-0.5'}
                id={step.stepIndex === 1 ? 'first-piano-keyboard-container' : `step_${step.stepIndex}_piano_container`}
                data-step-index={step.stepIndex}
                data-first-piano={step.stepIndex === 1 ? 'true' : undefined}
              >
                <PianoKeyboard
                  idPrefix={`step_${step.stepIndex}_piano`}
                  startMidi={48}
                  keyCount={37}
                  selectedMidiNotes={step.selectedMidis}
                  highlightMap={step.highlightMap}
                  interactive={true}
                  selectionMode="toggle"
                  onNoteToggle={(midi) => handleNoteToggleOnStep(step.stepIndex, midi)}
                  convention={convention}
                  showLabels={false}
                  registerContainerRef={registerKeyboardRef}
                  onSyncScroll={handleSyncScroll}
                  onSyncScrollBy={handleSyncScrollBy}
                  onSyncCenter={handleSyncCenter}
                  playedChordInfo={
                    step.selectedChoice
                      ? {
                          chordName:
                            convention === 'international'
                              ? step.selectedChoice.chord.symbol
                              : step.selectedChoice.chord.polishSymbol,
                          fitScore: step.selectedChoice.fitScore,
                          fitTier: step.selectedChoice.fitTier,
                        }
                      : null
                  }
                />
              </div>

            </div>
          );
        })}
      </div>

      {/* Dynamic step addition button */}
      <div className="pt-2 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleAddStep}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-sky-500/20 to-purple-500/20 hover:from-amber-500/30 hover:via-sky-500/30 hover:to-purple-500/30 border-2 border-dashed border-slate-700 hover:border-amber-400 text-slate-200 hover:text-white font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-[0.99]"
        >
          <Plus className="w-5 h-5 text-amber-400 stroke-[3]" />
          <span>+ Dodaj kolejny akord (Krok {steps.length + 1})</span>
        </button>

        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-2">
          <span>🔗 Klawiatury są zsynchronizowane – klawisz C zawsze znajduje się dokładnie pod pozostałymi klawiszami C</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* DETAILED CHORD DESCRIPTION MODAL (Opened on Hold or Info) */}
      {/* ======================================================== */}
      {inspectingChordChoice && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setInspectingChordChoice(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-sm sm:max-w-md w-full p-5 shadow-2xl space-y-3.5 animate-in zoom-in-95 duration-150 text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  <span>Opis Akordu</span>
                </div>
                <div className="text-2xl font-black text-white flex items-baseline gap-2 mt-0.5">
                  <span>{inspectingChordChoice.choice.chord.symbol}</span>
                  <span className="text-sm font-semibold text-slate-400">
                    ({inspectingChordChoice.choice.chord.polishSymbol})
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    {inspectingChordChoice.choice.degreeName}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectingChordChoice(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Test Fitness Badge */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">
                  Dopasowanie do progresji
                </div>
                <div className="text-sm font-bold mt-0.5 flex items-center gap-1.5">
                  {inspectingChordChoice.choice.fitTier === 'perfect' && (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      Znakomite (100%)
                    </span>
                  )}
                  {inspectingChordChoice.choice.fitTier === 'good' && (
                    <span className="text-sky-400 flex items-center gap-1">
                      <Sparkles className="w-4 h-4" />
                      Dobre ({inspectingChordChoice.choice.fitScore}%)
                    </span>
                  )}
                  {inspectingChordChoice.choice.fitTier === 'weak' && (
                    <span className="text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      Słabsze / Dystans ({inspectingChordChoice.choice.fitScore}%)
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  sound.playChord(
                    inspectingChordChoice.choice.chord.defaultNotes.map((n) => n.midi),
                    2.4,
                    0,
                    0.95
                  )
                }
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 rounded-xl cursor-pointer transition-all active:scale-95"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Odsłuchaj</span>
              </button>
            </div>

            {/* Explanation & Mood */}
            <div className="space-y-2 text-xs leading-relaxed text-slate-300">
              <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-750">
                <div className="text-[10px] uppercase font-bold text-amber-400/90 mb-0.5">
                  Klimat & Rola Muzyczna
                </div>
                <p className="font-medium text-slate-200">
                  {inspectingChordChoice.choice.moodLabel}
                </p>
                <p className="mt-1 text-slate-300">
                  {inspectingChordChoice.choice.explanation}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-750">
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">
                  Dlaczego to działa
                </div>
                <p className="text-slate-300">
                  {inspectingChordChoice.choice.whyItWorks}
                </p>
              </div>
            </div>

            {/* Chord notes breakdown */}
            <div className="text-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Dźwięki składowe akordu:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {inspectingChordChoice.choice.chord.defaultNotes.map((n, idx) => (
                  <span
                    key={`modal_note_${idx}_${n.midi}`}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 font-mono font-bold text-slate-200 text-xs shadow-sm"
                  >
                    {n.note} ({idx === 0 ? 'Pryma' : idx === 1 ? 'Tercja' : idx === 2 ? 'Kwinta' : idx === 3 ? 'Septyma' : 'Rozszerzenie'})
                  </span>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setInspectingChordChoice(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
              >
                Zamknij
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSelectChoice(
                    inspectingChordChoice.stepIndex,
                    inspectingChordChoice.choice
                  );
                  setInspectingChordChoice(null);
                }}
                className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all cursor-pointer shadow-md active:scale-95"
              >
                Wybierz ten akord w teście
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
