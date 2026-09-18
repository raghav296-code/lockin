import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Simple in-memory cache for preview metadata
const previewCache = new Map<string, { image: string | null; title: string | null; siteName: string | null; favicon: string | null; expires: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours

export async function GET(req: NextRequest) {
  const urlParam = req.nextUrl.searchParams.get("url");

  if (!urlParam) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(urlParam);
    if (!["http:", "https:"].includes(targetUrl.protocol)) {
      return NextResponse.json({ error: "Invalid protocol" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const cacheKey = targetUrl.href;
  const cached = previewCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json(cached);
  }

  try {
    const domain = targetUrl.hostname.replace(/^www\./, "");
    const fallbackFavicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

    // Fast abort controller for fetching HTML
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(targetUrl.href, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LockInBot/1.0; +https://lockin.app)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const fallbackResult = {
        image: null,
        title: null,
        siteName: domain,
        favicon: fallbackFavicon,
        expires: Date.now() + CACHE_TTL_MS,
      };
      previewCache.set(cacheKey, fallbackResult);
      return NextResponse.json(fallbackResult);
    }

    const html = await res.text();

    // Extract Open Graph tags
    const ogImageMatch =
      html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
      html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i) ||
      html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i);

    const ogTitleMatch =
      html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
      html.match(/<title[^>]*>([^<]+)<\/title>/i);

    const ogSiteNameMatch =
      html.match(/<meta\s+property=["']og:site_name["']\s+content=["']([^"']+)["']/i);

    let ogImage = ogImageMatch ? ogImageMatch[1].trim() : null;
    if (ogImage && ogImage.startsWith("/")) {
      ogImage = new URL(ogImage, targetUrl.origin).href;
    }

    const ogTitle = ogTitleMatch ? ogTitleMatch[1].trim() : null;
    const siteName = ogSiteNameMatch ? ogSiteNameMatch[1].trim() : domain;

    const result = {
      image: ogImage,
      title: ogTitle,
      siteName,
      favicon: fallbackFavicon,
      expires: Date.now() + CACHE_TTL_MS,
    };

    previewCache.set(cacheKey, result);
    return NextResponse.json(result);
  } catch {
    const domain = targetUrl.hostname.replace(/^www\./, "");
    const fallbackResult = {
      image: null,
      title: null,
      siteName: domain,
      favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
      expires: Date.now() + CACHE_TTL_MS,
    };
    previewCache.set(cacheKey, fallbackResult);
    return NextResponse.json(fallbackResult);
  }
}
