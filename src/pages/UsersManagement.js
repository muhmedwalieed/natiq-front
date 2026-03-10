// Users Management view. Search, filter by role, add/edit/delete users.
// Full front-end: mock data, search, role filter, 3-dot actions menu (fixed position).
import { useState, useRef, useEffect } from "react";
import "../users.css";

const ROLES = ["All Roles", "Super admin", "Admin", "User"];

const INITIAL_USERS = [
    { id: 1, name: "Mohamed Waleed",  email: "Mohamed22@gmail.com",  phone: "01068774561", role: "Super admin", status: "Active" },
    { id: 2, name: "Mohamed Haitham", email: "Moziad921@gmail.com",   phone: "01068779873", role: "Super admin", status: "Idle"   },
    { id: 3, name: "Mohamed Waleed",  email: "Mohamed22@gmail.com",  phone: "01068774561", role: "Admin",       status: "Active" },
    { id: 4, name: "Mohamed Haitham", email: "Moziad921@gmail.com",   phone: "01068779873", role: "User",        status: "Idle"   },
    { id: 5, name: "Mohamed Waleed",  email: "Mohamed22@gmail.com",  phone: "01068774561", role: "Super admin", status: "Active" },
];

const EMPTY_FORM = { name: "", email: "", phone: "", role: "User", status: "Active" };

function UsersManagement() {
    const [users, setUsers]           = useState(INITIAL_USERS);
    const [search, setSearch]         = useState("");
    const [roleFilter, setRoleFilter] = useState("All Roles");
    const [openMenu, setOpenMenu]     = useState(null);
    const [menuPos, setMenuPos]       = useState({ top: 0, left: 0 });
    const [modal, setModal]           = useState(null);
    const [selected, setSelected]     = useState(null);
    const [form, setForm]             = useState(EMPTY_FORM);
    const menuRef = useRef(null);

    useEffect(() => {
        function handle(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenu(null);
        }
        document.addEventListener("mousedown", handle);
        return () => document.removeEventListener("mousedown", handle);
    }, []);

    const filtered = users.filter(u => {
        const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                            u.email.toLowerCase().includes(search.toLowerCase());
        const matchRole   = roleFilter === "All Roles" || u.role === roleFilter;
        return matchSearch && matchRole;
    });

    function toggleMenu(e, id) {
        if (openMenu === id) { setOpenMenu(null); return; }
        const rect = e.currentTarget.getBoundingClientRect();
        setMenuPos({ top: rect.bottom + 4, left: rect.right - 120 });
        setOpenMenu(id);
    }

    function openAdd() { setForm(EMPTY_FORM); setModal("add"); }

    function openEdit(user) {
        setSelected(user);
        setForm({ name: user.name, email: user.email, phone: user.phone, role: user.role, status: user.status });
        setModal("edit"); setOpenMenu(null);
    }

    function openDelete(user) { setSelected(user); setModal("delete"); setOpenMenu(null); }

    function handleSave() {
        if (!form.name || !form.email || !form.phone) return;
        if (modal === "add") {
            setUsers(prev => [...prev, { ...form, id: Date.now() }]);
        } else {
            setUsers(prev => prev.map(u => u.id === selected.id ? { ...u, ...form } : u));
        }
        setModal(null);
    }

    function handleDelete() {
        setUsers(prev => prev.filter(u => u.id !== selected.id));
        setModal(null);
    }

    return (
        <div className="um-wrapper">
            <div className="um-header">
                <h1 className="um-title">Users Management</h1>
                <button className="um-add-btn" onClick={openAdd}>+ Add User</button>
            </div>

            <div className="um-filters">
                <input className="um-search" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
                <div className="um-select-wrapper">
                    <select className="um-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                        {ROLES.map(r => <option key={r}>{r}</option>)}
                    </select>
                    <span className="um-select-arrow">&#8964;</span>
                </div>
            </div>

            <div className="um-table-wrapper">
                <table className="um-table">
                    <thead>
                        <tr>
                            <th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={7} className="um-empty">No users found.</td></tr>
                        ) : filtered.map((user, idx) => (
                            <tr key={user.id}>
                                <td>{idx + 1}</td>
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                <td>{user.phone}</td>
                                <td>{user.role}</td>
                                <td>
                                    <span className={`um-badge ${user.status === "Active" ? "um-active" : "um-idle"}`}>{user.status}</span>
                                </td>
                                <td className="um-actions-cell">
                                    <button className="um-dots-btn" onClick={e => toggleMenu(e, user.id)}>⋮</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Fixed-position 3-dot menu */}
            {openMenu !== null && (
                <div className="um-menu" ref={menuRef} style={{ top: menuPos.top, left: menuPos.left }}>
                    <button onClick={() => openEdit(filtered.find(u => u.id === openMenu))}>Edit</button>
                    <button className="um-menu-delete" onClick={() => openDelete(filtered.find(u => u.id === openMenu))}>Delete</button>
                </div>
            )}

            {/* Add / Edit Modal */}
            {(modal === "add" || modal === "edit") && (
                <div className="um-overlay" onClick={() => setModal(null)}>
                    <div className="um-modal" onClick={e => e.stopPropagation()}>
                        <h2>{modal === "add" ? "Add User" : "Edit User"}</h2>
                        <div className="um-modal-fields">
                            <div className="um-modal-group"><label>Full Name</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Full Name" /></div>
                            <div className="um-modal-group"><label>Email</label><input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="Email" /></div>
                            <div className="um-modal-group"><label>Phone</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="Phone" /></div>
                            <div className="um-modal-group">
                                <label>Role</label>
                                <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                                    {ROLES.filter(r => r !== "All Roles").map(r => <option key={r}>{r}</option>)}
                                </select>
                            </div>
                            <div className="um-modal-group">
                                <label>Status</label>
                                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                                    <option>Active</option><option>Idle</option>
                                </select>
                            </div>
                        </div>
                        <div className="um-modal-actions">
                            <button className="um-modal-cancel" onClick={() => setModal(null)}>Cancel</button>
                            <button className="um-modal-save" onClick={handleSave}>{modal === "add" ? "Add" : "Save"}</button>
                        </div>
                    </div>
                </div>
            )}

            {modal === "delete" && (
                <div className="um-overlay" onClick={() => setModal(null)}>
                    <div className="um-modal um-modal-sm" onClick={e => e.stopPropagation()}>
                        <h2>Delete User</h2>
                        <p>Are you sure you want to delete <strong>{selected?.name}</strong>?</p>
                        <div className="um-modal-actions">
                            <button className="um-modal-cancel" onClick={() => setModal(null)}>Cancel</button>
                            <button className="um-modal-delete" onClick={handleDelete}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UsersManagement;
