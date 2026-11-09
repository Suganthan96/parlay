/**
 * Real multi-sport odds via ESPN public API (no auth required).
 * Computes implied decimal odds from live team win-loss records.
 * Returns NFL, NBA, EPL soccer in a unified format.
 */
import { NextResponse } from 'next/server';

export interface SportEvent {
  matchId:    string;
  sport:      'nfl' | 'nba' | 'soccer' | 'mma';
  league:     string;
  homeTeam:   string;
  awayTeam:   string;
  homeOdds:   number;  // decimal odds e.g. 1.75
  awayOdds:   number;
  kickoff:    number;  // unix seconds
  status:     'upcoming' | 'in_progress' | 'final';
  suiObjectId?: string;
}

function parseRecord(summary: string): [number, number] {
  const parts = summary.split('-').map(Number);
  return [parts[0] ?? 0, parts[1] ?? 0];
}

// Compute decimal odds from season win-loss records with home advantage
function computeOdds(
  homeRecord: string,
  awayRecord: string,
): { homeOdds: number; awayOdds: number } {
  const [hw, hl] = parseRecord(homeRecord);
  const [aw, al] = parseRecord(awayRecord);

  const homePct = hw / Math.max(1, hw + hl);
  const awayPct = aw / Math.max(1, aw + al);

  // 5% home court/field advantage
  const homeAdj = Math.min(0.95, homePct + 0.05);
  const awayAdj = Math.max(0.05, awayPct);
  const total   = homeAdj + awayAdj;

  const homeProb = homeAdj / total;
  const awayProb = awayAdj / total;

  // 5% bookmaker margin (vig) → decimal odds
  const homeOdds = parseFloat((1 / (homeProb * 0.95)).toFixed(2));
  const awayOdds = parseFloat((1 / (awayProb * 0.95)).toFixed(2));

  return { homeOdds, awayOdds };
}

function statusLabel(name: string): SportEvent['status'] {
  if (name === 'STATUS_FINAL' || name === 'STATUS_FULL_TIME') return 'final';
  if (name === 'STATUS_IN_PROGRESS' || name === 'STATUS_HALFTIME') return 'in_progress';
  return 'upcoming';
}

async function fetchESPN(url: string): Promise<any[]> {
  try {
    const r = await fetch(url, { next: { revalidate: 300 } });
    if (!r.ok) return [];
    const d = await r.json();
    return d.events ?? [];
  } catch {
    return [];
  }
}

function parseEvents(
  events: any[],
  sport: SportEvent['sport'],
  league: string,
): SportEvent[] {
  const out: SportEvent[] = [];
  for (const e of events) {
    const comp = e.competitions?.[0];
    if (!comp) continue;
    const competitors: any[] = comp.competitors ?? [];
    const home = competitors.find((c: any) => c.homeAway === 'home');
    const away = competitors.find((c: any) => c.homeAway === 'away');
    if (!home || !away) continue;

    const homeRec = (home.records ?? []).find((r: any) => r.type === 'total')?.summary ?? '0-0';
    const awayRec = (away.records ?? []).find((r: any) => r.type === 'total')?.summary ?? '0-0';
    const { homeOdds, awayOdds } = computeOdds(homeRec, awayRec);

    const statusName = comp.status?.type?.name ?? '';
    const kickoffMs  = new Date(e.date ?? Date.now()).getTime();

    out.push({
      matchId:  `${sport}-${e.id}`,
      sport,
      league,
      homeTeam: home.team?.displayName ?? 'Home',
      awayTeam: away.team?.displayName ?? 'Away',
      homeOdds,
      awayOdds,
      kickoff:  Math.floor(kickoffMs / 1000),
      status:   statusLabel(statusName),
    });
  }
  return out;
}

export async function GET() {
  const ESPN = 'https://site.api.espn.com/apis/site/v2/sports';

  const [nflRaw, nbaRaw, eplRaw, mmaRaw] = await Promise.all([
    fetchESPN(`${ESPN}/football/nfl/scoreboard`),
    fetchESPN(`${ESPN}/basketball/nba/scoreboard`),
    fetchESPN(`${ESPN}/soccer/eng.1/scoreboard`),
    fetchESPN(`${ESPN}/mma/ufc/scoreboard`),
  ]);

  const nfl    = parseEvents(nflRaw, 'nfl',    'NFL');
  const nba    = parseEvents(nbaRaw, 'nba',    'NBA');
  const soccer = parseEvents(eplRaw, 'soccer', 'EPL');

  // UFC/MMA — competitors have athlete info not team
  const mma: SportEvent[] = [];
  for (const e of mmaRaw) {
    const comp = e.competitions?.[0];
    if (!comp) continue;
    const comps = comp.competitors ?? [];
    if (comps.length < 2) continue;
    const a = comps[0];
    const b = comps[1];
    const nameA = a.athlete?.displayName ?? a.team?.displayName ?? 'Fighter A';
    const nameB = b.athlete?.displayName ?? b.team?.displayName ?? 'Fighter B';
    const recA  = (a.records ?? []).find((r: any) => r.type === 'total')?.summary ?? '0-0';
    const recB  = (b.records ?? []).find((r: any) => r.type === 'total')?.summary ?? '0-0';
    const { homeOdds: oddsA, awayOdds: oddsB } = computeOdds(recA, recB);
    mma.push({
      matchId:  `mma-${e.id}`,
      sport:    'mma',
      league:   'UFC',
      homeTeam: nameA,
      awayTeam: nameB,
      homeOdds: oddsA,
      awayOdds: oddsB,
      kickoff:  Math.floor(new Date(e.date ?? Date.now()).getTime() / 1000),
      status:   statusLabel(comp.status?.type?.name ?? ''),
    });
  }

  const all = [...nfl, ...nba, ...soccer, ...mma];
  return NextResponse.json(all, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
  });
}
