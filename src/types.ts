export interface HealthCardBox {
  id: string;
  boxNumber: number; // 1, 2, 3
  title: string;
  imageUrl: string; // Base Main image
  altText: string;
  overlayPngUrl: string; // Transparent PNG aligned on top of main image
  overlayX: number; // Percentage 0-100 (Center X)
  overlayY: number; // Percentage 0-100 (Center Y)
  overlayScale: number; // Percentage 10-100 (Width %)
  overlayRotation: number; // Degrees -180 to 180 (optional tilt)
  overlayOpacityAdmin: number; // Opacity when editing in admin mode (default 0.9 - 1.0)
  
  // 2 text boxes for each picture in the setting box (for future uses, invisible in user mode in main screen)
  textBox1: string;
  textBox2: string;
  showTextBoxesInUserMode?: boolean; // Default false (invisible in user mode)
}

export interface AppSettings {
  // App Info & Badges
  appName: string;
  appSubtitle: string;
  moduleBadge: string;
  subModuleBadge: string;
  showMascot: boolean;
  mascotGreeting: string;
  mascotSpeech: string;
  showGuide: boolean;
  guideStep1: string;
  guideStep2: string;
  guideStep3: string;

  // The 3 horizontal boxes for Bahagian C: Kesihatan Diri
  boxes: HealthCardBox[];

  // Interactive PNG Overlay Settings
  fadeEffect: 'fade-out' | 'pulse-fade' | 'sparkle-fade';
  fadeDurationSeconds: number; // e.g. 1.5s
  enableConfettiOnClick: boolean;

  // Sound Effects Only Toggles (No spoken TTS audio)
  soundEnabled: boolean;
  beeBuzzEnabled: boolean;
  popSoundEnabled: boolean;
  chimeSoundEnabled: boolean;
  fanfareSoundEnabled: boolean;

  // Theme & Visual
  themeColor: 'amber' | 'emerald' | 'blue' | 'purple' | 'orange';
  showHoneycombGrid: boolean;
  showFloatingHexagons: boolean;

  // Bahagian C Question & Sentence Construction
  questionPrompt?: string;
  tajukKeyword?: string;
  kesanKeyword?: string;
  kesanDistractors?: string[];
}

export type ScreenState = 'home' | 'health-boxes';


