const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function testLenderRegister() {
  const loginRes = await axios.post('http://localhost:5001/api/auth/login', {
    identifier: 'testuser_1775282294354@example.com',
    password: 'Password123!'
  });
  const token = loginRes.data.user.token;

  const form = new FormData();
  form.append('lenderType', 'individual');
  form.append('fullAddress', '123 test repro');
  form.append('pincode', '110001');
  form.append('ref1Name', 'Ref One');
  form.append('ref1Mobile', '9988776655');
  form.append('ref2Name', 'Ref Two');
  form.append('ref2Mobile', '9988776644');
  
  // Dummy files
  // Create dummy files if they don't exist
  fs.writeFileSync('dummy.pdf', 'dummy content');
  
  form.append('firstIdProof', fs.createReadStream('dummy.pdf'));
  form.append('secondIdProof', fs.createReadStream('dummy.pdf'));

  try {
    const res = await axios.post('http://localhost:5001/api/lender/register', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('SUCCESS:', res.data);
  } catch (err) {
    console.error('FAILED:', err.response?.status, err.response?.data || err.message);
  }
}

testLenderRegister();
