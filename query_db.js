const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Querying database for mislabeled attachments...');

db.all("SELECT id, tempFileNo, status, fullData, paymentData FROM applications", [], (err, rows) => {
    if (err) {
        console.error('Database error:', err);
        process.exit(1);
    }

    console.log(`Found ${rows.length} applications.`);

    rows.forEach(row => {
        let hasBuilding = false;
        if (row.fullData && row.fullData.includes('Photographs of the Building')) {
            hasBuilding = true;
        }

        if (hasBuilding) {
            console.log('---');
            console.log(`App ID: ${row.id} (${row.tempFileNo})`);
            console.log(`Status: ${row.status}`);
            try {
                const fullData = JSON.parse(row.fullData);
                console.log('Attachments:', JSON.stringify(fullData.attachments, null, 2));
                const paymentData = JSON.parse(row.paymentData || '[]');
                console.log('Payment Data:', JSON.stringify(paymentData, null, 2));
            } catch (e) {
                console.log('Parse error');
            }
        }
    });

    db.close();
});
