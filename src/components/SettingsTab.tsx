import { useState } from 'react';
import { Download, FileJson, FileSpreadsheet, ShieldAlert, Moon, Sun, Thermometer, Music, AlertTriangle } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { db } from '../lib/db';
import { useSettings } from '../lib/settings';
import { cn, retroCard, retroButton } from '../lib/utils';

type ExportStatus = { kind: 'idle' } | { kind: 'working' } | { kind: 'done' } | { kind: 'error'; message: string };

export default function SettingsTab() {
  const { theme, setTheme, tempUnit, setTempUnit, selectedTrack, setSelectedTrack } = useSettings();
  const [exportStatus, setExportStatus] = useState<ExportStatus>({ kind: 'idle' });

  const buildExport = async (format: 'json' | 'csv') => {
    const data = await db.sessions.toArray();

    if (format === 'json') {
      return { contents: JSON.stringify(data, null, 2), mimeType: 'application/json' };
    }

    const csv = ['id,timestamp,durationSeconds,targetDurationSeconds,waterTemperature'];
    data.forEach(s => {
      csv.push(`${s.id},${s.timestamp},${s.durationSeconds},${s.targetDurationSeconds},${s.waterTemperature ?? ''}`);
    });
    return { contents: csv.join('\n'), mimeType: 'text/csv' };
  };

  const exportData = async (format: 'json' | 'csv') => {
    setExportStatus({ kind: 'working' });
    try {
      const { contents, mimeType } = await buildExport(format);
      const fileName = `plunge-sessions.${format}`;

      if (Capacitor.isNativePlatform()) {
        // Android's WebView ignores the <a download> attribute and swallows
        // navigation to blob: URLs, so the browser download idiom below fails
        // silently here. Write a real file instead and hand it to the system
        // share sheet, which lets the user save it or send it anywhere.
        // Directory.Cache needs no storage permission.
        await Filesystem.writeFile({
          path: fileName,
          data: contents,
          directory: Directory.Cache,
          encoding: Encoding.UTF8,
        });

        const { uri } = await Filesystem.getUri({ path: fileName, directory: Directory.Cache });
        await Share.share({ title: fileName, files: [uri] });
      } else {
        const url = URL.createObjectURL(new Blob([contents], { type: mimeType }));
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        // Firefox only honours a click on an anchor that is in the document.
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      setExportStatus({ kind: 'done' });
    } catch (err) {
      // The share sheet reports a plain cancellation as an error; that is not
      // a failure worth showing the user.
      const message = err instanceof Error ? err.message : String(err);
      if (/cancel/i.test(message)) {
        setExportStatus({ kind: 'idle' });
        return;
      }
      console.error('Export failed', err);
      setExportStatus({ kind: 'error', message });
    }
  };

  return (
    <div className="h-full flex flex-col pb-20 overflow-y-auto">
      <div className="px-6 py-8">
        <h1 className="text-xl text-slate-900 dark:text-white mb-2">SETTINGS</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">Manage your app and data.</p>
      </div>

      <div className="px-6 space-y-10">
        <section>
          <h2 className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            PREFERENCES
          </h2>
          <div className="space-y-4">
            <div className={cn("w-full flex flex-col p-4", retroCard)}>
              <div className="flex items-center space-x-3 mb-4">
                <div className="text-sky-500">
                  <Music size={20} />
                </div>
                <div className="text-sm">BGM (PLAYS DURING TIMER)</div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'none', label: '00: NONE' },
                  { id: 'ice-cave', label: '01: ICE CAVERN' },
                  { id: 'blizzard', label: '02: BLIZZARD' },
                  { id: 'crystal', label: '03: CRYSTAL CORE' },
                ].map(track => (
                  <button
                    key={track.id}
                    onClick={() => setSelectedTrack(track.id as any)}
                    className={cn("px-4 py-3 text-sm text-left", retroButton, selectedTrack === track.id ? "bg-sky-400 dark:bg-sky-500 text-sky-950" : "bg-slate-200 dark:bg-slate-800")}
                  >
                    {track.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={cn("w-full flex items-center justify-between p-4 bg-white dark:bg-black", retroCard)}>
              <div className="flex items-center space-x-3">
                <div className="text-sky-500">
                  {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                </div>
                <div className="text-sm">THEME</div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setTheme('light')}
                  className={cn("px-3 py-2 text-sm", retroButton, theme === 'light' ? "bg-sky-400 text-black" : "bg-slate-200 dark:bg-slate-800")}
                >
                  LIGHT
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={cn("px-3 py-2 text-sm", retroButton, theme === 'dark' ? "bg-sky-400 text-black" : "bg-slate-200 dark:bg-slate-800")}
                >
                  DARK
                </button>
              </div>
            </div>

            <div className={cn("w-full flex items-center justify-between p-4 bg-white dark:bg-black", retroCard)}>
              <div className="flex items-center space-x-3">
                <div className="text-sky-500">
                  <Thermometer size={20} />
                </div>
                <div className="text-sm">UNIT</div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setTempUnit('C')}
                  className={cn("px-3 py-2 text-sm", retroButton, tempUnit === 'C' ? "bg-sky-400 text-black" : "bg-slate-200 dark:bg-slate-800")}
                >
                  °C
                </button>
                <button
                  onClick={() => setTempUnit('F')}
                  className={cn("px-3 py-2 text-sm", retroButton, tempUnit === 'F' ? "bg-sky-400 text-black" : "bg-slate-200 dark:bg-slate-800")}
                >
                  °F
                </button>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            DATA EXPORT
          </h2>
          <div className="space-y-4">
            <button 
              onClick={() => exportData('csv')}
              className={cn("w-full flex items-center justify-between p-4 text-left", retroButton)}
            >
              <div className="flex items-center space-x-4">
                <div className="text-sky-500">
                  <FileSpreadsheet size={20} />
                </div>
                <div className="text-sm">EXPORT CSV</div>
              </div>
              <Download size={16} className="text-slate-500" />
            </button>

            <button 
              onClick={() => exportData('json')}
              className={cn("w-full flex items-center justify-between p-4 text-left", retroButton)}
            >
              <div className="flex items-center space-x-4">
                <div className="text-sky-500">
                  <FileJson size={20} />
                </div>
                <div className="text-sm">EXPORT JSON</div>
              </div>
              <Download size={16} className="text-slate-500" />
            </button>

            {exportStatus.kind === 'working' && (
              <p className="text-xs text-slate-500 dark:text-slate-400">EXPORTING...</p>
            )}
            {exportStatus.kind === 'done' && (
              <p className="text-xs text-sky-600 dark:text-sky-400">EXPORT READY.</p>
            )}
            {exportStatus.kind === 'error' && (
              <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">
                EXPORT FAILED: {exportStatus.message.toUpperCase()}
              </p>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            PRIVACY
          </h2>
          <div className={cn("p-6 flex flex-col space-y-4", retroCard)}>
            <ShieldAlert size={24} className="text-sky-500" />
            <p className="text-sm leading-loose text-slate-700 dark:text-slate-300">
              THIS APP IS OFFLINE-FIRST. ALL SESSION DATA IS STORED SECURELY IN YOUR BROWSER'S LOCAL INDEXEDDB. NOTHING IS EVER SENT TO EXTERNAL SERVERS.
            </p>
          </div>
        </section>
        
        <section>
          <h2 className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            DISCLAIMER
          </h2>
          <div className={cn("p-6 flex flex-col space-y-4", retroCard)}>
            <AlertTriangle size={24} className="text-rose-500" />
            <p className="text-sm leading-loose text-slate-700 dark:text-slate-300">
              Cold water immersion can cause cold water shock, hypothermia, and other serious health risks. Consult a physician before starting a cold plunge routine. The developers assume no liability for any injuries, health issues, or other risks associated with cold plunge use.
            </p>
          </div>
        </section>
        
        <section className="text-center pt-4 pb-4">
           <p className="text-sm text-slate-400 dark:text-slate-600 leading-loose">
             FLOSS • F-DROID COMPLIANT<br/>PWA ENGINE
           </p>
        </section>
      </div>
    </div>
  );
}
