// Quick test of ITAD API endpoints
const ITAD_API_KEY = '84bfb1b622a0e38eee27b2f8c4c9e7e350fd2a93';

async function testEndpoint(version) {
  const url = `https://api.isthereanydeal.com/${version}/deals/list/?key=${ITAD_API_KEY}&country=US&shops=steam&limit=5&sort=discount`;
  console.log(`\nTesting ${version} endpoint:`);
  console.log('URL:', url);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SteamScout/1.0',
        'Accept': 'application/json'
      }
    });

    console.log('Status:', response.status);

    if (response.status === 404) {
      console.log('404 - Endpoint not found');
    } else if (response.ok) {
      const data = await response.json();
      console.log('Success! Response type:', typeof data);
      if (Array.isArray(data)) {
        console.log('Array length:', data.length);
        if (data.length > 0) {
          console.log('First item keys:', Object.keys(data[0]));
        }
      } else {
        console.log('Keys:', Object.keys(data));
      }
    } else {
      const text = await response.text();
      console.log('Error response:', text.substring(0, 200));
    }
  } catch (err) {
    console.log('Error:', err.message);
  }
}

async function main() {
  await testEndpoint('v01');
  await testEndpoint('v02');
  await testEndpoint('v2');
}

main();