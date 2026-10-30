import {
  NoteName,
  PolishNoteName,
  ChordDefinition,
  ChordQuality,
  QuizChoice,
  FamousProgression,
  NamingConvention,
} from '../types/music';

export const NOTE_NAMES: NoteName[] = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
];

export const POLISH_NOTE_NAMES: PolishNoteName[] = [
  'C',
  'Cis',
  'D',
  'Dis',
  'E',
  'F',
  'Fis',
  'G',
  'Gis',
  'A',
  'B',
  'H',
];

// Map NoteName to Polish label
export function getNoteLabel(note: NoteName, convention: NamingConvention = 'polish'): string {
  if (convention === 'international') {
    return note;
  }
  const idx = NOTE_NAMES.indexOf(note);
  return POLISH_NOTE_NAMES[idx] || note;
}

export function getFullNoteLabel(note: NoteName, convention: NamingConvention = 'polish'): string {
  if (convention === 'international') {
    return note;
  }
  const idx = NOTE_NAMES.indexOf(note);
  const pl = POLISH_NOTE_NAMES[idx];
  if (note === 'B') return 'H (B)';
  if (note === 'A#') return 'B / Ais';
  return pl;
}

// Semitone intervals
export const CHORD_INTERVALS: Record<ChordQuality, number[]> = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  dom7: [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  min7: [0, 3, 7, 10],
  major6: [0, 4, 7, 9],
  minor6: [0, 3, 7, 9],
  diminished: [0, 3, 6],
  dim7: [0, 3, 6, 9],
  m7b5: [0, 3, 6, 10],
  augmented: [0, 4, 8],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  dom7sus4: [0, 5, 7, 10],
  add9: [0, 2, 4, 7],
};

export const CHORD_QUALITY_NAMES: Record<
  ChordQuality,
  { pl: string; intl: string; desc: string; category: string }
> = {
  major: { pl: 'dur', intl: 'maj', desc: 'Jasny, stabilny, radosny', category: 'Trójdźwięki' },
  minor: { pl: 'moll', intl: 'm', desc: 'Melancholijny, intymny, głęboki', category: 'Trójdźwięki' },
  dom7: { pl: '7 (dominantowy)', intl: '7', desc: 'Napięty, bluesowy, z mocnym dążeniem', category: 'Septymowe' },
  maj7: { pl: 'maj7 (wielka 7)', intl: 'maj7', desc: 'Aksamitny, marzycielski, jazz & neo-soul', category: 'Septymowe' },
  min7: { pl: 'm7 (mała 7)', intl: 'm7', desc: 'Ciepły, soulowy, klimatyczny lo-fi', category: 'Septymowe' },
  major6: { pl: '6 (szóstka durowa)', intl: '6', desc: 'Słodki, retro, ciepły swing', category: 'Szóstki & Nony' },
  minor6: { pl: 'm6 (szóstka molowa)', intl: 'm6', desc: 'Film noir, szpiegowski, motyw Bonda', category: 'Szóstki & Nony' },
  diminished: { pl: 'dim (zmniejszony)', intl: 'dim', desc: 'Tajemniczy, niepokojący, suspens', category: 'Napięciowe' },
  dim7: { pl: 'dim7 (zmniejszony 7)', intl: 'dim7', desc: 'Maksymalny niepokój, dreszcz grozy', category: 'Napięciowe' },
  m7b5: { pl: 'm7b5 (półzmniejszony)', intl: 'm7b5', desc: 'Jazzowy drugi stopień molowy', category: 'Septymowe' },
  augmented: { pl: 'aug (zwiększony)', intl: 'aug', desc: 'Nierzeczywisty, kosmiczny, unoszący się', category: 'Napięciowe' },
  sus2: { pl: 'sus2 (zawieszona 2)', intl: 'sus2', desc: 'Czysty, otwarty, eteryczny worship/pop', category: 'Zawieszone' },
  sus4: { pl: 'sus4 (zawieszona 4)', intl: 'sus4', desc: 'Wzniosły, hymn, napięcie przed rozwiązaniem', category: 'Zawieszone' },
  dom7sus4: { pl: '7sus4', intl: '7sus4', desc: 'Współczesny popowy dominanta', category: 'Zawieszone' },
  add9: { pl: 'add9 (dodana nona)', intl: 'add9', desc: 'Świeży, słoneczny hymn Coldplay', category: 'Szóstki & Nony' },
};

export const QUALITY_CATEGORIES = [
  {
    name: 'Podstawowe trójdźwięki',
    qualities: ['major', 'minor'] as ChordQuality[],
  },
  {
    name: 'Akordy septymowe (Jazz & Soul)',
    qualities: ['dom7', 'maj7', 'min7', 'm7b5'] as ChordQuality[],
  },
  {
    name: 'Zawieszone (Modern Pop & Worship)',
    qualities: ['sus2', 'sus4', 'dom7sus4'] as ChordQuality[],
  },
  {
    name: 'Szóstki & Nony (Retro & Kolor)',
    qualities: ['major6', 'minor6', 'add9'] as ChordQuality[],
  },
  {
    name: 'Napięciowe & Filmowe',
    qualities: ['diminished', 'dim7', 'augmented'] as ChordQuality[],
  },
];

/**
 * Generate MIDI notes for a chord in a comfortable piano octave (octave 3/4)
 */
export function createChordDefinition(
  root: NoteName,
  quality: ChordQuality,
  functionDegree?: string,
  emotionalRole?: string
): ChordDefinition {
  const rootIndex = NOTE_NAMES.indexOf(root);
  const intervals = CHORD_INTERVALS[quality];
  // Place C, D, E in octave 4 (Middle C) and F, G, A, B in octave 3
  // This keeps all chords closely voiced between MIDI 53 and 71 for smooth, singing harmony
  const baseOctave = rootIndex <= 4 ? 4 : 3;

  const defaultNotes = intervals.map((interval) => {
    const semitonesFromC0 = (baseOctave + 1) * 12 + rootIndex + interval;
    const noteIdx = (rootIndex + interval) % 12;
    const noteName = NOTE_NAMES[noteIdx];
    const octave = Math.floor(semitonesFromC0 / 12) - 1;
    return {
      note: noteName,
      octave,
      midi: semitonesFromC0,
    };
  });

  let symbol: string = root;
  if (quality === 'minor') symbol = `${root}m`;
  else if (quality === 'dom7') symbol = `${root}7`;
  else if (quality === 'maj7') symbol = `${root}maj7`;
  else if (quality === 'min7') symbol = `${root}m7`;
  else if (quality === 'major6') symbol = `${root}6`;
  else if (quality === 'minor6') symbol = `${root}m6`;
  else if (quality === 'diminished') symbol = `${root}dim`;
  else if (quality === 'dim7') symbol = `${root}dim7`;
  else if (quality === 'm7b5') symbol = `${root}m7b5`;
  else if (quality === 'augmented') symbol = `${root}aug`;
  else if (quality === 'sus2') symbol = `${root}sus2`;
  else if (quality === 'sus4') symbol = `${root}sus4`;
  else if (quality === 'dom7sus4') symbol = `${root}7sus4`;
  else if (quality === 'add9') symbol = `${root}add9`;

  const plRoot = getNoteLabel(root, 'polish');
  let polishSymbol = `${plRoot}-dur`;
  if (quality === 'minor') polishSymbol = `${plRoot}-moll`;
  else if (quality === 'dom7') polishSymbol = `${plRoot}7`;
  else if (quality === 'maj7') polishSymbol = `${plRoot}maj7`;
  else if (quality === 'min7') polishSymbol = `${plRoot}m7`;
  else if (quality === 'major6') polishSymbol = `${plRoot}6`;
  else if (quality === 'minor6') polishSymbol = `${plRoot}m6`;
  else if (quality === 'diminished') polishSymbol = `${plRoot}dim`;
  else if (quality === 'dim7') polishSymbol = `${plRoot}dim7`;
  else if (quality === 'm7b5') polishSymbol = `${plRoot}m7b5`;
  else if (quality === 'augmented') polishSymbol = `${plRoot}aug`;
  else if (quality === 'sus2') polishSymbol = `${plRoot}sus2`;
  else if (quality === 'sus4') polishSymbol = `${plRoot}sus4`;
  else if (quality === 'dom7sus4') polishSymbol = `${plRoot}7sus4`;
  else if (quality === 'add9') polishSymbol = `${plRoot}add9`;

  return {
    root,
    quality,
    displayQuality: CHORD_QUALITY_NAMES[quality].pl,
    symbol,
    polishSymbol,
    semitones: intervals,
    defaultNotes,
    functionDegree,
    emotionalRole,
  };
}

/**
 * Recreate a chord with a different quality (e.g. C -> Cmaj7 or G -> G7)
 */
export function changeChordQuality(
  chord: ChordDefinition,
  newQuality: ChordQuality
): ChordDefinition {
  return createChordDefinition(
    chord.root,
    newQuality,
    chord.functionDegree,
    chord.emotionalRole
  );
}

/**
 * Popular starter keys and starter chords for exercises
 */
export const STARTER_CHORDS: { root: NoteName; quality: ChordQuality; key: string; mood: string }[] = [
  { root: 'C', quality: 'major', key: 'C-dur', mood: 'Czysty, promienny punkt wyjścia (C-dur)' },
  { root: 'A', quality: 'minor', key: 'A-moll', mood: 'Uczuciowy, balladowy początek (A-moll)' },
  { root: 'F', quality: 'major', key: 'F-dur', mood: 'Ciepły, optymistyczny i przestrzenny (F-dur)' },
  { root: 'G', quality: 'major', key: 'G-dur', mood: 'Dostojny, pełen energii (G-dur)' },
  { root: 'D', quality: 'minor', key: 'D-moll', mood: 'Głęboki, refleksyjny i kinowy (D-moll)' },
  { root: 'E', quality: 'minor', key: 'E-moll', mood: 'Tajemniczy, akustyczny i łagodny (E-moll)' },
];

/**
 * Dynamic music theory logic: suggest next chords based on current chord and progression
 */
