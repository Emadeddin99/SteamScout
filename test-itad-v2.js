// Test the corrected ITAD v2 endpoint
const ITAD_API_KEY = '84bfb1b622a0e38eee27b2f8c4c9e7e350fd2a93';
const url = `https://api.isthereanydeal.com/deals/v2?key=${ITAD_API_KEY}&country=US&shops=61&limit=5&sort=-cut`;

console.log('Testing corrected ITAD v2 endpoint:');
console.log('URL:', url);

fetch(url, {
    headers: {
        'User-Agent': 'SteamScout/1.0',
        'Accept': 'application/json'
    }
})
.then(response => {
    console.log('Status:', response.status);
    if (response.status === 200) {
        return response.json();
    } else {
        return response.text().then(text => {
            throw new Error(`HTTP ${response.status}: ${text.substring(0, 200)}`);
        });
    }
})
.then(data => {
    console.log('Success! Response keys:', Object.keys(data));
    if (data.list && Array.isArray(data.list)) {
        console.log('List length:', data.list.length);
        if (data.list.length > 0) {
            console.log('First deal keys:', Object.keys(data.list[0]));
            console.log('First deal title:', data.list[0].title);
            console.log('First deal cut:', data.list[0].deal?.cut);
        }
    }
})
.catch(error => {
    console.error('Error:', error.message);
});