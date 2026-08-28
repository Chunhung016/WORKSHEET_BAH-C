import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  RotateCcw,
  Download,
  Upload,
  Sliders,
  Sparkles,
  Layers,
  FileText,
  Check,
  Move,
  Type,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sound } from '../utils/audio';

export const AdminDashboard: React.FC = () => {
  const {
    settings,
    updateSettings,
    updateBox,
    resetSettings,
    importSettingsJSON,
    exportSettingsJSON,
    isAdminOpen,
    setIsAdminOpen,
    adminTab,
    setAdminTab,
    setIsAlignMode,
    setActiveAlignBoxId,
  } = useApp();

  const [selectedBoxIndex, setSelectedBoxIndex] = useState<number>(0);
  const [jsonInput, setJsonInput] = useState<string>('');
  const [showCopyAlert, setShowCopyAlert] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  if (!isAdminOpen) return null;

  const currentBox = settings.boxes[selectedBoxIndex] || settings.boxes[0];

  const handleClose = () => {
    setIsAdminOpen(false);
    sound.playPop();
  };

  const handleExport = () => {
    const dataStr = exportSettingsJSON();
    navigator.clipboard.writeText(dataStr);
    setShowCopyAlert(true);
    sound.playChime();
    setTimeout(() => setShowCopyAlert(false), 2500);
  };

  const handleImport = () => {
    if (!jsonInput.trim()) return;
    const success = importSettingsJSON(jsonInput);
    if (success) {
      setImportStatus('Tetapan berjaya dimuat turun!');
      setJsonInput('');
      setTimeout(() => setImportStatus(null), 3000);
    } else {
      setImportStatus('Ralat: Format JSON tidak sah.');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white border-4 border-[#78350F] rounded-3xl w-full max-w-4xl shadow-[10px_10px_0px_#78350F] overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="bg-[#F59E0B] border-b-4 border-[#78350F] px-4 sm:px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 rounded-full bg-white border-2 border-[#78350F] flex items-center justify-center font-black text-[#78350F] text-sm shadow-xs">
                G
              </div>
              <div>
                <h2 className="text-base sm:text-xl font-black text-[#78350F] uppercase tracking-tight">
                  Pusat Kawalan & Tetapan Admin
                </h2>
                <p className="text-[11px] sm:text-xs font-bold text-[#78350F]/80">
                  Bahagian C: Kesihatan Diri • Tekan [G] untuk Buka/Tutup
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="p-1.5 bg-white hover:bg-[#FEF3C7] rounded-full border-2 border-[#78350F] text-[#78350F] shadow-[2px_2px_0px_#78350F] transition-all cursor-pointer"
              title="Tutup [G]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex overflow-x-auto border-b-2 border-[#78350F] bg-[#FEF3C7] px-4 pt-2 gap-2 scrollbar-none">
            <button
              onClick={() => setAdminTab('boxes')}
              className={`px-4 py-2 font-black text-xs sm:text-sm rounded-t-xl border-t-2 border-x-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                adminTab === 'boxes'
                  ? 'bg-white text-[#78350F] border-[#78350F] shadow-xs'
                  : 'bg-[#FDE68A] text-[#78350F]/70 border-transparent hover:bg-[#FDE68A]/90'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>3 Kotak Gambar & Teks</span>
            </button>

            <button
              onClick={() => setAdminTab('alignment')}
              className={`px-4 py-2 font-black text-xs sm:text-sm rounded-t-xl border-t-2 border-x-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                adminTab === 'alignment'
                  ? 'bg-white text-[#78350F] border-[#78350F] shadow-xs'
                  : 'bg-[#FDE68A] text-[#78350F]/70 border-transparent hover:bg-[#FDE68A]/90'
              }`}
            >
              <Move className="w-4 h-4" />
              <span>Penyelarasan Lapisan PNG</span>
            </button>

            <button
              onClick={() => setAdminTab('toggles')}
              className={`px-4 py-2 font-black text-xs sm:text-sm rounded-t-xl border-t-2 border-x-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                adminTab === 'toggles'
                  ? 'bg-white text-[#78350F] border-[#78350F] shadow-xs'
                  : 'bg-[#FDE68A] text-[#78350F]/70 border-transparent hover:bg-[#FDE68A]/90'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Kesan Bunyi & Animasi</span>
            </button>

            <button
              onClick={() => setAdminTab('data')}
              className={`px-4 py-2 font-black text-xs sm:text-sm rounded-t-xl border-t-2 border-x-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                adminTab === 'data'
                  ? 'bg-white text-[#78350F] border-[#78350F] shadow-xs'
                  : 'bg-[#FDE68A] text-[#78350F]/70 border-transparent hover:bg-[#FDE68A]/90'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Eksport / Import Data</span>
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
            {/* TAB 1: 3 KOTAK GAMBAR & 2 KOTAK TEKS (ISI & HURAIAN) */}
            {adminTab === 'boxes' && (
              <div className="space-y-6">
                {/* Question & Keywords Global Settings */}
                <div className="bg-[#FEF3C7]/60 p-4 rounded-2xl border-2 border-[#78350F] space-y-3">
                  <h3 className="font-black text-[#78350F] text-xs sm:text-sm uppercase flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#B45309]" />
                    Soalan & Kata Kunci Bahagian C (Atas Skrin & Perenggan)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="md:col-span-3">
                      <label className="block text-xs font-black text-[#78350F] mb-1">
                        Teks Soalan (Dipaparkan di Bahagian Atas Skrin):
                      </label>
                      <textarea
                        rows={2}
                        value={settings.questionPrompt || ''}
                        onChange={(e) => updateSettings({ questionPrompt: e.target.value })}
                        className="w-full p-2 bg-white border-2 border-[#78350F] rounded-xl text-xs font-bold text-[#78350F]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-[#78350F] mb-1">
                        Kata Kunci [TAJUK] (Kesan Berkilau):
                      </label>
                      <input
                        type="text"
                        value={settings.tajukKeyword || ''}
                        onChange={(e) => updateSettings({ tajukKeyword: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border-2 border-[#78350F] rounded-xl text-xs font-bold text-[#78350F]"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-black text-[#78350F] mb-1">
                        Pilihan Ayat [KESAN] - Jawapan Betul:
                      </label>
                      <input
                        type="text"
                        value={settings.kesanKeyword || ''}
                        onChange={(e) => updateSettings({ kesanKeyword: e.target.value })}
                        className="w-full px-3 py-1.5 bg-white border-2 border-[#78350F] rounded-xl text-xs font-bold text-[#78350F]"
                      />
                    </div>
                    <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-xs font-black text-[#78350F] mb-1">
                          Pilihan [KESAN] Penyerong 1 (Pengacau):
                        </label>
                        <input
                          type="text"
                          value={settings.kesanDistractors?.[0] || ''}
                          onChange={(e) => {
                            const current = [...(settings.kesanDistractors || ['', ''])];
                            current[0] = e.target.value;
                            updateSettings({ kesanDistractors: current });
                          }}
                          className="w-full px-3 py-1.5 bg-white border-2 border-[#78350F] rounded-xl text-xs font-bold text-[#78350F]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-[#78350F] mb-1">
                          Pilihan [KESAN] Penyerong 2 (Pengacau):
                        </label>
                        <input
                          type="text"
                          value={settings.kesanDistractors?.[1] || ''}
                          onChange={(e) => {
                            const current = [...(settings.kesanDistractors || ['', ''])];
                            current[1] = e.target.value;
                            updateSettings({ kesanDistractors: current });
                          }}
                          className="w-full px-3 py-1.5 bg-white border-2 border-[#78350F] rounded-xl text-xs font-bold text-[#78350F]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3 Box Selector Buttons */}
                <div className="flex flex-wrap gap-2 pb-2 border-b-2 border-[#FDE68A]">
                  {settings.boxes.map((box, idx) => (
                    <button
                      key={box.id}
                      onClick={() => {
                        setSelectedBoxIndex(idx);
                        sound.playPop();
                      }}
                      className={`flex-1 min-w-[130px] p-3 rounded-2xl border-3 font-black text-xs sm:text-sm transition-all flex items-center justify-between cursor-pointer ${
                        selectedBoxIndex === idx
                          ? 'bg-[#F59E0B] text-[#78350F] border-[#78350F] shadow-[3px_3px_0px_#78350F]'
                          : 'bg-[#FEF3C7] text-[#78350F]/80 border-[#FDE68A] hover:border-[#F59E0B]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-white border border-[#78350F] flex items-center justify-center text-xs">
                          {idx + 1}
                        </span>
                        <span>{box.title}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Box Detail Editor Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Left Column: Image URLs & Labels */}
                  <div className="space-y-4 bg-[#FEF3C7]/40 p-4 rounded-2xl border-2 border-[#FDE68A]">
                    <h3 className="font-black text-[#78350F] text-sm uppercase flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#F59E0B]" />
                      Tetapan Gambar {selectedBoxIndex + 1}
                    </h3>

                    {/* Box Title */}
                    <div>
                      <label className="block text-xs font-black text-[#78350F] mb-1">
                        Tajuk / Label Gambar:
                      </label>
                      <input
                        type="text"
                        value={currentBox.title}
                        onChange={(e) => updateBox(currentBox.id, { title: e.target.value })}
                        className="w-full px-3 py-2 bg-white border-2 border-[#78350F] rounded-xl text-xs font-bold text-[#78350F] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
                      />
                    </div>

                    {/* Main Image / Animated GIF URL & File Upload */}
                    <div>
                      <label className="block text-xs font-black text-[#78350F] mb-1 flex items-center justify-between">
                        <span>URL Gambar Utama / Animated GIF:</span>
                        <span className="text-[10px] text-[#B45309]">Bolehkah GIF Animasi 🎞️</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={currentBox.imageUrl}
                          onChange={(e) => updateBox(currentBox.id, { imageUrl: e.target.value })}
                          placeholder="Masukkan URL atau muat naik fail GIF / PNG / JPG..."
                          className="flex-1 px-3 py-2 bg-white border-2 border-[#78350F] rounded-xl text-xs font-mono text-[#78350F] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
                        />
                        <label className="px-3 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-[#78350F] font-black rounded-xl border-2 border-[#78350F] text-xs shadow-[2px_2px_0px_#78350F] flex items-center gap-1 cursor-pointer shrink-0 transition-all">
                          <Upload className="w-4 h-4" />
                          <span>Muat Naik GIF</span>
                          <input
                            type="file"
                            accept="image/*,.gif,.png,.jpg,.jpeg,.webp"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const dataUrl = event.target?.result as string;
                                  if (dataUrl) {
                                    updateBox(currentBox.id, { imageUrl: dataUrl });
                                    sound.playPop();
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Overlay PNG / GIF Image URL & File Upload */}
                    <div>
                      <label className="block text-xs font-black text-[#78350F] mb-1 flex items-center justify-between">
                        <span>URL Lapisan Gambar PNG / GIF Transparensi:</span>
                        <span className="text-[10px] text-[#B45309]">Sokong GIF Beranimasi 🎞️</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={currentBox.overlayPngUrl}
                          onChange={(e) =>
                            updateBox(currentBox.id, { overlayPngUrl: e.target.value })
                          }
                          placeholder="Masukkan URL atau muat naik fail GIF / PNG..."
                          className="flex-1 px-3 py-2 bg-white border-2 border-[#78350F] rounded-xl text-xs font-mono text-[#78350F] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
                        />
                        <label className="px-3 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-[#78350F] font-black rounded-xl border-2 border-[#78350F] text-xs shadow-[2px_2px_0px_#78350F] flex items-center gap-1 cursor-pointer shrink-0 transition-all">
                          <Upload className="w-4 h-4" />
                          <span>Muat Naik GIF</span>
                          <input
                            type="file"
                            accept="image/*,.gif,.png,.jpg,.jpeg,.webp"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const dataUrl = event.target?.result as string;
                                  if (dataUrl) {
                                    updateBox(currentBox.id, { overlayPngUrl: dataUrl });
                                    sound.playPop();
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: 2 Text Boxes (for future uses, invisible in user mode) */}
                  <div className="space-y-4 bg-amber-50/60 p-4 rounded-2xl border-2 border-[#F59E0B]">
                    <div className="flex items-center justify-between">
                      <h3 className="font-black text-[#78350F] text-sm uppercase flex items-center gap-2">
                        <Type className="w-4 h-4 text-[#B45309]" />
                        2 Kotak Teks (Kegunaan Masa Depan)
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 border border-slate-300">
                        Halimunan di Skrin Utama
                      </span>
                    </div>

                    {/* Information Note */}
                    <div className="p-2.5 bg-white rounded-xl border border-[#FDE68A] text-[11px] font-bold text-[#B45309]">
                      ℹ️ <strong>Nota Penting:</strong> Dua kotak teks ini disimpan dalam tetapan
                      untuk kegunaan masa hadapan mengikut arahan. Kotak ini secara lalai tidak
                      kelihatan di mod murid pada skrin utama.
                    </div>

                    {/* Text Box 1 */}
                    <div>
                      <label className="block text-xs font-black text-[#78350F] mb-1">
                        Kotak Teks 1 (Ayat / Huraian / Nota):
                      </label>
                      <textarea
                        rows={3}
                        value={currentBox.textBox1}
                        onChange={(e) => updateBox(currentBox.id, { textBox1: e.target.value })}
                        placeholder="Masukkan teks huraian atau nota pertama..."
                        className="w-full p-2.5 bg-white border-2 border-[#78350F] rounded-xl text-xs text-[#78350F] font-medium focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
                      />
                    </div>

                    {/* Text Box 2 */}
                    <div>
                      <label className="block text-xs font-black text-[#78350F] mb-1">
                        Kotak Teks 2 (Ayat / Langkah Kebersihan):
                      </label>
                      <textarea
                        rows={3}
                        value={currentBox.textBox2}
                        onChange={(e) => updateBox(currentBox.id, { textBox2: e.target.value })}
                        placeholder="Masukkan teks huraian atau nota kedua..."
                        className="w-full p-2.5 bg-white border-2 border-[#78350F] rounded-xl text-xs text-[#78350F] font-medium focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
                      />
                    </div>

                    {/* Button to jump to Live Alignment */}
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          setActiveAlignBoxId(currentBox.id);
                          setIsAlignMode(true);
                          setIsAdminOpen(false);
                          sound.playPop();
                        }}
                        className="w-full py-2.5 bg-[#10B981] hover:bg-[#059669] text-white font-black rounded-xl border-2 border-[#78350F] text-xs shadow-[2px_2px_0px_#78350F] flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Move className="w-4 h-4" />
                        <span>Buka Penyelarasan Langsung Gambar Ini di Skrin</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PENYELARASAN PNG OVERLAY CONTROLS */}
            {adminTab === 'alignment' && (
              <div className="space-y-6">
                {/* Active Box Selector */}
                <div className="flex gap-2">
                  {settings.boxes.map((box, idx) => (
                    <button
                      key={box.id}
                      onClick={() => setSelectedBoxIndex(idx)}
                      className={`flex-1 py-2 px-3 rounded-xl border-2 font-black text-xs transition-all cursor-pointer ${
                        selectedBoxIndex === idx
                          ? 'bg-[#F59E0B] text-[#78350F] border-[#78350F]'
                          : 'bg-[#FEF3C7] text-[#78350F] border-transparent'
                      }`}
                    >
                      {box.title} (Gambar {idx + 1})
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  {/* Visual Preview Box */}
                  <div className="relative bg-amber-50 rounded-2xl border-3 border-[#78350F] p-4 flex items-center justify-center min-h-[260px] overflow-hidden">
                    <img
                      src={currentBox.imageUrl}
                      alt="Pratonton"
                      className="max-h-[220px] w-full object-contain pointer-events-none rounded-lg"
                    />

                    {/* PNG Overlay Preview */}
                    <div
                      style={{
                        position: 'absolute',
                        left: `${currentBox.overlayX}%`,
                        top: `${currentBox.overlayY}%`,
                        transform: `translate(-50%, -50%) rotate(${
                          currentBox.overlayRotation || 0
                        }deg)`,
                        width: `${currentBox.overlayScale}%`,
                        opacity: currentBox.overlayOpacityAdmin ?? 0.95,
                      }}
                      className="border-2 border-dashed border-[#10B981] rounded-lg p-0.5"
                    >
                      <img
                        src={currentBox.overlayPngUrl}
                        alt="Lapisan PNG"
                        className="w-full h-auto object-contain"
                      />
                    </div>
                  </div>

                  {/* Sliders & Coordinate Controls */}
                  <div className="space-y-4">
                    {/* X Coordinate */}
                    <div className="bg-[#FEF3C7]/60 p-3 rounded-xl border border-[#FDE68A]">
                      <div className="flex justify-between text-xs font-black text-[#78350F] mb-1">
                        <span>Kedudukan X (Mendatar):</span>
                        <span className="text-[#B45309]">{currentBox.overlayX}%</span>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={95}
                        value={currentBox.overlayX}
                        onChange={(e) =>
                          updateBox(currentBox.id, { overlayX: Number(e.target.value) })
                        }
                        className="w-full accent-[#F59E0B]"
                      />
                    </div>

                    {/* Y Coordinate */}
                    <div className="bg-[#FEF3C7]/60 p-3 rounded-xl border border-[#FDE68A]">
                      <div className="flex justify-between text-xs font-black text-[#78350F] mb-1">
                        <span>Kedudukan Y (Menegak):</span>
                        <span className="text-[#B45309]">{currentBox.overlayY}%</span>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={95}
                        value={currentBox.overlayY}
                        onChange={(e) =>
                          updateBox(currentBox.id, { overlayY: Number(e.target.value) })
                        }
                        className="w-full accent-[#F59E0B]"
                      />
                    </div>

                    {/* Scale */}
                    <div className="bg-[#FEF3C7]/60 p-3 rounded-xl border border-[#FDE68A]">
                      <div className="flex justify-between text-xs font-black text-[#78350F] mb-1">
                        <span>Saiz Lapisan PNG (%):</span>
                        <span className="text-[#B45309]">{currentBox.overlayScale}%</span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={90}
                        value={currentBox.overlayScale}
                        onChange={(e) =>
                          updateBox(currentBox.id, { overlayScale: Number(e.target.value) })
                        }
                        className="w-full accent-[#F59E0B]"
                      />
                    </div>

                    {/* Quick Preset Alignments */}
                    <div className="flex gap-2 text-xs font-bold">
                      <button
                        onClick={() => updateBox(currentBox.id, { overlayX: 50, overlayY: 45 })}
                        className="flex-1 py-1.5 bg-white border border-[#78350F] rounded-lg hover:bg-[#FEF3C7]"
                      >
                        Pusat (Tengah)
                      </button>
                      <button
                        onClick={() => updateBox(currentBox.id, { overlayX: 30, overlayY: 35 })}
                        className="flex-1 py-1.5 bg-white border border-[#78350F] rounded-lg hover:bg-[#FEF3C7]"
                      >
                        Kiri Atas
                      </button>
                      <button
                        onClick={() => updateBox(currentBox.id, { overlayX: 70, overlayY: 35 })}
                        className="flex-1 py-1.5 bg-white border border-[#78350F] rounded-lg hover:bg-[#FEF3C7]"
                      >
                        Kanan Atas
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: TOGGLES, EFFECTS & SOUNDS */}
            {adminTab === 'toggles' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-4 bg-[#FEF3C7]/40 p-4 rounded-2xl border-2 border-[#FDE68A]">
                  <h3 className="font-black text-[#78350F] text-sm uppercase">
                    Kesan Fade Out & Animasi
                  </h3>

                  {/* Fade Out Duration */}
                  <div>
                    <div className="flex justify-between text-xs font-black text-[#78350F] mb-1">
                      <span>Tempoh Animasi Fade Out:</span>
                      <span className="text-[#B45309]">{settings.fadeDurationSeconds} saat</span>
                    </div>
                    <input
                      type="range"
                      min={0.5}
                      max={4.0}
                      step={0.1}
                      value={settings.fadeDurationSeconds}
                      onChange={(e) =>
                        updateSettings({ fadeDurationSeconds: Number(e.target.value) })
                      }
                      className="w-full accent-[#F59E0B]"
                    />
                  </div>

                  {/* Confetti on Click */}
                  <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-[#FDE68A] cursor-pointer">
                    <span className="text-xs font-black text-[#78350F]">
                      Pancar Confetti Bila Gambar Ditekan
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.enableConfettiOnClick}
                      onChange={(e) => updateSettings({ enableConfettiOnClick: e.target.checked })}
                      className="w-4 h-4 accent-[#F59E0B]"
                    />
                  </label>
                </div>

                <div className="space-y-4 bg-[#FEF3C7]/40 p-4 rounded-2xl border-2 border-[#FDE68A]">
                  <h3 className="font-black text-[#78350F] text-sm uppercase">
                    Kesan Bunyi (Sound Effects Sahaja)
                  </h3>

                  {/* Master Sound Toggle */}
                  <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-[#FDE68A] cursor-pointer">
                    <span className="text-xs font-black text-[#78350F]">Kesan Bunyi Aktif (Sound Effects)</span>
                    <input
                      type="checkbox"
                      checked={settings.soundEnabled}
                      onChange={(e) => updateSettings({ soundEnabled: e.target.checked })}
                      className="w-4 h-4 accent-[#F59E0B]"
                    />
                  </label>

                  {/* Bee Buzz Toggle */}
                  <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-[#FDE68A] cursor-pointer">
                    <span className="text-xs font-black text-[#78350F]">
                      Kesan Bunyi Dengungan Lebah (Bee Buzz)
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.beeBuzzEnabled}
                      onChange={(e) => updateSettings({ beeBuzzEnabled: e.target.checked })}
                      className="w-4 h-4 accent-[#F59E0B]"
                    />
                  </label>

                  {/* Pop Sound Toggle */}
                  <label className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-[#FDE68A] cursor-pointer">
                    <span className="text-xs font-black text-[#78350F]">
                      Kesan Bunyi 'Pop' Klik
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.popSoundEnabled}
                      onChange={(e) => updateSettings({ popSoundEnabled: e.target.checked })}
                      className="w-4 h-4 accent-[#F59E0B]"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* TAB 4: DATA EXPORT / IMPORT */}
            {adminTab === 'data' && (
              <div className="space-y-5">
                <div className="flex gap-3">
                  <button
                    onClick={handleExport}
                    className="flex-1 py-3 bg-[#F59E0B] hover:bg-[#D97706] text-[#78350F] font-black rounded-xl border-2 border-[#78350F] text-xs shadow-[2px_2px_0px_#78350F] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Salin Data Tetapan (JSON) ke Clipboard</span>
                  </button>

                  <button
                    onClick={resetSettings}
                    className="py-3 px-4 bg-[#EF4444] hover:bg-[#DC2626] text-white font-black rounded-xl border-2 border-[#78350F] text-xs shadow-[2px_2px_0px_#78350F] flex items-center gap-1.5 cursor-pointer"
                    title="Set Semula Semua Tetapan Lalai"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Set Semula</span>
                  </button>
                </div>

                {showCopyAlert && (
                  <div className="p-3 bg-[#10B981] text-white rounded-xl text-xs font-black flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    <span>Data konfigurasi telah berjaya disalin ke papan keratan!</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-black text-[#78350F] mb-1">
                    Tampal JSON untuk Import:
                  </label>
                  <textarea
                    rows={4}
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder="Tampal format JSON konfigurasi di sini..."
                    className="w-full p-2.5 bg-white border-2 border-[#78350F] rounded-xl text-xs font-mono text-[#78350F] focus:outline-none focus:ring-2 focus:ring-[#F59E0B]"
                  />
                  <div className="mt-2 flex justify-between items-center">
                    <button
                      onClick={handleImport}
                      className="py-2 px-5 bg-[#10B981] hover:bg-[#059669] text-white font-black rounded-xl border-2 border-[#78350F] text-xs shadow-[2px_2px_0px_#78350F] flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Muat Naik JSON</span>
                    </button>
                    {importStatus && (
                      <span className="text-xs font-bold text-[#78350F]">{importStatus}</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-[#FEF3C7] border-t-2 border-[#78350F] px-6 py-3 flex items-center justify-between">
            <span className="text-xs font-black text-[#78350F]">Kesihatan Diri • Bahagian C</span>
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-[#78350F] font-black rounded-xl border-2 border-[#78350F] text-xs shadow-[2px_2px_0px_#78350F] cursor-pointer"
            >
              Simpan & Tutup [G]
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
