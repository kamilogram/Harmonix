import React, { useState } from 'react';
import { ChordDefinition, QuizChoice } from '../types/music';
import { sound } from '../utils/audioEngine';
import { Volume2, Sparkles, HelpCircle, CheckCircle2 } from 'lucide-react';

interface QuizStepProps {
  currentChord: ChordDefinition;
  choices: QuizChoice[];
  onSelectChoice: (choice: QuizChoice) => void;
  onOpenTheory: () => void;
}

export const QuizStep: React.FC<QuizStepProps> = ({
  currentChord,
  choices,
  onSelectChoice,
  onOpenTheory,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  const handlePreview = (choice: QuizChoice, e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewingId(choice.id);

    // Play current chord first, then 900ms later play candidate chord
    const currentMidis = currentChord.defaultNotes.map((n) => n.midi);
    const nextMidis = choice.chord.defaultNotes.map((n) => n.midi);

    sound.playChord(currentMidis, 1.4, 0, 0.75);
    setTimeout(() => {
      sound.playChord(nextMidis, 1.8, 0, 0.85);
    }, 900);

    setTimeout(() => {
      setPreviewingId(null);
    }, 2400);
  };

  const handleConfirm = () => {
    const choice = choices.find((c) => c.id === selectedId);
    if (choice) {
      onSelectChoice(choice);
    }
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur-md shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Krok 1: Quiz harmoniczny</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Jaki akord będzie teraz najlepiej pasował?
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            Twój obecny akord to{' '}
            <span className="font-bold text-amber-400">{currentChord.polishSymbol}</span> ({currentChord.symbol}).
            Wybierz kolejny krok, który stworzy piękną, naturalną harmonię.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenTheory}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Wskazówka teoretyczna</span>
        </button>
      </div>

      {/* Multiple Choice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 mb-6">
        {choices.map((choice, index) => {
          const isSelected = selectedId === choice.id;
          const isPreviewing = previewingId === choice.id;
          const letter = String.fromCharCode(65 + index); // A, B, C, D

          return (
            <div
              key={choice.id}
              onClick={() => setSelectedId(choice.id)}
              className={`relative flex flex-col p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-amber-500/10 border-amber-400 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/10'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono font-bold ${
                      isSelected
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {letter}
                  </span>
                  <div>
                    <span className="text-lg font-bold text-white tracking-tight">
                      {choice.chord.symbol}
                    </span>
                    <span className="text-xs text-slate-400 ml-1.5">
                      {choice.chord.polishSymbol}
                    </span>
                  </div>
                </div>

                {/* Preview Sound Button */}
                <button
                  type="button"
                  onClick={(e) => handlePreview(choice, e)}
                  disabled={isPreviewing}
                  title="Posłuchaj przejścia"
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer border ${
                    isPreviewing
                      ? 'bg-amber-400 text-slate-950 border-amber-400 animate-pulse'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{isPreviewing ? 'Gra...' : 'Posłuchaj'}</span>
                </button>
              </div>

              {/* Harmonic Role & Mood */}
              <div className="text-xs font-semibold text-amber-400/90 mb-1">
                {choice.degreeName}
              </div>
              <div className="text-xs text-slate-400 italic mb-2">
                „{choice.moodLabel}”
              </div>

              {/* Musical explanation */}
              <p className="text-xs text-slate-300 leading-relaxed mt-auto pt-2 border-t border-slate-800/60">
                {choice.explanation}
              </p>
            </div>
          );
        })}
      </div>

      {/* Confirmation CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
        <div className="text-xs text-slate-400 text-center sm:text-left">
          {selectedId ? (
            <span className="text-slate-200">
              Wybrano akord. Kliknij przycisk, aby przejść do ćwiczenia na klawiaturze.
            </span>
          ) : (
            <span>Wybierz jeden z powyższych akordów, aby przejść do ćwiczenia.</span>
          )}
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={!selectedId}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
            selectedId
              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/25 active:scale-95'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Wybieram ten akord i gram na pianinie</span>
        </button>
      </div>
    </div>
  );
};
