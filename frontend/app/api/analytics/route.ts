export async function GET() {
  const response = await fetch("http://127.0.0.1:8000/api/analytics/", {
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));

  return Response.json(data, {
    status: response.status,
  });
}
