const nodemailer = require('nodemailer');
const { db } = require('./db');
require('dotenv').config();

// Regional Office Contact Details
const OFFICE_DETAILS = {
    'Kalutara Regional Office': { address: 'No. 45, Main St, Kalutara', phone: '+94 34 222 1234', email: 'wp-kalutara@revenue.gov.lk' },
    'Colombo Regional Office': { address: 'No. 12, Kynsey Rd, Colombo 08', phone: '+94 11 269 5678', email: 'wp-colombo@revenue.gov.lk' },
    'Stamp Office': { address: 'Level 04, Revenue Bldg, Colombo 01', phone: '+94 11 234 5678', email: 'stamp-office@revenue.gov.lk' },
    'Maharagama Regional Office': { address: 'No. 210, High Level Rd, Maharagama', phone: '+94 11 285 4321', email: 'wp-maharagama@revenue.gov.lk' },
    'Gampaha Regional Office': { address: 'No. 88, Kandy Rd, Gampaha', phone: '+94 33 223 9876', email: 'wp-gampaha@revenue.gov.lk' }
};

/**
 * Lazily initializes and returns the email transporter.
 */
const getTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.ethereal.email',
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_PORT == 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};

/**
 * Extracts stakeholder emails from application fullData
 */
const getStakeholders = (application) => {
    let fullData = {};
    try {
        fullData = typeof application.fullData === 'string' ? JSON.parse(application.fullData) : (application.fullData || {});
    } catch (e) {
        console.error('Failed to parse fullData in getStakeholders:', e);
    }

    const stakeholders = {
        granters: [],
        grantees: [],
        notary: null,
        applicant: null,
        property: fullData.property || {}
    };

    if (fullData.grantors && Array.isArray(fullData.grantors)) {
        stakeholders.granters = fullData.grantors.filter(g => g.email).map(g => ({ name: g.name, email: g.email }));
    }

    if (fullData.grantees && Array.isArray(fullData.grantees)) {
        stakeholders.grantees = fullData.grantees.filter(g => g.email).map(g => ({ name: g.name, email: g.email }));
    }

    if (fullData.notary && fullData.notary.email) {
        stakeholders.notary = { name: fullData.notary.name, email: fullData.notary.email };
    }

    return stakeholders;
};

/**
 * Gets DC emails for a specific region
 */
const getRegionEmails = (region) => {
    return new Promise((resolve, reject) => {
        db.all(`SELECT name, email FROM users WHERE role = 'DC' AND region = ? AND status = 'ACTIVE'`, [region], (err, rows) => {
            if (err) return reject(err);
            resolve(rows || []);
        });
    });
};

/**
 * Gets Applicant email from users table
 */
const getApplicantEmail = (applicantId) => {
    return new Promise((resolve, reject) => {
        db.get(`SELECT name, email FROM users WHERE id = ?`, [applicantId], (err, row) => {
            if (err) return reject(err);
            resolve(row || null);
        });
    });
};

/**
 * Generates HTML email template
 */
