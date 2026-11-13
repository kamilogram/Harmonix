import {
  ChordDefinition,
  FamousProgression,
  NoteName,
} from '../types/music';
import {
  FAMOUS_PROGRESSIONS,
  NOTE_NAMES,
  parseChordSymbol,
  createChordDefinition,
  validateOrCorrectChordDegree,
  isTonicDegree,
  isTonicDegreeMinor,
  getNoteLabel,
} from './musicTheory';
import { getSavedCustomProgressions } from './progressionGenerator';
import { getActivityHistory } from './sessionTracker';

export interface LoadedProgressionMetadata {
  keyName: string;
  progName?: string;
  progId?: string;
  degrees?: string;
  root?: NoteName;
  mode?: 'major' | 'minor';
}

export interface StoredPatternPayload {
  chords: ChordDefinition[];
  metadata: LoadedProgressionMetadata | null;
  progressionId: string | null;
  timestamp?: number;
}

export const WORKSHOP_PROG_STORAGE_KEY = 'harmonix_workshop_loaded_progression_v1';
export const LAST_USED_PATTERN_STORAGE_KEY = 'harmonix_last_used_pattern_v1';

/**
 * Determines the original root of a famous progression.
 */
export function getProgressionOriginalRoot(prog: FamousProgression): NoteName {
  const tonicStep = prog.steps.find((st) => isTonicDegree(st.degree));
  if (tonicStep) {
    const parsed = parseChordSymbol(tonicStep.symbol);
    if (parsed.root) return parsed.root;
  }

  const parsedKey = parseChordSymbol(prog.key);
  if (parsedKey && parsedKey.root) {
    return parsedKey.root;
  }

  const match = prog.key.trim().match(/^([A-Za-z#]+)/i);
  if (match) {
    const parsed = parseChordSymbol(match[1]);
    if (parsed.root) return parsed.root;
  }

  if (prog.id === 'andalusian_cadence' || prog.id === 'epic_cinematic' || prog.key.toLowerCase().includes('moll')) {
    return 'A';
  }
  return 'C';
}

/**
 * Determines if a progression is natively minor.
 */
export function isProgressionNativelyMinor(prog: FamousProgression): boolean {
  const k = prog.key.toLowerCase();
  if (k.includes('moll') || k.includes('minor')) return true;
  if (k.includes('dur') || k.includes('major')) return false;

  const tonicStep = prog.steps.find((st) => isTonicDegree(st.degree));
  if (tonicStep) {
    if (isTonicDegreeMinor(tonicStep.degree)) return true;
    const parsed = parseChordSymbol(tonicStep.symbol);
    return ['minor', 'min7', 'min9', 'minSixNine', 'minor6', 'm7b5'].includes(parsed.quality);
  }

  return false;
}

/**
 * Builds full ChordDefinition[] array from a FamousProgression transposed to targetKey.
 */
export function buildChordDefinitionsFromFamousProgression(
  prog: FamousProgression,
  targetKey?: NoteName,
  targetMode?: 'major' | 'minor'
): { chords: ChordDefinition[]; metadata: LoadedProgressionMetadata } {
  const isMinorBase = targetMode ? targetMode === 'minor' : isProgressionNativelyMinor(prog);
  const activeKey = targetKey || getProgressionOriginalRoot(prog);
  const origRoot = getProgressionOriginalRoot(prog);
  const origRootIdx = NOTE_NAMES.indexOf(origRoot);
  const targetRootIdx = NOTE_NAMES.indexOf(activeKey);
  const semitonesDelta = (targetRootIdx - origRootIdx + 12) % 12;

  const targetLabel = getNoteLabel(activeKey, 'international');
  const tonalityLabel = isMinorBase ? `${targetLabel}-moll` : `${targetLabel}-dur`;

  const chords: ChordDefinition[] = prog.steps.map((st) => {
    const parsed = parseChordSymbol(st.symbol);
    const oldRootIdx = NOTE_NAMES.indexOf(parsed.root);
    const newRoot = NOTE_NAMES[(oldRootIdx + semitonesDelta) % 12];
    let chord = createChordDefinition(newRoot, parsed.quality, st.degree, st.role);
    chord = validateOrCorrectChordDegree(chord, activeKey, isMinorBase ? 'minor' : 'major');
    chord.section = st.section;
    return chord;
  });

  const formulaString = prog.steps.map((s) => s.degree).join(' – ');

  return {
    chords,
    metadata: {
      keyName: tonalityLabel,
      progName: prog.name,
      progId: prog.id,
      degrees: formulaString,
      root: activeKey,
      mode: isMinorBase ? 'minor' : 'major',
    },
  };
}

/**
 * Sanitizes and repairs parsed chords in case any fields were lost in storage serialization.
 */
function sanitizeChords(chords: unknown[]): ChordDefinition[] {
  if (!Array.isArray(chords) || chords.length === 0) return [];
  return chords
    .map((c) => {
      const raw = c as Partial<ChordDefinition>;
      if (!raw.root || !raw.quality) return null;
      if (Array.isArray(raw.defaultNotes) && raw.defaultNotes.length > 0) {
        return raw as ChordDefinition;
      }
      // Re-create notes if missing
      const fresh = createChordDefinition(raw.root, raw.quality, raw.functionDegree, raw.emotionalRole);
      if (raw.section) fresh.section = raw.section;
      return fresh;
    })
    .filter((c): c is ChordDefinition => Boolean(c));
}

/**
 * Saves a pattern both to the currently active workshop key AND the permanent last used pattern key.
 */
export function savePatternToStorage(
  chords: ChordDefinition[],
  metadata?: LoadedProgressionMetadata | null,
  progressionId?: string | null
): void {
  try {
    const payload: StoredPatternPayload = {
      chords,
      metadata: metadata || null,
      progressionId: progressionId || metadata?.progId || null,
      timestamp: Date.now(),
    };
    const json = JSON.stringify(payload);
    localStorage.setItem(WORKSHOP_PROG_STORAGE_KEY, json);
    localStorage.setItem(LAST_USED_PATTERN_STORAGE_KEY, json);
  } catch (err) {
    console.error('Failed to save pattern to localStorage:', err);
  }
}

/**
 * Clears only the active workshop state (for "Wróć do trybu quizu bez wzorca"),
 * while keeping LAST_USED_PATTERN_STORAGE_KEY intact so that opening the app restores it!
 */
export function clearCurrentWorkshopPatternOnly(): void {
  try {
    localStorage.removeItem(WORKSHOP_PROG_STORAGE_KEY);
    localStorage.removeItem('harmonix_workshop_results_v1');
  } catch (err) {
    console.error('Failed to clear workshop pattern:', err);
  }
}

/**
 * Gets info about the last used pattern without altering state.
 */
export function getLastUsedPatternInfo(): StoredPatternPayload | null {
  try {
    const raw = localStorage.getItem(LAST_USED_PATTERN_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.chords) && parsed.chords.length > 0) {
        return {
          chords: sanitizeChords(parsed.chords),
          metadata: parsed.metadata || null,
          progressionId: parsed.progressionId || parsed.metadata?.progId || null,
          timestamp: parsed.timestamp,
        };
      }
    }
  } catch {}
  return null;
}

/**
 * User Request: "Przy otwieraniu aplikacji niech będzie wczytany ostatni wzorzec z ostatniego używania aplikacji"
 * Guaranteed to return a valid progression upon application startup:
 * 1. Checks currently active workshop progression
 * 2. Checks permanent last used pattern storage (survives "opuść wzorzec" across app restarts)
 * 3. Checks sessionTracker activity history / library settings
 * 4. Fallback to Pop-Punk Axis (I – V – vi – IV in C-dur)
 */
export function loadInitialLastPattern(): StoredPatternPayload {
  try {
    // 1. Try active workshop storage
    const rawWorkshop = localStorage.getItem(WORKSHOP_PROG_STORAGE_KEY);
    if (rawWorkshop) {
      const parsed = JSON.parse(rawWorkshop);
      if (parsed && Array.isArray(parsed.chords) && parsed.chords.length > 0) {
        const chords = sanitizeChords(parsed.chords);
        if (chords.length > 0) {
          const payload: StoredPatternPayload = {
            chords,
            metadata: parsed.metadata || null,
            progressionId: parsed.metadata?.progId || parsed.progressionId || null,
            timestamp: parsed.timestamp,
          };
          // Keep LAST_USED_PATTERN_STORAGE_KEY synced
          localStorage.setItem(LAST_USED_PATTERN_STORAGE_KEY, JSON.stringify(payload));
          return payload;
        }
      }
    }

    // 2. Try permanent last used pattern storage (from last use of the app)
    const rawLast = localStorage.getItem(LAST_USED_PATTERN_STORAGE_KEY);
    if (rawLast) {
      const parsed = JSON.parse(rawLast);
      if (parsed && Array.isArray(parsed.chords) && parsed.chords.length > 0) {
        const chords = sanitizeChords(parsed.chords);
        if (chords.length > 0) {
          const payload: StoredPatternPayload = {
            chords,
            metadata: parsed.metadata || null,
            progressionId: parsed.metadata?.progId || parsed.progressionId || null,
            timestamp: parsed.timestamp,
          };
          // Write back to active workshop storage so it is active
          localStorage.setItem(WORKSHOP_PROG_STORAGE_KEY, JSON.stringify(payload));
          return payload;
        }
      }
    }

    // 3. Try to locate from progression library settings or session tracker
    const allProgressions = [...getSavedCustomProgressions(), ...FAMOUS_PROGRESSIONS];
    let matchedProg: FamousProgression | undefined;
    let targetKey: NoteName = 'C';
    let targetMode: 'major' | 'minor' = 'major';

    const rawLib = localStorage.getItem('harmonix_progression_library_settings_v1');
    if (rawLib) {
      try {
        const parsedLib = JSON.parse(rawLib);
        if (parsedLib?.lastLoadedProgressionId) {
          matchedProg = allProgressions.find((p) => p.id === parsedLib.lastLoadedProgressionId);
        }
        if (parsedLib?.globalKeyRoot) targetKey = parsedLib.globalKeyRoot;
        if (parsedLib?.globalKeyMode) targetMode = parsedLib.globalKeyMode;
      } catch {}
    }

    if (!matchedProg) {
      const history = getActivityHistory();
      const lastPatternLoad = history.find((h) => h.type === 'pattern_load');
      if (lastPatternLoad?.title) {
        matchedProg = allProgressions.find((p) => p.name === lastPatternLoad.title);
      }
    }

    // 4. Default fallback: Pop Axis (4 Chords: I – V – vi – IV in C-dur)
    if (!matchedProg) {
      matchedProg = allProgressions.find((p) => p.id === 'pop_axis') || allProgressions[0];
    }

    if (matchedProg) {
      const { chords, metadata } = buildChordDefinitionsFromFamousProgression(matchedProg, targetKey, targetMode);
      const payload: StoredPatternPayload = {
        chords,
        metadata,
        progressionId: matchedProg.id,
        timestamp: Date.now(),
      };
      savePatternToStorage(chords, metadata, matchedProg.id);
      return payload;
    }
  } catch (err) {
    console.error('Error in loadInitialLastPattern:', err);
  }

  // Absolute safety net: Standard C - G - Am - F progression
  const popProg = FAMOUS_PROGRESSIONS.find((p) => p.id === 'pop_axis') || FAMOUS_PROGRESSIONS[0];
  const { chords, metadata } = buildChordDefinitionsFromFamousProgression(popProg, 'C', 'major');
  const fallbackPayload: StoredPatternPayload = {
    chords,
    metadata,
    progressionId: popProg.id,
    timestamp: Date.now(),
  };
  savePatternToStorage(chords, metadata, popProg.id);
  return fallbackPayload;
}