export function getSmartNextChordOptions(
  progression: ChordDefinition[],
  keyRoot: NoteName = 'C',
  keyType: 'major' | 'minor' = 'major'
): QuizChoice[] {
  const currentChord = progression[progression.length - 1];
  const stepCount = progression.length;

  // Tonality C-dur reference
  if (keyRoot === 'C' && keyType === 'major') {
    if (currentChord.symbol === 'C' || currentChord.root === 'C') {
      // From C (I):
      return [
        {
          id: 'opt_g',
          chord: createChordDefinition('G', 'major', 'V', 'Dominanta (V) - Napięcie i energia'),
          degreeName: 'V (Dominanta – G-dur)',
          moodLabel: 'Klasyczne uniesienie i moc',
          explanation: 'Dominanta wprowadza energię. Dźwięk H (tercja G) ciągnie magnetycznie w górę do C.',
          whyItWorks: 'Relacja kwintowa I -> V to fundament zachodniej muzyki: od stabilności ku ekscytacji.',
          isRecommended: true,
          fitTier: 'perfect',
          fitScore: 100,
          fitVerdict: 'Znakomicie! Klasyczny, najsilniejszy krok harmoniczny (V)',
        },
        {
          id: 'opt_am',
          chord: createChordDefinition('A', 'minor', 'vi', 'Paralela molowa (vi) - Melancholijny twist'),
          degreeName: 'vi (Paralela molowa – A-moll)',
          moodLabel: 'Słodko-gorzki, emocjonalny pop',
          explanation: 'Akord A-moll dzieli z C-dur aż dwa wspólne dźwięki (C i E). Brzmi intymnie i gładko.',
          whyItWorks: 'Płynne prowadzenie głosów: tylko jeden dźwięk przesuwa się z G na A, reszta zostaje w miejscu!',
          isRecommended: false,
          fitTier: 'perfect',
          fitScore: 95,
          fitVerdict: 'Świetny wybór! Popowy faworyt o gładkim prowadzeniu głosów (vi)',
        },
        {
          id: 'opt_f',
          chord: createChordDefinition('F', 'major', 'IV', 'Subdominanta (IV) - Otwarcie przestrzeni'),
          degreeName: 'IV (Subdominanta – F-dur)',
          moodLabel: 'Jasny oddech i nadzieja',
          explanation: 'Subdominanta oddala nas od domu w stronę ciepłej, rozległej przestrzeni. Typowe dla hymnów i ballad.',
          whyItWorks: 'Ruch o kwartę w górę tworzy uczucie "wzięcia głębokiego oddechu" przed dalszą opowieścią.',
          isRecommended: false,
          fitTier: 'good',
          fitScore: 88,
          fitVerdict: 'Bardzo dobry wybór! Ciepłe otwarcie przestrzeni (IV)',
        },
        {
          id: 'opt_cmaj7',
          chord: createChordDefinition('C', 'maj7', 'Imaj7', 'Aksamitna wielka septyma (Imaj7)'),
          degreeName: 'Imaj7 (Aksamitna tonika – Cmaj7)',
          moodLabel: 'Aksamitny, marzycielski chillout',
          explanation: 'Dodanie wielkiej septymy (dźwięk H) do toniki zamienia prosty dur w luksusowy, marzycielski akord jazzowo-soulowy.',
          whyItWorks: 'Wielka septyma tworzy miękkie, ciepłe tarcie bez burzenia spokoju toniki.',
          isRecommended: false,
          fitTier: 'perfect',
          fitScore: 94,
          fitVerdict: 'Piękny kolor! Aksamitny neo-soul & jazz maj7',
        },
        {
          id: 'opt_csus4',
          chord: createChordDefinition('C', 'sus4', 'Isus4', 'Zawieszenie kwartowe (Isus4)'),
          degreeName: 'Isus4 (Zawieszenie – Csus4)',
          moodLabel: 'Wzniosły pop i hymn',
          explanation: 'Zastąpienie tercji kwartą F tworzy uniesienie i oczekiwanie na powrót do czystego C.',
          whyItWorks: 'Klassyczny zabieg hymnów rockowych (Coldplay, The Who), dający wrażenie unoszenia się w powietrzu.',
          isRecommended: false,
          fitTier: 'good',
          fitScore: 84,
          fitVerdict: 'Świetny wariant! Przestrzenne zawieszenie sus4',
        },
        {
          id: 'opt_c6',
          chord: createChordDefinition('C', 'major6', 'I6', 'Szóstka retro (I6)'),
          degreeName: 'I6 (Szóstka – C6)',
          moodLabel: 'Słodki, ciepły swing lat 60.',
          explanation: 'Dodanie seksty A daje miękki, nostalgiczny posmak znany z ballad The Beatles ("In My Life") i bossa novy.',
          whyItWorks: 'Seksta dodaje łagodnego kołysania bez napięcia septymy.',
          isRecommended: false,
          fitTier: 'good',
          fitScore: 86,
          fitVerdict: 'Czarujący retro klimat! Słodka szóstka C6',
        },
        {
          id: 'opt_caug',
          chord: createChordDefinition('C', 'augmented', 'I+', 'Akord zwiększony (Iaug / C+)'),
          degreeName: 'Iaug (Zwiększony – Caug)',
          moodLabel: 'Kosmiczny, unoszący się niepokój',
          explanation: 'Podwyższenie kwinty G na Gis. Tworzy słynny pochód wznoszący The Beatles i Davida Bowie ("Life on Mars").',
          whyItWorks: 'Dźwięk Gis prowadzi chromatycznie w górę do dźwięku A kolejnego akordu.',
          isRecommended: false,
          fitTier: 'good',
          fitScore: 78,
          fitVerdict: 'Intrygujący, filmowy wybór! Kosmiczne napięcie akordu zwiększonego',
        },
        {
          id: 'opt_csdim7',
          chord: createChordDefinition('C#', 'dim7', '#I°7', 'Zmniejszony łącznik chromatyczny'),
          degreeName: '#I°7 (Zmniejszony – C#dim7)',
          moodLabel: 'Elegancki most chromatyczny',
          explanation: 'Legendarny trik Broadwayu i swingu: bas wędruje chromatycznie C -> C# -> Dm7.',
          whyItWorks: 'Akord zmniejszony łączy tonikę z drugim stopniem płynnym ruchem basu.',
          isRecommended: false,
          fitTier: 'good',
          fitScore: 80,
          fitVerdict: 'Zaawansowany jazzowy łącznik! Płynne przejście basu do Dm',
        },
      ];
    }

    if (currentChord.root === 'G' && currentChord.quality === 'major') {
      // From G (V):
      return [
        {
          id: 'opt_am_after_g',
          chord: createChordDefinition('A', 'minor', 'vi', 'Zwodniczy kadens (vi) - Niespodziewany zwrot'),
          degreeName: 'vi (Zwodniczy kadens – A-moll)',
          moodLabel: 'Słynny popowy "twist" emocjonalny',
          explanation: 'Zamiast oczekiwanego rozwiązania w C, ucho dostaje akord molowy! To serce wielkich hitów.',
          whyItWorks: 'Nazywa się to kadencją zwodniczą (deceptive cadence) – ucho spodziewa się Toniki, a dostaje wzruszający moll.',
          isRecommended: true,
          fitTier: 'perfect',
          fitScore: 100,
          fitVerdict: 'Trafiony w 10! Słynna kadencja zwodnicza popu (vi)',
        },
        {
          id: 'opt_c_after_g',
          chord: createChordDefinition('C', 'major', 'I', 'Tonika (I) - Pełne rozwiązanie i spokój'),
          degreeName: 'I (Tonika – C-dur)',
          moodLabel: 'Powrót do bezpiecznego domu',
          explanation: 'Rozwiązuje całe napięcie nagromadzone przez akord G. Daje poczucie domknięcia i triumfu.',
          whyItWorks: 'Akord V dąży prosto do I. Dźwięk G w basie spada na C, a nuta prowadząca H wznosi się na C.',
          isRecommended: false,
          fitTier: 'perfect',
          fitScore: 98,
          fitVerdict: 'Perfekcyjny powrót do domu! Pełne rozwiązanie napięcia (I)',
        },
        {
          id: 'opt_gsus4',
          chord: createChordDefinition('G', 'sus4', 'Vsus4', 'Zawieszona dominanta (Gsus4)'),
          degreeName: 'Vsus4 (Zawieszenie – Gsus4)',
          moodLabel: 'Monumentalne, stadionowe zawieszenie',
          explanation: 'Zastępuje tercję H kwartą C, przedłużając oczekiwanie na ostateczne uderzenie dominanty.',
          whyItWorks: 'Buduje podwójne napięcie przed rozstrzygnięciem.',
          isRecommended: false,
          fitTier: 'perfect',
          fitScore: 92,
          fitVerdict: 'Świetny wariant! Monumentalne zawieszenie Gsus4',
        },
        {
          id: 'opt_g7',
          chord: createChordDefinition('G', 'dom7', 'V7', 'Dominanta septymowa (G7)'),
          degreeName: 'V7 (Dominanta z septymą – G7)',
          moodLabel: 'Maksymalne napięcie trytonu',
          explanation: 'Dodanie dźwięku F tworzy tryton H-F, który domaga się natychmiastowego rozwiązania w C-E.',
          whyItWorks: 'Klasyczna siła napędowa harmonii funkcyjnej.',
          isRecommended: false,
          fitTier: 'perfect',
          fitScore: 95,
          fitVerdict: 'Klasyczna dominanta! Maksymalne napięcie trytonu',
        },
        {
          id: 'opt_em_after_g',
          chord: createChordDefinition('E', 'minor', 'iii', 'Medianta (iii) - Ciepły, filmowy most'),
          degreeName: 'iii (Medianta – E-moll)',
          moodLabel: 'Łagodny, nostalgiczny zmierzch',
          explanation: 'E-moll łączy się gładko z G-dur (wspólne dźwięki G i H). Tworzy atmosferę zamyślenia.',
          whyItWorks: 'Kolejny stopień molowy w gamie, który rozprasza mocny blask dominanty w pastelowe barwy.',
          isRecommended: false,
          fitTier: 'good',
          fitScore: 78,
          fitVerdict: 'Dobre, łagodne urozmaicenie! Pastelowy most molowy (iii)',
        },
        {
          id: 'opt_bdim_after_g',
          chord: createChordDefinition('B', 'diminished', 'vii°', 'Zastępstwo dominanty (H-dim)'),
          degreeName: 'vii° (Zmniejszony – H-dim)',
          moodLabel: 'Napięty cień dominanty',
          explanation: 'H-dim to trójdźwięk zawierający te same dźwięki co G7 bez prymy G (H, D, F).',
          whyItWorks: 'Prowadzi natychmiast do toniki C-dur.',
          isRecommended: false,
          fitTier: 'good',
          fitScore: 75,
          fitVerdict: 'Ciekawy, niestabilny substytut dominanty (vii°)',
        },
        {
          id: 'opt_gaug',
          chord: createChordDefinition('G', 'augmented', 'V+', 'Dominanta zwiększona (Gaug / G+)'),
          degreeName: 'V+ (Zwiększona dominanta – Gaug)',
          moodLabel: 'Dramatyczne spięcie jazzowe',
          explanation: 'Dźwięk Dis ciągnie półtonem w górę do tercji E akordu C-dur.',
          whyItWorks: 'Zaawansowany alterowany akord dominantowy.',
          isRecommended: false,
          fitTier: 'good',
          fitScore: 80,
          fitVerdict: 'Mocny alterowany wariant! Gaug z mocnym dążeniem do E',
        },
        {
          id: 'opt_f_after_g',
          chord: createChordDefinition('F', 'major', 'IV', 'Ruch wsteczny (IV) - Rockowy blues'),
          degreeName: 'IV (Subdominanta – F-dur)',
          moodLabel: 'Buntowniczy, rockowy krok w dół',
          explanation: 'W klasycznej harmonii unika się V -> IV, ale w muzyce rockowej i bluesie brzmi to surowo i dumnie.',
          whyItWorks: 'Ruch całotonowy basu w dół (G -> F) daje charakterystyczny, nieco szorstki feeling.',
          isRecommended: false,
          fitTier: 'weak',
          fitScore: 55,
          fitVerdict: 'Rockowy krok wsteczny: V ➔ IV z surowym sznytem',
        },
      ];
    }

    if (currentChord.root === 'A' && currentChord.quality === 'minor') {
      // From Am (vi):
      return [
        {
          id: 'opt_f_after_am',
          chord: createChordDefinition('F', 'major', 'IV', 'Subdominanta (IV) - Skrzydła i uniesienie'),
          degreeName: 'IV (Subdominanta – F-dur)',
          moodLabel: 'Epickie, kinowe otwarcie',
          explanation: 'Po melancholii A-moll, F-dur rozpościera skrzydła. Wspólne nuty A i C sprawiają, że przejście płynie gładko.',
          whyItWorks: 'Połączenie Am -> F to prawdopodobnie najbardziej wzruszający moment we współczesnej muzyce filmowej i pop.',
          isRecommended: true,
          fitTier: 'perfect',
          fitScore: 100,
          fitVerdict: 'Wybitne połączenie! Najbardziej wzruszający ruch popu i kina (IV)',
        },
        {
          id: 'opt_am6',
          chord: createChordDefinition('A', 'minor6', 'i6', 'Szóstka molowa Jamesa Bonda (Am6)'),
          degreeName: 'vi6 (Szóstka molowa – Am6)',
          moodLabel: 'Film noir, szpiegowska elegancja',
          explanation: 'Dodanie wielkiej seksty Fis do A-moll tworzy legendarny motyw z filmów o Bondzie i mrocznych kryminałów.',
          whyItWorks: 'Nuta Fis wprowadza tajemniczy, dorycki posmak.',
          isRecommended: false,
          fitTier: 'perfect',
          fitScore: 92,
          fitVerdict: 'Genialny szpiegowski kolor! Legendarny akord Am6',
        },
        {
          id: 'opt_fmaj7_after_am',
          chord: createChordDefinition('F', 'maj7', 'IVmaj7', 'Aksamitna subdominanta (Fmaj7)'),
          degreeName: 'IVmaj7 (Aksamitne Fmaj7)',
          moodLabel: 'Ciepła chmura dźwięku',
          explanation: 'Fmaj7 zawiera wszystkie dźwięki A-moll (A, C, E) plus bas F! Brzmi jak najdoskonalsze rozwinięcie Am.',
          whyItWorks: 'Maksymalne pokrewieństwo dźwiękowe z aksamitnym blaskiem.',
          isRecommended: false,
          fitTier: 'perfect',
          fitScore: 96,
          fitVerdict: 'Znakomity wybór! Fmaj7 idealnie rezonuje z A-moll',
        },
        {
          id: 'opt_fsus2_after_am',
          chord: createChordDefinition('F', 'sus2', 'IVsus2', 'Zawieszona subdominanta (Fsus2)'),
          degreeName: 'IVsus2 (Eteryczne Fsus2)',
          moodLabel: 'Nowoczesna przestrzeń worship/pop',
          explanation: 'Dźwięk G w akordzie F tworzy eteryczną, otwartą przestrzeń bez zmatowienia tercją.',
          whyItWorks: 'Czysty, przestrzenny akord uwielbiany w modern popie.',
          isRecommended: false,
          fitTier: 'good',
          fitScore: 88,
          fitVerdict: 'Nowoczesna przestrzeń! Eteryczne Fsus2',
        },
        {
          id: 'opt_dm_after_am',
          chord: createChordDefinition('D', 'minor', 'ii', 'Subdominanta molowa (ii) - Jazz & R&B'),
          degreeName: 'ii (D-moll)',
          moodLabel: 'Klimatyczny, deszczowy lo-fi',
          explanation: 'Ruch w dół o kwintę (A -> D). Idealny krok do przygotowania kadencji ii-V-I.',
          whyItWorks: 'Dźwięk A jest wspólny, bas porusza się w silnej relacji kwintowej w dół.',
          isRecommended: false,
          fitTier: 'good',
          fitScore: 84,
          fitVerdict: 'Dobre jazzowe rozwinięcie! Przygotowuje kadencję 2-5-1 (ii)',
        },
        {
          id: 'opt_e7_after_am',
          chord: createChordDefinition('E', 'dom7', 'V7/vi', 'Dominanta wtrącona do A-moll (E7)'),
          degreeName: 'V7/vi (Dominanta harmoniczna – E7)',
          moodLabel: 'Pikantne napięcie hiszpańskie',
          explanation: 'Akord E7 z nutą Gis to dominanta molowa, która domaga się powrotu do A-moll.',
          whyItWorks: 'Dźwięk Gis to nuta prowadząca do prymy A.',
          isRecommended: false,
          fitTier: 'good',
          fitScore: 82,
          fitVerdict: 'Ognisty zwrot! Dominanta wtrącona E7',
        },
        {
          id: 'opt_aaug',
          chord: createChordDefinition('A', 'augmented', 'vi+', 'Pochód chromatyczny (Aaug / A+)'),
          degreeName: 'vi+ (Zwiększony – Aaug)',
          moodLabel: 'Kosmiczny krok wznoszący',
          explanation: 'Podwyższa kwintę E do F. Serce słynnego pochodu cliché Bonda.',
          whyItWorks: 'Prowadzi chromatycznie w górę do seksty Fis lub F-dur.',
          isRecommended: false,
          fitTier: 'good',
          fitScore: 76,
          fitVerdict: 'Intrygujący cliché! Chromatyczne uniesienie kwinty',
        },
        {
          id: 'opt_g_after_am',
          chord: createChordDefinition('G', 'major', 'V', 'Krok w górę (V) - Przygotowanie do skoku'),
          degreeName: 'V (Dominanta – G-dur)',
          moodLabel: 'Podniesienie energii',
          explanation: 'Ruch schodkowy z Am na G przygotowuje grunt pod powrót do Toniki.',
          whyItWorks: 'Działa świetnie zwłaszcza jako akord przejściowy z basem schodzącym lub wznoszącym.',
          isRecommended: false,
          fitTier: 'good',
          fitScore: 75,
          fitVerdict: 'Dobre przejście schodkowe w stronę toniki (V)',
        },
      ];
    }

    if (currentChord.root === 'F' && currentChord.quality === 'major') {
      // From F (IV):
      return [
        {
          id: 'opt_g_after_f',
          chord: createChordDefinition('G', 'major', 'V', 'Dominanta (V) - Szczyt napięcia przed domem'),
          degreeName: 'V (Dominanta – G-dur)',
          moodLabel: 'Dynamiczny rozbieg do finału',
          explanation: 'Klasyczny schemat IV -> V. Subdominanta podaje rękę Dominancie, budując nieodparte pragnienie rozwiązania w I.',
          whyItWorks: 'Wszystkie głosy wznoszą się o cały ton, dając wrażenie wspinaczki na szczyt góry.',
          isRecommended: true,
          fitTier: 'perfect',
          fitScore: 100,
          fitVerdict: 'Znakomity ruch! Rozbieg IV ➔ V dążący prosto do finału',
        },
        {
          id: 'opt_gsus4_after_f',
          chord: createChordDefinition('G', 'sus4', 'Vsus4', 'Zawieszony rozbieg (Gsus4)'),
          degreeName: 'Vsus4 (Zawieszona dominanta – Gsus4)',
          moodLabel: 'Monumentalny, śpiewny hymn',
          explanation: 'Gsus4 zatrzymuje nutę C z akordu F, tworząc niesamowicie płynne przejście bez szorstkości.',
          whyItWorks: 'Nuta C jest wspólna, a bas wykonuje potężny krok F -> G.',
          isRecommended: false,
          fitTier: 'perfect',
          fitScore: 95,
          fitVerdict: 'Wybitna płynność! Gsus4 idealnie łączy się z F-dur',
        },
        {
          id: 'opt_c_after_f',
          chord: createChordDefinition('C', 'major', 'I', 'Kadencja plagalna (I) - "Amen"'),
          degreeName: 'I (Kadencja plagalna – C-dur)',
          moodLabel: 'Głęboki spokój, ulga i ukojenie',
          explanation: 'Słynna kadencja "Amen" z hymnów gospel i kościelnych, również uwielbiana przez The Beatles ("Let It Be").',
          whyItWorks: 'Dźwięk C jest wspólny, a dźwięki F i A łagodnie opadają na E i G.',
          isRecommended: false,
          fitTier: 'perfect',
          fitScore: 92,
          fitVerdict: 'Piękne rozwiązanie! Słynna kadencja "Amen" (Let It Be)',
        },
        {
          id: 'opt_fm6_after_f',
          chord: createChordDefinition('F', 'minor6', 'iv6', 'Zapożyczenie z sekstą (Fm6) - "Wyciskacz łez"'),
          degreeName: 'iv6 molowe (Zapożyczenie – Fm6)',
          moodLabel: 'Magiczne, słodko-smutne pęknięcie serca',
          explanation: 'F-moll z dodaną sekstą D. Słynny chwyt Radiohead ("Creep"), The Beatles ("In My Life") i Hansa Zimmera.',
          whyItWorks: 'Dźwięk As schodzi chromatycznie na G, a seksta D dodaje niepowtarzalnej szlachetności.',
          isRecommended: false,
          fitTier: 'good',
          fitScore: 90,
          fitVerdict: 'Genialny filmowy twist! Słynne Fm6 wyciskające łzy',
        },
        {
          id: 'opt_fmaj7_self',
          chord: createChordDefinition('F', 'maj7', 'IVmaj7', 'Aksamitne rozszerzenie (Fmaj7)'),
          degreeName: 'IVmaj7 (Wielka septyma – Fmaj7)',
          moodLabel: 'Rozmarzone uniesienie melodii',
          explanation: 'Dodanie dźwięku E do F-dur otwiera przepiękny, nostalgiczny krajobraz harmoniczny.',
          whyItWorks: 'Wielka septyma tworzy miękki, marzycielski charakter.',
          isRecommended: false,
          fitTier: 'good',
          fitScore: 86,
          fitVerdict: 'Aksamitne urozmaicenie! Marzycielskie Fmaj7',
        },
        {
          id: 'opt_fadd9',
          chord: createChordDefinition('F', 'add9', 'IVadd9', 'Promienna nona (Fadd9)'),
          degreeName: 'IVadd9 (Dodana nona – Fadd9)',
          moodLabel: 'Świeży, słoneczny powiew Coldplay',
          explanation: 'Nona G dodaje krystalicznego, dzwoniącego blasku fortepianu.',
          whyItWorks: 'Świeża barwa bez zbędnego napięcia septymy.',
          isRecommended: false,
          fitTier: 'good',
          fitScore: 84,
          fitVerdict: 'Świeży i słoneczny! Nowoczesny Fadd9',
        },
        {
          id: 'opt_g7_after_f',
          chord: createChordDefinition('G', 'dom7', 'V7', 'Dominanta septymowa (G7)'),
          degreeName: 'V7 (Dominanta septymowa – G7)',
          moodLabel: 'Klasyczny rozbieg z trytonem',
          explanation: 'Przejście do pełnej dominanty septymowej domagającej się toniki C.',
          whyItWorks: 'Mocne dążenie kadencyjne.',
          isRecommended: false,
          fitTier: 'good',
          fitScore: 88,
          fitVerdict: 'Klasyczna siła dominanty! G7',
        },
        {
          id: 'opt_dm_after_f',
          chord: createChordDefinition('D', 'minor', 'ii', 'Zamiana subdominanty (ii) - Odcień szarości'),
          degreeName: 'ii (D-moll)',
          moodLabel: 'Spokojne ściemnienie barwy',
          explanation: 'F-dur i D-moll to niemal te same dźwięki (F, A, C vs D, F, A).',
          whyItWorks: 'Subtelne przejście z duru w moll bez zmiany nadrzędnej funkcji subdominantowej.',
          isRecommended: false,
          fitTier: 'weak',
          fitScore: 40,
          fitVerdict: 'Słabsza zmiana: F i Dm mają te same funkcje, brak nowego impetu',
        },
      ];
    }

    if (currentChord.root === 'D' && currentChord.quality === 'minor') {
      // From Dm (ii):
      return [
        {
          id: 'opt_g_after_dm',
          chord: createChordDefinition('G', 'major', 'V', 'Dominanta (V) – Kluczowa kadencja 2-5-1'),
          degreeName: 'V (Dominanta – G-dur)',
          moodLabel: 'Potężny ruch kwintowy dążący do C',
          explanation: 'Ruch kwintowy Dm -> G to podstawa jazzu i popu (kadencja ii-V-I). Nuta G w basie przygotowuje ostateczne rozwiązanie w C.',
          whyItWorks: 'Najpotężniejsza relacja kwintowa w muzyce. Tercja H akordu G pociągnie prosto do prymy C.',
          isRecommended: true,
          fitTier: 'perfect',
          fitScore: 100,
          fitVerdict: 'Znakomity wybór! (100% dopasowania) – Perfekcyjna kadencja ii-V-I',
        },
        {
          id: 'opt_gsus4_after_dm',
          chord: createChordDefinition('G', 'sus4', 'Vsus4', 'Zawieszona dominanta (Gsus4)'),
          degreeName: 'Vsus4 (Zawieszenie – Gsus4)',
          moodLabel: 'Płynne, aksamitne przejście do dominanty',
          explanation: 'Gsus4 zatrzymuje dźwięk C, łącząc Dm7 i G z niezwykłą gładkością.',
          whyItWorks: 'Wspólne alikwoty eliminują ostre skoki.',
          isRecommended: false,
          fitTier: 'perfect',
          fitScore: 94,
          fitVerdict: 'Aksamitne przejście do dominanty! Gsus4',
        },
        {
          id: 'opt_c_after_dm',
          chord: createChordDefinition('C', 'major', 'I', 'Tonika (I) – Bezpośrednie uspokojenie'),
          degreeName: 'I (Tonika – C-dur)',
          moodLabel: 'Miękkie, balladowe lądowanie',
          explanation: 'Przejście z ii bezpośrednio do I bez dominanty. Daje łagodne, nieco melancholijne ukojenie.',
          whyItWorks: 'Dźwięki D i A łagodnie opadają na C i G.',
          isRecommended: false,
          fitTier: 'good',
          fitScore: 88,
          fitVerdict: 'Bardzo dobry wybór! (88% dopasowania) – Łagodne lądowanie na tonice',
        },
        {
          id: 'opt_dm7',
          chord: createChordDefinition('D', 'min7', 'ii7', 'Jazzowy drugi stopień (Dm7)'),
          degreeName: 'ii7 (D-moll septymowy – Dm7)',
          moodLabel: 'Ciepły, soulowy lo-fi',
          explanation: 'Dodanie małej septymy C wzbogaca akord o ciepły, kawiarniany kolor jazzowy.',
          whyItWorks: 'Dźwięk C to tonika gamy – akord jest stabilniejszy i bogatszy.',
          isRecommended: false,
          fitTier: 'good',
          fitScore: 86,
          fitVerdict: 'Soulowy jazzowy kolor! Dm7',
        },
        {
          id: 'opt_a7_after_dm',
          chord: createChordDefinition('A', 'dom7', 'VI7', 'Dominanta wtrącona do Dm (A7)'),
          degreeName: 'VI7 (Dominanta wtrącona – A7)',
          moodLabel: 'Pikantny zwrot harmoniczny',
          explanation: 'Akord A7 z nutą Cis to klasyczna dominanta drugiego stopnia.',
          whyItWorks: 'Dźwięk Cis mocno ciągnie do D.',
          isRecommended: false,
          fitTier: 'good',
          fitScore: 80,
          fitVerdict: 'Pikantna dominanta wtrącona A7',
        },
        {
          id: 'opt_bdim_after_dm',
          chord: createChordDefinition('B', 'diminished', 'viiø', 'Półzmniejszony (H-dim)'),
          degreeName: 'viiø (Półzmniejszony – H-dim)',
          moodLabel: 'Tajemniczy jazzowy suspens',
          explanation: 'Dźwięki H, D, F stanowią trzon jazzowej harmonii molowej.',
          whyItWorks: 'Mocne dążenie do dominanty E7 lub G7.',
          isRecommended: false,
          fitTier: 'good',
          fitScore: 78,
          fitVerdict: 'Jazzowy półzmniejszony akord napięciowy',
        },
        {
          id: 'opt_bb_after_dm',
          chord: createChordDefinition('A#', 'major', 'bVII', 'Krok całotonowy – Epicki rock'),
          degreeName: 'bVII (B-dur / Bb)',
          moodLabel: 'Filmowy rozmach i przestrzeń',
          explanation: 'Akord Bb daje epickie, rockowe uniesienie, uwielbiane w muzyce filmowej i stadionowej.',
          whyItWorks: 'Wspólny dźwięk D spaja oba akordy, a bas schodzi majestatycznie.',
          isRecommended: false,
          fitTier: 'good',
          fitScore: 82,
          fitVerdict: 'Dobry, ciekawy wybór! (82% dopasowania) – Epicki krok rockowo-filmowy',
        },
        {
          id: 'opt_ebm_after_dm',
          chord: createChordDefinition('D#', 'minor', 'iii b', 'Akord obcy (Eb-moll)'),
          degreeName: 'Akord obcy (Eb-moll / D#-moll)',
          moodLabel: 'Ostry kontrast tonalny',
          explanation: 'Ruch półtonowy w górę bez przygotowania harmonicznego brzmi obco i dysonansowo.',
          whyItWorks: 'Brak nut wspólnych z tonacją bazową C-dur.',
          isRecommended: false,
          fitTier: 'weak',
          fitScore: 30,
          fitVerdict: 'Słabszy wybór (30% dopasowania) – Rozbija płynność progresji',
        },
      ];
    }

    if (currentChord.root === 'E' && currentChord.quality === 'minor') {
      // From Em (iii):
      return [
        {
          id: 'opt_am_after_em',
          chord: createChordDefinition('A', 'minor', 'vi', 'Ruch kwintowy w dół do vi'),
          degreeName: 'vi (Paralela molowa – A-moll)',
          moodLabel: 'Głęboki, wzruszający strumień emocji',
          explanation: 'Ruch z Em do Am to klasyczny ruch kwintowy w dół (lub kwartowy w górę). Działa niezwykle gładko.',
          whyItWorks: 'Dźwięk E jest wspólny, a tercja H prowadzi do C.',
          isRecommended: true,
          fitTier: 'perfect',
          fitScore: 100,
          fitVerdict: 'Znakomity wybór! (100% dopasowania) – Płynny ruch kwintowy do vi',
        },
        {
          id: 'opt_f_after_em',
          chord: createChordDefinition('F', 'major', 'IV', 'Półtonowy krok w górę ku subdominancie'),
          degreeName: 'IV (Subdominanta – F-dur)',
          moodLabel: 'Jasne otwarcie po molowym zmierzchu',
          explanation: 'Ruch z iii (Em) do IV (F) podnosi energię z melancholii w stronę jasnego światła.',
          whyItWorks: 'Dźwięk E podnosi się półtonowo na F, dając wrażenie uniesienia.',
          isRecommended: false,
          fitTier: 'perfect',
          fitScore: 94,
          fitVerdict: 'Świetny wybór! (94% dopasowania) – Piękne wyjście ku jasnemu F-dur',
        },
        {
          id: 'opt_cmaj7_after_em',
          chord: createChordDefinition('C', 'maj7', 'Imaj7', 'Aksamitna tonika (Cmaj7)'),
          degreeName: 'Imaj7 (Aksamitne Cmaj7)',
          moodLabel: 'Ciepłe, jazzowe ukojenie',
          explanation: 'E-moll i Cmaj7 dzielą aż 3 dźwięki (E, G, H)! Przejście jest maksymalnie gładkie.',
          whyItWorks: 'E-moll to niemal dokładny substytut górnej struktury Cmaj7.',
          isRecommended: false,
          fitTier: 'perfect',
          fitScore: 92,
          fitVerdict: 'Genialne pokrewieństwo! Cmaj7 idealnie ląduje po Em',
        },
        {
          id: 'opt_dm_after_em',
          chord: createChordDefinition('D', 'minor', 'ii', 'Krok schodkowy w dół do ii'),
          degreeName: 'ii (Subdominanta molowa – D-moll)',
          moodLabel: 'Łagodne opadanie melodii',
          explanation: 'Schodzenie basu E -> D przygotowuje dalszy ciąg do G i C.',
          whyItWorks: 'Naturalna harmonia krokowa.',
          isRecommended: false,
          fitTier: 'good',
          fitScore: 80,
          fitVerdict: 'Dobry wybór! (80% dopasowania) – Spokojny krok schodkowy w dół',
        },
        {
          id: 'opt_b7_after_em',
          chord: createChordDefinition('B', 'dom7', 'V7/iii', 'Dominanta wtrącona do Em (H7)'),
          degreeName: 'V7/iii (Dominanta wtrącona – H7)',
          moodLabel: 'Pikantny zwrot flamenco/hiszpański',
          explanation: 'H7 z nutą Dis tworzy mocne, ogniste napięcie dążące do E-moll.',
          whyItWorks: 'Klasyczna dominanta harmoniczna trzeciego stopnia.',
          isRecommended: false,
          fitTier: 'good',
          fitScore: 78,
          fitVerdict: 'Ognisty hiszpański krok H7!',
        },
        {
          id: 'opt_g_after_em',
          chord: createChordDefinition('G', 'major', 'V', 'Krok tercjowy w górę (G-dur)'),
          degreeName: 'V (Względny dur – G-dur)',
          moodLabel: 'Rozjaśnienie barwy',
          explanation: 'Przejście do durowej paraleli E-moll (G-dur).',
          whyItWorks: 'Dzielą dwa dźwięki (G i H).',
          isRecommended: false,
          fitTier: 'good',
          fitScore: 82,
          fitVerdict: 'Ciepłe rozjaśnienie harmonii do G-dur',
        },
        {
          id: 'opt_am6_after_em',
          chord: createChordDefinition('A', 'minor6', 'vi6', 'Krok z sekstą (Am6)'),
          degreeName: 'vi6 (Z sekstą – Am6)',
          moodLabel: 'Nostalgiczna szóstka filmowa',
          explanation: 'Przejście z Em do Am z dodaną sekstą Fis.',
          whyItWorks: 'Nuta Fis daje wyrafinowany, kawiarniany posmak.',
          isRecommended: false,
          fitTier: 'good',
          fitScore: 84,
          fitVerdict: 'Klimatyczny posmak noir z sekstą Am6',
        },
        {
          id: 'opt_csm_after_em',
          chord: createChordDefinition('C#', 'minor', 'Akord obcy'),
          degreeName: 'Akord obcy (C#-moll)',
          moodLabel: 'Dysonans tonalny',
          explanation: 'C#-moll nie należy do gamy C-dur ani nie pełni funkcji dominanty wtrąconej.',
          whyItWorks: 'Wymaga zaawansowanej modulacji chromatycznej.',
          isRecommended: false,
          fitTier: 'weak',
          fitScore: 28,
          fitVerdict: 'Słabszy wybór (28% dopasowania) – Ostry kontrast poza gamą',
        },
      ];
    }
  }

  // Generic fallback if user selected any other chord
  const rootIdx = NOTE_NAMES.indexOf(currentChord.root);
  const fifthUp = NOTE_NAMES[(rootIdx + 7) % 12];
  const fourthUp = NOTE_NAMES[(rootIdx + 5) % 12];
  const relativeMinor = NOTE_NAMES[(rootIdx + 9) % 12];
  const stepDown = NOTE_NAMES[(rootIdx + 10) % 12];
  const chromaticStep = NOTE_NAMES[(rootIdx + 1) % 12];

  return [
    {
      id: `gen_fifth_${fifthUp}`,
      chord: createChordDefinition(fifthUp, 'major', 'V', 'Krok kwintowy w górę'),
      degreeName: `Krok kwintowy (${getNoteLabel(fifthUp)}-dur)`,
      moodLabel: 'Zastrzyk energii i kierunek w przód',
      explanation: `Ruch o kwintę z ${currentChord.polishSymbol} do ${getNoteLabel(fifthUp)}-dur to najsilniejsza relacja w muzyce.`,
      whyItWorks: 'Kwinta czysta to najczystszy harmonicznie interwał w szeregu alikwotów poza oktawą.',
      isRecommended: true,
      fitTier: 'perfect',
      fitScore: 100,
      fitVerdict: 'Doskonałe dopasowanie! Naturalna relacja kwintowa w górę',
    },
    {
      id: `gen_rel_${relativeMinor}`,
      chord: createChordDefinition(relativeMinor, 'minor', 'vi', 'Paralela molowa'),
      degreeName: `Paralela molowa (${getNoteLabel(relativeMinor)}-moll)`,
      moodLabel: 'Nostalgiczne zmatowienie barwy',
      explanation: `Wprowadza intymny, ciepły ton molowy dzieląc 2 dźwięki z akordem wyjściowym.`,
      whyItWorks: 'Idealne płynne prowadzenie głosów z minimalnym ruchem palców na klawiaturze.',
      isRecommended: false,
      fitTier: 'perfect',
      fitScore: 90,
      fitVerdict: 'Świetny wybór! Paralela molowa o wspólnych dźwiękach',
    },
    {
      id: `gen_fourth_${fourthUp}`,
      chord: createChordDefinition(fourthUp, 'major', 'IV', 'Krok kwartowy'),
      degreeName: `Krok kwartowy (${getNoteLabel(fourthUp)}-dur)`,
      moodLabel: 'Przestrzenne otwarcie melodii',
      explanation: `Daje poczucie rozszerzenia harmonicznego i lekkości.`,
      whyItWorks: 'Otwiera frazę i pozwala melodii wspiąć się na wyższe rejestry.',
      isRecommended: false,
      fitTier: 'good',
      fitScore: 85,
      fitVerdict: 'Dobre dopasowanie! Kwartowy oddech w melodii',
    },
    {
      id: `gen_maj7_${currentChord.root}`,
      chord: createChordDefinition(currentChord.root, 'maj7', 'maj7', 'Wielka septyma'),
      degreeName: `Wielka septyma (${getNoteLabel(currentChord.root)}maj7)`,
      moodLabel: 'Aksamitny jazz & chillout',
      explanation: `Wzbogaca akord bazowy o miękki, marzycielski blask wielkiej septymy.`,
      whyItWorks: 'Aksamitne brzmienie stylu neo-soul.',
      isRecommended: false,
      fitTier: 'perfect',
      fitScore: 92,
      fitVerdict: 'Aksamitny wariant! Piękne maj7',
    },
    {
      id: `gen_sus4_${fifthUp}`,
      chord: createChordDefinition(fifthUp, 'sus4', 'Vsus4', 'Zawieszenie kwartowe'),
      degreeName: `Zawieszenie (${getNoteLabel(fifthUp)}sus4)`,
      moodLabel: 'Wzniosłe uniesienie hymnu',
      explanation: `Zastępuje tercję kwartą czystą, budując monumentalne oczekiwanie na rozwiązanie.`,
      whyItWorks: 'Klasyczny chwyt popowy i rockowy.',
      isRecommended: false,
      fitTier: 'good',
      fitScore: 84,
      fitVerdict: 'Wzniosłe zawieszenie kwartowe sus4',
    },
    {
      id: `gen_six_${currentChord.root}`,
      chord: createChordDefinition(currentChord.root, 'major6', '6', 'Szóstka retro'),
      degreeName: `Szóstka (${getNoteLabel(currentChord.root)}6)`,
      moodLabel: 'Ciepły, słodki swing',
      explanation: `Dodaje sekstę wielką, nadając słodki, kołyszący posmak retro i bossa novy.`,
      whyItWorks: 'Brak ostrości septymy przy zachowaniu bogatej barwy.',
      isRecommended: false,
      fitTier: 'good',
      fitScore: 82,
      fitVerdict: 'Ciepła i słodka szóstka retro',
    },
    {
      id: `gen_dim_${chromaticStep}`,
      chord: createChordDefinition(chromaticStep, 'dim7', '°7', 'Łącznik zmniejszony'),
      degreeName: `Zmniejszony łącznik (${getNoteLabel(chromaticStep)}dim7)`,
      moodLabel: 'Tajemniczy most chromatyczny',
      explanation: `Akord zmniejszony o półton wyżej tworzy gęsty, jazzowy most basowy.`,
      whyItWorks: 'Trytony ciągną w stronę kolejnego stopnia.',
      isRecommended: false,
      fitTier: 'good',
      fitScore: 78,
      fitVerdict: 'Tajemniczy łącznik chromatyczny dim7',
    },
    {
      id: `gen_step_${stepDown}`,
      chord: createChordDefinition(stepDown, 'major', 'VII', 'Krok całotonowy'),
      degreeName: `Krok o cały ton (${getNoteLabel(stepDown)}-dur)`,
      moodLabel: 'Filmowy, epicki zwrot',
      explanation: `Częsty chwyt w epickiej muzyce filmowej i rockowych balladach.`,
      whyItWorks: 'Równoległy ruch akordów tworzy wrażenie majestatycznego rozmachu.',
      isRecommended: false,
      fitTier: 'weak',
      fitScore: 45,
      fitVerdict: 'Słabsze/nietypowe: krok całotonowy wymaga specyficznego klimatu',
    },
  ];
}

