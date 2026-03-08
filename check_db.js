const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'server', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('Checking database at:', dbPath);

db.all("PRAGMA table_info(applications)", (err, rows) => {
    if (err) {
        console.error('Error checking schema:', err);
    } else {
        console.log('Columns in applications table:');
        rows.forEach(row => {
            console.log(`- ${row.name} (${row.type})`);
        });

        const hasOpinionForm = rows.some(r => r.name === 'opinionForm');
        console.log('\nHas opinionForm column:', hasOpinionForm);
    }
    db.close();
});
