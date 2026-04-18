// Agent API Wrapper
// Uses fetch to communicate with the backend

const BASE_URL = process.env.REACT_APP_API_URL || '';
const API_BASE = `${BASE_URL}/api/v1/agent`;

// Get token from local storage
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
    
    // For 204 No Content
    if (response.status === 204) return null;

    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || data.error?.message || 'API Error');
    }
    return data.data || data;
};

export const agentApi = {
    // 1. Auth
    login: async (email, password, companySlug) => {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, companySlug })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || data.error?.message || 'Login failed');
        // Save the token on success internally
        if (data.data?.token) {
            localStorage.setItem('agent_token', data.data.token);
            localStorage.setItem('agent_user', JSON.stringify(data.data.user));
        }
        return data.data;
    },

    // 2. Profile
    getProfile: async () => {
        const res = await fetch(`${API_BASE}/profile`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },

    // 3. Dashboard
    getDashboardOverview: async (queryParams = '') => {
        const res = await fetch(`${API_BASE}/dashboard/overview${queryParams}`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },

    // 4. Tickets
    getTickets: async (queryParams = '') => { // status=open,in_progress,etc or queue=unassigned
        const res = await fetch(`${API_BASE}/tickets${queryParams}`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },

    getTicket: async (ticketId) => {
        const res = await fetch(`${API_BASE}/tickets/${ticketId}`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },

    getTicketMessages: async (ticketId) => {
        const res = await fetch(`${API_BASE}/tickets/${ticketId}/messages`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },

    claimTicket: async (ticketId) => {
        const res = await fetch(`${API_BASE}/tickets/${ticketId}/claim`, { 
            method: 'POST', 
            headers: getAuthHeaders() 
        });
        return handleResponse(res);
    },

    replyToTicket: async (ticketId, content) => {
        const res = await fetch(`${API_BASE}/tickets/${ticketId}/reply`, { 
            method: 'POST', 
            headers: getAuthHeaders(),
            body: JSON.stringify({ content })
        });
        return handleResponse(res);
    },

    resolveTicket: async (ticketId) => {
        const res = await fetch(`${API_BASE}/tickets/${ticketId}/resolve`, { 
            method: 'POST', 
            headers: getAuthHeaders() 
        });
        return handleResponse(res);
    },

    closeTicket: async (ticketId) => {
        const res = await fetch(`${API_BASE}/tickets/${ticketId}/close`, { 
            method: 'POST', 
            headers: getAuthHeaders() 
        });
        return handleResponse(res);
    },

    // 5. Chat History (if session ID known)
    getChatHistory: async (sessionId, queryParams = '') => {
        const res = await fetch(`${API_BASE}/chat-history/${sessionId}${queryParams}`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },

    // 6. QA Analytics
    getQAAutomatedResults: async (queryParams = '') => {
        const res = await fetch(`${BASE_URL}/api/v1/qa/results${queryParams}`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },

    // 7. Calls
    saveCall: async (callData) => {
        const res = await fetch(`${BASE_URL}/api/v1/calls`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(callData),
        });
        return handleResponse(res);
    },

    getCallHistory: async (queryParams = '') => {
        const res = await fetch(`${BASE_URL}/api/v1/calls/my-history${queryParams}`, { headers: getAuthHeaders() });
        return handleResponse(res);
    },

    uploadRecording: async (callId, blob) => {
        const formData = new FormData();
        formData.append('audio', blob, `${callId}.webm`);
        const token = localStorage.getItem('agent_token');
        const res = await fetch(`${BASE_URL}/api/v1/calls/upload-recording/${callId}`, {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            body: formData
        });
        return handleResponse(res);
    },
};
