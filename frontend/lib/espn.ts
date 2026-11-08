// ESPN sports event helpers — no viem dependency

export const ESPN_LEAGUES = {
  EPL: 'soccer/eng.1',
  NBA: 'basketball/nba',
  NFL: 'football/nfl',
  MLB: 'baseball/mlb',
  UFC: 'mma/ufc',
} as const;

export type EspnLeague = keyof typeof ESPN_LEAGUES;

export const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports';

export function espnEventsUrl(league: EspnLeague): string {
  return `${ESPN_BASE}/${ESPN_LEAGUES[league]}/events`;
}
