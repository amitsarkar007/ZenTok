// Server-side proxy for the ZenQuotes API.
//
// Why this exists: the browser cannot call zenquotes.io directly (the free
// tier sends no Access-Control-Allow-Origin headers), and public CORS
// proxies are unreliable and cache responses - which is why every visitor
// used to see the exact same first quote on every refresh. This function
// fetches the 50-quote batch server-side and hands it to the app, which
// shuffles it locally. No API key is required for this endpoint and no
// secret is stored anywhere.

const ZENQUOTES_URL = 'https://zenquotes.io/api/quotes';
// ZenQuotes free tier allows 5 requests per 30 seconds per IP. Netlify
// functions share egress IPs, so cache the batch briefly and always serve
// the last good batch rather than erroring when ZenQuotes rate-limits.
const CACHE_TTL_MS = 60 * 1000;

let cache = { fetchedAt: 0, data: null };

function isRealQuote(entry) {
    return entry
        && typeof entry.q === 'string'
        && typeof entry.a === 'string'
        && entry.a.toLowerCase() !== 'zenquotes.io'
        && !entry.q.startsWith('Too many requests');
}

function respond(statusCode, payload) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=30'
        },
        body: JSON.stringify(payload)
    };
}

exports.handler = async () => {
    const now = Date.now();
    if (cache.data && now - cache.fetchedAt < CACHE_TTL_MS) {
        return respond(200, cache.data);
    }

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
        cache = { fetchedAt: now, data: quotes };
        return respond(200, quotes);
    } catch (error) {
        console.error('ZenQuotes fetch failed:', error);
        if (cache.data) {
            // Serve the last good batch rather than showing an error.
            return respond(200, cache.data);
        }
        return respond(502, { error: 'Could not load quotes right now. Please try again shortly.' });
    }
};
