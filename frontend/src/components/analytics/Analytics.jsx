import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase.js";
import { useApp } from "../../context/AppContext.jsx";
import { Card, StatCard, Spinner, PageHeader } from "../common/ui.jsx";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from "recharts";

const COLORS = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4"];

export default function Analytics() {
  const { tenant } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (tenant) load(); }, [tenant]);

  async function load() {
    setLoading(true);
    const [
      { data: projects },
      { data: invoices },
      { data: expenses },
      { data: jobs },
    ] = await Promise.all([
      supabase.from("projects").select("status, created_at, project_type").eq("tenant_id", tenant.id),
      supabase.from("invoices").select("grand_total, amount_paid, status, invoice_date, invoice_type").eq("tenant_id", tenant.id),
      supabase.from("expenses").select("amount, category, expense_date").eq("tenant_id", tenant.id),
      supabase.from("production_jobs").select("status, created_at").eq("tenant_id", tenant.id),
    ]);

    const statusMap = {};
    (projects || []).forEach(p => { statusMap[p.status] = (statusMap[p.status] || 0) + 1; });
    const projectStatusData = Object.entries(statusMap).map(([name, value]) => ({ name: name.replace(/_/g," "), value }));

    const monthlyRev = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString("en-IN", { month: "short", year: "2-digit" });
      monthlyRev[key] = { month: key, invoiced: 0, received: 0 };
    }
    (invoices || []).forEach(inv => {
      if (!inv.invoice_date) return;
      const d = new Date(inv.invoice_date);
      const key = d.toLocaleString("en-IN", { month: "short", year: "2-digit" });
      if (monthlyRev[key]) {
        monthlyRev[key].invoiced += inv.grand_total || 0;
        monthlyRev[key].received += inv.amount_paid || 0;
      }
    });
    const revenueData = Object.values(monthlyRev);

    const expMap = {};
    (expenses || []).forEach(e => { expMap[e.category] = (expMap[e.category] || 0) + (e.amount || 0); });
    const expenseData = Object.entries(expMap).map(([name, value]) => ({ name, value }));

    const typeMap = {};
    (projects || []).forEach(p => { typeMap[p.project_type] = (typeMap[p.project_type] || 0) + 1; });
    const typeData = Object.entries(typeMap).map(([name, value]) => ({ name, value }));

    const totalInvoiced = (invoices || []).reduce((s, i) => s + (i.grand_total || 0), 0);
    const totalReceived = (invoices || []).reduce((s, i) => s + (i.amount_paid || 0), 0);
    const totalExpenses = (expenses || []).reduce((s, e) => s + (e.amount || 0), 0);
    const netProfit = totalReceived - totalExpenses;

    setData({ projectStatusData, revenueData, expenseData, typeData, totalInvoiced, totalReceived, totalExpenses, netProfit, totalProjects: projects?.length || 0, totalJobs: jobs?.length || 0 });
    setLoading(false);
  }

  if (loading) return <div style={{ padding: 24 }}><Spinner /></div>;

  return (
    <div style={{ padding: 24 }}>
      <PageHeader title="Analytics & Reports" subtitle="Business performance overview" />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Projects" value={data.totalProjects} icon="P" color="#3b82f6" />
        <StatCard label="Total Invoiced" value={`Rs.${(data.totalInvoiced/1000).toFixed(0)}K`} icon="I" color="#6366f1" />
        <StatCard label="Total Received" value={`Rs.${(data.totalReceived/1000).toFixed(0)}K`} icon="R" color="#10b981" />
        <StatCard label="Total Expenses" value={`Rs.${(data.totalExpenses/1000).toFixed(0)}K`} icon="E" color="#ef4444" />
        <StatCard label="Net Profit" value={`Rs.${(data.netProfit/1000).toFixed(0)}K`} icon="N" color={data.netProfit >= 0 ? "#10b981" : "#ef4444"} />
        <StatCard label="Production Jobs" value={data.totalJobs} icon="J" color="#f59e0b" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <Card style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>Monthly Revenue (Rs.)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => `Rs.${v.toLocaleString("en-IN")}`} />
              <Bar dataKey="invoiced" name="Invoiced" fill="#3b82f6" radius={[4,4,0,0]} />
              <Bar dataKey="received" name="Received" fill="#10b981" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>Project Status Breakdown</h3>
          {data.projectStatusData.length === 0 ? (
            <div style={{ color: "#94a3b8", textAlign: "center", padding: 40 }}>No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={data.projectStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {data.projectStatusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <Card style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>Expenses by Category (Rs.)</h3>
          {data.expenseData.length === 0 ? (
            <div style={{ color: "#94a3b8", textAlign: "center", padding: 40 }}>No expense data</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.expenseData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                <Tooltip formatter={v => `Rs.${v.toLocaleString("en-IN")}`} />
                <Bar dataKey="value" fill="#ef4444" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>Project Type Split</h3>
          {data.typeData.length === 0 ? (
            <div style={{ color: "#94a3b8", textAlign: "center", padding: 40 }}>No data</div>
          ) : (
            <div>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={data.typeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}>
                    {data.typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 8 }}>
                {data.typeData.map((t, i) => (
                  <div key={t.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: COLORS[i % COLORS.length] }} />
                    {t.name}: {t.value}
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
