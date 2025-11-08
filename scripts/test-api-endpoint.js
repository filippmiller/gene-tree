// Using built-in fetch in Node.js 18+

async function testAPI() {
  console.log('Testing /api/profile/complete endpoint...\n');
  
  try {
    const response = await fetch('https://gene-tree-production.up.railway.app/api/profile/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'first_name=Test&last_name=User&gender=male'
    });
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    const text = await response.text();
    console.log('Response:', text);
    
    if (response.status === 404) {
      console.log('\n❌ API endpoint does NOT exist (404)');
    } else if (response.status === 401) {
      console.log('\n✅ API endpoint EXISTS but requires authentication (401) - this is expected!');
    } else {
      console.log('\n✅ API endpoint EXISTS and responded with status:', response.status);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();
