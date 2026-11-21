// Server-side proxy for the ZenQuotes API.
//
// Why this exists: the browser cannot call zenquotes.io directly (the free
// tier sends no Access-Control-Allow-Origin headers), and public CORS
// proxies are unreliable and cache responses - which is why every visitor
// used to see the exact same first quote on every refresh. This function
// fetches batches server-side and hands them to the app. No API key is
// required for the endpoints used here and no secret is stored anywhere.
//
// How the feed stays fresh at the end of the list:
// - ZenQuotes' free /api/quotes call returns 50 random quotes and the batch
//   rotates roughly every minute (measured: two calls ~70s apart overlapped
//   by only 1 of 50 quotes). There is no paging on the free tier, so
//   rotation + accumulation is the way to reach a large feed.
// - Every fetched batch is merged into an in-memory pool (deduped, capped),
//   so the pool grows over time and across visitors sharing a warm function
//   instance.
// - Every request gets a fresh random sample from the pool, so consecutive
//   loads - even seconds apart - return different quotes.
// - Cache-Control: no-store keeps Netlify's CDN from serving an identical
//   cached response to rapid scroll loads.

const ZENQUOTES_URL = 'https://zenquotes.io/api/quotes';
const ZENQUOTES_RANDOM_URL = 'https://zenquotes.io/api/random';
// Free tier: 5 requests per 30 seconds per IP. Netlify functions share
// egress IPs, so stay well under that and always serve the pool rather
// than erroring when ZenQuotes rate-limits.
const UPSTREAM_MIN_INTERVAL_MS = 32 * 1000;
const POOL_CAP = 500;
const SAMPLE_SIZE = 50;

let state = { fetchedAt: 0, pool: [], keys: new Set() };

function isRealQuote(entry) {
    return entry
        && typeof entry.q === 'string'
        && typeof entry.a === 'string'
        && entry.a.toLowerCase() !== 'zenquotes.io'
        && !entry.q.startsWith('Too many requests');
}

function quoteKey(q) {
    return q.q + '|' + q.a;
}

function addToPool(quotes) {
    for (const q of quotes) {
        const k = quoteKey(q);
        if (!state.keys.has(k)) {
            state.keys.add(k);
            state.pool.push(q);
        }
    }
    if (state.pool.length > POOL_CAP) {
        state.pool = state.pool.slice(-POOL_CAP);
        state.keys = new Set(state.pool.map(quoteKey));
    }
}

function samplePool() {
    const arr = [...state.pool];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, SAMPLE_SIZE);
}

// /api/random draws from ZenQuotes' whole curated database, not just the
// current rotating batch. A few of these per refetch tick grow the pool
// with brand-new quotes even between batch rotations (roughly hourly).
// Random calls that hit the rate limit return a placeholder row, which
// isRealQuote filters out; failures just mean fewer extras.
async function fetchRandomExtras(count) {
    const extras = [];
    await Promise.all(Array.from({ length: count }, async () => {
        try {
            const response = await fetch(ZENQUOTES_RANDOM_URL, {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'ZenTok (https://zentok.netlify.app)'
                }
            });
            if (!response.ok) return;
            const data = await response.json();
            if (Array.isArray(data) && data[0] && isRealQuote(data[0])) {
                extras.push(data[0]);
            }
        } catch (error) {
            // Ignore: extras are a bonus, the pool sample still serves.
        }
    }));
    return extras;
}

function respond(statusCode, payload) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            // No CDN caching: every scroll load must reach this function so
            // it gets a fresh random sample instead of a stale identical one.
            'Cache-Control': 'no-store'
        },
        body: JSON.stringify(payload)
    };
}

exports.handler = async () => {
    const now = Date.now();
    if (state.pool.length === 0 || now - state.fetchedAt >= UPSTREAM_MIN_INTERVAL_MS) {
        try {
            const response = await fetch(ZENQUOTES_URL, {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'ZenTok (https://zentok.netlify.app)'
                }
            });
            if (!response.ok) {
                throw new Error('ZenQuotes returned HTTP ' + response.status);
            }
            const data = await response.json();
            if (!Array.isArray(data)) {
                throw new Error('ZenQuotes returned a non-array response');
            }
            const quotes = data.filter(isRealQuote);
            if (quotes.length === 0) {
                throw new Error('ZenQuotes returned no usable quotes');
            }
            state.fetchedAt = now;
            addToPool(quotes);
            // Extras from the whole database, fetched only on this refetch
            // tick: 1 batch + 4 randoms = 5 requests per 32s, inside the free
            // tier's 5 per 30s. Per-call randoms get rate-limited on shared
            // egress IPs and ZenQuotes then serves placeholder rows.
            addToPool(await fetchRandomExtras(4));
        } catch (error) {
            console.error('ZenQuotes fetch failed:', error);
            // Fall through and serve whatever the pool already holds.
        }
    }

    if (state.pool.length === 0) {
        return respond(502, { error: 'Could not load quotes right now. Please try again shortly.' });
    }

    return respond(200, samplePool());
};
