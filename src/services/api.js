const API_URL = '/api';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const api = {
    async login(emailOrUsername, password) {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emailOrUsername, password })
        });
        if (!res.ok) throw new Error('Login failed');
        const data = await res.json();
        localStorage.setItem('token', data.token);
        return data.user;
    },

    async resetPassword(email, referenceNo, newPassword) {
        const res = await fetch(`${API_URL}/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, referenceNo, newPassword })
        });
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error || 'Password reset failed. Please check your details.');
        }
        return res.json();
    },

    async getUsers() {
        const res = await fetch(`${API_URL}/users`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch users');
        return res.json();
    },

    async getAssessors() {
        const res = await fetch(`${API_URL}/assessors`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch assessors');
        return res.json();
    },


    async addUser(user) {
        const res = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(user)
        });
        if (!res.ok) throw new Error('Failed to add user');
        return res.json();
    },

    async updateUser(id, data) {
        const res = await fetch(`${API_URL}/users/${id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to update user');
        return res.json();
    },

    async deleteUser(id) {
        const res = await fetch(`${API_URL}/users/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to delete user');
        return res.json();
    },

    async getExternalUsers() {
        const res = await fetch(`${API_URL}/external-users`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch external users');
        return res.json();
    },

    async registerExternalUser(data) {
        const res = await fetch(`${API_URL}/external-users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error || 'Registration failed. Please check your details and try again.');
        }
        return res.json();
    },

    async approveExternalUser(id) {
        const res = await fetch(`${API_URL}/external-users/${id}/approve`, {
            method: 'POST',
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('Approval failed');
        return res.json();
    },

    async getFields() {
        const res = await fetch(`${API_URL}/fields`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch fields');
        return res.json();
    },

    async addField(field) {
        const res = await fetch(`${API_URL}/fields`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(field)
        });
        if (!res.ok) throw new Error('Failed to add field');
        return res.json();
    },

    async deleteField(id) {
        const res = await fetch(`${API_URL}/fields/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to delete field');
        return res.json();
    },

    async getApplications() {
        const res = await fetch(`${API_URL}/applications`, { headers: getHeaders() });
        if (!res.ok) throw new Error('Failed to fetch applications');
        return res.json();
    },

    async addApplication(app) {
        const res = await fetch(`${API_URL}/applications`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(app)
        });
        if (!res.ok) throw new Error('Failed to add application');
        return res.json();
    },

    async updateApplication(id, data) {
        const res = await fetch(`${API_URL}/applications/${id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to update application');
        return res.json();
    },

    async checkDuplicateOpinion(params) {
        const res = await fetch(`${API_URL}/applications/check-duplicate`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(params)
        });
        if (!res.ok) throw new Error('Failed to check for duplicate opinions');
        return res.json();
    },

    logout() {
        localStorage.removeItem('token');
    }
};
