import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ChordDefinition, QuizChoice, NamingConvention, NoteName } from '../types/music';
import { PianoKeyboard } from './PianoKeyboard';
import { validateChordSelection, getNoteLabel } from '../utils/musicTheory';
import { sound } from '../utils/audioEngine';
import {
  Music,
  Check,
  AlertCircle,
  HelpCircle,
  Volume2,
  RotateCcw,
  ArrowRight,
  Eye,
  EyeOff,
} from 'lucide-react';

interface KeyboardPracticeStepProps {
  targetChoice: QuizChoice;
  previousChord?: ChordDefinition;
  convention: NamingConvention;
  onAdvanceNext: (addedChord: ChordDefinition) => void;
  onOpenTheory: () => void;
}

export const KeyboardPracticeStep: React.FC<KeyboardPracticeStepProps> = ({
  targetChoice,
  previousChord,
  convention,
  onAdvanceNext,
  onOpenTheory,
}) => {
  const targetChord = targetChoice.chord;
  const targetPitchClasses = targetChord.defaultNotes.map((n) => n.note);
  const requiredCount = targetPitchClasses.length;

  const [selectedMidis, setSelectedMidis] = useState<number[]>([]);
  const [highlightMap, setHighlightMap] = useState<
    Record<number, 'correct' | 'incorrect' | 'hint' | 'active'>
  >({});
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<{
    status: 'idle' | 'correct' | 'incorrect';
    message: string;
    details?: string;
  }>({ status: 'idle', message: '' });

  // Reset state when target changes
  useEffect(() => {
    setSelectedMidis([]);
    setHighlightMap({});
    setShowHint(false);
    setFeedback({ status: 'idle', message: '' });
  }, [targetChoice.id]);

  // Handle key toggles on the piano
  const handleNoteToggle = (midi: number) => {
    // If already verified correct, allow free playing or sound
    setSelectedMidis((prev) => {
      const exists = prev.includes(midi);
      const updated = exists ? prev.filter((m) => m !== midi) : [...prev, midi];

      // Reset feedback on edit
      setFeedback({ status: 'idle', message: '' });
      setHighlightMap({});

      // If user selected the required number of notes, auto-validate for smooth UX!
      if (updated.length === requiredCount) {
        setTimeout(() => checkSelection(updated), 50);
      }

      return updated;
    });
  };

  const checkSelection = (currentMidis: number[]) => {
    const result = validateChordSelection(currentMidis, targetChord);

    if (result.isCorrect) {
      // Sound feedback
      sound.playChord(currentMidis, 2.2, 0, 0.9);

      // Visual victory highlight
      const newMap: Record<number, 'correct'> = {};
      currentMidis.forEach((m) => {
        newMap[m] = 'correct';
      });
      setHighlightMap(newMap);

      // Confetti burst
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#10b981', '#38bdf8', '#fbbf24'],
        });
      } catch {
        // Ignored
      }

      setFeedback({
        status: 'correct',
        message: `Wspaniale! Akord ${targetChord.polishSymbol} (${targetChord.symbol}) ułożony perfekcyjnie!`,
        details: targetChoice.whyItWorks,
      });
    } else {
      const newMap: Record<number, 'correct' | 'incorrect'> = {};
      currentMidis.forEach((m) => {
        const noteName = targetChord.defaultNotes.find((n) => n.midi % 12 === m % 12);
        newMap[m] = noteName ? 'correct' : 'incorrect';
      });
      setHighlightMap(newMap);

      let msg = '';
      if (result.missingPitchClasses.length > 0 && result.extraPitchClasses.length > 0) {
        msg = `Brakuje ci dźwięków: ${result.missingPitchClasses
          .map((n) => getNoteLabel(n as NoteName, convention))
          .join(', ')}, a wybrano niepasujące nuty.`;
      } else if (result.missingPitchClasses.length > 0) {
        msg = `Akord potrzebuje jeszcze: ${result.missingPitchClasses
          .map((n) => getNoteLabel(n as NoteName, convention))
          .join(', ')}.`;
      } else if (result.extraPitchClasses.length > 0) {
        msg = `Zaznaczono niepasujące nuty: ${result.extraPitchClasses
          .map((n) => getNoteLabel(n as NoteName, convention))
          .join(', ')}.`;
      }

      setFeedback({
        status: 'incorrect',
        message: msg || 'Sprawdź zaznaczone klawisze.',
        details: `Trójdźwięk ${targetChord.displayQuality} składa się ze ściśle określonych interwałów od prymy ${getNoteLabel(
          targetChord.root,
          convention
        )}.`,
      });
    }
  };

  const handleShowHintToggle = () => {
    const nextState = !showHint;
    setShowHint(nextState);

    if (nextState) {
      // Highlight default midi target keys with hint color
      const hintMap: Record<number, 'hint'> = {};
      targetChord.defaultNotes.forEach((n) => {
        hintMap[n.midi] = 'hint';
      });
      setHighlightMap(hintMap);
    } else {
      setHighlightMap({});
    }
  };

  const handlePlayReferenceChord = () => {
    sound.playChord(targetChord.defaultNotes.map((n) => n.midi), 2.2, 0);
  };

  const handleClearSelection = () => {
    setSelectedMidis([]);
    setHighlightMap({});
    setFeedback({ status: 'idle', message: '' });
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-6 backdrop-blur-md shadow-2xl">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <Music className="w-3.5 h-3.5" />
            <span>Krok 2: Ćwiczenie na klawiaturze poniżej</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1 flex items-baseline gap-2">
            <span>Zbuduj akord:</span>
            <span className="text-amber-400 font-black">{targetChord.symbol}</span>
            <span className="text-sm font-semibold text-slate-400">
              ({targetChord.polishSymbol})
            </span>
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            Kliknij {requiredCount} odpowiednie klawisze na poniższej klawiaturze, aby zagrać ten akord.
          </p>
        </div>

        {/* Practice Helper Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handlePlayReferenceChord}
            title="Posłuchaj wzorcowego brzmienia"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Odsłuchaj akord</span>
          </button>

          <button
            type="button"
            onClick={handleShowHintToggle}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer border ${
              showHint
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            {showHint ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showHint ? 'Ukryj podpowiedź' : 'Pokaż podpowiedź'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenTheory}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Teoria</span>
          </button>
        </div>
      </div>

      {/* Target Chord Construction Guide */}
      <div className="mb-4 p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="text-slate-400">Składniki akordu:</span>
          {showHint ? (
            <div className="flex items-center gap-1 font-mono font-bold text-amber-400">
              {targetChord.defaultNotes.map((n, idx) => (
                <span
                  key={`hint_note_${idx}`}
                  className="px-2 py-0.5 bg-amber-400/15 border border-amber-400/30 rounded"
                >
                  {getNoteLabel(n.note, convention)}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-slate-400 italic">
              (Włącz podpowiedź lub odgadnij nuty samodzielnie)
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-slate-400">
            Zaznaczono:{' '}
            <span className="font-mono font-bold text-white tabular-nums">
              {selectedMidis.length} / {requiredCount}
            </span>
          </div>
          {selectedMidis.length > 0 && (
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Wyczyść</span>
            </button>
          )}
        </div>
      </div>

      {/* Piano Keyboard Component */}
      <div className="my-2">
        <PianoKeyboard
          idPrefix="practice_piano"
          startMidi={48} // C3
          keyCount={25}  // C3 to C5
          selectedMidiNotes={selectedMidis}
          highlightMap={highlightMap}
          interactive={true}
          selectionMode="toggle"
          onNoteToggle={handleNoteToggle}
          convention={convention}
          showLabels={true}
        />
      </div>

      {/* Feedback & Advance Step Banner */}
      <div className="mt-5 pt-4 border-t border-slate-800">
        {feedback.status === 'correct' ? (
          <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 shrink-0 mt-0.5">
                <Check className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h4 className="text-base font-bold text-emerald-300">
                  {feedback.message}
                </h4>
                {previousChord && (
                  <p className="text-xs text-emerald-200/80 mt-1">
                    Przejście z <span className="font-semibold text-white">{previousChord.symbol}</span> do{' '}
                    <span className="font-semibold text-white">{targetChord.symbol}</span> brzmi spójnie i naturalnie.
                  </p>
                )}
                {feedback.details && (
                  <p className="text-xs text-slate-300 mt-1 italic">
                    {feedback.details}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onAdvanceNext(targetChord)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-500/25 active:scale-95 cursor-pointer shrink-0"
            >
              <span>Kolejny akord w progresji</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : feedback.status === 'incorrect' ? (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-semibold text-rose-300">
                {feedback.message}
              </div>
              {feedback.details && (
                <div className="text-xs text-rose-200/70 mt-0.5">
                  {feedback.details}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <span>
              Wskazówka: możesz użyć klawiatury komputera lub kliknąć myszką/dotykiem na klawisze.
            </span>
            {selectedMidis.length > 0 && selectedMidis.length !== requiredCount && (
              <span className="text-amber-400/90 font-medium">
                Zaznacz jeszcze {requiredCount - selectedMidis.length}{' '}
                {requiredCount - selectedMidis.length === 1 ? 'dźwięk' : 'dźwięki'}.
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
