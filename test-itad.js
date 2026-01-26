const ITAD_API_KEY = '84bfb1b622a0e38eee27b2f8c4c9e7e350fd2a93';

// Test different URL formats
const urls = [
  `https://api.isthereanydeal.com/v01/deals/list/?key=${ITAD_API_KEY}&country=US&shops=steam&limit=200&sort=discount`,
  `https://api.isthereanydeal.com/v01/deals/list?key=${ITAD_API_KEY}&country=US&shops=steam`,
  `https://api.isthereanydeal.com/v01/deals/list/?key=${ITAD_API_KEY}`,
];

async function testUrl(url) {
  console.log('\n🔍 Testing:', url.substring(0, 80) + '...');
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SteamScout/1.0',
        'Accept': 'application/json'
      }
    });
    
    console.log('   Status:', response.status, response.statusText);
    const text = await response.text();
    console.log('   Response (first 150 chars):', text.substring(0, 150));
  } catch (err) {
    console.error('   Error:', err.message);
  }
}

async function main() {
  for (const url of urls) {
    await testUrl(url);
  }
}

main();
