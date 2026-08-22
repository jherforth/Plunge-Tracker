import { useLiveQuery } from 'dexie-react-hooks';
import { Trash2, ThermometerSnowflake, Clock } from 'lucide-react';
import { db } from '../lib/db';
import { formatTime, formatDate, retroCard, retroButton, cn } from '../lib/utils';

export default function HistoryTab() {
  const sessions = useLiveQuery(() => db.sessions.orderBy('timestamp').reverse().toArray());

  const deleteSession = async (id?: number) => {
    if (!id) return;
    if (confirm('Are you sure you want to delete this session?')) {
      await db.sessions.delete(id);
    }
  };

  if (!sessions) {
    return <div className="flex items-center justify-center h-full text-slate-500">Loading history...</div>;
  }

  return (
    <div className="h-full flex flex-col pb-20">
      <div className="px-6 py-8">
        <h1 className="text-xl text-slate-900 dark:text-white mb-2">HISTORY</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">Your past cold plunge sessions.</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 space-y-6">
        {sessions.length === 0 ? (
          <div className={cn("text-center py-12 text-slate-500 text-sm leading-loose", retroCard)}>
            NO SESSIONS RECORDED.<br/><br/>TIME TO TAKE THE PLUNGE!
          </div>
        ) : (
          sessions.map((session) => (
            <div 
              key={session.id} 
              className={cn("p-4 flex items-center justify-between", retroCard)}
            >
              <div className="flex flex-col">
                <span className="text-sm text-slate-900 dark:text-white mb-3">
                  {formatDate(session.timestamp)}
                </span>
                <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400">
                  <span className="flex items-center">
                    <Clock size={12} className="mr-2 text-sky-500" />
                    {formatTime(session.durationSeconds)}
                  </span>
                  {session.waterTemperature && (
                    <span className="flex items-center">
                      <ThermometerSnowflake size={12} className="mr-2 text-sky-500" />
                      {session.waterTemperature}°{session.temperatureUnit || 'C'}
                    </span>
                  )}
                </div>
              </div>
              
              <button 
                onClick={() => deleteSession(session.id)}
                className={cn("p-3 bg-slate-200 dark:bg-slate-800 text-rose-500", retroButton)}
                aria-label="Delete session"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
