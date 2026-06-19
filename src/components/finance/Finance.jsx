import { useState, useMemo } from "react";
import { useApp } from "../../context/AppContext.jsx";
import { C, KPI, Card, SHead, Tbl, TR, TD, Badge, TT, Tabs } from "../common/ui.jsx";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const CLRS = ["#00d4aa","#0099ff","#a855f7","#f59e0b","#ef4444","#22c55e","#f97316","#06b6d4"];
const fmt  = v => "₹" + Number(v).toLocaleString("en-IN");
const fmtK = v => "₹" + (v / 1000).toFixed(1) + "K";
const fmtL = v => "₹" + (v / 100000).toFixed(2) + "L";

export default function Finance() {
  const { sales, batches, monthly, power, maint, staff, feedStock, medStock, farmers } = useApp();
  const farmerMap = useMemo(() => Object.fromEntries((farmers || []).map(f => [f.id, f.name])), [farmers]);
  const [tab, setTab] = useState("overview");
  const [yr,  setYr]  = useState("2024");

  // ── Cost calculations ─────────────────────────────────────
  const totalRev      = sales.reduce((s, x) => s + (x.total || 0), 0);
  const totalPaid     = sales.reduce((s, x) => s + (x.paid  || 0), 0);
  const totalPending  = sales.reduce((s, x) => s + (x.bal   || 0), 0);
  const totalStocking = batches.filter(b => b.status !== "harvested").reduce((s, b) => s + (b.cost || 0), 0);
  const totalPower    = power.reduce((s, b) => s + (b.amt || 0), 0);
  const totalMaint    = maint.filter(m => m.status === "completed").reduce((s, m) => s + (m.cost || 0), 0);
  const totalLabour   = staff.reduce((s, x) => s + (x.sal || 0), 0) * 6;
  const feedCost      = feedStock.reduce((s, x) => s + (x.total || 0), 0) || 285000;
  const medCost       = medStock.reduce((s, x) => s + (x.total  || 0), 0) || 18000;
  const totalCost     = totalStocking + totalPower + totalMaint + totalLabour + feedCost + medCost;
  const netProfit     = totalRev - totalCost;
  const margin        = totalRev > 0 ? ((netProfit / totalRev) * 100).toFixed(1) : 0;

  // ── Cost breakdown ────────────────────────────────────────
  const costBreak = [
    { name: "Stocking",    v: totalStocking },
    { name: "Feed",        v: feedCost },
    { name: "Power",       v: totalPower },
    { name: "Labour",      v: totalLabour },
    { name: "Medicine",    v: medCost },
    { name: "Maintenance", v: totalMaint },
  ];

  // ── Payment status breakdown ──────────────────────────────
  const payStatus = [
    { name: "Paid",    v: sales.filter(s => s.status === "paid").length },
    { name: "Partial", v: sales.filter(s => s.status === "partial").length },
    { name: "Pending", v: sales.filter(s => s.status === "pending").length },
  ];

  // ── Monthly data with profit margin ──────────────────────
  const monthlyData = monthly.map(m => ({
    ...m,
    margin: m.rev > 0 ? +((m.profit / m.rev) * 100).toFixed(1) : 0,
  }));

  // ── Batch P&L ─────────────────────────────────────────────
  const batchPnL = batches.slice(0, 20).map(b => {
    const estRev    = Math.round((b.cnt || 0) * (b.sr || 80) / 100 * 450 / 1000);
    const profit    = estRev - (b.cost || 0);
    const profitPct = estRev > 0 ? ((profit / estRev) * 100).toFixed(1) : 0;
    return { ...b, estRev, profit, profitPct };
  });

  // ── Power monthly ─────────────────────────────────────────
  const powerData = power.map(p => ({ name: p.month?.slice(0,3) || "—", units: p.units || 0, amt: p.amt || 0 }));

  // ── Staff cost by role ────────────────────────────────────
  const roleCost = Object.entries(
    staff.reduce((acc, s) => {
      acc[s.role] = (acc[s.role] || 0) + (s.sal || 0);
      return acc;
    }, {})
  ).map(([role, total]) => ({ role, total }));

  // ── Sales by farmer ───────────────────────────────────────
  const farmerSales = Object.entries(
    sales.reduce((acc, s) => {
      const key = farmerMap[s.fId] || "Farmer #" + s.fId;
      if (!acc[key]) acc[key] = { revenue: 0, count: 0, paid: 0 };
      acc[key].revenue += s.total || 0;
      acc[key].paid    += s.paid  || 0;
      acc[key].count   += 1;
      return acc;
    }, {})
  ).map(([name, d]) => ({ name, ...d, balance: d.revenue - d.paid }))
   .sort((a, b) => b.revenue - a.revenue);

  // ── Maintenance by category ───────────────────────────────
  const maintCat = Object.entries(
    maint.reduce((acc, m) => {
      acc[m.cat] = (acc[m.cat] || 0) + (m.cost || 0);
      return acc;
    }, {})
  ).map(([cat, cost]) => ({ cat, cost })).sort((a, b) => b.cost - a.cost);

  const tabs = [
    { id: "overview",     label: "📊 Overview"       },
    { id: "pnl",          label: "📈 P&L"             },
    { id: "expenses",     label: "💸 Expenses"        },
    { id: "sales",        label: "🛒 Sales Ledger"    },
    { id: "batchwise",    label: "🐟 Batch Finance"   },
    { id: "power",        label: "⚡ Power & Maint"   },
  ];

  return (
    <div style={{ padding: "20px 24px" }}>
      {/* KPI Row */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <KPI label="Total Revenue (YTD)"  value={fmtL(totalRev)}    sub="all invoices"      color={C.teal}   icon="💰" />
        <KPI label="Amount Collected"     value={fmtL(totalPaid)}   sub="cash in hand"      color={C.green}  icon="✅" />
        <KPI label="Pending Recovery"     value={fmt(totalPending)} sub="unpaid balance"    color={C.amber}  icon="⏳" />
        <KPI label="Total Expenses"       value={fmtL(totalCost)}   sub="all costs"         color={C.red}    icon="📉" />
        <KPI label="Net Profit (YTD)"     value={fmtL(netProfit)}   sub={margin + "% margin"} color={C.purple} icon="📈" />
      </div>

      <Tabs tabs={tabs} active={tab} onChange={setTab} />

      {/* ── OVERVIEW ── */}
      {tab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 14 }}>
            <Card>
              <SHead title="Monthly Revenue vs Cost vs Profit" />
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyData}>
                  <XAxis dataKey="m" stroke={C.sub} fontSize={10} />
                  <YAxis stroke={C.sub} fontSize={10} tickFormatter={fmtK} />
                  <Tooltip {...TT} formatter={v => fmtK(v)} />
                  <Legend wrapperStyle={{ fontSize: 11, color: C.sub }} />
                  <Bar dataKey="rev"    fill={C.teal}   radius={[4,4,0,0]} name="Revenue" />
                  <Bar dataKey="cost"   fill={C.red}    radius={[4,4,0,0]} name="Cost" />
                  <Bar dataKey="profit" fill={C.purple} radius={[4,4,0,0]} name="Profit" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card>
              <SHead title="Cost Breakdown" />
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <ResponsiveContainer width="55%" height={170}>
                  <PieChart>
                    <Pie data={costBreak} cx="50%" cy="50%" outerRadius={65} dataKey="v" paddingAngle={2}>
                      {costBreak.map((_, i) => <Cell key={i} fill={CLRS[i]} />)}
                    </Pie>
                    <Tooltip {...TT} formatter={v => fmtK(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1 }}>
                  {costBreak.map((d, i) => (
                    <div key={d.name} style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 5, color: C.sub, fontSize: 11 }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: CLRS[i], display: "block" }} />
                        {d.name}
                      </span>
                      <span style={{ color: C.text, fontSize: 11, fontWeight: 600 }}>{fmtK(d.v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Card>
              <SHead title="Profit Margin Trend (%)" />
              <ResponsiveContainer width="100%" height={170}>
                <AreaChart data={monthlyData}>
                  <XAxis dataKey="m" stroke={C.sub} fontSize={10} />
                  <YAxis stroke={C.sub} fontSize={10} unit="%" />
                  <Tooltip {...TT} formatter={v => v + "%"} />
                  <Area type="monotone" dataKey="margin" stroke={C.purple} fill={C.purple + "30"} strokeWidth={2} name="Margin %" />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
            <Card>
              <SHead title="Payment Status" />
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <ResponsiveContainer width="50%" height={160}>
                  <PieChart>
                    <Pie data={payStatus} cx="50%" cy="50%" outerRadius={60} dataKey="v" paddingAngle={3}>
                      <Cell fill={C.green} />
                      <Cell fill={C.amber} />
                      <Cell fill={C.red} />
                    </Pie>
                    <Tooltip {...TT} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ flex: 1 }}>
                  {[["Paid", C.green], ["Partial", C.amber], ["Pending", C.red]].map(([label, color], i) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 6, color: C.sub, fontSize: 12 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "block" }} />
                        {label}
                      </span>
                      <span style={{ color, fontWeight: 700, fontSize: 14 }}>{payStatus[i]?.v || 0}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 8, marginTop: 4 }}>
                    <div style={{ color: C.sub, fontSize: 11 }}>Total Invoices</div>
                    <div style={{ color: C.text, fontSize: 18, fontWeight: 700 }}>{sales.length}</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Summary totals */}
          <Card>
            <SHead title="Financial Summary" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              {[
                ["Total Revenue",    fmtL(totalRev),    C.teal,   "💰"],
                ["Total Collected",  fmtL(totalPaid),   C.green,  "✅"],
                ["Total Expenses",   fmtL(totalCost),   C.red,    "📉"],
                ["Net Profit",       fmtL(netProfit),   C.purple, "📈"],
                ["Stocking Cost",    fmtL(totalStocking), C.blue, "🐟"],
                ["Feed Cost",        fmtK(feedCost),    C.amber,  "🌾"],
                ["Labour Cost",      fmtK(totalLabour), C.sub,    "👥"],
                ["Profit Margin",    margin + "%",      C.purple, "📊"],
              ].map(([label, value, color, icon]) => (
                <div key={label} style={{ background: C.card2, borderRadius: 10, padding: "14px 16px", border: `1px solid ${color}20` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ color: C.sub, fontSize: 11 }}>{label}</span>
                    <span style={{ fontSize: 16 }}>{icon}</span>
                  </div>
                  <div style={{ color, fontSize: 18, fontWeight: 700 }}>{value}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── P&L ── */}
      {tab === "pnl" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card>
            <SHead title="Profit & Loss Statement (Monthly)" />
            <Tbl heads={["Month","Revenue","Feed Cost","Power","Labour","Maintenance","Total Cost","Gross Profit","Margin"]}>
              {monthlyData.map((m, i) => {
                const cost = m.cost || 0;
                const profit = m.profit || 0;
                const mg = m.rev > 0 ? ((profit / m.rev) * 100).toFixed(1) : 0;
                return (
                  <TR key={i}>
                    <TD bold color={C.blue}>{m.m} {m.yr || 2024}</TD>
                    <TD color={C.teal} bold>{fmtK(m.rev || 0)}</TD>
                    <TD color={C.amber}>{fmtK(Math.round(cost * 0.35))}</TD>
                    <TD color={C.sub}>{fmtK(Math.round(cost * 0.18))}</TD>
                    <TD color={C.sub}>{fmtK(Math.round(cost * 0.28))}</TD>
                    <TD color={C.sub}>{fmtK(Math.round(cost * 0.08))}</TD>
                    <TD color={C.red}>{fmtK(cost)}</TD>
                    <TD color={profit > 0 ? C.green : C.red} bold>{fmtK(profit)}</TD>
                    <TD color={+mg > 30 ? C.green : +mg > 15 ? C.amber : C.red} bold>{mg}%</TD>
                  </TR>
                );
              })}
            </Tbl>
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.border}`, display: "flex", gap: 28 }}>
              {[
                ["Total Revenue", fmtL(totalRev),    C.teal],
                ["Total Cost",    fmtL(totalCost),   C.red],
                ["Net Profit",    fmtL(netProfit),   C.purple],
                ["Avg Margin",    margin + "%",      C.amber],
              ].map(([l, v, c]) => (
                <div key={l}>
                  <div style={{ color: C.sub, fontSize: 11 }}>{l}</div>
                  <div style={{ color: c, fontSize: 18, fontWeight: 700, marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <SHead title="Revenue vs Profit (Area Chart)" />
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthlyData}>
                <XAxis dataKey="m" stroke={C.sub} fontSize={10} />
                <YAxis stroke={C.sub} fontSize={10} tickFormatter={fmtK} />
                <Tooltip {...TT} formatter={v => fmtK(v)} />
                <Legend wrapperStyle={{ fontSize: 11, color: C.sub }} />
                <Area type="monotone" dataKey="rev"    stroke={C.teal}   fill={C.teal + "30"}   strokeWidth={2} name="Revenue" />
                <Area type="monotone" dataKey="profit" stroke={C.purple} fill={C.purple + "30"} strokeWidth={2} name="Profit" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* ── EXPENSES ── */}
      {tab === "expenses" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Card>
              <SHead title="Expense Categories" />
              <Tbl heads={["Category","Amount","% of Total"]}>
                {costBreak.map((d, i) => (
                  <TR key={d.name}>
                    <TD>
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: CLRS[i], display: "block" }} />
                        {d.name}
                      </span>
                    </TD>
                    <TD color={CLRS[i]} bold>{fmt(d.v)}</TD>
                    <TD>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ height: 6, width: 80, background: C.border, borderRadius: 3 }}>
                          <div style={{ height: 6, width: `${(d.v / totalCost * 100).toFixed(0)}%`, background: CLRS[i], borderRadius: 3 }} />
                        </div>
                        <span style={{ color: C.sub, fontSize: 11 }}>{(d.v / totalCost * 100).toFixed(1)}%</span>
                      </div>
                    </TD>
                  </TR>
                ))}
              </Tbl>
            </Card>
            <Card>
              <SHead title="Staff Cost by Role" />
              <Tbl heads={["Role","Monthly Cost","Annual Cost"]}>
                {roleCost.map((r, i) => (
                  <TR key={r.role}>
                    <TD color={CLRS[i]}>{r.role}</TD>
                    <TD bold>{fmt(r.total)}</TD>
                    <TD color={C.amber}>{fmt(r.total * 12)}</TD>
                  </TR>
                ))}
                <TR>
                  <TD bold color={C.text}>Total</TD>
                  <TD bold color={C.teal}>{fmt(staff.reduce((s, x) => s + (x.sal || 0), 0))}</TD>
                  <TD bold color={C.teal}>{fmtL(staff.reduce((s, x) => s + (x.sal || 0), 0) * 12)}</TD>
                </TR>
              </Tbl>
            </Card>
          </div>
          <Card>
            <SHead title="Maintenance Cost by Category" />
            <Tbl heads={["Category","Total Cost","Jobs Completed","Avg Per Job"]}>
              {maintCat.map((m, i) => {
                const jobs = maint.filter(x => x.cat === m.cat && x.status === "completed").length;
                return (
                  <TR key={m.cat}>
                    <TD color={CLRS[i]}>{m.cat}</TD>
                    <TD bold color={C.red}>{fmt(m.cost)}</TD>
                    <TD>{jobs}</TD>
                    <TD color={C.amber}>{jobs > 0 ? fmt(Math.round(m.cost / jobs)) : "—"}</TD>
                  </TR>
                );
              })}
            </Tbl>
          </Card>
        </div>
      )}

      {/* ── SALES LEDGER ── */}
      {tab === "sales" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Card>
              <SHead title="Farmer-wise Revenue" />
              <Tbl heads={["Farmer","Revenue","Paid","Balance","Invoices"]}>
                {farmerSales.map((f, i) => (
                  <TR key={f.name}>
                    <TD color={CLRS[i % CLRS.length]} bold small>{f.name}</TD>
                    <TD color={C.teal} bold>{fmtK(f.revenue)}</TD>
                    <TD color={C.green}>{fmtK(f.paid)}</TD>
                    <TD color={f.balance > 0 ? C.red : C.sub}>{f.balance > 0 ? fmtK(f.balance) : "—"}</TD>
                    <TD>{f.count}</TD>
                  </TR>
                ))}
              </Tbl>
            </Card>
            <Card>
              <SHead title="Revenue by Payment Method" />
              {(() => {
                const methods = ["Bank","Cash","UPI","Cheque"];
                const data = methods.map(m => ({
                  name: m,
                  v: sales.filter(s => s.method === m).reduce((sum, s) => sum + (s.total || 0), 0),
                  count: sales.filter(s => s.method === m).length,
                })).filter(d => d.v > 0);
                return (
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <ResponsiveContainer width="55%" height={180}>
                      <PieChart>
                        <Pie data={data} cx="50%" cy="50%" outerRadius={65} dataKey="v" paddingAngle={3}>
                          {data.map((_, i) => <Cell key={i} fill={CLRS[i]} />)}
                        </Pie>
                        <Tooltip {...TT} formatter={v => fmtK(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ flex: 1 }}>
                      {data.map((d, i) => (
                        <div key={d.name} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                          <span style={{ display: "flex", alignItems: "center", gap: 5, color: C.sub, fontSize: 11 }}>
                            <span style={{ width: 7, height: 7, borderRadius: "50%", background: CLRS[i], display: "block" }} />
                            {d.name}
                          </span>
                          <span style={{ color: C.text, fontSize: 11, fontWeight: 600 }}>{fmtK(d.v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </Card>
          </div>
          <Card>
            <SHead title="All Sales Invoices" />
            <Tbl heads={["Invoice","Date","Farmer","Tank","Qty (K)","PL Stage","Rate/K","Total","Paid","Balance","Method","Status"]}>
              {sales.map(s => (
                <TR key={s.id}>
                  <TD color={C.blue} bold small>{s.inv}</TD>
                  <TD small color={C.sub}>{s.date}</TD>
                  <TD small>{farmerMap[s.fId] || "—"}</TD>
                  <TD small>T-{s.tId}</TD>
                  <TD>{((s.qty || 0) / 1000).toFixed(0)}K</TD>
                  <TD small color={C.purple}>{s.pl}</TD>
                  <TD>₹{s.p1k}</TD>
                  <TD bold color={C.teal}>{fmt(s.total)}</TD>
                  <TD color={C.green}>{fmt(s.paid)}</TD>
                  <TD color={s.bal > 0 ? C.red : C.sub}>{s.bal > 0 ? fmt(s.bal) : "—"}</TD>
                  <TD small color={C.sub}>{s.method}</TD>
                  <TD>
                    <Badge
                      label={s.status}
                      color={s.status === "paid" ? C.green : s.status === "partial" ? C.amber : C.red}
                    />
                  </TD>
                </TR>
              ))}
            </Tbl>
          </Card>
        </div>
      )}

      {/* ── BATCH FINANCE ── */}
      {tab === "batchwise" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card>
            <SHead title="Batch-wise Financial Summary" />
            <Tbl heads={["Batch No","Tank","PL Count","Hatchery","DOC","SR%","Stocking Cost","Est. Revenue","Est. Profit","Margin","Status"]}>
              {batchPnL.map(b => (
                <TR key={b.id}>
                  <TD color={C.blue} bold small>{b.no}</TD>
                  <TD small>T-{b.tId}</TD>
                  <TD>{((b.cnt || 0) / 1000).toFixed(0)}K</TD>
                  <TD color={C.sub} small>{b.hatch}</TD>
                  <TD>{b.doc}d</TD>
                  <TD color={C.purple} bold>{b.sr}%</TD>
                  <TD color={C.red}>{fmt(b.cost || 0)}</TD>
                  <TD color={C.teal} bold>{fmt(b.estRev)}</TD>
                  <TD color={b.profit > 0 ? C.green : C.red} bold>{fmt(b.profit)}</TD>
                  <TD color={+b.profitPct > 20 ? C.green : +b.profitPct > 0 ? C.amber : C.red} bold>{b.profitPct}%</TD>
                  <TD><Badge label={b.status} color={b.status === "active" ? C.teal : b.status === "harvest-ready" ? C.amber : b.status === "harvested" ? C.green : C.sub} /></TD>
                </TR>
              ))}
            </Tbl>
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.border}`, display: "flex", gap: 28 }}>
              {[
                ["Total Stocking", fmtL(totalStocking), C.red],
                ["Est. Revenue",   fmtL(totalRev),      C.teal],
                ["Est. Profit",    fmtL(netProfit),     C.purple],
                ["Avg Margin",     margin + "%",        C.amber],
              ].map(([l, v, c]) => (
                <div key={l}>
                  <div style={{ color: C.sub, fontSize: 11 }}>{l}</div>
                  <div style={{ color: c, fontSize: 18, fontWeight: 700, marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <SHead title="Batch Profit Distribution" />
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={batchPnL.slice(0, 12)}>
                <XAxis dataKey="no" stroke={C.sub} fontSize={9} />
                <YAxis stroke={C.sub} fontSize={10} tickFormatter={fmtK} />
                <Tooltip {...TT} formatter={v => fmt(v)} />
                <Legend wrapperStyle={{ fontSize: 11, color: C.sub }} />
                <Bar dataKey="cost"    fill={C.red}    radius={[4,4,0,0]} name="Stocking Cost" />
                <Bar dataKey="estRev"  fill={C.teal}   radius={[4,4,0,0]} name="Est. Revenue" />
                <Bar dataKey="profit"  fill={C.purple} radius={[4,4,0,0]} name="Est. Profit" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* ── POWER & MAINTENANCE ── */}
      {tab === "power" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <KPI label="Total Power Cost"       value={fmt(totalPower)}  sub="YTD"            color={C.amber}  icon="⚡" />
            <KPI label="Total Maintenance Cost" value={fmt(totalMaint)}  sub="completed jobs" color={C.red}    icon="🔧" />
          </div>
          <Card>
            <SHead title="Monthly Power Consumption & Cost" />
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={powerData}>
                <XAxis dataKey="name" stroke={C.sub} fontSize={10} />
                <YAxis yAxisId="units" stroke={C.sub} fontSize={10} />
                <YAxis yAxisId="amt" orientation="right" stroke={C.amber} fontSize={10} tickFormatter={fmtK} />
                <Tooltip {...TT} />
                <Legend wrapperStyle={{ fontSize: 11, color: C.sub }} />
                <Bar yAxisId="units" dataKey="units" fill={C.blue}  radius={[4,4,0,0]} name="Units (kWh)" />
                <Bar yAxisId="amt"   dataKey="amt"   fill={C.amber} radius={[4,4,0,0]} name="Cost (₹)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <SHead title="Power Bills" />
            <Tbl heads={["Month","Year","Units (kWh)","Amount","Paid Date","Status"]}>
              {power.map(p => (
                <TR key={p.id}>
                  <TD bold>{p.month}</TD>
                  <TD color={C.sub}>{p.year}</TD>
                  <TD color={C.blue}>{(p.units || 0).toLocaleString("en-IN")}</TD>
                  <TD color={C.amber} bold>{fmt(p.amt)}</TD>
                  <TD small color={C.sub}>{p.paid || "—"}</TD>
                  <TD><Badge label={p.status} color={p.status === "paid" ? C.green : p.status === "pending" ? C.amber : C.red} /></TD>
                </TR>
              ))}
            </Tbl>
          </Card>
          <Card>
            <SHead title="Maintenance Records" />
            <Tbl heads={["Date","Category","Sub-Category","Description","Vendor","Cost","Done By","Next Due","Status"]}>
              {maint.map(m => (
                <TR key={m.id}>
                  <TD small color={C.sub}>{m.date}</TD>
                  <TD color={C.blue} bold small>{m.cat}</TD>
                  <TD small color={C.sub}>{m.sub || "—"}</TD>
                  <TD small>{m.desc}</TD>
                  <TD small color={C.sub}>{m.vendor || "—"}</TD>
                  <TD color={C.red} bold>{fmt(m.cost || 0)}</TD>
                  <TD small color={C.sub}>{m.by || "—"}</TD>
                  <TD small color={m.nxt ? C.amber : C.sub}>{m.nxt || "—"}</TD>
                  <TD><Badge label={m.status} color={m.status === "completed" ? C.green : m.status === "scheduled" ? C.blue : C.amber} /></TD>
                </TR>
              ))}
            </Tbl>
          </Card>
        </div>
      )}
    </div>
  );
}
