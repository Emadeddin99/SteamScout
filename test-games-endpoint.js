// Check games endpoint for deal details with expiry

async function test() {
  try {
    const response = await fetch('https://www.cheapshark.com/api/1.0/games?id=305742');
    const data = await response.json();
    
    console.log('Games endpoint response:');
    console.log(JSON.stringify(data, null, 2).substring(0, 1500));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
