const BASE_URL = process.env.REACT_APP_API_URL || '';
const API_BASE = `${BASE_URL}/api/v1/owner`;

const getAuthHeaders = () => {
    const token = localStorage.getItem('agent_token'); 
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
};

const handleResponse = async (response) => {
    if (response.status === 401) {
        localStorage.removeItem('agent_token');
        window.location.href = '/'; 
        throw new Error('Unauthorized');
    }
    
    if (response.status === 204) return null;

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || data.error?.message || 'API Error');
    }
    return data.data || data;
};

export const ownerApi = {
    getDashboardSummary: async () => {
        const res = await fetch(`${API_BASE}/dashboard`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },

    getCompanySettings: async () => {
        const res = await fetch(`${API_BASE}/settings`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },

    updateCompanySettings: async (settingsData) => {
        const res = await fetch(`${API_BASE}/settings`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(settingsData)
        });
        return handleResponse(res);
    },

    updateTelegramWebhook: async (webhookUrl) => {
        const res = await fetch(`${API_BASE}/telegram/webhook`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ webhookUrl })
        });
        return handleResponse(res);
    },

    listManagers: async () => {
        const res = await fetch(`${API_BASE}/managers`, { headers: getAuthHeaders() });
        return handleResponse(res);
    }
};
