import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase.js";
import { AppProvider, useApp } from "./context/AppContext.jsx";
import Login from "./components/auth/Login.jsx";
import Sidebar from "./components/layout/Sidebar.jsx";
import Header from "./components/layout/Header.jsx";
import Dashboard from "./components/dashboard/Dashboard.jsx";
import NurseryMap from "./components/nursery/NurseryMap.jsx";
import StockingNew     from "./components/stocking/StockingNew.jsx";
import StockingRunning from "./components/stocking/StockingRunning.jsx";
import StockingHistory from "./components/stocking/StockingHistory.jsx";
import WaterQuality from "./components/water/WaterQuality.jsx";
import FeedManagement from "./components/feed/FeedManagement.jsx";
import MedicineManagement from "./components/medicine/MedicineManagement.jsx";
import SalesManagement from "./components/sales/SalesManagement.jsx";
import FarmerManagement from "./components/farmers/FarmerManagement.jsx";
import StaffManagement from "./components/staff/StaffManagement.jsx";
import FieldTechOperations from "./components/staff/FieldTechOperations.jsx";
import MaintenanceManagement from "./components/maintenance/MaintenanceManagement.jsx";
import Finance from "./components/finance/Finance.jsx";
import CultureHistory from "./components/history/CultureHistory.jsx";
import Inventory from "./components/inventory/Inventory.jsx";
import FarmerReport from "./components/reports/FarmerReport.jsx";
import SalesReport from "./components/reports/SalesReport.jsx";
import FeedReport from "./components/reports/FeedReport.jsx";
import MedicineReport from "./components/reports/MedicineReport.jsx";
import MaintenanceReport from "./components/reports/MaintenanceReport.jsx";
import Settings from "./components/settings/Settings.jsx";
import FieldTechMobile from "./components/mobile/FieldTechMobile.jsx";
import FarmerMobile from "./components/mobile/FarmerMobile.jsx";
import NurseryTechMobile from "./components/mobile/NurseryTechMobile.jsx";

const PAGES = {
  dashboard: Dashboard,
  nursery: NurseryMap,
  stocking_new:     StockingNew,
  stocking_running: StockingRunning,
  stocking_history: StockingHistory,
  water: WaterQuality,
  feed: FeedManagement,
  medicine: MedicineManagement,
  sales: SalesManagement,
  farmers: FarmerManagement,
  history: CultureHistory,
  staff_technician: StaffManagement,
  staff_field:      FieldTechOperations,
  staff_worker:     StaffManagement,
  staff_manager:    StaffManagement,
  staff_hr:         StaffManagement,
  staff_admin:      StaffManagement,
  maintenance: MaintenanceManagement,
  finance: Finance,
  inv_feed:       Inventory,
  inv_medicine:   Inventory,
  inv_general:    Inventory,
  report_farmer:  FarmerReport,
  report_sales:   SalesReport,
  report_feed:    FeedReport,
  report_medicine:MedicineReport,
  report_maint:   MaintenanceReport,
  settings:          Settings,
  mobile_fieldtech:  FieldTechMobile,
  mobile_farmer:        FarmerMobile,
  mobile_nurserytech:   NurseryTechMobile,
};

function AppContent({ onSignOut }) {
  const { page } = useApp();
  const Page = PAGES[page] || Dashboard;
  return (
    <div style={{ display: "flex", height: "100vh", background: "#060e1f", overflow: "hidden" }}>
      <Sidebar onSignOut={onSignOut} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header onSignOut={onSignOut} />
        <main style={{ flex: 1, overflowY: "auto" }}>
          <Page />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  // Still checking session
  if (session === undefined) {
    return (
      <div style={{ minHeight:"100vh", background:"#060e1f", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ color:"#00d4aa", fontSize:18, fontFamily:"Inter,sans-serif" }}>Loading…</div>
      </div>
    );
  }

  if (!session) return <Login />;

  return (
    <AppProvider>
      <AppContent onSignOut={handleSignOut} />
    </AppProvider>
  );
}
