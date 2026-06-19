import { useApp } from "./context/AppContext.jsx";
import Login from "./components/auth/Login.jsx";
import ChangePasswordModal from "./components/auth/ChangePasswordModal.jsx";
import NotificationToasts from "./components/common/NotificationToasts.jsx";
import Sidebar from "./components/layout/Sidebar.jsx";
import Header from "./components/layout/Header.jsx";
import Dashboard from "./components/dashboard/Dashboard.jsx";
import Clients from "./components/clients/Clients.jsx";
import Projects from "./components/projects/Projects.jsx";
import CutList from "./components/cutlist/CutList.jsx";
import Hardware from "./components/hardware/Hardware.jsx";
import Quotations from "./components/quotations/Quotations.jsx";
import Production from "./components/production/Production.jsx";
import Inventory from "./components/inventory/Inventory.jsx";
import Employees from "./components/employees/Employees.jsx";
import Maintenance from "./components/maintenance/Maintenance.jsx";
import Dispatch from "./components/dispatch/Dispatch.jsx";
import Accounting from "./components/accounting/Accounting.jsx";
import Analytics from "./components/analytics/Analytics.jsx";
import Settings from "./components/settings/Settings.jsx";
import UserManagement from "./components/settings/UserManagement.jsx";
import SuperAdmin from "./components/admin/SuperAdmin.jsx";

const PAGES = {
  dashboard: Dashboard,
  clients: Clients,
  projects: Projects,
  cutlist: CutList,
  hardware: Hardware,
  quotations: Quotations,
  production: Production,
  inventory: Inventory,
  employees: Employees,
  maintenance: Maintenance,
  dispatch: Dispatch,
  accounting: Accounting,
  analytics: Analytics,
  settings: Settings,
  user_mgmt: UserManagement,
  super_admin: SuperAdmin,
};

function AppShell() {
  const { session, user, loading, page } = useApp();

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#0f172a,#1e3a5f)" }}>
      <div style={{ textAlign: "center", color: "#94a3b8" }}>
        <div style={{ width: 48, height: 48, border: "3px solid #1e3a5f", borderTop: "3px solid #3b82f6", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ fontSize: 14 }}>Loading ModularPro...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  if (!session || !user) return <Login />;

  const PageComp = PAGES[page] || Dashboard;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#f1f5f9" }}>
      <Sidebar />
      <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
        <Header />
        <div style={{ flex: 1 }}><PageComp /></div>
      </div>
      {user.must_change_password && <ChangePasswordModal />}
      <NotificationToasts />
    </div>
  );
}

export default function App() {
  return <AppShell />;
}
