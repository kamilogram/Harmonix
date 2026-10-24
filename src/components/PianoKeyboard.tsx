import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { NoteName, NamingConvention, ChordFitTier } from '../types/music';
import { NOTE_NAMES, getNoteLabel, getFullNoteLabel } from '../utils/musicTheory';
import { sound } from '../utils/audioEngine';
import { ChevronLeft, ChevronRight, Crosshair } from 'lucide-react';

export interface KeyInfo {
  midi: number;
  note: NoteName;
  octave: number;
  isBlack: boolean;
  label: string;
  keyboardKey?: string;
}

export interface PlayedChordHeaderInfo {
  chordName: string;
  fitScore: number;
  fitTier?: ChordFitTier;
}

interface PianoKeyboardProps {
  startMidi?: number; // default 48 (C3)
  keyCount?: number;  // default 29 (C3 to E5) or 37
  selectedMidiNotes?: number[];
  activeMidiNotes?: number[];
  highlightMap?: Record<number, 'correct' | 'incorrect' | 'hint' | 'active'>;
  interactive?: boolean;
  selectionMode?: 'toggle' | 'playOnly';
  onNoteToggle?: (midi: number) => void;
  onNotePlay?: (midi: number) => void;
  showLabels?: boolean;
  convention?: NamingConvention;
  idPrefix?: string;
  playedChordInfo?: PlayedChordHeaderInfo | null;
  // Synchronized scrolling across all keyboard rows
  onSyncScroll?: (scrollLeft: number, sourceId: string) => void;
  onSyncScrollBy?: (delta: number) => void;
  onSyncCenter?: (targetScrollLeft: number) => void;
  registerContainerRef?: (id: string, el: HTMLDivElement | null) => void;
}

const COMPUTER_KEY_MAP: Record<string, number> = {
  // Octave 3 (lower register)
  z: 48, // C3
  s: 49, // C#3
  x: 50, // D3
  d: 51, // D#3
  c: 52, // E3
  v: 53, // F3
  g: 54, // F#3
  b: 55, // G3
  h: 56, // G#3
  n: 57, // A3
  j: 58, // A#3
  m: 59, // B3
  // Octave 4 (middle register)
  q: 60, // C4
  '2': 61, // C#4
  w: 62, // D4
  '3': 63, // D#4
  e: 64, // E4
  r: 65, // F4
  '5': 66, // F#4
  t: 67, // G4
  '6': 68, // G#4
  y: 69, // A4
  '7': 70, // A#4
  u: 71, // B4
  i: 72, // C5
  '9': 73, // C#5
  o: 74, // D5
  '0': 75, // D#5
  p: 76, // E5
};

