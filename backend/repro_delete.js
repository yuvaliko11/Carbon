const API_URL = 'http://localhost:5002/api';
const EMAIL = 'admin@fijicarbon.com';
const PASSWORD = 'admin';

async function runTest() {
    try {
        // 1. Login
        console.log('Authenticating...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD })
        });

        if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status}`);
        const loginData = await loginRes.json();
        const token = loginData.token || (loginData.data && loginData.data.token);
        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

        // 2. Create a Test Contract (which triggers Lease & Parcel creation)
        console.log('Creating Test Contract...');
        const testLeaseNumber = `TEST-${Date.now()}`;
        const createRes = await fetch(`${API_URL}/carbon-contracts`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                leaseNumber: testLeaseNumber,
                name: `Test Contract ${testLeaseNumber}`,
                status: 'compliant',
                greenScore: 100,
                location: { type: 'Polygon', coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]] }
            })
        });

        if (!createRes.ok) {
            const text = await createRes.text();
            console.error('Create Response Status:', createRes.status);
            console.error('Create Response Body:', text.substring(0, 500)); // Log first 500 chars
            throw new Error(`Create failed: ${createRes.status}`);
        }
        const contract = (await createRes.json()).data;
        console.log(`Created Contract: ${contract._id} (Lease: ${contract.leaseNumber})`);

        // ... rest of script
    } catch (err) {
        console.error('Test Error:', err.message);
    }
}

runTest();
