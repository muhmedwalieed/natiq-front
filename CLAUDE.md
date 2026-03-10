# NATIQ React App — Codebase Summary

## Stack
React 19, react-router-dom v7, react-toastify, react-scripts (CRA)

## Rules
- Every source file starts with a `/* ... */` summary comment
- Update this file after every change
- No backend yet — all validation and data is client-side
- Use `react-toastify` for all user feedback (never `alert()`)
- Brand colors: primary `#55711d`, accent `#CAF301`, dark `#042835`, font: Poppins

---

## File Structure

```
myapp/
├── CLAUDE.md               # This file — codebase reference
├── public/
│   └── index.html
└── src/
    ├── index.js            # Entry point — mounts <App /> into #root
    ├── index.css           # Global reset + Poppins font import
    ├── App.js              # BrowserRouter — defines all routes
    │
    ├── App.css             # Auth pages styles (login, signup, chat)
    ├── dashboard.css       # Dashboard navbar + profile card styles
    ├── users.css           # Users Management table + modal styles
    ├── roles.css           # Roles Management table + modal styles
    ├── companies.css           # Companies Management table + modal styles
    ├── rolepermissions.css     # Role-Permissions card + grid styles
    ├── permissions.css         # Permissions Management table + modal styles
    │
    └── pages/
        ├── login.js            # Login + 3-step signup
        ├── chat.js             # Password creation (post-signup flow)
        ├── dashboard.js        # Post-login shell — navbar + view switcher
        ├── UsersManagement.js  # Users table with search/filter/add/edit/delete
        ├── RolesManagement.js      # Roles table with add/edit/delete
        ├── CompaniesManagement.js  # Companies table with add/edit/delete
        ├── RolePermissions.js      # Role-permissions view: select role, toggle granted/revoked
        └── PermissionsManagement.js # Permissions table with add/edit/delete
```

---

## Routes

| Path         | Component     | Description                     |
|--------------|---------------|---------------------------------|
| `/`          | Login         | Login form + 3-step signup      |
| `/chat`      | CreateAccount | Password creation page          |
| `/dashboard` | Dashboard     | Main app shell after login      |

---

## Pages

### login.js
Multi-step auth component (login + signup).

**State:**
- `isLogin` — toggles login vs signup view
- `step` (1–3) — signup steps: Personal → Password → Company
- `formData` — `{ name, phone, email, password, confirmPassword, companyName, companyIndustry, companySize, companyLocation }`
- `acceptedTerms`, `acceptedPrivacy`, `isHuman` — Step 3 checkboxes

**On login success:** navigates to `/dashboard` after 1s toast.

---

### chat.js
Password creation page shown after signup.

**State:**
- `pwd`, `confirm` — password field values
- `showPwd` — toggles password visibility (eye icon)

---

### dashboard.js
Post-login shell. Renders the shared navbar and switches content by `activeNav`.

**State:**
- `activeNav` — currently selected nav link (default: `"Profiles"`)

**Nav links:** Companies · Users · Profiles · Roles · Permissions · Role-Permissions · Subscriptions

**View mapping:**
- `"Profiles"` → My Profile card (inline in dashboard.js)
- `"Users"` → `<UsersManagement />`
- `"Roles"` → `<RolesManagement />`
- `"Companies"` → `<CompaniesManagement />`
- `"Permissions"` → `<PermissionsManagement />`
- `"Role-Permissions"` → `<RolePermissions />`
- anything else → "coming soon" placeholder

---

### UsersManagement.js
Full users table with front-end CRUD.

**State:**
- `users` — array `{ id, name, email, phone, role, status }`
- `search` — text filter (name or email)
- `roleFilter` — dropdown (All Roles / Super admin / Admin / User)
- `openMenu` — id of user whose 3-dot menu is open
- `modal` — `null | "add" | "edit" | "delete"`
- `selected` — user being edited or deleted
- `form` — `{ name, email, phone, role, status }`

**Features:** search, role filter, add/edit/delete with confirm, Active/Idle badges, 3-dot menu.

---

### RolesManagement.js
Roles table with front-end CRUD.

**State:**
- `roles` — array `{ id, name, description, users }`
- `openMenu` — id of role whose 3-dot menu is open
- `modal` — `null | "add" | "edit" | "delete"`
- `selected` — role being edited or deleted
- `form` — `{ name, description, users }`

**Features:** add/edit/delete with confirm, lime-green user-count badge, 3-dot menu.

---

### CompaniesManagement.js
Companies table with front-end CRUD.

**State:**
- `companies` — array `{ id, name, industry, planId, status }`
- `openMenu` — id of company whose 3-dot menu is open
- `modal` — `null | "add" | "edit" | "delete"`
- `selected` — company being edited or deleted
- `form` — `{ name, industry, planId, status }`

**Features:** add/edit/delete with confirm, Active/Idle status badges, 3-dot menu.

---

### RolePermissions.js
Role-permissions view. Select a role and see/toggle its permissions.

**State:**
- `selectedRole` — currently selected role name
- `data` — map of role → `{ granted: [], revoked: [] }`

**Features:** role dropdown, granted/revoked permission grids (2-col), click any permission to toggle it between granted ↔ revoked.

---

### PermissionsManagement.js
Permissions table with front-end CRUD.

**State:**
- `permissions` — array `{ id, name, description }`
- `openMenu` — id of permission whose 3-dot menu is open
- `modal` — `null | "add" | "edit" | "delete"`
- `selected` — permission being edited or deleted
- `form` — `{ name, description }`

**Features:** add/edit/delete with confirm, 3-dot action menu per row.
