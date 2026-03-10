// Roles Management view. Table of roles with name, description, user count badge.
// Full front-end CRUD: add, edit, delete with confirm modal. 3-dot action menu (fixed position).
import { useState, useRef, useEffect } from "react";
import "../roles.css";

const INITIAL_ROLES = [
    { id: 1, name: "Super Admin",    description: "Full access to all system",            users: 2  },
    { id: 2, name: "Company Admin",  description: "Manage company settings",              users: 1  },
    { id: 3, name: "Manager",        description: "Oversee teams and projects analasyis", users: 5  },
    { id: 4, name: "Agent",          description: "Handle assign tasks",                  users: 1  },
    { id: 5, name: "viewer",         description: "Read only access to dashboards",       users: 20 },
];

const EMPTY_FORM = { name: "", description: "", users: 0 };

function RolesManagement() {
    const [roles, setRoles]       = useState(INITIAL_ROLES);
    const [openMenu, setOpenMenu] = useState(null);
    const [menuPos, setMenuPos]   = useState({ top: 0, left: 0 });
    const [modal, setModal]       = useState(null);
    const [selected, setSelected] = useState(null);
    const [form, setForm]         = useState(EMPTY_FORM);
    const menuRef = useRef(null);

    useEffect(() => {
        function handle(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenu(null);
        }
        document.addEventListener("mousedown", handle);
        return () => document.removeEventListener("mousedown", handle);
    }, []);

    function toggleMenu(e, id) {
        if (openMenu === id) { setOpenMenu(null); return; }
        const rect = e.currentTarget.getBoundingClientRect();
        setMenuPos({ top: rect.bottom + 4, left: rect.right - 120 });
        setOpenMenu(id);
    }

    function openAdd() { setForm(EMPTY_FORM); setModal("add"); }

    function openEdit(role) {
        setSelected(role);
        setForm({ name: role.name, description: role.description, users: role.users });
        setModal("edit"); setOpenMenu(null);
    }

    function openDelete(role) { setSelected(role); setModal("delete"); setOpenMenu(null); }

    function handleSave() {
        if (!form.name || !form.description) return;
        if (modal === "add") {
            setRoles(prev => [...prev, { ...form, id: Date.now(), users: 0 }]);
        } else {
            setRoles(prev => prev.map(r => r.id === selected.id ? { ...r, ...form } : r));
        }
        setModal(null);
    }

    function handleDelete() {
        setRoles(prev => prev.filter(r => r.id !== selected.id));
        setModal(null);
    }

    return (
        <div className="rm-wrapper">
            <div className="rm-header">
                <h1 className="rm-title">Roles Management</h1>
                <button className="rm-add-btn" onClick={openAdd}>+ Add Role</button>
            </div>

            <div className="rm-table-wrapper">
                <table className="rm-table">
                    <thead>
                        <tr><th>#</th><th>Role Name</th><th>Description</th><th>Users</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        {roles.length === 0 ? (
                            <tr><td colSpan={5} className="rm-empty">No roles found.</td></tr>
                        ) : roles.map((role, idx) => (
                            <tr key={role.id}>
                                <td>{idx + 1}</td>
                                <td>{role.name}</td>
                                <td>{role.description}</td>
                                <td><span className="rm-badge">{role.users} {role.users === 1 ? "User" : "Users"}</span></td>
                                <td className="rm-actions-cell">
                                    <button className="rm-dots-btn" onClick={e => toggleMenu(e, role.id)}>⋮</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {openMenu !== null && (
                <div className="rm-menu" ref={menuRef} style={{ top: menuPos.top, left: menuPos.left }}>
                    <button onClick={() => openEdit(roles.find(r => r.id === openMenu))}>Edit</button>
                    <button className="rm-menu-delete" onClick={() => openDelete(roles.find(r => r.id === openMenu))}>Delete</button>
                </div>
            )}

            {(modal === "add" || modal === "edit") && (
                <div className="rm-overlay" onClick={() => setModal(null)}>
                    <div className="rm-modal" onClick={e => e.stopPropagation()}>
                        <h2>{modal === "add" ? "Add Role" : "Edit Role"}</h2>
                        <div className="rm-modal-fields">
                            <div className="rm-modal-group"><label>Role Name</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Role name" /></div>
                            <div className="rm-modal-group"><label>Description</label><input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Description" /></div>
                        </div>
                        <div className="rm-modal-actions">
                            <button className="rm-modal-cancel" onClick={() => setModal(null)}>Cancel</button>
                            <button className="rm-modal-save" onClick={handleSave}>{modal === "add" ? "Add" : "Save"}</button>
                        </div>
                    </div>
                </div>
            )}

            {modal === "delete" && (
                <div className="rm-overlay" onClick={() => setModal(null)}>
                    <div className="rm-modal rm-modal-sm" onClick={e => e.stopPropagation()}>
                        <h2>Delete Role</h2>
                        <p>Are you sure you want to delete <strong>{selected?.name}</strong>?</p>
                        <div className="rm-modal-actions">
                            <button className="rm-modal-cancel" onClick={() => setModal(null)}>Cancel</button>
                            <button className="rm-modal-delete" onClick={handleDelete}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RolesManagement;
