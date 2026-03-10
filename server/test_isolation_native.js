const http = require('http');

const API_PORT = 5001;
const API_HOST = 'localhost';

function request(options, body) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = data ? JSON.parse(data) : {};
                    resolve({ status: res.statusCode, data: parsed, headers: res.headers });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data, headers: res.headers });
                }
            });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function startTests() {
    console.log('--- Data Isolation Verification (HTTP Native) ---');
    try {
        // 1. User A (Sunil)
        console.log('User A (sunil): Logging in...');
        const loginA = await request({
            hostname: API_HOST, port: API_PORT, path: '/api/login', method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { emailOrUsername: 'sunil', password: 'sunil' });

        if (loginA.status !== 200) throw new Error(`Login A failed: ${JSON.stringify(loginA.data)}`);
        const tokenA = loginA.data.token;
        const idA = loginA.data.user.id;
        console.log(`User A (ID: ${idA}) logged in.`);

        // 2. User B (ABC Finance)
        console.log('User B (abc): Logging in...');
        const loginB = await request({
            hostname: API_HOST, port: API_PORT, path: '/api/login', method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }, { emailOrUsername: 'abc', password: 'abc' });

        if (loginB.status !== 200) throw new Error(`Login B failed: ${JSON.stringify(loginB.data)}`);
        const tokenB = loginB.data.token;
        const idB = loginB.data.user.id;
        console.log(`User B (ID: ${idB}) logged in.`);

        // 3. User A Fetches Apps
        console.log('User A: Fetching applications...');
        const resA = await request({
            hostname: API_HOST, port: API_PORT, path: '/api/applications', method: 'GET',
            headers: { 'Authorization': `Bearer ${tokenA}` }
        });
        const appsA = Array.isArray(resA.data) ? resA.data : [];
        console.log(`User A sees ${appsA.length} apps.`);
        const aIsolation = appsA.every(a => a.applicantId === idA);
        console.log(`Data Isolation (User A): ${aIsolation ? 'PASSED' : 'FAILED'}`);

        // 4. User B Fetches Apps
        console.log('User B: Fetching applications...');
        const resB = await request({
            hostname: API_HOST, port: API_PORT, path: '/api/applications', method: 'GET',
            headers: { 'Authorization': `Bearer ${tokenB}` }
        });
        const appsB = Array.isArray(resB.data) ? resB.data : [];
        console.log(`User B sees ${appsB.length} apps.`);
        const bIsolation = appsB.every(a => a.applicantId === idB);
        console.log(`Data Isolation (User B): ${bIsolation ? 'PASSED' : 'FAILED'}`);

        // 5. User B tries unauthorized update
        if (appsA.length > 0) {
            const appId = appsA[0].id;
            console.log(`User B: Attempting to update User A's app ${appId}...`);
            const updateResult = await request({
                hostname: API_HOST, port: API_PORT, path: `/api/applications/${appId}`, method: 'PATCH',
                headers: { 'Authorization': `Bearer ${tokenB}`, 'Content-Type': 'application/json' }
            }, { status: 'TAMPERED' });

            console.log(`Ownership Check (PATCH): ${updateResult.status === 403 ? 'PASSED (Protected)' : 'FAILED (' + updateResult.status + ')'}`);
        } else {
            console.log('Skipping ownership check: User A has no applications.');
        }

        console.log('--- Verification Complete ---');
    } catch (e) {
        console.error('Error during test:', e.message);
    }
}

startTests();
