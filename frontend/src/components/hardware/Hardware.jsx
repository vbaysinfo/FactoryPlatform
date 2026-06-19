import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase.js";
import { useApp } from "../../context/AppContext.jsx";
import { Card, Btn, Input, Select, Modal, Table, PageHeader, Badge, Spinner, statusColor } from "../common/ui.jsx";

const CATEGORIES = ["hinge","drawer_channel","handle","lock","rod","basket","led_profile","glass_shutter","connector","other"];
const EMPTY = { item_name:"", category:"hinge", brand:"", specification:"", quantity:"1", unit:"nos", unit_cost:"0", notes:"" };

export default function Hardware() {
  const { tenant, user, addNotification, pageParams } = useApp();
  const [rooms, setRooms] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(pageParams?.roomId || null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (tenant) loadRooms(); }, [tenant]);
  useEffect(() => { if (selectedRoom) loadItems(selectedRoom); }, [selectedRoom]);
  useEffect(() => { if (pageParams?.roomId) setSelectedRoom(pageParams.roomId); }, [pageParams]);

  async function loadRooms() {
    const { data } = await supabase.from("rooms")
      .select("*, projects(name, clients(name)), hardware_items(id)")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false });
    setRooms(data || []);
    setLoading(false);
  }

  async function loadItems(roomId) {
    const { data } = await supabase.from("hardware_items").select("*").eq("room_id", roomId).order("created_at");
    setItems(data || []);
  }

  async function autoSuggest(roomId) {
    // Get cut list data to auto-suggest
    const { data: revisions } = await supabase.from("cut_list_revisions")
      .select("id").eq("room_id", roomId).eq("status", "confirmed").order("revision_number", { ascending: false }).limit(1);
    if (!revisions?.length) return addNotification("No confirmed cut list found", "error");

    const { data: room } = await supabase.from("rooms").select("*").eq("id", roomId).single();
    const suggestions = [];
    if (room.shutters > 0) {
      suggestions.push({ item_name: "Soft-close Hinge", category: "hinge", quantity: room.shutters * 2, unit: "nos", unit_cost: 35, is_auto_suggested: true });
    }
    if (room.drawers > 0) {
      suggestions.push({ item_name: "Telescopic Drawer Channel", category: "drawer_channel", quantity: room.drawers, unit: "pairs", unit_cost: 280, is_auto_suggested: true });
    }

    for (const s of suggestions) {
      await supabase.from("hardware_items").insert({
        ...s, room_id: roomId, revision_id: revisions[0].id,
        tenant_id: tenant.id, total_cost: s.quantity * s.unit_cost
      });
    }
    addNotification(`${suggestions.length} items auto-suggested`);
    loadItems(roomId);
  }

  async function save() {
    if (!form.item_name) return addNotification("Item name required", "error");
    setSaving(true);
    const payload = {
      ...form, room_id: selectedRoom, tenant_id: tenant.id,
      quantity: parseInt(form.quantity), unit_cost: parseFloat(form.unit_cost),
      total_cost: parseInt(form.quantity) * parseFloat(form.unit_cost)
    };
    const { error } = editing
      ? await supabase.from("hardware_items").update(payload).eq("id", editing.id)
      : await supabase.from("hardware_items").insert(payload);
    if (error) addNotification(error.message, "error");
    else { addNotification("Saved"); setModal(false); setForm(EMPTY); setEditing(null); loadItems(selectedRoom); }
    setSaving(false);
  }

  async function confirmHardware() {
    await supabase.from("rooms").update({ status: "hardware_confirmed" }).eq("id", selectedRoom);
    addNotification("Hardware list confirmed — room released to production");
    loadRooms();
  }

  async function deleteItem(id) {
    await supabase.from("hardware_items").delete().eq("id", id);
    loadItems(selectedRoom);
  }

  const f = (k) => ({ value: form[k], onChange: e => setForm(p => ({ ...p, [k]: e.target.value })) });
  const totalCost = items.reduce((s, i) => s + (i.total_cost || 0), 0);

  if (selectedRoom) {
    const room = rooms.find(r => r.id === selectedRoom);
    return (
      <div style={{ padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <Btn variant="ghost" size="sm" onClick={() => { setSelectedRoom(null); setItems([]); }}>← Back</Btn>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 18, fontWeight: 700 }}>Hardware: {room?.room_name}</h1>
            <p style={{ fontSize: 12, color: "#64748b" }}>{room?.projects?.clients?.name} — {room?.projects?.name}</p>
          </div>
          <Btn size="sm" variant="outline" onClick={() => autoSuggest(selectedRoom)}>Auto-Suggest</Btn>
          <Btn size="sm" onClick={() => { setEditing(null); setForm(EMPTY); setModal(true); }}>+ Add Item</Btn>
          {items.length > 0 && (
            <Btn size="sm" variant="success" onClick={confirmHardware}>✓ Confirm Hardware</Btn>
          )}
        </div>

        <Card style={{ padding: 0 }}>
          <div style={{ padding: "10px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: "#64748b" }}>{items.length} items</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>Total: ₹{totalCost.toLocaleString("en-IN")}</span>
          </div>
          <Table
            columns={[
              { key: "item_name", label: "Item", render: (v, r) => (
                <div>
                  <div style={{ fontWeight: 600 }}>{v}</div>
                  {r.brand && <div style={{ fontSize: 11, color: "#64748b" }}>{r.brand}</div>}
                  {r.specification && <div style={{ fontSize: 11, color: "#94a3b8" }}>{r.specification}</div>}
                </div>
              )},
              { key: "category", label: "Category", render: v => <Badge color="blue">{v?.replace("_"," ")}</Badge> },
              { key: "quantity", label: "Qty", align: "center" },
              { key: "unit", label: "Unit" },
              { key: "unit_cost", label: "Unit Cost", align: "right", render: v => `₹${(v||0).toLocaleString("en-IN")}` },
              { key: "total_cost", label: "Total", align: "right", render: v => `₹${(v||0).toLocaleString("en-IN")}` },
              { key: "is_auto_suggested", label: "Source", render: v => <Badge color={v ? "yellow" : "gray"}>{v ? "Auto" : "Manual"}</Badge> },
              { key: "id", label: "Actions", render: (_, r) => (
                <div style={{ display: "flex", gap: 4 }}>
                  <Btn size="sm" variant="ghost" onClick={() => { setEditing(r); setForm({ ...EMPTY, ...r, quantity: String(r.quantity), unit_cost: String(r.unit_cost) }); setModal(true); }}>Edit</Btn>
                  <Btn size="sm" variant="ghost" onClick={() => deleteItem(r.id)}>Del</Btn>
                </div>
              )},
            ]}
            data={items}
            emptyText="No hardware items. Use Auto-Suggest or add manually."
          />
        </Card>

        <Modal open={modal} onClose={() => { setModal(false); setEditing(null); setForm(EMPTY); }} title={editing ? "Edit Item" : "Add Hardware"}>
          <Input label="Item Name" required {...f("item_name")} />
          <Select label="Category" {...f("category")}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c.replace("_"," ")}</option>)}
          </Select>
          <Input label="Brand" {...f("brand")} />
          <Input label="Specification" {...f("specification")} placeholder="e.g. 165° soft-close, 35mm cup" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 12px" }}>
            <Input label="Quantity" type="number" {...f("quantity")} />
            <Input label="Unit" {...f("unit")} placeholder="nos, pairs, mtr" />
            <Input label="Unit Cost (₹)" type="number" {...f("unit_cost")} />
          </div>
          <Input label="Notes" {...f("notes")} />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Btn variant="ghost" onClick={() => { setModal(false); setEditing(null); }}>Cancel</Btn>
            <Btn onClick={save} disabled={saving}>{saving ? "Saving..." : editing ? "Update" : "Add"}</Btn>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <PageHeader title="Hardware Management" subtitle="Per-room hardware lists" />
      <Card style={{ padding: 0 }}>
        {loading ? <Spinner /> : (
          <Table
            columns={[
              { key: "room_name", label: "Room", render: (v, r) => (
                <div>
                  <div style={{ fontWeight: 600 }}>{v}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{r.projects?.clients?.name} — {r.projects?.name}</div>
                </div>
              )},
              { key: "status", label: "Status", render: v => <Badge color={statusColor(v)}>{v?.replace(/_/g," ")}</Badge> },
              { key: "hardware_items", label: "Items", align: "center", render: v => <Badge color="blue">{v?.length || 0}</Badge> },
              { key: "id", label: "Action", render: (_, r) => <Btn size="sm" onClick={() => setSelectedRoom(r.id)}>Manage →</Btn> },
            ]}
            data={rooms}
            emptyText="No rooms found. Add rooms from Projects first."
          />
        )}
      </Card>
    </div>
  );
}