/**
 * Famous chord progression library with musical context
 */
export const FAMOUS_PROGRESSIONS: FamousProgression[] = [
  // ==========================================
  // NOWE: BOGATE AKORDY (6, DIM, AUG, SUS, MAJ7)
  // Kompletne piosenki oraz wzorce 4-8 akordowe
  // ==========================================
  {
    id: 'song_neosoul_maj7_m6',
    name: 'Neo-Soul & Aksamitny Chill (Zwrotka ➔ Refren ➔ Bridge)',
    genre: 'Jazz / Neo-Soul / Chill',
    structure: 'Zwrotka ➔ Refren ➔ Bridge',
    description: 'Aksamitna architektura współczesnego Neo-Soul i R&B. Używa marzycielskich akordów maj7, soulowego zawieszenia 7sus4, półzmniejszonego m7b5 w bridge\'u oraz zmysłowego zapożyczenia z sekstą Fm6.',
    key: 'C-dur',
    steps: [
      { symbol: 'Cmaj7', degree: 'Imaj7', role: 'Aksamitny, marzycielski początek na tonice', section: 'Zwrotka' },
      { symbol: 'Am7', degree: 'vi7', role: 'Ciepły, lo-fi oddech basu', section: 'Zwrotka' },
      { symbol: 'Dm7', degree: 'ii7', role: 'Gładki krok subdominanty molowej', section: 'Zwrotka' },
      { symbol: 'G7sus4', degree: 'V7sus4', role: 'Nowoczesne, otwarte zawieszenie dominanty', section: 'Zwrotka' },
      { symbol: 'Fmaj7', degree: 'IVmaj7', role: 'Eksplozja ciepła i uniesienie refrenu', section: 'Refren' },
      { symbol: 'Em7', degree: 'iii7', role: 'Łagodne zmatowienie barwy w dół', section: 'Refren' },
      { symbol: 'Dm7', degree: 'ii7', role: 'Przygotowanie soulowego zwrotu', section: 'Refren' },
      { symbol: 'Fm6', degree: 'iv6 (Zapożyczenie z sekstą)', role: 'Zmysłowe, wyciskające łzy zapożyczenie Fm6 z sekstą D!', section: 'Refren' },
      { symbol: 'Bdim', degree: 'viiø (Bm7b5)', role: 'Święty Graal soulowego bridge\'u: półzmniejszony', section: 'Bridge' },
      { symbol: 'E7', degree: 'V7/vi', role: 'Dominanta wtrącona do paraleli molowej', section: 'Bridge' },
      { symbol: 'Am7', degree: 'vi7', role: 'Głęboka kulminacja wokalna', section: 'Bridge' },
      { symbol: 'D7', degree: 'II7', role: 'Durowy krok wznoszący', section: 'Bridge' },
      { symbol: 'Dm7', degree: 'ii7', role: 'Uspokojenie frazy', section: 'Bridge' },
      { symbol: 'Gsus4', degree: 'Vsus4', role: 'Ostateczne zawieszenie przed powrotem do Imaj7', section: 'Bridge' },
    ],
  },
  {
    id: 'song_coldplay_anthem_sus',
    name: 'Stadionowy Hymn & Eteryczny Pop (Zwrotka ➔ Refren ➔ Bridge)',
    genre: 'Pop / Stadionowy Alt-Pop (Coldplay, U2)',
    structure: 'Zwrotka ➔ Refren ➔ Bridge',
    description: 'Monumentalny, przestrzenny hymn stadionowy bazujący na zawieszeniach sus2, sus4 i promiennych nonach add9. Zamiast zwykłych trójdźwięków, otwarta przestrzeń w stylu "Fix You" i "Yellow".',
    key: 'C-dur',
    steps: [
      { symbol: 'Cadd9', degree: 'Iadd9', role: 'Słoneczna, krystaliczna nona na pianinie', section: 'Zwrotka' },
      { symbol: 'Gsus4', degree: 'Vsus4', role: 'Otwarte zawieszenie kwartowe bez ostrej tercji', section: 'Zwrotka' },
      { symbol: 'Am7', degree: 'vi7', role: 'Czysty, nowoczesny bas molowy', section: 'Zwrotka' },
      { symbol: 'Fsus2', degree: 'IVsus2', role: 'Eteryczna, unosząca się przestrzeń', section: 'Zwrotka' },
      { symbol: 'C', degree: 'I', role: 'Mocne, euforyczne uderzenie refrenu', section: 'Refren' },
      { symbol: 'G', degree: 'V', role: 'Potężna ściana dźwięku', section: 'Refren' },
      { symbol: 'Am7', degree: 'vi7', role: 'Wzruszający okrzyk wokalny', section: 'Refren' },
      { symbol: 'Fmaj7', degree: 'IVmaj7', role: 'Aksamitne, szerokie uniesienie nad stadionem', section: 'Refren' },
      { symbol: 'Dm7', degree: 'ii7', role: 'Zwolnienie tempa i intymny most', section: 'Bridge' },
      { symbol: 'Em', degree: 'iii', role: 'Wspinaczka po stopniach gamy', section: 'Bridge' },
      { symbol: 'Fsus4', degree: 'IVsus4', role: 'Narastające crescendo z kwartą', section: 'Bridge' },
      { symbol: 'Gsus4', degree: 'Vsus4', role: 'Maksymalne napięcie dominantowe przed finałem!', section: 'Bridge' },
    ],
  },
  {
    id: 'song_cinema_noir_bond_m6',
    name: 'Film Noir & James Bond Cliché (Część A ➔ Rozwinięcie ➔ Kulminacja)',
    genre: 'Film / Noir & Suspense (James Bond)',
    structure: 'Część A (Cliché Szóstki) ➔ Rozwinięcie ➔ Finał',
    description: 'Legendarny szpiegowski pochód chromatyczny (i ➔ i6 ➔ i7 ➔ i6), akordy zmniejszone dim7 oraz kosmiczny akord zwiększony aug. Kwintesencja kina szpiegowskiego i mrocznego suspensu.',
    key: 'A-moll',
    steps: [
      { symbol: 'Am', degree: 'i', role: 'Cichy, mroczny motyw w piwnicznym barze', section: 'Część A' },
      { symbol: 'Am6', degree: 'i6 (Szóstka molowa)', role: 'Słynny znak rozpoznawczy Bonda: akord molowy z sekstą wielką (nutka Fis)!', section: 'Część A' },
      { symbol: 'Am7', degree: 'i7', role: 'Ruch chromatyczny w dół na małą septymę G', section: 'Część A' },
      { symbol: 'Am6', degree: 'i6', role: 'Powrót do chłodnej elegancji szóstki', section: 'Część A' },
      { symbol: 'Dm', degree: 'iv', role: 'Napięty zwrot subdominantowy', section: 'Rozwinięcie' },
      { symbol: 'Dm6', degree: 'iv6', role: 'Dodanie seksty na subdominancie molowej', section: 'Rozwinięcie' },
      { symbol: 'Bdim7', degree: 'ii°7 (Zmniejszony)', role: 'Gęsty niepokój: akord zmniejszony z dwoma trytonami', section: 'Rozwinięcie' },
      { symbol: 'Eaug', degree: 'Vaug (Zwiększony)', role: 'Kosmiczne, tajemnicze spięcie kwinty zwiększonej', section: 'Rozwinięcie' },
      { symbol: 'Fmaj7', degree: 'VImaj7', role: 'Epicki kinowy oddech orkiestry symfonicznej', section: 'Finał' },
      { symbol: 'Bdim', degree: 'ii°', role: 'Ostatnie zawieszenie przed strzałem', section: 'Finał' },
      { symbol: 'E7', degree: 'V7', role: 'Mroczna dominanta orkiestrowa', section: 'Finał' },
      { symbol: 'Am6', degree: 'i6', role: 'Finałowy szpiegowski akord z sekstą!', section: 'Finał' },
    ],
  },
  {
    id: 'song_bossa_classic_6_maj7',
    name: 'Brazylijska Bossa Nova & MPB (Zwrotka ➔ Refren ➔ Modulacja)',
    genre: 'Jazz / Bossa Nova (Jobim, Stan Getz)',
    structure: 'Zwrotka ➔ Refren ➔ Modulacja',
    description: 'Prawdziwe bogactwo zmysłowych brzmień z Rio de Janeiro. Przejście z aksamitnego Cmaj7 w słodki C6, zapożyczenie molowe z sekstą Fm6 oraz jazzowe kadencje z septymami i nonami.',
    key: 'C-dur',
    steps: [
      { symbol: 'Cmaj7', degree: 'Imaj7', role: 'Ciepła bryza na plaży Ipanema', section: 'Zwrotka' },
      { symbol: 'C6', degree: 'I6 (Szóstka durowa)', role: 'Lekki, słoneczny krok swingowy z sekstą A', section: 'Zwrotka' },
      { symbol: 'Dm7', degree: 'ii7', role: 'Leniwy, bujający drugi stopień', section: 'Zwrotka' },
      { symbol: 'G7', degree: 'V7', role: 'Ciepły puls dominanty z małą septymą', section: 'Zwrotka' },
      { symbol: 'Em7', degree: 'iii7', role: 'Wyjście w górne rejestry melodii', section: 'Refren' },
      { symbol: 'A7', degree: 'VI7 (Dominanta wtórna)', role: 'Pikantna dominanta wiodąca do Dm7', section: 'Refren' },
      { symbol: 'Dm7', degree: 'ii7', role: 'Rozwiązanie dominanty wtórnej', section: 'Refren' },
      { symbol: 'Fm6', degree: 'iv6 (Bossa Subdominant)', role: 'Magiczne brazylijskie zapożyczenie z sekstą!', section: 'Refren' },
      { symbol: 'Bdim', degree: 'viiø (Bm7b5)', role: 'Południowy akord półzmniejszony', section: 'Modulacja' },
      { symbol: 'E7', degree: 'V7/vi', role: 'Zwrot ku molowej tonice', section: 'Modulacja' },
      { symbol: 'Am7', degree: 'vi7', role: 'Zmysłowe, ciche wybrzmienie frazy', section: 'Modulacja' },
      { symbol: 'D7', degree: 'II7', role: 'Charakterystyczny II stopień durowy bossy', section: 'Modulacja' },
      { symbol: 'Dm7', degree: 'ii7', role: 'Powrót do rytmu głównego', section: 'Modulacja' },
      { symbol: 'G7', degree: 'V7', role: 'Turnaround zamykający obieg', section: 'Modulacja' },
    ],
  },
  {
    id: 'song_beatles_bowie_aug_dim',
    name: 'Geniusz Beatles & David Bowie (Zwrotka ➔ Refren ➔ Bridge)',
    genre: 'Pop / Klasyczny Pop-Rock (Beatles, Bowie)',
    structure: 'Zwrotka (Wznosząca Kwinta) ➔ Refren ➔ Bridge',
    description: 'Arcydzieło harmonii piosenkowej lat 70. ("Life on Mars", "Something", "It\'s Only Love"). Zawiera legendarny pochód wznoszącej kwinty z akordem zwiększonym aug i sekstą 6, chromatyczny akord zmniejszony dim7 oraz zawieszenia sus4.',
    key: 'C-dur',
    steps: [
      { symbol: 'C', degree: 'I', role: 'Punkt startowy: czysty dur', section: 'Zwrotka' },
      { symbol: 'Caug', degree: 'Iaug (Zwiększony)', role: 'Magiczne uniesienie kwinty w górę (G -> G#)', section: 'Zwrotka' },
      { symbol: 'C6', degree: 'I6 (Z sekstą)', role: 'Dalsze chromatyczne wznoszenie (G# -> A)', section: 'Zwrotka' },
      { symbol: 'C7', degree: 'I7', role: 'Kulminacja pochodu w dominantę (A -> Bb)', section: 'Zwrotka' },
      { symbol: 'F', degree: 'IV', role: 'Rozwiązanie pochodu w subdominantę', section: 'Refren' },
      { symbol: 'Fm', degree: 'iv', role: 'Zapożyczenie molowe z płaczącym dźwiękiem As', section: 'Refren' },
      { symbol: 'C', degree: 'I', role: 'Krótki powrót do toniki', section: 'Refren' },
      { symbol: 'D#dim7', degree: 'bIII°7 (Zmniejszony łącznik)', role: 'Niezwykły chromatyczny akord zmniejszony łączący frazy', section: 'Refren' },
      { symbol: 'Dm7', degree: 'ii7', role: 'Płynny wstęp do bridge\'u', section: 'Bridge' },
      { symbol: 'Gsus4', degree: 'Vsus4', role: 'Otwarte zawieszenie dominanty', section: 'Bridge' },
      { symbol: 'G', degree: 'V', role: 'Klasyczne rozwiązanie zawieszenia w czysty dur', section: 'Bridge' },
      { symbol: 'C6', degree: 'I6', role: 'Ciepłe domknięcie zwrotki akordem z sekstą', section: 'Bridge' },
    ],
  },
  {
    id: 'pop_maj7_sus4_chill',
    name: 'Aksamitny Pop & Chill (Imaj7 - vi7 - IVmaj7 - V7sus4)',
    genre: 'Pop / Chill / Neo-Soul',
    structure: 'Pętla Aksamitnych Septym & Zawieszenia',
    description: 'Najchętniej używana progresja we współczesnym chilloucie i nowoczesnym popie. Połączenie aksamitnych wielkich septym i zawieszonego akordu 7sus4 daje efekt miękkiego lądowania na chmurze.',
    key: 'C-dur',
    steps: [
      { symbol: 'Cmaj7', degree: 'Imaj7', role: 'Aksamitna tonika z wielką septymą' },
      { symbol: 'Am7', degree: 'vi7', role: 'Ciepły, nastrojowy bas molowy' },
      { symbol: 'Fmaj7', degree: 'IVmaj7', role: 'Rozmarzone otwarcie przestrzeni' },
      { symbol: 'G7sus4', degree: 'V7sus4', role: 'Nowoczesna dominanta z zawieszoną kwartą' },
    ],
  },
  {
    id: 'retro_cliche_six_minor6',
    name: 'Retro Szóstki & Cliché Molowe (I - I6 - iv6 - I)',
    genre: 'Pop / Retro 60s / Soul (Beatles, Motown)',
    structure: 'Klasyczny Cliché Seksty',
    description: 'Słynny schemat retro ballad ("In My Life" Beatlesów). Czysty dur przechodzi w rozkołysaną szóstkę C6, po czym następuje wzruszające zapożyczenie molowe z sekstą Fm6.',
    key: 'C-dur',
    steps: [
      { symbol: 'C', degree: 'I', role: 'Baza harmoniczna utworu' },
      { symbol: 'C6', degree: 'I6', role: 'Słodki, retro krok z dodaną sekstą' },
      { symbol: 'Fm6', degree: 'iv6', role: 'Słynne romantyczne zapożyczenie molowe z sekstą' },
      { symbol: 'C', degree: 'I', role: 'Powrót do domu' },
    ],
  },
  {
    id: 'jazz_passing_diminished',
    name: 'Chromatyczny Łącznik Zmniejszony (I - #I°7 - ii7 - V7)',
    genre: 'Jazz / Broadway / Swing Classic',
    structure: 'Chromatyczny Turnaround Zmniejszony',
    description: 'Legendarny trik aranżacyjny ery swingu i broadwayowskich musicali. Akord zmniejszony C#dim7 tworzy płynne, chromatyczne przejście basu między toniką C a drugim stopniem Dm7.',
    key: 'C-dur',
    steps: [
      { symbol: 'C', degree: 'I', role: 'Tonika startowa' },
      { symbol: 'C#dim7', degree: '#I°7 (Zmniejszony łącznik)', role: 'Genialny chromatyczny most basowy (C -> C# -> D) z trytonem' },
      { symbol: 'Dm7', degree: 'ii7', role: 'Płynne lądowanie basu na D' },
      { symbol: 'G7', degree: 'V7', role: 'Dominanta swingowa' },
    ],
  },
  {
    id: 'worship_epic_sus_add9',
    name: 'Wzniosły Eteryczny Pop (I - Isus4 - IVsus2 - Vsus4 - V)',
    genre: 'Pop / Worship / Stadion (Coldplay, Hillsong)',
    structure: 'Hymn z Zawieszeniami',
    description: 'Progresja wypełniona wzniosłymi zawieszeniami sus4 i sus2. Unika ostrej tercji, tworząc niepowtarzalne wrażenie unoszenia się w chmurach i wielkiej przestrzeni.',
    key: 'C-dur',
    steps: [
      { symbol: 'C', degree: 'I', role: 'Stabilny początek' },
      { symbol: 'Csus4', degree: 'Isus4', role: 'Wzniosłe zawieszenie kwartowe na tonice' },
      { symbol: 'C', degree: 'I', role: 'Rozwiązanie z ulgą' },
      { symbol: 'Fsus2', degree: 'IVsus2', role: 'Otwarta przestrzeń z sekundą' },
      { symbol: 'Gsus4', degree: 'Vsus4', role: 'Zawieszona dominanta budująca szczyt' },
      { symbol: 'G', degree: 'V', role: 'Uderzenie pełnej dominanty' },
    ],
  },
  {
    id: 'bond_spy_cliche_4',
    name: 'Bond & Szpiegowski Cliché Molowy (i - i+ - i6 - i7)',
    genre: 'Film / Szpiegowski (James Bond, Noir)',
    structure: 'Linia Chromatyczna Cliché',
    description: 'Najsłynniejszy 4-akordowy pochód szpiegowski kina. Dźwięk kwinty wędruje chromatycznie w górę (E -> F -> Fis -> G) w tonacji A-moll tworząc ciarki na plecach.',
    key: 'A-moll',
    steps: [
      { symbol: 'Am', degree: 'i', role: 'Mroczny początek opowieści' },
      { symbol: 'Aaug', degree: 'i+ (Zwiększony)', role: 'Krok basu/kwinty w górę na E# (F)' },
      { symbol: 'Am6', degree: 'i6 (Z sekstą)', role: 'Niezastąpiona szóstka Bonda (nutka Fis)' },
      { symbol: 'Am7', degree: 'i7', role: 'Zejście na małą septymę G' },
    ],
  },
  {
    id: 'indie_add9_modern',
    name: 'Promienny Indie & Nony (Iadd9 - IVadd9 - vi7 - Vsus4)',
    genre: 'Pop / Indie Pop / Modern Hits',
    structure: 'Pętla z Dodaną Noną (add9)',
    description: 'Nowoczesne, soczyste brzmienie indie-popu. Dodana nona (add9) dodaje dzwoniący, promienny blask gitar i pianina bez konieczności grania septymy.',
    key: 'C-dur',
    steps: [
      { symbol: 'Cadd9', degree: 'Iadd9', role: 'Krystaliczna nona dająca nowoczesny blask' },
      { symbol: 'Fadd9', degree: 'IVadd9', role: 'Przestrzenna subdominanta z dodaną noną' },
      { symbol: 'Am7', degree: 'vi7', role: 'Ciepły, pulsujący bas' },
      { symbol: 'Gsus4', degree: 'Vsus4', role: 'Otwarte zawieszenie dominanty' },
    ],
  },
  {
    id: 'jazz_half_diminished_cadence',
    name: 'Molowy Półzmniejszony Turnaround (iiø - V7 - i - i6)',
    genre: 'Jazz / Film Noir / Mroczna Bossa',
    structure: 'Kadencja Molowa z Sekstą',
    description: 'Szczyt elegancji harmonii molowej. Rozpoczyna się od tajemniczego akordu półzmniejszonego m7b5 (iiø), przechodzi przez dominantę i ląduje na tonice z dodaną szóstką.',
    key: 'A-moll',
    steps: [
      { symbol: 'Bdim', degree: 'iiø (Bm7b5)', role: 'Półzmniejszony akord jazzowy z kwintą zmniejszoną' },
      { symbol: 'E7', degree: 'V7', role: 'Mocna dominanta alterowana z trytonem' },
      { symbol: 'Am', degree: 'i', role: 'Głębokie uspokojenie w tonice molowej' },
      { symbol: 'Am6', degree: 'i6', role: 'Niezwykłe, szlachetne domknięcie akordem z sekstą' },
    ],
  },

  // ==========================================
  // 1. POP & BALLADY
  // ==========================================
  {
    id: 'pop_song_complete',
    name: 'Kompletna Piosenka Pop (Zwrotka ➔ Refren ➔ Bridge)',
    genre: 'Pop / Przebój Radiowy',
    structure: 'Zwrotka ➔ Refren ➔ Bridge',
    description: 'Pełna, klasyczna architektura współczesnego przeboju radiowego. Spokojna narracja zwrotki rozwija się w eksplozję energii refrenu, a kontrastujący bridge buduje napięcie przed finałem.',
    key: 'C-dur',
    steps: [
      { symbol: 'C', degree: 'I (Tonika)', role: 'Początek historii, spokój i wprowadzenie w klimat', section: 'Zwrotka' },
      { symbol: 'G', degree: 'V (Dominanta)', role: 'Lekkie napięcie narracyjne w zwrotce', section: 'Zwrotka' },
      { symbol: 'Am', degree: 'vi (Paralela molowa)', role: 'Nostalgiczny zwrot w głąb emocji', section: 'Zwrotka' },
      { symbol: 'F', degree: 'IV (Subdominanta)', role: 'Otwarte zawieszenie przed refrenem', section: 'Zwrotka' },
      { symbol: 'F', degree: 'IV (Subdominanta)', role: 'Eksplozja energii i uniesienie refrenu', section: 'Refren' },
      { symbol: 'G', degree: 'V (Dominanta)', role: 'Rozpęd ku kulminacji hooka', section: 'Refren' },
      { symbol: 'C', degree: 'I (Tonika)', role: 'Triumfalne lądowanie na tonice', section: 'Refren' },
      { symbol: 'Am', degree: 'vi (Paralela)', role: 'Emocjonalny oddech i tęsknota', section: 'Refren' },
      { symbol: 'Dm', degree: 'ii (Subdominanta molowa)', role: 'Zupełnie nowa perspektywa i zmiana barwy w bridge\'u', section: 'Bridge' },
      { symbol: 'Em', degree: 'iii (Medianta)', role: 'Wspinaczka po stopniach gamy', section: 'Bridge' },
      { symbol: 'F', degree: 'IV (Subdominanta)', role: 'Maksymalne rozszerzenie przestrzeni', section: 'Bridge' },
      { symbol: 'G', degree: 'V (Dominanta)', role: 'Potężny dominantowy rozbieg do finałowego refrenu', section: 'Bridge' },
    ],
  },
  {
    id: 'pop_max_martin',
    name: 'Modern Hit & Max Martin (Zwrotka ➔ Pre-Chorus ➔ Refren)',
    genre: 'Pop / Modern Hit (Taylor Swift, The Weeknd)',
    structure: 'Zwrotka ➔ Pre-Chorus ➔ Refren',
    description: 'Genialna formuła producenta wszech czasów Maxa Martina: mroczniejsza, intymna zwrotka, wznoszący pre-chorus i euforyczny wybuch refrenu na tonice.',
    key: 'C-dur',
    steps: [
      { symbol: 'Am', degree: 'vi', role: 'Intymna, nastrojowa opowieść zwrotki', section: 'Zwrotka' },
      { symbol: 'F', degree: 'IV', role: 'Podbicie energii i otwarcie', section: 'Zwrotka' },
      { symbol: 'C', degree: 'I', role: 'Ciepłe oparcie i ugruntowanie', section: 'Zwrotka' },
      { symbol: 'G', degree: 'V', role: 'Ruch napędowy w przód', section: 'Zwrotka' },
      { symbol: 'Dm', degree: 'ii', role: 'Narastający niepokój i zapowiedź dropu', section: 'Pre-Chorus' },
      { symbol: 'F', degree: 'IV', role: 'Wznoszenie emocji ponad limit', section: 'Pre-Chorus' },
      { symbol: 'G', degree: 'V', role: 'Zatrzymanie oddechu na dominancie', section: 'Pre-Chorus' },
      { symbol: 'C', degree: 'I', role: 'Uderzenie pełnej energii w refrenie!', section: 'Refren' },
      { symbol: 'G', degree: 'V', role: 'Śpiewny, nośny hook', section: 'Refren' },
      { symbol: 'Am', degree: 'vi', role: 'Głęboki, pulsujący bas', section: 'Refren' },
      { symbol: 'F', degree: 'IV', role: 'Otwarte, euforyczne domknięcie pętli', section: 'Refren' },
    ],
  },
  {
    id: 'pop_ballad_adele',
    name: 'Głęboka Ballada Fortepianowa (Zwrotka ➔ Refren ➔ Bridge)',
    genre: 'Pop / Piano Ballada (Adele, Elton John)',
    structure: 'Zwrotka ➔ Refren ➔ Bridge',
    description: 'Poruszająca, monumentalna ballada fortepianowa. Delikatna medianta w zwrotce, potężne otwarcie wokalu w refrenie i dramatyczny bridge.',
    key: 'C-dur',
    steps: [
      { symbol: 'C', degree: 'I', role: 'Cichy, intymny akompaniament pianina', section: 'Zwrotka' },
      { symbol: 'Em', degree: 'iii', role: 'Czuła, łagodna medianta górna', section: 'Zwrotka' },
      { symbol: 'Am', degree: 'vi', role: 'Cichy żal i samotność', section: 'Zwrotka' },
      { symbol: 'F', degree: 'IV', role: 'Wyjście ku światłu', section: 'Zwrotka' },
      { symbol: 'C', degree: 'I', role: 'Mocne, pełne otwarcie głosu w refrenie', section: 'Refren' },
      { symbol: 'G', degree: 'V', role: 'Potężna kulminacja refrenu', section: 'Refren' },
      { symbol: 'Am', degree: 'vi', role: 'Dramatyczne pęknięcie serca', section: 'Refren' },
      { symbol: 'F', degree: 'IV', role: 'Długie wybrzmienie frazy', section: 'Refren' },
      { symbol: 'Dm', degree: 'ii', role: 'Przełamanie schematu w bridge\'u', section: 'Bridge' },
      { symbol: 'G', degree: 'V', role: 'Budowanie niepewności', section: 'Bridge' },
      { symbol: 'Em', degree: 'iii', role: 'Wzruszające zawieszenie harmoniczne', section: 'Bridge' },
      { symbol: 'F', degree: 'IV', role: 'Ostateczne wezwanie do powrotu', section: 'Bridge' },
    ],
  },
  {
    id: 'pop_axis',
    name: 'Klasyczne 4 Akordy Pop (I - V - vi - IV)',
    genre: 'Pop / Rock / Ballady',
    structure: 'Nieśmiertelna Pętla 4 Akordów',
    description: 'Najpopularniejsza progresja w historii muzyki współczesnej. Użyta w setkach hitów od The Beatles po Eda Sheerana i Toto ("Africa").',
    key: 'C-dur',
    steps: [
      { symbol: 'C', degree: 'I (Tonika)', role: 'Dom, spokój, punkt startowy' },
      { symbol: 'G', degree: 'V (Dominanta)', role: 'Ekscytacja i napięcie' },
      { symbol: 'Am', degree: 'vi (Paralela molowa)', role: 'Uczuciowy, głęboki zwrot' },
      { symbol: 'F', degree: 'IV (Subdominanta)', role: 'Wzruszające, otwarte uniesienie' },
    ],
  },
  {
    id: 'emotional_ballad',
    name: 'Wzruszająca Ballada (vi - IV - I - V)',
    genre: 'Pop / Emocjonalny Pop / Muzyka Filmowa',
    structure: 'Pętla Balladowa',
    description: 'Zaczyna się od intymnego smutku, przechodzi przez nadzieję i wraca przez dom do napięcia. Motyw setek piosenek miłosnych.',
    key: 'C-dur',
    steps: [
      { symbol: 'Am', degree: 'vi', role: 'Melancholijny początek opowieści' },
      { symbol: 'F', degree: 'IV', role: 'Promień nadziei i otwarcie' },
      { symbol: 'C', degree: 'I', role: 'Czyste ciepło i akceptacja' },
      { symbol: 'G', degree: 'V', role: 'Napięcie napędzające kolejny obrót' },
    ],
  },
  {
    id: 'royal_pop_8',
    name: 'Królewska 8-Akordowa Progresja (I - V - vi - IV - I - V - IV - I)',
    genre: 'Pop / Muzyka Filmowa / Hymny',
    structure: 'Podwójny Łuk Narracyjny',
    description: 'Długa, epicka progresja dająca wrażenie wielkiej opowieści i pełnego domknięcia łuku narracyjnego bez powtarzania krótkiej pętli.',
    key: 'C-dur',
    steps: [
      { symbol: 'C', degree: 'I', role: 'Uroczysty punkt startowy' },
      { symbol: 'G', degree: 'V', role: 'Wzrost energii' },
      { symbol: 'Am', degree: 'vi', role: 'Emocjonalny zwrot' },
      { symbol: 'F', degree: 'IV', role: 'Otwarte uniesienie' },
      { symbol: 'C', degree: 'I', role: 'Ugruntowanie w połowie drogi' },
      { symbol: 'G', degree: 'V', role: 'Ostateczne spięcie' },
      { symbol: 'F', degree: 'IV', role: 'Wielka kulminacja' },
      { symbol: 'C', degree: 'I', role: 'Spokojne domknięcie symetrii' },
    ],
  },
  {
    id: 'doo_wop_50s',
    name: 'Doo-Wop & Romantyczne Retro (I - vi - IV - V)',
    genre: 'Pop / Retro 50s / Soul',
    structure: 'Retro Turnaround',
    description: 'Słynna progresja "Stand By Me" Bena E. Kinga i niezliczonych romantycznych ballad lat 50. i 60.',
    key: 'C-dur',
    steps: [
      { symbol: 'C', degree: 'I', role: 'Słodki, czysty początek' },
      { symbol: 'Am', degree: 'vi', role: 'Romantyczna tęsknota' },
      { symbol: 'F', degree: 'IV', role: 'Ciepłe wyznanie' },
      { symbol: 'G', degree: 'V', role: 'Oczekiwanie na pocałunek' },
    ],
  },
  {
    id: 'beatles_chromatic_aug',
    name: 'Wznosząca Linia Chromatyczna & Beatles (I - Iaug - I6 - I7)',
    genre: 'Pop / The Beatles / David Bowie / Film',
    structure: 'Chromatyczny Cliché Kwinty',
    description: 'Legendarne chromatyczne wznoszenie kwinty (C -> Caug -> C6 -> C7), użyte w hitach The Beatles ("It\'s Only Love"), Davida Bowie ("Life on Mars"), motywach szpiegowskich i musicalach.',
    key: 'C-dur',
    steps: [
      { symbol: 'C', degree: 'I (Tonika)', role: 'Czysty, stabilny punkt wyjścia' },
      { symbol: 'Caug', degree: 'Iaug (Zwiększony)', role: 'Tajemnicze, kosmiczne uniesienie kwinty (G -> G#)' },
      { symbol: 'C6', degree: 'I6 (Z sekstą)', role: 'Rozwiązanie w słodki, swingujący akord z sekstą (G# -> A)' },
      { symbol: 'C7', degree: 'I7 (Dominanta)', role: 'Mocne dążenie do subdominanty (A -> Bb)' },
    ],
  },

  // ==========================================
  // 2. ROCK & ALTERNATYWA
  // ==========================================
  {
    id: 'rock_stadium_ballad',
    name: 'Stadionowa Ballada Rockowa (Zwrotka ➔ Refren ➔ Bridge / Solo)',
    genre: 'Rock / Ballada Stadionowa (Aerosmith, Bon Jovi)',
    structure: 'Zwrotka ➔ Refren ➔ Bridge',
    description: 'Stadionowy hymn rockowy z andaluzyjskim zjazdem w zwrotce, eksplozją energii durowej w refrenie i podniosłym bridge\'em pod gitarową solówkę.',
    key: 'A-moll',
    steps: [
      { symbol: 'Am', degree: 'i', role: 'Nastrojowy, cichy arpeggio gitary w zwrotce', section: 'Zwrotka' },
      { symbol: 'G', degree: 'VII', role: 'Krok basu w dół', section: 'Zwrotka' },
      { symbol: 'F', degree: 'VI', role: 'Ciężkie zawieszenie emocjonalne', section: 'Zwrotka' },
      { symbol: 'E', degree: 'V', role: 'Klasyczna rockowa dominanta', section: 'Zwrotka' },
      { symbol: 'C', degree: 'III (Względny dur)', role: 'Wybuch przesterowanych gitar w durowym blasku', section: 'Refren' },
      { symbol: 'G', degree: 'VII', role: 'Stadionowy zaśpiew refrenu', section: 'Refren' },
      { symbol: 'Dm', degree: 'iv', role: 'Zadziorny akcent subdominantowy', section: 'Refren' },
      { symbol: 'F', degree: 'VI', role: 'Mocne podtrzymanie refrenu przed powtórzeniem', section: 'Refren' },
      { symbol: 'F', degree: 'VI', role: 'Początek gitarowego solo, uniesienie', section: 'Bridge' },
      { symbol: 'C', degree: 'III', role: 'Rozjaśnienie brzmienia', section: 'Bridge' },
      { symbol: 'G', degree: 'VII', role: 'Dążenie do szczytu dynamiki', section: 'Bridge' },
      { symbol: 'Am', degree: 'i', role: 'Powrót do potężnego molowego riffu', section: 'Bridge' },
    ],
  },
  {
    id: 'rock_hard_anthem',
    name: 'Hard Rock & Heavy Anthem (Zwrotka ➔ Refren ➔ Bridge)',
    genre: 'Rock / Hard Rock / Heavy (AC/DC, Iron Maiden)',
    structure: 'Zwrotka ➔ Refren ➔ Bridge',
    description: 'Drapieżny, potężny schemat gitarowy z surowym riffem zwrotki, nośnym refrenem chóralnym i dominantowym spięciem na E7 w bridge\'u.',
    key: 'A-moll',
    steps: [
      { symbol: 'Am', degree: 'i', role: 'Tnący riff zwrotki', section: 'Zwrotka' },
      { symbol: 'G', degree: 'VII', role: 'Mocne uderzenie stopy perkusji', section: 'Zwrotka' },
      { symbol: 'F', degree: 'VI', role: 'Zjazd basowy ku podłodze', section: 'Zwrotka' },
      { symbol: 'G', degree: 'VII', role: 'Zwrotka zapętla się do początku', section: 'Zwrotka' },
      { symbol: 'C', degree: 'III', role: 'Hymnowy refren chóralny', section: 'Refren' },
      { symbol: 'G', degree: 'VII', role: 'Energia na pełnych obrotach', section: 'Refren' },
      { symbol: 'Am', degree: 'i', role: 'Ciężka, surowa tonika', section: 'Refren' },
      { symbol: 'F', degree: 'VI', role: 'Dojście do punktu wrzenia', section: 'Refren' },
      { symbol: 'Dm', degree: 'iv', role: 'Mroczny break-down rytmiczny', section: 'Bridge' },
      { symbol: 'F', degree: 'VI', role: 'Budowanie ściany dźwięku', section: 'Bridge' },
      { symbol: 'G', degree: 'VII', role: 'Crescendo całego zespołu', section: 'Bridge' },
      { symbol: 'E7', degree: 'V7', role: 'Piekielne dominantowe uderzenie przed solo!', section: 'Bridge' },
    ],
  },
  {
    id: 'rock_grunge_90s',
    name: 'Grunge & 90s Alternative (Zwrotka ➔ Refren Dorycki)',
    genre: 'Rock / Grunge / Seattle Sound (Nirvana, Soundgarden)',
    structure: 'Cicha Zwrotka ➔ Przesterowany Refren',
    description: 'Słynny zabieg stylu grunge: dynamiczny kontrast cicho-głośno, gdzie molowa zwrotka przełamuje się doryckim akordem D-dur w refrenie.',
    key: 'A-moll',
    steps: [
      { symbol: 'Am', degree: 'i', role: 'Brudna, melancholijna gitara clean w zwrotce', section: 'Zwrotka' },
      { symbol: 'C', degree: 'III', role: 'Szorstki akord durowy', section: 'Zwrotka' },
      { symbol: 'F', degree: 'VI', role: 'Opadający bas', section: 'Zwrotka' },
      { symbol: 'Dm', degree: 'iv', role: 'Duszny, piwniczny klimat', section: 'Zwrotka' },
      { symbol: 'Am', degree: 'i', role: 'Eksplozja pedału Distortion / Fuzz!', section: 'Refren' },
      { symbol: 'C', degree: 'III', role: 'Krzyk wokalisty i pełna ściana gitar', section: 'Refren' },
      { symbol: 'D', degree: 'IV (Dorycki)', role: 'Niezwykły durowy IV stopień (charakterystyczna skala dorycka)', section: 'Refren' },
      { symbol: 'F', degree: 'VI', role: 'Potężny, brudny finał taktu', section: 'Refren' },
    ],
  },
  {
    id: 'rock_classic_folk',
    name: 'Classic Rock & Folk Rock (Hey Jude / Sweet Home)',
    genre: 'Rock / Classic Rock lat 70. (Beatles, Skynyrd)',
    structure: 'Zwrotka ➔ Rockowy Hymn z bVII',
    description: 'Kwintesencja klasycznego rocka lat 70. Akord bVII (B-dur/Bb) w refrenie nadaje niepowtarzalny rockowy zaśpiew "Na-na-na-na".',
    key: 'C-dur',
    steps: [
      { symbol: 'C', degree: 'I', role: 'Słoneczny, ciepły wstęp fortepianu/akustyka', section: 'Zwrotka' },
      { symbol: 'G', degree: 'V', role: 'Płynna dominanta zwrotkowa', section: 'Zwrotka' },
      { symbol: 'F', degree: 'IV', role: 'Folkowy oddech subdominanty', section: 'Zwrotka' },
      { symbol: 'C', degree: 'I', role: 'Lądowanie w domu', section: 'Zwrotka' },
      { symbol: 'C', degree: 'I', role: 'Początek słynnego chóralnego finału', section: 'Refren' },
      { symbol: 'A#', degree: 'bVII (B-dur / Bb)', role: 'Epicki miksolidyjski akord całotonowy "Na-na-na"', section: 'Refren' },
      { symbol: 'F', degree: 'IV', role: 'Subdominanta łącząca frazy', section: 'Refren' },
      { symbol: 'C', degree: 'I', role: 'Ekstatyczny powrót do toniki', section: 'Refren' },
    ],
  },
  {
    id: 'rock_prog_psychedelic',
    name: 'Psychedelic & Space Rock (Pink Floyd / Muse)',
    genre: 'Rock / Progresywny / Psychodeliczny',
    structure: 'Kosmiczna Odyseja Harmoniczna',
    description: 'Hipnotyzująca, kosmiczna narracja w stylu "Comfortably Numb" i "Knights of Cydonia". Płynący bas i dominantowe uniesienie.',
    key: 'A-moll',
    steps: [
      { symbol: 'Am', degree: 'i', role: 'Mroczny, pulsujący bas w stylu "Echoes"', section: 'Część A' },
      { symbol: 'G', degree: 'VII', role: 'Falowanie syntezatora', section: 'Część A' },
      { symbol: 'F', degree: 'VI', role: 'Zawieszenie w próżni', section: 'Część A' },
      { symbol: 'Dm', degree: 'iv', role: 'Głęboki pogłos', section: 'Część A' },
      { symbol: 'Am', degree: 'i', role: 'Narastający trans', section: 'Część B' },
      { symbol: 'C', degree: 'III', role: 'Błysk światła wśród gwiazd', section: 'Część B' },
      { symbol: 'D', degree: 'IV', role: 'Majestatyczny dorycki akord przestrzenny', section: 'Część B' },
      { symbol: 'E7', degree: 'V7', role: 'Płomienna kulminacja przed solówką', section: 'Część B' },
    ],
  },
  {
    id: 'andalusian_cadence',
    name: 'Kadencja Andaluzyjska (i - VII - VI - V)',
    genre: 'Rock / Flamenco / Gitara Hiszpańska',
    structure: 'Opadający Bas Andaluzyjski',
    description: 'Dramatyczny ruch basu schodzący po kolei o cały ton, kończący się na płomiennej dominancie. Klasyk gitary rockowej i hiszpańskiej.',
    key: 'A-moll',
    steps: [
      { symbol: 'Am', degree: 'i', role: 'Mroczny, hiszpański motyw' },
      { symbol: 'G', degree: 'VII', role: 'Schodek w dół z dumą' },
      { symbol: 'F', degree: 'VI', role: 'Dramatyczne zawieszenie' },
      { symbol: 'E', degree: 'V (durowa dominanta)', role: 'Płomienne, hiszpańskie napięcie' },
    ],
  },

  // ==========================================
  // 3. MUZYKA FILMOWA & SOUNDTRACKI
  // ==========================================
  {
    id: 'film_fantasy_epic',
    name: 'Epopeja Fantasy & Władca Pierścieni (Zwrotka Mroczna ➔ Kulminacja)',
    genre: 'Film / Fantasy Score (Howard Shore, Zimmer)',
    structure: 'Część Mroczna (Zwrotka) ➔ Triumfalny Hymn (Refren)',
    description: 'Rozbudowana, 12-akordowa suita symfoniczna. Opowieść zaczyna się w cieniu niebezpieczeństwa, przechodzi przez dramatyczny Bdim, a kończy triumfalnym hymnem nadziei.',
    key: 'A-moll',
    steps: [
      { symbol: 'Am', degree: 'i', role: 'Cienie Mordoru i pradawna tajemnica', section: 'Zwrotka' },
      { symbol: 'G', degree: 'VII', role: 'Krok w nieznane pustkowia', section: 'Zwrotka' },
      { symbol: 'F', degree: 'VI', role: 'Dramat samotnej wędrówki', section: 'Zwrotka' },
      { symbol: 'Em', degree: 'v', role: 'Zimny, surowy wiatr północy', section: 'Zwrotka' },
      { symbol: 'Dm', degree: 'iv', role: 'Ciężar nieuchronnego losu', section: 'Zwrotka' },
      { symbol: 'Am', degree: 'i', role: 'Chwilowe zatrzymanie orkiestry', section: 'Zwrotka' },
      { symbol: 'Bdim', degree: 'ii° (Zmniejszony)', role: 'Maksymalny suspens i śmiertelne niebezpieczeństwo', section: 'Zwrotka' },
      { symbol: 'E7', degree: 'V7', role: 'Wrota przeznaczenia otwierają się!', section: 'Zwrotka' },
      { symbol: 'C', degree: 'III', role: 'Promień słońca nad białą wieżą', section: 'Refren' },
      { symbol: 'G', degree: 'VII', role: 'Marsz armii dobra', section: 'Refren' },
      { symbol: 'Am', degree: 'i', role: 'Wzruszająca ofiara bohaterów', section: 'Refren' },
      { symbol: 'F', degree: 'VI', role: 'Triumfalne domknięcie symfonii', section: 'Refren' },
    ],
  },
  {
    id: 'film_zimmer_cosmos',
    name: 'Hans Zimmer: Hipnotyczny Kosmos (Interstellar / Inception)',
    genre: 'Film / Hans Zimmer / Sci-Fi Score',
    structure: 'Hipnotyczna Fala Przestrzeni',
    description: 'Pulsujący, nieskończony trans emocjonalny. Dźwięki organów i smyczków wędrują między molową tęsknotą a mistyczną przestrzenią wszechświata.',
    key: 'A-moll',
    steps: [
      { symbol: 'Am', degree: 'i', role: 'Ciche tykanie zegara i samotność w próżni', section: 'Część A' },
      { symbol: 'F', degree: 'VI', role: 'Potężna ściana smyczków i organów', section: 'Część A' },
      { symbol: 'C', degree: 'III', role: 'Niezmierzony majestat czarnej dziury', section: 'Część A' },
      { symbol: 'Em', degree: 'v', role: 'Zimne piękno kosmosu', section: 'Część A' },
      { symbol: 'Am', degree: 'i', role: 'Powrót fali z podwojoną dynamiką', section: 'Część B' },
      { symbol: 'F', degree: 'VI', role: 'Maksymalne crescendo orkiestrowe', section: 'Część B' },
      { symbol: 'Dm', degree: 'iv', role: 'Dramatyczne pytanie bez odpowiedzi', section: 'Część B' },
      { symbol: 'E', degree: 'V', role: 'Płomienny horyzont zdarzeń', section: 'Część B' },
    ],
  },
  {
    id: 'film_thriller_noir',
    name: 'Thriller Noir & Kryminał (Fincher, Batman, Chinatown)',
    genre: 'Film / Thriller / Kryminał Noir',
    structure: 'Motyw Zagrożenia ➔ Śmiertelny Suspens',
    description: 'Mroczny, dymny klimat zadymionego baru i pościgu na mokrej ulicy. Akord zmniejszony ii° buduje mrożący krew w żyłach suspens.',
    key: 'A-moll',
    steps: [
      { symbol: 'Am', degree: 'i', role: 'Dymny deszcz na brukowanych ulicach', section: 'Motyw' },
      { symbol: 'F', degree: 'VI', role: 'Cień detektywa pod latarnią', section: 'Motyw' },
      { symbol: 'Dm', degree: 'iv', role: 'Niebezpieczne odkrycie w aktach sprawy', section: 'Motyw' },
      { symbol: 'E7', degree: 'V7', role: 'Uderzenie serca w ciemnym zaułku', section: 'Motyw' },
      { symbol: 'Am', degree: 'i', role: 'Zbliżające się kroki mordercy', section: 'Suspens' },
      { symbol: 'F', degree: 'VI', role: 'Osaczenie bez wyjścia', section: 'Suspens' },
      { symbol: 'Bdim', degree: 'ii° (Zmniejszony)', role: 'Mrożący krew w żyłach dysonans suspensu', section: 'Suspens' },
      { symbol: 'E7', degree: 'V7', role: 'Ostateczne pociągnięcie za spust', section: 'Suspens' },
    ],
  },
  {
    id: 'film_magic_adventure',
    name: 'Magiczna Przygoda & Sci-Fi (John Williams / Spielberg)',
    genre: 'Film / Kino Przygodowe (Star Wars, Jurassic Park)',
    structure: 'Motyw Cudowności ➔ Epickie Odkrycie',
    description: 'Legendarna chromatyczna medianta (C ➔ Ab) użyta w Gwiezdnych Wojnach i Parku Jurajskim, dająca moment natychmiastowego zachwytu i cudu.',
    key: 'C-dur',
    steps: [
      { symbol: 'C', degree: 'I', role: 'Stabilny świat codzienności bohatera', section: 'Motyw' },
      { symbol: 'G#', degree: 'bVI (Chromatyczna medianta Ab)', role: 'Nagle wrota do innego wymiaru otwierają się!', section: 'Motyw' },
      { symbol: 'C', degree: 'I', role: 'Powrót do rzeczywistości z zachwytem', section: 'Motyw' },
      { symbol: 'G#', degree: 'bVI', role: 'Drugie, jeszcze potężniejsze uniesienie wyobraźni', section: 'Motyw' },
      { symbol: 'Fmaj7', degree: 'IVmaj7', role: 'Aksamitny lot nad fantastyczną krainą', section: 'Odkrycie' },
      { symbol: 'Fm', degree: 'iv (Zapożyczenie molowe)', role: 'Łza wzruszenia na twarzy widza', section: 'Odkrycie' },
      { symbol: 'C', degree: 'I', role: 'Wielka chwała i triumf', section: 'Odkrycie' },
      { symbol: 'G', degree: 'V', role: 'Rozbieg przed kolejną wielką przygodą', section: 'Odkrycie' },
    ],
  },
  {
    id: 'epic_cinematic',
    name: 'Epicki Dramat Filmowy (i - VI - III - VII - iv - i - VI - V7)',
    genre: 'Film / Epik / Hans Zimmer',
    structure: 'Kinowy Cykl 8 Akordów',
    description: 'Potężny 8-akordowy cykl molowy o kinowym rozmachu, budujący narastający suspens.',
    key: 'A-moll',
    steps: [
      { symbol: 'Am', degree: 'i', role: 'Mroczny początek' },
      { symbol: 'F', degree: 'VI', role: 'Potężny wybuch emocji' },
      { symbol: 'C', degree: 'III', role: 'Promień światła' },
      { symbol: 'G', degree: 'VII', role: 'Marsz basu' },
      { symbol: 'Dm', degree: 'iv', role: 'Głęboki dramat' },
      { symbol: 'Am', degree: 'i', role: 'Ciemność' },
      { symbol: 'F', degree: 'VI', role: 'Zawieszenie' },
      { symbol: 'E7', degree: 'V7', role: 'Płonący punkt kulminacyjny' },
    ],
  },
  {
    id: 'dreamy_augmented',
    name: 'Kosmiczna Nostalgia z Akordem Zwiększonym (I - Iaug - IV - iv)',
    genre: 'Film / Neo-Soul / Muzyka Filmowa',
    structure: 'Kosmiczna Pętla Zwiększona',
    description: 'Poetycka progresja z akordem zwiększonym i melancholijnym zapożyczeniem molowym, dająca wrażenie unoszenia się w kosmosie.',
    key: 'C-dur',
    steps: [
      { symbol: 'C', degree: 'I (Tonika)', role: 'Spokój i stabilność' },
      { symbol: 'Caug', degree: 'Iaug (Zwiększony)', role: 'Nierzeczywisty, hipnotyzujący impuls w górę' },
      { symbol: 'F', degree: 'IV (Subdominanta)', role: 'Ciepłe, świetliste otwarcie przestrzeni' },
      { symbol: 'Fm', degree: 'iv (Zapożyczenie molowe)', role: 'Wzruszające, kinowe domknięcie pętli' },
    ],
  },

  // ==========================================
  // 4. JAZZ & BOSSA NOVA
  // ==========================================
  {
    id: 'jazz_autumn_leaves',
    name: 'Standard Jazzowy AABA (Autumn Leaves / Jesienne Liście)',
    genre: 'Jazz / Standard Jazzowy / Bossa',
    structure: 'Część A (Durowa 2-5-1) ➔ Część B (Molowa 2-5-1)',
    description: 'Najważniejszy standard w edukacji jazzowej. Zawiera w sobie dwie najważniejsze kadencje: durową ii-V-I oraz molową iiø-V-i.',
    key: 'A-moll',
    steps: [
      { symbol: 'Dm7', degree: 'iv7', role: 'Klimatyczny wstęp na subdominancie molowej', section: 'Część A' },
      { symbol: 'G7', degree: 'VII7', role: 'Dominanta septymowa w kole kwintowym', section: 'Część A' },
      { symbol: 'Cmaj7', degree: 'IIImaj7', role: 'Aksamitne lądowanie w durowej tonice', section: 'Część A' },
      { symbol: 'Fmaj7', degree: 'VImaj7', role: 'Szlachetne rozjaśnienie harmonii', section: 'Część A' },
      { symbol: 'Bdim', degree: 'iiø (Bm7b5)', role: 'Święty Graal jazzu molowego: półzmniejszony', section: 'Część B' },
      { symbol: 'E7', degree: 'V7', role: 'Napięta dominanta alterowana', section: 'Część B' },
      { symbol: 'Am', degree: 'i', role: 'Głębokie uspokojenie w molowej tonice', section: 'Część B' },
      { symbol: 'Am', degree: 'i', role: 'Utrzymanie swingującego pulsu', section: 'Część B' },
      { symbol: 'Dm7', degree: 'iv7', role: 'Ponowne otwarcie cyklu kwintowego', section: 'Finał' },
      { symbol: 'G7', degree: 'VII7', role: 'Ruch basu o kwintę w dół', section: 'Finał' },
      { symbol: 'Bdim', degree: 'iiø', role: 'Ostatnie zawieszenie jazzowe', section: 'Finał' },
      { symbol: 'E7', degree: 'V7', role: 'Dominantowe zaproszenie do improwizacji', section: 'Finał' },
    ],
  },
  {
    id: 'jazz_rhythm_changes',
    name: 'Rhythm Changes & Bebop (Gershwin / Charlie Parker)',
    genre: 'Jazz / Swing / Bebop',
    structure: 'Część A (Podwójny Turnaround Bebopowy)',
    description: 'Fundament setek utworów ery swingu i bebopu ("I Got Rhythm", "Anthropology"). Kołyszący cykl turnaroundów z dominantą wtrąconą A7.',
    key: 'C-dur',
    steps: [
      { symbol: 'Cmaj7', degree: 'Imaj7', role: 'Główny temat swingu', section: 'Obieg 1' },
      { symbol: 'Am7', degree: 'vi7', role: 'Kołysząca paralela molowa', section: 'Obieg 1' },
      { symbol: 'Dm7', degree: 'ii7', role: 'Drugi stopień przygotowujący dominantę', section: 'Obieg 1' },
      { symbol: 'G7', degree: 'V7', role: 'Klasyczna dominanta swingowa', section: 'Obieg 1' },
      { symbol: 'Em7', degree: 'iii7', role: 'Zastępstwo toniki (medianta)', section: 'Obieg 2' },
      { symbol: 'A7', degree: 'V7/ii (Dominanta wtrącona)', role: 'Pikantna dominanta wiodąca prosto do Dm7!', section: 'Obieg 2' },
      { symbol: 'Dm7', degree: 'ii7', role: 'Rozwiązanie dominanty wtrąconej', section: 'Obieg 2' },
      { symbol: 'G7', degree: 'V7', role: 'Turnaround zamykający frazę', section: 'Obieg 2' },
    ],
  },
  {
    id: 'jazz_coltrane_changes',
    name: 'Coltrane Changes & Giant Steps (Kosmiczny Cykl Tercjowy)',
    genre: 'Jazz / Modern Jazz / John Coltrane',
    structure: 'Symetria Wielkich Tercji Coltrane\'a',
    description: 'Szczytowe osiągnięcie zaawansowanej harmonii jazzowej Johna Coltrane\'a. Modulacje po wielkich tercjach dzielące oktawę na 3 równe części.',
    key: 'C-dur',
    steps: [
      { symbol: 'Cmaj7', degree: 'Imaj7', role: 'Centrum tonalne 1 (C)', section: 'Centrum 1' },
      { symbol: 'D#7', degree: 'V7/bVI (Eb7)', role: 'Dominanta przygotowująca skok o tercję wielką w dół', section: 'Centrum 1' },
      { symbol: 'G#maj7', degree: 'bVImaj7 (Abmaj7)', role: 'Centrum tonalne 2 (Ab)', section: 'Centrum 2' },
      { symbol: 'B7', degree: 'V7/III', role: 'Dominanta przygotowująca kolejny skok tercjowy', section: 'Centrum 2' },
      { symbol: 'Emaj7', degree: 'IIImaj7', role: 'Centrum tonalne 3 (E)', section: 'Centrum 3' },
      { symbol: 'Dm7', degree: 'ii7', role: 'Początek tradycyjnej kadencji powrotnej', section: 'Powrót' },
      { symbol: 'G7', degree: 'V7', role: 'Dominanta spinająca cały cykl', section: 'Powrót' },
      { symbol: 'Cmaj7', degree: 'Imaj7', role: 'Triumfalne domknięcie geometrycznego trójkąta Coltrane\'a', section: 'Powrót' },
    ],
  },
  {
    id: 'jazz_bossa_nova',
    name: 'Bossa Nova & Rio De Janeiro (Dziewczyna z Ipanemy / Jobim)',
    genre: 'Jazz / Bossa Nova / Brazylijski Jazz',
    structure: 'Ciepły Temat Bossa Novy',
    description: 'Zmysłowy, ciepły powiew plaży Ipanema. Niezwykły akord D7 (durowa dominanta na II stopniu) nadaje charakterystyczną brazylijską lekkość.',
    key: 'C-dur',
    steps: [
      { symbol: 'Cmaj7', degree: 'Imaj7', role: 'Aksamitna bryza Copacabany', section: 'Temat' },
      { symbol: 'D7', degree: 'II7 (Dominanta na II stopniu)', role: 'Magiczny znak rozpoznawczy bossa novy!', section: 'Temat' },
      { symbol: 'Dm7', degree: 'ii7', role: 'Zmiękczenie do subdominanty molowej', section: 'Temat' },
      { symbol: 'G7', degree: 'V7', role: 'Leniwy, ciepły rytm basu', section: 'Temat' },
      { symbol: 'Em7', degree: 'iii7', role: 'Wyjście w górne rejestry', section: 'Rozwinięcie' },
      { symbol: 'A7', degree: 'VI7 (Dominanta wtórna)', role: 'Brazylijski zwrot harmoniczny', section: 'Rozwinięcie' },
      { symbol: 'Dm7', degree: 'ii7', role: 'Krok w dół', section: 'Rozwinięcie' },
      { symbol: 'G7', degree: 'V7', role: 'Lekki turnaround na koniec frazy', section: 'Rozwinięcie' },
    ],
  },
  {
    id: 'jazz_two_five_one',
    name: 'Jazzowa Kadencja 2-5-1 (ii - V - I)',
    genre: 'Jazz / Bossa Nova / R&B',
    structure: 'Złota Kadencja Jazzowa',
    description: 'Święty Graal harmonii jazzowej. Płynny ruch kwintowy basu w dół z subtelnym napięciem septym.',
    key: 'C-dur',
    steps: [
      { symbol: 'Dm7', degree: 'ii (Subdominanta)', role: 'Klimatyczny, soulowy wstęp' },
      { symbol: 'G7', degree: 'V7 (Dominanta septymowa)', role: 'Maksymalne napięcie trytonu' },
      { symbol: 'Cmaj7', degree: 'IMaj7 (Tonika z wielką septymą)', role: 'Aksamitne, wyrafinowane ukojenie' },
    ],
  },
  {
    id: 'lofi_neosoul',
    name: 'Neo-Soul & Lo-Fi Chill (IVmaj7 - iii7 - vi7 - I)',
    genre: 'Jazz / Lo-Fi Hip-Hop / Neo-Soul',
    structure: 'Relaksujący Obieg Neo-Soul',
    description: 'Ciepłe, jazzujące akordy o bogatym brzmieniu, tworzące przytulny, relaksujący klimat kawiarni lub nocnego chilloutu.',
    key: 'C-dur',
    steps: [
      { symbol: 'Fmaj7', degree: 'IVmaj7', role: 'Aksamitna chmura dźwięku' },
      { symbol: 'Em7', degree: 'iii7', role: 'Łagodny zjazd w dół' },
      { symbol: 'Am7', degree: 'vi7', role: 'Głęboki, ciepły bas' },
      { symbol: 'C', degree: 'I', role: 'Delikatne podsumowanie frazy' },
    ],
  },

  // ==========================================
  // 5. BLUES & GOSPEL
  // ==========================================
  {
    id: 'blues_12_bar_complete',
    name: 'Kompletny 12-Taktowy Blues z Quick Change i Turnaroundem',
    genre: 'Blues / Delta & Chicago Blues',
    structure: 'Takt 1-4 (Temat) ➔ Takt 5-8 (Subdominanta) ➔ Takt 9-12 (Turnaround)',
    description: 'Autentyczna, pełna 12-taktowa forma bluesowa z szybką zmianą na subdominantę w takcie 2 oraz dominantowym turnaroundem zamykającym pętlę.',
    key: 'C-dur',
    steps: [
      { symbol: 'C7', degree: 'I7', role: 'Takt 1: Otwarcie riffu bluesowego', section: 'Takt 1-4' },
      { symbol: 'F7', degree: 'IV7 (Quick-Change)', role: 'Takt 2: Słynny szybki skok na subdominantę', section: 'Takt 1-4' },
      { symbol: 'C7', degree: 'I7', role: 'Takt 3: Powrót do bazy riffu', section: 'Takt 1-4' },
      { symbol: 'C7', degree: 'I7', role: 'Takt 4: Przygotowanie wyjścia na IV stopień', section: 'Takt 1-4' },
      { symbol: 'F7', degree: 'IV7', role: 'Takt 5: Wyjście w górę na subdominantę', section: 'Takt 5-8' },
      { symbol: 'F7', degree: 'IV7', role: 'Takt 6: Kontynuacja bluesowego zaśpiewu', section: 'Takt 5-8' },
      { symbol: 'C7', degree: 'I7', role: 'Takt 7: Powrót do toniki', section: 'Takt 5-8' },
      { symbol: 'C7', degree: 'I7', role: 'Takt 8: Budowanie napięcia przed dominantą', section: 'Takt 5-8' },
      { symbol: 'G7', degree: 'V7', role: 'Takt 9: Szczyt napięcia dominanty!', section: 'Takt 9-12' },
      { symbol: 'F7', degree: 'IV7', role: 'Takt 10: Opadający krok w dół', section: 'Takt 9-12' },
      { symbol: 'C7', degree: 'I7', role: 'Takt 11: Rozwiązanie w tonikę', section: 'Takt 9-12' },
      { symbol: 'G7', degree: 'V7 (Turnaround)', role: 'Takt 12: Turnaround napędzający kolejny chorus!', section: 'Takt 9-12' },
    ],
  },
  {
    id: 'blues_minor_king',
    name: 'Smutny Minor Blues (B.B. King / The Thrill Is Gone)',
    genre: 'Blues / Minor Blues (B.B. King)',
    structure: 'Takt 1-4 (Żal) ➔ Takt 5-8 (Płacz) ➔ Takt 9-12 (Dramatyczny F7)',
    description: 'Najbardziej poruszająca odmiana bluesa. Zamiast standardowej dominanty, w takcie 9 pojawia się zaskakujący, dramatyczny akord F7 (bVI7).',
    key: 'A-moll',
    steps: [
      { symbol: 'Am7', degree: 'i7', role: 'Takt 1: Bolesny, powolny motyw gitary', section: 'Takt 1-4' },
      { symbol: 'Am7', degree: 'i7', role: 'Takt 2: Głęboki molowy groove', section: 'Takt 1-4' },
      { symbol: 'Am7', degree: 'i7', role: 'Takt 3: Surowa tęsknota', section: 'Takt 1-4' },
      { symbol: 'Am7', degree: 'i7', role: 'Takt 4: Przygotowanie do skoku', section: 'Takt 1-4' },
      { symbol: 'Dm7', degree: 'iv7', role: 'Takt 5: Płaczliwe wejście subdominanty', section: 'Takt 5-8' },
      { symbol: 'Dm7', degree: 'iv7', role: 'Takt 6: Podtrzymanie lamentu', section: 'Takt 5-8' },
      { symbol: 'Am7', degree: 'i7', role: 'Takt 7: Opadnięcie na tonikę', section: 'Takt 5-8' },
      { symbol: 'Am7', degree: 'i7', role: 'Takt 8: Chwila ciszy przed burzą', section: 'Takt 5-8' },
      { symbol: 'F7', degree: 'bVI7', role: 'Takt 9: Szokujący, dramatyczny akord F7 zamiast dominanty!', section: 'Takt 9-12' },
      { symbol: 'E7', degree: 'V7', role: 'Takt 10: Dominanta septymowa domagająca się ulgi', section: 'Takt 9-12' },
      { symbol: 'Am7', degree: 'i7', role: 'Takt 11: Zmęczone ukojenie', section: 'Takt 9-12' },
      { symbol: 'E7', degree: 'V7', role: 'Takt 12: Turnaround zapraszający do kolejnej zwrotki', section: 'Takt 9-12' },
    ],
  },
  {
    id: 'blues_gospel_soul',
    name: 'Gospel Blues z Akordem Zmniejszonym (Ray Charles / Nowy Orlean)',
    genre: 'Blues / Gospel & New Orleans Soul',
    structure: 'Kościelny Groove ➔ Chromatyczny Bas',
    description: 'Południowy gospel-blues z genialnym przejściem chromatycznym basu F ➔ F#dim ➔ C, tworzącym radosny, uduchowiony klimat kościołów Południa.',
    key: 'C-dur',
    steps: [
      { symbol: 'C', degree: 'I', role: 'Radosne fortepianowe intro', section: 'Część 1' },
      { symbol: 'C7', degree: 'I7', role: 'Bluesowe otwarcie w kierunku F', section: 'Część 1' },
      { symbol: 'F', degree: 'IV', role: 'Czysta energia gospel', section: 'Część 1' },
      { symbol: 'F#dim', degree: '#IVdim (Zmniejszony)', role: 'Genialny chromatyczny łącznik basu F ➔ Fis ➔ G!', section: 'Część 1' },
      { symbol: 'C', degree: 'I', role: 'Lądowanie na tonice po podejściu basu', section: 'Część 2' },
      { symbol: 'A7', degree: 'VI7', role: 'Porywający soulowy zwrot ku dominancie', section: 'Część 2' },
      { symbol: 'Dm7', degree: 'ii7', role: 'Płynna subdominanta', section: 'Część 2' },
      { symbol: 'G7', degree: 'V7', role: 'Radosne domknięcie obrotu', section: 'Część 2' },
    ],
  },
  {
    id: 'blues_slow_chicago',
    name: 'Slow Chicago Blues & Shuffle (Muddy Waters / Buddy Guy)',
    genre: 'Blues / Chicago Blues / Shuffle',
    structure: 'Powolny Shuffle Chicagowski',
    description: 'Głęboki, powolny blues chicagowski z mocno zaakcentowanymi septymami i brudnym, mięsistym brzmieniem w dymnym klubie.',
    key: 'C-dur',
    steps: [
      { symbol: 'C7', degree: 'I7', role: 'Ciężki, leniwy shuffle basu i perkusji', section: 'Faza 1' },
      { symbol: 'F7', degree: 'IV7', role: 'Niski zaśpiew harmonijki ustnej', section: 'Faza 1' },
      { symbol: 'C7', degree: 'I7', role: 'Powrót do surowego pulsu', section: 'Faza 1' },
      { symbol: 'C7', degree: 'I7', role: 'Trzymanie rytmu w dymnym klubie', section: 'Faza 1' },
      { symbol: 'F7', degree: 'IV7', role: 'Rozkołysanie subdominantowe', section: 'Faza 2' },
      { symbol: 'G7', degree: 'V7', role: 'Maksymalne napięcie dominanty', section: 'Faza 2' },
      { symbol: 'F7', degree: 'IV7', role: 'Zejście schodkowe w dół', section: 'Faza 2' },
      { symbol: 'C7', degree: 'I7', role: 'Ostateczne uderzenie w tonikę', section: 'Faza 2' },
    ],
  },
  {
    id: 'twelve_bar_blues',
    name: 'Klasyczny Blues Septymowy (I7 - IV7 - I7 - V7 - IV7 - I7)',
    genre: "Blues / Rock'n'Roll / R&B",
    structure: 'Podstawowa Pętla Bluesowa',
    description: 'Fundament muzyki XX wieku. Wszystkie akordy są dominantami septymowymi, tworząc zadziorny, surowy feeling.',
    key: 'C-dur',
    steps: [
      { symbol: 'C7', degree: 'I7', role: 'Bluesowy groove toniki' },
      { symbol: 'F7', degree: 'IV7', role: 'Wyjście na subdominantę' },
      { symbol: 'C7', degree: 'I7', role: 'Powrót do riffu' },
      { symbol: 'G7', degree: 'V7', role: 'Szczyt napięcia dominanty' },
      { symbol: 'F7', degree: 'IV7', role: 'Zjazd w dół' },
      { symbol: 'C7', degree: 'I7', role: 'Bluesowy finał / Turnaround' },
    ],
  },

  // ==========================================
  // 6. KLASYKA & EPOKI MISTRZÓW
  // ==========================================
  {
    id: 'classical_passacaglia_handel',
    name: 'Passacaglia Händla (Barokowy Cykl Kwintowy)',
    genre: 'Klasyka / Barok (G.F. Händel / Halvorsen)',
    structure: 'Kompletne Barokowe Koło Kwintowe',
    description: 'Jeden z najwspanialszych motywów baroku. Bas i akordy wędrują po kompletnym kole kwintowym, dając wrażenie nieubłaganego, majestatycznego przeznaczenia.',
    key: 'A-moll',
    steps: [
      { symbol: 'Am', degree: 'i', role: 'Dostojny początek barokowego tańca', section: 'Część 1' },
      { symbol: 'Dm', degree: 'iv', role: 'Ruch kwintowy w dół (Am ➔ Dm)', section: 'Część 1' },
      { symbol: 'G', degree: 'VII', role: 'Kolejny krok koła kwintowego', section: 'Część 1' },
      { symbol: 'C', degree: 'III', role: 'Chwilowy durowy blask', section: 'Część 1' },
      { symbol: 'F', degree: 'VI', role: 'Majestatyczny krok kwintowy do F', section: 'Część 2' },
      { symbol: 'Bdim', degree: 'ii°', role: 'Dramatyczny akord zmniejszony', section: 'Część 2' },
      { symbol: 'E7', degree: 'V7', role: 'Mocna barokowa dominanta', section: 'Część 2' },
      { symbol: 'Am', degree: 'i', role: 'Nieuchronne, potężne domknięcie koła przeznaczenia', section: 'Część 2' },
    ],
  },
  {
    id: 'classical_la_folia',
    name: 'La Folia & Chaconne (Renesans & Barok)',
    genre: 'Klasyka / Renesans & Barok (Corelli, Vivaldi, Bach)',
    structure: 'Tradycyjny Temat Wariacyjny La Folia',
    description: 'Jedna z najstarszych udokumentowanych progresji europejskich (XV-XVIII w.). Tańce La Folia hipnotyzowały kompozytorów od Bacha po Rachmaninowa.',
    key: 'A-moll',
    steps: [
      { symbol: 'Am', degree: 'i', role: 'Tajemniczy, hiszpański temat przewodni', section: 'Faza 1' },
      { symbol: 'E7', degree: 'V7', role: 'Dominanta z podwyższoną tercją Gis', section: 'Faza 1' },
      { symbol: 'Am', degree: 'i', role: 'Powrót do motywu', section: 'Faza 1' },
      { symbol: 'G', degree: 'VII', role: 'Otwarcie ku tonacji durowej', section: 'Faza 1' },
      { symbol: 'C', degree: 'III', role: 'Jasne rozświetlenie w C-dur', section: 'Faza 2' },
      { symbol: 'G', degree: 'VII', role: 'Ruch basu podtrzymujący taniec', section: 'Faza 2' },
      { symbol: 'Am', degree: 'i', role: 'Powrót do melancholii', section: 'Faza 2' },
      { symbol: 'E7', degree: 'V7', role: 'Dominantowe zawieszenie pod kolejną wariację', section: 'Faza 2' },
    ],
  },
  {
    id: 'classical_beethoven_pathetique',
    name: 'Beethoven: Sonata Patetyczna & Księżycowa (Dramat Romantyczny)',
    genre: 'Klasyka / Romantyzm (L. van Beethoven)',
    structure: 'Ekspozycja Dramatu ➔ Zmniejszona Kulminacja',
    description: 'Burzliwy, pełen pasji romantyzm Beethovena. Niezwykłe zwroty harmoniczne między toniką a dominancją z tragicznym akordem zmniejszonym.',
    key: 'A-moll',
    steps: [
      { symbol: 'Am', degree: 'i', role: 'Potężny, tragiczny akord otwarcia', section: 'Ekspozycja' },
      { symbol: 'E', degree: 'V', role: 'Dojmujące pytanie dominantowe', section: 'Ekspozycja' },
      { symbol: 'F', degree: 'VI', role: 'Rozpaczliwe zerwanie frazy', section: 'Ekspozycja' },
      { symbol: 'Dm', degree: 'iv', role: 'Głęboki lament w niskim rejestrze fortepianu', section: 'Ekspozycja' },
      { symbol: 'Am', degree: 'i', role: 'Narastający tremolo basu', section: 'Kulminacja' },
      { symbol: 'Bdim', degree: 'ii° (Zmniejszony)', role: 'Dramatyczny dysonans patetyczny', section: 'Kulminacja' },
      { symbol: 'E7', degree: 'V7', role: 'Fortissimo dominanty', section: 'Kulminacja' },
      { symbol: 'Am', degree: 'i', role: 'Głuche, ostateczne uderzenie w tonikę', section: 'Kulminacja' },
    ],
  },
  {
    id: 'classical_chopin_prelude',
    name: 'Chopin: Preludium e-moll op. 28 nr 4 (Chromatyczne Opadanie)',
    genre: 'Klasyka / Polski Romantyzm (F. Chopin)',
    structure: 'Chromatyczna Elegia Chopina',
    description: 'Arcydzieło Fryderyka Chopina. Głosy wewnętrzne opadają chromatycznie półton po półtonie, wywołując niewysłowioną polską tęsknotę (żal).',
    key: 'A-moll',
    steps: [
      { symbol: 'Am', degree: 'i', role: 'Niezwykle cichy (pianissimo), bolesny wstęp', section: 'Faza 1' },
      { symbol: 'Am6', degree: 'i6', role: 'Chromatyczne opadnięcie głosu wewnętrznego (A-moll z sekstą Fis)', section: 'Faza 1' },
      { symbol: 'Fmaj7', degree: 'VImaj7', role: 'Wielka septyma przynosząca tęskne westchnienie', section: 'Faza 1' },
      { symbol: 'E7', degree: 'V7', role: 'Dominanta z nieubłaganym ciążeniem', section: 'Faza 1' },
      { symbol: 'Am', degree: 'i', role: 'Kolejny obrót melancholii', section: 'Faza 2' },
      { symbol: 'Dm', degree: 'iv', role: 'Ciemna barwa subdominanty', section: 'Faza 2' },
      { symbol: 'E7', degree: 'V7', role: 'Ostatnie tchnienie przed ciszą', section: 'Faza 2' },
      { symbol: 'Am', degree: 'i', role: 'Puste, pogrążone w smutku ukojenie', section: 'Faza 2' },
    ],
  },
  {
    id: 'classical_mozart_cadence',
    name: 'Mozart: Kadencja Wiedeńska z Zawieszeniem (T-S-D-T)',
    genre: 'Klasyka / Klasycyzm Wiedeński (W.A. Mozart)',
    structure: 'Klasyczna Kadencja z Zawieszeniem sus4',
    description: 'Krystaliczna harmonia Mozarta i Haydna. Zbalansowana, lekka i pełna wdzięku struktura z charakterystycznym zawieszeniem sus4 przed dominantą.',
    key: 'C-dur',
    steps: [
      { symbol: 'C', degree: 'I (Tonika)', role: 'Krystaliczny, elegancki temat klasyczny', section: 'Część 1' },
      { symbol: 'Dm', degree: 'ii', role: 'Lekki krok ku subdominancie', section: 'Część 1' },
      { symbol: 'G', degree: 'V', role: 'Czysta dominanta', section: 'Część 1' },
      { symbol: 'C', degree: 'I', role: 'Perfekcyjne domknięcie zdania muzycznego', section: 'Część 1' },
      { symbol: 'F', degree: 'IV', role: 'Rozwinięcie myśli melodycznej', section: 'Część 2' },
      { symbol: 'Csus4', degree: 'I sus4', role: 'Klasyczne zawieszenie kwarty przed kadencją', section: 'Część 2' },
      { symbol: 'G7', degree: 'V7', role: 'Dominanta septymowa rozwiązująca zawieszenie', section: 'Część 2' },
      { symbol: 'C', degree: 'I', role: 'Królewski finisz w tonice', section: 'Część 2' },
    ],
  },
  {
    id: 'pachelbel_canon',
    name: 'Kanon Pachelbela & Królewski Pop (I - V - vi - iii - IV - I - IV - V)',
    genre: 'Klasyka / Pop / Rock Ballady',
    structure: 'Barokowy Kanon Basowy',
    description: 'Nieśmiertelny fundament muzyki zachodniej. Oparty na płynnie opadającym basie, użyty w setkach światowych przebojów.',
    key: 'C-dur',
    steps: [
      { symbol: 'C', degree: 'I', role: 'Stabilny dom i majestatyczny początek' },
      { symbol: 'G', degree: 'V', role: 'Dominantowe uniesienie' },
      { symbol: 'Am', degree: 'vi', role: 'Melancholijny krok basu w dół' },
      { symbol: 'Em', degree: 'iii', role: 'Ciepła medianta' },
      { symbol: 'F', degree: 'IV', role: 'Jasne otwarcie skrzydeł' },
      { symbol: 'C', degree: 'I', role: 'Chwilowy powrót do bazy' },
      { symbol: 'F', degree: 'IV', role: 'Rozpęd przed kadencją' },
      { symbol: 'G', degree: 'V', role: 'Dominanta zamykająca obieg' },
    ],
  },

  // ==========================================
  // 7. ROZBUDOWANE HARMONIE (add9, sus2, sus4, 6, m6, aug, dim)
  // ==========================================
  {
    id: 'pop_coldplay_add9',
    name: 'Coldplay & Nowoczesny Hymn Pop (add9 / sus2 / 7sus4)',
    genre: 'Pop / Modern Pop (Coldplay, U2, The Script)',
    structure: 'Krystaliczna Przestrzeń Stadionowa',
    description: 'Świetlista, przestrzenna harmonia nowoczesnego popu. Połączenie otwartych zawieszeń sus2 i sus4 z dzwoniącą noną add9 tworzy potężne, wzruszające uniesienie.',
    key: 'C-dur',
    steps: [
      { symbol: 'Cadd9', degree: 'Iadd9 (Dodana nona)', role: 'Słoneczna, krystaliczna tonika z dodaną noną' },
      { symbol: 'Am7', degree: 'vi7', role: 'Ciepła, soulowa paralela molowa' },
      { symbol: 'Fsus2', degree: 'IVsus2 (Zawieszona 2)', role: 'Przestrzenne, otwarte zawieszenie subdominanty' },
      { symbol: 'G7sus4', degree: 'V7sus4 (Zawieszona 4)', role: 'Mocne stadionowe napięcie oczekujące na rozwiązanie' },
      { symbol: 'G', degree: 'V', role: 'Triumfalne rozwiązanie kwarty w tercję dominanty' },
      { symbol: 'Fadd9', degree: 'IVadd9', role: 'Śpiewna, szeroka kulminacja z noną' },
      { symbol: 'Cadd9', degree: 'Iadd9', role: 'Pełne, euforyczne lądowanie w tonice' },
    ],
  },
  {
    id: 'noir_bond_cliche',
    name: 'James Bond & Film Noir (Chromatyczny zjazd z m6 i dim)',
    genre: 'Film / Thriller Noir / Motyw Bonda',
    structure: 'Chromatyczny Cliché Szpiegowski',
    description: 'Legendarny motyw kina szpiegowskiego i czarnego kryminału. Dymna seksta molowa (m6) oraz lodowaty akord zmniejszony dim7 tworzą gęsty suspens.',
    key: 'A-moll',
    steps: [
      { symbol: 'Am', degree: 'i', role: 'Mroczna, samotna tonika molowa pod latarnią' },
      { symbol: 'Am7', degree: 'i7', role: 'Dymne, szpiegowskie napięcie septymowe' },
      { symbol: 'Am6', degree: 'i6 (Seksta molowa)', role: 'Kultowa szpiegowska seksta Bonda (dźwięk Fis) – szczyt klimatu noir' },
      { symbol: 'Dm6', degree: 'iv6', role: 'Ciężki krok subdominantowy z sekstą' },
      { symbol: 'Bdim7', degree: 'ii°7 (Zmniejszony)', role: 'Maksymalny, lodowaty suspens zmniejszony' },
      { symbol: 'Eaug', degree: 'Vaug (Zwiększona dominanta)', role: 'Płomienne, rozdzierające napięcie zwiększonej dominanty' },
      { symbol: 'E7', degree: 'V7', role: 'Ostateczne dominantowe spięcie przed uderzeniem' },
      { symbol: 'Am', degree: 'i', role: 'Zimne, niepokojące ukojenie w ciemności' },
    ],
  },
  {
    id: 'neosoul_bossa_add9_m6',
    name: 'Aksamitny Neo-Soul & Kawiarnia (maj7 / add9 / iv6)',
    genre: 'Neo-Soul / Lo-Fi / Jazz Pop',
    structure: 'Ciepły Obieg z Zapożyczeniem Molowym',
    description: 'Niezwykle zmysłowa i przytulna progresja. Łączy aksamitną wielką septymę maj7, świeżą nonę add9 oraz słynne zapożyczenie molowe z sekstą (iv6), wywołujące gęsią skórkę.',
    key: 'C-dur',
    steps: [
      { symbol: 'Cmaj7', degree: 'Imaj7', role: 'Aksamitne ciepło wielkiej septymy' },
      { symbol: 'Cadd9', degree: 'Iadd9', role: 'Świeży, słoneczny kolor dodanej nony' },
      { symbol: 'Fmaj7', degree: 'IVmaj7', role: 'Miękkie, przestrzenne uniesienie' },
      { symbol: 'Fm6', degree: 'iv6 (Zapożyczenie z sekstą)', role: 'Magiczne zapożyczenie molowe z sekstą – łza wzruszenia' },
      { symbol: 'Em7', degree: 'iii7', role: 'Gładki zjazd mediantowy' },
      { symbol: 'A7', degree: 'VI7 (Dominanta wtrącona)', role: 'Pikantna dominanta wtrącona do drugiego stopnia' },
      { symbol: 'Dm7', degree: 'ii7', role: 'Klimatyczny soulowy drugi stopień' },
      { symbol: 'G7sus4', degree: 'V7sus4', role: 'Zawieszona dominanta leniwie zamykająca pętlę' },
    ],
  },
  {
    id: 'wonder_chromatic_aug',
    name: 'Stevie Wonder & Beatles: Słoneczny Romantyzm (aug / 6 / dom7)',
    genre: 'Pop / Soul / Stevie Wonder / The Beatles',
    structure: 'Wznosząca Kwinta Chromatyczna',
    description: 'Słynny schemat chromatyczny Stevie Wondera ("You Are the Sunshine of My Life") i The Beatles ("Oh! Darling"). Kwinta podnosi się o półton tworząc akord zwiększony aug, po czym przechodzi w swingującą szóstkę 6 i septymę 7.',
    key: 'C-dur',
    steps: [
      { symbol: 'C', degree: 'I', role: 'Spokojna, czysta baza durowa' },
      { symbol: 'Caug', degree: 'Iaug (Zwiększony)', role: 'Kosmiczne, unoszące uniesienie kwinty w górę (G -> Gis)' },
      { symbol: 'C6', degree: 'I6 (Z sekstą)', role: 'Słodki swingujący akord z sekstą (Gis -> A)' },
      { symbol: 'C7', degree: 'I7', role: 'Dominantowe parcie ku subdominancie (A -> Bb)' },
      { symbol: 'Fmaj7', degree: 'IVmaj7', role: 'Rozpromienione otwarcie w IV stopień' },
      { symbol: 'Fm6', degree: 'iv6', role: 'Czułe, sentymentalne załamanie nastroju' },
      { symbol: 'C', degree: 'I', role: 'Powrót do domu' },
      { symbol: 'G7', degree: 'V7', role: 'Ostateczny impuls do ponownego obrotu' },
    ],
  },
  {
    id: 'ambient_worship_sus',
    name: 'Eteryczny Ambient & Worship (sus2 / sus4 / add9)',
    genre: 'Pop / Ambient / Modern Worship',
    structure: 'Hymniczne Otwarte Zawieszenia',
    description: 'Niezwykle czyste, przestrzenne brzmienie fortepianu i gitar. Akordy sus2 i sus4 zastępują tercję, tworząc stan unoszenia się i kontemplacyjnego spokoju.',
    key: 'C-dur',
    steps: [
      { symbol: 'C', degree: 'I', role: 'Ugruntowanie i czysty ton początkowy' },
      { symbol: 'Csus2', degree: 'Isus2 (Zawieszona 2)', role: 'Przejrzysta, dzwoniąca przestrzeń zawieszonej sekundy' },
      { symbol: 'Fadd9', degree: 'IVadd9 (Dodana nona)', role: 'Szeroki, świetlisty krajobraz z dodaną noną' },
      { symbol: 'Am7', degree: 'vi7', role: 'Głębokie, intymne tło emocjonalne' },
      { symbol: 'Gsus4', degree: 'Vsus4 (Zawieszona 4)', role: 'Podniosłe zawieszenie kwarty (hymn)' },
      { symbol: 'G', degree: 'V', role: 'Czyste, jasne rozwiązanie w dominantę' },
    ],
  },
  {
    id: 'gypsy_django_dim',
    name: 'Django Reinhardt: Gypsy Jazz & Ragtime (Przechodzące dim7 / 6)',
    genre: 'Jazz / Gypsy Swing / Django Reinhardt',
    structure: 'Swing z Chromatycznym Basem Zmniejszonym',
    description: 'Wirtuozerski paryski swing Django Reinhardta i Stephane\'a Grappelliego. Zamiast maj7 królują tu akordy z szóstką 6 oraz przechodzące akordy zmniejszone dim7 łączące kolejne stopnie.',
    key: 'C-dur',
    steps: [
      { symbol: 'C6', degree: 'I6 (Szóstka swingowa)', role: 'Klasyczna swingowa szóstka zamiast maj7' },
      { symbol: 'C#dim7', degree: '#I°7 (Zmniejszony)', role: 'Pikantny chromatyczny łącznik zmniejszony w górę (C -> Cis -> D)' },
      { symbol: 'Dm7', degree: 'ii7', role: 'Płynne lądowanie na drugim stopniu' },
      { symbol: 'D#dim7', degree: '#II°7 (Zmniejszony)', role: 'Kolejny chromatyczny krok w górę (D -> Dis -> E)' },
      { symbol: 'Em7', degree: 'iii7', role: 'Osiągnięcie szczytu medianty' },
      { symbol: 'A7', degree: 'VI7 (Dominanta wtrącona)', role: 'Ognista dominanta wtrącona do Dm7' },
      { symbol: 'Dm7', degree: 'ii7', role: 'Drugi stopień przygotowujący kadencję' },
      { symbol: 'G7', degree: 'V7', role: 'Porywający turnaround swingowy' },
    ],
  },
  {
    id: 'ballad_rb_six_nine',
    name: 'Ciepła Ballada R&B & Motown (add9 / 6 / sus4)',
    genre: 'Pop / R&B / Motown Ballada',
    structure: 'Jedwabisty Łuk Soul & R&B',
    description: 'Aksamitna ballada w stylu klasyków R&B i soulu lat 70. i 80. (Earth Wind & Fire, Stevie Wonder). Bogata faktura z szóstkami 6, nonami add9 i subtelnym zawieszeniem.',
    key: 'C-dur',
    steps: [
      { symbol: 'Cadd9', degree: 'Iadd9', role: 'Luksusowy, miękki początek fortepianowy z noną' },
      { symbol: 'Em7', degree: 'iii7', role: 'Tęskna medianta górna' },
      { symbol: 'Am7', degree: 'vi7', role: 'Aksamitny dół pasma' },
      { symbol: 'F6', degree: 'IV6 (Subdominanta z sekstą)', role: 'Złota szóstka subdominanty w stylu vintage soul' },
      { symbol: 'Dm7', degree: 'ii7', role: 'Płynne przejście krokowe' },
      { symbol: 'G7sus4', degree: 'V7sus4', role: 'Czyste, eleganckie zawieszenie przed puentą' },
    ],
  },
  {
    id: 'zimmer_suspense_aug_dim',
    name: 'Mroczny Thriller Symfoniczny (dim7 / aug / add9)',
    genre: 'Film / Thriller Symfoniczny / Hans Zimmer',
    structure: 'Mrożący Krew w Żyłach Łuk Symfoniczny',
    description: 'Potężna muzyka filmowa grozy i psychologicznego suspensu. Gęsty akord zmniejszony dim7 oraz zwiększona dominanta aug budują obezwładniające napięcie orkiestry.',
    key: 'A-moll',
    steps: [
      { symbol: 'Am', degree: 'i', role: 'Niski, dudniący bas wiolonczel i kontrabasów' },
      { symbol: 'Dm7', degree: 'iv7', role: 'Tajemnicza subdominanta z lodowatą atmosferą' },
      { symbol: 'Bdim7', degree: 'ii°7 (Zmniejszony)', role: 'Maksymalny, klaustrofobiczny niepokój' },
      { symbol: 'Eaug', degree: 'V+ (Zwiększona dominanta)', role: 'Zwiększona dominanta z nutą C – rozdzierające napięcie!' },
      { symbol: 'Am', degree: 'i', role: 'Głuche rozwiązanie w molową pustkę' },
      { symbol: 'Fmaj7', degree: 'VImaj7', role: 'Widmowy promień światła zza deszczowych chmur' },
      { symbol: 'Bdim', degree: 'ii°', role: 'Powrót lodowatego suspensu' },
      { symbol: 'E7', degree: 'V7', role: 'Ostateczny skok adrenaliny przed finałem' },
    ],
  },
  {
    id: 'indie_dreampop_sus',
    name: 'Dream Pop & Nocna Nostalgia (sus2 / add9 / sus4)',
    genre: 'Pop / Indie & Dream Pop (Beach House, M83)',
    structure: 'Nocna Hipnotyczna Pętla Syntezatora',
    description: 'Rozmarzona, filmowa progresja indie popu. Świeże nony i zawieszenia w połączeniu z molową toniką tworzą hipnotyzujący, nostalgiczny stan nieważkości.',
    key: 'A-moll',
    steps: [
      { symbol: 'Am', degree: 'i', role: 'Cichy, nocny syntezator i puls basu' },
      { symbol: 'Fadd9', degree: 'VIadd9', role: 'Rozległa, marzycielska przestrzeń z dodaną noną' },
      { symbol: 'Cadd9', degree: 'IIIadd9', role: 'Ciepłe wspomnienie z odległej przeszłości' },
      { symbol: 'Gsus4', degree: 'VIIsus4 (Zawieszona 4)', role: 'Nieskończone, unoszące się zawieszenie w chmurach' },
      { symbol: 'G', degree: 'VII', role: 'Delikatne opadnięcie na durowy stopień' },
      { symbol: 'Am', degree: 'i', role: 'Powrót do hipnotycznej pętli nocy' },
    ],
  },
  {
    id: 'bossa_retro_six',
    name: 'Bossa Romantica & Szóstka (I6 - vi7 - ii7 - V7sus4)',
    genre: 'Jazz / Bossa Nova / Swing',
    structure: 'Ciepły Brazylijski Turnaround',
    description: 'Klasyczna, kołysząca bossa nova z tradycyjną szóstką durową zamiast maj7. Ciepły, letni powiew wiatru znad oceanu.',
    key: 'C-dur',
    steps: [
      { symbol: 'C6', degree: 'I6 (Szóstka durowa)', role: 'Słoneczna brazylijska szóstka' },
      { symbol: 'Am7', degree: 'vi7', role: 'Melancholijny cień pod palmami' },
      { symbol: 'Dm7', degree: 'ii7', role: 'Kroczący bas kontrabasu' },
      { symbol: 'G7sus4', degree: 'V7sus4', role: 'Ciepłe popołudniowe zawieszenie kwarty' },
      { symbol: 'G7', degree: 'V7', role: 'Zmysłowe rozwiązanie dominanty septymowej' },
      { symbol: 'C6', degree: 'I6', role: 'Kołyszący finisz frazy' },
    ],
  },
];

