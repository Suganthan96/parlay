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
  homeLogo?:  string;
  awayLogo?:  string;
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
      homeLogo: home.team?.logo ?? undefined,
      awayLogo: away.team?.logo ?? undefined,
      homeOdds,
      awayOdds,
      kickoff:  Math.floor(kickoffMs / 1000),
      status:   statusLabel(statusName),
    });
  }
  return out;
}

const now = Math.floor(Date.now() / 1000);
const FALLBACK_SPORTS: SportEvent[] = [
  { matchId:'nfl-fb1', sport:'nfl', league:'NFL', homeTeam:'Kansas City Chiefs', awayTeam:'Buffalo Bills', homeOdds:1.65, awayOdds:2.30, kickoff:now+86400, status:'upcoming' },
  { matchId:'nfl-fb2', sport:'nfl', league:'NFL', homeTeam:'San Francisco 49ers', awayTeam:'Dallas Cowboys', homeOdds:1.80, awayOdds:2.10, kickoff:now+90000, status:'upcoming' },
  { matchId:'nfl-fb3', sport:'nfl', league:'NFL', homeTeam:'Philadelphia Eagles', awayTeam:'New York Giants', homeOdds:1.55, awayOdds:2.55, kickoff:now+93600, status:'upcoming' },
  { matchId:'nfl-fb4', sport:'nfl', league:'NFL', homeTeam:'Miami Dolphins', awayTeam:'New England Patriots', homeOdds:1.75, awayOdds:2.15, kickoff:now+97200, status:'upcoming' },
  { matchId:'nba-fb1', sport:'nba', league:'NBA', homeTeam:'Boston Celtics', awayTeam:'Golden State Warriors', homeOdds:1.70, awayOdds:2.20, kickoff:now+100800, status:'upcoming' },
  { matchId:'nba-fb2', sport:'nba', league:'NBA', homeTeam:'Los Angeles Lakers', awayTeam:'Denver Nuggets', homeOdds:2.00, awayOdds:1.90, kickoff:now+104400, status:'upcoming' },
  { matchId:'nba-fb3', sport:'nba', league:'NBA', homeTeam:'Milwaukee Bucks', awayTeam:'Miami Heat', homeOdds:1.60, awayOdds:2.40, kickoff:now+108000, status:'upcoming' },
  { matchId:'soccer-fb1', sport:'soccer', league:'EPL', homeTeam:'Manchester City', awayTeam:'Arsenal', homeOdds:1.75, awayOdds:2.25, kickoff:now+111600, status:'upcoming' },
  { matchId:'soccer-fb2', sport:'soccer', league:'EPL', homeTeam:'Liverpool', awayTeam:'Chelsea', homeOdds:1.80, awayOdds:2.10, kickoff:now+115200, status:'upcoming' },
  { matchId:'soccer-fb3', sport:'soccer', league:'EPL', homeTeam:'Tottenham Hotspur', awayTeam:'Manchester United', homeOdds:1.90, awayOdds:2.00, kickoff:now+118800, status:'upcoming' },
  { matchId:'mma-fb1', sport:'mma', league:'UFC', homeTeam:'Jon Jones', awayTeam:'Stipe Miocic', homeOdds:1.45, awayOdds:2.80, kickoff:now+172800, status:'upcoming' },
  { matchId:'mma-fb2', sport:'mma', league:'UFC', homeTeam:'Islam Makhachev', awayTeam:'Dustin Poirier', homeOdds:1.55, awayOdds:2.55, kickoff:now+176400, status:'upcoming' },
];

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
    const nameA  = a.athlete?.displayName ?? a.team?.displayName ?? 'Fighter A';
    const nameB  = b.athlete?.displayName ?? b.team?.displayName ?? 'Fighter B';
    const logoA  = a.athlete?.headshot?.href ?? a.team?.logo ?? undefined;
    const logoB  = b.athlete?.headshot?.href ?? b.team?.logo ?? undefined;
    const recA   = (a.records ?? []).find((r: any) => r.type === 'total')?.summary ?? '0-0';
    const recB   = (b.records ?? []).find((r: any) => r.type === 'total')?.summary ?? '0-0';
    const { homeOdds: oddsA, awayOdds: oddsB } = computeOdds(recA, recB);
    mma.push({
      matchId:  `mma-${e.id}`,
      sport:    'mma',
      league:   'UFC',
      homeTeam: nameA,
      awayTeam: nameB,
      homeLogo: logoA,
      awayLogo: logoB,
      homeOdds: oddsA,
      awayOdds: oddsB,
      kickoff:  Math.floor(new Date(e.date ?? Date.now()).getTime() / 1000),
      status:   statusLabel(comp.status?.type?.name ?? ''),
    });
  }

  const live = [...nfl, ...nba, ...soccer, ...mma];
  // If ESPN returned nothing (SSL / network issue), serve fallback data
  const all = live.length > 0 ? live : FALLBACK_SPORTS;
  return NextResponse.json(all, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
  });
}
