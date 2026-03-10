const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const initDb = () => {
    db.serialize(() => {
        // Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      role TEXT,
      designation TEXT,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT,
      region TEXT,
      status TEXT,
      isExternal INTEGER DEFAULT 0,
      adminOpinion TEXT,
      organization TEXT,
      referenceNo TEXT,
      initials TEXT,
      address TEXT,
      entityType TEXT,
      barNumber TEXT,
      relevantDetails TEXT,
      contactPersonName TEXT,
      contactPersonAddress TEXT,
      contactPersonReference TEXT,
      contactPersonNo TEXT,
      contactPersonEmail TEXT,
      telephone TEXT
    )`);

        // Applications Table
        db.run(`CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tempFileNo TEXT,
      permFileNo TEXT,
      category TEXT,
      status TEXT,
      date TEXT,
      time TEXT,
      region TEXT,
      applicant TEXT,
      assignedToId INTEGER,
      assignedToName TEXT,
      assignedToDesignation TEXT,
      fullData TEXT,
      lastActionComment TEXT,
      lastActionDate TEXT,
      opinionForm TEXT,
      paymentData TEXT,
      applicantId INTEGER
    )`);

        // Migration: Add paymentData if it doesn't exist
        db.run(`ALTER TABLE applications ADD COLUMN paymentData TEXT`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                // Ignore "duplicate column name" error, but log others
                console.log('Migration note:', err.message);
            }
        });

        // Fields Table
        db.run(`CREATE TABLE IF NOT EXISTS fields (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      isFile INTEGER DEFAULT 0
    )`);

        // Seed Users
        const users = [
            { name: 'Admin User', role: 'ADMIN', designation: 'Super Admin', username: 'admin', email: 'admin@revenue.gov.lk', password: 'admin', region: 'Head Office', status: 'ACTIVE', isExternal: 0 },
            { name: 'Commissioner of Revenue', role: 'COMMISSIONER', designation: 'Commissioner of Revenue', username: 'comm', email: 'comm@revenue.gov.lk', password: 'comm', region: 'Head Office', status: 'ACTIVE', isExternal: 0 },
            { name: 'Nimal Bandara', role: 'DC', designation: 'Deputy Commissioner', username: 'dc', email: 'dc@revenue.gov.lk', password: 'dc', region: 'Colombo Regional Office', status: 'ACTIVE', isExternal: 0 },
            { name: 'Kamal Perera', role: 'ASSESSOR', designation: 'Senior Assessor', username: 'assessor', email: 'assessor@revenue.gov.lk', password: 'assessor', region: 'Colombo Regional Office', status: 'ACTIVE', isExternal: 0 },
            { name: 'Saman Kumara', role: 'TAX_OFFICER', designation: 'Tax Officer', username: 'tax', email: 'tax@revenue.gov.lk', password: 'tax', region: 'Colombo Regional Office', status: 'ACTIVE', isExternal: 0 }
        ];

        users.forEach(u => {
            const hashedPassword = bcrypt.hashSync(u.password, 10);
            db.run(`INSERT OR IGNORE INTO users (
                name, role, designation, username, email, password, region, status, isExternal, organization,
                referenceNo, initials, address, entityType, relevantDetails, contactPersonName, contactPersonNo, contactPersonEmail, telephone
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    u.name, u.role, u.designation || null, u.username, u.email, hashedPassword, u.region, u.status, u.isExternal, u.organization || null,
                    u.referenceNo || null, u.initials || null, u.address || null, u.entityType || null, u.relevantDetails || null, u.contactPersonName || null, u.contactPersonNo || null, u.contactPersonEmail || null, u.telephone || null
                ]);
        });

        // Seed Initial Fields
        const initialFields = [
            { name: 'Personal Details', isFile: 0 },
            { name: 'Property Documents', isFile: 1 },
            { name: 'Payment Receipt', isFile: 1 },
        ];

        initialFields.forEach(field => {
            db.run(`INSERT OR IGNORE INTO fields (name, isFile) VALUES (?, ?)`, [field.name, field.isFile]);
        });

        // Ensure existing 'Commissioner General' is renamed to 'Commissioner of Revenue' and designation updated
        db.run(`UPDATE users SET name = 'Commissioner of Revenue' WHERE name = 'Commissioner General'`);
        db.run(`UPDATE users SET designation = 'Commissioner of Revenue' WHERE designation = 'CG' OR designation = 'CR'`);

        console.log('Database initialized and seeded.');
    });
};

module.exports = { db, initDb };
