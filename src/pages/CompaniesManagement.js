// Companies Management view. Table of companies with name, industry, plan id, status.
// Full front-end CRUD: add, edit, delete with confirm modal. 3-dot action menu (fixed position).
import { useState, useRef, useEffect } from "react";
import "../companies.css";

const INITIAL_COMPANIES = [
    { id: 1, name: "Natiq tec",       industry: "Soft ware dev", planId: "-", status: "Active" },
    { id: 2, name: "Mohamed Haitham", industry: "Gaming",        planId: "-", status: "Idle"   },
    { id: 3, name: "Natiq tec",       industry: "Soft ware dev", planId: "-", status: "Active" },
    { id: 4, name: "Mohamed Haitham", industry: "Gaming",        planId: "-", status: "Idle"   },
    { id: 5, name: "Natiq tec",       industry: "Soft ware dev", planId: "-", status: "Active" },
];

const EMPTY_FORM = { name: "", industry: "", planId: "-", status: "Active" };

function CompaniesManagement() {
    const [companies, setCompanies] = useState(INITIAL_COMPANIES);
    const [openMenu, setOpenMenu]   = useState(null);
    const [menuPos, setMenuPos]     = useState({ top: 0, left: 0 });
    const [modal, setModal]         = useState(null);
    const [selected, setSelected]   = useState(null);
    const [form, setForm]           = useState(EMPTY_FORM);
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

    function openEdit(company) {
        setSelected(company);
        setForm({ name: company.name, industry: company.industry, planId: company.planId, status: company.status });
        setModal("edit"); setOpenMenu(null);
    }

    function openDelete(company) { setSelected(company); setModal("delete"); setOpenMenu(null); }

    function handleSave() {
        if (!form.name || !form.industry) return;
        if (modal === "add") {
            setCompanies(prev => [...prev, { ...form, id: Date.now() }]);
        } else {
            setCompanies(prev => prev.map(c => c.id === selected.id ? { ...c, ...form } : c));
        }
        setModal(null);
    }

    function handleDelete() {
        setCompanies(prev => prev.filter(c => c.id !== selected.id));
        setModal(null);
    }

    return (
        <div className="cm-wrapper">
            <div className="cm-header">
                <h1 className="cm-title">Companies Management</h1>
                <button className="cm-add-btn" onClick={openAdd}>+ Add Company</button>
            </div>

            <div className="cm-table-wrapper">
                <table className="cm-table">
                    <thead>
                        <tr><th>#</th><th>Name</th><th>Industry</th><th>Plan Id</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        {companies.length === 0 ? (
                            <tr><td colSpan={6} className="cm-empty">No companies found.</td></tr>
                        ) : companies.map((company, idx) => (
                            <tr key={company.id}>
                                <td>{idx + 1}</td>
                                <td>{company.name}</td>
                                <td>{company.industry}</td>
                                <td>{company.planId}</td>
                                <td><span className={`cm-badge ${company.status === "Active" ? "cm-active" : "cm-idle"}`}>{company.status}</span></td>
                                <td className="cm-actions-cell">
                                    <button className="cm-dots-btn" onClick={e => toggleMenu(e, company.id)}>⋮</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {openMenu !== null && (
                <div className="cm-menu" ref={menuRef} style={{ top: menuPos.top, left: menuPos.left }}>
                    <button onClick={() => openEdit(companies.find(c => c.id === openMenu))}>Edit</button>
                    <button className="cm-menu-delete" onClick={() => openDelete(companies.find(c => c.id === openMenu))}>Delete</button>
                </div>
            )}

            {(modal === "add" || modal === "edit") && (
                <div className="cm-overlay" onClick={() => setModal(null)}>
                    <div className="cm-modal" onClick={e => e.stopPropagation()}>
                        <h2>{modal === "add" ? "Add Company" : "Edit Company"}</h2>
                        <div className="cm-modal-fields">
                            <div className="cm-modal-group"><label>Company Name</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Company name" /></div>
                            <div className="cm-modal-group"><label>Industry</label><input value={form.industry} onChange={e => setForm({...form, industry: e.target.value})} placeholder="Industry" /></div>
                            <div className="cm-modal-group"><label>Plan ID</label><input value={form.planId} onChange={e => setForm({...form, planId: e.target.value})} placeholder="Plan ID" /></div>
                            <div className="cm-modal-group">
                                <label>Status</label>
                                <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                                    <option>Active</option><option>Idle</option>
                                </select>
                            </div>
                        </div>
                        <div className="cm-modal-actions">
                            <button className="cm-modal-cancel" onClick={() => setModal(null)}>Cancel</button>
                            <button className="cm-modal-save" onClick={handleSave}>{modal === "add" ? "Add" : "Save"}</button>
                        </div>
                    </div>
                </div>
            )}

            {modal === "delete" && (
                <div className="cm-overlay" onClick={() => setModal(null)}>
                    <div className="cm-modal cm-modal-sm" onClick={e => e.stopPropagation()}>
                        <h2>Delete Company</h2>
                        <p>Are you sure you want to delete <strong>{selected?.name}</strong>?</p>
                        <div className="cm-modal-actions">
                            <button className="cm-modal-cancel" onClick={() => setModal(null)}>Cancel</button>
                            <button className="cm-modal-delete" onClick={handleDelete}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CompaniesManagement;
