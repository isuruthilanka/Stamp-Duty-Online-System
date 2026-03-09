const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { db, initDb } = require('./db');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { authenticateToken, authorize, maskUserData } = require('./securityMiddleware');
const { loginValidator, userValidator, applicationValidator } = require('./validators');
const { sendWorkflowEmail } = require('./emailService');

const app = express();
const PORT = process.env.PORT || 5001;
const SECRET_KEY = process.env.JWT_SECRET || 'CHANGE_THIS_STRONG_FALLBACK_KEY_xyz987abc!@#$%^&*()';

app.use(helmet());
app.use(morgan('combined')); // Structured logging
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Stricter rate limiter for login to prevent brute-force attacks
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // only 5 login attempts per IP per 15 minutes
    message: { error: 'Too many login attempts. Please try again in 15 minutes.' }
});

const resetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // only 5 password reset attempts per IP per 15 minutes
    message: { error: 'Too many password reset attempts. Please try again in 15 minutes.' }
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Database
initDb();

// --- AUTH ROUTES ---

app.post('/api/login', loginLimiter, loginValidator, (req, res, next) => {
    const { emailOrUsername, password } = req.body;

    db.get(`SELECT * FROM users WHERE email = ? OR username = ?`, [emailOrUsername, emailOrUsername], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (user.status !== 'ACTIVE') {
            return res.status(403).json({ error: 'Account is not yet active or has been deactivated.' });
        }

        const validPassword = bcrypt.compareSync(password, user.password);
        if (!validPassword) return res.status(401).json({ error: 'Invalid password' });

        const token = jwt.sign({ id: user.id, role: user.role, name: user.name, region: user.region }, SECRET_KEY, { expiresIn: '8h' });
        res.json({
            token,
            user: maskUserData({
                id: user.id,
                name: user.name,
                role: user.role,
                designation: user.designation,
                region: user.region,
                isExternal: user.isExternal === 1
            })
        });
    });
});

app.post('/api/forgot-password', resetLimiter, (req, res) => {
    const { email, referenceNo, newPassword } = req.body;

    if (!email || !referenceNo || !newPassword) {
        return res.status(400).json({ error: 'Email, NIC / Passport Number, and New Password are required.' });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    // Verify user exists and matches the reference no
    db.get(`SELECT id FROM users WHERE email = ? AND referenceNo = ?`, [email, referenceNo], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(404).json({ error: 'Invalid Email or NIC/Passport combination.' });

        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        db.run(`UPDATE users SET password = ? WHERE id = ?`, [hashedPassword, user.id], function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: 'Password reset successful' });
        });
    });
});

// --- USER ROUTES ---

