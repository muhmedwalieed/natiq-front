// RBAC matrix from backend (read-only). Same labels as server role keys.
import { useState, useEffect } from "react";
import "./RolePermissions.css";
import { managementApi } from "../../services/managementApi";

const RESOURCE_LABELS = {
    companies: "Companies",
    users: "Users",
    knowledge_base: "Knowledge base",
    chat: "Chat",
    tickets: "Tickets",
    embeddings: "Embeddings",
    analytics: "Analytics",
    audit_log: "Audit log",
};

const ACTION_LABELS = {
    create: "Create",
    read: "Read",
    update: "Update",
    delete: "Delete",
    manage: "Manage",
};

function RolePermissions() {
    const [matrix, setMatrix] = useState(null);
    const [roleLabels, setRoleLabels] = useState({});
    const [selectedRole, setSelectedRole] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await managementApi.getRbacMatrix();
                if (cancelled) return;
                setMatrix(data.matrix || {});
                setRoleLabels(data.roleLabels || {});
                const keys = Object.keys(data.matrix || {});
                if (keys.length) setSelectedRole(keys[0]);
            } catch (e) {
                if (!cancelled) setError(e.message || "Could not load permissions");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const roleKeys = matrix ? Object.keys(matrix) : [];
    const perms = matrix && selectedRole ? matrix[selectedRole] : null;

    return (
        <div className="rp-outer">
            <div className="rp-card">
                <h1 className="rp-title">Role permissions</h1>
                <p className="rp-intro">
                    Permissions are enforced on the API. This view mirrors the live RBAC matrix (read-only).
                </p>

                {loading && <p className="rp-muted">Loading…</p>}
                {error && <p className="rp-error">{error}</p>}

                {!loading && !error && matrix && (
                    <>
                        <div className="rp-select-group">
                            <label className="rp-select-label">Role</label>
                            <div className="rp-select-wrapper">
                                <select
                                    className="rp-select"
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                >
                                    {roleKeys.map((rk) => (
                                        <option key={rk} value={rk}>
                                            {roleLabels[rk] || rk}
                                        </option>
                                    ))}
                                </select>
                                <span className="rp-select-arrow">&#8964;</span>
                            </div>
                        </div>

                        <div className="rp-matrix-wrap">
                            <table className="rp-matrix">
                                <thead>
                                    <tr>
                                        <th>Resource</th>
                                        <th>Allowed actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {perms &&
                                        Object.entries(perms).map(([resource, actions]) => (
                                            <tr key={resource}>
                                                <td>{RESOURCE_LABELS[resource] || resource}</td>
                                                <td>
                                                    {actions.map((a) => (
                                                        <span key={a} className="rp-action-pill">
                                                            {ACTION_LABELS[a] || a}
                                                        </span>
                                                    ))}
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default RolePermissions;
