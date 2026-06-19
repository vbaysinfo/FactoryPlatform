import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase.js";
import { useApp } from "../../context/AppContext.jsx";
import { Card, Btn, Input, Select, Modal, Table, PageHeader, Badge, Spinner } from "../common/ui.jsx";

const EMPTY = { name:"", item_code:"", brand:"", description:"", unit:"nos", unit_cost:"0", current_stock:"0", reorder_level:"0", supplier_name:"", supplier_contact:"", location:"" };
const TYPES = ["board","laminate","edge_band","hardware","other"];

export default function Inventory() {
  const { tenant, user, addNotification } = useApp();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [txnModal, setTxnModal] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [catForm, setCatForm] = useState({ name:"", type:"board" });
  const [selectedCat, setSelectedCat] = useState("");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [txn, setTxn] = useState({ transaction_type:"purchase", quantity:"", unit_cost:"", notes:"" });
  const [tab, setTab] = useState("items"); // items | categories | transactions

  useEffect(() => { if (tenant) { loadItems(); loadCategories(); } }, [tenant]);

  async function loadItems() {
    setLoading(true);
    const { data } = await supabase.from("inventory_items")
      .select("*, inventory_categories(name, type)")
      .eq("tenant_id", tenant.id)
      .order("name");
    setItems(data || []);
    setLoading(false);
  }

  async function loadCategories() {
    const { data } = await supabase.from("inventory_categories").select("*").eq("tenant_id", tenant.id);
    setCategories(data || []);
  }

  async function save() {
    if (!form.name) return addNotification("Item name required", "error");
    setSaving(true);
    const payload = {
      ...form, tenant_id: tenant.id, category_id: selectedCat || null,
      unit_cost: parseFloat(form.unit_cost), current_stock: parseFloat(form.current_stock),
      reorder_level: parseFloat(form.reorder_level)
    };
    const { error } = editing
      ? await supabase.from("inventory_items").update(payload).eq("id", editing.id)
      : await supabase.from("inventory_items").insert(payload);
    if (error) addNotification(error.message, "error");
    else { addNotification("Saved"); setModal(false); setForm(EMPTY); setEditing(null); loadItems(); }
    setSaving(false);
  }

  async function recordTransaction() {
    if (!txn.quantity) return addNotification("Quantity required", "error");
    setSaving(true);
    const qty = parseFloat(txn.quantity);
    const cost = parseFloat(txn.unit_cost || 0);
    await supabase.from("inventory_transactions").insert({
      ...txn, item_id: txnModal.id, tenant_id: tenant.id,
      quantity: qty, unit_cost: cost, total_cost: qty * cost,
      performed_by: user.id
    });
    // Update stock
    const delta = ["purchase","return"].includes(txn.transaction_type) ? qty : -qty;
    await supabase.from("inventory_items").update({ current_stock: (txnModal.current_stock || 0) + delta }).eq("id", txnModal.id);
    addNotification("Transaction recorded");
    setTxnModal(null);
    setTxn({ transaction_type:"purchase", quantity:"", unit_cost:"", notes:"" });
    loadItems();
    setSaving(false);
  }

  const f = (k) => ({ value: form[k], onChange: e => setForm(p => ({ ...p, [k]: e.target.value })) });

  const stockStatus = (item) => {
    if (item.current_stock <= 0) return <Badge color="red">Out of Stock</Badge>;
    if (item.current_stock <= item.reorder_level) return <Badge color="yellow">Low Stock</Badge>;
    return <Badge color="green">In Stock</Badge>;
  };

  return (
    <div style={{ padding: 24 }}>
      <PageHeader title="Inventory Management" subtitle={`${items.length} items`}
        actions={<Btn onClick={() => { setEditing(null); setForm(EMPTY); setSelectedCat(""); setModal(true); }}>+ New Item</Btn>} />

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {["items","categories"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: "6px 16px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12, fontWeight: 600, cursor: "pointer",
              background: tab === t ? "#3b82f6" : "#fff", color: tab === t ? "#fff" : "#374151" }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "items" && (
        <Card style={{ padding: 0 }}>
          {loading ? <Spinner /> : (
            <Table
              columns={[
                { key: "name", label: "Item", render: (v, r) => (
                  <div>
                    <div style={{ fontWeight: 600 }}>{v}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{r.item_code} · {r.brand}</div>
                  </div>
                )},
                { key: "inventory_categories", label: "Category", render: v => v ? <Badge color="blue">{v.name}</Badge> : "—" },
                { key: "current_stock", label: "Stock", align: "center", render: (v, r) => `${v || 0} ${r.unit}` },
                { key: "reorder_level", label: "Reorder At", align: "center", render: (v, r) => `${v || 0} ${r.unit}` },
                { key: "unit_cost", label: "Cost", align: "right", render: v => `₹${(v||0).toLocaleString("en-IN")}` },
                { key: "current_stock", label: "Status", render: (_, r) => stockStatus(r) },
                { key: "supplier_name", label: "Supplier" },
                { key: "id", label: "Actions", render: (_, r) => (
                  <div style={{ display: "flex", gap: 4 }}>
                    <Btn size="sm" variant="ghost" onClick={() => { setEditing(r); setForm({ ...EMPTY, ...r, unit_cost: String(r.unit_cost), current_stock: String(r.current_stock), reorder_level: String(r.reorder_level) }); setSelectedCat(r.category_id || ""); setModal(true); }}>Edit</Btn>
                    <Btn size="sm" onClick={() => setTxnModal(r)}>Record</Btn>
                  </div>
                )},
              ]}
              data={items}
              emptyText="No inventory items yet."
            />
          )}
        </Card>
      )}

      {tab === "categories" && (
        <div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input value={catForm.name} onChange={e => setCatForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Category name" style={{ padding: "7px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13, flex: 1 }} />
              <select value={catForm.type} onChange={e => setCatForm(p => ({ ...p, type: e.target.value }))}
                style={{ padding: "7px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13 }}>
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <Btn onClick={async () => {
                if (!catForm.name) return;
                await supabase.from("inventory_categories").insert({ ...catForm, tenant_id: tenant.id });
                setCatForm({ name:"", type:"board" }); loadCategories();
              }}>Add</Btn>
            </div>
          </div>
          <Card style={{ padding: 0 }}>
            <Table
              columns={[
                { key: "name", label: "Category", render: v => <div style={{ fontWeight: 600 }}>{v}</div> },
                { key: "type", label: "Type", render: v => <Badge color="purple">{v}</Badge> },
              ]}
              data={categories}
              emptyText="No categories."
            />
          </Card>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modal} onClose={() => { setModal(false); setEditing(null); }} title={editing ? "Edit Item" : "New Inventory Item"} width={600}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
          <div style={{ gridColumn: "1/-1" }}><Input label="Item Name" required {...f("name")} /></div>
          <Input label="Item Code" {...f("item_code")} placeholder="SKU / code" />
          <Input label="Brand" {...f("brand")} />
          <div style={{ gridColumn: "1/-1" }}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.4 }}>Category</label>
              <select value={selectedCat} onChange={e => setSelectedCat(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 13 }}>
                <option value="">-- None --</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
              </select>
            </div>
          </div>
          <Input label="Unit" {...f("unit")} placeholder="nos, sqft, mtr, kg" />
          <Input label="Unit Cost (₹)" type="number" {...f("unit_cost")} />
          <Input label="Current Stock" type="number" {...f("current_stock")} />
          <Input label="Reorder Level" type="number" {...f("reorder_level")} />
          <Input label="Supplier Name" {...f("supplier_name")} />
          <Input label="Supplier Contact" {...f("supplier_contact")} />
          <div style={{ gridColumn: "1/-1" }}><Input label="Location / Bin" {...f("location")} /></div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Btn variant="ghost" onClick={() => { setModal(false); setEditing(null); }}>Cancel</Btn>
          <Btn onClick={save} disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Add Item"}</Btn>
        </div>
      </Modal>

      {/* Transaction Modal */}
      <Modal open={!!txnModal} onClose={() => setTxnModal(null)} title={`Record Transaction: ${txnModal?.name}`}>
        <Select label="Transaction Type" value={txn.transaction_type} onChange={e => setTxn(p => ({ ...p, transaction_type: e.target.value }))}>
          <option value="purchase">Purchase (In)</option>
          <option value="usage">Usage (Out)</option>
          <option value="wastage">Wastage (Out)</option>
          <option value="return">Return (In)</option>
          <option value="adjustment">Adjustment</option>
        </Select>
        <Input label="Quantity" required type="number" value={txn.quantity} onChange={e => setTxn(p => ({ ...p, quantity: e.target.value }))} />
        {["purchase","return"].includes(txn.transaction_type) && (
          <Input label="Unit Cost (₹)" type="number" value={txn.unit_cost} onChange={e => setTxn(p => ({ ...p, unit_cost: e.target.value }))} />
        )}
        <Input label="Notes" value={txn.notes} onChange={e => setTxn(p => ({ ...p, notes: e.target.value }))} />
        <div style={{ padding: "10px", background: "#f8fafc", borderRadius: 8, marginBottom: 14, fontSize: 12 }}>
          Current Stock: <strong>{txnModal?.current_stock} {txnModal?.unit}</strong>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Btn variant="ghost" onClick={() => setTxnModal(null)}>Cancel</Btn>
          <Btn onClick={recordTransaction} disabled={saving}>{saving ? "Saving..." : "Record"}</Btn>
        </div>
      </Modal>
    </div>
  );
}
