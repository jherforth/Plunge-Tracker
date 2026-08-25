import { useState, useEffect, useRef } from 'react';
import { Play, Square, Volume2, VolumeX, Plus, Minus, Snowflake, HelpCircle, X } from 'lucide-react';
import { cn, formatTime, retroButton, retroCard, retroBorder } from '../lib/utils';
import { playTrack, stopTrack, playChime } from '../lib/audio';
import { db } from '../lib/db';
import { useSettings, LEAD_IN_SECONDS } from '../lib/settings';

/** Marks the moment the plunge itself starts, and the moment the goal is reached. */
const playMilestoneChime = () => playChime(1046.5, 'sine', 1.5);
/** Short per-second tick, used for the lead-in and the final ten seconds. */
const playTickChime = () => playChime(880, 'sine', 0.1);

type Phase = 'idle' | 'leadin' | 'running';

export default function TimerTab() {
  const { tempUnit, selectedTrack, leadInEnabled } = useSettings();
  const [targetTime, setTargetTime] = useState(180);
  const [waterTemperature, setWaterTemperature] = useState(tempUnit === 'F' ? 50 : 10);
  const [phase, setPhase] = useState<Phase>('idle');
  const [leadInRemaining, setLeadInRemaining] = useState(LEAD_IN_SECONDS);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showTips, setShowTips] = useState(false);

  const startTimeRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const lastChimeSecondRef = useRef<number | null>(null);

  // Read through a ref inside the animation loops, so muting mid-session does
  // not restart the effect and reset the clock.
  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const isActive = phase !== 'idle';
  const targetSeconds = targetTime;
  const progress = Math.min(elapsedSeconds / targetSeconds, 1);
  const remaining = Math.max(targetSeconds - elapsedSeconds, 0);

  // Background music belongs to the plunge itself; during the lead-in it would
  // only muddy the per-second ticks.
  useEffect(() => {
    if (phase === 'running' && soundEnabled) {
      playTrack(selectedTrack);
    } else {
      stopTrack();
    }
    return () => {
      stopTrack();
    };
  }, [phase, soundEnabled, selectedTrack]);

  // Lead-in: count down from LEAD_IN_SECONDS so there is time to get in the
  // water, ticking once a second, then hand over to the plunge timer.
  useEffect(() => {
    if (phase !== 'leadin') return;

    const startedAt = Date.now();
    let raf = 0;
    let lastTick: number | null = null;

    const step = () => {
      const remainingFloat = Math.max(LEAD_IN_SECONDS - (Date.now() - startedAt) / 1000, 0);
      setLeadInRemaining(remainingFloat);

      const shown = Math.ceil(remainingFloat);
      if (soundEnabledRef.current && shown > 0 && lastTick !== shown) {
        playTickChime();
        lastTick = shown;
      }

      if (remainingFloat > 0) {
        raf = requestAnimationFrame(step);
      } else {
        beginPlunge();
      }
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // beginPlunge only touches setState and refs, so it is stable enough here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (phase !== 'running') {
      startTimeRef.current = null;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      return;
    }

    if (!startTimeRef.current) {
      startTimeRef.current = Date.now();
    }

    const updateTimer = () => {
      if (!startTimeRef.current) return;

      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setElapsedSeconds(elapsed);

      const displayedRemaining = Math.floor(Math.max(targetSeconds - elapsed, 0));

      if (soundEnabledRef.current && lastChimeSecondRef.current !== displayedRemaining) {
        if (displayedRemaining === 30) {
          playChime(660, 'sine', 0.8);
        } else if (displayedRemaining <= 10 && displayedRemaining > 0) {
          playTickChime();
        } else if (displayedRemaining === 0 && lastChimeSecondRef.current !== null) {
          playMilestoneChime();
        }
        lastChimeSecondRef.current = displayedRemaining;
      }

      frameRef.current = requestAnimationFrame(updateTimer);
    };

    frameRef.current = requestAnimationFrame(updateTimer);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [phase, targetSeconds]);

  const beginPlunge = () => {
    // The same chime that marks the goal also marks the plunge starting.
    if (soundEnabledRef.current) playMilestoneChime();
    lastChimeSecondRef.current = null;
    startTimeRef.current = null;
    setElapsedSeconds(0);
    setPhase('running');
  };

  const handleStart = () => {
    if (leadInEnabled) {
      setLeadInRemaining(LEAD_IN_SECONDS);
      setPhase('leadin');
    } else {
      beginPlunge();
    }
  };

  const handleStop = async () => {
    const wasRunning = phase === 'running';
    setPhase('idle');

    // Only a real plunge is worth recording. Aborting during the lead-in leaves
    // elapsedSeconds at 0, so no session is written.
    if (wasRunning && elapsedSeconds > 10) {
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
    if (!isActive) {
      setTargetTime(prev => Math.max(15, prev + delta * 15));
    }
  };

  const adjustTemp = (delta: number) => {
    if (!isActive) {
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
          {phase === 'leadin' ? Math.ceil(leadInRemaining) : formatTime(remaining)}
        </div>

        <div className={cn("w-full h-8 bg-sky-200 dark:bg-sky-950 p-1 mb-6 shadow-inner", retroBorder)}>
           <div
             className={cn("h-full", phase === 'leadin' ? "bg-amber-400 dark:bg-amber-300" : "bg-sky-400 dark:bg-sky-300")}
             style={{ width: `${(phase === 'leadin' ? 1 - leadInRemaining / LEAD_IN_SECONDS : progress) * 100}%` }}
           />
        </div>

        <span className="text-sm text-sky-700 dark:text-sky-300">
          {phase === 'leadin'
            ? 'GET IN THE WATER'
            : elapsedSeconds >= targetSeconds ? 'GOAL REACHED' : 'REMAINING'}
        </span>

        {phase !== 'leadin' && elapsedSeconds > 0 && (
          <span className="text-sky-600 dark:text-sky-200 text-sm mt-4">
            TOTAL: {formatTime(elapsedSeconds)}
          </span>
        )}
      </div>

      <div className="flex flex-col items-center space-y-6 w-full max-w-sm">
        {!isActive && (
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
          
          {!isActive ? (
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
