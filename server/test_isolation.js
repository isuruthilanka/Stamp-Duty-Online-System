const axios = require('axios');

const API_URL = 'http://localhost:5001/api';

async function testIsolation() {
    console.log('--- Starting Data Isolation Verification ---');

    try {
        // 1. Login as User A (Sunil)
        console.log('Logging in as User A (sunil)...');
        const loginA = await axios.post(`${API_URL}/login`, { emailOrUsername: 'sunil', password: 'sunil' });
        const tokenA = loginA.data.token;
        const idA = loginA.data.user.id;
        console.log(`User A ID: ${idA}`);

        // 2. Login as User B (ABC Finance)
        console.log('Logging in as User B (abc)...');
        const loginB = await axios.post(`${API_URL}/login`, { emailOrUsername: 'abc', password: 'abc' });
        const tokenB = loginB.data.token;
        const idB = loginB.data.user.id;
        console.log(`User B ID: ${idB}`);

        // 3. Check Applications for User A
        console.log('Fetching applications for User A...');
        const appsA = await axios.get(`${API_URL}/applications`, { headers: { Authorization: `Bearer ${tokenA}` } });
        console.log(`User A sees ${appsA.data.length} applications.`);
        const allAOwn = appsA.data.every(app => app.applicantId === idA);
        console.log('Only User A\'s applications visible:', allAOwn ? 'PASSED' : 'FAILED');

        // 4. Check Applications for User B
        console.log('Fetching applications for User B...');
        const appsB = await axios.get(`${API_URL}/applications`, { headers: { Authorization: `Bearer ${tokenB}` } });
        console.log(`User B sees ${appsB.data.length} applications.`);
        const allBOwn = appsB.data.every(app => app.applicantId === idB);
        console.log('Only User B\'s applications visible:', allBOwn ? 'PASSED' : 'FAILED');

        // 5. User B tries to update User A's application
        if (appsA.data.length > 0) {
            const appIdA = appsA.data[0].id;
            console.log(`User B attempting to update User A's application (ID: ${appIdA})...`);
            try {
                await axios.patch(`${API_URL}/applications/${appIdA}`,
                    { status: 'TAMPERED' },
                    { headers: { Authorization: `Bearer ${tokenB}` } }
                );
                console.log('Ownership Check (Unauthorized Update): FAILED (Access granted)');
            } catch (error) {
                if (error.response && error.response.status === 403) {
                    console.log('Ownership Check (Unauthorized Update): PASSED (403 Forbidden)');
                } else {
                    console.log('Ownership Check (Unauthorized Update): FAILED (Error:', error.response ? error.response.status : error.message, ')');
                }
            }
        }

        // 6. External User creates a new application
        console.log('User B creating a new application...');
        const newApp = await axios.post(`${API_URL}/applications`, {
            tempFileNo: 'TEST-ISOLATION-001',
            category: 'OP',
            status: 'RECEIVED',
            date: '2026-03-03',
            time: '12:00 PM',
            region: 'External',
            applicant: 'User B',
            fullData: {}
        }, { headers: { Authorization: `Bearer ${tokenB}` } });
        console.log('Application creation: PASSED');

        // 7. Verify User A STILL cannot see User B's new application
        console.log('Verifying User A cannot see User B\'s new application...');
        const appsA_after = await axios.get(`${API_URL}/applications`, { headers: { Authorization: `Bearer ${tokenA}` } });
        const canSeeNew = appsA_after.data.some(app => app.id === newApp.data.id);
        console.log('Data Isolation (New Record):', !canSeeNew ? 'PASSED' : 'FAILED');

    } catch (error) {
        console.error('Verification failed:', error.message);
        if (error.response) {
            console.error('Data:', error.response.data);
        }
    }

    console.log('--- Data Isolation Verification Complete ---');
}

testIsolation();
