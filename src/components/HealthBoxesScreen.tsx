import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Volume2,
  VolumeX,
  ArrowLeft,
  Sliders,
  Move,
  CheckCircle2,
  Layers,
  Eye,
  RotateCcw,
  GripHorizontal,
  Sparkles,
  Check,
  X,
  Copy,
  FileText,
  Trophy,
  HelpCircle,
  Send,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../context/AppContext';
import { HealthCardBox } from '../types';
import { sound } from '../utils/audio';

interface HealthBoxesScreenProps {
  onBack: () => void;
}

interface SentenceSlots {
  tajuk1: string;
  isi1: string;
  huraian1: string;
  isi2: string;
  huraian2: string;
  tajuk2: string;
  kesan: string;
}

const INITIAL_SLOTS: SentenceSlots = {
  tajuk1: '',
  isi1: '',
  huraian1: '',
  isi2: '',
  huraian2: '',
  tajuk2: '',
  kesan: '',
};

export const HealthBoxesScreen: React.FC<HealthBoxesScreenProps> = ({ onBack }) => {
  const {
    settings,
    updateSettings,
    updateBox,
    setIsAdminOpen,
    setAdminTab,
    isAlignMode,
    setIsAlignMode,
    activeAlignBoxId,
    setActiveAlignBoxId,
  } = useApp();

  // Multi-stage click tracking per box:
  // 0 = Initial (Base picture in 1:1 frame)
  // 1 = 1st Click (Text Box 1 [ISI] pops out)
  // 2 = 2nd Click (PNG overlay replaces picture + Text Box 2 [HURAIAN] pops out)
  const [boxStages, setBoxStages] = useState<{ [boxId: string]: number }>({});

  // Transition & Kesan Overlay State
  const [isSplitViewActive, setIsSplitViewActive] = useState(false);
  const [isKesanOverlayOpen, setIsKesanOverlayOpen] = useState(false);
  const [isKesanUnlocked, setIsKesanUnlocked] = useState(false);
  const [kesanWrongChoice, setKesanWrongChoice] = useState<string | null>(null);
  const [shuffledKesanOptions, setShuffledKesanOptions] = useState<
    { text: string; isCorrect: boolean }[]
  >([]);

  // Bee Challenge Typing Mode State
  const [beeCountdown, setBeeCountdown] = useState<number | null>(null);
  const beeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isBeeChallengeActive, setIsBeeChallengeActive] = useState(false);
  const [beeRound, setBeeRound] = useState<number>(1);
  const [removedSlots, setRemovedSlots] = useState<Set<keyof SentenceSlots>>(new Set());
  const [beeInputs, setBeeInputs] = useState<{ [K in keyof SentenceSlots]?: string }>({});
  const [dissolvingSlots, setDissolvingSlots] = useState<Set<keyof SentenceSlots>>(new Set());
  const [isVictoryModalOpen, setIsVictoryModalOpen] = useState(false);
  const [typingFeedback, setTypingFeedback] = useState<string | null>(null);
  const [isRoundTransitioning, setIsRoundTransitioning] = useState(false);

  // Slots state for the Sentence Construction Card
  const [sentenceSlots, setSentenceSlots] = useState<SentenceSlots>(INITIAL_SLOTS);
  const [activeSelectedText, setActiveSelectedText] = useState<{
    text: string;
    type: 'tajuk' | 'isi' | 'huraian' | 'kesan';
  } | null>(null);
  const [isTajukUnlocked, setIsTajukUnlocked] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [hasCelebratedCompletion, setHasCelebratedCompletion] = useState(false);

  // Dragging state for Admin Alignment mode
  const [isDragging, setIsDragging] = useState(false);
  const dragBoxRef = useRef<{ boxId: string; containerRect: DOMRect } | null>(null);

  // Question and Keyword defaults
  const questionPrompt =
    settings.questionPrompt ||
    'Grafik dibawah menunjukkan aktiviti menjaga kebersihan diri. Berdasarkan grafik, tuliskan pendapat kamu tentang dua cara menjaga kebersihan diri.';
  const tajukKeyword = settings.tajukKeyword || 'cara menjaga kebersihan diri';
  const kesanKeyword =
    settings.kesanKeyword || 'menjamin kebersihan badan dan terhindar daripada penyakit';

  // Derived Tajuk without the word "cara"
  const tajukWithoutCara = tajukKeyword.replace(/^cara\s+/gi, '').trim();

  // Filter clicked boxes (stage >= 1)
  const clickedBoxes = settings.boxes.filter((box) => (boxStages[box.id] || 0) >= 1);
  const stage2Boxes = settings.boxes.filter((box) => (boxStages[box.id] || 0) >= 2);

  // Manual trigger for Kesan Question Overlay via Arrow Button
  const handleOpenKesanQuestion = () => {
    sound.playPop();
    sound.playCelebration();
    const correctChoice = kesanKeyword;
    const distractor1 =
      settings.kesanDistractors?.[0] ||
      'memastikan kawasan persekitaran sentiasa kelihatan indah dan berwarna-warni';
    const distractor2 =
      settings.kesanDistractors?.[1] ||
      'mengeratkan hubungan silaturahim dengan jiran tetangga dan rakan sekelas';

    const options = [
      { text: correctChoice, isCorrect: true },
      { text: distractor1, isCorrect: false },
      { text: distractor2, isCorrect: false },
    ].sort(() => Math.random() - 0.5);

    setShuffledKesanOptions(options);
    setIsKesanOverlayOpen(true);
  };

  // Handle Kesan option click
  const handleSelectKesanOption = (opt: { text: string; isCorrect: boolean }) => {
    if (opt.isCorrect) {
      sound.playCelebration();
      confetti({
        particleCount: 75,
        spread: 90,
        origin: { y: 0.5 },
      });
      setIsKesanUnlocked(true);
      setIsKesanOverlayOpen(false);
      setIsSplitViewActive(true);
      setActiveSelectedText({ text: opt.text || kesanKeyword, type: 'kesan' });
    } else {
      sound.playPop();
      setKesanWrongChoice(opt.text);
      setTimeout(() => setKesanWrongChoice(null), 800);
    }
  };

  // Check if all slots are filled
  const isSentenceComplete =
    !!sentenceSlots.tajuk1 &&
    !!sentenceSlots.isi1 &&
    !!sentenceSlots.huraian1 &&
    !!sentenceSlots.isi2 &&
    !!sentenceSlots.huraian2 &&
    !!sentenceSlots.tajuk2 &&
    !!sentenceSlots.kesan;

  // 15s Countdown Timer for Bee Challenge Mode
  useEffect(() => {
    if (isSentenceComplete && !isBeeChallengeActive && beeCountdown === null && !isVictoryModalOpen) {
      setBeeCountdown(15);
    }
  }, [isSentenceComplete, isBeeChallengeActive, beeCountdown, isVictoryModalOpen]);

  useEffect(() => {
    if (beeCountdown === null || isBeeChallengeActive) return;

    if (beeCountdown > 0) {
      beeTimerRef.current = setTimeout(() => {
        setBeeCountdown((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (beeCountdown === 0) {
      startBeeChallenge();
    }

    return () => {
      if (beeTimerRef.current) clearTimeout(beeTimerRef.current);
    };
  }, [beeCountdown, isBeeChallengeActive]);

  const ALL_SLOT_KEYS: (keyof SentenceSlots)[] = [
    'tajuk1',
    'isi1',
    'huraian1',
    'isi2',
    'huraian2',
    'tajuk2',
    'kesan',
  ];

  const SLOT_LABEL_MAP: Record<keyof SentenceSlots, string> = {
    tajuk1: 'TAJUK 1',
    isi1: 'ISI 1',
    huraian1: 'HURAIAN 1',
    isi2: 'ISI 2',
    huraian2: 'HURAIAN 2',
    tajuk2: 'TAJUK 2',
    kesan: 'KESAN',
  };

  const startBeeChallengeRound = (roundNum: number) => {
    setIsBeeChallengeActive(true);
    setBeeRound(roundNum);
    setBeeCountdown(null);
    setTypingFeedback(null);
    setIsRoundTransitioning(false);

    // 1st stage must only take out 1 block; stages 2 & 3 randomly take out 1-3 blocks
    const countToRemove = roundNum === 1 ? 1 : Math.floor(Math.random() * 3) + 1;
    const shuffled = [...ALL_SLOT_KEYS].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, countToRemove);
    const pickedSet = new Set<keyof SentenceSlots>(picked);

    // Directly trigger powder dissolve effect
    setDissolvingSlots(pickedSet);
    sound.playPop();

    // Powder particle confetti burst effect over the paragraph
    confetti({
      particleCount: 85,
      spread: 85,
      origin: { y: 0.5 },
      colors: ['#F59E0B', '#FBBF24', '#FEF3C7', '#FFFFFF', '#D97706', '#B45309'],
      scalar: 0.75,
      ticks: 110,
      gravity: 0.5,
      drift: 0,
    });

    setTimeout(() => {
      // Finish powder dissolve -> reveal typing input fields
      setRemovedSlots(pickedSet);
      setDissolvingSlots(new Set());
      const initialInputs: { [K in keyof SentenceSlots]?: string } = {};
      picked.forEach((key) => {
        initialInputs[key] = '';
      });
      setBeeInputs(initialInputs);
    }, 800); // 800ms powder dissolve duration
  };

  const startBeeChallenge = () => {
    startBeeChallengeRound(1);
  };

  const normalizeText = (str: string | undefined): string => {
    if (!str) return '';
    return str
      .toLowerCase()
      .trim()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()"'`]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const isAnswerMatch = (input: string | undefined, target: string | undefined) => {
    if (!input || !target) return false;
    const cleanInput = normalizeText(input);
    const cleanTarget = normalizeText(target);
    if (cleanInput.length === 0 || cleanTarget.length === 0) return false;
    
    // Direct complete match of the full word/sentence of the answer
    return cleanInput === cleanTarget;
  };

  const handleBeeInputChange = (slotKey: keyof SentenceSlots, val: string) => {
    if (isRoundTransitioning) return;

    const valLower = val.toLowerCase();
    const updatedInputs = { ...beeInputs, [slotKey]: valLower };

    // Auto-check if all removed slots match target answers
    let allCorrect = true;
    const finalInputs = { ...updatedInputs };

    removedSlots.forEach((key) => {
      const userVal = updatedInputs[key] || '';
      const targetVal = sentenceSlots[key] || '';
      if (isAnswerMatch(userVal, targetVal)) {
        // Auto-correct the block: set the input field's text to the exact pristine correct target answer!
        finalInputs[key] = targetVal;
      } else {
        allCorrect = false;
      }
    });

    setBeeInputs(finalInputs);

    if (allCorrect && removedSlots.size > 0 && !isRoundTransitioning) {
      setIsRoundTransitioning(true);
      sound.playCelebration();
      confetti({
        particleCount: 75,
        spread: 90,
        origin: { y: 0.5 },
      });
      setTypingFeedback('Syabas! Jawapan tepat! 🎉');

      setTimeout(() => {
        setTypingFeedback(null);
        if (beeRound < 3) {
          startBeeChallengeRound(beeRound + 1);
        } else {
          setIsVictoryModalOpen(true);
          setIsBeeChallengeActive(false);
          setIsRoundTransitioning(false);
          sound.playCelebration();
          confetti({
            particleCount: 120,
            spread: 120,
            origin: { y: 0.4 },
          });
        }
      }, 1000);
    }
  };

  // Determine whether split sentence mode is showing
  const showSplitSentenceMode = isSplitViewActive && clickedBoxes.length >= 2 && !isAlignMode;

  // Check if a specific text is already placed in the sentence slots (to vanish it from left)
  const isTextPlaced = (text: string | undefined): boolean => {
    if (!text) return false;
    const lower = text.toLowerCase().trim();
    return Object.values(sentenceSlots).some(
      (slotVal) => typeof slotVal === 'string' && slotVal.toLowerCase().trim() === lower
    );
  };

  // Trigger celebration when sentence is completely filled
  useEffect(() => {
    if (isSentenceComplete && !hasCelebratedCompletion) {
      setHasCelebratedCompletion(true);
      sound.playCelebration();
      confetti({
        particleCount: 80,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#8B5CF6'],
      });
    }
  }, [isSentenceComplete, hasCelebratedCompletion]);

  // Fire confetti celebration when clicking images
  const triggerConfetti = (originX: number, originY: number) => {
    if (!settings.enableConfettiOnClick) return;
    confetti({
      particleCount: 35,
      spread: 60,
      origin: {
        x: originX / window.innerWidth,
        y: originY / window.innerHeight,
      },
      colors: ['#F59E0B', '#FBBF24', '#FDE68A', '#78350F', '#10B981'],
    });
  };

  // User click on an image box (Stage 1 -> Stage 2)
  const handleBoxClick = (box: HealthCardBox, e: React.MouseEvent<HTMLDivElement>) => {
    if (isAlignMode) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = rect.left + rect.width / 2;
    const clickY = rect.top + rect.height / 2;

    const currentStage = boxStages[box.id] || 0;

    if (currentStage === 0) {
      // 1ST CLICK: Text Box 1 [ISI] pops out
      setBoxStages((prev) => {
        const next = { ...prev, [box.id]: 1 };
        const newCount = Object.keys(next).filter((id) => (next[id] || 0) >= 1).length;
        if (newCount >= 2) {
          sound.playCelebration();
        } else {
          sound.playChime();
        }
        return next;
      });
      sound.playPop();
      triggerConfetti(clickX, clickY);
    } else if (currentStage === 1) {
      // 2ND CLICK: PNG overlay replaces picture + Text Box 2 [HURAIAN] pops out
      setBoxStages((prev) => ({ ...prev, [box.id]: 2 }));
      sound.playPop();
      sound.playCelebration();
      triggerConfetti(clickX, clickY);
    } else {
      // Additional clicks
      sound.playPop();
      if (settings.beeBuzzEnabled) {
        sound.playBeeBuzz();
      }
      triggerConfetti(clickX, clickY);
    }
  };

  // Drag handlers for visual alignment in Admin mode
  const handleOverlayMouseDown = (
    boxId: string,
    containerElement: HTMLDivElement,
    e: React.MouseEvent
  ) => {
    if (!isAlignMode) return;
    e.preventDefault();
    e.stopPropagation();

    setActiveAlignBoxId(boxId);
    setIsDragging(true);
    dragBoxRef.current = {
      boxId,
      containerRect: containerElement.getBoundingClientRect(),
    };
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !dragBoxRef.current) return;
      const { boxId, containerRect } = dragBoxRef.current;

      const rawX = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      const rawY = ((e.clientY - containerRect.top) / containerRect.height) * 100;

      const clampedX = Math.round(Math.max(5, Math.min(95, rawX)));
      const clampedY = Math.round(Math.max(5, Math.min(95, rawY)));

      updateBox(boxId, { overlayX: clampedX, overlayY: clampedY });
    },
    [isDragging, updateBox]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      dragBoxRef.current = null;
      sound.playPop();
    }
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Reset all stages & sentence slots
  const handleResetCards = () => {
    if (beeTimerRef.current) {
      clearTimeout(beeTimerRef.current);
    }
    setBeeCountdown(null);
    setIsBeeChallengeActive(false);
    setBeeRound(1);
    setRemovedSlots(new Set());
    setDissolvingSlots(new Set());
    setBeeInputs({});
    setIsVictoryModalOpen(false);
    setIsKesanOverlayOpen(false);
    setIsKesanUnlocked(false);
    setIsSplitViewActive(false);
    setBoxStages({});
    setSentenceSlots(INITIAL_SLOTS);
    setActiveSelectedText(null);
    setIsTajukUnlocked(false);
    setHasCelebratedCompletion(false);
    sound.playPop();
  };

  // HTML5 Drag & Drop handlers for sentence construction
  const handleDragStart = (
    e: React.DragEvent,
    text: string,
    type: 'tajuk' | 'isi' | 'huraian' | 'kesan'
  ) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ text, type }));
    setActiveSelectedText({ text, type });
  };

  const handleSlotDrop = (e: React.DragEvent, slotKey: keyof SentenceSlots) => {
    e.preventDefault();
    try {
      const dataStr = e.dataTransfer.getData('text/plain');
      if (dataStr) {
        const { text, type } = JSON.parse(dataStr);
        let finalVal = text.toLowerCase().trim();
        if (type === 'tajuk' || finalVal.includes('jasa ibu bapa')) {
          if (slotKey === 'tajuk1') {
            finalVal = 'cara menghargai jasa ibu bapa';
          } else if (slotKey === 'tajuk2') {
            finalVal = 'menghargai jasa ibu bapa';
          }
        }
        setSentenceSlots((prev) => ({ ...prev, [slotKey]: finalVal }));
        sound.playChime();
      }
    } catch {
      if (activeSelectedText) {
        let finalVal = activeSelectedText.text.toLowerCase().trim();
        if (activeSelectedText.type === 'tajuk' || finalVal.includes('jasa ibu bapa')) {
          if (slotKey === 'tajuk1') {
            finalVal = 'cara menghargai jasa ibu bapa';
          } else if (slotKey === 'tajuk2') {
            finalVal = 'menghargai jasa ibu bapa';
          }
        }
        setSentenceSlots((prev) => ({ ...prev, [slotKey]: finalVal }));
        sound.playChime();
      }
    }
  };

  const handleSlotClick = (slotKey: keyof SentenceSlots) => {
    if (activeSelectedText) {
      let finalVal = activeSelectedText.text.toLowerCase().trim();
      if (activeSelectedText.type === 'tajuk' || finalVal.includes('jasa ibu bapa')) {
        if (slotKey === 'tajuk1') {
          finalVal = 'cara menghargai jasa ibu bapa';
        } else if (slotKey === 'tajuk2') {
          finalVal = 'menghargai jasa ibu bapa';
        }
      }
      setSentenceSlots((prev) => ({ ...prev, [slotKey]: finalVal }));
      sound.playChime();
      setActiveSelectedText(null);
    } else if (sentenceSlots[slotKey]) {
      // Remove text if clicked
      setSentenceSlots((prev) => ({ ...prev, [slotKey]: '' }));
      sound.playPop();
    }
  };

  const handleCopyParagraph = () => {
    const tajuk2Val = sentenceSlots.tajuk2
      ? sentenceSlots.tajuk2.replace(/^cara\s+/gi, '').trim()
      : '(TAJUK)';
    const paragraphText = `Pada pendapat saya, terdapat dua ${sentenceSlots.tajuk1 || '(TAJUK)'}. Antaranya, kita perlu ${sentenceSlots.isi1 || '(ISI 1)'} ${sentenceSlots.huraian1 || '(HURAIAN 1)'}. Selain itu, kita harus ${sentenceSlots.isi2 || '(ISI 2)'} ${sentenceSlots.huraian2 || '(HURAIAN 2)'}. Kesimpulannya, kita patut ${tajuk2Val} ${sentenceSlots.kesan || '(KESAN)'}.`;
    navigator.clipboard.writeText(paragraphText);
    setIsCopied(true);
    sound.playChime();
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Active box object for alignment controls
  const activeBox = settings.boxes.find((b) => b.id === activeAlignBoxId) || settings.boxes[0];
  const hasAnyRevealed = Object.keys(boxStages).some((id) => (boxStages[id] || 0) > 0);

  // Split question prompt to locate the shiny "cara menjaga kebersihan diri"
  const questionPrefix = questionPrompt.includes(tajukKeyword)
    ? questionPrompt.split(tajukKeyword)[0]
    : questionPrompt;
  const questionSuffix = questionPrompt.includes(tajukKeyword)
    ? questionPrompt.split(tajukKeyword)[1]
    : '';

  // Render individual 1:1 picture frame element helper
  const renderPictureFrame = (box: HealthCardBox, customSizeClass = 'w-full aspect-square') => {
    const stage = boxStages[box.id] || 0;
    const isBoxSelectedForAlign = isAlignMode && activeAlignBoxId === box.id;
    const isPngReplaced = stage >= 2;

    return (
      <motion.div
        id={`health-box-card-${box.id}`}
        layout
        whileHover={!isAlignMode ? { scale: 1.02, y: -2 } : {}}
        whileTap={!isAlignMode ? { scale: 0.98 } : {}}
        onClick={(e) => {
          if (isAlignMode) {
            setActiveAlignBoxId(box.id);
          } else {
            handleBoxClick(box, e);
          }
        }}
        className={`relative ${customSizeClass} bg-white rounded-3xl border-4 transition-all duration-200 overflow-hidden flex items-center justify-center p-2 sm:p-3 shadow-[5px_5px_0px_#78350F] ${
          isBoxSelectedForAlign
            ? 'border-[#10B981] ring-4 ring-[#10B981]/30 shadow-[6px_6px_0px_#10B981]'
            : isAlignMode
            ? 'border-[#78350F] hover:border-[#F59E0B] cursor-pointer'
            : 'border-[#78350F] hover:shadow-[6px_6px_0px_#F59E0B] cursor-pointer'
        }`}
      >
        <div
          id={`box-canvas-${box.id}`}
          className="relative w-full h-full bg-amber-50/40 rounded-2xl flex items-center justify-center p-1.5 overflow-hidden select-none"
        >
          <AnimatePresence mode="wait">
            {!isPngReplaced && !isAlignMode ? (
              <motion.img
                key={`base-img-${box.id}`}
                src={box.imageUrl}
                alt={box.altText || 'Gambar'}
                initial={{ opacity: 0.8, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full object-contain pointer-events-none rounded-xl"
                loading="eager"
                referrerPolicy="no-referrer"
              />
            ) : !isAlignMode ? (
              <motion.div
                key={`replaced-png-${box.id}`}
                initial={{ opacity: 0, scale: 0.6, rotate: -6 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 18, stiffness: 260 }}
                className="w-full h-full flex items-center justify-center relative drop-shadow-[0_6px_12px_rgba(245,158,11,0.4)]"
              >
                <img
                  src={box.overlayPngUrl}
                  alt="Lapisan PNG"
                  className="w-full h-full object-contain pointer-events-none"
                  referrerPolicy="no-referrer"
                />
              </motion.div>
            ) : null}
          </AnimatePresence>

          {isAlignMode && (
            <>
              <img
                src={box.imageUrl}
                alt="Base"
                className="w-full h-full object-contain pointer-events-none opacity-60 rounded-xl"
                referrerPolicy="no-referrer"
              />

              <div
                id={`admin-overlay-wrapper-${box.id}`}
                onMouseDown={(e) =>
                  handleOverlayMouseDown(
                    box.id,
                    e.currentTarget.parentElement as HTMLDivElement,
                    e
                  )
                }
                style={{
                  position: 'absolute',
                  left: `${box.overlayX}%`,
                  top: `${box.overlayY}%`,
                  transform: `translate(-50%, -50%) rotate(${box.overlayRotation || 0}deg)`,
                  width: `${box.overlayScale}%`,
                  cursor: isDragging ? 'grabbing' : 'grab',
                  zIndex: 30,
                }}
                className={`group select-none touch-none ${
                  isBoxSelectedForAlign
                    ? 'ring-2 ring-[#10B981] ring-offset-2'
                    : 'border border-dashed border-[#F59E0B]'
                } rounded-xl p-1 bg-amber-100/40 backdrop-blur-[1px]`}
                title="Klik & seret untuk menyelaraskan kedudukan PNG ini"
              >
                <img
                  src={box.overlayPngUrl}
                  alt="Lapisan PNG"
                  className="w-full h-auto object-contain pointer-events-none drop-shadow-md"
                  style={{ opacity: box.overlayOpacityAdmin ?? 1.0 }}
                  referrerPolicy="no-referrer"
                />

                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#78350F] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 pointer-events-none">
                  <Move className="w-2.5 h-2.5 text-[#FBBF24]" />
                  <span>
                    X:{box.overlayX}% Y:{box.overlayY}%
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    );
  };

  const renderSlot = (
    slotKey: keyof SentenceSlots,
    label: string,
    colorClass: string,
    textClass: string,
    hoverClass: string
  ) => {
    if (dissolvingSlots.has(slotKey)) {
      const val = sentenceSlots[slotKey];
      return (
        <motion.span
          key={`slot-dissolve-${slotKey}`}
          initial={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          animate={{
            opacity: [1, 0.7, 0],
            scale: [1, 1.15, 1.3],
            filter: ['blur(0px)', 'blur(4px)', 'blur(12px)'],
          }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`relative inline-flex items-center align-middle mx-1 my-0.5 px-3 py-1 rounded-xl border-2 ${colorClass} border-[#78350F] shadow-lg text-xs sm:text-sm font-black overflow-hidden`}
        >
          {/* Powder / Dust Particle Burst Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-300/90 via-amber-100/90 to-amber-300/90 pointer-events-none flex items-center justify-center animate-pulse">
            <span className="text-xs font-black text-[#78350F]">✨💨</span>
          </div>
          <span className="opacity-30">{val}</span>
        </motion.span>
      );
    }

    if (removedSlots.has(slotKey)) {
      const isCorrect = isAnswerMatch(beeInputs[slotKey], sentenceSlots[slotKey]);
      return (
        <motion.span
          key={`slot-input-${slotKey}`}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative inline-flex items-center align-middle mx-1 my-0.5"
        >
          <input
            type="text"
            value={beeInputs[slotKey] || ''}
            onChange={(e) => handleBeeInputChange(slotKey, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleBeeInputChange(slotKey, (e.target as HTMLInputElement).value);
              }
            }}
            placeholder={`Taip ${label.toLowerCase()}...`}
            className={`px-2.5 py-1 pr-7 rounded-xl border-2 text-[#78350F] font-black text-xs sm:text-sm shadow-xs focus:ring-4 outline-hidden min-w-[140px] sm:min-w-[190px] transition-colors ${
              isCorrect
                ? 'border-[#10B981] bg-emerald-50 focus:ring-[#10B981]'
                : 'border-[#78350F] bg-white focus:ring-[#F59E0B]'
            }`}
            autoFocus
          />
          {isCorrect && (
            <span className="absolute right-2 text-[#10B981] font-black text-xs select-none pointer-events-none">
              ✓
            </span>
          )}
        </motion.span>
      );
    }

    let val = sentenceSlots[slotKey];
    if (val) {
      val = val.toLowerCase().trim();
      if (slotKey === 'tajuk2') {
        val = val.replace(/^cara\s+/gi, '').trim();
      }
    }
    return (
      <span
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleSlotDrop(e, slotKey)}
        onClick={() => handleSlotClick(slotKey)}
        className={`inline-flex items-center align-middle mx-0.5 sm:mx-1 px-2 sm:px-2.5 md:px-2.5 lg:px-3 py-0.5 sm:py-1 rounded-lg sm:rounded-xl border-2 transition-all cursor-pointer select-none text-[11px] sm:text-xs md:text-xs lg:text-sm font-black ${
          val
            ? `${colorClass} border-[#78350F] shadow-[2px_2px_0px_#78350F]`
            : `bg-white border-dashed ${hoverClass}`
        }`}
      >
        {val ? (
          <>
            <span>{val}</span>
            <X className="w-3 h-3 md:w-3.5 md:h-3.5 ml-1 shrink-0 opacity-80 hover:opacity-100" />
          </>
        ) : (
          <span className={`${textClass} opacity-75`}>({label})</span>
        )}
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen pb-12">
      {/* QUESTION PROMPT BANNER (STICK ON TOP OF THE SCREEN) */}
      <div className="w-full bg-[#FEF3C7] border-b-4 border-[#78350F] px-4 sm:px-8 py-3.5 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="shrink-0 px-2.5 py-1 bg-[#F59E0B] text-[#78350F] font-black text-xs sm:text-sm rounded-lg border-2 border-[#78350F] shadow-xs">
              SOALAN
            </span>
            <div className="text-xs sm:text-sm md:text-base font-extrabold text-[#78350F] leading-relaxed">
              <span>{questionPrefix}</span>

              {/* TAJUK INTERACTION: CLICK FIRST TO UNLOCK LABEL & DRAGGABILITY */}
              {showSplitSentenceMode ? (
                isTajukUnlocked ? (
                  /* UNLOCKED: LABELED AS [TAJUK] AND DRAGGABLE */
                  <motion.span
                    id="draggable-tajuk-badge"
                    draggable
                    onDragStart={(e) =>
                      handleDragStart(
                        e as unknown as React.DragEvent,
                        tajukKeyword,
                        'tajuk'
                      )
                    }
                    onClick={() => {
                      setActiveSelectedText({ text: tajukKeyword, type: 'tajuk' });
                      sound.playPop();
                    }}
                    initial={{ scale: 0.95, opacity: 0.9 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className={`inline-flex items-center gap-1.5 mx-1.5 px-3 py-1 rounded-xl border-2 border-[#78350F] font-black text-[#78350F] shadow-[2px_2px_0px_#78350F] cursor-grab active:cursor-grabbing select-none gentle-highlight-badge transition-all ${
                      activeSelectedText?.text === tajukKeyword
                        ? 'ring-4 ring-[#F59E0B] scale-105'
                        : ''
                    }`}
                  >
                    <span className="underline decoration-2 decoration-[#78350F]">
                      {tajukKeyword}
                    </span>
                    <span className="text-[10px] bg-[#F59E0B] px-1.5 py-0.5 rounded-md text-[#78350F] font-black border border-[#78350F]">
                      TAJUK
                    </span>
                  </motion.span>
                ) : (
                  /* LOCKED (WAITING FOR STUDENT TO CLICK) */
                  <motion.button
                    id="btn-unlock-tajuk"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setIsTajukUnlocked(true);
                      setActiveSelectedText({ text: tajukKeyword, type: 'tajuk' });
                      sound.playCelebration();
                      triggerConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
                    }}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className="inline-flex items-center gap-1.5 mx-1.5 px-3 py-1 rounded-xl border-2 border-[#D97706] bg-[#FEF3C7] hover:bg-[#FDE68A] text-[#78350F] font-black text-xs sm:text-sm shadow-xs cursor-pointer animate-bounce select-none"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
                    <span className="underline decoration-wavy decoration-[#D97706]">
                      {tajukKeyword}
                    </span>
                  </motion.button>
                )
              ) : (
                /* BEFORE 2 IMAGES CHOSEN */
                <span className="mx-1 font-black text-[#78350F] underline decoration-amber-400">
                  {tajukKeyword}
                </span>
              )}

              <span>{questionSuffix}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive Screen Area */}
      <main className="flex-1 p-3 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
        {/* KESAN SELECTION OVERLAY MODAL (TRIGGERED AFTER 2 IMAGES ALIGNED) */}
        <AnimatePresence>
          {isKesanOverlayOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center sm:items-end bg-black/20 backdrop-blur-[1px] p-3 sm:p-6 pointer-events-none overflow-y-auto"
            >
              <motion.div
                drag
                dragMomentum={false}
                initial={{ opacity: 0, scale: 0.85, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: 30 }}
                transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                className="bg-white/95 backdrop-blur-md border-4 border-[#78350F] rounded-3xl p-4 sm:p-6 shadow-[10px_10px_0px_#78350F] max-w-xl w-full flex flex-col items-center text-center gap-3.5 relative pointer-events-auto cursor-grab active:cursor-grabbing select-none"
              >
                {/* Header Badge */}
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 px-3 py-1 bg-[#F59E0B] text-[#78350F] rounded-2xl border-2 border-[#78350F] font-black text-xs uppercase shadow-xs">
                    <Sparkles className="w-3.5 h-3.5 text-[#78350F]" />
                    <span>Langkah Seterusnya: Pilih Kesan</span>
                  </div>
                  <span className="text-[10px] font-extrabold text-[#78350F]/70 bg-[#FEF3C7] px-2 py-0.5 rounded-lg border border-[#78350F]/40">
                    ✋ Boleh diseret / digerakkan
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm sm:text-lg md:text-xl font-black text-[#78350F] leading-tight">
                    Apakah <span className="text-[#2563EB] underline decoration-wavy">KESAN</span> daripada{' '}
                    <span className="text-[#D97706] font-black">"{tajukWithoutCara}"</span>?
                  </h3>
                  <p className="text-[11px] sm:text-xs font-bold text-[#78350F]/80">
                    Pilih satu jawapan yang paling tepat di bawah:
                  </p>
                </div>

                {/* 3 Choices Grid */}
                <div className="w-full flex flex-col gap-2.5 my-0.5">
                  {shuffledKesanOptions.map((opt, idx) => {
                    const isWrong = kesanWrongChoice === opt.text;
                    return (
                      <motion.button
                        key={`kesan-opt-${idx}`}
                        onClick={() => handleSelectKesanOption(opt)}
                        animate={isWrong ? { x: [-10, 10, -8, 8, 0] } : {}}
                        transition={{ duration: 0.4 }}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full p-2.5 sm:p-3.5 rounded-2xl border-3 text-left font-extrabold text-xs sm:text-sm transition-all flex items-center justify-between gap-3 cursor-pointer select-none ${
                          isWrong
                            ? 'bg-red-100 border-red-600 text-red-700 shadow-[3px_3px_0px_#DC2626]'
                            : 'bg-[#EFF6FF] hover:bg-[#DBEAFE] border-[#78350F] text-[#78350F] shadow-[3px_3px_0px_#78350F]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-white border-2 border-[#78350F] flex items-center justify-center font-black text-[#2563EB] text-xs shrink-0 shadow-xs">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="leading-snug">{opt.text}</span>
                        </div>
                        {isWrong && (
                          <span className="text-xs font-black text-red-600 shrink-0">Cuba lagi!</span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* GRAND VICTORY TROPHY MODAL AFTER ROUND 3 */}
        <AnimatePresence>
          {isVictoryModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 pointer-events-auto"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.7, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.7, y: 30 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="bg-white border-4 border-[#78350F] rounded-3xl p-6 sm:p-8 shadow-[12px_12px_0px_#78350F] max-w-md w-full flex flex-col items-center text-center gap-5 relative overflow-hidden"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#F59E0B] to-[#FBBF24] border-4 border-[#78350F] shadow-[4px_4px_0px_#78350F] flex items-center justify-center">
                  <Trophy className="w-10 h-10 text-[#78350F]" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-xl sm:text-2xl font-black text-[#78350F] tracking-tight uppercase">
                    TAHNIAH! JUARA PENULISAN! 🏆
                  </h3>
                </div>

                <div className="w-full pt-2">
                  <button
                    onClick={() => {
                      setIsVictoryModalOpen(false);
                      setIsBeeChallengeActive(false);
                      setSentenceSlots(INITIAL_SLOTS);
                      setIsSplitViewActive(false);
                      setBoxStages({});
                      setIsKesanUnlocked(false);
                      sound.playPop();
                    }}
                    className="w-full py-3.5 px-4 bg-[#F59E0B] hover:bg-[#D97706] text-[#78350F] hover:text-white font-black text-sm rounded-2xl border-3 border-[#78350F] shadow-[4px_4px_0px_#78350F] hover:shadow-[1px_1px_0px_#78350F] hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-5 h-5" />
                    <span>Main Semula</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========================================================================= */}
        {/* VIEW 1: SPLIT VIEW (AFTER 10s / WHEN 2 IMAGES CHOSEN & CONFIRMED) */}
        {/* LEFT: ENLARGED PICTURES (UP & DOWN VERTICAL STACK) + ISI & HURAIAN UNDERNEATH */}
        {/* RIGHT: DOCKED PERENGGAN CARD (ENLARGED FULL SCREEN WHEN ALL SLOTS FILLED) */}
        {/* ========================================================================= */}
        {showSplitSentenceMode ? (
          <div className={`w-full flex flex-col ${!isSentenceComplete && !isBeeChallengeActive ? 'md:flex-row items-stretch justify-between gap-4 md:gap-5 lg:gap-6' : 'items-center justify-center max-w-4xl mx-auto'}`}>
            {/* LEFT COLUMN: 2 CHOSEN IMAGES STRICTLY UP & DOWN (VANISHES WHEN ALL BLOCKS FILLED) */}
            <AnimatePresence>
              {!isSentenceComplete && !isBeeChallengeActive && (
                <motion.div
                  key="side-pictures-left-column"
                  initial={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, width: 0, overflow: 'hidden' }}
                  transition={{ duration: 0.35 }}
                  className="w-full md:w-[42%] lg:w-5/12 flex flex-col justify-between gap-3 sm:gap-3.5 shrink-0"
                >
                  {clickedBoxes.slice(0, 2).map((box, chosenIdx) => {
                    const stage = boxStages[box.id] || 1;
                    const showTextBox1 = stage >= 1;
                    const showTextBox2 = stage >= 2;

                    const isIsiVanished = isTextPlaced(box.textBox1);
                    const isHuraianVanished = isTextPlaced(box.textBox2);

                    return (
                      <motion.div
                        key={`chosen-box-row-${box.id}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: chosenIdx * 0.1 }}
                        className="flex-1 w-full bg-white border-3 md:border-4 border-[#78350F] rounded-2xl md:rounded-3xl p-3 sm:p-3.5 shadow-[4px_4px_0px_#78350F] md:shadow-[5px_5px_0px_#78350F] flex flex-col items-center justify-between gap-2.5"
                      >
                        {/* 1. TOP PART: ENLARGED 1:1 PICTURE FRAME */}
                        <div className="w-full flex-1 min-h-[130px] sm:min-h-[150px] md:min-h-[140px] lg:min-h-[170px] max-h-[220px] aspect-square mx-auto flex items-center justify-center">
                          <div className="w-full h-full max-h-full flex items-center justify-center">
                            {renderPictureFrame(box, 'w-full h-full max-h-full')}
                          </div>
                        </div>

                        {/* 2. BOTTOM PART: ISI (TOP) & HURAIAN (BOTTOM) UNDERNEATH THE PICTURE */}
                        <div className="w-full flex flex-col gap-2 shrink-0 justify-center">
                          {/* 2A. ISI CARD */}
                          {showTextBox1 && (
                            <AnimatePresence>
                              {!isIsiVanished && (
                                <motion.div
                                  key={`isi-card-${box.id}`}
                                  draggable
                                  onDragStart={(e) =>
                                    handleDragStart(
                                      e as unknown as React.DragEvent,
                                      box.textBox1 || `Isi ${chosenIdx + 1}`,
                                      'isi'
                                    )
                                  }
                                  onClick={() => {
                                    setActiveSelectedText({
                                      text: box.textBox1 || `Isi ${chosenIdx + 1}`,
                                      type: 'isi',
                                    });
                                    sound.playPop();
                                  }}
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, height: 0, margin: 0, padding: 0, overflow: 'hidden' }}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  className={`w-full bg-white border-2 border-[#78350F] rounded-xl sm:rounded-2xl p-2 sm:p-2.5 shadow-[2px_2px_0px_#78350F] md:shadow-[3px_3px_0px_#78350F] cursor-grab active:cursor-grabbing select-none transition-all ${
                                    activeSelectedText?.text === box.textBox1
                                      ? 'ring-4 ring-[#10B981] scale-102'
                                      : 'hover:border-[#10B981]'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-1 mb-0.5">
                                    <span className="px-2 py-0.5 rounded-md bg-[#10B981] text-white font-black text-[9px] sm:text-[10px] uppercase border border-[#78350F]">
                                      ISI {chosenIdx + 1}
                                    </span>
                                  </div>
                                  <p className="text-xs sm:text-xs md:text-sm font-black text-[#78350F] leading-snug">
                                    {box.textBox1 || 'Teks Isi'}
                                  </p>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          )}

                          {/* 2B. HURAIAN CARD */}
                          {showTextBox2 && (
                            <AnimatePresence>
                              {!isHuraianVanished && (
                                <motion.div
                                  key={`huraian-card-${box.id}`}
                                  draggable
                                  onDragStart={(e) =>
                                    handleDragStart(
                                      e as unknown as React.DragEvent,
                                      box.textBox2 || `Huraian ${chosenIdx + 1}`,
                                      'huraian'
                                    )
                                  }
                                  onClick={() => {
                                    setActiveSelectedText({
                                      text: box.textBox2 || `Huraian ${chosenIdx + 1}`,
                                      type: 'huraian',
                                    });
                                    sound.playPop();
                                  }}
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, height: 0, margin: 0, padding: 0, overflow: 'hidden' }}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  className={`w-full bg-[#FEF3C7] border-2 border-[#78350F] rounded-xl sm:rounded-2xl p-2 sm:p-2.5 shadow-[2px_2px_0px_#78350F] md:shadow-[3px_3px_0px_#78350F] cursor-grab active:cursor-grabbing select-none transition-all ${
                                    activeSelectedText?.text === box.textBox2
                                      ? 'ring-4 ring-[#F59E0B] scale-102'
                                      : 'hover:border-[#F59E0B]'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-1 mb-0.5">
                                    <span className="px-2 py-0.5 rounded-md bg-[#F59E0B] text-[#78350F] font-black text-[9px] sm:text-[10px] uppercase border border-[#78350F]">
                                      HURAIAN {chosenIdx + 1}
                                    </span>
                                  </div>
                                  <p className="text-xs sm:text-xs md:text-sm font-black text-[#78350F] leading-snug">
                                    {box.textBox2 || 'Teks Huraian'}
                                  </p>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* KESAN CARD (SHOWS IN LEFT COLUMN IF UNLOCKED AND NOT YET PLACED IN SLOT) */}
                  {isKesanUnlocked && !isTextPlaced(kesanKeyword) && (
                    <AnimatePresence>
                      <motion.div
                        key="kesan-card-left-column"
                        draggable
                        onDragStart={(e) =>
                          handleDragStart(
                            e as unknown as React.DragEvent,
                            kesanKeyword,
                            'kesan'
                          )
                        }
                        onClick={() => {
                          setActiveSelectedText({
                            text: kesanKeyword,
                            type: 'kesan',
                          });
                          sound.playPop();
                        }}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, height: 0, margin: 0, padding: 0, overflow: 'hidden' }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full bg-[#EEF2FF] border-3 border-[#78350F] rounded-2xl p-3 shadow-[3px_3px_0px_#78350F] cursor-grab active:cursor-grabbing select-none transition-all ${
                          activeSelectedText?.text === kesanKeyword
                            ? 'ring-4 ring-[#4F46E5] scale-102'
                            : 'hover:border-[#4F46E5]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="px-2 py-0.5 rounded-md bg-[#4F46E5] text-white font-black text-[9px] sm:text-[10px] uppercase border border-[#78350F]">
                            KESAN
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm font-black text-[#78350F] leading-snug">
                          {kesanKeyword}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* RIGHT COLUMN: PERENGGAN CARD (EXPANDS TO FULL WIDTH WHEN SIDE PICTURES VANISH) */}
            <div className={`w-full ${!isSentenceComplete && !isBeeChallengeActive ? 'md:w-[58%] lg:w-7/12' : 'w-full max-w-4xl mx-auto'} flex flex-col transition-all duration-300`}>
              <motion.div
                key="perenggan-docked-card"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35 }}
                className="w-full h-full bg-white border-3 md:border-4 border-[#78350F] rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-5 lg:p-6 shadow-[5px_5px_0px_#78350F] md:shadow-[6px_6px_0px_#78350F] flex flex-col justify-between"
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 md:border-b-3 border-[#FDE68A] pb-2.5 mb-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 md:p-2 bg-[#F59E0B] rounded-xl border-2 border-[#78350F] text-[#78350F] shadow-xs">
                      <FileText className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <h3 className="text-sm sm:text-base md:text-base lg:text-lg font-black text-[#78350F] uppercase tracking-tight">
                      Perenggan Ulasan Pendapat
                    </h3>
                  </div>
                </div>

                {/* CHALLENGE COUNTDOWN / CONTROL BANNERS */}
                {beeCountdown !== null && !isBeeChallengeActive && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-3 p-3 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 border-3 border-[#78350F] rounded-2xl shadow-[4px_4px_0px_#78350F] text-[#78350F] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl animate-bounce">✨</span>
                      <h4 className="font-black text-xs sm:text-sm uppercase tracking-wide">
                        Cabaran Penulisan Bermula Dalam {beeCountdown}s!
                      </h4>
                    </div>
                    <button
                      onClick={startBeeChallenge}
                      className="px-3.5 py-1.5 bg-white hover:bg-[#FEF3C7] text-[#78350F] font-black text-xs rounded-xl border-2 border-[#78350F] shadow-[2px_2px_0px_#78350F] cursor-pointer whitespace-nowrap"
                    >
                      Mula Sekarang ✨
                    </button>
                  </motion.div>
                )}

                {isBeeChallengeActive && (
                  <div className="mb-3 p-3 bg-[#FEF3C7] border-3 border-[#78350F] rounded-2xl shadow-[3px_3px_0px_#78350F] text-[#78350F] flex items-center justify-between gap-2.5 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl animate-pulse">✨</span>
                      <span className="px-2.5 py-1 bg-[#F59E0B] text-[#78350F] font-black text-xs uppercase rounded-lg border border-[#78350F]">
                        Pusingan {beeRound} / 3
                      </span>
                    </div>
                  </div>
                )}

                {typingFeedback && (
                  <div className="mb-3 px-3 py-2 bg-amber-100 border-2 border-[#78350F] text-[#78350F] rounded-xl font-black text-xs flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#D97706]" />
                    <span>{typingFeedback}</span>
                  </div>
                )}

                {/* SENTENCE TEMPLATE: CLEAN AUTO-TIDY INLINE FLOWING PARAGRAPH */}
                <div className="flex-1 p-3.5 sm:p-5 md:p-5 lg:p-6 bg-amber-50/70 border-2 md:border-3 border-[#78350F] rounded-xl md:rounded-2xl text-xs sm:text-sm md:text-[14px] lg:text-[15px] font-bold text-[#78350F] leading-[2.4] sm:leading-[2.7] md:leading-[2.7] lg:leading-[3.0] flex flex-col justify-between gap-3 sm:gap-4 my-auto">
                  {/* Ayat 1 */}
                  <div>
                    <span>Pada pendapat saya, terdapat dua </span>

                    {/* SLOT: TAJUK 1 */}
                    {renderSlot(
                      'tajuk1',
                      'TAJUK',
                      'bg-[#F59E0B] text-[#78350F]',
                      'text-[#B45309]',
                      'border-[#F59E0B] hover:bg-[#FEF3C7]'
                    )}

                    <span>. Antaranya, kita perlu </span>

                    {/* SLOT: ISI 1 */}
                    {renderSlot(
                      'isi1',
                      'ISI 1',
                      'bg-[#10B981] text-white',
                      'text-[#059669]',
                      'border-[#10B981] hover:bg-[#D1FAE5]'
                    )}

                    <span> </span>

                    {/* SLOT: HURAIAN 1 */}
                    {renderSlot(
                      'huraian1',
                      'HURAIAN 1',
                      'bg-[#FBBF24] text-[#78350F]',
                      'text-[#B45309]',
                      'border-[#FBBF24] hover:bg-[#FEF3C7]'
                    )}

                    <span>.</span>
                  </div>

                  {/* Ayat 2 */}
                  <div>
                    <span>Selain itu, kita harus </span>

                    {/* SLOT: ISI 2 */}
                    {renderSlot(
                      'isi2',
                      'ISI 2',
                      'bg-[#10B981] text-white',
                      'text-[#059669]',
                      'border-[#10B981] hover:bg-[#D1FAE5]'
                    )}

                    <span> </span>

                    {/* SLOT: HURAIAN 2 */}
                    {renderSlot(
                      'huraian2',
                      'HURAIAN 2',
                      'bg-[#FBBF24] text-[#78350F]',
                      'text-[#B45309]',
                      'border-[#FBBF24] hover:bg-[#FEF3C7]'
                    )}

                    <span>.</span>
                  </div>

                  {/* Ayat 3 (Kesimpulan) */}
                  <div>
                    <span>Kesimpulannya, kita patut </span>

                    {/* SLOT: TAJUK 2 */}
                    {renderSlot(
                      'tajuk2',
                      'TAJUK',
                      'bg-[#F59E0B] text-[#78350F]',
                      'text-[#B45309]',
                      'border-[#F59E0B] hover:bg-[#FEF3C7]'
                    )}

                    <span> </span>

                    {/* SLOT: KESAN */}
                    {renderSlot(
                      'kesan',
                      'KESAN',
                      'bg-[#3B82F6] text-white',
                      'text-[#2563EB]',
                      'border-[#3B82F6] hover:bg-[#EFF6FF]'
                    )}

                    <span>.</span>
                  </div>
                </div>

                {/* BOTTOM TRAY: DRAGGABLE [KESAN] PILL & ACTIONS */}
                <div className="mt-3 sm:mt-4 flex flex-wrap items-center justify-between gap-2.5 pt-2.5 border-t-2 border-[#FDE68A] shrink-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-[#78350F]">Pilihan [KESAN]:</span>
                    {!isTextPlaced(kesanKeyword) && (
                      <motion.div
                        draggable
                        onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, kesanKeyword, 'kesan')}
                        onClick={() => {
                          setActiveSelectedText({ text: kesanKeyword, type: 'kesan' });
                          sound.playPop();
                        }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className={`px-2.5 py-1 sm:px-3 sm:py-1.5 bg-[#3B82F6] text-white font-black text-xs rounded-xl border-2 border-[#78350F] shadow-[2px_2px_0px_#78350F] cursor-grab active:cursor-grabbing flex items-center gap-1.5 ${
                          activeSelectedText?.text === kesanKeyword ? 'ring-4 ring-[#2563EB]' : ''
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{kesanKeyword}</span>
                      </motion.div>
                    )}
                  </div>

                  {!isBeeChallengeActive && (
                    <button
                      onClick={() => {
                        setSentenceSlots(INITIAL_SLOTS);
                        setActiveSelectedText(null);
                        setHasCelebratedCompletion(false);
                        sound.playPop();
                      }}
                      className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-[#FEF3C7] hover:bg-[#FDE68A] text-[#78350F] font-bold text-xs rounded-xl border-2 border-[#78350F] shadow-[2px_2px_0px_#78350F] flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Kosongkan Ruangan</span>
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* VIEW 2: INITIAL 3 HORIZONTAL COLUMNS (BEFORE 10s COUNTDOWN ENDS, OR ADMIN MODE) */
          /* ========================================================================= */
          <>
            <div className="w-full flex flex-col md:flex-row items-center md:items-start justify-center gap-4 sm:gap-6 md:gap-3 lg:gap-6 pt-1 sm:pt-2">
            {settings.boxes.map((box, idx) => {
              const stage = boxStages[box.id] || 0;
              const showTextBox1 = stage >= 1;
              const showTextBox2 = stage >= 2;

              return (
                <div
                  key={box.id}
                  id={`box-column-${box.id}`}
                  className="flex-1 w-full max-w-[260px] sm:max-w-[290px] md:max-w-[230px] lg:max-w-[300px] flex flex-col items-center justify-center relative"
                >
                  {/* TOP CARD: TEXT BOX 2 [HURAIAN] */}
                  <div className="w-full min-h-[70px] md:min-h-[75px] mb-2 sm:mb-3 flex items-end justify-center relative z-30">
                    <AnimatePresence>
                      {showTextBox2 && (
                        <motion.div
                          key={`textbox2-card-${box.id}`}
                          drag
                          dragMomentum={false}
                          whileDrag={{ scale: 1.04, zIndex: 50 }}
                          initial={{ opacity: 0, y: -20, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -20, scale: 0.9 }}
                          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                          className="w-full bg-[#FEF3C7] border-2 md:border-3 border-[#78350F] rounded-xl sm:rounded-2xl p-2.5 sm:p-3 shadow-[3px_3px_0px_#78350F] select-none"
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="px-2 py-0.5 rounded-md bg-[#F59E0B] text-[#78350F] font-black text-[9px] sm:text-[10px] uppercase border border-[#78350F]">
                              HURAIAN {idx + 1}
                            </span>
                          </div>
                          <p className="text-xs sm:text-xs md:text-sm font-black text-[#78350F] text-center leading-snug">
                            {box.textBox2 || 'Teks Huraian'}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* 1:1 RATIO PICTURE FRAME */}
                  {renderPictureFrame(box)}

                  {/* BOTTOM CARD: TEXT BOX 1 [ISI] */}
                  <div className="w-full min-h-[70px] md:min-h-[75px] mt-2 sm:mt-3 flex items-start justify-center relative z-30">
                    <AnimatePresence>
                      {showTextBox1 && (
                        <motion.div
                          key={`textbox1-card-${box.id}`}
                          drag
                          dragMomentum={false}
                          whileDrag={{ scale: 1.04, zIndex: 50 }}
                          initial={{ opacity: 0, y: 20, scale: 0.9 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 20, scale: 0.9 }}
                          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                          className="w-full bg-white border-2 md:border-3 border-[#78350F] rounded-xl sm:rounded-2xl p-2.5 sm:p-3 shadow-[3px_3px_0px_#78350F] select-none"
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="px-2 py-0.5 rounded-md bg-[#10B981] text-white font-black text-[9px] sm:text-[10px] uppercase border border-[#78350F]">
                              ISI {idx + 1}
                            </span>
                          </div>
                          <p className="text-xs sm:text-xs md:text-sm font-black text-[#78350F] text-center leading-snug">
                            {box.textBox1 || 'Teks Isi'}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>

          {/* NEXT ARROW BUTTON FOR KESAN QUESTION */}
          {stage2Boxes.length >= 2 && !isKesanUnlocked && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="w-full flex justify-center mt-6 z-30"
            >
              <motion.button
                id="btn-open-kesan-question"
                onClick={handleOpenKesanQuestion}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group px-6 sm:px-8 py-3.5 sm:py-4 bg-[#F59E0B] hover:bg-[#D97706] text-[#78350F] font-black text-sm sm:text-base md:text-lg rounded-2xl border-4 border-[#78350F] shadow-[6px_6px_0px_#78350F] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#78350F] flex items-center justify-center gap-3 cursor-pointer uppercase tracking-wider transition-all animate-bounce"
              >
                <Sparkles className="w-5 h-5 text-[#78350F]" />
                <span>Seterusnya: Soalan Kesan</span>
                <ArrowRight className="w-6 h-6 stroke-[3] group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </motion.div>
          )}
        </>
      )}

        {/* INTERACTIVE ADMIN ALIGNMENT DOCK (Visible when Admin Align Mode is Active) */}
        {isAlignMode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl bg-white border-4 border-[#78350F] rounded-2xl p-4 shadow-[6px_6px_0px_#78350F] mt-6 z-30 mx-auto"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#FDE68A] pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#10B981]" />
                <span className="font-black text-[#78350F] text-sm sm:text-base uppercase">
                  Pusat Kawalan Penyelarasan Lapisan PNG
                </span>
              </div>

              <div className="flex items-center gap-2">
                {settings.boxes.map((b, i) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setActiveAlignBoxId(b.id);
                      sound.playPop();
                    }}
                    className={`px-3 py-1 rounded-full font-black text-xs border-2 transition-all cursor-pointer ${
                      activeAlignBoxId === b.id
                        ? 'bg-[#F59E0B] text-[#78350F] border-[#78350F] shadow-[1px_1px_0px_#78350F]'
                        : 'bg-[#FEF3C7] text-[#78350F] border-transparent hover:border-[#F59E0B]'
                    }`}
                  >
                    Gambar {i + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Fine-Tuning Sliders for Active Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-bold text-[#78350F]">
              <div className="bg-[#FEF3C7]/60 p-2.5 rounded-xl border border-[#FDE68A]">
                <div className="flex justify-between mb-1">
                  <span>Kedudukan X (Mendatar):</span>
                  <span className="font-black text-[#B45309]">{activeBox.overlayX}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={95}
                  value={activeBox.overlayX}
                  onChange={(e) => updateBox(activeBox.id, { overlayX: Number(e.target.value) })}
                  className="w-full accent-[#F59E0B]"
                />
              </div>

              <div className="bg-[#FEF3C7]/60 p-2.5 rounded-xl border border-[#FDE68A]">
                <div className="flex justify-between mb-1">
                  <span>Kedudukan Y (Menegak):</span>
                  <span className="font-black text-[#B45309]">{activeBox.overlayY}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={95}
                  value={activeBox.overlayY}
                  onChange={(e) => updateBox(activeBox.id, { overlayY: Number(e.target.value) })}
                  className="w-full accent-[#F59E0B]"
                />
              </div>

              <div className="bg-[#FEF3C7]/60 p-2.5 rounded-xl border border-[#FDE68A]">
                <div className="flex justify-between mb-1">
                  <span>Saiz PNG (%):</span>
                  <span className="font-black text-[#B45309]">{activeBox.overlayScale}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={90}
                  value={activeBox.overlayScale}
                  onChange={(e) =>
                    updateBox(activeBox.id, { overlayScale: Number(e.target.value) })
                  }
                  className="w-full accent-[#F59E0B]"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const nextStage = ((boxStages[activeBox.id] || 0) + 1) % 3;
                    setBoxStages((prev) => ({ ...prev, [activeBox.id]: nextStage }));
                    sound.playPop();
                  }}
                  className="flex-1 py-2 bg-[#FEF3C7] hover:bg-[#FDE68A] border-2 border-[#78350F] rounded-xl font-black text-xs text-[#78350F] shadow-[1px_1px_0px_#78350F] flex items-center justify-center gap-1 cursor-pointer"
                  title="Uji Langkah Klik (0 -> 1 -> 2)"
                >
                  <Eye className="w-3.5 h-3.5 text-[#B45309]" />
                  <span>Uji Klik</span>
                </button>

                <button
                  onClick={() => {
                    setIsAlignMode(false);
                    sound.playPop();
                  }}
                  className="flex-1 py-2 bg-[#10B981] hover:bg-[#059669] text-white border-2 border-[#78350F] rounded-xl font-black text-xs shadow-[1px_1px_0px_#78350F] flex items-center justify-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Selesai</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};
