import fs from 'fs';
import path from 'path';
import { getStore } from '@netlify/blobs';

export interface StatsData {
  total: number;
  daily: Record<string, number>;
  weekly: Record<string, number>;
}

export interface Stats {
  sessions?: StatsData;
  prompts?: StatsData;
  total?: number;
  daily?: Record<string, number>;
  weekly?: Record<string, number>;
}

const statsFilePath = path.join(process.cwd(), 'data', 'stats.json');

function getDayKey(): string {
  const date = new Date();
  return date.toISOString().split('T')[0];
}

function getWeekKey(): string {
  const date = new Date();
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  return `${date.getFullYear()}-W${weekNum}`;
}

function getEmptyStatsData(): StatsData {
  return { total: 0, daily: {}, weekly: {} };
}

function initializeStatsFile() {
  if (!fs.existsSync(statsFilePath)) {
    const defaultStats: Stats = { 
        sessions: getEmptyStatsData(), 
        prompts: getEmptyStatsData() 
    };
    const dir = path.dirname(statsFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(statsFilePath, JSON.stringify(defaultStats, null, 2));
  }
}

function migrateStatsIfNeeded(stats: Stats) {
  if (!stats.sessions) {
    stats.sessions = { 
        total: stats.total || 0, 
        daily: stats.daily || {}, 
        weekly: stats.weekly || {} 
    };
    stats.prompts = getEmptyStatsData();
    delete stats.total;
    delete stats.daily;
    delete stats.weekly;
  }
}

export async function getStats(): Promise<Stats> {
  // 1. Try Netlify Blobs FIRST (Production Cloud)
  try {
    const store = getStore('dr-kalam-stats');
    const cloudData = await store.get('metrics', { type: 'json' });
    if (cloudData) {
      const stats = cloudData as Stats;
      migrateStatsIfNeeded(stats);
      return stats;
    }
  } catch (error) {
    // Fails locally if Netlify CLI context isn't active.
  }

  // 2. Fallback to Local Filesystem (Local Development)
  initializeStatsFile();
  try {
    const raw = fs.readFileSync(statsFilePath, 'utf8');
    const stats = JSON.parse(raw) as Stats;
    migrateStatsIfNeeded(stats);
    return stats;
  } catch (error) {
    console.error('Failed to read stats:', error);
    return { sessions: getEmptyStatsData(), prompts: getEmptyStatsData() };
  }
}

function incrementData(data: StatsData, dayKey: string, weekKey: string) {
    data.total += 1;
    data.daily[dayKey] = (data.daily[dayKey] || 0) + 1;
    data.weekly[weekKey] = (data.weekly[weekKey] || 0) + 1;
}

export async function incrementStats(isNewSession: boolean): Promise<void> {
  const stats = await getStats();
  
  const dayKey = getDayKey();
  const weekKey = getWeekKey();

  if (isNewSession && stats.sessions) {
      incrementData(stats.sessions, dayKey, weekKey);
  }
  if (stats.prompts) {
      incrementData(stats.prompts, dayKey, weekKey);
  }

  // 1. Save to Netlify Blobs (Production)
  try {
    const store = getStore('dr-kalam-stats');
    await store.setJSON('metrics', stats);
  } catch (error) {
     // Expected to fail locally
  }

  // 2. Also save to Local FS (Development)
  try {
    fs.writeFileSync(statsFilePath, JSON.stringify(stats, null, 2));
  } catch (error) {
    console.error('Failed to write local stats:', error);
  }
}

export async function getCurrentPeriodStats() {
  const stats = await getStats();
  const dayKey = getDayKey();
  const weekKey = getWeekKey();

  return {
    sessions: {
        total: stats.sessions?.total || 0,
        today: stats.sessions?.daily[dayKey] || 0,
        thisWeek: stats.sessions?.weekly[weekKey] || 0
    },
    prompts: {
        total: stats.prompts?.total || 0,
        today: stats.prompts?.daily[dayKey] || 0,
        thisWeek: stats.prompts?.weekly[weekKey] || 0
    }
  };
}
