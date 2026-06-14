"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";

export type DeviceStatus = "online" | "warning" | "maintenance";
export type TicketStatus = "open" | "in_progress" | "resolved";
export type TicketPriority = "low" | "medium" | "high";
type View = "dashboard" | "devices" | "tickets" | "details" | "logs";

export type Device = {
  id: number;
  name: string;
  ip_address: string;
  status: DeviceStatus;
  location: string;
};

export type Ticket = {
  id: number;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigned_to: string;
  created_at: string;
};

export type Analytics = {
  total_devices: number;
  device_statuses: Partial<Record<DeviceStatus, number>>;
  total_tickets: number;
  ticket_statuses: Partial<Record<TicketStatus, number>>;
  ticket_priorities: Partial<Record<TicketPriority, number>>;
  recent_activity_count: number;
};

export type ActivityLog = {
  id: number;
  entity_type: string;
  entity_id: number | null;
  action: string;
  summary: string;
  actor: string;
  created_at: string;
};

type AuthUser = {
  username: string;
  email: string;
  is_staff: boolean;
};

type DeviceFormState = Omit<Device, "id">;
type TicketFormState = Omit<Ticket, "id" | "created_at">;

type DeviceDashboardProps = {
  initialDevices: Device[];
  initialTickets: Ticket[];
  initialAnalytics: Analytics;
  initialActivity: ActivityLog[];
};

const emptyDeviceForm: DeviceFormState = {
  name: "",
  ip_address: "",
  status: "online",
  location: "",
};

const emptyTicketForm: TicketFormState = {
  title: "",
  description: "",
  status: "open",
  priority: "medium",
  assigned_to: "",
};

const statusLabels: Record<DeviceStatus, string> = {
  online: "Online",
  warning: "Warning",
  maintenance: "Maintenance",
};

const statusStyles: Record<DeviceStatus, string> = {
  online: "bg-emerald-100 text-emerald-800 border-emerald-200",
  warning: "bg-amber-100 text-amber-800 border-amber-200",
  maintenance: "bg-rose-100 text-rose-800 border-rose-200",
};

