import React, { useState } from 'react';
import { NoteName, NamingConvention } from '../types/music';
import { getNoteLabel } from '../utils/musicTheory';
import { sound } from '../utils/audioEngine';
import { Play, Info } from 'lucide-react';

interface CircleOfFifthsProps {
  selectedKey?: NoteName;
  onSelectKey?: (key: NoteName) => void;
  convention?: NamingConvention;
}

// Order of fifths clockwise starting from C: C, G, D, A, E, B, F#, Db/C#, Ab/G#, Eb/D#, Bb/A#, F
const CIRCLE_ORDER: { major: NoteName; minor: NoteName; angleDeg: number }[] = [
  { major: 'C', minor: 'A', angleDeg: 0 },
  { major: 'G', minor: 'E', angleDeg: 30 },
  { major: 'D', minor: 'B', angleDeg: 60 },
  { major: 'A', minor: 'F#', angleDeg: 90 },
  { major: 'E', minor: 'C#', angleDeg: 120 },
  { major: 'B', minor: 'G#', angleDeg: 150 },
  { major: 'F#', minor: 'D#', angleDeg: 180 },
  { major: 'C#', minor: 'A#', angleDeg: 210 },
  { major: 'G#', minor: 'F', angleDeg: 240 },
  { major: 'D#', minor: 'C', angleDeg: 270 },
  { major: 'A#', minor: 'G', angleDeg: 300 },
  { major: 'F', minor: 'D', angleDeg: 330 },
];

