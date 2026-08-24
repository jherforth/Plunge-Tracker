export interface PlungeSession {
  id?: number;
  timestamp: number;
  durationSeconds: number;
  targetDurationSeconds: number;
  waterTemperature?: number;
  temperatureUnit?: 'C' | 'F';
}
