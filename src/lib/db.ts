import Dexie, { type Table } from 'dexie';
import type { PlungeSession } from '../types';

export class ColdPlungeDB extends Dexie {
  sessions!: Table<PlungeSession>;

  constructor() {
    super('ColdPlungeDB');
    this.version(1).stores({
      sessions: '++id, timestamp'
    });
  }
}

export const db = new ColdPlungeDB();
