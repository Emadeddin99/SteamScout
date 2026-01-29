/**
 * Steam Search API Handler
 * Searches for games on Steam and fetches pricing via CORS proxy
 * Avoids direct corsproxy usage from frontend
 */

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const { gameName } = req.query;

        if (!gameName) {
            return res.status(400).json({ error: 'Missing gameName parameter' });
        }

        console.log(`[API] Searching Steam for: ${gameName}`);

        // Search for the game on Steam
        const steamSearchUrl = `https://steamcommunity.com/actions/SearchApps/${encodeURIComponent(gameName)}`;
        const corsProxyUrl = `https://corsproxy.io/?${encodeURIComponent(steamSearchUrl)}`;

        const searchResponse = await fetch(corsProxyUrl);

        if (!searchResponse.ok) {
            console.error(`[API] Steam search returned status ${searchResponse.status}`);
            return res.status(400).json({
                error: `Steam API returned ${searchResponse.status}`,
                appId: null,
                prices: []
            });
        }

        const searchData = await searchResponse.json();

        if (!searchData || searchData.length === 0) {
            console.log(`[API] No Steam results found for: ${gameName}`);
            return res.status(404).json({
                error: 'Game not found on Steam',
                appId: null,
                prices: []
            });
        }

        const appId = searchData[0].appid;
        console.log(`[API] Found Steam app ID ${appId} for ${gameName}`);

        // Get app details via CORS proxy
        const steamDetailsUrl = `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=US`;
        const corsDetailsUrl = `https://corsproxy.io/?${encodeURIComponent(steamDetailsUrl)}`;

        const detailResponse = await fetch(corsDetailsUrl);

        if (!detailResponse.ok) {
            console.error(`[API] Steam details returned status ${detailResponse.status}`);
            return res.status(400).json({
                error: `Steam details API returned ${detailResponse.status}`,
                appId,
                prices: []
            });
        }

        const detailData = await detailResponse.json();

        console.log(`[API] Steam response structure:`, Object.keys(detailData || {}));

        if (!detailData || !detailData[appId]?.success) {
            console.log(`[API] Could not fetch details for app ID ${appId}`);
            return res.status(400).json({
                error: `Could not fetch details for app ID ${appId}`,
                appId,
                prices: []
            });
        }

        const appData = detailData[appId].data;
        console.log(`[API] App data keys:`, Object.keys(appData || {}).slice(0, 20));

        // Extract pricing information
        if (!appData.price_overview) {
            console.log(`[API] No pricing data available for ${gameName}`);
            return res.status(200).json({
                appId,
                title: gameName,
                prices: [{
                    shop: { name: 'Steam' },
                    price: 0,
                    regular: 0,
                    url: getSteamUrl({ id: appId, title: gameName }),
                    discount: 0,
                    active: 1,
                    source: 'steam',
                    noPriceData: true
                }],
                noPriceData: true
            });
        }

        const pricing = appData.price_overview;
        const finalPrice = pricing.final / 100;
        const initialPrice = pricing.initial / 100;
        const discount = pricing.discount || 0;

        console.log(`[API] Price found: $${finalPrice} (original: $${initialPrice})`);

        const prices = [{
            shop: { name: 'Steam' },
            price: finalPrice,
            regular: initialPrice,
            url: getSteamUrl({ id: appId, title: gameName }),
            discount,
            active: 1,
            source: 'steam'
        }];

        return res.status(200).json({
            appId,
            title: appData.name || gameName,
            prices,
            noPriceData: false
        });

    } catch (error) {
        console.error('[API] Steam search error:', error);
        return res.status(500).json({
            error: error.message || 'Steam search failed',
            appId: null,
            prices: []
        });
    }
}

/**
 * Helper function to generate Steam store URLs
 */
function getSteamUrl(data) {
    if (data.id && Number(data.id) > 0) {
        return `https://store.steampowered.com/app/${data.id}`;
    }

    if (data.title) {
        return `https://store.steampowered.com/search/?term=${encodeURIComponent(data.title)}`;
    }

    return 'https://store.steampowered.com';
}