const ticketStatusStyles: Record<TicketStatus, string> = {
  open: "bg-sky-100 text-sky-800 border-sky-200",
  in_progress: "bg-amber-100 text-amber-800 border-amber-200",
  resolved: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

export default function DeviceDashboard({
  initialDevices,
  initialTickets,
  initialAnalytics,
  initialActivity,
}: DeviceDashboardProps) {
  const [devices, setDevices] = useState<Device[]>(initialDevices);
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [analytics, setAnalytics] = useState<Analytics>(initialAnalytics);
  const [activity, setActivity] = useState<ActivityLog[]>(initialActivity);
  const [activeView, setActiveView] = useState<View>("dashboard");
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | DeviceStatus>("all");
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(
    initialDevices[0]?.id ?? null,
  );
  const [deviceForm, setDeviceForm] = useState<DeviceFormState>(emptyDeviceForm);
  const [ticketForm, setTicketForm] = useState<TicketFormState>(emptyTicketForm);
  const [editingDeviceId, setEditingDeviceId] = useState<number | null>(null);
  const [editingTicketId, setEditingTicketId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/auth/status")
      .then((response) => response.json())
      .then((data) => {
        if (data.authenticated) {
          setAuthUser(data.user);
        }
      })
      .catch(() => undefined);
  }, []);

  const selectedDevice = devices.find((device) => device.id === selectedDeviceId);
  const filteredDevices = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return devices.filter((device) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [device.name, device.ip_address, device.location]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      const matchesStatus =
        statusFilter === "all" || device.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [devices, searchTerm, statusFilter]);

  async function refreshDerivedData() {
    const [analyticsResponse, activityResponse] = await Promise.all([
      fetch("/api/analytics"),
      fetch("/api/activity"),
    ]);

    if (analyticsResponse.ok) {
      setAnalytics(await analyticsResponse.json());
    }

    if (activityResponse.ok) {
      setActivity(await activityResponse.json());
    }
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginForm),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(data.detail || "Unable to sign in.");
      return;
    }

    setAuthUser(data.user);
    setLoginForm({ username: "", password: "" });
    setMessage("Signed in.");
    await refreshDerivedData();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthUser(null);
    setMessage("Signed out.");
    await refreshDerivedData();
  }

  function updateDeviceForm(field: keyof DeviceFormState, value: string) {
    setDeviceForm((current) => ({ ...current, [field]: value }));
  }

  function updateTicketForm(field: keyof TicketFormState, value: string) {
    setTicketForm((current) => ({ ...current, [field]: value }));
  }

  function resetDeviceForm() {
    setDeviceForm(emptyDeviceForm);
    setEditingDeviceId(null);
  }

  function resetTicketForm() {
    setTicketForm(emptyTicketForm);
    setEditingTicketId(null);
  }

  function startDeviceEdit(device: Device) {
    setEditingDeviceId(device.id);
    setDeviceForm({
      name: device.name,
      ip_address: device.ip_address,
      status: device.status,
      location: device.location,
    });
    setActiveView("devices");
    setMessage("");
  }

  function startTicketEdit(ticket: Ticket) {
    setEditingTicketId(ticket.id);
    setTicketForm({
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      assigned_to: ticket.assigned_to,
    });
    setActiveView("tickets");
    setMessage("");
  }

  async function submitDevice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    const isEditing = editingDeviceId !== null;
    const endpoint = isEditing ? `/api/devices/${editingDeviceId}` : "/api/devices";

    try {
      const response = await fetch(endpoint, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deviceForm),
      });

      if (!response.ok) {
        const errors = await response.json().catch(() => ({}));
        throw new Error(errors.detail || "Unable to save device");
      }

      const savedDevice: Device = await response.json();
      setDevices((current) =>
        isEditing
          ? current.map((device) =>
              device.id === savedDevice.id ? savedDevice : device,
            )
          : [savedDevice, ...current],
      );
      setSelectedDeviceId(savedDevice.id);
      resetDeviceForm();
      setMessage(isEditing ? "Device updated." : "Device created.");
      await refreshDerivedData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save device");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteDevice(device: Device) {
    if (!window.confirm(`Delete ${device.name}?`)) {
      return;
    }

    setMessage("");
    const response = await fetch(`/api/devices/${device.id}`, { method: "DELETE" });

    if (!response.ok) {
      setMessage("Unable to delete device");
      return;
    }

    setDevices((current) => current.filter((item) => item.id !== device.id));
    setSelectedDeviceId((current) => (current === device.id ? null : current));
    if (editingDeviceId === device.id) {
      resetDeviceForm();
    }
    setMessage("Device deleted.");
    await refreshDerivedData();
  }

  async function submitTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    const isEditing = editingTicketId !== null;
    const endpoint = isEditing ? `/api/tickets/${editingTicketId}` : "/api/tickets";

    try {
      const response = await fetch(endpoint, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ticketForm),
      });

      if (!response.ok) {
        const errors = await response.json().catch(() => ({}));
        throw new Error(errors.detail || "Unable to save ticket");
      }

      const savedTicket: Ticket = await response.json();
      setTickets((current) =>
        isEditing
          ? current.map((ticket) =>
              ticket.id === savedTicket.id ? savedTicket : ticket,
            )
          : [savedTicket, ...current],
      );
      resetTicketForm();
      setMessage(isEditing ? "Ticket updated." : "Ticket created.");
      await refreshDerivedData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save ticket");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteTicket(ticket: Ticket) {
    if (!window.confirm(`Delete ${ticket.title}?`)) {
      return;
    }

    setMessage("");
    const response = await fetch(`/api/tickets/${ticket.id}`, { method: "DELETE" });

    if (!response.ok) {
      setMessage("Unable to delete ticket");
      return;
    }

    setTickets((current) => current.filter((item) => item.id !== ticket.id));
    if (editingTicketId === ticket.id) {
      resetTicketForm();
    }
    setMessage("Ticket deleted.");
    await refreshDerivedData();
  }

  if (!authUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-5 text-slate-950">
        <form
          className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          onSubmit={login}
        >
          <h1 className="text-2xl font-bold">NetzFlow</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to operations</p>

          <div className="mt-6 grid gap-4">
            <Field label="Username" htmlFor="login-username">
              <input
                id="login-username"
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
                required
                value={loginForm.username}
                onChange={(event) =>
                  setLoginForm((current) => ({
                    ...current,
                    username: event.target.value,
                  }))
                }
              />
            </Field>

            <Field label="Password" htmlFor="login-password">
              <input
                id="login-password"
                className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500"
                required
                type="password"
                value={loginForm.password}
                onChange={(event) =>
                  setLoginForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
              />
            </Field>

            <button className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800">
              Sign In
            </button>
          </div>

          {message && <p className="mt-4 text-sm text-rose-700">{message}</p>}
        </form>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 lg:flex">
      <aside className="border-b border-slate-200 bg-white p-6 lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r">
        <h1 className="mb-8 text-2xl font-bold">NetzFlow</h1>

        <nav className="grid gap-2 text-sm font-medium text-slate-700">
          <NavButton active={activeView === "dashboard"} onClick={() => setActiveView("dashboard")}>Dashboard</NavButton>
          <NavButton active={activeView === "devices"} onClick={() => setActiveView("devices")}>Devices</NavButton>
          <NavButton active={activeView === "tickets"} onClick={() => setActiveView("tickets")}>Tickets</NavButton>
          <NavButton active={activeView === "details"} onClick={() => setActiveView("details")}>Details</NavButton>
          <NavButton active={activeView === "logs"} onClick={() => setActiveView("logs")}>Activity</NavButton>
        </nav>

        <div className="mt-8 border-t border-slate-200 pt-4 text-sm">
          <p className="font-semibold">{authUser.username}</p>
          <p className="text-slate-500">{authUser.is_staff ? "Staff" : "Operator"}</p>
          <button className="mt-3 text-sm font-medium text-slate-700 hover:text-slate-950" onClick={logout} type="button">
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 p-5 sm:p-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase text-slate-500">Operations</p>
            <h2 className="text-3xl font-bold sm:text-4xl">
              {activeView === "dashboard" ? "Dashboard" : activeView === "details" ? "Device Details" : activeView[0].toUpperCase() + activeView.slice(1)}
            </h2>
          </div>
          {message && (
            <p className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              {message}
            </p>
          )}
        </div>

        {activeView === "dashboard" && (
          <>
            <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <Metric label="Total Devices" value={analytics.total_devices} />
              <Metric label="Online" value={analytics.device_statuses.online || 0} />
              <Metric label="Open Tickets" value={analytics.ticket_statuses.open || 0} />
              <Metric label="High Priority" value={analytics.ticket_priorities.high || 0} />
              <Metric label="Activity Events" value={analytics.recent_activity_count} />
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <AnalyticsPanel title="Device Health" rows={[
                ["Online", analytics.device_statuses.online || 0, "bg-emerald-500"],
                ["Warning", analytics.device_statuses.warning || 0, "bg-amber-500"],
                ["Maintenance", analytics.device_statuses.maintenance || 0, "bg-rose-500"],
              ]} total={analytics.total_devices} />
              <AnalyticsPanel title="Ticket Queue" rows={[
                ["Open", analytics.ticket_statuses.open || 0, "bg-sky-500"],
                ["In progress", analytics.ticket_statuses.in_progress || 0, "bg-amber-500"],
                ["Resolved", analytics.ticket_statuses.resolved || 0, "bg-emerald-500"],
              ]} total={analytics.total_tickets} />
            </section>
          </>
        )}

        {activeView === "devices" && (
          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <DeviceTable
              devices={filteredDevices}
              searchTerm={searchTerm}
              statusFilter={statusFilter}
              totalDevices={devices.length}
              onDelete={deleteDevice}
              onEdit={startDeviceEdit}
              onSearch={setSearchTerm}
              onSelect={(device) => {
                setSelectedDeviceId(device.id);
                setActiveView("details");
              }}
              onStatusFilter={setStatusFilter}
            />
            <DeviceForm
              editingDeviceId={editingDeviceId}
              form={deviceForm}
              isSaving={isSaving}
              onCancel={resetDeviceForm}
              onChange={updateDeviceForm}
              onSubmit={submitDevice}
            />
          </section>
        )}

        {activeView === "tickets" && (
          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <TicketTable tickets={tickets} onDelete={deleteTicket} onEdit={startTicketEdit} />
            <TicketForm
              editingTicketId={editingTicketId}
              form={ticketForm}
              isSaving={isSaving}
              onCancel={resetTicketForm}
              onChange={updateTicketForm}
              onSubmit={submitTicket}
            />
          </section>
        )}

        {activeView === "details" && (
          <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-lg font-semibold">Devices</h3>
              <div className="grid gap-2">
                {devices.map((device) => (
                  <button
                    className={`rounded-md border px-3 py-2 text-left text-sm hover:bg-slate-50 ${selectedDeviceId === device.id ? "border-slate-950" : "border-slate-200"}`}
                    key={device.id}
                    onClick={() => setSelectedDeviceId(device.id)}
                    type="button"
                  >
                    <span className="block font-medium">{device.name}</span>
                    <span className="text-xs text-slate-500">{device.ip_address}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              {selectedDevice ? (
                <div>
                  <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-2xl font-bold">{selectedDevice.name}</h3>
                      <p className="font-mono text-sm text-slate-500">{selectedDevice.ip_address}</p>
                    </div>
                    <StatusBadge status={selectedDevice.status} />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <Detail label="Location" value={selectedDevice.location} />
                    <Detail label="Status" value={statusLabels[selectedDevice.status]} />
                    <Detail label="Linked Tickets" value={String(tickets.filter((ticket) => ticket.description.toLowerCase().includes(selectedDevice.name.toLowerCase())).length)} />
                  </div>

                  <div className="mt-6 flex gap-2">
                    <button className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-100" onClick={() => startDeviceEdit(selectedDevice)} type="button">
                      Edit Device
                    </button>
                    <button className="rounded-md border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50" onClick={() => deleteDevice(selectedDevice)} type="button">
                      Delete Device
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Select a device to view details.</p>
              )}
            </div>
          </section>
        )}

        {activeView === "logs" && <ActivityTable logs={activity} />}
      </main>
    </div>
  );
}

function DeviceTable({
  devices,
  onDelete,
  onEdit,
  onSearch,
  onSelect,
  onStatusFilter,
  searchTerm,
  statusFilter,
  totalDevices,
}: {
  devices: Device[];
  onDelete: (device: Device) => void;
  onEdit: (device: Device) => void;
  onSearch: (value: string) => void;
  onSelect: (device: Device) => void;
  onStatusFilter: (value: "all" | DeviceStatus) => void;
  searchTerm: string;
  statusFilter: "all" | DeviceStatus;
  totalDevices: number;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h3 className="text-xl font-semibold">Devices</h3>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500" placeholder="Search name, IP, location" value={searchTerm} onChange={(event) => onSearch(event.target.value)} />
            <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500" value={statusFilter} onChange={(event) => onStatusFilter(event.target.value as "all" | DeviceStatus)}>
              <option value="all">All statuses</option>
              <option value="online">Online</option>
              <option value="warning">Warning</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </div>
        <p className="text-sm text-slate-500">Showing {devices.length} of {totalDevices} devices</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-slate-100 text-left text-xs uppercase text-slate-600">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">IP</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {devices.map((device) => (
              <tr key={device.id}>
                <td className="px-4 py-3">
                  <button className="font-medium hover:underline" onClick={() => onSelect(device)} type="button">{device.name}</button>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{device.ip_address}</td>
                <td className="px-4 py-3"><StatusBadge status={device.status} /></td>
                <td className="px-4 py-3">{device.location}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100" onClick={() => onEdit(device)} type="button">Edit</button>
                    <button className="rounded-md border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50" onClick={() => onDelete(device)} type="button">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TicketTable({ tickets, onDelete, onEdit }: { tickets: Ticket[]; onDelete: (ticket: Ticket) => void; onEdit: (ticket: Ticket) => void }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4">
        <h3 className="text-xl font-semibold">Tickets</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] text-sm">
          <thead className="bg-slate-100 text-left text-xs uppercase text-slate-600">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Assigned To</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {tickets.map((ticket) => (
              <tr key={ticket.id}>
                <td className="px-4 py-3">
                  <p className="font-medium">{ticket.title}</p>
                  <p className="line-clamp-1 text-xs text-slate-500">{ticket.description}</p>
                </td>
                <td className="px-4 py-3 capitalize">{ticket.priority}</td>
                <td className="px-4 py-3"><TicketBadge status={ticket.status} /></td>
                <td className="px-4 py-3">{ticket.assigned_to || "Unassigned"}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100" onClick={() => onEdit(ticket)} type="button">Edit</button>
                    <button className="rounded-md border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50" onClick={() => onDelete(ticket)} type="button">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DeviceForm({ editingDeviceId, form, isSaving, onCancel, onChange, onSubmit }: { editingDeviceId: number | null; form: DeviceFormState; isSaving: boolean; onCancel: () => void; onChange: (field: keyof DeviceFormState, value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <form className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" onSubmit={onSubmit}>
      <PanelTitle title={editingDeviceId === null ? "Create Device" : "Edit Device"} onCancel={editingDeviceId === null ? undefined : onCancel} />
      <div className="grid gap-4">
        <Field label="Name" htmlFor="device-name"><input id="device-name" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500" required value={form.name} onChange={(event) => onChange("name", event.target.value)} /></Field>
        <Field label="IP address" htmlFor="device-ip"><input id="device-ip" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500" required value={form.ip_address} onChange={(event) => onChange("ip_address", event.target.value)} /></Field>
        <Field label="Status" htmlFor="device-status"><select id="device-status" className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500" value={form.status} onChange={(event) => onChange("status", event.target.value as DeviceStatus)}><option value="online">Online</option><option value="warning">Warning</option><option value="maintenance">Maintenance</option></select></Field>
        <Field label="Location" htmlFor="device-location"><input id="device-location" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500" required value={form.location} onChange={(event) => onChange("location", event.target.value)} /></Field>
        <button className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400" disabled={isSaving} type="submit">{isSaving ? "Saving..." : editingDeviceId === null ? "Create Device" : "Save Changes"}</button>
      </div>
    </form>
  );
}

function TicketForm({ editingTicketId, form, isSaving, onCancel, onChange, onSubmit }: { editingTicketId: number | null; form: TicketFormState; isSaving: boolean; onCancel: () => void; onChange: (field: keyof TicketFormState, value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <form className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" onSubmit={onSubmit}>
      <PanelTitle title={editingTicketId === null ? "Create Ticket" : "Edit Ticket"} onCancel={editingTicketId === null ? undefined : onCancel} />
      <div className="grid gap-4">
        <Field label="Title" htmlFor="ticket-title"><input id="ticket-title" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500" required value={form.title} onChange={(event) => onChange("title", event.target.value)} /></Field>
        <Field label="Description" htmlFor="ticket-description"><textarea id="ticket-description" className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500" required value={form.description} onChange={(event) => onChange("description", event.target.value)} /></Field>
        <Field label="Status" htmlFor="ticket-status"><select id="ticket-status" className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500" value={form.status} onChange={(event) => onChange("status", event.target.value as TicketStatus)}><option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option></select></Field>
        <Field label="Priority" htmlFor="ticket-priority"><select id="ticket-priority" className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500" value={form.priority} onChange={(event) => onChange("priority", event.target.value as TicketPriority)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></Field>
        <Field label="Assigned to" htmlFor="ticket-assigned"><input id="ticket-assigned" className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-slate-500" value={form.assigned_to} onChange={(event) => onChange("assigned_to", event.target.value)} /></Field>
        <button className="h-10 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400" disabled={isSaving} type="submit">{isSaving ? "Saving..." : editingTicketId === null ? "Create Ticket" : "Save Changes"}</button>
      </div>
    </form>
  );
}

function ActivityTable({ logs }: { logs: ActivityLog[] }) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4"><h3 className="text-xl font-semibold">Activity Log</h3></div>
      <div className="divide-y divide-slate-200">
        {logs.map((log) => (
          <div className="grid gap-1 p-4 text-sm sm:grid-cols-[160px_minmax(0,1fr)_140px]" key={log.id}>
            <p className="font-medium capitalize text-slate-700">{log.entity_type} {log.action}</p>
            <p>{log.summary}</p>
            <p className="text-slate-500">{log.actor || "System"}</p>
          </div>
        ))}
        {logs.length === 0 && <p className="p-4 text-sm text-slate-500">No activity yet.</p>}
      </div>
    </section>
  );
}

function AnalyticsPanel({ rows, title, total }: { rows: [string, number, string][]; title: string; total: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-xl font-semibold">{title}</h3>
      <div className="grid gap-3">
        {rows.map(([label, value, color]) => (
          <div key={label}>
            <div className="mb-1 flex justify-between text-sm"><span>{label}</span><span className="font-medium">{value}</span></div>
            <div className="h-2 rounded-full bg-slate-100"><div className={`h-2 rounded-full ${color}`} style={{ width: `${total ? Math.round((value / total) * 100) : 0}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></div>;
}

function StatusBadge({ status }: { status: DeviceStatus }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[status]}`}>{statusLabels[status]}</span>;
}

function TicketBadge({ status }: { status: TicketStatus }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${ticketStatusStyles[status]}`}>{status.replace("_", " ")}</span>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-slate-200 p-4"><p className="text-sm text-slate-500">{label}</p><p className="mt-1 font-semibold">{value}</p></div>;
}

function NavButton({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) {
  return <button className={`rounded-md px-3 py-2 text-left ${active ? "bg-slate-100 text-slate-950" : "hover:bg-slate-50"}`} onClick={onClick} type="button">{children}</button>;
}

function PanelTitle({ onCancel, title }: { onCancel?: () => void; title: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h3 className="text-xl font-semibold">{title}</h3>
      {onCancel && <button className="text-sm font-medium text-slate-600 hover:text-slate-950" onClick={onCancel} type="button">Cancel</button>}
    </div>
  );
}

function Field({ children, htmlFor, label }: { children: ReactNode; htmlFor: string; label: string }) {
  return <label className="grid gap-1.5 text-sm font-medium text-slate-700" htmlFor={htmlFor}>{label}{children}</label>;
}
