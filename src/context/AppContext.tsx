import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppSettings, HealthCardBox, ScreenState } from '../types';
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from '../utils/defaultSettings';
import { sound } from '../utils/audio';

interface AppContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  updateBox: (boxId: string, updated: Partial<HealthCardBox>) => void;
  resetSettings: () => void;
  importSettingsJSON: (jsonStr: string) => boolean;
  exportSettingsJSON: () => string;

  // Navigation state
  currentScreen: ScreenState;
  setCurrentScreen: (screen: ScreenState) => void;
  isAdminOpen: boolean;
  setIsAdminOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  adminTab: 'boxes' | 'alignment' | 'toggles' | 'info' | 'data';
  setAdminTab: (tab: 'boxes' | 'alignment' | 'toggles' | 'info' | 'data') => void;
  
  // Interactive Alignment Mode on screen
  isAlignMode: boolean;
  setIsAlignMode: (align: boolean | ((prev: boolean) => boolean)) => void;
  activeAlignBoxId: string | null;
  setActiveAlignBoxId: (boxId: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettingsState] = useState<AppSettings>(loadSettings);
  const [currentScreen, setCurrentScreen] = useState<ScreenState>('health-boxes');
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isAlignMode, setIsAlignMode] = useState<boolean>(false);
  const [activeAlignBoxId, setActiveAlignBoxId] = useState<string | null>('box-1');
  const [adminTab, setAdminTab] = useState<'boxes' | 'alignment' | 'toggles' | 'info' | 'data'>('boxes');

  // Sync sound settings to audio singleton whenever settings change
  useEffect(() => {
    sound.syncWithSettings(settings);
  }, [settings]);

  // Save to localStorage whenever settings state changes
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Keyboard shortcut: Press 'G' or 'g' to toggle Admin Dashboard or Alignment mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing inside an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === 'g' || e.key === 'G') {
        setIsAdminOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const updateSettings = useCallback((newPartial: Partial<AppSettings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...newPartial };
      return next;
    });
  }, []);

  const updateBox = useCallback((boxId: string, updated: Partial<HealthCardBox>) => {
    setSettingsState((prev) => ({
      ...prev,
      boxes: prev.boxes.map((b) => (b.id === boxId ? { ...b, ...updated } : b)),
    }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettingsState(DEFAULT_SETTINGS);
    sound.playPop();
  }, []);

  const importSettingsJSON = useCallback((jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && typeof parsed === 'object') {
        setSettingsState((prev) => ({
          ...prev,
          ...parsed,
        }));
        sound.playChime();
        return true;
      }
    } catch (err) {
      console.error('Failed to import JSON', err);
    }
    sound.playWrong();
    return false;
  }, []);

  const exportSettingsJSON = useCallback((): string => {
    return JSON.stringify(settings, null, 2);
  }, [settings]);

  const value = {
    settings,
    updateSettings,
    updateBox,
    resetSettings,
    importSettingsJSON,
    exportSettingsJSON,
    currentScreen,
    setCurrentScreen,
    isAdminOpen,
    setIsAdminOpen,
    adminTab,
    setAdminTab,
    isAlignMode,
    setIsAlignMode,
    activeAlignBoxId,
    setActiveAlignBoxId,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

