import { NextRequest, NextResponse } from "next/server";

const getBackendUrl = (): string => {
  return (
    process.env.BACKEND_URL ||
    process.env.INTERNAL_BACKEND_URL ||
    "http://127.0.0.1:8080"
  ).replace(/\/api\/?$/, "");
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = (path || []).join("/");
  const targetUrl = `${getBackendUrl()}/uploads/${pathStr}`;

  try {
    const response = await fetch(targetUrl, { cache: "no-store" });
    if (!response.ok) {
      return new NextResponse("File not found", { status: 404 });
    }
    const data = await response.arrayBuffer();
    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "image/jpeg",
      },
    });
  } catch (error: any) {
    return new NextResponse("Failed to load image", { status: 500 });
  }
}
