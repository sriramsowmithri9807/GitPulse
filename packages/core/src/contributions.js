// GraphQL fetch against contributionsCollection.contributionCalendar, plus a
// deterministic mock-data generator so the tool can be previewed with no token.
//
// The extension prefers the zero-network DOM scraper (./domScrape.js); this
// GraphQL path is for Node contexts — the dev CLI and the site's serverless
// functions — where there is no rendered page to read.

// Convenience re-export: "get contribution data" lives here conceptually.
export { scrapeContributionGrid, parseCalendarEntries, entriesToGrid } from './domScrape.js';

/**
 * Fetch a user's contribution calendar and normalize it into
 * grid[week][day] = { count, date }.
 *
 * @param {string} login  GitHub username
 * @param {string} token  token with read:user scope (GITHUB_TOKEN works for the caller's own graph)
 * @returns {Promise<Array<Array<{count:number,date:string}>>>}
 */
export async function fetchContributions(login, token) {
  if (!token) {
    throw new Error('No token provided. Pass --token=, set GITHUB_TOKEN, or use --mock for a tokenless preview.');
  }

  const query = `query($login:String!){
    user(login:$login){
      contributionsCollection{
        contributionCalendar{
          weeks{
            contributionDays{ contributionCount date weekday }
          }
        }
      }
    }
  }`;

  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'contribution-graph-animator',
    },
    body: JSON.stringify({ query, variables: { login } }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GitHub API responded ${res.status} ${res.statusText}: ${text.slice(0, 300)}`);
  }

  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  }

  const cal = json.data?.user?.contributionsCollection?.contributionCalendar;
  if (!cal?.weeks) {
    throw new Error(`No contribution calendar returned for "${login}".`);
  }

  return cal.weeks.map((w) =>
    w.contributionDays.map((d) => ({ count: d.contributionCount, date: d.date })),
  );
}

/**
 * Deterministic mock grid (seeded LCG, never Math.random) so previews and the
 * smoke test are reproducible.
 *
 * @param {{weeks?:number, seed?:number}} opts
 * @returns {Array<Array<{count:number,date:string}>>}
 */
export function generateMockGrid({ weeks = 53, seed = 42 } = {}) {
  let s = seed >>> 0;
  const rnd = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };

  const grid = [];
  const anchor = new Date('2026-09-03T00:00:00Z');

  for (let w = 0; w < weeks; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const r = rnd();
      let count = 0;
      if (r > 0.35) {
        // a slow seasonal wave so the mock graph has visible structure
        const wave = Math.sin((w / weeks) * Math.PI * 3) * 0.5 + 0.5;
        count = Math.round(rnd() * rnd() * 18 * (0.3 + wave));
      }
      const date = new Date(anchor);
      date.setUTCDate(anchor.getUTCDate() - ((weeks - 1 - w) * 7 + (6 - d)));
      week.push({ count, date: date.toISOString().slice(0, 10) });
    }
    grid.push(week);
  }
  return grid;
}
