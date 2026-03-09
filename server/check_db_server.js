const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.all("PRAGMA table_info(applications)", (err, rows) => {
    if (err) {
        console.error('Error:', err);
        process.exit(1);
    } else {
        const columns = rows.map(r => r.name);
        console.log('--- SCHEMA CHECK ---');
        console.log('Columns:', columns.join(', '));

        const missing = [];
        const expected = [
            'opinionForm',
            'assignedToId',
            'assignedToName',
            'assignedToDesignation',
            'permFileNo',
            'lastActionComment',
            'lastActionDate',
            'applicantId'
        ];

        expected.forEach(col => {
            if (!columns.includes(col)) {
                missing.push(col);
            }
        });

        if (missing.length > 0) {
            console.log('MISSING COLUMNS:', missing.join(', '));
        } else {
            console.log('ALL EXPECTED COLUMNS FOUND');
        }
        process.exit(0);
    }
});