export const CircleOfFifths: React.FC<CircleOfFifthsProps> = ({
  selectedKey = 'C',
  onSelectKey,
  convention = 'polish',
}) => {
  const [activeRoot, setActiveRoot] = useState<NoteName>(selectedKey);

  const handleKeyClick = (key: NoteName) => {
    setActiveRoot(key);
    onSelectKey?.(key);
  };

  // Find index in circle
  const currentIdx = CIRCLE_ORDER.findIndex((item) => item.major === activeRoot);
  const activeItem = CIRCLE_ORDER[currentIdx] || CIRCLE_ORDER[0];

  // Primary family for current key:
  // I = activeRoot
  // IV = counter-clockwise (currentIdx - 1 + 12) % 12
  // V = clockwise (currentIdx + 1) % 12
  // vi = relative minor of I
  // ii = relative minor of IV
  // iii = relative minor of V
  const ivItem = CIRCLE_ORDER[(currentIdx - 1 + 12) % 12];
  const vItem = CIRCLE_ORDER[(currentIdx + 1) % 12];

  const handlePlayCadence = () => {
    // Play I -> IV -> V -> I cadence
    const baseMidiMap: Record<NoteName, number> = {
      C: 48,
      'C#': 49,
      D: 50,
      'D#': 51,
      E: 52,
      F: 53,
      'F#': 54,
      G: 55,
      'G#': 56,
      A: 57,
      'A#': 58,
      B: 59,
    };

    const rootM = baseMidiMap[activeRoot] || 48;
    const ivM = baseMidiMap[ivItem.major] || 53;
    const vM = baseMidiMap[vItem.major] || 55;

    // Kadencja I - IV - V - I
    sound.playChord([rootM, rootM + 4, rootM + 7], 1.2, 0);
    setTimeout(() => sound.playChord([ivM, ivM + 4, ivM + 7], 1.2, 0), 750);
    setTimeout(() => sound.playChord([vM, vM + 4, vM + 7], 1.2, 0), 1500);
    setTimeout(() => sound.playChord([rootM, rootM + 4, rootM + 7], 2.0, 0), 2250);
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-5 backdrop-blur-md shadow-xl flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>Interaktywne Koło Kwintowe</span>
          </h3>
          <p className="text-xs text-slate-400">
            Kliknij tonację, aby zobaczyć 6 naturalnie pasujących akordów (rodzinę harmoniczną).
          </p>
        </div>

        <button
          type="button"
          onClick={handlePlayCadence}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer shadow-md shadow-amber-400/20"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Zagraj kadencję</span>
        </button>
      </div>

      {/* SVG Circle */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 my-2 select-none">
        <svg viewBox="-150 -150 300 300" className="w-full h-full overflow-visible">
          {/* Subtle background rings */}
          <circle r="130" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
          <circle r="92" fill="none" stroke="#1e293b" strokeWidth="1" />
          <circle r="55" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />

          {/* Center Hub */}
          <text
            x="0"
            y="-6"
            textAnchor="middle"
            fill="#e2e8f0"
            fontSize="14"
            fontWeight="bold"
            className="font-sans"
          >
            {getNoteLabel(activeRoot, convention)}
          </text>
          <text
            x="0"
            y="12"
            textAnchor="middle"
            fill="#fbbf24"
            fontSize="10"
            fontWeight="600"
            className="font-sans"
          >
            Tonika (I)
          </text>

          {/* 12 sectors */}
          {CIRCLE_ORDER.map((item, idx) => {
            const angleRad = ((item.angleDeg - 90) * Math.PI) / 180;
            const isRoot = item.major === activeRoot;
            const isSub = item.major === ivItem.major;
            const isDom = item.major === vItem.major;

            const isRelated = isRoot || isSub || isDom;

            // Outer ring (Major)
            const rOuter = 112;
            const xMajor = rOuter * Math.cos(angleRad);
            const yMajor = rOuter * Math.sin(angleRad);

            // Inner ring (Minor)
            const rInner = 74;
            const xMinor = rInner * Math.cos(angleRad);
            const yMinor = rInner * Math.sin(angleRad);

            return (
              <g
                key={`circle_sector_${idx}`}
                className="cursor-pointer group"
                onClick={() => handleKeyClick(item.major)}
              >
                {/* Sector Connector Line */}
                <line
                  x1={55 * Math.cos(angleRad)}
                  y1={55 * Math.sin(angleRad)}
                  x2={130 * Math.cos(angleRad)}
                  y2={130 * Math.sin(angleRad)}
                  stroke={isRelated ? '#fbbf24' : '#1e293b'}
                  strokeWidth={isRelated ? 1.5 : 0.75}
                  opacity={isRelated ? 0.6 : 0.3}
                />

                {/* Major Chord Node */}
                <circle
                  cx={xMajor}
                  cy={yMajor}
                  r={isRoot ? 17 : isRelated ? 14 : 12}
                  fill={
                    isRoot
                      ? '#fbbf24'
                      : isSub
                      ? '#38bdf8'
                      : isDom
                      ? '#10b981'
                      : '#1e293b'
                  }
                  stroke={isRelated ? '#ffffff' : '#475569'}
                  strokeWidth={isRoot ? 2.5 : 1}
                  className="transition-all duration-200 group-hover:scale-110"
                />
                <text
                  x={xMajor}
                  y={yMajor + 4}
                  textAnchor="middle"
                  fill={isRelated ? '#020617' : '#e2e8f0'}
                  fontSize={isRoot ? '12' : '10'}
                  fontWeight="bold"
                  className="font-sans pointer-events-none"
                >
                  {getNoteLabel(item.major, convention)}
                </text>

                {/* Minor Relative Node */}
                <circle
                  cx={xMinor}
                  cy={yMinor}
                  r={isRelated ? 11 : 9}
                  fill={isRelated ? '#334155' : '#090d16'}
                  stroke={isRelated ? '#94a3b8' : '#1e293b'}
                  strokeWidth={1}
                  className="transition-all duration-200"
                />
                <text
                  x={xMinor}
                  y={yMinor + 3.5}
                  textAnchor="middle"
                  fill={isRelated ? '#f1f5f9' : '#64748b'}
                  fontSize="8"
                  fontWeight="600"
                  className="font-sans pointer-events-none"
                >
                  {getNoteLabel(item.minor, convention)}m
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend & Harmonic Family breakdown */}
      <div className="w-full mt-4 pt-3 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
        <div className="p-2 rounded-lg bg-amber-400/10 border border-amber-400/20 flex flex-col">
          <span className="text-amber-400 font-semibold">Tonika (I) & vi</span>
          <span className="text-slate-200 font-bold mt-0.5">
            {getNoteLabel(activeRoot, convention)} / {getNoteLabel(activeItem.minor, convention)}m
          </span>
          <span className="text-[10px] text-slate-400">Baza, spokój i dom</span>
        </div>

        <div className="p-2 rounded-lg bg-sky-400/10 border border-sky-400/20 flex flex-col">
          <span className="text-sky-400 font-semibold">Subdominanta (IV) & ii</span>
          <span className="text-slate-200 font-bold mt-0.5">
            {getNoteLabel(ivItem.major, convention)} / {getNoteLabel(ivItem.minor, convention)}m
          </span>
          <span className="text-[10px] text-slate-400">Otwarcie i oddech</span>
        </div>

        <div className="p-2 rounded-lg bg-emerald-400/10 border border-emerald-400/20 flex flex-col col-span-2 sm:col-span-1">
          <span className="text-emerald-400 font-semibold">Dominanta (V) & iii</span>
          <span className="text-slate-200 font-bold mt-0.5">
            {getNoteLabel(vItem.major, convention)} / {getNoteLabel(vItem.minor, convention)}m
          </span>
          <span className="text-[10px] text-slate-400">Napięcie do rozwiązania</span>
        </div>
      </div>
    </div>
  );
};
