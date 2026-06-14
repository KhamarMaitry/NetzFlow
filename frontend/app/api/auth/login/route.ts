export async function POST(request: Request) {
  const body = await request.json();

  const response = await fetch("http://127.0.0.1:8000/api/auth/login/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
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
