import React, { useState } from 'react';
import { X, BookOpen, Music, Sparkles, Layers, Sliders } from 'lucide-react';
import { sound } from '../utils/audioEngine';

interface TheoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TheoryModal: React.FC<TheoryModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'basics' | 'functions' | 'voiceleading' | 'emotions' | 'extensions'>('basics');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Przewodnik po Teorii Muzyki i Harmonii
              </h3>
              <p className="text-xs text-slate-400">
                Praktyczne zasady tworzenia zachwycających progresji na pianinie
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 pb-2 border-b border-slate-800 bg-slate-950/30 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('basics')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTab === 'basics'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            1. Budowa Akordów
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('functions')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTab === 'functions'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            2. Trzy Filary (T-S-D)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('voiceleading')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTab === 'voiceleading'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            3. Płynne Prowadzenie Głosów
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('emotions')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTab === 'emotions'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            4. Kolory & Emocje
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('extensions')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTab === 'extensions'
                ? 'bg-amber-400 text-slate-950 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            5. Rozszerzenia (7, 6, sus, dim, aug)
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-300 leading-relaxed">
          {activeTab === 'basics' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold text-white mb-1">
                  Jak powstaje akord na klawiaturze?
                </h4>
                <p>
                  Podstawowy akord (trójdźwięk) składa się z 3 dźwięków ułożonych w tercjach:
                  <span className="text-amber-400 font-semibold"> Prymy</span> (dźwięku bazowego),
                  <span className="text-sky-400 font-semibold"> Tercji</span> (decyduje czy akord jest wesoły czy smutny) oraz
                  <span className="text-emerald-400 font-semibold"> Kwinty</span> (daje oparcie i stabilność).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="font-bold text-white flex items-center justify-between">
                    <span>Akord Durowy (Wesoły / Jasny)</span>
                    <button
                      type="button"
                      onClick={() => sound.playChord([60, 64, 67], 1.8, 0)}
                      className="text-xs text-amber-400 hover:underline cursor-pointer"
                    >
                      Posłuchaj C-dur
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Wzór półtonów: <span className="font-mono text-amber-300">0 - 4 - 7</span>
                  </p>
                  <p className="text-xs text-slate-300 mt-2">
                    Od wybranego klawisza odlicz w prawo 4 klawisze (tercja wielka), a potem kolejne 3 klawisze (kwinta czysta). Np. <strong className="text-white">C - E - G</strong>.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="font-bold text-white flex items-center justify-between">
                    <span>Akord Molowy (Smutny / Intymny)</span>
                    <button
                      type="button"
                      onClick={() => sound.playChord([57, 60, 64], 1.8, 0)}
                      className="text-xs text-amber-400 hover:underline cursor-pointer"
                    >
                      Posłuchaj A-moll
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Wzór półtonów: <span className="font-mono text-sky-300">0 - 3 - 7</span>
                  </p>
                  <p className="text-xs text-slate-300 mt-2">
                    Tercja jest o półton niżej niż w durze! Od prymy odlicz 3 klawisze, a potem 4 klawisze. Np. <strong className="text-white">A - C - E</strong>.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400">
                <strong className="text-slate-200">Wskazówka polskiej nomenklatury:</strong> W tradycyjnym polskim nazewnictwie nuta <span className="text-amber-400 font-mono font-bold">H</span> oznacza biały klawisz przed C (ang. B), natomiast <span className="text-amber-400 font-mono font-bold">B</span> oznacza czarny klawisz obniżony (ang. B♭). Aplikacja pozwala wyświetlać oba warianty!
              </div>
            </div>
          )}

          {activeTab === 'functions' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold text-white mb-1">
                  Trzy Główne Filary Muzyki: T - S - D
                </h4>
                <p>
                  Prawie każda piosenka na świecie opiera się na cyklu:
                  <strong className="text-emerald-400"> Dom (Tonika)</strong> ➔
                  <strong className="text-sky-400"> Wyjście na spacer (Subdominanta)</strong> ➔
                  <strong className="text-amber-400"> Napięcie i tęsknota (Dominanta)</strong> ➔
                  <strong className="text-emerald-400"> Powrót do domu</strong>.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="font-bold text-emerald-300 text-sm">
                    1. Tonika (I / i) – C-dur w tonacji C
                  </div>
                  <p className="text-xs text-emerald-100/80 mt-1">
                    Punkt wyjścia i ostatecznego spoczynku. Daje słuchaczowi poczucie bezpieczeństwa, spełnienia i braku przymusu dalszego ruchu.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20">
                  <div className="font-bold text-sky-300 text-sm">
                    2. Subdominanta (IV lub ii) – F-dur lub D-moll w tonacji C
                  </div>
                  <p className="text-xs text-sky-100/80 mt-1">
                    Otwiera przestrzeń, daje wrażenie "wzięcia głębokiego oddechu" i oddalenia się od domu. Nie wymusza natychmiastowego powrotu, pozwala melodii latać swobodnie.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="font-bold text-amber-300 text-sm">
                    3. Dominanta (V) – G-dur w tonacji C
                  </div>
                  <p className="text-xs text-amber-100/80 mt-1">
                    Maksymalne napięcie. Dźwięk H w akordzie G ciągnie magnetycznie w górę do C (nuta prowadząca). Gdy grasz dominantę, ucho dosłownie "żąda" rozwiązania w tonikę!
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'voiceleading' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold text-white mb-1">
                  Sekret Profesjonalistów: Voice Leading (Płynne Głosy)
                </h4>
                <p>
                  Początkujący pianiści skaczą całą dłonią w tę i z powrotem. Doświadczeni muzycy używają <strong className="text-amber-400">przewrotów akordów</strong>, aby poruszać palcami jak najmniej!
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="font-semibold text-white text-xs">
                  Przykład przejścia C-dur ➔ F-dur:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
                    <span className="font-bold text-rose-300">❌ Skakanie w dół (sztywne):</span>
                    <p className="text-slate-300 mt-1">
                      C (C-E-G) ➔ F (F-A-C na dole) – ręka musi pokonać dystans całej kwarty, brzmi to odcięcie i skokowo.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <span className="font-bold text-emerald-300">✅ Płynne głosy (Voice Leading):</span>
                    <p className="text-slate-300 mt-1">
                      C (C-E-G) ➔ F w II przewrocie (C-F-A). Zauważ: dźwięk <strong className="text-white">C</strong> zostaje pod tym samym palcem, a E i G przesuwają się tylko o 1 klawisz na F i A!
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-400">
                Złota reguła: <em>Jeśli dwa akordy mają wspólne dźwięki, pozostaw je na miejscu. Pozostałe głosy poprowadź najbliższą możliwą drogą.</em>
              </p>
            </div>
          )}

          {activeTab === 'emotions' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold text-white mb-1">
                  Kolory Emocjonalne w Progresjach
                </h4>
                <p>
                  Każdy rodzaj akordu ma swój unikalny ładunek psychologiczny:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="font-bold text-white">Akordy maj7 (np. Cmaj7, Fmaj7)</div>
                  <p className="text-slate-300 mt-1">
                    Aksamitne, zmysłowe, marzycielskie. Kojarzą się z letnim wieczorem, jazzem i neo-soulem.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="font-bold text-white">Zapożyczone iv molowe (np. Fm w tonacji C)</div>
                  <p className="text-slate-300 mt-1">
                    Słynny "Beatles chord". Wywołuje nagłe, głębokie wzruszenie i łzy w oku (użyte w Radiohead "Creep").
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="font-bold text-white">Zawieszenie sus4 (np. Csus4 ➔ C)</div>
                  <p className="text-slate-300 mt-1">
                    Wzniosłe, sakralne, wyczekujące. Dźwięk F zamiast E tworzy piękne oczekiwanie na spełnienie.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="font-bold text-white">Paralela molowa vi (np. A-moll w C)</div>
                  <p className="text-slate-300 mt-1">
                    Serce muzyki pop. Zamienia słoneczną radość w słodko-gorzki, przebojowy smutek.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'extensions' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold text-white mb-1">
                  Przewodnik po Akordach Rozszerzonych (7, 6, sus, dim, aug, add9)
                </h4>
                <p>
                  Proste trójdźwięki dur i moll to tylko początek. Prawdziwe bogactwo muzyki filmowej, jazzowej, popu i R&B tkwi w dodatkowych składnikach:
                </p>
              </div>

              <div className="space-y-3">
                {/* 1. Septymy */}
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400 text-xs uppercase tracking-wide">
                      1. Akordy Septymowe (Czterodźwięki)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="flex items-center justify-between font-bold text-white">
                        <span>maj7 (Wielka septyma)</span>
                        <button
                          type="button"
                          onClick={() => sound.playChord([60, 64, 67, 71], 2.2, 0)}
                          className="text-amber-400 hover:underline cursor-pointer"
                        >
                          Cmaj7
                        </button>
                      </div>
                      <p className="text-slate-400 mt-0.5">Wzór: Pryma + 4 + 3 + 4 półtony (C-E-G-H)</p>
                      <p className="text-slate-300 mt-1">Aksamitny, marzycielski, podstawa jazzu i lo-fi.</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="flex items-center justify-between font-bold text-white">
                        <span>7 (Dominantowy)</span>
                        <button
                          type="button"
                          onClick={() => sound.playChord([55, 59, 62, 65], 2.2, 0)}
                          className="text-amber-400 hover:underline cursor-pointer"
                        >
                          G7
                        </button>
                      </div>
                      <p className="text-slate-400 mt-0.5">Wzór: Pryma + 4 + 3 + 3 półtony (G-H-D-F)</p>
                      <p className="text-slate-300 mt-1">Napięty tryton H-F domaga się rozwiązania w C!</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="flex items-center justify-between font-bold text-white">
                        <span>m7 (Mała septyma molowa)</span>
                        <button
                          type="button"
                          onClick={() => sound.playChord([57, 60, 64, 67], 2.2, 0)}
                          className="text-amber-400 hover:underline cursor-pointer"
                        >
                          Am7
                        </button>
                      </div>
                      <p className="text-slate-400 mt-0.5">Wzór: Pryma + 3 + 4 + 3 półtony (A-C-E-G)</p>
                      <p className="text-slate-300 mt-1">Ciepły, soulowy, nostalgiczny.</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="flex items-center justify-between font-bold text-white">
                        <span>m7b5 (Półzmniejszony)</span>
                        <button
                          type="button"
                          onClick={() => sound.playChord([59, 62, 65, 69], 2.2, 0)}
                          className="text-amber-400 hover:underline cursor-pointer"
                        >
                          Hm7b5
                        </button>
                      </div>
                      <p className="text-slate-400 mt-0.5">Wzór: Pryma + 3 + 3 + 4 półtony (H-D-F-A)</p>
                      <p className="text-slate-300 mt-1">Klasyczny jazzowy drugi stopień (ii) w molu.</p>
                    </div>
                  </div>
                </div>

                {/* 2. Zawieszone sus */}
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <span className="font-bold text-sky-400 text-xs uppercase tracking-wide">
                    2. Akordy Zawieszone (Brak tercji)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="flex items-center justify-between font-bold text-white">
                        <span>sus2</span>
                        <button
                          type="button"
                          onClick={() => sound.playChord([60, 62, 67], 2.2, 0)}
                          className="text-amber-400 hover:underline cursor-pointer"
                        >
                          Csus2
                        </button>
                      </div>
                      <p className="text-slate-400 mt-0.5">C - D - G (zamiast E)</p>
                      <p className="text-slate-300 mt-1">Otwarty, eteryczny, świeży pop.</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="flex items-center justify-between font-bold text-white">
                        <span>sus4</span>
                        <button
                          type="button"
                          onClick={() => sound.playChord([60, 65, 67], 2.2, 0)}
                          className="text-amber-400 hover:underline cursor-pointer"
                        >
                          Csus4
                        </button>
                      </div>
                      <p className="text-slate-400 mt-0.5">C - F - G (zamiast E)</p>
                      <p className="text-slate-300 mt-1">Wzniosłe oczekiwanie na powrót tercji.</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="flex items-center justify-between font-bold text-white">
                        <span>7sus4</span>
                        <button
                          type="button"
                          onClick={() => sound.playChord([55, 60, 62, 65], 2.2, 0)}
                          className="text-amber-400 hover:underline cursor-pointer"
                        >
                          G7sus4
                        </button>
                      </div>
                      <p className="text-slate-400 mt-0.5">G - C - D - F</p>
                      <p className="text-slate-300 mt-1">Nowoczesna, potężna dominanta pop.</p>
                    </div>
                  </div>
                </div>

                {/* 3. Szóstki i Nony */}
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <span className="font-bold text-emerald-400 text-xs uppercase tracking-wide">
                    3. Szóstki & Dodane Nony
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="flex items-center justify-between font-bold text-white">
                        <span>6 (Szóstka)</span>
                        <button
                          type="button"
                          onClick={() => sound.playChord([60, 64, 67, 69], 2.2, 0)}
                          className="text-amber-400 hover:underline cursor-pointer"
                        >
                          C6
                        </button>
                      </div>
                      <p className="text-slate-400 mt-0.5">C - E - G - A</p>
                      <p className="text-slate-300 mt-1">Ciepły, słodki klimat retro swing.</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="flex items-center justify-between font-bold text-white">
                        <span>m6 (Molowa 6)</span>
                        <button
                          type="button"
                          onClick={() => sound.playChord([57, 60, 64, 66], 2.2, 0)}
                          className="text-amber-400 hover:underline cursor-pointer"
                        >
                          Am6
                        </button>
                      </div>
                      <p className="text-slate-400 mt-0.5">A - C - E - Fis</p>
                      <p className="text-slate-300 mt-1">Film noir, mroczna intryga szpiegowska.</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="flex items-center justify-between font-bold text-white">
                        <span>add9 (Dodana 9)</span>
                        <button
                          type="button"
                          onClick={() => sound.playChord([60, 62, 64, 67], 2.2, 0)}
                          className="text-amber-400 hover:underline cursor-pointer"
                        >
                          Cadd9
                        </button>
                      </div>
                      <p className="text-slate-400 mt-0.5">C - D - E - G</p>
                      <p className="text-slate-300 mt-1">Słynny, akustyczny hymn Coldplay.</p>
                    </div>
                  </div>
                </div>

                {/* 4. Zmniejszone i zwiększone */}
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                  <span className="font-bold text-rose-400 text-xs uppercase tracking-wide">
                    4. Napięcie Ekstremalne (Zmniejszone & Zwiększone)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="flex items-center justify-between font-bold text-white">
                        <span>dim (Zmniejszony)</span>
                        <button
                          type="button"
                          onClick={() => sound.playChord([59, 62, 65], 2.2, 0)}
                          className="text-amber-400 hover:underline cursor-pointer"
                        >
                          Hdim
                        </button>
                      </div>
                      <p className="text-slate-400 mt-0.5">H - D - F (dwie małe tercje)</p>
                      <p className="text-slate-300 mt-1">Ostry niepokój, tryton.</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="flex items-center justify-between font-bold text-white">
                        <span>dim7</span>
                        <button
                          type="button"
                          onClick={() => sound.playChord([59, 62, 65, 68], 2.2, 0)}
                          className="text-amber-400 hover:underline cursor-pointer"
                        >
                          Hdim7
                        </button>
                      </div>
                      <p className="text-slate-400 mt-0.5">H - D - F - As</p>
                      <p className="text-slate-300 mt-1">Dreszcz grozy, filmowy horror/suspens.</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                      <div className="flex items-center justify-between font-bold text-white">
                        <span>aug (Zwiększony)</span>
                        <button
                          type="button"
                          onClick={() => sound.playChord([60, 64, 68], 2.2, 0)}
                          className="text-amber-400 hover:underline cursor-pointer"
                        >
                          Caug
                        </button>
                      </div>
                      <p className="text-slate-400 mt-0.5">C - E - Gis (dwie wielkie tercje)</p>
                      <p className="text-slate-300 mt-1">Kosmiczny, unoszący się w powietrzu.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Rozumiem, wracam do ćwiczeń
          </button>
        </div>
      </div>
    </div>
  );
};
