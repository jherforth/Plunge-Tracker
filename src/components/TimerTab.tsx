import { useState, useEffect, useRef } from 'react';
import { Play, Square, Volume2, VolumeX, Plus, Minus, Snowflake, HelpCircle, X } from 'lucide-react';
import { cn, formatTime, retroButton, retroCard, retroBorder } from '../lib/utils';
import { playTrack, stopTrack, playChime } from '../lib/audio';
import { db } from '../lib/db';
import { useSettings } from '../lib/settings';

export default function TimerTab() {
  const { tempUnit, selectedTrack } = useSettings();
  const [targetTime, setTargetTime] = useState(180);
  const [waterTemperature, setWaterTemperature] = useState(tempUnit === 'F' ? 50 : 10);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showTips, setShowTips] = useState(false);
  
  const startTimeRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastChimeSecondRef = useRef<number | null>(null);

  const targetSeconds = targetTime;
  const progress = Math.min(elapsedSeconds / targetSeconds, 1);
  const remaining = Math.max(targetSeconds - elapsedSeconds, 0);

  useEffect(() => {
    if (isRunning && soundEnabled) {
      playTrack(selectedTrack);
    } else {
      stopTrack();
    }
    return () => {
      stopTrack();
    };
  }, [isRunning, soundEnabled, selectedTrack]);

  useEffect(() => {
    if (isRunning) {
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now() - elapsedSeconds * 1000;
      }
      
      const updateTimer = () => {
        if (startTimeRef.current) {
          const now = Date.now();
          const elapsed = (now - startTimeRef.current) / 1000;
          setElapsedSeconds(elapsed);
          
          const remainingFloat = Math.max(targetSeconds - elapsed, 0);
          const displayedRemaining = Math.floor(remainingFloat);
          
          if (soundEnabled && lastChimeSecondRef.current !== displayedRemaining) {
            if (displayedRemaining === 30) {
              playChime(660, 'sine', 0.8);
            } else if (displayedRemaining <= 10 && displayedRemaining > 0) {
              playChime(880, 'sine', 0.1);
            } else if (displayedRemaining === 0 && lastChimeSecondRef.current !== null) {
              playChime(1046.5, 'sine', 1.5);
            }
            lastChimeSecondRef.current = displayedRemaining;
          }
          
          if (elapsed < targetSeconds) {
            frameRef.current = requestAnimationFrame(updateTimer);
          } else {
            frameRef.current = requestAnimationFrame(updateTimer);
          }
        }
      };
      
      frameRef.current = requestAnimationFrame(updateTimer);
    } else {
      startTimeRef.current = null;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    }

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [isRunning, targetSeconds, elapsedSeconds]);

  const handleStart = () => {
    setIsRunning(true);
    lastChimeSecondRef.current = null;
  };

  const handleStop = async () => {
    setIsRunning(false);
    
    // Save session
    if (elapsedSeconds > 10) { 
      try {
        await db.sessions.add({
          timestamp: Date.now(),
          durationSeconds: Math.floor(elapsedSeconds),
          targetDurationSeconds: targetSeconds,
          waterTemperature: waterTemperature,
          temperatureUnit: tempUnit,
        });
      } catch (err) {
        console.error("Failed to save session", err);
      }
    }
    
    setElapsedSeconds(0);
    startTimeRef.current = null;
  };

  const adjustTime = (delta: number) => {
    if (!isRunning) {
      setTargetTime(prev => Math.max(15, prev + delta * 15));
    }
  };

  const adjustTemp = (delta: number) => {
    if (!isRunning) {
      if (tempUnit === 'F') {
        setWaterTemperature(prev => Math.max(32, Math.min(100, prev + delta)));
      } else {
        setWaterTemperature(prev => Math.max(0, Math.min(35, prev + delta)));
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8 pb-16 px-6 relative z-10">
      
      <div className="text-2xl font-bold tracking-widest text-sky-800 dark:text-sky-200 drop-shadow-sm mb-4">
        PLUNGE TRACKER
      </div>
      
      <div className={cn("w-full max-w-sm flex flex-col items-center justify-center p-8", retroCard)}>
        <div className="text-6xl tabular-nums mb-6 drop-shadow-md">
          {formatTime(remaining)}
        </div>
        
        <div className={cn("w-full h-8 bg-sky-200 dark:bg-sky-950 p-1 mb-6 shadow-inner", retroBorder)}>
           <div className="h-full bg-sky-400 dark:bg-sky-300" style={{ width: `${progress * 100}%` }} />
        </div>

        <span className="text-sm text-sky-700 dark:text-sky-300">
          {elapsedSeconds >= targetSeconds ? 'GOAL REACHED' : 'REMAINING'}
        </span>
        
        {elapsedSeconds > 0 && (
          <span className="text-sky-600 dark:text-sky-200 text-sm mt-4">
            TOTAL: {formatTime(elapsedSeconds)}
          </span>
        )}
      </div>

      <div className="flex flex-col items-center space-y-6 w-full max-w-sm">
        {!isRunning && (
          <div className="flex flex-col space-y-4 w-full">
            <div className={cn("flex items-center justify-between p-3", retroCard)}>
               <div className="flex items-center space-x-2">
                 <button onClick={() => adjustTime(-1)} className={cn("p-2", retroButton)}> <Minus size={20}/> </button>
                 <div className="text-lg text-center tabular-nums w-20">{formatTime(targetTime)}</div>
                 <button onClick={() => adjustTime(1)} className={cn("p-2", retroButton)}> <Plus size={20}/> </button>
               </div>
               <span className="text-sm pr-2">TIME</span>
            </div>

            <div className={cn("flex items-center justify-between p-3", retroCard)}>
               <div className="flex items-center space-x-2">
                 <button onClick={() => adjustTemp(-1)} className={cn("p-2", retroButton)}> <Minus size={20}/> </button>
                 <div className="text-lg text-center tabular-nums w-20 flex items-center justify-center">
                   <Snowflake size={16} className="mr-1 text-sky-500" />
                   {waterTemperature}°{tempUnit}
                 </div>
                 <button onClick={() => adjustTemp(1)} className={cn("p-2", retroButton)}> <Plus size={20}/> </button>
               </div>
               <span className="text-sm pr-2">TEMP</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center space-x-4 w-full">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={cn("p-4", retroButton, soundEnabled ? "text-sky-600 dark:text-sky-300" : "text-sky-800/40 dark:text-sky-100/40")}
          >
            {soundEnabled ? <Volume2 size={28} /> : <VolumeX size={28} />}
          </button>
          
          {!isRunning ? (
            <button
              onClick={handleStart}
              className={cn("flex-1 py-4 bg-sky-300 dark:bg-sky-500 text-sky-950 flex items-center justify-center text-lg", retroButton)}
            >
              <Play size={24} className="mr-2" fill="currentColor" /> START
            </button>
          ) : (
            <button
              onClick={handleStop}
              className={cn("flex-1 py-4 bg-rose-400 text-rose-950 flex items-center justify-center text-lg", retroButton)}
            >
              <Square size={24} className="mr-2" fill="currentColor" /> STOP
            </button>
          )}

          <button
            onClick={() => setShowTips(true)}
            className={cn("p-4 text-sky-600 dark:text-sky-300", retroButton)}
          >
            <HelpCircle size={28} />
          </button>
        </div>
      </div>

      {showTips && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={cn("w-full max-w-sm flex flex-col p-6 bg-slate-100 dark:bg-slate-900 relative", retroCard)}>
            <button 
              onClick={() => setShowTips(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              <X size={24} />
            </button>
            <h2 className="text-xl mb-4 font-bold text-sky-800 dark:text-sky-300">PLUNGE TIPS</h2>
            <ul className="space-y-4 text-sm text-slate-700 dark:text-slate-300 list-decimal list-inside">
              <li>Start slow and work up to colder temps</li>
              <li>Don't ease in, commit and fully submerge</li>
              <li>Control your breathing and stay calm</li>
              <li>Listen to your body, don't wait for the clock if you're too cold</li>
              <li>Warm up slowly</li>
              <li>Always plunge with supervision</li>
              <li>Build a routine and keep plunging</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
