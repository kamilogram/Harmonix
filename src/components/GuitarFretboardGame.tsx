import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Award,
  Check,
  HelpCircle,
  Eye,
  EyeOff,
  Shuffle,
  ChevronRight,
  Play,
  ArrowRight,
  Hand,
  Settings2,
  BookOpen,
  Zap,
} from 'lucide-react';
import { NamingConvention, NoteName } from '../types/music';
import { sound, speakAnnouncement } from '../utils/audioEngine';
import {
  GUITAR_STRINGS,
  GUITAR_CHORD_DATABASE,
  GUITAR_PROGRESSIONS_QUESTS,
  GuitarChordDefinition,
  GuitarFretPosition,
  getFretMidi,
  getFretNote,
  getActiveGripMidis,
  validateGuitarGrip,
} from '../utils/guitarTheory';
import { getNoteLabel } from '../utils/musicTheory';

interface GuitarFretboardGameProps {
  convention: NamingConvention;
  onOpenTheory?: () => void;
  onBackToPiano?: () => void;
}

interface TouchPoint {
  id: number;
  x: number;
  y: number;
}

export const GuitarFretboardGame: React.FC<GuitarFretboardGameProps> = ({
  convention,
  onOpenTheory,
  onBackToPiano,
}) => {
  // Current game mode: 'progression' or 'random' or 'freeplay'
  const [gameMode, setGameMode] = useState<'progression' | 'random' | 'freeplay'>('progression');
  const [selectedQuestId, setSelectedQuestId] = useState<string>('pop_axis');
  const [currentChordIndex, setCurrentChordIndex] = useState<number>(0);

  // Ergonomic left-hand orientation settings:
  // 'vertical' = neck pointing down like a held guitar neck
  // 'horizontal' = traditional landscape guitar neck
  const [orientation, setOrientation] = useState<'vertical' | 'horizontal'>('vertical');
  // 'leftHandFretting' (standard guitar: left hand on neck) vs 'rightHandFretting' (mirror for lefties)
  const [isLeftyMirror, setIsLeftyMirror] = useState<boolean>(false);
  const [showFingerHints, setShowFingerHints] = useState<boolean>(true);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);

  // DOM refs: fretboardContainerRef ONLY wraps the playable neck surface so scrolling and buttons work freely
  const fretboardContainerRef = useRef<HTMLDivElement>(null);
  const fretboardGridRef = useRef<HTMLDivElement>(null);

  // Active touch points on the screen for visual contact feedback
  const [activeTouches, setActiveTouches] = useState<TouchPoint[]>([]);
  // Keep track of which (string, fret) pairs were recently sounded by touch to avoid sound flutter on tiny drag
  const activeSoundedPairsRef = useRef<Map<number, number>>(new Map());

  // Number of frets displayed (0 = nut/open, plus frets 1 to 5)
  const displayedFrets = useMemo(() => [1, 2, 3, 4, 5], []);

  // Current quest
  const currentQuest = useMemo(() => {
    return GUITAR_PROGRESSIONS_QUESTS.find((q) => q.id === selectedQuestId) || GUITAR_PROGRESSIONS_QUESTS[0];
  }, [selectedQuestId]);

  // Target chord
  const targetChord = useMemo<GuitarChordDefinition>(() => {
    if (gameMode === 'progression') {
      const chordId = currentQuest.chords[currentChordIndex % currentQuest.chords.length];
      return GUITAR_CHORD_DATABASE.find((c) => c.id === chordId) || GUITAR_CHORD_DATABASE[0];
    }
    // Random mode: pick by index or seed
    const idx = currentChordIndex % GUITAR_CHORD_DATABASE.length;
    return GUITAR_CHORD_DATABASE[idx];
  }, [gameMode, currentQuest, currentChordIndex]);

  // Next chord name for announcement
  const nextChord = useMemo<GuitarChordDefinition>(() => {
    if (gameMode === 'progression') {
      const nextIdx = (currentChordIndex + 1) % currentQuest.chords.length;
      const nextId = currentQuest.chords[nextIdx];
      return GUITAR_CHORD_DATABASE.find((c) => c.id === nextId) || GUITAR_CHORD_DATABASE[0];
    }
    const nextIdx = (currentChordIndex + 1) % GUITAR_CHORD_DATABASE.length;
    return GUITAR_CHORD_DATABASE[nextIdx];
  }, [gameMode, currentQuest, currentChordIndex]);

  // Nut states (open '0' vs muted 'x' for strings 0..5 when not fretted)
  const [nutState, setNutState] = useState<('x' | 0)[]>(() =>
    targetChord.frets.map((f) => (f === 'x' ? 'x' : 0))
  );

  // Map of currently physically pressed strings: stringIndex -> fretNumber
  // ONLY strings physically held by fingers right now are present here!
  // When a finger lifts, the string disappears from this map immediately.
  const [physicallyHeldFrets, setPhysicallyHeldFrets] = useState<Map<number, number>>(new Map());

  // Active toggled barre poprzeczki: fretNumber -> Set of stringIndexes
  // Allows one-click or tap barre holding per fret (e.g. F-dur on fret 1, Bm on fret 2)
  const [activeBarres, setActiveBarres] = useState<Map<number, Set<number>>>(new Map());

  // Tracks continuous trails of touches: touchId -> { fret: number, strings: Set<number> }
  // Enables holding multiple strings with a SINGLE finger via:
  // 1) Swiping/dragging a finger across adjacent strings on the same fret without dropping earlier strings
  // 2) Wide capacitive contact patch (touch.radiusX / touch.radiusY) when a finger is laid flat
  const touchTrailsRef = useRef<Map<number, { fret: number; strings: Set<number> }>>(new Map());

  // Desktop mouse dragging tracking across strings on the same fret
  const isMouseDownRef = useRef<boolean>(false);
  const mouseActiveFretRef = useRef<number | null>(null);

  // Game state
  const [streak, setStreak] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [lastSpeechText, setLastSpeechText] = useState<string>('');
  const [isStrumming, setIsStrumming] = useState<boolean>(false);

  // Strings ordered according to left/right orientation
  const orderedStrings = useMemo(() => {
    return isLeftyMirror ? [...GUITAR_STRINGS].reverse() : GUITAR_STRINGS;
  }, [isLeftyMirror]);

  // Combined held frets: live physically pressed strings + any active barre poprzeczki
  const effectiveHeldFrets = useMemo<Map<number, number>>(() => {
    const combined = new Map<number, number>(physicallyHeldFrets);
    activeBarres.forEach((strings, fret) => {
      strings.forEach((sIdx) => {
        const cur = combined.get(sIdx);
        if (cur === undefined || fret >= cur) {
          combined.set(sIdx, fret);
        }
      });
    });
    return combined;
  }, [physicallyHeldFrets, activeBarres]);

  // Reset base nut state when target chord changes and clear any pressed frets
  useEffect(() => {
    setNutState(targetChord.frets.map((f) => (f === 'x' ? 'x' : 0)));
    setPhysicallyHeldFrets(new Map());
    setActiveBarres(new Map());
    touchTrailsRef.current.clear();
    setIsSuccess(false);
    activeSoundedPairsRef.current.clear();
    setActiveTouches([]);
  }, [targetChord]);

  // Calculate active grip strictly from live physically pressed frets + barre + nut base
  const activeGrip = useMemo<GuitarFretPosition[]>(() => {
    return nutState.map((base, sIdx) => {
      const heldFret = effectiveHeldFrets.get(sIdx);
      if (heldFret !== undefined && heldFret > 0) {
        return heldFret;
      }
      return base;
    });
  }, [nutState, effectiveHeldFrets]);

  const handleResetGrip = useCallback(() => {
    setPhysicallyHeldFrets(new Map());
    setActiveBarres(new Map());
    touchTrailsRef.current.clear();
    setNutState(targetChord.frets.map((f) => (f === 'x' ? 'x' : 0)));
    setIsSuccess(false);
    activeSoundedPairsRef.current.clear();
    setActiveTouches([]);
  }, [targetChord]);

  // Quick Barre toggle for a fret (e.g. F-dur mini-barre on strings 4..5 or full 6-string barre)
  const handleToggleBarreOnFret = useCallback(
    (fretNum: number) => {
      setActiveBarres((prev) => {
        const next = new Map(prev);
        if (next.has(fretNum)) {
          next.delete(fretNum);
        } else {
          let stringsToBar: Set<number>;
          if (targetChord.barreFret === fretNum) {
            const start = targetChord.barreStartString ?? 0;
            stringsToBar = new Set<number>();
            for (let s = start; s <= 5; s++) {
              if (targetChord.frets[s] === fretNum) {
                stringsToBar.add(s);
              }
            }
            if (stringsToBar.size === 0) {
              for (let s = start; s <= 5; s++) stringsToBar.add(s);
            }
          } else {
            // Full 6-string barre
            stringsToBar = new Set([0, 1, 2, 3, 4, 5]);
          }
          next.set(fretNum, stringsToBar);

          // Acoustic sound plucks for the barre
          const midis = Array.from(stringsToBar).map((s) => getFretMidi(s, fretNum));
          sound.playGuitarStrum(midis, 2.2, 'down', 18, 0.9);
        }
        return next;
      });
    },
    [targetChord]
  );

  // Validation report of active grip
  const validation = useMemo(() => {
    return validateGuitarGrip(activeGrip, targetChord);
  }, [activeGrip, targetChord]);

  // Trigger celebration, audio announcement and advance to next chord
  const triggerSuccess = useCallback(() => {
    setIsSuccess(true);
    setScore((s) => s + 100);
    setStreak((st) => st + 1);

    // Confetti
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#f59e0b', '#10b981', '#38bdf8'],
      });
    } catch {}

    // Prepare Polish announcement for next chord
    const targetName = convention === 'polish' ? targetChord.polishName : targetChord.name;
    const nextName = convention === 'polish' ? nextChord.polishName : nextChord.name;
    const announcement = `Świetnie! Zagrałeś ${targetName}. Kolejny akord to: ${nextName}!`;
    setLastSpeechText(announcement);

    if (voiceEnabled) {
      speakAnnouncement(announcement);
    }

    // Advance to next chord after 2.2 seconds so user can hear the strum and feedback
    setTimeout(() => {
      setCurrentChordIndex((prev) => prev + 1);
      setIsSuccess(false);
    }, 2200);
  }, [convention, targetChord, nextChord, voiceEnabled]);

  // Auto-check whenever grip updates:
  // If all required strings are simultaneously held by fingers right now -> WIN!
  useEffect(() => {
    if (validation.isCorrect && !isSuccess) {
      const playedMidis = getActiveGripMidis(activeGrip);
      sound.playGuitarStrum(playedMidis, 2.6, 'down', 22, 0.95);
      triggerSuccess();
    }
  }, [validation.isCorrect, isSuccess, activeGrip, triggerSuccess]);

  // Handle open / mute toggle for a string nut button (Próg 0)
  const handleStringNutClick = (stringIndex: number) => {
    setNutState((prev) => {
      const next = [...prev];
      if (next[stringIndex] === 'x') {
        next[stringIndex] = 0;
        sound.playGuitarNote(getFretMidi(stringIndex, 0), 2.0, 0.85);
      } else {
        next[stringIndex] = 'x';
      }
      return next;
    });
  };

  // Perform full chord strum (downstroke)
  const handleStrum = useCallback(
    (direction: 'down' | 'up' = 'down') => {
      setIsStrumming(true);
      const playedMidis = getActiveGripMidis(activeGrip);

      if (playedMidis.length > 0) {
        sound.playGuitarStrum(playedMidis, 2.5, direction, 24, 0.92);
      }

      setTimeout(() => {
        setIsStrumming(false);
      }, 400);

      if (validation.isCorrect && !isSuccess) {
        triggerSuccess();
      }
    },
    [activeGrip, validation, isSuccess, triggerSuccess]
  );

  // Multi-Touch Processor:
  // Supports single-finger multi-string barre holding via:
  // 1) Finger swipe/drag across strings on the same fret (retaining traversed strings in touchTrailsRef)
  // 2) Wide capacitive contact patch (touch.radiusX / touch.radiusY) when finger is laid flat across strings
  // 3) Momentary physical touch: all strings associated with a finger lift immediately when that finger lifts!
  const processTouches = useCallback(
    (touches: TouchList) => {
      // If all fingers have lifted from the screen -> ALL pressed notes disappear!
      if (!touches || touches.length === 0) {
        setActiveTouches([]);
        touchTrailsRef.current.clear();
        activeSoundedPairsRef.current.clear();
        setPhysicallyHeldFrets(new Map());
        return;
      }

      const container = fretboardContainerRef.current;
      const grid = fretboardGridRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const gridRect = grid?.getBoundingClientRect();

      const newTouchPoints: TouchPoint[] = [];
      const currentTouchesByString = new Map<number, number>(); // stringIndex -> fretNumber

      for (let i = 0; i < touches.length; i++) {
        const t = touches[i];
        const touchId = t.identifier;
        newTouchPoints.push({
          id: touchId,
          x: t.clientX - containerRect.left,
          y: t.clientY - containerRect.top,
        });

        // 1. Try direct element identification via elementFromPoint
        let hitFret: { stringIndex: number; fret: number } | null = null;
        let hitNutString: number | null = null;

        const el = document.elementFromPoint(t.clientX, t.clientY);
        const fretCell = el?.closest('[data-fret-target="true"]') as HTMLElement | null;
        const nutBtn = el?.closest('[data-nut-target="true"]') as HTMLElement | null;

        if (fretCell) {
          const s = parseInt(fretCell.dataset.stringIndex ?? '', 10);
          const f = parseInt(fretCell.dataset.fret ?? '', 10);
          if (!isNaN(s) && !isNaN(f)) {
            hitFret = { stringIndex: s, fret: f };
          }
        } else if (nutBtn) {
          const s = parseInt(nutBtn.dataset.stringIndex ?? '', 10);
          if (!isNaN(s)) {
            hitNutString = s;
          }
        }

        // 2. High-precision geometric fallback if finger is touching within gridRect
        if (!hitFret && !hitNutString && gridRect) {
          const { left, top, width, height } = gridRect;
          if (
            t.clientX >= left &&
            t.clientX <= left + width &&
            t.clientY >= top &&
            t.clientY <= top + height
          ) {
            if (orientation === 'vertical') {
              const colWidth = width / 6;
              const colIdx = Math.max(0, Math.min(5, Math.floor((t.clientX - left) / colWidth)));
              const stringIndex = orderedStrings[colIdx].index;

              const rowHeight = height / 5;
              const fretNum = Math.max(1, Math.min(5, Math.floor((t.clientY - top) / rowHeight) + 1));
              hitFret = { stringIndex, fret: fretNum };
            } else {
              // Horizontal orientation
              const colWidth = width / 5;
              const fretNum = Math.max(1, Math.min(5, Math.floor((t.clientX - left) / colWidth) + 1));

              const rowHeight = height / 6;
              const rowIdx = Math.max(0, Math.min(5, Math.floor((t.clientY - top) / rowHeight)));
              const stringIndex = orderedStrings[rowIdx].index;
              hitFret = { stringIndex, fret: fretNum };
            }
          }
        }

        if (hitFret) {
          const currentFret = hitFret.fret;
          const hitStrings = new Set<number>([hitFret.stringIndex]);

          // Capacitive radius detection: flat finger spanning adjacent strings
          if (gridRect) {
            const { left, top, width, height } = gridRect;
            // Radius in CSS pixels (supported by modern mobile browsers)
            const radX = Math.max(16, (t as unknown as { radiusX?: number }).radiusX || 16);
            const radY = Math.max(16, (t as unknown as { radiusY?: number }).radiusY || 16);

            if (orientation === 'vertical' && radX > 22) {
              const colWidth = width / 6;
              for (let c = 0; c < 6; c++) {
                const colCenter = left + (c + 0.5) * colWidth;
                if (Math.abs(t.clientX - colCenter) <= radX) {
                  hitStrings.add(orderedStrings[c].index);
                }
              }
            } else if (orientation === 'horizontal' && radY > 22) {
              const rowHeight = height / 6;
              for (let r = 0; r < 6; r++) {
                const rowCenter = top + (r + 0.5) * rowHeight;
                if (Math.abs(t.clientY - rowCenter) <= radY) {
                  hitStrings.add(orderedStrings[r].index);
                }
              }
            }
          }

          // Single finger swipe / drag across strings on same fret:
          // Keep all previously swiped strings active for this finger as long as it remains on this fret!
          const existingTrail = touchTrailsRef.current.get(touchId);
          if (existingTrail && existingTrail.fret === currentFret) {
            hitStrings.forEach((s) => existingTrail.strings.add(s));
          } else {
            touchTrailsRef.current.set(touchId, { fret: currentFret, strings: hitStrings });
          }
        }
      }

      // Remove any touch trails for fingers that were lifted from screen
      const activeTouchIds = new Set<number>();
      for (let i = 0; i < touches.length; i++) {
        activeTouchIds.add(touches[i].identifier);
      }
      touchTrailsRef.current.forEach((_, id) => {
        if (!activeTouchIds.has(id)) {
          touchTrailsRef.current.delete(id);
        }
      });

      // Combine all active trails into currentTouchesByString
      touchTrailsRef.current.forEach((trail) => {
        trail.strings.forEach((sIdx) => {
          const existing = currentTouchesByString.get(sIdx);
          if (existing === undefined || trail.fret > existing) {
            currentTouchesByString.set(sIdx, trail.fret);
          }
        });
      });

      setActiveTouches(newTouchPoints);

      // Play audio plucks for newly pressed string/fret pairs
      currentTouchesByString.forEach((fret, sIdx) => {
        if (activeSoundedPairsRef.current.get(sIdx) !== fret) {
          const midi = getFretMidi(sIdx, fret);
          sound.playGuitarNote(midi, 2.0, 0.9);
        }
      });

      activeSoundedPairsRef.current = new Map(currentTouchesByString);

      // Set physicallyHeldFrets strictly to what active fingers are currently touching
      setPhysicallyHeldFrets(new Map(currentTouchesByString));
    },
    [orderedStrings, orientation]
  );

  // Desktop mouse handlers with drag-across-strings-on-same-fret support
  const handleFretMouseDown = (stringIndex: number, fret: number) => {
    isMouseDownRef.current = true;
    mouseActiveFretRef.current = fret;
    const midi = getFretMidi(stringIndex, fret);
    sound.playGuitarNote(midi, 2.0, 0.9);
    setPhysicallyHeldFrets((prev) => new Map(prev).set(stringIndex, fret));
  };

  const handleFretMouseEnter = (stringIndex: number, fret: number) => {
    // If mouse is being dragged across strings on the SAME fret -> add to held strings!
    if (isMouseDownRef.current && mouseActiveFretRef.current === fret) {
      const midi = getFretMidi(stringIndex, fret);
      sound.playGuitarNote(midi, 2.0, 0.9);
      setPhysicallyHeldFrets((prev) => new Map(prev).set(stringIndex, fret));
    }
  };

  const handleFretMouseUp = (stringIndex: number) => {
    setPhysicallyHeldFrets((prev) => {
      const next = new Map(prev);
      next.delete(stringIndex);
      return next;
    });
  };

  // Global mouseup listener to release held frets when dragging ends
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isMouseDownRef.current) {
        isMouseDownRef.current = false;
        mouseActiveFretRef.current = null;
        setPhysicallyHeldFrets(new Map());
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Attach non-passive touch listeners ONLY to the playable neck surface!
  // This isolates pinch-zoom protection to the strings, while leaving buttons and page scrolling 100% free!
  useEffect(() => {
    const container = fretboardContainerRef.current;
    if (!container) return;

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      processTouches(e.touches);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      processTouches(e.touches);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      processTouches(e.touches);
    };

    const handleTouchCancel = (e: TouchEvent) => {
      e.preventDefault();
      setActiveTouches([]);
      activeSoundedPairsRef.current.clear();
      setPhysicallyHeldFrets(new Map());
    };

    // Block Safari pinch-to-zoom gestures ONLY on the playable neck
    const handleGesture = (e: Event) => {
      e.preventDefault();
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });
    container.addEventListener('touchcancel', handleTouchCancel, { passive: false });

    container.addEventListener('gesturestart', handleGesture, { passive: false });
    container.addEventListener('gesturechange', handleGesture, { passive: false });
    container.addEventListener('gestureend', handleGesture, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchCancel);

      container.removeEventListener('gesturestart', handleGesture);
      container.removeEventListener('gesturechange', handleGesture);
      container.removeEventListener('gestureend', handleGesture);
    };
  }, [processTouches]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 pb-12 select-none">
      {/* Top Banner: Instrument Switch & Quick Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-lg backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎸</span>
              <div>
                <h1 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <span>Rączka Gitary</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
                    Gryf & Chwyty
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Fizyczny docisk palcami · Dźwięk znika po puszczeniu struny
                </p>
              </div>
            </div>

            {onBackToPiano && (
              <button
                type="button"
                onClick={onBackToPiano}
                className="sm:hidden px-2.5 py-1 text-xs font-bold rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
              >
                🎹 Pianino
              </button>
            )}
          </div>

          {/* Quick Ergonomic Toggles */}
          <div className="flex items-center gap-2 flex-wrap justify-end w-full sm:w-auto">
            {/* Live Finger Contact Status Badge */}
            <div
              className={`px-2.5 py-1 text-[11px] font-bold rounded-xl border flex items-center gap-1.5 transition-all ${
                effectiveHeldFrets.size > 0
                  ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-amber-300/80 border-amber-400/20'
              }`}
              title="Aplikacja rejestruje tylko te struny, które są aktualnie fizycznie dotykane palcami lub zablokowane w barre."
            >
              <span>🖐️</span>
              <span>
                {effectiveHeldFrets.size > 0
                  ? `${effectiveHeldFrets.size} ${effectiveHeldFrets.size === 1 ? 'dociśnięta struna' : 'dociśnięte struny'}`
                  : 'Fizyczny docisk (Chwilowy)'}
              </span>
            </div>

            {/* Ergonomic Neck Orientation */}
            <button
              type="button"
              onClick={() => setOrientation((o) => (o === 'vertical' ? 'horizontal' : 'vertical'))}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                orientation === 'vertical'
                  ? 'bg-amber-400 text-slate-950 border-amber-300 font-black shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title="Przełącz orientację gryfu: pionowa (jak trzymana rączka gitary) lub pozioma"
            >
              <Hand className="w-3.5 h-3.5" />
              <span>{orientation === 'vertical' ? 'Pionowy gryf' : 'Poziomy gryf'}</span>
            </button>

            {/* Left/Right hand mirror */}
            <button
              type="button"
              onClick={() => setIsLeftyMirror((m) => !m)}
              className={`px-2.5 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                isLeftyMirror
                  ? 'bg-purple-500/25 text-purple-300 border-purple-400/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title="Odwróć układ strun dla leworęcznych lub praworęcznych"
            >
              <span>{isLeftyMirror ? 'Leworęczny' : 'Praworęczny'}</span>
            </button>

            {/* Voice announcements toggle */}
            <button
              type="button"
              onClick={() => setVoiceEnabled((v) => !v)}
              className={`p-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                voiceEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title={voiceEnabled ? 'Lektor polski włączony (mówi jaki akord jest następny)' : 'Lektor wyłączony'}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* Target Chord Card & Quiz HUD */}
      <div className="bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 border border-amber-500/35 rounded-2xl p-4 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Zadany akord do złapania (przytrzymaj palcami):</span>
            </div>
            <div className="flex items-baseline gap-3">
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                {convention === 'polish' ? targetChord.polishName : targetChord.name}
              </h2>
              <span className="text-xs text-slate-300 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                Składowe: {targetChord.formula}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-lg">
              {targetChord.leftHandTips}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400">Seria chwytów</div>
              <div className="text-xl font-black text-amber-400">🔥 {streak}</div>
            </div>

            <button
              type="button"
              onClick={() => setShowFingerHints((s) => !s)}
              className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95 ${
                showFingerHints
                  ? 'bg-amber-400 text-slate-950 border-amber-300 font-black'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
              title="Pokaż lub ukryj podpowiedzi palców lewej ręki (1=wskazujący, 2=środkowy, 3=serdeczny, 4=mały)"
            >
              {showFingerHints ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{showFingerHints ? 'Ukryj palcowanie' : 'Pokaż palcowanie'}</span>
            </button>
          </div>
        </div>

        {/* Spoken voice speech bubble / toast */}
        {lastSpeechText && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-xs text-emerald-200 flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
            <Volume2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{lastSpeechText}</span>
          </div>
        )}
      </div>

      {/* Main Guitar Board Container (Normal flow, allows full page scrolling) */}
      <div className="bg-[#120c08] border-4 border-[#2b1810] rounded-3xl p-3 sm:p-5 shadow-2xl relative select-none">
        {/* Rosewood wood grain texture overlay */}
        <div
          className="absolute inset-0 opacity-40 pointer-events-none rounded-2xl"
          style={{
            backgroundImage:
              'radial-gradient(ellipse at center, rgba(120,53,15,0.2) 0%, rgba(20,10,5,0.7) 100%), repeating-linear-gradient(90deg, transparent, transparent 15px, rgba(0,0,0,0.15) 15px, rgba(0,0,0,0.15) 30px)',
          }}
        />

        {/* User Request: IN-VIEW TARGET CHORD CORNER BANNER (Nie trzeba scrollować!) */}
        <div className="relative z-20 mb-3 p-3 rounded-2xl bg-gradient-to-r from-[#170e08] via-[#0d0705] to-[#170e08] border-2 border-amber-500/50 shadow-xl flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-400 text-slate-950 font-black flex flex-col items-center justify-center shadow-lg shadow-amber-400/20 shrink-0">
              <span className="text-[9px] uppercase tracking-wider font-extrabold leading-none">Akord</span>
              <span className="text-base font-black leading-tight">🎯</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-2xl font-black text-white tracking-tight">
                  {convention === 'polish' ? targetChord.polishName : targetChord.name}
                </span>
                <span className="text-xs font-mono font-bold text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-md border border-amber-400/40">
                  {targetChord.formula}
                </span>
                {validation.isCorrect && (
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/40 animate-pulse">
                    ✓ Złapany!
                  </span>
                )}
              </div>
              <p className="text-xs text-amber-200/90 font-medium line-clamp-1 sm:line-clamp-none">
                {targetChord.leftHandTips}
              </p>
            </div>
          </div>

          {/* Right corner quick grip formula */}
          <div className="text-right shrink-0 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Układ strun</span>
            <span className="text-xs font-mono font-black text-amber-400">
              {targetChord.frets.map((f) => (f === 'x' ? '✕' : f)).join(' ')}
            </span>
          </div>
        </div>

        {/* Educational Barre Guide Strip */}
        <div className="relative z-20 mb-3 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200/90 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-amber-400/20 text-amber-300 shrink-0">
              <Zap className="w-3.5 h-3.5 fill-current" />
            </span>
            <span>
              <strong className="text-white">Chwyt barowy (poprzeczka jednym palcem):</strong> Możesz przeciągnąć palcem po strunach na tym samym progu, położyć palec płasko lub kliknąć przycisk <strong className="text-amber-300">[⚡ Barre]</strong> przy progu!
            </span>
          </div>
          {targetChord.barreFret && (
            <span className="px-2 py-0.5 rounded-md bg-amber-400/25 text-amber-300 font-black text-[11px] border border-amber-400/50">
              Wymagane Barre: Próg {targetChord.barreFret}
            </span>
          )}
        </div>

        {/* Headstock / Nut Header (Siodełko) */}
        <div className="relative z-10 mb-2 flex items-center justify-between pb-1.5 border-b border-amber-900/40">
          <div className="text-xs font-bold text-amber-200/80 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block animate-pulse"></span>
            <span>Siodełko gitary (Próg 0 / Otwarte struny)</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Trzymaj palcami progi – puszczenie zwalnia dźwięk
          </div>
        </div>

        {/* PLAYABLE NECK SURFACE: Touch-locked ONLY here so buttons and page scrolling work smoothly! */}
        <div
          ref={fretboardContainerRef}
          className="instrument-touch-surface relative rounded-2xl select-none"
          style={{ touchAction: 'none' }}
        >
          {/* Live Touch Ripple / Finger Contact Rings under active touches */}
          {activeTouches.map((touch) => (
            <div
              key={`touch_ring_${touch.id}`}
              className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 z-30"
              style={{ left: touch.x, top: touch.y }}
            >
              <div className="w-12 h-12 rounded-full border-2 border-amber-400 bg-amber-400/25 animate-ping" />
              <div className="w-5 h-5 rounded-full bg-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.9)] absolute top-3.5 left-3.5" />
            </div>
          ))}

          {/* Frets Area: Rendered either vertically or horizontally */}
          {orientation === 'vertical' ? (
            /* VERTICAL NECK (Natural for holding with left hand!) */
            <div className="relative z-10 w-full overflow-x-auto pb-2">
              <div
                ref={fretboardGridRef}
                className="min-w-[320px] max-w-lg mx-auto flex flex-col bg-[#1f120c] rounded-2xl border-2 border-[#3d2315] shadow-inner select-none relative"
                style={{ touchAction: 'none' }}
              >
                {/* Floating Corner Chord Badge on the neck */}
                <div className="absolute top-2 right-2 z-20 pointer-events-none bg-slate-950/90 border border-amber-400/50 rounded-lg px-2 py-0.5 shadow-md">
                  <span className="text-[10px] font-black text-amber-300">
                    🎯 {convention === 'polish' ? targetChord.polishName : targetChord.name}
                  </span>
                </div>

                {/* String Nut Controls Row (Open O / Mute X) */}
                <div className="grid grid-cols-6 border-b-4 border-[#e2d5c3] bg-[#0d0705] py-2 px-1 rounded-t-2xl">
                  {orderedStrings.map((stringInfo) => {
                    const sIdx = stringInfo.index;
                    const currentFret = activeGrip[sIdx];
                    const isMuted = currentFret === 'x';
                    const isOpen = currentFret === 0;

                    return (
                      <div key={`nut_str_${sIdx}`} className="flex flex-col items-center justify-center">
                        <span className="text-[10px] font-bold text-slate-400 mb-1 pointer-events-none">
                          {stringInfo.name}
                        </span>
                        <button
                          type="button"
                          data-nut-target="true"
                          data-string-index={sIdx}
                          onClick={() => handleStringNutClick(sIdx)}
                          className={`w-8 h-8 rounded-full font-black text-xs flex items-center justify-center transition-all cursor-pointer shadow-md active:scale-90 border select-none ${
                            isMuted
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                              : isOpen
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30 ring-2 ring-emerald-400/20'
                              : 'bg-amber-400 text-slate-950 border-amber-300 font-black'
                          }`}
                          style={{ touchAction: 'none' }}
                          title={
                            isMuted
                              ? 'Struna wytłumiona (X). Kliknij, by zagrać otwartą (O)'
                              : isOpen
                              ? 'Otwarta struna (O). Kliknij, by wytłumić (X)'
                              : `Naciśnięty próg ${currentFret}`
                          }
                        >
                          <span className="pointer-events-none">{isMuted ? '✕' : isOpen ? '○' : currentFret}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Frets Rows (Progi 1 do 5) */}
                {displayedFrets.map((fretNum) => {
                  const hasDotMarker = fretNum === 3 || fretNum === 5;
                  const isBarreActive = activeBarres.has(fretNum);
                  const isTargetBarreFret = targetChord.barreFret === fretNum;

                  // Find which strings on this fret are held
                  const stringsOnFret = Array.from(effectiveHeldFrets.entries())
                    .filter(([_, f]) => f === fretNum)
                    .map(([s]) => s);
                  const hasBarre = stringsOnFret.length >= 2;

                  return (
                    <div
                      key={`fret_row_${fretNum}`}
                      className="relative grid grid-cols-6 py-4 px-1 border-b-4 border-[#b4b4b4] hover:bg-white/[0.02] transition-colors"
                    >
                      {/* Fret wire shadow and metallic sheen */}
                      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-slate-400 via-white to-slate-400 shadow-[0_2px_4px_rgba(0,0,0,0.6)] pointer-events-none" />

                      {/* Fret Marker Pearl Dot (Progi 3 i 5) */}
                      {hasDotMarker && (
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-200/70 border border-slate-300 shadow-inner pointer-events-none flex items-center justify-center text-[9px] font-bold text-slate-600">
                          {fretNum}
                        </div>
                      )}

                      {/* Quick Interactive Barre Button + Fret Label on left side */}
                      <div className="absolute -left-1 sm:-left-20 top-1/2 -translate-y-1/2 flex items-center gap-1 z-20">
                        <button
                          type="button"
                          onClick={() => handleToggleBarreOnFret(fretNum)}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                            handleToggleBarreOnFret(fretNum);
                          }}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-black tracking-tight transition-all shadow cursor-pointer border select-none flex items-center gap-0.5 ${
                            isBarreActive
                              ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-400/50 scale-105'
                              : isTargetBarreFret
                              ? 'bg-amber-500/25 text-amber-300 border-amber-400/50 animate-pulse hover:bg-amber-400/40'
                              : 'bg-slate-900/90 text-slate-400 border-slate-700/80 hover:text-white hover:bg-slate-800'
                          }`}
                          title={`Zablokuj/odblokuj poprzeczkę (Barre) na progu ${fretNum}`}
                        >
                          <Zap className="w-2.5 h-2.5 fill-current" />
                          <span>{isBarreActive ? '✓Barre' : 'Barre'}</span>
                        </button>
                        <span className="text-[10px] font-bold text-slate-500 hidden sm:inline">P{fretNum}</span>
                      </div>

                      {/* Connected Visual Barre Pill across held strings on this fret */}
                      {hasBarre && (() => {
                        const colIndices = stringsOnFret
                          .map((s) => orderedStrings.findIndex((str) => str.index === s))
                          .filter((idx) => idx >= 0);
                        if (colIndices.length < 2) return null;
                        const minCol = Math.min(...colIndices);
                        const maxCol = Math.max(...colIndices);
                        const leftPct = (minCol / 6) * 100 + 2;
                        const widthPct = ((maxCol - minCol + 1) / 6) * 100 - 4;

                        return (
                          <div
                            className="absolute top-1/2 -translate-y-1/2 h-10 rounded-full bg-gradient-to-r from-amber-400/85 via-emerald-400/90 to-amber-400/85 border-2 border-emerald-300 shadow-lg shadow-emerald-500/30 pointer-events-none z-10 flex items-center justify-center transition-all animate-in fade-in duration-100"
                            style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                          >
                            <span className="text-[9px] font-black text-slate-950 uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/85 shadow-sm flex items-center gap-1">
                              <Zap className="w-2.5 h-2.5 fill-amber-500 text-amber-600" />
                              <span>P1 (Barre {stringsOnFret.length} strun)</span>
                            </span>
                          </div>
                        );
                      })()}

                      {/* Strings columns */}
                      {orderedStrings.map((stringInfo) => {
                        const sIdx = stringInfo.index;
                        const isPressed = effectiveHeldFrets.get(sIdx) === fretNum;
                        const targetFretForString = targetChord.frets[sIdx];
                        const isTargetHere = targetFretForString === fretNum;
                        const targetFinger = targetChord.fingers[sIdx];

                        return (
                          <div
                            key={`fret_cell_${fretNum}_${sIdx}`}
                            data-fret-target="true"
                            data-string-index={sIdx}
                            data-fret={fretNum}
                            className="relative h-12 sm:h-14 flex items-center justify-center"
                            style={{ touchAction: 'none' }}
                          >
                            {/* Physical String Wire running vertically */}
                            <div
                              className="absolute top-0 bottom-0 pointer-events-none transition-all"
                              style={{
                                width: `${stringInfo.gaugeWidth}px`,
                                backgroundColor: stringInfo.color,
                                boxShadow: isStrumming
                                  ? '0 0 8px rgba(251, 191, 36, 0.8)'
                                  : '0 1px 3px rgba(0,0,0,0.8)',
                              }}
                            />

                            {/* Touch Target Button for this Fret & String */}
                            <button
                              type="button"
                              data-fret-target="true"
                              data-string-index={sIdx}
                              data-fret={fretNum}
                              onMouseDown={() => handleFretMouseDown(sIdx, fretNum)}
                              onMouseEnter={() => handleFretMouseEnter(sIdx, fretNum)}
                              onMouseUp={() => handleFretMouseUp(sIdx)}
                              className="relative z-10 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-transform active:scale-90"
                              style={{ touchAction: 'none' }}
                              title={`Struna ${stringInfo.label}, Próg ${fretNum} (${getFretNote(sIdx, fretNum)})`}
                            >
                              {/* User placed finger (disappears the moment finger is lifted) */}
                              {isPressed ? (
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shadow-lg transition-all animate-in zoom-in-75 duration-75 pointer-events-none ${
                                    isTargetHere
                                      ? 'bg-emerald-400 text-slate-950 ring-4 ring-emerald-400/40 shadow-emerald-500/50'
                                      : 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                                  }`}
                                >
                                  {showFingerHints && targetFinger && isTargetHere
                                    ? targetFinger
                                    : getFretNote(sIdx, fretNum)}
                                </div>
                              ) : showFingerHints && isTargetHere ? (
                                /* Target Ghost Hint */
                                <div className="w-7 h-7 rounded-full border-2 border-dashed border-amber-400/70 bg-amber-400/15 text-amber-300 flex items-center justify-center text-xs font-bold animate-pulse pointer-events-none">
                                  {targetFinger ? `P${targetFinger}` : '●'}
                                </div>
                              ) : (
                                /* Empty click spot */
                                <div className="w-3 h-3 rounded-full bg-transparent hover:bg-white/20 transition-colors pointer-events-none" />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* HORIZONTAL NECK (Classic Landscape view) */
            <div className="relative z-10 w-full overflow-x-auto pb-3">
              <div
                ref={fretboardGridRef}
                className="min-w-[620px] flex flex-row bg-[#1f120c] rounded-2xl border-2 border-[#3d2315] shadow-inner select-none relative"
                style={{ touchAction: 'none' }}
              >
                {/* Floating Corner Chord Badge on the horizontal neck */}
                <div className="absolute top-2 right-4 z-20 pointer-events-none bg-slate-950/90 border border-amber-400/50 rounded-lg px-2.5 py-1 shadow-md">
                  <span className="text-xs font-black text-amber-300">
                    🎯 {convention === 'polish' ? targetChord.polishName : targetChord.name} ({targetChord.formula})
                  </span>
                </div>

                {/* Nut column */}
                <div className="w-16 border-r-4 border-[#e2d5c3] bg-[#0d0705] flex flex-col justify-around py-2 px-1">
                  {orderedStrings.map((stringInfo) => {
                    const sIdx = stringInfo.index;
                    const currentFret = activeGrip[sIdx];
                    const isMuted = currentFret === 'x';
                    const isOpen = currentFret === 0;

                    return (
                      <button
                        key={`nut_horiz_${sIdx}`}
                        type="button"
                        data-nut-target="true"
                        data-string-index={sIdx}
                        onClick={() => handleStringNutClick(sIdx)}
                        className={`w-7 h-7 rounded-full font-black text-xs flex items-center justify-center transition-all cursor-pointer shadow-md mx-auto ${
                          isMuted
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : isOpen
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 ring-1 ring-emerald-400/20'
                            : 'bg-amber-400 text-slate-950 font-black'
                        }`}
                        style={{ touchAction: 'none' }}
                      >
                        <span className="pointer-events-none">{isMuted ? '✕' : isOpen ? '○' : currentFret}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Frets Columns 1 to 5 */}
                {displayedFrets.map((fretNum) => {
                  const hasDotMarker = fretNum === 3 || fretNum === 5;
                  const isBarreActive = activeBarres.has(fretNum);
                  const isTargetBarreFret = targetChord.barreFret === fretNum;

                  const stringsOnFret = Array.from(effectiveHeldFrets.entries())
                    .filter(([_, f]) => f === fretNum)
                    .map(([s]) => s);
                  const hasBarre = stringsOnFret.length >= 2;

                  return (
                    <div
                      key={`fret_col_${fretNum}`}
                      className="flex-1 min-w-[90px] border-r-4 border-[#b4b4b4] relative flex flex-col justify-around py-2 px-1 hover:bg-white/[0.02]"
                    >
                      {/* Fret wire */}
                      <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-slate-400 via-white to-slate-400 pointer-events-none" />

                      {/* Fret pearl marker */}
                      {hasDotMarker && (
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-slate-200/70 border border-slate-300 shadow-inner pointer-events-none" />
                      )}

                      {/* Quick Interactive Barre Button + Fret Number */}
                      <div className="absolute top-1 left-1.5 z-20 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleBarreOnFret(fretNum)}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                            handleToggleBarreOnFret(fretNum);
                          }}
                          className={`px-1 py-0.5 rounded text-[8px] font-black uppercase tracking-tight transition-all shadow cursor-pointer border select-none flex items-center gap-0.5 ${
                            isBarreActive
                              ? 'bg-amber-400 text-slate-950 border-amber-300 ring-2 ring-amber-400/50 scale-105'
                              : isTargetBarreFret
                              ? 'bg-amber-500/30 text-amber-300 border-amber-400/60 animate-pulse'
                              : 'bg-slate-900/90 text-slate-400 border-slate-700/80 hover:text-white'
                          }`}
                          title={`Zablokuj/odblokuj poprzeczkę (Barre) na progu ${fretNum}`}
                        >
                          <Zap className="w-2.5 h-2.5 fill-current" />
                          <span>{isBarreActive ? '✓Barre' : 'Barre'}</span>
                        </button>
                        <span className="text-[9px] font-bold text-slate-500">P{fretNum}</span>
                      </div>

                      {/* Connected Visual Barre Bar across rows */}
                      {hasBarre && (() => {
                        const rowIndices = stringsOnFret
                          .map((s) => orderedStrings.findIndex((str) => str.index === s))
                          .filter((idx) => idx >= 0);
                        if (rowIndices.length < 2) return null;
                        const minRow = Math.min(...rowIndices);
                        const maxRow = Math.max(...rowIndices);
                        const topPct = (minRow / 6) * 100 + 2;
                        const heightPct = ((maxRow - minRow + 1) / 6) * 100 - 4;

                        return (
                          <div
                            className="absolute left-1/2 -translate-x-1/2 w-8 rounded-full bg-gradient-to-b from-amber-400/85 via-emerald-400/90 to-amber-400/85 border-2 border-emerald-300 shadow-lg shadow-emerald-500/30 pointer-events-none z-10 flex items-center justify-center transition-all animate-in fade-in duration-100"
                            style={{ top: `${topPct}%`, height: `${heightPct}%` }}
                          >
                            <span className="text-[8px] font-black text-slate-950 uppercase rotate-90 whitespace-nowrap px-1 rounded bg-white/80">
                              Barre
                            </span>
                          </div>
                        );
                      })()}

                      {orderedStrings.map((stringInfo) => {
                        const sIdx = stringInfo.index;
                        const isPressed = effectiveHeldFrets.get(sIdx) === fretNum;
                        const targetFretForString = targetChord.frets[sIdx];
                        const isTargetHere = targetFretForString === fretNum;
                        const targetFinger = targetChord.fingers[sIdx];

                        return (
                          <div
                            key={`horiz_cell_${fretNum}_${sIdx}`}
                            data-fret-target="true"
                            data-string-index={sIdx}
                            data-fret={fretNum}
                            className="relative h-10 flex items-center justify-center"
                            style={{ touchAction: 'none' }}
                          >
                            {/* Horizontal String */}
                            <div
                              className="absolute left-0 right-0 pointer-events-none"
                              style={{
                                height: `${stringInfo.gaugeWidth}px`,
                                backgroundColor: stringInfo.color,
                              }}
                            />

                            <button
                              type="button"
                              data-fret-target="true"
                              data-string-index={sIdx}
                              data-fret={fretNum}
                              onMouseDown={() => handleFretMouseDown(sIdx, fretNum)}
                              onMouseEnter={() => handleFretMouseEnter(sIdx, fretNum)}
                              onMouseUp={() => handleFretMouseUp(sIdx)}
                              className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer active:scale-90"
                              style={{ touchAction: 'none' }}
                            >
                              {isPressed ? (
                                <div
                                  className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shadow-md pointer-events-none ${
                                    isTargetHere
                                      ? 'bg-emerald-400 text-slate-950 ring-2 ring-emerald-400/40'
                                      : 'bg-amber-400 text-slate-950'
                                  }`}
                                >
                                  {showFingerHints && targetFinger && isTargetHere ? targetFinger : getFretNote(sIdx, fretNum)}
                                </div>
                              ) : showFingerHints && isTargetHere ? (
                                <div className="w-6 h-6 rounded-full border-2 border-dashed border-amber-400/70 bg-amber-400/15 text-amber-300 flex items-center justify-center text-xs font-bold animate-pulse pointer-events-none">
                                  {targetFinger ? `P${targetFinger}` : '●'}
                                </div>
                              ) : null}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* FRETBOARD ACTION CONTROLS: Outside fretboardContainerRef so clicks and scrolling work 100%! */}
        <div className="relative z-10 pt-4 mt-3 border-t border-amber-900/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Strum bar: with both onClick and direct onTouchStart for lightning-fast touch response */}
          <button
            type="button"
            onClick={() => handleStrum('down')}
            onTouchStart={(e) => {
              e.stopPropagation();
              handleStrum('down');
            }}
            className={`w-full sm:w-auto px-6 py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-xl active:scale-95 border-2 select-none ${
              validation.isCorrect
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-slate-950 border-emerald-300 ring-4 ring-emerald-400/30 animate-bounce'
                : 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 border-amber-300 ring-2 ring-amber-400/30'
            }`}
            title="Uderz we wszystkie struny gitary (Strum akordu)"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>🎸 UDERZ W STRUNY (STRUM)</span>
          </button>

          {/* Validation Feedback Strip */}
          <div className="text-xs font-bold text-center sm:text-left flex-1 px-3">
            <span
              className={
                validation.isCorrect
                  ? 'text-emerald-400 text-sm font-black animate-pulse'
                  : validation.missingPitchClasses.length > 0
                  ? 'text-amber-300'
                  : 'text-slate-400'
              }
            >
              {validation.feedback}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleResetGrip}
              className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer flex items-center gap-1 active:scale-95"
              title="Wyczyść palce z gryfu"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Wyczyść chwyt</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCurrentChordIndex((prev) => prev + 1);
                handleResetGrip();
              }}
              className="px-3 py-2 text-xs font-bold rounded-xl bg-amber-400/20 hover:bg-amber-400 text-amber-300 hover:text-slate-950 border border-amber-400/40 cursor-pointer flex items-center gap-1 active:scale-95"
              title="Przejdź do kolejnego akordu"
            >
              <span>Kolejny akord</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Quest Selector: Famous Guitar Progressions (Fully scrollable without restriction) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Ćwicz całe progresje gitarowe (Utwory & Hity)</span>
          </h3>
          <div className="text-xs text-amber-400 font-bold">
            Akord {currentChordIndex + 1} z {currentQuest.chords.length}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {GUITAR_PROGRESSIONS_QUESTS.map((quest) => {
            const isSelected = quest.id === selectedQuestId;
            return (
              <button
                key={quest.id}
                type="button"
                onClick={() => {
                  setSelectedQuestId(quest.id);
                  setCurrentChordIndex(0);
                  handleResetGrip();
                }}
                className={`p-3 rounded-xl text-left transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-amber-400/20 border-amber-400 text-white ring-2 ring-amber-400/30'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700/80'
                }`}
              >
                <div className="font-bold text-xs text-white mb-0.5">{quest.name}</div>
                <div className="text-[10px] text-slate-400 line-clamp-1">{quest.description}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
