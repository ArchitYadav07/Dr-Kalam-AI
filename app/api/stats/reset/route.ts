import { NextResponse } from 'next/server';
import { getStore } from '@netlify/blobs';
import fs from 'fs';
import path from 'path';

const statsFilePath = path.join(process.cwd(), 'data', 'stats.json');

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== 'kalam2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const emptyStats = {
    sessions: { total: 0, daily: {}, weekly: {} },
    prompts: { total: 0, daily: {}, weekly: {} }
  };

  try {
    // 1. Reset Netlify Blobs Database
    const store = getStore('dr-kalam-stats');
    await store.setJSON('metrics', emptyStats);
  } catch (error) {
    console.error('No Netlify Context, skipping cloud reset.');
  }

  try {
    // 2. Reset Local Hard Drive Database
    fs.writeFileSync(statsFilePath, JSON.stringify(emptyStats, null, 2));
  } catch (err) {
    console.error('Cannot wipe local file');
  }

  return NextResponse.json({ success: true, message: "All interaction stats have been fully reset." });
}
