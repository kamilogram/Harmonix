import React, { useState, useEffect } from 'react';
import {
  FamousProgression,
  ChordDefinition,
  NoteName,
  NamingConvention,
} from '../types/music';
import {
  generateSmartProgression,
  saveCustomProgression,
  GeneratorArchetype,
  extractKeyFromProgression,
  transposeSmartProgression,
} from '../utils/progressionGenerator';
import {
  parseChordSymbol,
  createChordDefinition,
  getNoteLabel,
  NOTE_NAMES,
} from '../utils/musicTheory';
import { sound } from '../utils/audioEngine';
import { LoadedProgressionMetadata, formatDegreeLabel } from './ProgressionLibrary';
import {
  Wand2,
  Play,
  Square,
  Sparkles,
  Bookmark,
  Check,
  RotateCcw,
  Layers,
  ArrowRight,
  Music,
  Compass,
  Shuffle,
  ChevronDown,
} from 'lucide-react';

interface SmartProgressionGeneratorProps {
  convention?: NamingConvention;
  currentKeyRoot: NoteName;
  currentMode: 'major' | 'minor';
  onLoadProgression: (chords: ChordDefinition[], metadata?: LoadedProgressionMetadata) => void;
  onProgressionSaved?: () => void;
  onKeyChange?: (root: NoteName, mode: 'major' | 'minor') => void;
}

