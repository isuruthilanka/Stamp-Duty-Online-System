const nodemailer = require('nodemailer');
const { db } = require('./db');
const { sendWorkflowEmail } = require('./emailService');

// Mock Database responses
const originalAll = db.all;
const originalGet = db.get;

db.all = (sql, params, callback) => {
    if (sql.includes("role = 'DC'")) {
        return callback(null, [{ name: 'Regional DC', email: 'dc@example.com' }]);
    }
    originalAll.call(db, sql, params, callback);
};

db.get = (sql, params, callback) => {
    if (sql.includes("SELECT name, email FROM users WHERE id = ?")) {
        return callback(null, { name: 'Applicant User', email: 'applicant@example.com' });
    }
    if (sql.includes("SELECT email FROM users WHERE id = ?")) {
        return callback(null, { email: 'assessor@example.com' });
    }
    originalGet.call(db, sql, params, callback);
};

// Mock application data
const mockApp = {
    id: 1,
    tempFileNo: 'SD/OP/2026/001',
    permFileNo: 'WP/K/2026/123',
    category: 'OP',
    status: 'RECEIVED',
    region: 'Kalutara Regional Office',
    applicantId: 1,
    assignedToName: 'Test Assessor',
    fullData: JSON.stringify({
        grantors: [{ name: 'John Granter', email: 'granter@example.com' }],
        grantees: [{ name: 'Jane Grantee', email: 'grantee@example.com' }],
        notary: { name: 'Nicholas Notary', email: 'notary@example.com' }
    })
};

async function testEmails() {
    console.log('--- Starting Email Workflow Tests ---');

    // If no credentials, create a test account first
    if (!process.env.SMTP_USER) {
        console.log('Creating Ethereal test account...');
        const testAccount = await nodemailer.createTestAccount();
        process.env.SMTP_USER = testAccount.user;
        process.env.SMTP_PASS = testAccount.pass;
        console.log(`Test Account Created: ${testAccount.user}`);
    }

    try {
        const events = [
            'SUBMISSION',
            'ALLOCATED_TO_REGION',
            'ALLOCATED_TO_ASSESSOR',
            'PERM_FILE_NO_GENERATED',
            'PAYMENT_REQUESTED',
            'AMENDMENT_REQUIRED',
            'REJECTED',
            'COMPLETED'
        ];

        for (const event of events) {
            console.log(`Testing ${event} email...`);
            const info = await sendWorkflowEmail(event, mockApp, {
                totalPayable: 15000,
                reason: 'Documents incomplete',
                instructions: 'Please upload a clearer scan of the deed.',
                isDeficiency: false
            });

            if (info) {
                console.log(`  Sent: ${info.messageId}`);
                const previewUrl = nodemailer.getTestMessageUrl(info);
                if (previewUrl) console.log(`  Preview: ${previewUrl}`);
            }
        }

        console.log('--- Tests finished ---');
        process.exit(0);
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

testEmails();
