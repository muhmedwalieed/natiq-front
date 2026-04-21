import { useState, useRef, useEffect, useCallback } from "react";
import { managementApi } from "../../services/managementApi";
import "./Users.css";

const ROLE_FILTER_OPTIONS = [
    { label: "All roles", value: "" },
    { label: "Company manager", value: "company_manager" },
    { label: "Supervisor", value: "team_leader" },
    { label: "Agent", value: "agent" },
];

const ROLE_CREATE_OPTIONS = [
    { label: "Supervisor", value: "team_leader" },
    { label: "Agent", value: "agent" },
    { label: "Company manager", value: "company_manager" },
];

function roleLabel(role) {
    const map = {
        company_manager: "Company manager",
        team_leader: "Supervisor",
        agent: "Agent",
        platform_super_admin: "Platform admin",
        customer: "Customer",
    };
    return map[role] || role || "—";
}

function getStoredUser() {
    try {
        return JSON.parse(localStorage.getItem("agent_user") || "{}");
    } catch {
        return {};
    }
}

const emptyForm = () => ({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "agent",
    teamLeaderId: "",
    isActive: true,
});

function UsersManagement() {
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 1 });
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openMenu, setOpenMenu] = useState(null);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
    const [modal, setModal] = useState(null);
    const [selected, setSelected] = useState(null);
    const [form, setForm] = useState(emptyForm());
    const [teamLeaders, setTeamLeaders] = useState([]);
    const [teamLeaderLoadError, setTeamLeaderLoadError] = useState(null);
    const [saving, setSaving] = useState(false);
    const menuRef = useRef(null);
    const searchTimer = useRef(null);

    const loadTeamLeaders = useCallback(async () => {
        setTeamLeaderLoadError(null);
        try {
            const { items } = await managementApi.listUsers({ role: "team_leader", limit: 100, page: 1 });
            setTeamLeaders(items || []);
        } catch (e) {
            setTeamLeaders([]);
            const msg = e.message || "Could not load supervisors";
            setTeamLeaderLoadError(msg);
            console.error("Supervisor list:", msg);
        }
    }, []);

    const loadUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { items, pagination: p } = await managementApi.listUsers({
                page: pagination.page,
                limit: pagination.limit,
                role: roleFilter || undefined,
                search: debouncedSearch || undefined,
            });
            setUsers(items || []);
            if (p) setPagination((prev) => ({ ...prev, ...p }));
            await loadTeamLeaders();
        } catch (e) {
            setError(e.message || "Failed to load users");
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, roleFilter, debouncedSearch, loadTeamLeaders]);

    useEffect(() => {
        searchTimer.current = setTimeout(() => setDebouncedSearch(search.trim()), 400);
        return () => clearTimeout(searchTimer.current);
    }, [search]);

    useEffect(() => {
        setPagination((p) => {
            if (p.page <= 1) return p;
            return { ...p, page: 1 };
        });
    }, [debouncedSearch]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    useEffect(() => {
        if (modal === "add" || modal === "edit") {
            loadTeamLeaders();
        }
    }, [modal, loadTeamLeaders]);

    useEffect(() => {
        function handle(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenu(null);
        }
        document.addEventListener("mousedown", handle);
        return () => document.removeEventListener("mousedown", handle);
    }, []);

    function toggleMenu(e, id) {
        if (openMenu === id) {
            setOpenMenu(null);
            return;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        setMenuPos({ top: rect.bottom + 4, left: rect.right - 120 });
        setOpenMenu(id);
    }

    function openAdd() {
        setForm(emptyForm());
        setError(null);
        setModal("add");
    }

    function openAddSupervisor() {
        setForm({ ...emptyForm(), role: "team_leader" });
        setError(null);
        setModal("add");
    }

    function openAddAgent() {
        setForm({ ...emptyForm(), role: "agent" });
        setError(null);
        setModal("add");
    }

    function openEdit(user) {
        setSelected(user);
        const tlId = user.teamLeaderId?._id || user.teamLeaderId || "";
        setForm({
            name: user.name || "",
            email: user.email || "",
            phone: user.phone || "",
            password: "",
            role: user.role || "agent",
            teamLeaderId: tlId ? String(tlId) : "",
            isActive: user.isActive !== false,
        });
        setModal("edit");
        setOpenMenu(null);
    }

    function openDeactivate(user) {
        setSelected(user);
        setModal("delete");
        setOpenMenu(null);
    }

    async function handleSave() {
        if (!form.name || !form.email) return;
        setSaving(true);
        setError(null);
        try {
            if (modal === "add") {
                if (!form.password || form.password.length < 6) {
                    setError("Password must be at least 6 characters.");
                    setSaving(false);
                    return;
                }
                const body = {
                    name: form.name.trim(),
                    email: form.email.trim().toLowerCase(),
                    password: form.password,
                    phone: form.phone || null,
                    role: form.role,
                };
                if (form.role === "agent") {
                    body.teamLeaderId = form.teamLeaderId || null;
                }
                await managementApi.createUser(body);
            } else if (modal === "edit" && selected) {
                const body = {
                    name: form.name.trim(),
                    phone: form.phone || null,
                    role: form.role,
                    isActive: form.isActive,
                };
                if (form.role === "agent") {
                    body.teamLeaderId = form.teamLeaderId || null;
                } else {
                    body.teamLeaderId = null;
                }
                await managementApi.updateUser(selected._id, body);
            }
            setModal(null);
            await loadUsers();
        } catch (e) {
            setError(e.message || "Save failed");
        } finally {
            setSaving(false);
        }
    }

    async function handleDeactivate() {
        if (!selected?._id) return;
        setSaving(true);
        setError(null);
        try {
            await managementApi.deactivateUser(selected._id);
            setModal(null);
            await loadUsers();
        } catch (e) {
            setError(e.message || "Could not deactivate user");
        } finally {
            setSaving(false);
        }
    }

    const currentId = getStoredUser()._id || getStoredUser().id;
    const activeTeamLeaders = teamLeaders.filter((tl) => tl.isActive !== false);

    const addModalTitle =
        modal === "add"
            ? form.role === "team_leader"
                ? "Add supervisor"
                : form.role === "agent"
                  ? "Add agent"
                  : "Add user"
            : "Edit user";

    return (
        <div className="um-wrapper">
            <div className="um-header">
                <div>
                    <h1 className="um-title">Users</h1>
                </div>
                <div className="um-header-actions">
                    <button type="button" className="um-add-btn um-add-btn-secondary" onClick={openAddSupervisor}>
                        + Supervisor
                    </button>
                    <button type="button" className="um-add-btn" onClick={openAddAgent}>
                        + Agent
                    </button>
                </div>
            </div>

            {error && !modal && <div className="um-banner-error">{error}</div>}

            <div className="um-filters">
                <input
                    className="um-search"
                    placeholder="Search by name or email…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
                <div className="um-select-wrapper">
                    <select
                        className="um-select"
                        value={roleFilter}
                        onChange={(e) => {
                            setRoleFilter(e.target.value);
                            setPagination((p) => ({ ...p, page: 1 }));
                        }}
                    >
                        {ROLE_FILTER_OPTIONS.map((r) => (
                            <option key={r.label} value={r.value}>
                                {r.label}
                            </option>
                        ))}
                    </select>
                    <span className="um-select-arrow">&#8964;</span>
                </div>
            </div>

            {loading ? (
                <p className="um-loading">Loading users…</p>
            ) : (
                <>
                    <div className="um-table-wrapper">
                        <table className="um-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Role</th>
                                    <th>Supervisor</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="um-empty">
                                            No users match your filters.
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user, idx) => (
                                        <tr key={user._id}>
                                            <td>{(pagination.page - 1) * pagination.limit + idx + 1}</td>
                                            <td>{user.name}</td>
                                            <td>{user.email}</td>
                                            <td>{user.phone || "—"}</td>
                                            <td>{roleLabel(user.role)}</td>
                                            <td className="um-tl-cell">
                                                {user.role === "agent"
                                                    ? user.teamLeaderId?.name || "—"
                                                    : "—"}
                                            </td>
                                            <td>
                                                <span
                                                    className={`um-badge ${
                                                        user.isActive ? "um-active" : "um-idle"
                                                    }`}
                                                >
                                                    {user.isActive ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            <td className="um-actions-cell">
                                                <button
                                                    type="button"
                                                    className="um-dots-btn"
                                                    onClick={(e) => toggleMenu(e, user._id)}
                                                >
                                                    ⋮
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {pagination.pages > 1 && (
                        <div className="um-pagination">
                            <button
                                type="button"
                                className="um-page-btn"
                                disabled={pagination.page <= 1}
                                onClick={() =>
                                    setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))
                                }
                            >
                                Previous
                            </button>
                            <span className="um-page-info">
                                Page {pagination.page} of {pagination.pages} ({pagination.total} users)
                            </span>
                            <button
                                type="button"
                                className="um-page-btn"
                                disabled={pagination.page >= pagination.pages}
                                onClick={() =>
                                    setPagination((p) => ({
                                        ...p,
                                        page: Math.min(p.pages, p.page + 1),
                                    }))
                                }
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}

            {openMenu !== null && (
                <div className="um-menu" ref={menuRef} style={{ top: menuPos.top, left: menuPos.left }}>
                    <button type="button" onClick={() => openEdit(users.find((u) => u._id === openMenu))}>
                        Edit
                    </button>
                    <button
                        type="button"
                        className="um-menu-delete"
                        disabled={openMenu === currentId}
                        onClick={() => openDeactivate(users.find((u) => u._id === openMenu))}
                    >
                        Deactivate
                    </button>
                </div>
            )}

            {(modal === "add" || modal === "edit") && (
                <div className="um-overlay" onClick={() => !saving && setModal(null)}>
                    <div className="um-modal" onClick={(e) => e.stopPropagation()}>
                        <h2>{modal === "add" ? addModalTitle : "Edit user"}</h2>
                        {error && <div className="um-modal-error">{error}</div>}
                        <div className="um-modal-fields">
                            <div className="um-modal-group">
                                <label>Full name</label>
                                <input
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="Full name"
                                />
                            </div>
                            <div className="um-modal-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    placeholder="Email"
                                    disabled={modal === "edit"}
                                />
                            </div>
                            {modal === "add" && (
                                <div className="um-modal-group">
                                    <label>Password</label>
                                    <input
                                        type="password"
                                        value={form.password}
                                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                                        placeholder="Min. 6 characters"
                                    />
                                </div>
                            )}
                            <div className="um-modal-group">
                                <label>Phone</label>
                                <input
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    placeholder="Phone"
                                />
                            </div>
                            <div className="um-modal-group">
                                <label>Role</label>
                                <select
                                    value={form.role}
                                    onChange={(e) => setForm({ ...form, role: e.target.value, teamLeaderId: "" })}
                                >
                                    {ROLE_CREATE_OPTIONS.map((r) => (
                                        <option key={r.value} value={r.value}>
                                            {r.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {form.role === "agent" && (
                                <div className="um-modal-group">
                                    <label>Supervisor</label>
                                    <select
                                        value={form.teamLeaderId}
                                        onChange={(e) => setForm({ ...form, teamLeaderId: e.target.value })}
                                    >
                                        <option value="">— Unassigned —</option>
                                        {activeTeamLeaders.map((tl) => (
                                            <option key={tl._id} value={tl._id}>
                                                {tl.name} ({tl.email})
                                            </option>
                                        ))}
                                    </select>
                                    {teamLeaderLoadError && (
                                        <p className="um-field-hint um-field-hint-warn">{teamLeaderLoadError}</p>
                                    )}
                                </div>
                            )}
                            <div className="um-modal-group">
                                <label>Status</label>
                                <select
                                    value={form.isActive ? "active" : "inactive"}
                                    onChange={(e) =>
                                        setForm({ ...form, isActive: e.target.value === "active" })
                                    }
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                        <div className="um-modal-actions">
                            <button type="button" className="um-modal-cancel" disabled={saving} onClick={() => setModal(null)}>
                                Cancel
                            </button>
                            <button type="button" className="um-modal-save" disabled={saving} onClick={handleSave}>
                                {saving ? "Saving…" : modal === "add" ? "Add" : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {modal === "delete" && (
                <div className="um-overlay" onClick={() => !saving && setModal(null)}>
                    <div className="um-modal um-modal-sm" onClick={(e) => e.stopPropagation()}>
                        <h2>Deactivate user</h2>
                        <p>
                            This will deactivate <strong>{selected?.name}</strong>. They will no longer be able to sign in.
                        </p>
                        {error && <div className="um-modal-error">{error}</div>}
                        <div className="um-modal-actions">
                            <button type="button" className="um-modal-cancel" disabled={saving} onClick={() => setModal(null)}>
                                Cancel
                            </button>
                            <button type="button" className="um-modal-delete" disabled={saving} onClick={handleDeactivate}>
                                {saving ? "Working…" : "Deactivate"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UsersManagement;
