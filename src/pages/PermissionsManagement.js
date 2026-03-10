// Permissions Management view. Table of permissions with name and description.
// Full front-end CRUD: add, edit, delete with confirm modal. 3-dot action menu (fixed position).
import { useState, useRef, useEffect } from "react";
import "../permissions.css";

const INITIAL_PERMISSIONS = [
    { id: 1, name: "create_permission",      description: "Allows creating a new permission using POST"       },
    { id: 2, name: "view_all_permission",    description: "Allow viewing all permission using GET"             },
    { id: 3, name: "view_single_permission", description: "Allows viewing a specific permission using GET"     },
    { id: 4, name: "update_permission",      description: "Allows updating a specific permission"              },
    { id: 5, name: "delete_permission",      description: "Allows deleting a specific permission using DELETE" },
];

const EMPTY_FORM = { name: "", description: "" };

function PermissionsManagement() {
    const [permissions, setPermissions] = useState(INITIAL_PERMISSIONS);
    const [openMenu, setOpenMenu]       = useState(null);
    const [menuPos, setMenuPos]         = useState({ top: 0, left: 0 });
    const [modal, setModal]             = useState(null);
    const [selected, setSelected]       = useState(null);
    const [form, setForm]               = useState(EMPTY_FORM);
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

    function openEdit(perm) {
        setSelected(perm);
        setForm({ name: perm.name, description: perm.description });
        setModal("edit"); setOpenMenu(null);
    }

    function openDelete(perm) { setSelected(perm); setModal("delete"); setOpenMenu(null); }

    function handleSave() {
        if (!form.name || !form.description) return;
        if (modal === "add") {
            setPermissions(prev => [...prev, { ...form, id: Date.now() }]);
        } else {
            setPermissions(prev => prev.map(p => p.id === selected.id ? { ...p, ...form } : p));
        }
        setModal(null);
    }

    function handleDelete() {
        setPermissions(prev => prev.filter(p => p.id !== selected.id));
        setModal(null);
    }

    return (
        <div className="pm-wrapper">
            <div className="pm-header">
                <h1 className="pm-title">Permissions Management</h1>
                <button className="pm-add-btn" onClick={openAdd}>+ Add Permission</button>
            </div>

            <div className="pm-table-wrapper">
                <table className="pm-table">
                    <thead>
                        <tr><th>#</th><th>Permission Name</th><th>Description</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        {permissions.length === 0 ? (
                            <tr><td colSpan={4} className="pm-empty">No permissions found.</td></tr>
                        ) : permissions.map((perm, idx) => (
                            <tr key={perm.id}>
                                <td>{idx + 1}</td>
                                <td>{perm.name}</td>
                                <td>{perm.description}</td>
                                <td className="pm-actions-cell">
                                    <button className="pm-dots-btn" onClick={e => toggleMenu(e, perm.id)}>⋮</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {openMenu !== null && (
                <div className="pm-menu" ref={menuRef} style={{ top: menuPos.top, left: menuPos.left }}>
                    <button onClick={() => openEdit(permissions.find(p => p.id === openMenu))}>Edit</button>
                    <button className="pm-menu-delete" onClick={() => openDelete(permissions.find(p => p.id === openMenu))}>Delete</button>
                </div>
            )}

            {(modal === "add" || modal === "edit") && (
                <div className="pm-overlay" onClick={() => setModal(null)}>
                    <div className="pm-modal" onClick={e => e.stopPropagation()}>
                        <h2>{modal === "add" ? "Add Permission" : "Edit Permission"}</h2>
                        <div className="pm-modal-fields">
                            <div className="pm-modal-group"><label>Permission Name</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. create_permission" /></div>
                            <div className="pm-modal-group"><label>Description</label><input value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Describe what this permission allows" /></div>
                        </div>
                        <div className="pm-modal-actions">
                            <button className="pm-modal-cancel" onClick={() => setModal(null)}>Cancel</button>
                            <button className="pm-modal-save" onClick={handleSave}>{modal === "add" ? "Add" : "Save"}</button>
                        </div>
                    </div>
                </div>
            )}

            {modal === "delete" && (
                <div className="pm-overlay" onClick={() => setModal(null)}>
                    <div className="pm-modal pm-modal-sm" onClick={e => e.stopPropagation()}>
                        <h2>Delete Permission</h2>
                        <p>Are you sure you want to delete <strong>{selected?.name}</strong>?</p>
                        <div className="pm-modal-actions">
                            <button className="pm-modal-cancel" onClick={() => setModal(null)}>Cancel</button>
                            <button className="pm-modal-delete" onClick={handleDelete}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PermissionsManagement;
