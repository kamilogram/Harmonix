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
          fitScore: 85,
          fitVerdict: 'Bardzo dobry wybór! Ciepłe otwarcie przestrzeni (IV)',
        },
        {
          id: 'opt_bdim',
          chord: createChordDefinition('B', 'diminished', 'vii°', 'Zmniejszony (vii°) - Ostry dysonans'),
          degreeName: 'vii° (Zmniejszony – H-dim)',
          moodLabel: 'Mocno niestabilny i napięty',
          explanation: 'Bardzo rzadko używany bezpośrednio po C w muzyce popularnej, bo tworzy natychmiastowy niepokój.',
          whyItWorks: 'Zawiera tryton (H-F). Może brzmieć zbyt ostro, jeśli nie planujesz skomplikowanego przejścia klasycznego.',
          isRecommended: false,
          fitTier: 'weak',
          fitScore: 35,
          fitVerdict: 'Słabszy wybór w popie: tryton H-F wprowadza nagły niepokój (vii°)',
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
          id: 'opt_f_after_g',
          chord: createChordDefinition('F', 'major', 'IV', 'Ruch wsteczny (IV) - Rockowy blues'),
          degreeName: 'IV (Subdominanta – F-dur)',
          moodLabel: 'Buntowniczy, rockowy krok w dół',
          explanation: 'W klasycznej harmonii unika się V -> IV, ale w muzyce rockowej i bluesie brzmi to surowo i dumnie.',
          whyItWorks: 'Ruch całotonowy basu w dół (G -> F) daje charakterystyczny, nieco szorstki feeling.',
          isRecommended: false,
          fitTier: 'weak',
          fitScore: 45,
          fitVerdict: 'Słabszy w harmonii klasycznej: ruch wsteczny V->IV, ale działa w rocku',
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
          id: 'opt_dm_after_am',
          chord: createChordDefinition('D', 'minor', 'ii', 'Subdominanta molowa (ii) - Jazz & R&B'),
          degreeName: 'ii (D-moll)',
          moodLabel: 'Klimatyczny, deszczowy lo-fi',
          explanation: 'Ruch w dół o kwintę (A -> D). Idealny krok do przygotowania kadencji ii-V-I.',
          whyItWorks: 'Dźwięk A jest wspólny, bas porusza się w silnej relacji kwintowej w dół.',
          isRecommended: false,
          fitTier: 'good',
          fitScore: 82,
          fitVerdict: 'Dobre jazzowe rozwinięcie! Przygotowuje kadencję 2-5-1 (ii)',
        },
        {
          id: 'opt_em_after_am',
          chord: createChordDefinition('E', 'minor', 'iii', 'Medianta (iii) - Północny chłód'),
          degreeName: 'iii (E-moll)',
          moodLabel: 'Minimalistyczny, akustyczny folk',
          explanation: 'Dwa akordy molowe obok siebie budują spokojny, kontemplacyjny nastrój.',
          whyItWorks: 'Naturalna harmonia modalna (eolska), często spotykana u Coldplay i Billie Eilish.',
          isRecommended: false,
          fitTier: 'good',
          fitScore: 70,
          fitVerdict: 'Ciekawe folkowe zabarwienie, chociaż mniej dynamiczne (iii)',
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
          id: 'opt_fm_after_f',
          chord: createChordDefinition('F', 'minor', 'iv', 'Zapożyczenie molowe (iv) - "Wyciskacz łez"'),
          degreeName: 'iv molowe (Zapożyczenie – F-moll)',
          moodLabel: 'Magiczne, słodko-smutne pęknięcie serca',
          explanation: 'Zamiana tercji wielkiej (A) na małą (As). Ten jeden dźwięk wywołuje ciarki u każdego słuchacza!',
          whyItWorks: 'Słynny chwyt Radiohead ("Creep"), The Beatles ("In My Life") i Hansa Zimmera. Dźwięk As schodzi chromatycznie na G w C-dur.',
          isRecommended: false,
          fitTier: 'good',
          fitScore: 88,
          fitVerdict: 'Genialny filmowy twist! Słynne zapożyczenie molowe iv (Creep)',
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
      fitScore: 80,
      fitVerdict: 'Dobre dopasowanie! Kwartowy oddech w melodii',
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
