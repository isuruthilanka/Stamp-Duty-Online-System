const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.all("SELECT id, fullData, paymentData FROM applications", [], (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }

    rows.forEach(row => {
        console.log(`\n=== App ID: ${row.id} ===`);
        try {
            const data = JSON.parse(row.fullData);
            console.log('--- Attachments ---');
            if (Array.isArray(data.attachments)) {
                data.attachments.forEach(att => {
                    console.log(`  Name: "${att.name}" | File: "${att.fileName}"`);
                });
            } else if (data.attachments) {
                Object.entries(data.attachments).forEach(([name, att]) => {
                    console.log(`  Name: "${name}" | File: "${att.fileName || att.name || att}"`);
                });
            }

            console.log('--- Payment Slips ---');
            const payments = JSON.parse(row.paymentData || '[]');
            payments.forEach(p => {
                console.log(`  Amt: ${p.amount} | Slip: "${p.slipName}"`);
            });

        } catch (e) {
            console.log('Parse error');
        }
    });
    db.close();
});