app.get('/api/users', authenticateToken, authorize(['ADMIN', 'COMMISSIONER']), (req, res) => {
    db.all(`SELECT id, name, role, designation, username, email, region, status, isExternal FROM users WHERE status != 'DELETED'`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Endpoint for DC to get assessors in their region only
app.get('/api/assessors', authenticateToken, authorize(['DC', 'ADMIN', 'COMMISSIONER']), (req, res) => {
    let query, params;
    if (req.user.role === 'DC') {
        // DC can only see assessors in their own regional office
        query = `SELECT id, name, role, designation, region, status FROM users WHERE role = 'ASSESSOR' AND region = ? AND status = 'ACTIVE'`;
        params = [req.user.region];
    } else {
        // Admin/Commissioner can see all assessors
        query = `SELECT id, name, role, designation, region, status FROM users WHERE role = 'ASSESSOR' AND status = 'ACTIVE'`;
        params = [];
    }
    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/users', authenticateToken, authorize(['ADMIN']), userValidator, (req, res, next) => {
    const { name, role, designation, username, email, password, region, status, isExternal } = req.body;
    const hashedPassword = bcrypt.hashSync(password || 'password123', 10);

    db.run(`INSERT INTO users (name, role, designation, username, email, password, region, status, isExternal) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, role, designation, username, email, hashedPassword, region, status || 'ACTIVE', isExternal ? 1 : 0],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID, ...req.body, status: status || 'ACTIVE' });
        }
    );
});

app.patch('/api/users/:id', authenticateToken, authorize(['ADMIN']), (req, res) => {
    const { id } = req.params;
    const allowedFields = ['name', 'role', 'designation', 'username', 'email', 'password', 'region', 'status', 'isExternal'];
    const fields = Object.keys(req.body).filter(f => allowedFields.includes(f));
    const values = fields.map(f => req.body[f]);

    if (fields.length === 0) return res.status(400).json({ error: 'No valid fields provided' });

    if (fields.includes('password')) {
        const idx = fields.indexOf('password');
        values[idx] = bcrypt.hashSync(values[idx], 10);
    }

    const setClause = fields.map(f => `${f} = ?`).join(', ');
    db.run(`UPDATE users SET ${setClause} WHERE id = ?`, [...values, id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'User updated successfully' });
    });
});

app.delete('/api/users/:id', authenticateToken, authorize(['ADMIN']), (req, res) => {
    const { id } = req.params;
    db.run(`UPDATE users SET status = 'DELETED' WHERE id = ?`, [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'User deleted successfully' });
    });
});

// --- EXTERNAL USER ROUTES ---

app.get('/api/external-users', authenticateToken, authorize(['ADMIN', 'REGISTRAR']), (req, res) => {
    db.all(`SELECT id, name, username, email, role, organization, status, region FROM users WHERE isExternal = 1 AND status = 'PENDING'`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/external-users/register', (req, res) => {
    const {
        name, username, email, password, role, organization,
        referenceNo, address, initials, entityType, barNumber,
        relevantDetails, contactPersonName, contactPersonAddress,
        contactPersonReference, contactPersonNo, contactPersonEmail,
        telephone
    } = req.body;

    if (!password || password.trim() === '') {
        return res.status(400).json({ error: 'Password is required.' });
    }
    if (!username || !email) {
        return res.status(400).json({ error: 'Username and Email are required.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    db.run(`INSERT INTO users (
        name, username, email, password, role, organization, status, isExternal, region,
        referenceNo, address, initials, entityType, barNumber, relevantDetails,
        contactPersonName, contactPersonAddress, contactPersonReference,
        contactPersonNo, contactPersonEmail, telephone
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            name, username, email, hashedPassword, role, organization, 'PENDING', 1, 'External',
            referenceNo, address, initials, entityType, barNumber, relevantDetails,
            contactPersonName, contactPersonAddress, contactPersonReference,
            contactPersonNo, contactPersonEmail, telephone
        ],
        function (err) {
            if (err) {
                // Surface clear reasons like duplicate username/email
                if (err.message.includes('UNIQUE constraint failed: users.username')) {
                    return res.status(409).json({ error: 'This username is already taken. Please choose another.' });
                }
                if (err.message.includes('UNIQUE constraint failed: users.email')) {
                    return res.status(409).json({ error: 'This email is already registered. Please use a different email.' });
                }
                return res.status(500).json({ error: err.message });
            }
            res.json({ id: this.lastID, name, username, email, role, status: 'PENDING' });
        });
});

app.post('/api/external-users/:id/approve', authenticateToken, authorize(['ADMIN', 'REGISTRAR']), (req, res) => {
    const { id } = req.params;
    db.run(`UPDATE users SET status = 'ACTIVE' WHERE id = ?`, [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'External user approved' });
    });
});

// --- FIELD ROUTES ---

app.get('/api/fields', authenticateToken, (req, res) => {
    db.all(`SELECT * FROM fields`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows.map(r => ({ ...r, isFile: !!r.isFile })));
    });
});

app.post('/api/fields', authenticateToken, authorize(['ADMIN']), (req, res) => {
    const { name, isFile } = req.body;
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: 'Field name is required' });
    }
    db.run(`INSERT INTO fields (name, isFile) VALUES (?, ?)`, [name.trim(), isFile ? 1 : 0], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, name: name.trim(), isFile });
    });
});

app.delete('/api/fields/:id', authenticateToken, authorize(['ADMIN']), (req, res) => {
    const { id } = req.params;
    db.run(`DELETE FROM fields WHERE id = ?`, [id], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Field deleted' });
    });
});

// --- APPLICATION ROUTES ---

