/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Timer, List, Settings, AlertTriangle } from 'lucide-react';
import { cn, retroCard, retroButton } from './lib/utils';
import TimerTab from './components/TimerTab';
import HistoryTab from './components/HistoryTab';
import SettingsTab from './components/SettingsTab';

type Tab = 'timer' | 'history' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('timer');
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(() => {
    return localStorage.getItem('plungeDisclaimer') === 'true';
  });

  const acceptDisclaimer = () => {
    localStorage.setItem('plungeDisclaimer', 'true');
    setDisclaimerAccepted(true);
  };

  if (!disclaimerAccepted) {
    return (
      <div className="flex flex-col h-screen bg-[#e0f2fe] dark:bg-[#082f49] text-sky-950 dark:text-sky-50 items-center justify-center p-6 text-center transition-none relative">
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(14,165,233,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.1)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(186,230,253,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(186,230,253,0.05)_1px,transparent_1px)] bg-[size:16px_16px] z-0"></div>
        <div className={cn("bg-sky-50 dark:bg-sky-900 p-6 max-w-sm flex flex-col items-center relative z-10", retroCard)}>
           <div className="mb-6 animate-pulse text-rose-500">
             <AlertTriangle size={48} />
           </div>
           <h1 className="text-sm leading-loose mb-4">HEALTH WARNING</h1>
           <p className="text-[8px] leading-loose mb-8 text-slate-700 dark:text-slate-300">
             Cold water immersion can cause cold water shock, hypothermia, and other serious health risks. Consult a physician before starting a cold plunge routine. The developers assume no liability for any injuries, health issues, or other risks associated with cold plunge use.
           </p>
           <button 
             onClick={acceptDisclaimer}
             className={cn("w-full py-4 bg-sky-400 dark:bg-sky-500 text-sky-950 text-[10px]", retroButton)}
           >
             I ACCEPT
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#e0f2fe] dark:bg-[#082f49] text-sky-950 dark:text-sky-50 overflow-hidden selection:bg-sky-500/50 transition-none relative">
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(14,165,233,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.1)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(186,230,253,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(186,230,253,0.05)_1px,transparent_1px)] bg-[size:16px_16px] z-0"></div>
      
      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden z-10">
        {activeTab === 'timer' && <TimerTab />}
        {activeTab === 'history' && <HistoryTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </main>

      {/* Bottom Navigation */}
      <nav className="shrink-0 bg-sky-100 dark:bg-sky-950 border-t-[2px] border-sky-950 dark:border-sky-200 pb-safe z-50">
        <div className="flex items-center justify-around px-2 py-3">
          
          <button 
            onClick={() => setActiveTab('history')}
            className={cn(
              "flex flex-col items-center justify-center w-20 p-2",
              activeTab === 'history' ? "text-sky-600 dark:text-sky-300 drop-shadow-md" : "text-sky-800/60 dark:text-sky-200/40"
            )}
          >
            <div className="mb-2">
              <List size={24} />
            </div>
            <span className="text-[8px] uppercase">Logs</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('timer')}
            className={cn(
              "flex flex-col items-center justify-center w-20 p-2",
              activeTab === 'timer' ? "text-sky-600 dark:text-sky-300 drop-shadow-md" : "text-sky-800/60 dark:text-sky-200/40"
            )}
          >
            <div className="mb-2">
              <Timer size={24} />
            </div>
            <span className="text-[8px] uppercase">Timer</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('settings')}
            className={cn(
              "flex flex-col items-center justify-center w-20 p-2",
              activeTab === 'settings' ? "text-sky-600 dark:text-sky-300 drop-shadow-md" : "text-sky-800/60 dark:text-sky-200/40"
            )}
          >
            <div className="mb-2">
              <Settings size={24} />
            </div>
            <span className="text-[8px] uppercase">Cfg</span>
          </button>

        </div>
      </nav>
      
    </div>
  );
}
