// Admins API (backoffice staff)
import http from '../http';

export function getDashboard() {
    return http.get('/admins/dashboard').then(r => r.data);
}

export function getProfile() {
    return http.get('/admins/profile').then(r => r.data);
}

export function getLookup() {
    return http.get('/admins/lookup').then(r => r.data);
}

export function listAdmins(params) {
    return http.get('/admins', { params }).then(r => r.data);
}

export function createAdmin({ name, email, roleId }) {
    return http.post('/admins', { name, email, roleId }).then(r => r.data);
}

export function updateAdminProfile(adminId, { name, roleId, status }) {
    return http.put(`/admins/${adminId}/profile`, { name, roleId, status }).then(r => r.data);
}
