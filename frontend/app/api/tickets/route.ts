const API_BASE_URL = "http://127.0.0.1:8000/api/tickets/";

export async function GET() {
  const response = await fetch(API_BASE_URL, {
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));

  return Response.json(data, {
    status: response.status,
  });
}

export async function POST(request: Request) {
  const body = await request.json();

  const response = await fetch(API_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: request.headers.get("cookie") || "",
    },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));

  return Response.json(data, {
    status: response.status,
  });
}