/**
 * Parse any chord symbol into root NoteName and ChordQuality
 */
export function parseChordSymbol(symbol: string): { root: NoteName; quality: ChordQuality } {
  let clean = symbol.trim();
  if (clean.includes('/')) {
    clean = clean.split('/')[0].trim();
  }

  let rootStr = '';
  let rest = '';

  if (clean.length >= 2 && (clean[1] === '#' || clean[1] === 'b')) {
    rootStr = clean.slice(0, 2);
    rest = clean.slice(2);
  } else {
    rootStr = clean.slice(0, 1);
    rest = clean.slice(1);
  }

  // Normalize enharmonic names and flats to sharp NoteNames
  const enharmonics: Record<string, NoteName> = {
    'Db': 'C#',
    'Eb': 'D#',
    'Gb': 'F#',
    'Ab': 'G#',
    'Bb': 'A#',
    'Cis': 'C#',
    'Dis': 'D#',
    'Fis': 'F#',
    'Gis': 'G#',
    'Ais': 'A#',
    'H': 'B',
  };

  const root: NoteName = (enharmonics[rootStr] || rootStr) as NoteName;

  let quality: ChordQuality = 'major';
  if (rest === 'm7b5' || rest === 'ø' || rest === 'ø7') quality = 'm7b5';
  else if (rest === 'm7' || rest === 'min7') quality = 'min7';
  else if (rest === 'maj7' || rest === 'M7' || rest === 'Maj7') quality = 'maj7';
  else if (rest === '7sus4' || rest === 'dom7sus4') quality = 'dom7sus4';
  else if (rest === '7' || rest === 'dom7') quality = 'dom7';
  else if (rest === 'm' || rest === 'min') quality = 'minor';
  else if (rest === 'dim' || rest === '°') quality = 'diminished';
  else if (rest === 'dim7' || rest === '°7') quality = 'dim7';
  else if (rest === 'aug' || rest === '+' || rest === 'augmented' || rest === 'aug7' || rest === '+7' || rest === '7#5') quality = 'augmented';
  else if (rest === 'sus4') quality = 'sus4';
  else if (rest === 'sus2') quality = 'sus2';
  else if (rest === 'add9' || rest === '9') quality = 'add9';
  else if (rest === 'm6') quality = 'minor6';
  else if (rest === '6') quality = 'major6';

  return { root, quality };
}

