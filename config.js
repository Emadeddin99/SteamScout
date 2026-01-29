// config.js - API Configuration for GitHub Pages Deployment
// Only using APIs that actually work from a browser without authentication

const API_CONFIG = {
    // RAWG Video Games Database API (works with API key)
    RAWG_API_KEY: '187867ba2390499797e65d77ee013507',
    RAWG_GAMES_URL: 'https://api.rawg.io/api/games',
    
    // CheapShark API - REAL Steam/GOG/Epic deals (NO AUTH NEEDED)
    CHEAPSHARK_API_BASE: 'https://www.cheapshark.com/api/1.0',
    CHEAPSHARK_DEALS_URL: 'https://www.cheapshark.com/api/1.0/deals',
    
    // Epic Games Free Games API (CORS-friendly, actually works)
    EPIC_FREEGAMES_URL: 'https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions',
};

// Direct fetch - no proxy needed for these APIs
async function directFetch(url, retries = 2) {
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Game Price Calculator',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9'
    };
    
    try {
        const response = await fetch(url, { headers });
        if (!response.ok) {
            console.warn(`API returned status ${response.status} for URL: ${url}`);
            if (retries > 0 && response.status === 500) {
                console.log(`Retrying (${retries} retries left)...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                return directFetch(url, retries - 1);
            }
            return null;
        }
        return await response.json();
    } catch (error) {
        if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
            console.warn('⚠️ CORS blocked or network error:', url);
            return null;
        }
        console.error('Fetch error:', error.message, 'URL:', url);
        if (retries > 0 && error.message.includes('Failed')) {
            console.log(`Retrying (${retries} retries left)...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            return directFetch(url, retries - 1);
        }
        return null;
    }
}
