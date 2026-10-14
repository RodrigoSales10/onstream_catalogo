import { NextRequest, NextResponse } from "next/server";

// Domínios estritamente permitidos para prevenir SSRF
const ALLOWED_HOSTS = new Set([
  "static.futebolnatv.com.br",
  "www.futebolnatv.com.br",
  "futebolnatv.com.br",
]);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return new NextResponse("URL parameter missing", { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    return new NextResponse("Invalid URL", { status: 400 });
  }

  // Validação estrita de protocolo e host
  if (parsed.protocol !== "https:") {
    return new NextResponse("Protocol not allowed", { status: 403 });
  }

  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    return new NextResponse("Host not allowed", { status: 403 });
  }

  try {
    const upstreamRes = await fetch(parsed.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Referer": "https://www.futebolnatv.com.br/",
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      },
    });

    if (!upstreamRes.ok) {
      return new NextResponse(`Upstream error ${upstreamRes.status}`, {
        status: upstreamRes.status,
      });
    }

    const contentType = upstreamRes.headers.get("content-type") || "image/png";
    const buffer = await upstreamRes.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    return new NextResponse("Failed to proxy image", { status: 502 });
  }
}
