import React, { useState } from 'react';
import { PianoKeyboard } from './PianoKeyboard';
import { detectChordFromNotes, NOTE_NAMES, getNoteLabel, createChordDefinition } from '../utils/musicTheory';
import { ChordDefinition, NamingConvention, NoteName } from '../types/music';
import { sound } from '../utils/audioEngine';
import { Sparkles, RotateCcw, Volume2, ArrowRight } from 'lucide-react';

interface FreePlaySandboxProps {
  convention: NamingConvention;
  onStartProgressionWithChord: (chord: ChordDefinition) => void;
}

export const FreePlaySandbox: React.FC<FreePlaySandboxProps> = ({
  convention,
  onStartProgressionWithChord,
}) => {
  const [selectedMidis, setSelectedMidis] = useState<number[]>([]);
  const [startOctave, setStartOctave] = useState<number>(3); // 3 = C3 (48)

  const detectedChord = detectChordFromNotes(selectedMidis);

  const handleNoteToggle = (midi: number) => {
    setSelectedMidis((prev) => {
      const exists = prev.includes(midi);
      return exists ? prev.filter((m) => m !== midi) : [...prev, midi];
    });
  };

  const handleClear = () => {
    setSelectedMidis([]);
  };

  const handlePlaySelected = () => {
    if (selectedMidis.length > 0) {
      sound.playChord(selectedMidis, 2.4, 0);
    }
  };

  const handleSendToWorkshop = () => {
    if (selectedMidis.length === 0) return;
    const sorted = [...selectedMidis].sort((a, b) => a - b);
    const rootMidi = sorted[0];
    const rootName = NOTE_NAMES[rootMidi % 12];

    // Determine quality if possible
    let quality: any = 'major';
    if (detectedChord) {
      if (detectedChord.includes('7sus4')) quality = 'dom7sus4';
      else if (detectedChord.includes('sus2')) quality = 'sus2';
      else if (detectedChord.includes('sus4')) quality = 'sus4';
      else if (detectedChord.includes('maj7')) quality = 'maj7';
      else if (detectedChord.includes('m7b5')) quality = 'm7b5';
      else if (detectedChord.includes('m7')) quality = 'min7';
      else if (detectedChord.includes('7')) quality = 'dom7';
      else if (detectedChord.includes('m6')) quality = 'minor6';
      else if (detectedChord.includes('6')) quality = 'major6';
      else if (detectedChord.includes('add9')) quality = 'add9';
      else if (detectedChord.includes('dim7')) quality = 'dim7';
      else if (detectedChord.includes('dim')) quality = 'diminished';
      else if (detectedChord.includes('aug') || detectedChord.includes('+')) quality = 'augmented';
      else if (detectedChord.includes('moll') || detectedChord.includes('m')) quality = 'minor';
    }

    const chordDef = createChordDefinition(rootName, quality, 'I (Tonika)', 'Własny akord startowy');
    onStartProgressionWithChord(chordDef);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <span>Swobodne Pianino & Detektor Akordów</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Graj dowolne dźwięki myszką lub klawiaturą komputera. Aplikacja w czasie rzeczywistym wykrywa akordy i ich budowę!
          </p>
        </div>

        {/* Octave selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Rejestr:</span>
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setStartOctave(2)}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                startOctave === 2 ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400'
              }`}
            >
              C2 - C4
            </button>
            <button
              type="button"
              onClick={() => setStartOctave(3)}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                startOctave === 3 ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400'
              }`}
            >
              C3 - C5
            </button>
            <button
              type="button"
              onClick={() => setStartOctave(4)}
              className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                startOctave === 4 ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400'
              }`}
            >
              C4 - C6
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Detection Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              Wykryty Akord
            </div>
            <div className="text-xl sm:text-2xl font-black text-white">
              {detectedChord ? (
                <span className="text-amber-400">{detectedChord}</span>
              ) : selectedMidis.length > 0 ? (
                <span className="text-slate-400 text-base font-normal">
                  Wybrano dźwięki: {selectedMidis.map((m) => getNoteLabel(NOTE_NAMES[m % 12], convention)).join(', ')}
                </span>
              ) : (
                <span className="text-slate-500 text-base font-normal">
                  Zaznacz klawisze, aby zidentyfikować akord...
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {selectedMidis.length > 0 && (
            <>
              <button
                type="button"
                onClick={handlePlaySelected}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer border border-slate-700"
              >
                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Zagraj akord</span>
              </button>

              <button
                type="button"
                onClick={handleClear}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 rounded-lg transition-colors cursor-pointer border border-slate-800"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Wyczyść</span>
              </button>

              <button
                type="button"
                onClick={handleSendToWorkshop}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer shadow-md shadow-amber-400/20"
              >
                <span>Rozpocznij z nim ćwiczenie</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Piano View */}
      <div className="bg-slate-950/70 p-4 sm:p-6 rounded-2xl border border-slate-800/80 shadow-2xl flex flex-col items-center">
        <PianoKeyboard
          idPrefix="sandbox_piano"
          startMidi={(startOctave + 1) * 12}
          keyCount={25}
          selectedMidiNotes={selectedMidis}
          interactive={true}
          selectionMode="toggle"
          onNoteToggle={handleNoteToggle}
          convention={convention}
          showLabels={true}
        />
        <div className="mt-4 text-xs text-slate-400 text-center">
          Klawisze komputera: dolna oktawa <kbd className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-slate-300">Z, S, X, D, C, V, B...</kbd> · górna oktawa <kbd className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-slate-300">Q, 2, W, 3, E, R, T...</kbd>
        </div>
      </div>
    </div>
  );
};
