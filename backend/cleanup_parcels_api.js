const API_URL = 'https://ctrade.facio.io/api';
const EMAIL = 'admin@fijicarbon.com';
const PASSWORD = 'admin';

async function cleanup() {
    try {
        console.log(`Targeting: ${API_URL}`);
        console.log('Authenticating...');

        // Try login
        let loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD })
        });

        if (!loginRes.ok) {
            console.log(`Login failed: ${loginRes.status}. Trying to seed admin...`);
            // Try to seed admin if login fails
            try {
                const seedRes = await fetch(`${API_URL}/auth/seed-admin`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                if (seedRes.ok) {
                    console.log('Admin user seeded.');
                    // Retry login
                    loginRes = await fetch(`${API_URL}/auth/login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: EMAIL, password: PASSWORD })
                    });
                } else {
                    const seedData = await seedRes.json();
                    console.log('Seed response:', seedData.message);
                }
            } catch (e) {
                console.log('Seed failed:', e.message);
            }
        }

        if (!loginRes.ok) {
            const errData = await loginRes.json();
            throw new Error(`Login failed: ${loginRes.status} ${errData.message}`);
        }

        const loginData = await loginRes.json();
        const token = loginData.token || (loginData.data && loginData.data.token);

        if (!token) {
            console.log('Login response:', loginData);
            throw new Error('No token found in login response');
        }

        console.log('Authenticated.');

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        console.log('Fetching data...');
        const [parcelsRes, leasesRes] = await Promise.all([
            fetch(`${API_URL}/parcels`, { headers }),
            fetch(`${API_URL}/leases`, { headers })
        ]);

        if (!parcelsRes.ok) throw new Error(`Failed to fetch parcels: ${parcelsRes.status}`);
        if (!leasesRes.ok) throw new Error(`Failed to fetch leases: ${leasesRes.status}`);

        const parcelsData = await parcelsRes.json();
        const leasesData = await leasesRes.json();

        const parcels = parcelsData.data;
        const leases = leasesData.data;

        console.log(`Found ${parcels.length} parcels and ${leases.length} leases.`);

        const leasedParcelIds = new Set();
        leases.forEach(l => {
            if (l.parcels) {
                l.parcels.forEach(p => {
                    // Handle both populated object and raw ID
                    const id = p.parcel && (p.parcel._id || p.parcel);
                    if (id) leasedParcelIds.add(id.toString());
                });
            }
        });

        console.log('Leased Parcel IDs:', Array.from(leasedParcelIds));

        let deletedCount = 0;
        for (const p of parcels) {
            if (!leasedParcelIds.has(p._id)) {
                console.log(`Deleting orphan parcel: ${p._id} (${p.parcelId})`);
                try {
                    const deleteRes = await fetch(`${API_URL}/parcels/${p._id}`, {
                        method: 'DELETE',
                        headers
                    });
                    if (deleteRes.ok) {
                        deletedCount++;
                    } else {
                        console.error(`Failed to delete parcel ${p._id}: ${deleteRes.status}`);
                    }
                } catch (err) {
                    console.error(`Failed to delete parcel ${p._id}:`, err.message);
                }
            }
        }

        console.log(`Cleanup complete. Deleted ${deletedCount} orphaned parcels.`);

    } catch (err) {
        console.error('Error:', err.message);
    }
}

cleanup();
