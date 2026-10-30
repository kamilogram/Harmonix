import { NoteName, FamousProgression, FamousProgressionStep, ChordQuality } from '../types/music';
import { NOTE_NAMES, getNoteLabel, parseChordSymbol, createChordDefinition } from './musicTheory';

export type GeneratorArchetype =
  | 'all'
  | 'modern_pop'
  | 'film_noir'
  | 'neo_soul'
  | 'gypsy_swing'
  | 'ambient_wonder'
  | 'epic_rock';

export interface GeneratorOptions {
  archetype?: GeneratorArchetype;
  length?: 4 | 6 | 8;
  keyRoot?: NoteName;
  mode?: 'major' | 'minor';
}

interface HarmonicTemplate {
  archetype: GeneratorArchetype;
  nameTemplates: string[];
  genre: string;
  defaultMode: 'major' | 'minor';
  descriptionTemplate: string;
  // Steps in Roman numeral degrees with chord qualities and role descriptions
  stepsPool: {
    symbolInC: string;
    degree: string;
    role: string;
    section?: string;
  }[];
}

const HARMONIC_TEMPLATES: HarmonicTemplate[] = [
  // 1. Modern Pop & Hymn (sus2, sus4, add9, 7sus4)
  {
    archetype: 'modern_pop',
    nameTemplates: [
      'Stadionowy Hymn Światła (Coldplay & U2)',
      'Krystaliczny Świt (add9 / sus2 / 7sus4)',
      'Euforyczna Przestrzeń Popowa',
      'Hymn Nadziei & Wzniesienie',
      'Nowoczesny Pop Złotej Ery (add9 & sus)',
    ],
    genre: 'Pop / Modern Pop / Hymn',
    defaultMode: 'major',
    descriptionTemplate:
      'Nowoczesna progresja stadionowa z otwartymi zawieszeniami sus2 i sus4 oraz słonecznym blaskiem dodanej nony (add9). Czyste, śpiewne prowadzenie głosów uwielbiane przez Coldplay i U2.',
    stepsPool: [
      { symbolInC: 'Cadd9', degree: 'Iadd9', role: 'Promienna tonika z dodaną noną – czyste światło' },
      { symbolInC: 'Am7', degree: 'vi7', role: 'Ciepła paralela molowa z łagodną septymą' },
      { symbolInC: 'Fsus2', degree: 'IVsus2', role: 'Zawieszona subdominanta o szerokim, dzwoniącym brzmieniu' },
      { symbolInC: 'G7sus4', degree: 'V7sus4', role: 'Mocne stadionowe zawieszenie kwarty przed dominantą' },
      { symbolInC: 'G', degree: 'V', role: 'Rozwiązanie kwarty w tercję dominanty' },
      { symbolInC: 'Fadd9', degree: 'IVadd9', role: 'Świetliste otwarcie przestrzeni z noną' },
      { symbolInC: 'C6', degree: 'I6', role: 'Słodki, ukojony odpoczynek w tonice z sekstą' },
      { symbolInC: 'Gsus4', degree: 'Vsus4', role: 'Podniosłe, hymniczne zawieszenie kwintowe' },
    ],
  },

  // 2. Film Noir & Thriller Suspense (m6, dim7, aug, m7b5)
  {
    archetype: 'film_noir',
    nameTemplates: [
      'Deszcz w Zaułku Noir (Seksta molowa & Dim7)',
      'Motyw Jamesa Bonda & Krok Chromatyczny',
      'Kryptonim Suspense (dim7 / aug / m6)',
      'Cienie Miasta Grzechu (Noir Elegia)',
      'Ostatni Świadek (Thriller Psychologiczny)',
    ],
    genre: 'Film / Thriller Noir / Kryminał',
    defaultMode: 'minor',
    descriptionTemplate:
      'Gęsty, dymny klimat kryminału noir z chromatycznym zjazdem basu i mroczną sekstą molową (m6), zwieńczony mrożącym krew w żyłach akordem zmniejszonym dim7 i zwiększoną dominantą aug.',
    stepsPool: [
      { symbolInC: 'Am', degree: 'i', role: 'Mroczny, samotny motyw przewodni w dymnym zaułku' },
      { symbolInC: 'Am7', degree: 'i7', role: 'Chromatyczne opadnięcie w stronę dymnego jazzu' },
      { symbolInC: 'Am6', degree: 'i6', role: 'Kultowa szpiegowska seksta molowa (motyw Bonda)' },
      { symbolInC: 'Dm6', degree: 'iv6', role: 'Ciężka subdominanta z melancholijną sekstą' },
      { symbolInC: 'Bdim7', degree: 'ii°7', role: 'Maksymalny, klaustrofobiczny niepokój akordu zmniejszonego' },
      { symbolInC: 'Eaug', degree: 'Vaug', role: 'Rozdzierające napięcie zwiększonej dominanty' },
      { symbolInC: 'E7', degree: 'V7', role: 'Ostateczne dominantowe spięcie przed rozwiązaniem' },
      { symbolInC: 'Fmaj7', degree: 'VImaj7', role: 'Widmowy, odległy promień światła zza deszczu' },
    ],
  },

  // 3. Aksamitny Neo-Soul & Lo-Fi Chill (maj7, add9, iv6, 7sus4)
  {
    archetype: 'neo_soul',
    nameTemplates: [
      'Nocna Kawiarnia Neo-Soul (maj7 / add9 / iv6)',
      'Aksamitny Deszcz & Lo-Fi Chill',
      'Zmysłowy Groove Zmierzchu (add9 & m6)',
      'Karmelowy Neo-Soul & Soulful Keys',
      'Vintage Vinyl & Poranna Kawa',
    ],
    genre: 'Neo-Soul / Lo-Fi / Jazz Pop',
    defaultMode: 'major',
    descriptionTemplate:
      'Ciepłe, przytulne akordy o bogatej strukturze harmonicznej: aksamitna wielka septyma, krystaliczna nona add9 oraz poruszające zapożyczenie molowe z sekstą (iv6) – esencja nowoczesnego neo-soulu.',
    stepsPool: [
      { symbolInC: 'Cmaj7', degree: 'Imaj7', role: 'Aksamitna chmura dźwięku w durowej tonice' },
      { symbolInC: 'Cadd9', degree: 'Iadd9', role: 'Świeży, słoneczny kolor dodanej nony' },
      { symbolInC: 'Fmaj7', degree: 'IVmaj7', role: 'Miękkie, przestrzenne uniesienie subdominanty' },
      { symbolInC: 'Fm6', degree: 'iv6', role: 'Magiczne zapożyczenie molowe z sekstą – łza wzruszenia' },
      { symbolInC: 'Em7', degree: 'iii7', role: 'Gładki, relaksujący zjazd mediantowy' },
      { symbolInC: 'A7', degree: 'VI7', role: 'Pikantna dominanta wtrącona do drugiego stopnia' },
      { symbolInC: 'Dm7', degree: 'ii7', role: 'Ciepły soulowy drugi stopień' },
      { symbolInC: 'G7sus4', degree: 'V7sus4', role: 'Zawieszone, leniwe domknięcie pętli' },
    ],
  },

  // 4. Gypsy Swing & Retro 1930s (I6, #I°7, #II°7, VI7)
  {
    archetype: 'gypsy_swing',
    nameTemplates: [
      'Paryski Gypsy Swing (Django Reinhardt & Szóstki)',
      'Retro Ragtime & Przechodzące Zmniejszone',
      'Spacer po Montmartre 1934 (I6 / dim7)',
      'Wesoły Swing z Nowego Orleanu',
      'Czar Retro Kawiarni (6 / #I°7 / VI7)',
    ],
    genre: 'Jazz / Gypsy Swing / Retro 30s',
    defaultMode: 'major',
    descriptionTemplate:
      'Optymistyczny, kołyszący swing z lat 30. Tradycyjna szóstka durowa (6) oraz wirtuozerskie przechodzące akordy zmniejszone (#I°7, #II°7) tworzące słynny chromatycznie wznoszący się bas.',
    stepsPool: [
      { symbolInC: 'C6', degree: 'I6', role: 'Ciepła, słodka swingowa szóstka zamiast maj7' },
      { symbolInC: 'C#dim7', degree: '#I°7', role: 'Chromatyczny łącznik zmniejszony w górę (C -> Cis -> D)' },
      { symbolInC: 'Dm7', degree: 'ii7', role: 'Lekkie lądowanie na drugim stopniu swingu' },
      { symbolInC: 'D#dim7', degree: '#II°7', role: 'Kolejny chromatyczny krok diminuendo w górę (D -> Dis -> E)' },
      { symbolInC: 'Em7', degree: 'iii7', role: 'Płynne osiągnięcie szczytu medianty' },
      { symbolInC: 'A7', degree: 'VI7', role: 'Skoczna dominanta wtrącona do Dm' },
      { symbolInC: 'Dm7', degree: 'ii7', role: 'Powrót do kadencji swingowej' },
      { symbolInC: 'G7', degree: 'V7', role: 'Radosny turnaround zamykający refren' },
    ],
  },

  // 5. Kosmiczny Ambient & Wonder (aug, sus2, add9, iv6)
  {
    archetype: 'ambient_wonder',
    nameTemplates: [
      'Kosmiczna Odyseja (Akord zwiększony & sus2)',
      'Podróż Międzygwiezdna (Zimmer & Wonder)',
      'Światło w Próżni (aug / maj7 / add9)',
      'Hipnotyczna Zorza Polarna',
      'Tajemnica Wszechświata (I - Iaug - IVmaj7 - iv6)',
    ],
    genre: 'Film / Kosmos / Ambient Wonder',
    defaultMode: 'major',
    descriptionTemplate:
      'Hipnotyzująca harmonia pełna tajemnicy i kosmicznego zachwytu. Akord zwiększony (aug) unosi kwintę w nieskończoność, a seksta molowa (iv6) daje poczucie głębi wszechświata.',
    stepsPool: [
      { symbolInC: 'C', degree: 'I', role: 'Czysty, stabilny punkt wyjścia na Ziemi' },
      { symbolInC: 'Caug', degree: 'Iaug', role: 'Nierzeczywisty impuls kwinty w górę (G -> Gis) – start rakiety' },
      { symbolInC: 'C6', degree: 'I6', role: 'Stan nieważkości z ciepłą sekstą' },
      { symbolInC: 'C7', degree: 'I7', role: 'Potężne ciążenie ku subdominancie' },
      { symbolInC: 'Fmaj7', degree: 'IVmaj7', role: 'Aksamitny lot ponad orbitą' },
      { symbolInC: 'Fm6', degree: 'iv6', role: 'Głęboka melancholia samotności w kosmosie' },
      { symbolInC: 'Cadd9', degree: 'Iadd9', role: 'Błyszczące gwiazdy w tonice' },
      { symbolInC: 'Gsus4', degree: 'Vsus4', role: 'Zawieszenie przed powrotem na Ziemię' },
    ],
  },

  // 6. Epicki Rock & Stadionowa Ballada (add9, sus4, bVII, bVI)
  {
    archetype: 'epic_rock',
    nameTemplates: [
      'Epicki Rock Stadionowy (bVII / add9 / sus4)',
      'Hymn Walecznych Serc (add9 & sus2)',
      'Wietrzna Grań (Rock Symfoniczny)',
      'Płonący Horyzont (bVI / bVII / Iadd9)',
      'Powrót Bohatera (Ballada Epicka)',
    ],
    genre: 'Rock / Epik / Ballada Stadionowa',
    defaultMode: 'major',
    descriptionTemplate:
      'Monumentalna progresja rockowo-filmowa z epickim krokiem całotonowym bVII, potężnym zawieszeniem sus4 i wyrazistą noną add9, tworząca niezrównany ładunek podniosłości.',
    stepsPool: [
      { symbolInC: 'Cadd9', degree: 'Iadd9', role: 'Mocny, dzwoniący akord gitary i fortepianu' },
      { symbolInC: 'G', degree: 'V', role: 'Wzrost energii napędowej' },
      { symbolInC: 'Am7', degree: 'vi7', role: 'Dramatyczne załamanie nastroju' },
      { symbolInC: 'Fsus2', degree: 'IVsus2', role: 'Otwarte, wznoszące zawieszenie' },
      { symbolInC: 'A#', degree: 'bVII (Bb)', role: 'Epicki całotonowy krok rockowy – rozmach kina akcji' },
      { symbolInC: 'Fadd9', degree: 'IVadd9', role: 'Wielka kulminacja z dodaną noną' },
      { symbolInC: 'Gsus4', degree: 'Vsus4', role: 'Stadionowe zatrzymanie oddechu' },
      { symbolInC: 'C', degree: 'I', role: 'Triumfalne uderzenie w tonikę' },
    ],
  },
];

