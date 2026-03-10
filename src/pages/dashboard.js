// Dashboard page shown after login. Navbar switches between views.
// Views: Profiles, Users, Roles, Companies, Permissions, Role-Permissions.
import { useState } from "react";
import logo from "../assets/logo.png";
import UsersManagement from "./UsersManagement";
import RolesManagement from "./RolesManagement";
import CompaniesManagement from "./CompaniesManagement";
import RolePermissions from "./RolePermissions";
import PermissionsManagement from "./PermissionsManagement";
import "../dashboard.css";

const NAV_LINKS = ["Companies", "Users", "Profiles", "Roles", "Permissions", "Role-Permissions", "Subscriptions"];

const mockUser = {
    firstName: "Mohamed",
    lastName: "Haitham",
    phone: "01068779873",
    email: "Mohamedziad921@gmail.com",
    avatar: null,
    createdAt: "11/21/2025 9:09pm",
    updatedAt: "11/21/2025 9:10pm",
};

function Dashboard() {
    const [activeNav, setActiveNav] = useState("Profiles");

    return (
        <div className="dash-wrapper">
            {/* Navbar */}
            <nav className="dash-nav">
                <img src={logo} alt="NATIQ Logo" className="dash-logo" />
                <ul className="dash-nav-links">
                    {NAV_LINKS.map((link) => (
                        <li
                            key={link}
                            className={`dash-nav-item${activeNav === link ? " active" : ""}`}
                            onClick={() => setActiveNav(link)}
                        >
                            {link}
                        </li>
                    ))}
                </ul>
                <button className="dash-logout-btn">Logout</button>
            </nav>

            {/* Content */}
            <main className="dash-main">
                {activeNav === "Companies" ? (
                    <CompaniesManagement />
                ) : activeNav === "Role-Permissions" ? (
                    <RolePermissions />
                ) : activeNav === "Permissions" ? (
                    <PermissionsManagement />
                ) : activeNav === "Users" ? (
                    <UsersManagement />
                ) : activeNav === "Roles" ? (
                    <RolesManagement />
                ) : activeNav === "Profiles" ? (
                    <div className="profile-card">
                        <h2 className="profile-title">My Profile</h2>

                        <div className="avatar-wrapper">
                            {mockUser.avatar ? (
                                <img src={mockUser.avatar} alt="Profile" className="avatar-img" />
                            ) : (
                                <div className="avatar-placeholder">
                                    {mockUser.firstName[0]}{mockUser.lastName[0]}
                                </div>
                            )}
                        </div>

                        <div className="profile-fields">
                            <div className="field-row">
                                <div className="field-group">
                                    <label>Frist Name</label>
                                    <input value={mockUser.firstName} readOnly />
                                </div>
                                <div className="field-group">
                                    <label>Last Name</label>
                                    <input value={mockUser.lastName} readOnly />
                                </div>
                            </div>
                            <div className="field-row">
                                <div className="field-group">
                                    <label>Phone</label>
                                    <input value={mockUser.phone} readOnly />
                                </div>
                                <div className="field-group">
                                    <label>Email</label>
                                    <input value={mockUser.email} readOnly />
                                </div>
                            </div>
                        </div>

                        <button className="edit-user-btn">Edit User</button>

                        <div className="profile-timestamps">
                            <span><strong>Created at:</strong> {mockUser.createdAt}</span>
                            <span><strong>Updated at:</strong> {mockUser.updatedAt}</span>
                        </div>
                    </div>
                ) : (
                    <div className="dash-coming-soon">
                        <p>{activeNav} — coming soon</p>
                    </div>
                )}
            </main>
        </div>
    );
}

export default Dashboard;