/**
 * Transpose a chord definition by a given number of semitones
 */
export function transposeChord(chord: ChordDefinition, semitones: number): ChordDefinition {
  const oldRootIdx = NOTE_NAMES.indexOf(chord.root);
  const newRoot = NOTE_NAMES[(oldRootIdx + semitones + 120) % 12];
  return createChordDefinition(newRoot, chord.quality, chord.functionDegree, chord.emotionalRole);
}

/**
 * Check if a set of selected MIDI notes matches the target chord
 * (allows any octave inversion!)
 */
export function validateChordSelection(
  selectedMidiNotes: number[],
  targetChord: ChordDefinition
): {
  isCorrect: boolean;
  isExactVoicing: boolean;
  missingPitchClasses: string[];
  extraPitchClasses: string[];
  detectedPitchClasses: string[];
} {
  const targetPitchClasses = targetChord.defaultNotes.map((n) => n.note);
  const selectedPitchClasses = Array.from(
    new Set(selectedMidiNotes.map((m) => NOTE_NAMES[m % 12]))
  );

  const missing = targetPitchClasses.filter((note) => !selectedPitchClasses.includes(note));
  const extra = selectedPitchClasses.filter((note) => !targetPitchClasses.includes(note));

  const isCorrect = missing.length === 0 && extra.length === 0;

  // Check exact MIDI matches if root voicing is played
  const targetMidis = targetChord.defaultNotes.map((n) => n.midi);
  const isExactVoicing =
    isCorrect &&
    selectedMidiNotes.length === targetMidis.length &&
    selectedMidiNotes.every((m) => targetMidis.includes(m));

  return {
    isCorrect,
    isExactVoicing,
    missingPitchClasses: missing,
    extraPitchClasses: extra,
    detectedPitchClasses: selectedPitchClasses,
  };
}

