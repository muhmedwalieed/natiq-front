// Company manager / admin APIs (audit, RBAC matrix, CSV exports)

const BASE_URL = process.env.REACT_APP_API_URL || "";

function authHeaders() {
    const token = localStorage.getItem("agent_token");
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

async function handleJsonResponse(response) {
    if (response.status === 401) {
        localStorage.removeItem("agent_token");
        localStorage.removeItem("agent_user");
        window.location.href = "/";
        throw new Error("Unauthorized");
    }
    const payload = await response.json();
    if (!response.ok) {
        throw new Error(payload.message || "Request failed");
    }
    return payload.data !== undefined ? payload.data : payload;
}

async function handlePaginatedResponse(response) {
    if (response.status === 401) {
        localStorage.removeItem("agent_token");
        localStorage.removeItem("agent_user");
        window.location.href = "/";
        throw new Error("Unauthorized");
    }
    const payload = await response.json();
    if (!response.ok) {
        throw new Error(payload.message || "Request failed");
    }
    return {
        items: payload.data || [],
        pagination: payload.pagination || { page: 1, limit: 20, total: 0, pages: 0 },
    };
}

export const managementApi = {
    listUsers: async (params = {}) => {
        const q = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
        });
        const r = await fetch(`${BASE_URL}/api/v1/admin/users?${q.toString()}`, {
            headers: authHeaders(),
        });
        return handlePaginatedResponse(r);
    },

    createUser: async (body) => {
        const r = await fetch(`${BASE_URL}/api/v1/admin/users`, {
            method: "POST",
            headers: authHeaders(),
            body: JSON.stringify(body),
        });
        return handleJsonResponse(r);
    },

    updateUser: async (id, body) => {
        const r = await fetch(`${BASE_URL}/api/v1/admin/users/${id}`, {
            method: "PATCH",
            headers: authHeaders(),
            body: JSON.stringify(body),
        });
        return handleJsonResponse(r);
    },

    deactivateUser: async (id) => {
        const r = await fetch(`${BASE_URL}/api/v1/admin/users/${id}`, {
            method: "DELETE",
            headers: authHeaders(),
        });
        return handleJsonResponse(r);
    },

    getRbacMatrix: async () => {
        const r = await fetch(`${BASE_URL}/api/v1/admin/management/rbac-matrix`, {
            headers: authHeaders(),
        });
        return handleJsonResponse(r);
    },

    getAuditLogs: async (params = {}) => {
        const q = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== "") q.set(k, String(v));
        });
        const r = await fetch(
            `${BASE_URL}/api/v1/admin/management/audit-logs?${q.toString()}`,
            { headers: authHeaders() }
        );
        return handleJsonResponse(r);
    },

    /**
     * @param {"calls"|"tickets"|"analytics-summary"} kind
     * @param {{ from?: string, to?: string }} query ISO date strings
     */
    downloadExport: async (kind, query = {}) => {
        const q = new URLSearchParams();
        Object.entries(query).forEach(([k, v]) => {
            if (v) q.set(k, v);
        });
        const r = await fetch(
            `${BASE_URL}/api/v1/admin/management/exports/${kind}?${q.toString()}`,
            { headers: authHeaders() }
        );
        if (r.status === 401) {
            localStorage.removeItem("agent_token");
            window.location.href = "/";
            throw new Error("Unauthorized");
        }
        if (!r.ok) {
            const err = await r.json().catch(() => ({}));
            throw new Error(err.message || "Export failed");
        }
        return r.blob();
    },
};