/**
 * Format standard chord symbol from root and quality
 */
export function formatChordSymbol(root: NoteName, quality: ChordQuality): string {
  if (quality === 'minor') return `${root}m`;
  if (quality === 'dom7') return `${root}7`;
  if (quality === 'maj7') return `${root}maj7`;
  if (quality === 'min7') return `${root}m7`;
  if (quality === 'major6') return `${root}6`;
  if (quality === 'minor6') return `${root}m6`;
  if (quality === 'diminished') return `${root}dim`;
  if (quality === 'dim7') return `${root}dim7`;
  if (quality === 'm7b5') return `${root}m7b5`;
  if (quality === 'augmented') return `${root}aug`;
  if (quality === 'sus2') return `${root}sus2`;
  if (quality === 'sus4') return `${root}sus4`;
  if (quality === 'dom7sus4') return `${root}7sus4`;
  if (quality === 'add9') return `${root}add9`;
  return root;
}

/**
 * Transpose symbol string from C-dur / A-moll to target key
 */
export function transposeSymbol(
  symbolInC: string,
  targetRoot: NoteName,
  sourceBaseRoot: NoteName = 'C'
): string {
  const parsed = parseChordSymbol(symbolInC);
  const srcIdx = NOTE_NAMES.indexOf(parsed.root);
  const baseIdx = NOTE_NAMES.indexOf(sourceBaseRoot);
  const targetIdx = NOTE_NAMES.indexOf(targetRoot);

  const delta = (targetIdx - baseIdx + 12) % 12;
  const newRoot = NOTE_NAMES[(srcIdx + delta) % 12];

  return formatChordSymbol(newRoot, parsed.quality);
}

