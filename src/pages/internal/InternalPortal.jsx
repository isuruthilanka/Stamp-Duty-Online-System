import React from 'react';
import { useAppContext } from '../AppContext';
import DashboardLayout from '../components/DashboardLayout';
import AdminPanel from '../components/AdminPanel';
import CommonDashboard from '../components/CommonDashboard';
import { Routes, Route, Navigate } from 'react-router-dom';
import ApplicationDetail from '../components/ApplicationDetail';
import StampDutyRegistration from '../components/StampDutyRegistration';
import StampDutyCalculator from '../components/StampDutyCalculator';
import OfficialOpinionForm from '../components/OfficialOpinionForm';
import OfficialDeficiencyNotice from '../components/OfficialDeficiencyNotice';
import DeficiencyCalculator from '../components/DeficiencyCalculator';

const InternalPortal = () => {
    const { currentUser, loading } = useAppContext();

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>🔄 Syncing with Department Registry...</div>;
    if (!currentUser) return <Navigate to="/department-login" replace />;
    if (currentUser.isExternal) return <Navigate to="/external" replace />;

    const isAdmin = currentUser.role === 'ADMIN';
    const isTaxOfficer = currentUser.role === 'TAX_OFF_OFFICER' || currentUser.role === 'TAX_OFFICER'; // Handle both naming variations if any

    return (
        <DashboardLayout>
            <Routes>
                {/* Main Dashboard - Tax Officer goes straight to Registration */}
                <Route path="/" element={
                    isAdmin ? <AdminPanel activeTab="DASHBOARD" /> :
                        isTaxOfficer ? <StampDutyRegistration /> : <CommonDashboard />
                } />

                {/* Admin Specific Routes */}
                {isAdmin && (
                    <>
                        <Route path="users" element={<AdminPanel activeTab="USERS" />} />
                        <Route path="approvals" element={<AdminPanel activeTab="APPROVALS" />} />
                        <Route path="fields" element={<AdminPanel activeTab="FIELDS" />} />
                        <Route path="applications" element={<CommonDashboard />} />
                    </>
                )}

                {/* Commissioner/DC/Assessor Specific Routes */}
                {!isAdmin && !isTaxOfficer && (
                    <Route path="applications" element={<CommonDashboard />} />
                )}

                <Route path="registration" element={<StampDutyRegistration />} />

                {/* Only non-Tax Officers can see the calculator */}
                {!isTaxOfficer && (
                    <>
                        <Route path="calculator" element={<StampDutyCalculator />} />
                        <Route path="deficiency-calculator" element={<DeficiencyCalculator />} />
                    </>
                )}

                <Route path="view/:id" element={<ApplicationDetail />} />
                <Route path="view/:id/opinion" element={<OfficialOpinionForm />} />
                <Route path="view/:id/deficiency-notice" element={<OfficialDeficiencyNotice />} />
                <Route path="*" element={<Navigate to="/internal" replace />} />
            </Routes>
        </DashboardLayout>
    );
};

export default InternalPortal;
