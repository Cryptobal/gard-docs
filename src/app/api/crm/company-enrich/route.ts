/**
 * API Route: /api/crm/company-enrich
 * POST - Extrae datos públicos desde sitio web y genera resumen en español con IA.
 */

import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { openai } from "@/lib/openai";

type ExtractedWebData = {
  websiteNormalized: string;
  title: string;
  metaDescription: string;
  headings: string[];
  paragraphs: string[];
  logoUrl: string | null;
};

function normalizeWebsiteUrl(rawWebsite: string): string {
  const trimmed = rawWebsite.trim();
  if (!trimmed) throw new Error("Debes ingresar una página web.");
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(withProtocol);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("La URL debe usar http o https.");
  }
  return url.toString();
}

function firstMatch(content: string, regex: RegExp): string {
  const match = content.match(regex);
  return match?.[1]?.trim() || "";
}

function stripHtml(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveUrl(candidate: string, baseUrl: string): string | null {
  if (!candidate) return null;
  try {
    return new URL(candidate, baseUrl).toString();
  } catch {
    return null;
  }
}

function collectRegexMatches(content: string, regex: RegExp, max = 5): string[] {
  const matches: string[] = [];
  for (const m of content.matchAll(regex)) {
    const clean = stripHtml(m[1] || "");
    if (!clean) continue;
    if (!matches.includes(clean)) matches.push(clean);
    if (matches.length >= max) break;
  }
  return matches;
}

function collectRawMatches(content: string, regex: RegExp, max = 5): string[] {
  const matches: string[] = [];
  for (const m of content.matchAll(regex)) {
    const raw = (m[0] || "").trim();
    if (!raw) continue;
    matches.push(raw);
    if (matches.length >= max) break;
  }
  return matches;
}

type LogoCandidate = {
  url: string;
  source: string;
  score: number;
};

function normalizeToken(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getCompanyTokens(companyName: string): string[] {
  const normalized = normalizeToken(companyName || "");
  return normalized
    .split(/[^a-z0-9]+/g)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3);
}

function detectLogoCandidates(html: string, baseUrl: string, companyName: string): LogoCandidate[] {
  const metaCandidates = [
    firstMatch(
      html,
      /<meta[^>]+property=["']og:logo["'][^>]+content=["']([^"']+)["'][^>]*>/i
    ),
    firstMatch(
      html,
      /<meta[^>]+name=["']og:logo["'][^>]+content=["']([^"']+)["'][^>]*>/i
    ),
    firstMatch(
      html,
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i
    ),
    firstMatch(
      html,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["'][^>]*>/i
    ),
  ].filter(Boolean);

  const linkCandidates = collectRegexMatches(
    html,
    /<link[^>]+rel=["'][^"']*(?:icon|apple-touch-icon)[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>/gi,
    6
  );

  const jsonLdLogo = firstMatch(
    html,
    /"logo"\s*:\s*"([^"]+)"/i
  );

  const companyTokens = getCompanyTokens(companyName);
  const allCandidates: LogoCandidate[] = [];

  // 1) Meta-based candidates (útiles, pero no siempre son logo corporativo)
  for (const c of [...metaCandidates, jsonLdLogo, ...linkCandidates].filter(Boolean)) {
    const absolute = resolveUrl(c, baseUrl);
    if (!absolute) continue;
    allCandidates.push({ url: absolute, source: "meta", score: 10 });
  }

  // 2) Header/nav image candidates (prioridad principal solicitada por usuario)
  const headerBlocks = [
    ...collectRawMatches(html, /<header[\s\S]*?<\/header>/gi, 4),
    ...collectRawMatches(html, /<nav[\s\S]*?<\/nav>/gi, 4),
  ];
  const imgTagRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  const attrRegex = (attr: string) => new RegExp(`${attr}=["']([^"']+)["']`, "i");

  for (const block of headerBlocks) {
    for (const match of block.matchAll(imgTagRegex)) {
      const fullTag = match[0] || "";
      const src = match[1] || "";
      const absolute = resolveUrl(src, baseUrl);
      if (!absolute) continue;

      const alt = (fullTag.match(attrRegex("alt"))?.[1] || "").toLowerCase();
      const cls = (fullTag.match(attrRegex("class"))?.[1] || "").toLowerCase();
      const id = (fullTag.match(attrRegex("id"))?.[1] || "").toLowerCase();
      const srcLower = absolute.toLowerCase();

      let score = 120; // Header/nav base
      if (srcLower.includes("logo")) score += 55;
      if (alt.includes("logo")) score += 45;
      if (cls.includes("logo") || id.includes("logo")) score += 35;
      if (srcLower.endsWith(".svg")) score += 24;
      if (srcLower.endsWith(".png")) score += 18;
      if (srcLower.includes("favicon") || srcLower.endsWith(".ico")) score -= 80;
      if (srcLower.includes("icon")) score -= 20;

      for (const token of companyTokens) {
        if (srcLower.includes(token) || alt.includes(token) || cls.includes(token) || id.includes(token)) {
          score += 18;
        }
      }

      allCandidates.push({ url: absolute, source: "header", score });
    }
  }

  // 3) Global IMG fallback: por si no hay header estructurado
  for (const match of html.matchAll(imgTagRegex)) {
    const fullTag = match[0] || "";
    const src = match[1] || "";
    const absolute = resolveUrl(src, baseUrl);
    if (!absolute) continue;

    const alt = (fullTag.match(attrRegex("alt"))?.[1] || "").toLowerCase();
    const cls = (fullTag.match(attrRegex("class"))?.[1] || "").toLowerCase();
    const id = (fullTag.match(attrRegex("id"))?.[1] || "").toLowerCase();
    const srcLower = absolute.toLowerCase();

    let score = 30;
    if (srcLower.includes("logo")) score += 35;
    if (alt.includes("logo")) score += 25;
    if (cls.includes("logo") || id.includes("logo")) score += 20;
    if (srcLower.includes("favicon") || srcLower.endsWith(".ico")) score -= 60;
    if (srcLower.endsWith(".svg")) score += 16;
    if (srcLower.endsWith(".png")) score += 10;
    for (const token of companyTokens) {
      if (srcLower.includes(token) || alt.includes(token)) score += 12;
    }
    allCandidates.push({ url: absolute, source: "img", score });
  }

  // Dedup por URL manteniendo mejor score
  const bestByUrl = new Map<string, LogoCandidate>();
  for (const candidate of allCandidates) {
    const prev = bestByUrl.get(candidate.url);
    if (!prev || candidate.score > prev.score) bestByUrl.set(candidate.url, candidate);
  }
  return Array.from(bestByUrl.values()).sort((a, b) => b.score - a.score);
}

function pickBestLogoCandidate(candidates: LogoCandidate[]): string | null {
  if (candidates.length === 0) return null;
  return candidates[0]?.url || null;
}

async function downloadLogoToPublic(logoUrl: string): Promise<string | null> {
  const response = await fetch(logoUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; OPAI-Bot/1.0; +https://gard.cl)",
      Accept: "image/svg+xml,image/png,image/webp,image/jpeg,image/*",
    },
    cache: "no-store",
  });
  if (!response.ok) return null;

  const mime = (response.headers.get("content-type") || "").toLowerCase().split(";")[0];
  const allowed: Record<string, string> = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
  };
  const ext = allowed[mime];
  if (!ext) return null;

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength <= 0 || buffer.byteLength > 5 * 1024 * 1024) {
    return null;
  }

  const hash = createHash("sha1").update(logoUrl).digest("hex").slice(0, 12);
  const fileName = `logo-${Date.now()}-${hash}${ext}`;
  const relDir = path.join("public", "uploads", "company-logos");
  const absDir = path.join(process.cwd(), relDir);
  await mkdir(absDir, { recursive: true });
  const absFile = path.join(absDir, fileName);
  await writeFile(absFile, buffer);
  return `/uploads/company-logos/${fileName}`;
}

async function scrapeWebsite(websiteNormalized: string, companyName: string): Promise<ExtractedWebData> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(websiteNormalized, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; OPAI-Bot/1.0; +https://gard.cl)",
        Accept: "text/html,application/xhtml+xml",
      },
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`No se pudo leer el sitio (${response.status}).`);
    }
    const html = await response.text();
    const title = stripHtml(firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i));
    const metaDescription = stripHtml(
      firstMatch(
        html,
        /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i
      )
    );
    const headings = collectRegexMatches(html, /<h[1-2][^>]*>([\s\S]*?)<\/h[1-2]>/gi, 6);
    const paragraphs = collectRegexMatches(html, /<p[^>]*>([\s\S]*?)<\/p>/gi, 10).filter(
      (p) => p.length > 40
    );
    const logoCandidates = detectLogoCandidates(html, websiteNormalized, companyName);
    const logoUrl = pickBestLogoCandidate(logoCandidates);

    return {
      websiteNormalized,
      title,
      metaDescription,
      headings,
      paragraphs,
      logoUrl,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function summarizeInSpanish(
  companyName: string,
  website: string,
  extracted: ExtractedWebData
): Promise<string> {
  const sourceText = [
    `Empresa: ${companyName || "No especificada"}`,
    `Sitio: ${website}`,
    extracted.title ? `Título: ${extracted.title}` : "",
    extracted.metaDescription ? `Meta descripción: ${extracted.metaDescription}` : "",
    extracted.headings.length ? `Encabezados: ${extracted.headings.join(" | ")}` : "",
    extracted.paragraphs.length
      ? `Párrafos detectados: ${extracted.paragraphs.slice(0, 5).join(" | ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    max_tokens: 220,
    messages: [
      {
        role: "system",
        content:
          "Eres analista comercial B2B. Resume en español neutro, sin inventar datos y en tono ejecutivo.",
      },
      {
        role: "user",
        content: `Con la información del sitio web, redacta un resumen breve (4-6 líneas) de: qué hace la empresa, a qué se dedica, foco de negocio y cualquier señal útil para una propuesta comercial de seguridad privada.\n\nSi faltan datos, indícalo de forma explícita sin inventar.\n\nInformación extraída:\n${sourceText}`,
      },
    ],
  });

  return completion.choices[0]?.message?.content?.trim() || "";
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();

    const body = (await request.json()) as { website?: string; companyName?: string };
    const rawWebsite = body.website?.trim() || "";
    if (!rawWebsite) {
      return NextResponse.json(
        { success: false, error: "Debes ingresar una página web." },
        { status: 400 }
      );
    }

    const websiteNormalized = normalizeWebsiteUrl(rawWebsite);
    const companyName = body.companyName?.trim() || "";
    const extracted = await scrapeWebsite(websiteNormalized, companyName);
    let localLogoUrl: string | null = null;
    if (extracted.logoUrl) {
      try {
        localLogoUrl = await downloadLogoToPublic(extracted.logoUrl);
      } catch (logoError) {
        console.error("Error downloading company logo:", logoError);
      }
    }

    let summary = "";
    try {
      summary = await summarizeInSpanish(companyName, websiteNormalized, extracted);
    } catch (aiError) {
      console.error("Error generating AI company summary:", aiError);
      summary =
        extracted.metaDescription ||
        extracted.headings[0] ||
        "No se pudo generar resumen con IA. Revisa manualmente el sitio para obtener contexto.";
    }

    return NextResponse.json({
      success: true,
      data: {
        websiteNormalized,
        logoUrl: extracted.logoUrl,
        localLogoUrl,
        summary,
        title: extracted.title,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "No se pudo analizar el sitio web.";
    console.error("Error in company enrich:", error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