app.get('/api/applications', authenticateToken, (req, res) => {
    let query = `SELECT * FROM applications`;
    let params = [];

    // Server-side role-based data isolation
    if (req.user.role === 'ASSESSOR') {
        // Assessors only see applications explicitly assigned to them
        query += ` WHERE assignedToId = ?`;
        params.push(req.user.id);
    } else if (req.user.role === 'DC') {
        // Deputy Commissioners only see applications allocated to their regional office
        query += ` WHERE region = ?`;
        params.push(req.user.region);
    } else if (!['ADMIN', 'COMMISSIONER', 'TAX_OFFICER', 'REGISTRAR'].includes(req.user.role)) {
        // External users only see their own submitted applications
        query += ` WHERE applicantId = ?`;
        params.push(req.user.id);
    }
    // ADMIN, COMMISSIONER, TAX_OFFICER, REGISTRAR see all applications (no filter)

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const processed = rows.map(row => ({
            ...row,
            fullData: JSON.parse(row.fullData || '{}'),
            opinionForm: row.opinionForm ? JSON.parse(row.opinionForm) : null,
            paymentData: row.paymentData ? JSON.parse(row.paymentData) : []
        }));
        res.json(processed);
    });
});

app.post('/api/applications', authenticateToken, applicationValidator, (req, res, next) => {
    const { tempFileNo, category, status, date, time, region, applicant, fullData } = req.body;
    const fullDataStr = JSON.stringify(fullData || {});
    const applicantId = req.user.id; // Automatically assign the logged-in user as the applicant

    db.run(`INSERT INTO applications (tempFileNo, category, status, date, time, region, applicant, fullData, applicantId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [tempFileNo, category, status || 'RECEIVED', date, time, region, applicant, fullDataStr, applicantId],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            const newApp = { id: this.lastID, ...req.body, applicantId };

            // Trigger email notification
            sendWorkflowEmail('SUBMISSION', { ...newApp, fullData: req.body.fullData })
                .catch(e => console.error('Submission email failed:', e));

            res.json(newApp);
        }
    );
});

app.patch('/api/applications/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    // 1. Fetch current application to compare changes
    db.get(`SELECT * FROM applications WHERE id = ?`, [id], (err, oldApp) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!oldApp) return res.status(404).json({ error: 'Application not found' });

        // If external user, they can only edit their own applications
        const isInternal = ['ADMIN', 'COMMISSIONER', 'DC', 'ASSESSOR', 'TAX_OFFICER', 'REGISTRAR'].includes(req.user.role);
        if (!isInternal && oldApp.applicantId !== req.user.id) {
            return res.status(403).json({ error: 'Access denied: You can only modify your own applications' });
        }

        const allowedFields = ['tempFileNo', 'category', 'status', 'date', 'time', 'region', 'applicant', 'fullData', 'opinionForm', 'paymentData', 'assignedToId', 'assignedToName', 'assignedToDesignation', 'permFileNo', 'lastActionComment', 'lastActionDate'];
        const fields = Object.keys(updates).filter(f => allowedFields.includes(f));

        if (fields.length === 0) return res.status(400).json({ error: 'No valid fields provided' });

        const values = fields.map(f => {
            if (typeof updates[f] === 'object' && updates[f] !== null) return JSON.stringify(updates[f]);
            return updates[f];
        });

        // Store old values for comparison after update
        const oldStatus = oldApp.status;
        const oldPermFileNo = oldApp.permFileNo;
        const oldRegion = oldApp.region;
        const oldPaymentData = oldApp.paymentData ? JSON.parse(oldApp.paymentData) : [];

        const setClause = fields.map(f => `${f} = ?`).join(', ');

        db.run(`UPDATE applications SET ${setClause} WHERE id = ?`, [...values, id], function (err) {
            if (err) return res.status(500).json({ error: err.message });

            // Fetch updated application for email service
            db.get(`SELECT * FROM applications WHERE id = ?`, [id], async (err, updatedApp) => {
                if (err || !updatedApp) {
                    console.error('Failed to fetch updated application for email notification:', err);
                    return res.json({ message: 'Updated successfully, but email notification failed' });
                }

                const appData = { ...updatedApp };
                appData.fullData = updatedApp.fullData ? JSON.parse(updatedApp.fullData) : {};
                // opinionForm and paymentData are handled in appData for the email templates

                // WORKFLOW TRIGGERS
                try {
                    const newStatus = updates.status || oldStatus;

                    // 1. Allocation to Region
                    if (newStatus === 'ALLOCATED_TO_REGION' && oldStatus !== 'ALLOCATED_TO_REGION') {
                        await sendWorkflowEmail('ALLOCATED_TO_REGION', appData);
                    }

                    // 2. Received by Assessor
                    if (newStatus === 'ALLOCATED_TO_ASSESSOR' && oldStatus !== 'ALLOCATED_TO_ASSESSOR') {
                        await sendWorkflowEmail('ALLOCATED_TO_ASSESSOR', appData);
                    }

                    // 3. Perm File No Generated
                    if (updates.permFileNo && !oldPermFileNo) {
                        await sendWorkflowEmail('PERM_FILE_NO_GENERATED', appData);
                    }

                    // 4. Payment Requested / Opinion Issued
                    if (newStatus === 'OPINION_ISSUED' && oldStatus !== 'OPINION_ISSUED') {
                        const opinionForm = updates.opinionForm ? (typeof updates.opinionForm === 'string' ? JSON.parse(updates.opinionForm) : updates.opinionForm) : {};
                        await sendWorkflowEmail('PAYMENT_REQUESTED', appData, {
                            isDeficiency: opinionForm.isDeficiencyNotice,
                            totalPayable: opinionForm.totalPayable || opinionForm.stampDutyPayable
                        });
                    }

                    // 5. Payment Uploaded
                    if (updates.paymentData) {
                        const newPaymentData = Array.isArray(updates.paymentData) ? updates.paymentData : JSON.parse(updates.paymentData);
                        if (newPaymentData.length > oldPaymentData.length) {
                            await sendWorkflowEmail('PAYMENT_UPLOADED', appData);
                        }
                    }

                    // 6. Amendment Required
                    if ((newStatus === 'INFORMATION_REQUESTED' || newStatus === 'AMENDED' || newStatus === 'INCOMPLETE') && oldStatus !== newStatus) {
                        await sendWorkflowEmail('AMENDMENT_REQUIRED', appData, {
                            instructions: updates.lastActionComment || 'Please see the portal for details.'
                        });
                    }

                    // 7. Rejected
                    if (newStatus === 'REJECTED' && oldStatus !== 'REJECTED') {
                        await sendWorkflowEmail('REJECTED', appData, {
                            reason: updates.rejectionScenario || 'N/A',
                            instructions: updates.rejectionInstructions || 'N/A'
                        });
                    }

                    // 8. Transferred
                    if (updates.region && updates.region !== oldRegion) {
                        await sendWorkflowEmail('TRANSFERRED', appData);
                    }

                    // 9. Fully Paid / Completed
                    if (newStatus === 'FULLY_PAID' && oldStatus !== 'FULLY_PAID') {
                        await sendWorkflowEmail('COMPLETED', appData);
                    }
                } catch (emailErr) {
                    console.error('Workflow email processing failed:', emailErr);
                }

                res.json({ message: 'Updated successfully' });
            });
        });
    });
});

app.post('/api/applications/check-duplicate', authenticateToken, (req, res) => {
    const { planNo, lotNo, localAuthority } = req.body;

    if (!planNo || !lotNo || !localAuthority) {
        return res.status(400).json({ error: 'planNo, lotNo, and localAuthority are required' });
    }

    // Search for applications with matching land details that have an issued opinion
    // and were not submitted by the same user to avoid self-triggers (though the requirement doesn't explicitly state this, it's safer)
    // Actually, the requirement says "upon initiating a new opinion request", which is for Assessors/DC/Comm.
    // We want the most recent opinion.
    const query = `
        SELECT 
            id, permFileNo, tempFileNo, opinionForm, assignedToName, region, status
        FROM applications 
        WHERE status = 'OPINION_ISSUED' 
        AND json_extract(fullData, '$.property.planNo') = ? 
        AND json_extract(fullData, '$.property.lotNo') = ? 
        AND json_extract(fullData, '$.property.localAuthority') = ?
        ORDER BY id DESC LIMIT 1
    `;

    db.get(query, [planNo, lotNo, localAuthority], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.json({ found: false });

        let opinionData = {};
        try {
            opinionData = JSON.parse(row.opinionForm || '{}');
        } catch (e) {
            console.error('Failed to parse opinionForm:', e);
        }

        res.json({
            found: true,
            details: {
                id: row.id,
                fileNumber: row.permFileNo || row.tempFileNo,
                dateIssued: opinionData.issuedDate || 'N/A',
                propertyValue: opinionData.propertyValue || 'N/A',
                stampDutyAmount: opinionData.stampDutyPayable || 'N/A',
                assessorName: opinionData.issuedBy || row.assignedToName || 'N/A',
                officeDivision: row.region || 'N/A'
            }
        });
    });
});

// --- ERROR HANDLING ---

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'An internal server error occurred',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
