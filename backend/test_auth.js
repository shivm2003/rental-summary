const test = async () => {
  console.log('--- Testing Login Rate Limits ---');
  for(let i = 1; i <= 6; i++) {
    try {
      const res = await fetch('http://localhost:5001/api/auth/login', { 
        method: 'POST', 
        headers: {'Content-Type': 'application/json'}, 
        body: JSON.stringify({identifier: 'test@example.com', password: 'wrong'}) 
      });
      const body = await res.text();
      console.log(`Req ${i}: ${res.status} - ${body}`);
    } catch (e) {
      console.error(`Req ${i} failed:`, e);
    }
  }

  console.log('\\n--- Testing Register Validation ---');
  try {
    const res = await fetch('http://localhost:5001/api/auth/register', { 
      method: 'POST', 
      headers: {'Content-Type': 'application/json'}, 
      body: JSON.stringify({username: 'test', email: 'test@example.com', phone: '123', password: 'weak'}) 
    });
    console.log(`Register Test: ${res.status} - ${await res.text()}`);
  } catch(e) {
    console.error('Register test failed:', e);
  }
};

test();
