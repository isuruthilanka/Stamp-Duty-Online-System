import React from 'react';
// Layout is already provided by parent route

const HelpDesk = () => {
    const faqs = [
        { q: "How do I track my application?", a: "You can track your application status directly from your dashboard under the 'Recent Applications' table. Statuses include RECEIVED, PROCESSING, and ISSUED." },
        { q: "What documents are required for Deed of Transfer?", a: "Typically, a draft deed, survey plan, and previous title deeds are required. Ensure all attachments are in PDF format and clear enough for assessment." },
        { q: "What documents are required for Deed of Gift?", a: "Typically, a draft deed, survey plan, and previous title deeds are required. Ensure all attachments are in PDF format and clear enough for assessment." },
        { q: "How long does the assessment take?", a: "Assessment usually takes 3-5 working days. Complex cases involving multi-property partitions may take longer." },
        { q: "Can I amend a rejected application?", a: "Yes. If an assessor requests an amendment, the status will change to 'AMENDMENT_REQUIRED'. You can click 'Edit' to update details and resubmit." },
        { q: "How do I make a payment?", a: "Once assessed, a Payment Voucher will be issued. You can pay at any branch of Bank of Ceylon or Peoples Bank and upload the payment receipt to the system." },
        { q: "I forgot my password, what should I do?", a: "Click on the 'Forgot Password' link on the login page. You will need to provide your registered email to receive reset instructions." }
    ];

    const supportCategories = [
        { title: "General Inquiries", phone: "+94 11 2077238", email: "info.revenue@wp.gov.lk" },
        { title: "Technical Support", phone: "+94 11 2077239", email: "support.tech@wp.gov.lk" },
        { title: "Payment Verification", phone: "+94 11 2077240", email: "payment.dept@wp.gov.lk" }
    ];

    return (
        <div className="dashboard-view" style={{ animation: 'slideInUp 0.6s ease-out' }}>
            <div className="content-header" style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#1a237e', margin: 0 }}>Support & Help Desk</h1>
                    <p style={{ opacity: 0.7, fontWeight: 500, color: '#64748b' }}>Official Assistance Portal for Stamp Duty Digital Services</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="stat-card" style={{ height: 'fit-content' }}>
                        <h3 style={{ color: 'var(--primary-color)', marginBottom: '1rem', fontSize: '1.1rem' }}>Support Channels</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            {supportCategories.map((cat, i) => (
                                <div key={i} style={{ borderBottom: i < 2 ? '1px solid #f0f0f0' : 'none', paddingBottom: i < 2 ? '0.8rem' : '0' }}>
                                    <p style={{ fontWeight: 700, margin: '0 0 0.2rem 0', fontSize: '0.9rem' }}>{cat.title}</p>
                                    <p style={{ color: 'var(--primary-color)', margin: 0, fontSize: '0.85rem' }}>📞 {cat.phone}</p>
                                    <p style={{ color: '#666', margin: 0, fontSize: '0.85rem' }}>✉️ {cat.email}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="stat-card" style={{ height: 'fit-content', background: '#f8f9fa' }}>
                        <h3 style={{ color: 'var(--primary-color)', marginBottom: '0.8rem', fontSize: '1rem' }}>Main Office</h3>
                        <p style={{ fontSize: '0.85rem', color: '#555', margin: 0, lineHeight: '1.4' }}>
                            Department of Revenue (Western Province),<br />
                            No. 204, Denzil Kobbekaduwa Mawatha,<br />
                            Battaramulla,<br />
                            Sri Lanka.
                        </p>
                    </div>
                </div>

                <div className="stat-card">
                    <h3 style={{ color: 'var(--primary-color)', marginBottom: '1.5rem', borderBottom: '2px solid var(--primary-color)', paddingBottom: '0.5rem', display: 'inline-block' }}>Frequently Asked Questions</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '1rem' }}>
                        {faqs.map((faq, idx) => (
                            <div key={idx} style={{ paddingBottom: '1rem', borderBottom: '1px solid #eee' }}>
                                <p style={{ fontWeight: 700, color: 'var(--primary-color)', marginBottom: '0.4rem', fontSize: '0.95rem' }}>Q: {faq.q}</p>
                                <p style={{ color: '#555', fontSize: '0.9rem', lineHeight: '1.6' }}>{faq.a}</p>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(212, 175, 55, 0.1)', borderRadius: '8px', borderLeft: '4px solid var(--accent-color)' }}>
                        <p style={{ margin: 0, fontWeight: 600, color: 'var(--primary-color)' }}>Need more help?</p>
                        <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.85rem', color: '#666' }}>If you cannot find the answer to your question, please contact our technical support hotline during office hours (8:30 AM - 4:15 PM).</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HelpDesk;
