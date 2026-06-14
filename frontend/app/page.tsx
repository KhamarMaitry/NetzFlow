import DeviceDashboard, {
  ActivityLog,
  Analytics,
  Device,
  Ticket,
} from "./DeviceDashboard";

const API_BASE_URL = "http://127.0.0.1:8000/api";

async function getDevices(): Promise<Device[]> {
  const res = await fetch(`${API_BASE_URL}/devices/`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to load devices");
  }

  return res.json();
}

async function getTickets(): Promise<Ticket[]> {
  const res = await fetch(`${API_BASE_URL}/tickets/`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to load tickets");
  }

  return res.json();
}

async function getAnalytics(): Promise<Analytics> {
  const res = await fetch(`${API_BASE_URL}/analytics/`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to load analytics");
  }

  return res.json();
}

async function getActivity(): Promise<ActivityLog[]> {
  const res = await fetch(`${API_BASE_URL}/activity/`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to load activity");
  }

  return res.json();
}

export default async function Home() {
  const [devices, tickets, analytics, activity] = await Promise.all([
    getDevices(),
    getTickets(),
    getAnalytics(),
    getActivity(),
  ]);

  return (
    <DeviceDashboard
      initialActivity={activity}
      initialAnalytics={analytics}
      initialDevices={devices}
      initialTickets={tickets}
    />
  );
}