/**
 * Extract root note and mode (major/minor) from a progression key string (e.g. 'C-dur', 'Fis-dur', 'a-moll')
 */
export function extractKeyFromProgression(prog: FamousProgression): { root: NoteName; mode: 'major' | 'minor' } {
  const isMinor = prog.key.toLowerCase().includes('moll');
  const firstPart = prog.key.split('-')[0].trim();
  const parsed = parseChordSymbol(firstPart);
  return {
    root: parsed.root,
    mode: isMinor ? 'minor' : 'major',
  };
}

/**
 * Transposes an already generated FamousProgression to a new target key,
 * keeping the exact chord extensions (add9, sus, 6, dim, aug, etc.) and functional roles intact.
 */
export function transposeSmartProgression(
  prog: FamousProgression,
  targetKeyRoot: NoteName,
  sourceKeyRoot?: NoteName
): FamousProgression {
  const extracted = extractKeyFromProgression(prog);
  const oldRoot = sourceKeyRoot || extracted.root;
  const isMinor = extracted.mode === 'minor';

  const oldRootIdx = NOTE_NAMES.indexOf(oldRoot);
  const targetRootIdx = NOTE_NAMES.indexOf(targetKeyRoot);
  const semitonesDelta = (targetRootIdx - oldRootIdx + 12) % 12;

  if (semitonesDelta === 0 && oldRoot === targetKeyRoot) {
    return prog;
  }

  const transposedSteps = prog.steps.map((step) => {
    const parsed = parseChordSymbol(step.symbol);
    const oldChordIdx = NOTE_NAMES.indexOf(parsed.root);
    const newChordRoot = NOTE_NAMES[(oldChordIdx + semitonesDelta) % 12];
    const newSymbol = formatChordSymbol(newChordRoot, parsed.quality);

    return {
      ...step,
      symbol: newSymbol,
    };
  });

  const keyLabel = getNoteLabel(targetKeyRoot, 'polish');
  const tonalityStr = isMinor ? `${keyLabel}-moll` : `${keyLabel}-dur`;
  const chordSet = Array.from(new Set(transposedSteps.map((s) => s.symbol))).join(', ');

  let newDescription = prog.description;
  if (newDescription.includes('Wzbogacone akordy:')) {
    newDescription = newDescription.replace(/Wzbogacone akordy: .*?\./, `Wzbogacone akordy: ${chordSet}.`);
  } else {
    newDescription = `${newDescription} Wzbogacone akordy: ${chordSet}.`;
  }

  return {
    ...prog,
    id: `gen_transposed_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    key: tonalityStr,
    structure: `${transposedSteps.length} Akordów (${transposedSteps.map((s) => s.symbol).join(' – ')})`,
    description: newDescription,
    steps: transposedSteps,
  };
}

/**
 * Generates an inspiring, musically verified harmonic progression on the fly
 */
export function generateSmartProgression(options: GeneratorOptions = {}): FamousProgression {
  // 1. Choose template
  const availableTemplates =
    options.archetype && options.archetype !== 'all'
      ? HARMONIC_TEMPLATES.filter((t) => t.archetype === options.archetype)
      : HARMONIC_TEMPLATES;

  const chosenTemplate =
    availableTemplates[Math.floor(Math.random() * availableTemplates.length)] ||
    HARMONIC_TEMPLATES[0];

  const mode = options.mode || chosenTemplate.defaultMode;
  const targetKeyRoot = options.keyRoot || (mode === 'minor' ? 'A' : 'C');
  const targetLength = options.length || 4;

  // 2. Select steps from the pool based on targetLength
  const pool = chosenTemplate.stepsPool;
  let selectedStepsInC: typeof pool = [];

  if (targetLength === 4) {
    if (pool.length >= 8) {
      // Pick either first 4, last 4, or alternating coherent 4
      const variant = Math.floor(Math.random() * 3);
      if (variant === 0) {
        selectedStepsInC = pool.slice(0, 4);
      } else if (variant === 1) {
        // e.g. I -> IV -> V -> I variant
        selectedStepsInC = [pool[0], pool[2] || pool[1], pool[3] || pool[2], pool[4] || pool[0]];
      } else {
        selectedStepsInC = pool.slice(2, 6);
      }
    } else {
      selectedStepsInC = pool.slice(0, 4);
    }
  } else if (targetLength === 6) {
    selectedStepsInC = pool.slice(0, 6);
  } else {
    // 8 chords
    selectedStepsInC = pool.slice(0, 8);
  }

  // 3. Transpose all steps to targetKeyRoot
  const sourceBaseRoot: NoteName = mode === 'minor' ? 'A' : 'C';

  const steps: FamousProgressionStep[] = selectedStepsInC.map((step) => {
    const transposedSymbol = transposeSymbol(step.symbolInC, targetKeyRoot, sourceBaseRoot);
    return {
      symbol: transposedSymbol,
      degree: step.degree,
      role: step.role,
      section: step.section,
    };
  });

  // 4. Generate title and description
  const randomTitle =
    chosenTemplate.nameTemplates[
      Math.floor(Math.random() * chosenTemplate.nameTemplates.length)
    ] || chosenTemplate.nameTemplates[0];

  const keyLabel = getNoteLabel(targetKeyRoot, 'polish');
  const tonalityStr = mode === 'minor' ? `${keyLabel}-moll` : `${keyLabel}-dur`;

  const uniqueId = `gen_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  return {
    id: uniqueId,
    name: `${randomTitle}`,
    genre: chosenTemplate.genre,
    structure: `${targetLength} Akordów (${steps.map((s) => s.symbol).join(' – ')})`,
    description: `${chosenTemplate.descriptionTemplate} Wzbogacone akordy: ${Array.from(
      new Set(steps.map((s) => s.symbol))
    ).join(', ')}.`,
    key: tonalityStr,
    steps,
  };
}

/**
 * Save user generated progression to localStorage
 */
const STORAGE_SAVED_PROGRESSIONS_KEY = 'harmonix_saved_custom_progressions_v1';

export function getSavedCustomProgressions(): FamousProgression[] {
  try {
    const raw = localStorage.getItem(STORAGE_SAVED_PROGRESSIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

export function saveCustomProgression(prog: FamousProgression): boolean {
  try {
    const current = getSavedCustomProgressions();
    // Prepend new progression
    const updated = [prog, ...current.filter((p) => p.id !== prog.id)];
    localStorage.setItem(STORAGE_SAVED_PROGRESSIONS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('harmonix:custom-progressions-updated'));
    return true;
  } catch {
    return false;
  }
}

export function deleteCustomProgression(progId: string): boolean {
  try {
    const current = getSavedCustomProgressions();
    const updated = current.filter((p) => p.id !== progId);
    localStorage.setItem(STORAGE_SAVED_PROGRESSIONS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('harmonix:custom-progressions-updated'));
    return true;
  } catch {
    return false;
  }
}
