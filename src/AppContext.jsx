import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from './services/api';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

// Centralized Regional Configuration
export const REGIONS = [
    'Kalutara Regional Office',
    'Colombo Regional Office',
    'Stamp Office',
    'Maharagama Regional Office',
    'Gampaha Regional Office'
];

export const OFFICE_CODES = [
    { label: 'WP(K) - Kalutara', value: 'WP(K)', region: 'Kalutara Regional Office' },
    { label: 'WP(C) - Colombo', value: 'WP(C)', region: 'Colombo Regional Office' },
    { label: 'WP(S) - Stamp Office', value: 'WP(S)', region: 'Stamp Office' },
    { label: 'WP(M) - Maharagama', value: 'WP(M)', region: 'Maharagama Regional Office' },
    { label: 'WP(G) - Gampaha', value: 'WP(G)', region: 'Gampaha Regional Office' },
];

export const AppProvider = ({ children }) => {
    const [users, setUsers] = useState([]);
    const [assessors, setAssessors] = useState([]);
    const [applications, setApplications] = useState([]);
    const [externalUsers, setExternalUsers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fields, setFields] = useState([]);
    const [calculatorData, setCalculatorData] = useState({ marketValue: 0, dutyAmount: 0 });

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                // Fetch data independently so if one fails (like unauthorized access to users list), others still load
                const [userRes, appRes, fieldRes, extRes, assessorRes] = await Promise.allSettled([
                    api.getUsers(),
                    api.getApplications(),
                    api.getFields(),
                    api.getExternalUsers(),
                    api.getAssessors()
                ]);

                if (userRes.status === 'fulfilled') setUsers(userRes.value);
                if (appRes.status === 'fulfilled') setApplications(appRes.value);
                if (fieldRes.status === 'fulfilled') setFields(fieldRes.value);
                if (extRes.status === 'fulfilled') setExternalUsers(extRes.value);
                if (assessorRes.status === 'fulfilled') setAssessors(assessorRes.value);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (emailOrUsername, password, portalType = 'INTERNAL') => {
        try {
            const user = await api.login(emailOrUsername, password);

            // Validate portal access
            if (portalType === 'INTERNAL' && user.isExternal) {
                return { success: false, error: 'External users cannot access the Department Portal.' };
            }
            if (portalType === 'EXTERNAL' && !user.isExternal) {
                return { success: false, error: 'Department staff cannot access the External Portal.' };
            }

            setCurrentUser(user);
            localStorage.setItem('user', JSON.stringify(user));
            fetchInitialData();
            return { success: true };
        } catch (error) {
            console.error('Login failed:', error);
            return { success: false, error: 'Invalid credentials. Please try again.' };
        }
    };

    const externalLogin = async (emailOrUsername, password) => {
        return login(emailOrUsername, password, 'EXTERNAL');
    };

    const logout = () => {
        api.logout();
        setCurrentUser(null);
        localStorage.removeItem('user');
        setUsers([]);
        setAssessors([]);
        setApplications([]);
        setExternalUsers([]);
        setFields([]);
    };

    const addUser = async (user) => {
        try {
            const newUser = await api.addUser(user);
            setUsers([...users, newUser]);
            return newUser;
        } catch (error) {
            console.error('Error adding user:', error);
        }
    };

    const editUser = async (updatedUser) => {
        try {
            await api.updateUser(updatedUser.id, updatedUser);
            setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
        } catch (error) {
            console.error('Error editing user:', error);
        }
    };

    const deleteUser = async (id) => {
        try {
            await api.deleteUser(id);
            setUsers(users.map(u => u.id === id ? { ...u, status: 'DELETED', isDeleted: true } : u));
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };

    const requestRegistration = async (userData) => {
        try {
            const newUser = await api.registerExternalUser(userData);
            setExternalUsers(prev => [...prev, newUser]);
            return { success: true, user: newUser };
        } catch (error) {
            console.error('Error requesting registration:', error);
            return { success: false, error: error.message };
        }
    };

    const approveExternal = async (id) => {
        try {
            await api.approveExternalUser(id);
            fetchInitialData(); // Refresh both lists
        } catch (error) {
            console.error('Error approving external user:', error);
        }
    };

    const addField = async (name, isFile) => {
        try {
            const newField = await api.addField({ name, isFile });
            setFields([...fields, newField]);
        } catch (error) {
            console.error('Error adding field:', error);
        }
    };

    const deleteField = async (id) => {
        try {
            await api.deleteField(id);
            setFields(fields.filter(f => f.id !== id));
        } catch (error) {
            console.error('Error deleting field:', error);
        }
    };

    const sendOpinionToExternalUser = async (id, opinion) => {
        try {
            await api.updateUser(id, { adminOpinion: opinion });
            setExternalUsers(externalUsers.map(u =>
                u.id === id ? { ...u, adminOpinion: opinion } : u
            ));
        } catch (error) {
            console.error('Error sending opinion:', error);
        }
    };

    const addApplication = async (app) => {
        try {
            let processedFullData = { ...app.fullData };
            if (processedFullData.attachments) {
                if (Array.isArray(processedFullData.attachments)) {
                    // Already an array of attachment objects — use as-is (valid format from prior saved data)
                    // Filter out corrupt string entries (e.g. label strings saved instead of file objects)
                    processedFullData.attachments = processedFullData.attachments.filter(
                        att => att && typeof att === 'object' && att.name && att.fileName
                    );
                } else {
                    // Object format: keys are document labels, values are file objects
                    processedFullData.attachments = Object.entries(processedFullData.attachments)
                        .filter(([name, fileInfo]) => {
                            // Skip entries where key is a numeric index (corrupted array-as-object)
                            if (!isNaN(name)) return false;
                            // Skip entries where value is just a string label (not a real file)
                            if (!fileInfo || typeof fileInfo === 'string') return false;
                            // Must have actual file data or a URL
                            const hasData = fileInfo.data || fileInfo.url;
                            return hasData;
                        })
                        .map(([name, fileInfo], index) => ({
                            id: `att-${Date.now()}-${index}`,
                            name: name,
                            fileName: fileInfo.name || fileInfo.fileName || name,
                            url: fileInfo.data || fileInfo.url || ''
                        }));
                }
            }

            const now = new Date();
            const timestamp = now.toLocaleString('en-GB', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            });

            const newApp = await api.addApplication({
                ...app,
                fullData: processedFullData,
                tempFileNo: generateTempFileNo(app.category),
                date: now.toISOString().split('T')[0],
                time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                applicant: currentUser?.name || 'External User',
                activityLog: [{
                    action: 'Application Submitted',
                    date: timestamp,
                    user: currentUser?.name || 'External User',
                    comment: 'Initial submission'
                }]
            });
            setApplications([newApp, ...applications]);
            return newApp;
        } catch (error) {
            console.error('Error adding application:', error);
        }
    };

    const updateApplication = async (id, updatedData) => {
        try {
            let processedData = { ...updatedData };
            if (processedData.fullData && processedData.fullData.attachments) {
                processedData.fullData = { ...processedData.fullData };
                const atts = processedData.fullData.attachments;
                if (Array.isArray(atts)) {
                    // Already an array — filter out any corrupt string entries
                    processedData.fullData.attachments = atts.filter(
                        att => att && typeof att === 'object' && att.name && att.fileName
                    );
                } else {
                    // Object format: keys are document labels, values are file objects
                    processedData.fullData.attachments = Object.entries(atts)
                        .filter(([name, fileInfo]) => {
                            if (!isNaN(name)) return false;
                            if (!fileInfo || typeof fileInfo === 'string') return false;
                            const hasData = fileInfo.data || fileInfo.url;
                            return hasData;
                        })
                        .map(([name, fileInfo], index) => ({
                            id: `att-${Date.now()}-${index}`,
                            name: name,
                            fileName: fileInfo.name || fileInfo.fileName || name,
                            url: fileInfo.data || fileInfo.url || ''
                        }));
                }
            }

            await api.updateApplication(id, processedData);
            setApplications(applications.map(app =>
                app.id === id ? { ...app, ...processedData } : app
            ));
        } catch (error) {
            console.error('Error updating application:', error);
        }
    };

    const issueOpinionForm = async (id, formDetails) => {
        const app = applications.find(a => a.id === id);
        const now = new Date().toLocaleString('en-GB');
        const action = formDetails.lastModifiedBy ? 'Official Opinion Form Amended (Admin)' : 'Official Opinion Form Issued';

        const newLogEntry = {
            action: action,
            date: now,
            user: currentUser?.name || 'Assessor',
            comment: formDetails.opinionComment || action
        };

        return await updateApplication(id, {
            status: 'OPINION_ISSUED',
            opinionForm: JSON.stringify({
                ...formDetails,
                issuedDate: formDetails.issuedDate || new Date().toLocaleDateString(),
                issuedBy: formDetails.issuedBy || currentUser?.name || 'Assessor',
                designation: formDetails.designation || currentUser?.designation || 'Department Officer'
            }),
            lastActionComment: action,
            lastActionDate: now,
            activityLog: [...(app?.activityLog || []), newLogEntry]
        });
    };


    const checkDuplicateOpinion = async (params) => {
        try {
            return await api.checkDuplicateOpinion(params);
        } catch (error) {
            console.error('Error checking for duplicate opinion:', error);
            return { found: false };
        }
    };

    const updateAppStatus = (id, status, comment = '') => {
        const app = applications.find(a => a.id === id);
        const now = new Date().toLocaleString('en-GB');
        const newLogEntry = {
            action: `Status Changed to ${status.replace(/_/g, ' ')}`,
            date: now,
            user: currentUser?.name || 'System',
            comment: comment
        };

        updateApplication(id, {
            status,
            lastActionComment: comment,
            lastActionDate: now,
            activityLog: [...(app?.activityLog || []), newLogEntry]
        });
    };

    const distributeToRegion = (id, region) => {
        const app = applications.find(a => a.id === id);
        const now = new Date().toLocaleString('en-GB');
        const newLogEntry = {
            action: 'Allocated to Region',
            date: now,
            user: currentUser?.name || 'Commissioner',
            comment: `Region: ${region}`
        };

        updateApplication(id, {
            status: 'ALLOCATED_TO_REGION',
            region,
            lastActionComment: `Distributed to ${region}`,
            lastActionDate: now,
            activityLog: [...(app?.activityLog || []), newLogEntry]
        });
    };

    const assignToAssessor = (id, assessorId, permFileNo) => {
        const app = applications.find(a => a.id === id);
        const assessor = users.find(u => u.id === parseInt(assessorId))
            || assessors.find(u => u.id === parseInt(assessorId));
        const now = new Date().toLocaleString('en-GB');
        const newLogEntry = {
            action: 'Assigned to Assessor',
            date: now,
            user: currentUser?.name || 'Regional Admin',
            comment: `Assessor: ${assessor ? assessor.name : 'Unknown'}`
        };

        updateApplication(id, {
            status: 'ALLOCATED_TO_ASSESSOR',
            assignedToId: assessorId,
            assignedToName: assessor ? assessor.name : 'Unknown',
            assignedToDesignation: assessor ? assessor.designation : '',
            permFileNo,
            lastActionComment: `Forwarded to Assessor ${assessor?.name}`,
            lastActionDate: now,
            activityLog: [...(app?.activityLog || []), newLogEntry]
        });
    };

    const addApplicationComment = (id, comment) => {
        const app = applications.find(a => a.id === id);
        const now = new Date().toLocaleString('en-GB');
        const newLogEntry = {
            action: 'Internal Comment Added',
            date: now,
            user: currentUser?.name || 'System',
            comment: comment
        };

        updateApplication(id, {
            lastActionComment: comment,
            lastActionDate: now,
            activityLog: [...(app?.activityLog || []), newLogEntry]
        });
    };

    const rejectApplication = (id, scenario, instructions, allowResubmission = false) => {
        const app = applications.find(a => a.id === id);
        const now = new Date().toLocaleString('en-GB');
        const newLogEntry = {
            action: 'Application Rejected',
            date: now,
            user: currentUser?.name || 'Assessor',
            comment: `Scenario: ${scenario}. Instructions: ${instructions}. Resubmission: ${allowResubmission ? 'Allowed' : 'Not Allowed'}`
        };

        updateApplication(id, {
            status: 'REJECTED',
            rejectionScenario: scenario,
            rejectionInstructions: instructions,
            allowResubmission,
            lastActionComment: `Rejected: ${scenario}`,
            lastActionDate: now,
            activityLog: [...(app?.activityLog || []), newLogEntry]
        });
    };

    const transferApplication = (id, newRegion, reason) => {
        const app = applications.find(a => a.id === id);
        const now = new Date().toLocaleString('en-GB');
        const newLogEntry = {
            action: 'Application Transferred',
            date: now,
            user: currentUser?.name || 'Officer',
            comment: `Transferred to ${newRegion}. Reason: ${reason}`
        };

        updateApplication(id, {
            region: newRegion,
            status: 'ALLOCATED_TO_REGION', // Reset to regional processing at new office
            lastActionComment: `Transferred to ${newRegion}`,
            lastActionDate: now,
            activityLog: [...(app?.activityLog || []), newLogEntry]
        });
    };

    const closeApplication = (id, reason) => {
        const app = applications.find(a => a.id === id);
        const now = new Date().toLocaleString('en-GB');
        const newLogEntry = {
            action: 'Application Permanently Closed',
            date: now,
            user: currentUser?.name || 'Officer',
            comment: reason
        };

        updateApplication(id, {
            status: 'CLOSED',
            lastActionComment: 'File Permanently Closed',
            lastActionDate: now,
            activityLog: [...(app?.activityLog || []), newLogEntry]
        });
    };

    const generateTempFileNo = (category) => {
        const year = new Date().getFullYear();
        const relevantApps = applications.filter(app =>
            app.category === category &&
            app.tempFileNo &&
            app.tempFileNo.includes(`/${year}/`)
        );

        let nextSeq = 1;
        if (relevantApps.length > 0) {
            const sequences = relevantApps.map(app => {
                const parts = app.tempFileNo.split('/');
                const lastPart = parts[parts.length - 1];
                return parseInt(lastPart, 10);
            }).filter(num => !isNaN(num));

            if (sequences.length > 0) {
                nextSeq = Math.max(...sequences) + 1;
            }
        }

        return `SD/${category}/${year}/${nextSeq.toString().padStart(3, '0')}`;
    };

    const contextValue = React.useMemo(() => ({
        users, assessors, externalUsers, applications, fields, currentUser, loading,
        REGIONS, OFFICE_CODES,
        login, externalLogin, logout, addUser, deleteUser, editUser,
        requestRegistration, approveExternal, sendOpinionToExternalUser, addField, deleteField,
        updateAppStatus, distributeToRegion, assignToAssessor, addApplicationComment,
        rejectApplication, transferApplication, closeApplication,
        addApplication, updateApplication, issueOpinionForm, checkDuplicateOpinion,
        calculatorData, setCalculatorData
    }), [
        users, assessors, externalUsers, applications, fields, currentUser, loading,
        calculatorData
    ]);

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
};
