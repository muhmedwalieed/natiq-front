import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRightOnRectangleIcon,
    ClipboardDocumentCheckIcon,
    KeyIcon,
    ShieldCheckIcon,
    Squares2X2Icon,
    UserCircleIcon,
    UserGroupIcon,
    UsersIcon
} from '@heroicons/react/24/outline';
import UsersManagement from '../Users';
import RolesManagement from '../Roles';
import CompaniesManagement from '../Companies';
import RolePermissions from '../RolePermissions';
import PermissionsManagement from '../Permissions';
import AuditLogs from '../AuditLogs';
import './Dashboard.css';

const MANAGER_NAV = [
    { key: 'overview', label: 'Overview', icon: Squares2X2Icon },
    { key: 'users', label: 'Users', icon: UsersIcon },
    { key: 'roles', label: 'Roles', icon: ShieldCheckIcon },
    { key: 'permissions', label: 'Permissions', icon: KeyIcon },
    { key: 'role_permissions', label: 'Role Permissions', icon: ClipboardDocumentCheckIcon },
    { key: 'audit_logs', label: 'Audit Logs', icon: UserGroupIcon },
    { key: 'profile', label: 'My Profile', icon: UserCircleIcon }
];

const ADMIN_EXTRA_NAV = [{ key: 'companies', label: 'Companies', icon: UserGroupIcon }];

function readStoredUser() {
    try {
        return JSON.parse(localStorage.getItem('agent_user') || '{}');
    } catch {
        return {};
    }
}

function titleForTab(tab) {
    if (tab === 'overview') return 'Manager Command Center';
    if (tab === 'users') return 'Users Management';
    if (tab === 'roles') return 'Roles Management';
    if (tab === 'permissions') return 'Permissions Management';
    if (tab === 'role_permissions') return 'Role-Permissions Matrix';
    if (tab === 'audit_logs') return 'Audit Logs';
    if (tab === 'profile') return 'My Profile';
    if (tab === 'companies') return 'Companies';
    return 'Dashboard';
}

function Dashboard() {
    const navigate = useNavigate();
    const storedUser = readStoredUser();
    const managerMode = storedUser.role === 'company_manager';
    const navLinks = managerMode ? MANAGER_NAV : [...ADMIN_EXTRA_NAV, ...MANAGER_NAV];
    const [activeNav, setActiveNav] = useState('overview');

    const overviewStats = useMemo(
        () => [
            { title: 'Managed Modules', value: '6', sub: 'Users, Roles, Permissions, Audit' },
            { title: 'Access Scope', value: managerMode ? 'Manager' : 'Admin', sub: managerMode ? 'Company-level control' : 'Extended privileges' },
            { title: 'Security Focus', value: 'High', sub: 'RBAC and audit-first workflow' },
            { title: 'Session', value: 'Active', sub: `Signed in as ${storedUser.name || 'User'}` }
        ],
        [managerMode, storedUser.name]
    );

    function logout() {
        localStorage.removeItem('agent_token');
        localStorage.removeItem('agent_user');
        navigate('/');
    }

    const renderOverview = () => (
        <div className="mgr-overview">
            <section className="mgr-hero">
                <div>
                    <h2>Control your operations faster</h2>
                    <p>Everything a manager needs is organized in one place with cleaner navigation and role-focused actions.</p>
                </div>
                <button className="mgr-primary-btn" onClick={() => setActiveNav('users')}>Go to Users</button>
            </section>

            <section className="mgr-kpi-grid">
                {overviewStats.map((card) => (
                    <article key={card.title} className="mgr-kpi-card">
                        <h3>{card.title}</h3>
                        <p className="mgr-kpi-value">{card.value}</p>
                        <p className="mgr-kpi-sub">{card.sub}</p>
                    </article>
                ))}
            </section>

            <section className="mgr-panels-grid">
                <article className="mgr-panel">
                    <h3>Quick Actions</h3>
                    <button className="mgr-quick-btn" onClick={() => setActiveNav('users')}>Manage users</button>
                    <button className="mgr-quick-btn" onClick={() => setActiveNav('roles')}>Adjust roles</button>
                    <button className="mgr-quick-btn" onClick={() => setActiveNav('permissions')}>Review permissions</button>
                    <button className="mgr-quick-btn" onClick={() => setActiveNav('audit_logs')}>Open audit logs</button>
                </article>
                <article className="mgr-panel">
                    <h3>Manager Checklist</h3>
                    <ul className="mgr-checklist">
                        <li>Review new users and role assignments daily.</li>
                        <li>Verify permission changes before publishing.</li>
                        <li>Check audit logs for unusual activity.</li>
                        <li>Keep role-permission mappings minimal and secure.</li>
                    </ul>
                </article>
            </section>
        </div>
    );

    const renderProfile = () => {
        const initials = (storedUser.name || 'MU')
            .split(' ')
            .map((part) => part[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();

        return (
            <div className="mgr-profile-card">
                <div className="mgr-profile-avatar">{initials}</div>
                <h2>{storedUser.name || 'Manager User'}</h2>
                <p>{storedUser.email || 'No email available'}</p>
                <div className="mgr-profile-grid">
                    <div>
                        <span>Role</span>
                        <strong>{storedUser.role || 'N/A'}</strong>
                    </div>
                    <div>
                        <span>Company</span>
                        <strong>{storedUser.companyId || 'Assigned'}</strong>
                    </div>
                </div>
            </div>
        );
    };

    const renderContent = () => {
        if (activeNav === 'overview') return renderOverview();
        if (activeNav === 'users') return <UsersManagement />;
        if (activeNav === 'roles') return <RolesManagement />;
        if (activeNav === 'permissions') return <PermissionsManagement />;
        if (activeNav === 'role_permissions') return <RolePermissions />;
        if (activeNav === 'audit_logs') return <AuditLogs />;
        if (activeNav === 'profile') return renderProfile();
        if (activeNav === 'companies') return <CompaniesManagement />;
        return null;
    };

    return (
        <div className="mgr-shell">
            <aside className="mgr-sidebar">
                <div className="mgr-brand">
                    <span>Manager Hub</span>
                </div>
                <nav className="mgr-nav">
                    {navLinks.map((item) => {
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.key}
                                className={`mgr-nav-item ${activeNav === item.key ? 'active' : ''}`}
                                onClick={() => setActiveNav(item.key)}
                            >
                                <Icon className="mgr-nav-icon" />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>
            </aside>

            <main className="mgr-main">
                <header className="mgr-header">
                    <h1>{titleForTab(activeNav)}</h1>
                    <div className="mgr-user-box">
                        <div className="mgr-user-avatar">{(storedUser.name || 'MU').slice(0, 2).toUpperCase()}</div>
                        <div className="mgr-user-meta">
                            <span>{storedUser.name || 'Manager User'}</span>
                            <small>{managerMode ? 'Company Manager' : 'Platform Admin'}</small>
                        </div>
                        <button type="button" className="mgr-logout-btn" onClick={logout} title="Logout">
                            <ArrowRightOnRectangleIcon width={20} />
                        </button>
                    </div>
                </header>
                <section className="mgr-content">{renderContent()}</section>
            </main>
        </div>
    );
}

export default Dashboard;