export const SmartProgressionGenerator: React.FC<SmartProgressionGeneratorProps> = ({
  convention = 'international',
  currentKeyRoot,
  currentMode,
  onLoadProgression,
  onProgressionSaved,
  onKeyChange,
}) => {
  const [archetype, setArchetype] = useState<GeneratorArchetype>('all');
  const [length, setLength] = useState<4 | 6 | 8>(4);
  const [generatedProg, setGeneratedProg] = useState<FamousProgression | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showKeyPicker, setShowKeyPicker] = useState(false);

  // Generate initial progression or on button click
  const handleGenerate = (customLength?: 4 | 6 | 8, customArchetype?: GeneratorArchetype, customKeyRoot?: NoteName) => {
    setIsSaved(false);
    const newProg = generateSmartProgression({
      archetype: customArchetype || archetype,
      length: customLength || length,
      keyRoot: customKeyRoot || currentKeyRoot,
      mode: currentMode,
    });
    setGeneratedProg(newProg);
  };

  // Generate initial progression or ADAPT when key / mode changes
  // User Request: Once generated, when changing or randomizing tonality, adapt existing progression to new key!
  useEffect(() => {
    if (!generatedProg) {
      handleGenerate();
      return;
    }

    const currentProgKey = extractKeyFromProgression(generatedProg);
    const rootChanged = currentProgKey.root !== currentKeyRoot;
    const modeChanged = currentProgKey.mode !== currentMode;

    if (rootChanged && !modeChanged) {
      // Transpose the currently generated rich progression directly into the new key!
      const adapted = transposeSmartProgression(generatedProg, currentKeyRoot, currentProgKey.root);
      setGeneratedProg(adapted);
    } else if (modeChanged) {
      // If mode changed (e.g. major to minor), regenerate with active archetype in new mode
      const newProg = generateSmartProgression({
        archetype,
        length,
        keyRoot: currentKeyRoot,
        mode: currentMode,
      });
      setGeneratedProg(newProg);
    }
  }, [currentKeyRoot, currentMode]);

  // Randomize tonality: picks a new root note and adapts the generated progression
  const handleRandomizeKey = () => {
    const otherRoots = NOTE_NAMES.filter((r) => r !== currentKeyRoot);
    const randomRoot = otherRoots[Math.floor(Math.random() * otherRoots.length)];
    if (onKeyChange) {
      onKeyChange(randomRoot, currentMode);
    } else {
      if (generatedProg) {
        const adapted = transposeSmartProgression(generatedProg, randomRoot, currentKeyRoot);
        setGeneratedProg(adapted);
      }
    }
  };

  // Select specific tonality from mini picker
  const handleSelectKey = (note: NoteName) => {
    setShowKeyPicker(false);
    if (note === currentKeyRoot) return;
    if (onKeyChange) {
      onKeyChange(note, currentMode);
    } else {
      if (generatedProg) {
        const adapted = transposeSmartProgression(generatedProg, note, currentKeyRoot);
        setGeneratedProg(adapted);
      }
    }
  };

  // Convert FamousProgression to ChordDefinition[]
  const getProgressionChords = (prog: FamousProgression): ChordDefinition[] => {
    return prog.steps.map((st) => {
      const parsed = parseChordSymbol(st.symbol);
      return createChordDefinition(parsed.root, parsed.quality, st.degree, st.role);
    });
  };

  const handlePlay = async () => {
    if (!generatedProg || isPlaying) return;
    setIsPlaying(true);
    const chords = getProgressionChords(generatedProg);
    const midisList = chords.map((c) => c.defaultNotes.map((n) => n.midi));
    try {
      await sound.playProgression(midisList, 84);
    } finally {
      setIsPlaying(false);
    }
  };

  const handleLoadIntoWorkshop = () => {
    if (!generatedProg) return;
    // User Request: Niech każde kliknięcie wstawienia do warsztatu wygrywanej progresji automatycznie zapisuje ją do wzorców na stałe
    saveCustomProgression(generatedProg);
    setIsSaved(true);
    onProgressionSaved?.();

    const chords = getProgressionChords(generatedProg);
    const degreesStr = generatedProg.steps.map((s) => formatDegreeLabel(s.degree)).join(' – ');

    onLoadProgression(chords, {
      keyName: generatedProg.key,
      progName: generatedProg.name,
      progId: generatedProg.id,
      degrees: degreesStr,
      root: currentKeyRoot,
      mode: currentMode,
    });
  };

  const handleSave = () => {
    if (!generatedProg) return;
    saveCustomProgression(generatedProg);
    setIsSaved(true);
    onProgressionSaved?.();
    setTimeout(() => setIsSaved(false), 3000);
  };

  const archetypesList: { id: GeneratorArchetype; label: string; desc: string; badge: string }[] = [
    { id: 'all', label: '🎲 Zaskocz mnie (Pełna paleta)', desc: 'Inteligentna eksploracja wszystkich kolorów harmonicznych', badge: 'Wszystkie' },
    { id: 'modern_pop', label: '🌟 Pop & Hymn (add9, sus)', desc: 'Stadionowy, świetlisty styl Coldplay, U2, The Script', badge: 'add9, sus4' },
    { id: 'film_noir', label: '🕵️ Film Noir & Suspense', desc: 'Mroczny kryminał, motyw Bonda, seksta molowa m6 i dim7', badge: 'm6, dim7, aug' },
    { id: 'neo_soul', label: '☕ Neo-Soul & Kawiarnia', desc: 'Aksamitne ciepło wielkich septym, nony add9 i zapożyczenie iv6', badge: 'maj7, iv6' },
    { id: 'gypsy_swing', label: '🎷 Gypsy Swing 1930s', desc: 'Paryski swing Django Reinhardta ze skocznymi szóstkami i dim7', badge: '6, dim7' },
    { id: 'ambient_wonder', label: '🌌 Ambient & Kosmos', desc: 'Hipnotyczna przestrzeń wszechświata z akordem zwiększonym aug', badge: 'aug, sus2' },
    { id: 'epic_rock', label: '🎸 Epicki Rock & Ballada', desc: 'Monumentalna podniosłość z całotonowym krokiem bVII i add9', badge: 'bVII, add9' },
  ];

  return (
    <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-[#0d1424] to-[#0a0f1d] border-2 border-amber-400/40 p-4 sm:p-6 shadow-2xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
            <Wand2 className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                Generator Progresji w Locie
              </h3>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
                sus2 · sus4 · 6 · m6 · aug · dim · add9
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Twórz w locie harmonicznie zbalansowane progresje z bogatymi akordami – bez przypadkowych dysonansów!
            </p>
          </div>
        </div>

        {/* User Request: Key Adaptation & Randomize Controls right in generator header */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap relative">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            W tonacji:
          </span>

          {/* Interactive Key Dropdown / Picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowKeyPicker((prev) => !prev)}
              className="px-2.5 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-sm flex items-center gap-1 cursor-pointer transition-all active:scale-95"
              title="Kliknij, aby wybrać inną tonację – wygenerowana progresja natychmiast się dostosuje!"
            >
              <span>{getNoteLabel(currentKeyRoot, convention)}-{currentMode === 'major' ? 'dur' : 'moll'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showKeyPicker ? 'rotate-180' : ''}`} />
            </button>

            {/* Quick 12-key dropdown popover */}
            {showKeyPicker && (
              <div className="absolute right-0 sm:left-0 top-full mt-2 z-40 p-2.5 rounded-2xl bg-slate-950 border-2 border-amber-400/60 shadow-2xl w-64 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md">
                <div className="text-[10px] font-bold text-slate-400 mb-2 px-1 flex items-center justify-between">
                  <span>Dostosuj do innej tonacji:</span>
                  <span className="text-amber-400 font-black">{currentMode === 'major' ? 'Durowa' : 'Molowa'}</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {NOTE_NAMES.map((note) => {
                    const isSelected = note === currentKeyRoot;
                    return (
                      <button
                        key={`gen_key_${note}`}
                        type="button"
                        onClick={() => handleSelectKey(note)}
                        className={`px-2 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950 font-black shadow-md ring-2 ring-amber-300'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800'
                        }`}
                      >
                        {getNoteLabel(note, convention)}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Randomize Tonality Button */}
          <button
            type="button"
            onClick={handleRandomizeKey}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-400/20 hover:bg-amber-400 text-amber-300 hover:text-slate-950 border border-amber-400/40 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
            title="Wylosuj nową tonację – wygenerowana progresja natychmiast dostosuje się do nowej tonacji!"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Losuj tonację</span>
            <span className="xs:hidden">Losuj</span>
          </button>
        </div>
      </div>

      {/* Controls: Archetype Chips & Length */}
      <div className="space-y-3">
        {/* Archetype Chips */}
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            1. Wybierz charakter harmoniczny:
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {archetypesList.map((item) => {
              const isSelected = archetype === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setArchetype(item.id);
                    handleGenerate(length, item.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer transition-all shrink-0 flex items-center gap-1.5 active:scale-95 border ${
                    isSelected
                      ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md ring-2 ring-amber-400/30'
                      : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-800'
                  }`}
                  title={item.desc}
                >
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Length selector & Generate Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              Liczba akordów:
            </span>
            <div className="inline-flex rounded-xl bg-slate-950 border border-slate-800 p-0.5">
              {([4, 6, 8] as const).map((len) => (
                <button
                  key={`len_${len}`}
                  type="button"
                  onClick={() => {
                    setLength(len);
                    handleGenerate(len, archetype);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    length === len
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {len} akordy
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleGenerate()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm cursor-pointer transition-all shadow-lg shadow-amber-400/20 active:scale-95"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span>✨ Generuj nową progresję</span>
          </button>
        </div>
      </div>

      {/* Generated Result Card */}
      {generatedProg && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-amber-500/35 shadow-inner space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                  {generatedProg.genre}
                </span>
                <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                  {generatedProg.structure}
                </span>
                <span className="text-[10px] text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md font-bold">
                  ✓ Spójność harmoniczna 100%
                </span>
              </div>
              <h4 className="text-base sm:text-lg font-bold text-white mt-1">
                {generatedProg.name}
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                {generatedProg.description}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={handlePlay}
                disabled={isPlaying}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer border ${
                  isPlaying
                    ? 'bg-amber-400 text-slate-950 border-amber-400 animate-pulse'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 active:scale-95'
                }`}
                title="Odsłuchaj brzmienie wygenerowanej progresji"
              >
                {isPlaying ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Gra...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Odsłuchaj</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Chords display row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin scrollbar-thumb-slate-800">
            {generatedProg.steps.map((st, sIdx) => {
              const parsed = parseChordSymbol(st.symbol);
              const label =
                convention === 'polish'
                  ? `${getNoteLabel(parsed.root, 'polish')}${
                      parsed.quality === 'major'
                        ? ''
                        : parsed.quality === 'minor'
                        ? 'm'
                        : parsed.quality === 'maj7'
                        ? 'maj7'
                        : parsed.quality === 'min7'
                        ? 'm7'
                        : parsed.quality === 'dom7'
                        ? '7'
                        : parsed.quality === 'major6'
                        ? '6'
                        : parsed.quality === 'minor6'
                        ? 'm6'
                        : parsed.quality === 'diminished'
                        ? 'dim'
                        : parsed.quality === 'dim7'
                        ? 'dim7'
                        : parsed.quality === 'augmented'
                        ? 'aug'
                        : parsed.quality === 'sus2'
                        ? 'sus2'
                        : parsed.quality === 'sus4'
                        ? 'sus4'
                        : parsed.quality === 'dom7sus4'
                        ? '7sus4'
                        : parsed.quality === 'add9'
                        ? 'add9'
                        : ''
                    }`
                  : st.symbol;

              return (
                <React.Fragment key={`gen_step_${sIdx}`}>
                  <div className="p-2 rounded-xl min-w-[70px] sm:min-w-[80px] text-center bg-slate-900 border border-slate-800 hover:border-amber-400/50 transition-colors shadow-sm">
                    <div className="text-sm sm:text-base font-black text-white tracking-tight">
                      {label}
                    </div>
                    <div className="text-[10px] font-mono font-bold text-amber-300 mt-0.5 truncate max-w-[76px]">
                      {st.degree}
                    </div>
                    <div className="text-[8px] text-slate-500 font-sans mt-0.5 truncate max-w-[76px]" title={st.role}>
                      {st.role.split('–')[0].trim()}
                    </div>
                  </div>
                  {sIdx < generatedProg.steps.length - 1 && (
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Action buttons: Load into Workshop & Save to Library */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-900">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-amber-400" />
              <span>Możesz wstawić tę progresję bezpośrednio do warsztatu lub zapisać do swoich wzorców.</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaved}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl cursor-pointer transition-all active:scale-95 border ${
                  isSaved
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800'
                }`}
                title="Zapisz ten wzorzec do listy na stałe"
              >
                {isSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                    <span>Zapisano we wzorcach!</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                    <span>Zapisz do wzorców</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleLoadIntoWorkshop}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-black rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 cursor-pointer transition-all shadow-md active:scale-95"
                title="Załaduj tę wygenerowaną progresję do warsztatu ćwiczeń"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Wstaw do warsztatu</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
