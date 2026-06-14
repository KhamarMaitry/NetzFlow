type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function getTicketUrl(context: RouteContext) {
  const { id } = await context.params;

  return `http://127.0.0.1:8000/api/tickets/${id}/`;
}

export async function GET(_request: Request, context: RouteContext) {
  const response = await fetch(await getTicketUrl(context), {
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));

  return Response.json(data, {
    status: response.status,
  });
}

export async function PUT(request: Request, context: RouteContext) {
  const body = await request.json();

  const response = await fetch(await getTicketUrl(context), {
    method: "PUT",
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

export async function DELETE(request: Request, context: RouteContext) {
  const response = await fetch(await getTicketUrl(context), {
    method: "DELETE",
    headers: {
      Cookie: request.headers.get("cookie") || "",
    },
  });

  if (response.status === 204) {
    return new Response(null, {
      status: 204,
    });
  }

  const data = await response.json().catch(() => ({}));

  return Response.json(data, {
    status: response.status,
  });
}
