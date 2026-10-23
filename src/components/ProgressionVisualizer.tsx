import React, { useState } from 'react';
import { ChordDefinition } from '../types/music';
import { sound } from '../utils/audioEngine';
import { Play, Square, RotateCcw, Volume2, ArrowRight } from 'lucide-react';

interface ProgressionVisualizerProps {
  progression: ChordDefinition[];
  onReset: () => void;
  onSelectChordIndex?: (idx: number) => void;
}

export const ProgressionVisualizer: React.FC<ProgressionVisualizerProps> = ({
  progression,
  onReset,
  onSelectChordIndex,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activePlayIndex, setActivePlayIndex] = useState<number | null>(null);
  const [bpm, setBpm] = useState(80);

  const handlePlayProgression = async () => {
    if (progression.length === 0 || isPlaying) return;
    setIsPlaying(true);

    const midiList = progression.map((ch) => ch.defaultNotes.map((n) => n.midi));

    try {
      await sound.playProgression(midiList, bpm, (activeIdx) => {
        setActivePlayIndex(activeIdx);
      });
    } finally {
      setIsPlaying(false);
      setActivePlayIndex(null);
    }
  };

  const handlePlaySingleChord = (chord: ChordDefinition, idx: number) => {
    setActivePlayIndex(idx);
    sound.playChord(chord.defaultNotes.map((n) => n.midi), 2.2, 0);
    setTimeout(() => {
      setActivePlayIndex(null);
    }, 1200);
    onSelectChordIndex?.(idx);
  };

  if (progression.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-800">
        <div>
          <div className="text-xs uppercase tracking-wider text-amber-400 font-semibold mb-0.5">
            Twoja tworzona progresja
          </div>
          <div className="text-lg font-bold text-white flex items-center gap-2">
            <span>Harmonia utworu ({progression.length} {progression.length === 1 ? 'akord' : progression.length < 5 ? 'akordy' : 'akordów'})</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <span>Tempo:</span>
            <input
              type="range"
              min="50"
              max="120"
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="w-16 h-1.5 accent-amber-500 cursor-pointer"
            />
            <span className="tabular-nums font-semibold text-slate-200">{bpm}</span>
            <span>BPM</span>
          </div>

          <button
            type="button"
            onClick={handlePlayProgression}
            disabled={isPlaying}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              isPlaying
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current animate-pulse" />
                <span>Odtwarzanie...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Odtwórz całość</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onReset}
            disabled={isPlaying}
            title="Rozpocznij od nowa"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer border border-slate-800"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Od nowa</span>
          </button>
        </div>
      </div>

      {/* Chords Sequence Flow */}
      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin">
        {progression.map((chord, index) => {
          const isActive = activePlayIndex === index;
          return (
            <React.Fragment key={`prog_chord_${index}_${chord.symbol}`}>
              <div
                onClick={() => handlePlaySingleChord(chord, index)}
                className={`relative group flex-shrink-0 flex flex-col p-3 rounded-xl border transition-all duration-200 cursor-pointer min-w-[120px] sm:min-w-[140px] ${
                  isActive
                    ? 'bg-amber-500/15 border-amber-400 ring-2 ring-amber-400/50 scale-[1.03] shadow-lg shadow-amber-500/20'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                }`}
              >
                {/* Step number badge */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span className="font-mono font-medium">#{index + 1}</span>
                  {chord.functionDegree && (
                    <span className="font-serif font-bold text-amber-400/90 text-xs">
                      {chord.functionDegree}
                    </span>
                  )}
                </div>

                {/* Main chord symbol */}
                <div className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-baseline gap-1">
                  <span>{chord.symbol}</span>
                  <span className="text-xs font-medium text-slate-400">
                    {chord.polishSymbol}
                  </span>
                </div>

                {/* Notes in chord */}
                <div className="mt-2 pt-2 border-t border-slate-800/70 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] font-mono text-slate-300">
                    {chord.defaultNotes.map((n) => n.note).join(' · ')}
                  </div>
                  <Volume2 className="w-3 h-3 text-slate-500 group-hover:text-amber-400 transition-colors" />
                </div>
              </div>

              {index < progression.length - 1 && (
                <div className="flex-shrink-0 text-slate-600">
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
