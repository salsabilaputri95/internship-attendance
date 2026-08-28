import { NextRequest, NextResponse } from "next/server";

const getBackendUrl = (): string => {
  return (
    process.env.BACKEND_URL ||
    process.env.INTERNAL_BACKEND_URL ||
    "http://127.0.0.1:8080"
  ).replace(/\/api\/?$/, "");
};

async function handleProxy(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = (path || []).join("/");
  const search = request.nextUrl.search || "";
  const backendBase = getBackendUrl();
  const targetUrl = `${backendBase}/api/${pathStr}${search}`;

  // Forward incoming headers (except host)
  const forwardHeaders = new Headers();
  request.headers.forEach((value, key) => {
    if (key.toLowerCase() !== "host" && key.toLowerCase() !== "content-length") {
      forwardHeaders.set(key, value);
    }
  });

  try {
    const isBodyAllowed = !["GET", "HEAD"].includes(request.method);
    let bodyData: BodyInit | undefined = undefined;

    if (isBodyAllowed) {
      bodyData = await request.arrayBuffer();
    }

    const response = await fetch(targetUrl, {
      method: request.method,
      headers: forwardHeaders,
      body: bodyData,
      cache: "no-store",
    });

    const responseBody = await response.arrayBuffer();
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      responseHeaders.set(key, value);
    });

    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error(`[API Proxy Error] -> ${targetUrl}:`, error);
    return NextResponse.json(
      {
        success: false,
        message: `Gagal menghubungi server backend (${targetUrl}): ${error.message}`,
        error: error.message,
      },
      { status: 502 }
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const DELETE = handleProxy;
export const PATCH = handleProxy;
export const OPTIONS = handleProxy;
