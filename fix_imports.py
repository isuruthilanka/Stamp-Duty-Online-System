#!/usr/bin/env python3
"""Fix all import paths after clean architecture reorganization."""

import re
import os

BASE = "/Users/lahirumunasinghe/Documents/LahiruRepo/Stamp-Duty-Online-System"

def replace_in_file(filepath, replacements):
    full = os.path.join(BASE, filepath)
    with open(full, "r") as f:
        content = f.read()
    original = content
    for old, new in replacements:
        content = content.replace(old, new)
    if content != original:
        with open(full, "w") as f:
            f.write(content)
        print(f"  Updated: {filepath}")
    else:
        print(f"  No change: {filepath}")

# ─── src/main.jsx ────────────────────────────────────────────────────────────
replace_in_file("src/main.jsx", [
    ("from './AppContext'", "from './context/AppContext'"),
])

# ─── src/App.jsx ─────────────────────────────────────────────────────────────
replace_in_file("src/App.jsx", [
    ("from './pages/ExternalLogin'",              "from './pages/auth/ExternalLogin'"),
    ("from './pages/DepartmentLogin'",            "from './pages/auth/DepartmentLogin'"),
    ("from './pages/InternalPortal'",             "from './pages/internal/InternalPortal'"),
    ("from './pages/ExternalDashboard'",          "from './pages/external/ExternalDashboard'"),
    ("from './pages/NewApplication'",             "from './pages/external/NewApplication'"),
    ("from './components/ExternalLayout'",        "from './components/layout/ExternalLayout'"),
    ("from './pages/ExternalRegistration'",       "from './pages/auth/ExternalRegistration'"),
    ("from './pages/ExternalApplicationDetail'",  "from './pages/external/ExternalApplicationDetail'"),
    ("from './pages/ForgotPassword'",             "from './pages/auth/ForgotPassword'"),
    ("from './pages/HelpDesk'",                   "from './pages/external/HelpDesk'"),
    ("from './pages/MyProfile'",                  "from './pages/external/MyProfile'"),
])

# ─── Layout components (src/components/layout/) ──────────────────────────────
layout_files = [
    "src/components/layout/DashboardLayout.jsx",
    "src/components/layout/ExternalLayout.jsx",
]
for f in layout_files:
    replace_in_file(f, [
        ("from '../AppContext'",        "from '../../context/AppContext'"),
        ("'../styles/Dashboard.css'",  "'../../styles/Dashboard.css'"),
        ('"../styles/Dashboard.css"',  '"../../styles/Dashboard.css"'),
    ])

# ─── Feature components (src/components/features/) ───────────────────────────
feature_files = [
    "src/components/features/AdminPanel.jsx",
    "src/components/features/ApplicationDetail.jsx",
    "src/components/features/CommonDashboard.jsx",
    "src/components/features/DeficiencyCalculator.jsx",
    "src/components/features/OfficialDeficiencyNotice.jsx",
    "src/components/features/OfficialOpinionForm.jsx",
    "src/components/features/StampDutyCalculator.jsx",
    "src/components/features/StampDutyRegistration.jsx",
]
for f in feature_files:
    replace_in_file(f, [
        ("from '../AppContext'",    "from '../../context/AppContext'"),
        ("from '../services/api'", "from '../../services/api'"),
    ])

# ─── UI components (src/components/ui/) ──────────────────────────────────────
replace_in_file("src/components/ui/GlobalSearch.jsx", [
    ("from '../AppContext'",    "from '../../context/AppContext'"),
    ("from '../services/api'", "from '../../services/api'"),
])

# ─── Auth pages (src/pages/auth/) ────────────────────────────────────────────
auth_files = [
    "src/pages/auth/DepartmentLogin.jsx",
    "src/pages/auth/ExternalLogin.jsx",
    "src/pages/auth/ExternalRegistration.jsx",
    "src/pages/auth/ForgotPassword.jsx",
]
for f in auth_files:
    replace_in_file(f, [
        ("from '../AppContext'",    "from '../../context/AppContext'"),
        ("'../styles/Auth.css'",   "'../../styles/Auth.css'"),
        ('"../styles/Auth.css"',   '"../../styles/Auth.css"'),
        ("from '../services/api'", "from '../../services/api'"),
    ])

# ─── Internal pages (src/pages/internal/) ────────────────────────────────────
replace_in_file("src/pages/internal/InternalPortal.jsx", [
    ("from '../AppContext'",                    "from '../../context/AppContext'"),
    ("from '../components/DashboardLayout'",    "from '../../components/layout/DashboardLayout'"),
    ("from '../components/AdminPanel'",         "from '../../components/features/AdminPanel'"),
    ("from '../components/CommonDashboard'",    "from '../../components/features/CommonDashboard'"),
    ("from '../components/ApplicationDetail'",  "from '../../components/features/ApplicationDetail'"),
    ("from '../components/StampDutyRegistration'", "from '../../components/features/StampDutyRegistration'"),
    ("from '../components/StampDutyCalculator'",   "from '../../components/features/StampDutyCalculator'"),
    ("from '../components/OfficialOpinionForm'",   "from '../../components/features/OfficialOpinionForm'"),
    ("from '../components/OfficialDeficiencyNotice'", "from '../../components/features/OfficialDeficiencyNotice'"),
    ("from '../components/DeficiencyCalculator'",  "from '../../components/features/DeficiencyCalculator'"),
])

# ─── External pages (src/pages/external/) ────────────────────────────────────
external_files = [
    "src/pages/external/ExternalApplicationDetail.jsx",
    "src/pages/external/ExternalDashboard.jsx",
    "src/pages/external/HelpDesk.jsx",
    "src/pages/external/MyProfile.jsx",
    "src/pages/external/NewApplication.jsx",
]
for f in external_files:
    replace_in_file(f, [
        ("from '../AppContext'",               "from '../../context/AppContext'"),
        ("from '../services/api'",             "from '../../services/api'"),
        ("from '../components/GlobalSearch'",  "from '../../components/ui/GlobalSearch'"),
        ("'../styles/Dashboard.css'",          "'../../styles/Dashboard.css'"),
        ('"../styles/Dashboard.css"',          '"../../styles/Dashboard.css"'),
    ])

print("\nAll imports updated!")