const generateTemplate = (title, content, office = null, actionUrl = null, actionText = null) => {
    const officeHtml = office ? `
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 13px; color: #546e7a;">
            <strong style="color: #1a237e;">Regional Office Contact Details:</strong><br>
            ${office.address || 'Address N/A'}<br>
            <strong>Phone:</strong> ${office.phone || 'N/A'} | <strong>Email:</strong> ${office.email || 'N/A'}
        </div>
    ` : '';

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 20px auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            .header { background: linear-gradient(135deg, #1a237e 0%, #0d47a1 100%); color: white; padding: 30px; text-align: center; }
            .content { padding: 40px; background: white; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; }
            .btn { display: inline-block; padding: 12px 30px; background: #1a237e; color: white !important; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 25px; }
            .app-info { background: #f1f8e9; border-left: 4px solid #2e7d32; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .prop-info { background: #e3f2fd; border-left: 4px solid #0d47a1; padding: 15px; margin: 20px 0; border-radius: 4px; font-size: 14px; }
            .status-badge { display: inline-block; padding: 4px 12px; background: #e3f2fd; color: #0d47a1; border-radius: 20px; font-size: 14px; font-weight: 600; margin-bottom: 15px; }
            h2 { color: #1a237e; margin-top: 0; }
            p { margin-bottom: 15px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="https://upload.wikimedia.org/wikipedia/commons/5/5f/Emblem_of_Sri_Lanka.svg" alt="SL Emblem" width="60" style="margin-bottom: 15px;">
                <h1 style="margin:0; font-size: 20px; text-transform: uppercase;">Stamp Duty Online System</h1>
                <p style="margin:5px 0 0; font-size: 14px; opacity: 0.8;">Department of Revenue - Western Province</p>
            </div>
            <div class="content">
                <div class="status-badge">${title}</div>
                ${content}
                ${actionUrl ? `<a href="${actionUrl}" class="btn">${actionText || 'View Details'}</a>` : ''}
                ${officeHtml}
            </div>
            <div class="footer">
                <p style="margin: 0;">&copy; ${new Date().getFullYear()} Department of Revenue, Western Province. All Rights Reserved.</p>
                <p style="margin: 5px 0 0;">This is a system-generated email. Please do not reply to this address.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

/**
 * Main function to send workflow emails
 */
const sendWorkflowEmail = async (eventType, application, extraData = {}) => {
    try {
        const stakeholders = getStakeholders(application);
        const applicant = await getApplicantEmail(application.applicantId);
        const dcEmails = await getRegionEmails(application.region);
        const transporter = getTransporter();
        const office = OFFICE_DETAILS[application.region] || {};

        const appNo = application.permFileNo || application.tempFileNo;
        const regionInfo = `<strong>Regional Office:</strong> ${application.region}`;
        const prop = stakeholders.property;

        let subject = '';
        let recipients = [];
        let content = '';

        const appDetailsHtml = `
            <div class="app-info">
                <strong>File Number:</strong> ${appNo}<br>
                <strong>Category:</strong> ${application.category}<br>
                ${regionInfo}
            </div>
            <div class="prop-info">
                <strong style="color: #0d47a1;">Property Information:</strong><br>
                Plan No: ${prop.planNo || 'N/A'} | Lot No: ${prop.lotNo || 'N/A'}<br>
                Local Authority: ${prop.localAuthority || 'N/A'}
            </div>
        `;

        switch (eventType) {
            case 'SUBMISSION':
                subject = `Application Submitted Successfully - ${appNo}`;
                if (applicant) recipients.push(applicant.email);
                dcEmails.forEach(dc => recipients.push(dc.email));

                content = `
                    <h2>Submission Confirmation</h2>
                    <p>Dear Stakeholder,</p>
                    <p>Your application has been successfully submitted to the Stamp Duty Online System.</p>
                    ${appDetailsHtml}
                    <p>The application is now pending review by the Commissioner's Office.</p>
                `;
                break;

            case 'ALLOCATED_TO_REGION':
                subject = `Application Allocated to Local Region - ${appNo}`;
                dcEmails.forEach(dc => recipients.push(dc.email));

                content = `
                    <h2>Regional Office Allocation</h2>
                    <p>A new application has been allocated to your region for assessment.</p>
                    ${appDetailsHtml}
                    <p>Please assign this file to an assessor for further processing.</p>
                `;
                break;

            case 'ALLOCATED_TO_ASSESSOR':
                subject = `Application Received for Assessment - ${appNo}`;
                if (applicant) recipients.push(applicant.email);
                if (stakeholders.notary) recipients.push(stakeholders.notary.email);

                content = `
                    <h2>Assessor Assigned</h2>
                    <p>Dear Stakeholder,</p>
                    <p>Your application has been assigned to an assessor and is now in the assessment stage.</p>
                    ${appDetailsHtml}
                    <p><strong>Assigned Assessor:</strong> ${application.assignedToName || 'Internal Staff'}</p>
                `;
                break;

            case 'PERM_FILE_NO_GENERATED':
                subject = `Permanent File Number Generated - ${application.permFileNo}`;
                stakeholders.granters.forEach(s => recipients.push(s.email));
                stakeholders.grantees.forEach(s => recipients.push(s.email));
                if (stakeholders.notary) recipients.push(stakeholders.notary.email);

                content = `
                    <h2>File Identification Update</h2>
                    <p>Dear Stakeholder,</p>
                    <p>A permanent file number has been generated for your application.</p>
                    <div class="app-info">
                        <strong>Permanent File No:</strong> ${application.permFileNo}<br>
                        <strong>Temporary Reference:</strong> ${application.tempFileNo}
                    </div>
                    <div class="prop-info">
                        <strong style="color: #0d47a1;">Property Information:</strong><br>
                        Plan No: ${prop.planNo || 'N/A'} | Lot No: ${prop.lotNo || 'N/A'}<br>
                        Local Authority: ${prop.localAuthority || 'N/A'}
                    </div>
                    <p>Please use the permanent file number for all future correspondence.</p>
                `;
                break;

            case 'PAYMENT_REQUESTED':
                const isDeficiency = extraData.isDeficiency;
                subject = isDeficiency ? `Deficiency Payment Required - ${appNo}` : `Stamp Duty Payment Requested - ${appNo}`;
                if (applicant) recipients.push(applicant.email);

                const amount = extraData.totalPayable || application.totalPayable || 'N/A';

                content = `
                    <h2>Action Required: Payment</h2>
                    <p>Dear Applicant,</p>
                    <p>Your application has been reviewed and a payment is required to proceed.</p>
                    ${appDetailsHtml}
                    <div style="background: #fff3e0; border-left: 4px solid #ef6c00; padding: 15px; margin: 20px 0; border-radius: 4px;">
                        <strong>Total Amount Payable:</strong> LKR ${parseFloat(amount).toLocaleString()}<br>
                        <strong>Instructions:</strong> Please upload the payment slip through the portal.
                    </div>
                `;
                break;

            case 'PAYMENT_UPLOADED':
                subject = `Payment Slip Uploaded - ${appNo}`;
                dcEmails.forEach(dc => recipients.push(dc.email));
                // Also notify assigned assessor if exists
                if (application.assignedToId) {
                    db.get(`SELECT email FROM users WHERE id = ?`, [application.assignedToId], (err, user) => {
                        if (user && user.email) {
                            getTransporter().sendMail({
                                from: process.env.SMTP_FROM,
                                to: user.email,
                                subject,
                                html: generateTemplate('Payment Verification', `
                                    <h2>Verification Required</h2>
                                    <p>A payment slip has been uploaded for file ${appNo}. Please verify the payment.</p>
                                    ${appDetailsHtml}
                                `, office, `http://localhost:5173/internal/view/${application.id}`, 'Open Application')
                            }).catch(e => console.error('Delayed mail error:', e));
                        }
                    });
                }

                content = `
                    <h2>Payment Acknowledgment</h2>
                    <p>A payment slip has been uploaded and is waiting for verification.</p>
                    ${appDetailsHtml}
                `;
                break;

            case 'AMENDMENT_REQUIRED':
                subject = `Amendment Instructions - ${appNo}`;
                if (applicant) recipients.push(applicant.email);
                if (stakeholders.notary) recipients.push(stakeholders.notary.email);

                content = `
                    <h2>Amendment Required</h2>
                    <p>Dear Stakeholder,</p>
                    <p>Your application requires amendments before it can be processed further.</p>
                    ${appDetailsHtml}
                    <div style="background: #e1f5fe; border-left: 4px solid #0288d1; padding: 15px; margin: 20px 0; border-radius: 4px;">
                        <strong>Instructions:</strong><br>
                        ${extraData.instructions || 'Please follow the instructions provided in the portal.'}
                    </div>
                `;
                break;

            case 'REJECTED':
                subject = `Application Rejected - ${appNo}`;
                if (applicant) recipients.push(applicant.email);
                if (stakeholders.notary) recipients.push(stakeholders.notary.email);

                content = `
                    <h2 style="color: #d32f2f;">Rejection Notice</h2>
                    <p>Dear Stakeholder,</p>
                    <p>We regret to inform you that your application has been rejected for the following reason:</p>
                    <div style="background: #ffebee; border-left: 4px solid #d32f2f; padding: 15px; margin: 20px 0; border-radius: 4px;">
                        <strong>Reason:</strong> ${extraData.reason || 'Not specified'}<br>
                        <strong>Instructions:</strong> ${extraData.instructions || 'N/A'}
                    </div>
                    ${appDetailsHtml}
                `;
                break;

            case 'TRANSFERRED':
                subject = `File Transferred to Another Region - ${appNo}`;
                if (applicant) recipients.push(applicant.email);
                dcEmails.forEach(dc => recipients.push(dc.email)); // Notify new region

                content = `
                    <h2>File Transfer Information</h2>
                    <p>Dear Stakeholder,</p>
                    <p>Your application has been transferred to the ${application.region} office for further processing.</p>
                    ${appDetailsHtml}
                `;
                break;

            case 'COMPLETED':
                subject = `Application Completed / Opinion Issued - ${appNo}`;
                if (applicant) recipients.push(applicant.email);
                stakeholders.granters.forEach(s => recipients.push(s.email));
                stakeholders.grantees.forEach(s => recipients.push(s.email));
                if (stakeholders.notary) recipients.push(stakeholders.notary.email);

                content = `
                    <h2 style="color: #2e7d32;">Processing Complete</h2>
                    <p>Dear Stakeholder,</p>
                    <p>Your application has been successfully processed and finalized.</p>
                    ${appDetailsHtml}
                    <p>You can now download the finalized opinion/notice from the portal.</p>
                `;
                break;

            default:
                console.warn(`Unknown event type: ${eventType}`);
                return;
        }

        // De-duplicate recipients and filter empty ones
        const uniqueRecipients = [...new Set(recipients)].filter(e => e && e.includes('@'));

        if (uniqueRecipients.length === 0) {
            console.log(`No recipients found for event ${eventType} on app ${appNo}`);
            return;
        }

        const mailOptions = {
            from: process.env.SMTP_FROM || '"Stamp Duty System" <noreply@revenue.gov.lk>',
            to: uniqueRecipients.join(', '),
            subject: subject,
            html: generateTemplate(subject.split(' - ')[0], content, office, `http://localhost:5173/`, 'Login to Portal')
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent: ${eventType} for ${appNo}. MessageId: ${info.messageId}`);

        // Return preview URL if using Ethereal
        if (info.messageId && nodemailer.getTestMessageUrl(info)) {
            console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
        }

        return info;

    } catch (error) {
        console.error(`Error sending email for ${eventType}:`, error);
    }
};

module.exports = {
    sendWorkflowEmail,
    getStakeholders
};
