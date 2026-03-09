const axios = require('axios');

const API_URL = 'http://localhost:5001/api';

async function runTests() {
    console.log('--- Starting Security Verification ---');

    // 1. Check Security Headers (Helmet)
    try {
        const response = await axios.get(`${API_URL}/login`);
        console.log('Check Security Headers:');
        console.log('  Content-Security-Policy:', response.headers['content-security-policy'] ? 'PASSED' : 'FAILED');
        console.log('  X-Frame-Options:', response.headers['x-frame-options'] ? 'PASSED' : 'FAILED');
        console.log('  X-Content-Type-Options:', response.headers['x-content-type-options'] ? 'PASSED' : 'FAILED');
    } catch (error) {
        console.log('Security Headers Check failed (Server likely down)');
    }

    // 2. Check RBAC (Unauthorized access to /api/users)
    try {
        await axios.get(`${API_URL}/users`);
        console.log('RBAC Check (Unauthorized /api/users): FAILED (Access granted without token)');
    } catch (error) {
        if (error.response && error.response.status === 401) {
            console.log('RBAC Check (Unauthorized /api/users): PASSED (401 Unauthorized)');
        } else {
            console.log('RBAC Check (Unauthorized /api/users): FAILED (Error:', error.response ? error.response.status : error.message, ')');
        }
    }

    // 3. Rate Limiting Check (Simulate multiple requests)
    console.log('Rate Limiting Check (Sending 105 requests)...');
    let suppressedCount = 0;
    for (let i = 0; i < 105; i++) {
        try {
            await axios.get(`${API_URL}/login`);
        } catch (error) {
            if (error.response && error.response.status === 429) {
                suppressedCount++;
            }
        }
    }
    // 4. Input Validation Check (Send invalid email)
    console.log('Input Validation Check (Invalid Email)...');
    try {
        await axios.post(`${API_URL}/users`, { name: 'Test', email: 'invalid-email' });
    } catch (error) {
        if (error.response && error.response.status === 400) {
            console.log('Input Validation Check: PASSED (400 Bad Request)');
        } else {
            console.log('Input Validation Check: FAILED (Error:', error.response ? error.response.status : error.message, ')');
        }
    }

    console.log('--- Security Verification Complete ---');
}

runTests();
