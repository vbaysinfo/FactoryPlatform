import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase.js";
import { useApp } from "../../context/AppContext.jsx";
import { Card, Btn, Select, Modal, Table, PageHeader, Badge, Spinner, statusColor } from "../common/ui.jsx";

const DEFAULT_STAGES = [
  "Pressing","Cutting","Edge Binding","Drilling/Boring","Assembly/Fitting","QC Check","Packing"
];

export default function Production() {
  const { tenant, user, addNotification, pageParams } = useApp();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [stageLogs, setStageLogs] = useState([]);
  const [stages, setStages] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [updateModal, setUpdateModal] = useState(null);
  const [stageStatus, setStageStatus] = useState("in_progress");
  const [assignee, setAssignee] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (tenant) { loadJobs(); loadStages(); loadEmployees(); } }, [tenant]);

  async function loadJobs() {
    setLoading(true);
    const { data } = await supabase.from("production_jobs")
      .select("*, projects(name, clients(name)), rooms(room_name), production_stage_logs(*)")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: false });
    setJobs(data || []);
    setLoading(false);
  }

  async function loadStages() {
    const { data } = await supabase.from("production_stages_config")
      .select("*").eq("tenant_id", tenant.id).eq("is_active", true).order("sort_order");
    if (!data || data.length === 0) {
      // seed default stages
      const inserts = DEFAULT_STAGES.map((s, i) => ({ tenant_id: tenant.id, stage_name: s, stage_code: s.toLowerCase().replace(/[^a-z]/g,"_"), sort_order: i }));
      const { data: inserted } = await supabase.from("production_stages_config").insert(inserts).select();
      setStages(inserted || []);
    } else setStages(data);
  }

  async function loadEmployees() {
    const { data } = await supabase.from("employees").select("id, name, role").eq("tenant_id", tenant.id).eq("is_active", true);
    setEmployees(data || []);
  }

  async function loadStageLogs(jobId) {
    const { data } = await supabase.from("production_stage_logs").select("*, users(name)").eq("job_id", jobId).order("created_at");
    setStageLogs(data || []);
  }

  async function openJob(job) {
    setSelectedJob(job);
    await loadStageLogs(job.id);
  }

  async function releaseToProduction(room) {
    // Create production job from room
    const { data: job, error } = await supabase.from("production_jobs").insert({
      tenant_id: tenant.id, project_id: room.project_id, room_id: room.id,
      status: "pending", job_code: `JOB-${Date.now().toString().slice(-5)}`,
      released_at: new Date().toISOString()
    }).select().single();
    if (error) { addNotification(error.message, "error"); return; }

    // Create stage logs for each stage
    for (let i = 0; i < stages.length; i++) {
      await supabase.from("production_stage_logs").insert({
        tenant_id: tenant.id, job_id: job.id,
        stage_id: stages[i].id, stage_name: stages[i].stage_name, status: "pending"
      });
    }

    await supabase.from("rooms").update({ status: "released" }).eq("id", room.id);
    addNotification("Room released to production");
    loadJobs();
  }

  async function updateStageStatus() {
    if (!updateModal) return;
    setSaving(true);
    const now = new Date().toISOString();
    const updates = { status: stageStatus, assigned_to: assignee || null };
    if (stageStatus === "in_progress") updates.started_at = now;
    if (stageStatus === "completed") updates.completed_at = now;
    await supabase.from("production_stage_logs").update(updates).eq("id", updateModal.id);
    addNotification("Stage updated");
    setUpdateModal(null);
    await loadStageLogs(selectedJob.id);
    setSaving(false);
  }

  const stageColor = { pending:"gray", in_progress:"blue", completed:"green", on_hold:"yellow", rework:"red" };

  if (selectedJob) return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <Btn variant="ghost" size="sm" onClick={() => { setSelectedJob(null); setStageLogs([]); }}>← Back</Btn>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700 }}>Job: {selectedJob.job_code}</h1>
          <p style={{ fontSize: 12, color: "#64748b" }}>
            {selectedJob.projects?.clients?.name} — {selectedJob.projects?.name} — {selectedJob.rooms?.room_name}
          </p>
        </div>
        <Badge color={statusColor(selectedJob.status)}>{selectedJob.status}</Badge>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {stageLogs.map((log, i) => (
          <Card key={log.id} style={{ padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%", background: log.status === "completed" ? "#10b981" : "#e2e8f0",
                  color: log.status === "completed" ? "white" : "#94a3b8",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700
                }}>{i + 1}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{log.stage_name}</div>
                  {log.users && <div style={{ fontSize: 11, color: "#64748b" }}>Assigned: {log.users.name}</div>}
                  {log.started_at && <div style={{ fontSize: 11, color: "#94a3b8" }}>
                    Started: {new Date(log.started_at).toLocaleString("en-IN")}
                    {log.completed_at && ` · Done: ${new Date(log.completed_at).toLocaleString("en-IN")}`}
                  </div>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Badge color={stageColor[log.status] || "gray"}>{log.status?.replace("_"," ")}</Badge>
                {log.status !== "completed" && (
                  <Btn size="sm" onClick={() => { setUpdateModal(log); setStageStatus(log.status || "in_progress"); setAssignee(log.assigned_to || ""); }}>
                    Update
                  </Btn>
                )}
              </div>
            </div>
            {log.qc_notes && <div style={{ marginTop: 8, fontSize: 12, color: "#64748b", background: "#f8fafc", borderRadius: 6, padding: 8 }}>QC: {log.qc_notes}</div>}
          </Card>
        ))}
      </div>

      <Modal open={!!updateModal} onClose={() => setUpdateModal(null)} title={`Update: ${updateModal?.stage_name}`}>
        <Select label="Status" value={stageStatus} onChange={e => setStageStatus(e.target.value)}>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="on_hold">On Hold</option>
          <option value="rework">Rework Required</option>
        </Select>
        <Select label="Assign To" value={assignee} onChange={e => setAssignee(e.target.value)}>
          <option value="">-- Select Employee --</option>
          {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.role})</option>)}
        </Select>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Btn variant="ghost" onClick={() => setUpdateModal(null)}>Cancel</Btn>
          <Btn onClick={updateStageStatus} disabled={saving}>{saving ? "Saving..." : "Update Stage"}</Btn>
        </div>
      </Modal>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <PageHeader title="Production Workflow" subtitle={`${jobs.length} production jobs`} />

      <Card style={{ padding: 0 }}>
        {loading ? <Spinner /> : (
          <Table
            columns={[
              { key: "job_code", label: "Job Code", render: (v, r) => (
                <div>
                  <div style={{ fontWeight: 600 }}>{v}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{r.projects?.clients?.name} — {r.rooms?.room_name}</div>
                </div>
              )},
              { key: "projects", label: "Project", render: v => v?.name },
              { key: "status", label: "Status", render: v => <Badge color={statusColor(v)}>{v?.replace("_"," ")}</Badge> },
              { key: "priority", label: "Priority", render: v => <Badge color={v==="urgent"?"red":v==="high"?"orange":v==="normal"?"blue":"gray"}>{v}</Badge> },
              { key: "production_stage_logs", label: "Progress", render: v => {
                const done = v?.filter(s => s.status === "completed").length || 0;
                const total = v?.length || 0;
                return (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ flex: 1, height: 6, background: "#e2e8f0", borderRadius: 3, minWidth: 80 }}>
                        <div style={{ height: "100%", background: "#10b981", borderRadius: 3, width: `${total ? (done/total)*100 : 0}%` }} />
                      </div>
                      <span style={{ fontSize: 11, color: "#64748b" }}>{done}/{total}</span>
                    </div>
                  </div>
                );
              }},
              { key: "released_at", label: "Released", render: v => v ? new Date(v).toLocaleDateString("en-IN") : "—" },
              { key: "id", label: "Action", render: (_, r) => <Btn size="sm" onClick={() => openJob(r)}>Track →</Btn> },
            ]}
            data={jobs}
            emptyText="No production jobs. Release validated rooms from Projects to start production."
          />
        )}
      </Card>
    </div>
  );
}
