import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ExternalLogin from './pages/ExternalLogin';
import DepartmentLogin from './pages/DepartmentLogin';
import InternalPortal from './pages/InternalPortal';
import ExternalDashboard from './pages/ExternalDashboard';
import NewApplication from './pages/NewApplication';
import ExternalLayout from './components/ExternalLayout';
import ExternalRegistration from './pages/ExternalRegistration';
import ExternalApplicationDetail from './pages/ExternalApplicationDetail';
import ForgotPassword from './pages/ForgotPassword';
import HelpDesk from './pages/HelpDesk';
import MyProfile from './pages/MyProfile';
import NotFound from './pages/NotFound';
import { Navigate } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<ExternalLogin />} />
        <Route path="/register" element={<ExternalRegistration />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/department-login" element={<DepartmentLogin />} />
        <Route path="/internal/*" element={<InternalPortal />} />

        {/* Unified External Portal Routes */}
        <Route path="/external" element={<ExternalLayout />}>
          <Route index element={<ExternalDashboard />} />
          <Route path="new-application" element={<NewApplication />} />
          <Route path="edit-application/:id" element={<NewApplication />} />
          <Route path="view-application/:id" element={<ExternalApplicationDetail />} />
          <Route path="help" element={<HelpDesk />} />
          <Route path="profile" element={<MyProfile />} />
        </Route>

        <Route path="/new-application" element={<Navigate to="/external/new-application" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
