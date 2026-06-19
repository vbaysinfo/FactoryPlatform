import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase.js";
import { useApp } from "../../context/AppContext.jsx";
import { Card, Btn, Input, Select, Modal, Table, PageHeader, Badge, Spinner, statusColor } from "../common/ui.jsx";
import CutListEditor from "./CutListEditor.jsx";

export default function CutList() {
  const { tenant, pageParams } = useApp();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(pageParams?.roomId || null);

  useEffect(() => { if (tenant) load(); }, [tenant]);
  useEffect(() => { if (pageParams?.roomId) setSelectedRoom(pageParams.roomId); }, [pageParams]);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("rooms")
      .select("*, projects(name, clients(name)), cut_list_revisions(id, revision_number, status, created_at)")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false });
    setRooms(data || []);
    setLoading(false);
  }

  if (selectedRoom) return <CutListEditor roomId={selectedRoom} onBack={() => { setSelectedRoom(null); load(); }} />;

  return (
    <div style={{ padding: 24 }}>
      <PageHeader title="Cut Lists" subtitle="Manage panel cut lists per room" />

      <Card style={{ padding: 0 }}>
        {loading ? <Spinner /> : rooms.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: "#94a3b8" }}>
            No rooms found. Add rooms from the Projects section first.
          </div>
        ) : (
          <Table
            columns={[
              { key: "room_name", label: "Room", render: (v, r) => (
                <div>
                  <div style={{ fontWeight: 600 }}>{v}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{r.projects?.clients?.name} — {r.projects?.name}</div>
                </div>
              )},
              { key: "room_type", label: "Type" },
              { key: "status", label: "Room Status", render: v => <Badge color={statusColor(v)}>{v?.replace(/_/g," ")}</Badge> },
              { key: "cut_list_revisions", label: "Revisions", align: "center", render: v => (
                <Badge color={v?.length ? "blue" : "gray"}>{v?.length || 0} rev{v?.length !== 1 ? "s" : ""}</Badge>
              )},
              { key: "cut_list_revisions", label: "Latest Status", render: v => {
                const latest = v?.slice(-1)[0];
                return latest ? <Badge color={statusColor(latest.status)}>{latest.status}</Badge> : <span style={{ color: "#94a3b8", fontSize: 12 }}>No cut list</span>;
              }},
              { key: "id", label: "Action", render: (_, r) => (
                <Btn size="sm" onClick={() => setSelectedRoom(r.id)}>Open Editor →</Btn>
              )},
            ]}
            data={rooms}
          />
        )}
      </Card>
    </div>
  );
}
