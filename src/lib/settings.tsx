import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type Theme = 'light' | 'dark';
export type TempUnit = 'C' | 'F';
export type TrackId = 'none' | 'ice-cave' | 'blizzard' | 'crystal';

interface SettingsContextType {
  theme: Theme;
  setTheme: (t: Theme) => void;
  tempUnit: TempUnit;
  setTempUnit: (u: TempUnit) => void;
  selectedTrack: TrackId;
  setSelectedTrack: (t: TrackId) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('plungeTheme');
    return (stored as Theme) || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });
  
  const [tempUnit, setTempUnit] = useState<TempUnit>(() => {
    return (localStorage.getItem('plungeTempUnit') as TempUnit) || 'C';
  });

  const [selectedTrack, setSelectedTrack] = useState<TrackId>(() => {
    return (localStorage.getItem('plungeTrack') as TrackId) || 'ice-cave';
  });

  useEffect(() => {
    localStorage.setItem('plungeTheme', theme);

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#020617');
    } else {
      document.documentElement.classList.remove('dark');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#FFFFFF');
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('plungeTempUnit', tempUnit);
  }, [tempUnit]);

  useEffect(() => {
    localStorage.setItem('plungeTrack', selectedTrack);
  }, [selectedTrack]);

  return (
    <SettingsContext.Provider value={{ theme, setTheme, tempUnit, setTempUnit, selectedTrack, setSelectedTrack }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
