const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Step 1: Check and add applicantId column if needed
    db.all(`PRAGMA table_info(applications)`, [], (err, cols) => {
        if (err) return console.error('PRAGMA error:', err.message);

        const hasCol = cols.some(c => c.name === 'applicantId');
        console.log('applicantId column exists:', hasCol);

        const continueWithBackfill = () => {
            // Step 2: List external users
            db.all(`SELECT id, name, username FROM users WHERE isExternal = 1`, [], (err, users) => {
                if (err) return console.error('Users error:', err.message);
                console.log('\nExternal Users found:', users.length);
                users.forEach(u => console.log(`  ID: ${u.id}, Name: ${u.name}, Username: ${u.username}`));

                // Step 3: Show current apps
                db.all(`SELECT id, tempFileNo, applicant, applicantId FROM applications`, [], (err, apps) => {
                    if (err) return console.error('Apps error:', err.message);
                    console.log('\nCurrent Applications:');
                    apps.forEach(a => console.log(`  ID: ${a.id}, Applicant: "${a.applicant}", applicantId: ${a.applicantId}`));

                    // Step 4: Backfill
                    let pending = 0;
                    users.forEach(user => {
                        const matched = apps.filter(a => a.applicant === user.name && !a.applicantId);
                        if (matched.length > 0) {
                            pending++;
                            db.run(`UPDATE applications SET applicantId = ? WHERE applicant = ? AND (applicantId IS NULL OR applicantId = 0)`,
                                [user.id, user.name],
                                function (err) {
                                    if (err) console.error(`Update error for ${user.name}:`, err.message);
                                    else console.log(`\nBackfilled ${this.changes} app(s) for "${user.name}" (ID: ${user.id})`);
                                    pending--;
                                    if (pending <= 0) finish();
                                }
                            );
                        }
                    });
                    if (pending === 0) finish();
                });
            });
        };

        if (!hasCol) {
            console.log('Adding applicantId column...');
            db.run(`ALTER TABLE applications ADD COLUMN applicantId INTEGER`, (err) => {
                if (err) return console.error('ALTER error:', err.message);
                console.log('Column added successfully.');
                continueWithBackfill();
            });
        } else {
            continueWithBackfill();
        }
    });
});

function finish() {
    setTimeout(() => {
        const db2 = new sqlite3.Database(dbPath);
        db2.all(`SELECT id, tempFileNo, applicant, applicantId FROM applications`, [], (err, rows) => {
            if (err) return console.error(err.message);
            console.log('\n=== Final State ===');
            rows.forEach(r => console.log(`  ID: ${r.id}, Applicant: "${r.applicant}", applicantId: ${r.applicantId}`));
            db2.close();
        });
    }, 200);
}