/**
 * Detect a chord name from arbitrary selected MIDI notes (for free play)
 */
export function detectChordFromNotes(midiNotes: number[]): string | null {
  if (midiNotes.length < 2) return null;

  const pitchClasses = Array.from(new Set(midiNotes.map((m) => m % 12))).sort((a, b) => a - b);
  if (pitchClasses.length < 2) return null;

  // Test every pitch class as candidate root
  for (const root of pitchClasses) {
    const rootName = NOTE_NAMES[root];
    const intervals = pitchClasses.map((p) => (p - root + 12) % 12).sort((a, b) => a - b);

    // sus2 [0, 2, 7]
    if (intervals.length === 3 && intervals[0] === 0 && intervals[1] === 2 && intervals[2] === 7) {
      return `${rootName}sus2 (${getNoteLabel(rootName, 'polish')}sus2)`;
    }
    // Sus4 [0, 5, 7]
    if (intervals.length === 3 && intervals[0] === 0 && intervals[1] === 5 && intervals[2] === 7) {
      return `${rootName}sus4 (${getNoteLabel(rootName, 'polish')}sus4)`;
    }
    // Augmented triad [0, 4, 8]
    if (intervals.length === 3 && intervals[0] === 0 && intervals[1] === 4 && intervals[2] === 8) {
      return `${rootName}aug (${getNoteLabel(rootName, 'polish')}aug / ${getNoteLabel(rootName, 'polish')}+)`;
    }
    // Augmented 7th / 7#5 [0, 4, 8, 10]
    if (intervals.length === 4 && intervals[0] === 0 && intervals[1] === 4 && intervals[2] === 8 && intervals[3] === 10) {
      return `${rootName}7#5 (${rootName}aug7)`;
    }
    // Diminished [0, 3, 6]
    if (intervals.length === 3 && intervals[0] === 0 && intervals[1] === 3 && intervals[2] === 6) {
      return `${rootName}dim (${getNoteLabel(rootName, 'polish')}dim)`;
    }
    // Major triad [0, 4, 7]
    if (intervals.length === 3 && intervals[0] === 0 && intervals[1] === 4 && intervals[2] === 7) {
      return `${rootName} (${getNoteLabel(rootName, 'polish')}-dur)`;
    }
    // Minor triad [0, 3, 7]
    if (intervals.length === 3 && intervals[0] === 0 && intervals[1] === 3 && intervals[2] === 7) {
      return `${rootName}m (${getNoteLabel(rootName, 'polish')}-moll)`;
    }
    // 7sus4 [0, 5, 7, 10]
    if (intervals.length === 4 && intervals[0] === 0 && intervals[1] === 5 && intervals[2] === 7 && intervals[3] === 10) {
      return `${rootName}7sus4`;
    }
    // Dominant 7th [0, 4, 7, 10]
    if (intervals.length === 4 && intervals[0] === 0 && intervals[1] === 4 && intervals[2] === 7 && intervals[3] === 10) {
      return `${rootName}7`;
    }
    // Major 7th [0, 4, 7, 11]
    if (intervals.length === 4 && intervals[0] === 0 && intervals[1] === 4 && intervals[2] === 7 && intervals[3] === 11) {
      return `${rootName}maj7`;
    }
    // Minor 7th [0, 3, 7, 10]
    if (intervals.length === 4 && intervals[0] === 0 && intervals[1] === 3 && intervals[2] === 7 && intervals[3] === 10) {
      return `${rootName}m7`;
    }
    // Major 6th [0, 4, 7, 9]
    if (intervals.length === 4 && intervals[0] === 0 && intervals[1] === 4 && intervals[2] === 7 && intervals[3] === 9) {
      return `${rootName}6`;
    }
    // Minor 6th [0, 3, 7, 9]
    if (intervals.length === 4 && intervals[0] === 0 && intervals[1] === 3 && intervals[2] === 7 && intervals[3] === 9) {
      return `${rootName}m6`;
    }
    // Diminished 7th [0, 3, 6, 9]
    if (intervals.length === 4 && intervals[0] === 0 && intervals[1] === 3 && intervals[2] === 6 && intervals[3] === 9) {
      return `${rootName}dim7`;
    }
    // Half-diminished m7b5 [0, 3, 6, 10]
    if (intervals.length === 4 && intervals[0] === 0 && intervals[1] === 3 && intervals[2] === 6 && intervals[3] === 10) {
      return `${rootName}m7b5`;
    }
    // add9 [0, 2, 4, 7]
    if (intervals.length === 4 && intervals[0] === 0 && intervals[1] === 2 && intervals[2] === 4 && intervals[3] === 7) {
      return `${rootName}add9`;
    }
  }

  return null;
}
