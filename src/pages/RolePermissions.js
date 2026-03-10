// Role-Permissions Management view. Select a role, see granted/revoked permissions.
// Click a permission to toggle it between granted and revoked.
import { useState } from "react";
import "../rolepermissions.css";

const ROLES = ["Super Admin", "Company admin", "Manager", "Agent", "Viewer"];

const INITIAL_DATA = {
    "Super Admin": {
        granted: ["view_single_permission", "delete_permission", "view_all_role_permissions", "update_role_permission", "create_role", "create_permission", "view_all_permission"],
        revoked:  ["update_permission", "create_role_permission", "view_single_role_permission"],
    },
    "Company admin": {
        granted: ["view_single_permission", "delete_permission", "view_all_role_permissions", "update_role_permission", "create_role"],
        revoked:  ["create_permission", "view_all_permission", "update_permission", "create_role_permission", "view_single_role_permission"],
    },
    "Manager": {
        granted: ["view_single_permission", "view_all_role_permissions"],
        revoked:  ["delete_permission", "update_role_permission", "create_role", "create_permission", "view_all_permission", "update_permission", "create_role_permission", "view_single_role_permission"],
    },
    "Agent": {
        granted: ["view_single_permission"],
        revoked:  ["delete_permission", "view_all_role_permissions", "update_role_permission", "create_role", "create_permission", "view_all_permission", "update_permission", "create_role_permission", "view_single_role_permission"],
    },
    "Viewer": {
        granted: ["view_single_permission", "view_all_permission", "view_all_role_permissions", "view_single_role_permission"],
        revoked:  ["delete_permission", "update_role_permission", "create_role", "create_permission", "update_permission", "create_role_permission"],
    },
};

function RolePermissions() {
    const [selectedRole, setSelectedRole] = useState("Company admin");
    const [data, setData] = useState(INITIAL_DATA);

    const { granted, revoked } = data[selectedRole];

    // Move permission to revoked
    function revoke(perm) {
        setData(prev => ({
            ...prev,
            [selectedRole]: {
                granted: prev[selectedRole].granted.filter(p => p !== perm),
                revoked: [...prev[selectedRole].revoked, perm],
            }
        }));
    }

    // Move permission to granted
    function grant(perm) {
        setData(prev => ({
            ...prev,
            [selectedRole]: {
                granted: [...prev[selectedRole].granted, perm],
                revoked: prev[selectedRole].revoked.filter(p => p !== perm),
            }
        }));
    }

    // Render permissions in a 2-column grid
    function renderGrid(perms, type) {
        const rows = [];
        for (let i = 0; i < perms.length; i += 2) {
            rows.push(
                <div className="rp-grid-row" key={i}>
                    <PermItem perm={perms[i]}   type={type} onRevoke={revoke} onGrant={grant} />
                    {perms[i + 1] && <PermItem perm={perms[i + 1]} type={type} onRevoke={revoke} onGrant={grant} />}
                    {!perms[i + 1] && <div className="rp-perm-placeholder" />}
                </div>
            );
        }
        return rows;
    }

    return (
        <div className="rp-outer">
            <div className="rp-card">
                <h1 className="rp-title">Role Permissions Management</h1>

                {/* Role selector */}
                <div className="rp-select-group">
                    <label className="rp-select-label">Select Role</label>
                    <div className="rp-select-wrapper">
                        <select
                            className="rp-select"
                            value={selectedRole}
                            onChange={e => setSelectedRole(e.target.value)}
                        >
                            {ROLES.map(r => <option key={r}>{r}</option>)}
                        </select>
                        <span className="rp-select-arrow">&#8964;</span>
                    </div>
                </div>

                {/* Granted */}
                <div className="rp-section-label rp-granted-label">Granted Permissions</div>
                <div className="rp-grid">
                    {granted.length === 0
                        ? <p className="rp-empty">No granted permissions.</p>
                        : renderGrid(granted, "granted")}
                </div>

                {/* Revoked */}
                <div className="rp-section-label rp-revoked-label">Revoked Permissions</div>
                <div className="rp-grid">
                    {revoked.length === 0
                        ? <p className="rp-empty">No revoked permissions.</p>
                        : renderGrid(revoked, "revoked")}
                </div>
            </div>
        </div>
    );
}

function PermItem({ perm, type, onRevoke, onGrant }) {
    return (
        <div
            className={`rp-perm-item ${type === "granted" ? "rp-perm-granted" : "rp-perm-revoked"}`}
            onClick={() => type === "granted" ? onRevoke(perm) : onGrant(perm)}
            title={type === "granted" ? "Click to revoke" : "Click to grant"}
        >
            <span className={`rp-perm-icon ${type === "granted" ? "rp-icon-granted" : "rp-icon-revoked"}`}>
                {type === "granted" ? "☑" : "✕"}
            </span>
            {perm}
        </div>
    );
}

export default RolePermissions;
