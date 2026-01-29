// Check if there's deal detail endpoint with expiry

async function test() {
  try {
    // First, get a deal ID from the deals list
    const dealsResponse = await fetch('https://www.cheapshark.com/api/1.0/deals?storeID=1&pageSize=1');
    const deals = await dealsResponse.json();
    
    if (deals.length === 0) {
      console.log('No deals found');
      return;
    }
    
    const deal = deals[0];
    console.log(`Sample deal: ${deal.title}`);
    console.log(`Deal ID: ${deal.dealID}`);
    console.log(`Game ID: ${deal.gameID}`);
    
    // Try to get deal details
    console.log('\n--- Trying deal details endpoints ---\n');
    
    const endpoints = [
      `https://www.cheapshark.com/api/1.0/deals?dealID=${deal.dealID}`,
      `https://www.cheapshark.com/api/1.0/deal/${deal.dealID}`,
      `https://www.cheapshark.com/api/1.0/games?id=${deal.gameID}`,
    ];
    
    for (const url of endpoints) {
      try {
        const response = await fetch(url);
        const data = await response.json();
        console.log(`✓ ${url.substring(0, 70)}`);
        console.log(`  Response keys: ${Object.keys(data).slice(0, 10).join(', ')}`);
        if (data.dealExpires) console.log(`  dealExpires: ${data.dealExpires}`);
        console.log();
      } catch (err) {
        console.log(`✗ ${url.substring(0, 70)}: ${err.message}\n`);
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
