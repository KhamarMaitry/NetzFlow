export async function GET(request: Request) {
  const response = await fetch("http://127.0.0.1:8000/api/auth/status/", {
    cache: "no-store",
    headers: {
      Cookie: request.headers.get("cookie") || "",
    },
  });
  const data = await response.json().catch(() => ({}));

  return Response.json(data, {
    status: response.status,
  });
}
