import { AppSettings, HealthCardBox } from '../types';

export const DEFAULT_OVERLAY_PNG = 'https://i.postimg.cc/28tZQKWB/image.png';

export const DEFAULT_HEALTH_BOXES: HealthCardBox[] = [
  {
    id: 'box-1',
    boxNumber: 1,
    title: 'MEMBANTU IBU BAPA',
    imageUrl: 'https://i.postimg.cc/ZnKdHkj2/image.png',
    altText: 'Membantu Ibu Bapa - Menghargai Jasa',
    overlayPngUrl: 'https://i.postimg.cc/28tZQKWB/image.png',
    overlayX: 50,
    overlayY: 45,
    overlayScale: 35,
    overlayRotation: 0,
    overlayOpacityAdmin: 0.95,
    textBox1: 'membantu ibu bapa melakukan kerja rumah',
    textBox2: 'supaya dapat meringankan beban mereka',
    showTextBoxesInUserMode: false,
  },
  {
    id: 'box-2',
    boxNumber: 2,
    title: 'BELAJAR BERSUNGGUH-SUNGGUH',
    imageUrl: 'https://i.postimg.cc/MG7f8ZLS/image.png',
    altText: 'Belajar Bersungguh-sungguh - Menghargai Jasa',
    overlayPngUrl: 'https://i.postimg.cc/kXL26tr0/image.png',
    overlayX: 50,
    overlayY: 45,
    overlayScale: 35,
    overlayRotation: 0,
    overlayOpacityAdmin: 0.95,
    textBox1: 'belajar dengan tekun',
    textBox2: 'supaya dapat menggembirakan hari ibu bapa',
    showTextBoxesInUserMode: false,
  },
  {
    id: 'box-3',
    boxNumber: 3,
    title: 'MENUNJUKKAN KASIH SAYANG',
    imageUrl: 'https://i.postimg.cc/XqmYCtP2/image.png',
    altText: 'Menunjukkan Kasih Sayang - Menghargai Jasa',
    overlayPngUrl: 'https://i.postimg.cc/TP029KsS/image.png',
    overlayX: 50,
    overlayY: 45,
    overlayScale: 35,
    overlayRotation: 0,
    overlayOpacityAdmin: 0.95,
    textBox1: 'memberikan kad ucapan sempena hari istimewa',
    textBox2: 'supaya mereka berasa dihargai',
    showTextBoxesInUserMode: false,
  },
];

export const DEFAULT_SETTINGS: AppSettings = {
  appName: 'Menghargai Jasa Ibu Bapa',
  appSubtitle:
    'Modul pembelajaran interaktif Bahasa Melayu: Amalan murni cara-cara menghargai jasa dan pengorbanan ibu bapa.',
  moduleBadge: 'Bahagian C',
  subModuleBadge: 'Bahasa Melayu',
  showMascot: true,
  mascotGreeting: 'Mari Menghargai Jasa Ibu Bapa! ✨',
  mascotSpeech: 'Klik gambar untuk melihat kesan interaktif!',
  showGuide: true,
  guideStep1: 'Lihat 3 gambar amalan menghargai jasa ibu bapa yang disusun rapi secara melintang.',
  guideStep2: 'Tekan / klik setiap gambar untuk mendedahkan animasi.',
  guideStep3: 'Tekan kekunci "G" atau butang Admin untuk menyelaraskan lapisan gambar PNG dan teks.',

  boxes: DEFAULT_HEALTH_BOXES,

  fadeEffect: 'fade-out',
  fadeDurationSeconds: 1.5,
  enableConfettiOnClick: true,

  soundEnabled: true,
  beeBuzzEnabled: true,
  popSoundEnabled: true,
  chimeSoundEnabled: true,
  fanfareSoundEnabled: true,

  themeColor: 'amber',
  showHoneycombGrid: true,
  showFloatingHexagons: true,

  questionPrompt:
    'Berdasarkan grafik, tuliskan pendapat kamu tentang dua cara menghargai jasa ibu bapa. Jawapan kamu hendaklah ditulis dalam satu perenggan. Panjangnya jawapan kamu hendaklah tidak lebih daripada 50 patah perkataan.',
  tajukKeyword: 'menghargai jasa ibu bapa',
  kesanKeyword: 'agar hidup bahagia',
  kesanDistractors: [
    'supaya persekitaran sekolah sentiasa ceria dan bersih sepanjang masa',
    'mengeratkan hubungan kejiranan yang erat sesama komuniti setempat',
  ],
};

export const SETTINGS_STORAGE_KEY = 'edu_bee_menghargai_jasa_ibu_bapa_v3';

export function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      let loadedBoxes: HealthCardBox[] = DEFAULT_HEALTH_BOXES;
      if (Array.isArray(parsed.boxes) && parsed.boxes.length === 3) {
        loadedBoxes = parsed.boxes.map((b: HealthCardBox, idx: number) => ({
          ...DEFAULT_HEALTH_BOXES[idx],
          ...b,
        }));
      }

      const loadedSettings = {
        ...DEFAULT_SETTINGS,
        ...parsed,
        boxes: loadedBoxes,
      };

      if (loadedSettings.kesanKeyword?.includes('kesihatan')) {
        loadedSettings.kesanKeyword = loadedSettings.kesanKeyword.replace(/kesihatan/gi, 'kebersihan');
      }
      if (loadedSettings.appName === 'Kesihatan Diri') {
        loadedSettings.appName = 'Kebersihan Diri';
      }

      return loadedSettings;
    }
  } catch (err) {
    console.error('Error loading settings from localStorage', err);
  }
  return DEFAULT_SETTINGS;
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving settings to localStorage', err);
  }
}

