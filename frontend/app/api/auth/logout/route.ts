export async function POST(request: Request) {
  const response = await fetch("http://127.0.0.1:8000/api/auth/logout/", {
    method: "POST",
    headers: {
      Cookie: request.headers.get("cookie") || "",
    },
  });
  const data = await response.json().catch(() => ({}));
  const nextResponse = Response.json(data, {
    status: response.status,
  });
  const sessionCookie = response.headers.get("set-cookie");

  if (sessionCookie) {
    nextResponse.headers.set("set-cookie", sessionCookie);
  }

  return nextResponse;
}