export const PianoKeyboard: React.FC<PianoKeyboardProps> = ({
  startMidi = 48,
  keyCount = 37, // 3 full octaves C3 to C6
  selectedMidiNotes = [],
  activeMidiNotes = [],
  highlightMap = {},
  interactive = true,
  selectionMode = 'toggle',
  onNoteToggle,
  onNotePlay,
  showLabels = false,
  convention = 'international',
  idPrefix = 'piano',
  playedChordInfo = null,
  onSyncScroll,
  onSyncScrollBy,
  onSyncCenter,
  registerContainerRef,
}) => {
  const [pressedMidis, setPressedMidis] = useState<Set<number>>(new Set());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Dragging state for smooth mouse dragging across keys
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftStartRef = useRef(0);
  const hasMovedSignificantlyRef = useRef(false);
  const isScrollingRef = useRef(false);
  const touchKeyStartPosRef = useRef<{ x: number; y: number } | null>(null);

  // Register container ref for synchronized horizontal scrolling across all rows
  useEffect(() => {
    if (registerContainerRef && idPrefix) {
      registerContainerRef(idPrefix, scrollContainerRef.current);
      return () => {
        registerContainerRef(idPrefix, null);
      };
    }
  }, [registerContainerRef, idPrefix]);

  // Global scroll listener: any window scroll temporarily suppresses key triggers
  useEffect(() => {
    const handleScroll = () => {
      isScrollingRef.current = true;
      hasMovedSignificantlyRef.current = true;
      setTimeout(() => {
        isScrollingRef.current = false;
        hasMovedSignificantlyRef.current = false;
      }, 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Generate piano keys
  const keys: KeyInfo[] = useMemo(() => {
    const list: KeyInfo[] = [];
    for (let i = 0; i < keyCount; i++) {
      const midi = startMidi + i;
      const noteIdx = midi % 12;
      const note = NOTE_NAMES[noteIdx];
      const octave = Math.floor(midi / 12) - 1;
      const isBlack = [1, 3, 6, 8, 10].includes(noteIdx);
      const label = getNoteLabel(note, convention);

      const charKey = Object.entries(COMPUTER_KEY_MAP).find(([, m]) => m === midi)?.[0];

      list.push({
        midi,
        note,
        octave,
        isBlack,
        label,
        keyboardKey: charKey ? charKey.toUpperCase() : undefined,
      });
    }
    return list;
  }, [startMidi, keyCount, convention]);

  // Update scroll boundaries
  const updateScrollButtons = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    updateScrollButtons();

    const handleContainerScroll = () => {
      updateScrollButtons();
      if (scrollContainerRef.current && onSyncScroll && idPrefix) {
        onSyncScroll(scrollContainerRef.current.scrollLeft, idPrefix);
      }
    };

    el.addEventListener('scroll', handleContainerScroll, { passive: true });
    window.addEventListener('resize', updateScrollButtons);
    return () => {
      el.removeEventListener('scroll', handleContainerScroll);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [updateScrollButtons, keys, onSyncScroll, idPrefix]);

  const scrollByAmount = (delta: number) => {
    if (onSyncScrollBy) {
      onSyncScrollBy(delta);
    } else if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: delta,
        behavior: 'smooth',
      });
    }
  };

  // Center on relevant notes
  const centerOnChord = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const notesToFocus =
      selectedMidiNotes.length > 0
        ? selectedMidiNotes
        : Object.keys(highlightMap).map(Number);

    if (notesToFocus.length === 0) return;

    const avgMidi =
      notesToFocus.reduce((sum, m) => sum + m, 0) / notesToFocus.length;

    const whiteKeysBefore = keys.filter(
      (k) => k.midi <= avgMidi && !k.isBlack
    ).length;
    const whiteKeyWidthPx = 36;
    const targetX = whiteKeysBefore * whiteKeyWidthPx;
    const containerWidth = scrollContainerRef.current.clientWidth;
    const targetLeft = Math.max(0, targetX - containerWidth / 2);

    if (onSyncCenter) {
      onSyncCenter(targetLeft);
    } else {
      scrollContainerRef.current.scrollTo({
        left: targetLeft,
        behavior: 'smooth',
      });
    }
  }, [selectedMidiNotes, highlightMap, keys, onSyncCenter]);

  // Computer keyboard listener
  useEffect(() => {
    if (!interactive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.repeat ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      const char = e.key.toLowerCase();
      const midi = COMPUTER_KEY_MAP[char];
      if (midi !== undefined && midi >= startMidi && midi < startMidi + keyCount) {
        handleTrigger(midi);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [interactive, startMidi, keyCount, selectionMode, onNoteToggle, onNotePlay]);

  const handleKeyTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      touchKeyStartPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      hasMovedSignificantlyRef.current = false;
    }
  };

  const handleKeyTouchMove = (e: React.TouchEvent) => {
    if (!touchKeyStartPosRef.current || e.touches.length === 0) return;
    const dx = Math.abs(e.touches[0].clientX - touchKeyStartPosRef.current.x);
    const dy = Math.abs(e.touches[0].clientY - touchKeyStartPosRef.current.y);
    if (dx > 6 || dy > 6) {
      hasMovedSignificantlyRef.current = true;
    }
  };

  const handleTrigger = (midi: number) => {
    if (!interactive || hasMovedSignificantlyRef.current || isScrollingRef.current) return;

    sound.playNote(midi, 1.8, 0.88);
    onNotePlay?.(midi);

    setPressedMidis((prev) => {
      const next = new Set(prev);
      next.add(midi);
      return next;
    });
    setTimeout(() => {
      setPressedMidis((prev) => {
        const next = new Set(prev);
        next.delete(midi);
        return next;
      });
    }, 280);

    if (selectionMode === 'toggle' && onNoteToggle) {
      onNoteToggle(midi);
    }
  };

  // Mouse pan / drag handling
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    const target = e.target as HTMLElement;
    if (target.tagName.toLowerCase() === 'button') return;

    isDraggingRef.current = true;
    startXRef.current = e.pageX - scrollContainerRef.current.offsetLeft;
    scrollLeftStartRef.current = scrollContainerRef.current.scrollLeft;
    hasMovedSignificantlyRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    if (Math.abs(walk) > 5) {
      hasMovedSignificantlyRef.current = true;
    }
    const newLeft = Math.max(0, scrollLeftStartRef.current - walk);
    scrollContainerRef.current.scrollLeft = newLeft;
    if (onSyncScroll && idPrefix) {
      onSyncScroll(newLeft, idPrefix);
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    setTimeout(() => {
      hasMovedSignificantlyRef.current = false;
    }, 50);
  };

  const whiteKeys = keys.filter((k) => !k.isBlack);

  // Exact geometric sizing inspired directly by the screenshot
  const whiteKeyWidthPx = 36;
  const blackKeyWidthPx = 22;
  const whiteKeyHeightClass = 'h-24 sm:h-28';
  const blackKeyHeightClass = 'h-15 sm:h-17';

  return (
    <div className="w-full relative select-none">
      {/* Scroll Navigation Header & Quick Jump Controls */}
      <div className="flex items-center justify-between mb-1 px-1 text-[11px] text-slate-400">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="font-mono text-[10px] text-slate-400 shrink-0">
            {getNoteLabel(keys[0]?.note, convention)}{keys[0]?.octave} —{' '}
            {getNoteLabel(keys[keys.length - 1]?.note, convention)}{keys[keys.length - 1]?.octave}
          </span>

          {/* User Request 1: In the existing C3-C6 row, display the played chord name & score percentage */}
          {playedChordInfo && (
            <div className="flex items-center gap-1.5 animate-in fade-in duration-100">
              <span className="font-bold text-xs text-white bg-slate-900 px-1.5 py-0.5 rounded border border-amber-500/35">
                {playedChordInfo.chordName}
              </span>
              <span
                className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                  playedChordInfo.fitTier === 'perfect' || playedChordInfo.fitScore >= 90
                    ? 'text-emerald-300 bg-emerald-500/20 border border-emerald-500/30'
                    : playedChordInfo.fitTier === 'good' || playedChordInfo.fitScore >= 70
                    ? 'text-sky-300 bg-sky-500/20 border border-sky-500/30'
                    : 'text-amber-300 bg-amber-500/20 border border-amber-500/30'
                }`}
              >
                ★ {playedChordInfo.fitScore}%
              </span>
            </div>
          )}

          {!playedChordInfo && (
            <span className="text-[10px] text-slate-500 hidden sm:inline">
              (przesuwaj w prawo i lewo)
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {selectedMidiNotes.length > 0 && (
            <button
              type="button"
              onClick={centerOnChord}
              title="Centruj na akordzie"
              className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold text-sky-400 hover:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 rounded cursor-pointer transition-colors"
            >
              <Crosshair className="w-3 h-3" />
              <span>Centruj</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => scrollByAmount(-140)}
            disabled={!canScrollLeft}
            title="Przesuń w lewo"
            className={`p-1 rounded cursor-pointer transition-colors ${
              canScrollLeft
                ? 'text-slate-300 hover:text-amber-400 hover:bg-slate-800'
                : 'text-slate-700 cursor-not-allowed opacity-40'
            }`}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => scrollByAmount(140)}
            disabled={!canScrollRight}
            title="Przesuń w prawo"
            className={`p-1 rounded cursor-pointer transition-colors ${
              canScrollRight
                ? 'text-slate-300 hover:text-amber-400 hover:bg-slate-800'
                : 'text-slate-700 cursor-not-allowed opacity-40'
            }`}
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Piano Chassis */}
      <div className="relative group">
        {/* Floating edge pan buttons */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollByAmount(-140)}
            title="Przesuń w lewo"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-6 h-12 bg-slate-950/85 hover:bg-slate-900 text-amber-400 rounded-r-lg flex items-center justify-center shadow-lg cursor-pointer transition-all border border-slate-700"
          >
            <ChevronLeft className="w-4 h-4 stroke-[3]" />
          </button>
        )}

        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollByAmount(140)}
            title="Przesuń w prawo"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-6 h-12 bg-slate-950/85 hover:bg-slate-900 text-amber-400 rounded-l-lg flex items-center justify-center shadow-lg cursor-pointer transition-all border border-slate-700"
          >
            <ChevronRight className="w-4 h-4 stroke-[3]" />
          </button>
        )}

        {/* Scrollable Container with exact screenshot aesthetic */}
        <div
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchMove={() => {
            if (scrollContainerRef.current && onSyncScroll && idPrefix) {
              onSyncScroll(scrollContainerRef.current.scrollLeft, idPrefix);
            }
          }}
          className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900/40 pb-1 cursor-grab active:cursor-grabbing rounded-2xl bg-[#090d16] border border-slate-800/80 p-2 shadow-2xl"
          style={{
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div className="relative inline-flex">
            <div className="relative flex">
              {/* White Keys: Warm Ivory (#f4f0e6) matching screenshot */}
              {whiteKeys.map((k) => {
                const isSelected = selectedMidiNotes.includes(k.midi);
                const isActive = activeMidiNotes.includes(k.midi) || pressedMidis.has(k.midi);
                const status = highlightMap[k.midi];

                let bgClass = 'bg-[#f4f0e6] text-slate-800 hover:bg-[#e9e4d7]';
                let borderClass = 'border-slate-900 border-r-[1.5px] border-b-[4px]';
                let extraRing = '';

                if (status === 'correct') {
                  bgClass = 'bg-emerald-300 text-emerald-950 font-black';
                  extraRing = 'ring-2 ring-emerald-500';
                } else if (status === 'incorrect') {
                  bgClass = 'bg-rose-300 text-rose-950 font-black';
                  extraRing = 'ring-2 ring-rose-500';
                } else if (status === 'hint') {
                  bgClass = 'bg-amber-300 text-amber-950 font-black animate-pulse';
                  extraRing = 'ring-2 ring-amber-400';
                } else if (isSelected) {
                  bgClass = 'bg-sky-300 text-sky-950 font-black';
                  extraRing = 'ring-2 ring-sky-500';
                } else if (isActive) {
                  bgClass = 'bg-amber-200 text-amber-950';
                }

                return (
                  <button
                    key={`${idPrefix}_white_${k.midi}`}
                    type="button"
                    onTouchStart={handleKeyTouchStart}
                    onTouchMove={handleKeyTouchMove}
                    onClick={() => handleTrigger(k.midi)}
                    style={{ width: `${whiteKeyWidthPx}px` }}
                    className={`relative ${whiteKeyHeightClass} rounded-b-lg ${borderClass} ${bgClass} ${extraRing} flex flex-col justify-end items-center pb-2 transition-all duration-75 active:scale-y-[0.98] active:brightness-90 shrink-0 cursor-pointer focus:outline-none shadow-sm`}
                    title={`${getFullNoteLabel(k.note, convention)}${k.octave} (Kliknij, aby zagrać)`}
                  >
                    {isSelected && (
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-600 mb-1 ring-1 ring-white"></span>
                    )}
                    {status === 'correct' && (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-700 mb-1 ring-1 ring-white"></span>
                    )}

                    {showLabels && (
                      <span className="text-[10px] font-semibold tracking-tight leading-none pointer-events-none opacity-60">
                        {k.label}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Black Keys: Matte Ebony (#1a1a24) matching screenshot */}
              {keys.map((k) => {
                if (!k.isBlack) return null;

                const whiteKeysBefore = keys.filter((x) => x.midi < k.midi && !x.isBlack).length;
                const isSelected = selectedMidiNotes.includes(k.midi);
                const isActive = activeMidiNotes.includes(k.midi) || pressedMidis.has(k.midi);
                const status = highlightMap[k.midi];

                let bgClass = 'bg-[#181822] text-slate-200 hover:bg-[#252533]';
                let borderClass = 'border-black border-b-[4px]';
                let extraRing = '';

                if (status === 'correct') {
                  bgClass = 'bg-emerald-600 text-white font-bold';
                  extraRing = 'ring-2 ring-emerald-400';
                } else if (status === 'incorrect') {
                  bgClass = 'bg-rose-600 text-white font-bold';
                  extraRing = 'ring-2 ring-rose-400';
                } else if (status === 'hint') {
                  bgClass = 'bg-amber-500 text-black font-bold animate-pulse';
                  extraRing = 'ring-2 ring-amber-300';
                } else if (isSelected) {
                  bgClass = 'bg-sky-600 text-white font-bold';
                  extraRing = 'ring-2 ring-sky-400';
                } else if (isActive) {
                  bgClass = 'bg-amber-500 text-black';
                }

                return (
                  <button
                    key={`${idPrefix}_black_${k.midi}`}
                    type="button"
                    onTouchStart={handleKeyTouchStart}
                    onTouchMove={handleKeyTouchMove}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTrigger(k.midi);
                    }}
                    style={{
                      width: `${blackKeyWidthPx}px`,
                      left: `calc(${whiteKeysBefore} * ${whiteKeyWidthPx}px - (${blackKeyWidthPx}px / 2))`,
                    }}
                    className={`absolute z-10 ${blackKeyHeightClass} rounded-b-md ${borderClass} ${bgClass} ${extraRing} shadow-lg flex flex-col justify-end items-center pb-1.5 transition-all duration-75 active:scale-y-[0.98] active:brightness-125 cursor-pointer focus:outline-none`}
                    title={`${getFullNoteLabel(k.note, convention)}${k.octave} (Kliknij, aby zagrać)`}
                  >
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-sky-300 mb-0.5 ring-1 ring-white"></span>
                    )}
                    {status === 'correct' && (
                      <span className="w-2 h-2 rounded-full bg-emerald-300 mb-0.5 ring-1 ring-white"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
