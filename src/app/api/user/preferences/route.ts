import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized } from "@/lib/api-auth";

const VALID_PAGE_TYPES = new Set([
  "account",
  "contact",
  "installation",
  "deal",
  "lead",
  "guardia",
]);

type PageType = "account" | "contact" | "installation" | "deal" | "lead" | "guardia";

type SectionPrefs = {
  order: string[];
  collapsed: string[];
};

const EMPTY_PREFS: SectionPrefs = {
  order: [],
  collapsed: [],
};

function getSettingKey(userId: string, pageType: PageType): string {
  return `ui_section_prefs:${userId}:${pageType}`;
}

function parsePageType(raw: string | null): PageType | null {
  if (!raw || !VALID_PAGE_TYPES.has(raw)) return null;
  return raw as PageType;
}

function sanitizePrefs(value: unknown): SectionPrefs {
  if (!value || typeof value !== "object") return EMPTY_PREFS;
  const obj = value as Record<string, unknown>;
  const order = Array.isArray(obj.order) ? obj.order.filter((item): item is string => typeof item === "string") : [];
  const collapsed = Array.isArray(obj.collapsed)
    ? obj.collapsed.filter((item): item is string => typeof item === "string")
    : [];
  return { order, collapsed };
}

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();

    const pageType = parsePageType(request.nextUrl.searchParams.get("pageType"));
    if (!pageType) {
      return NextResponse.json(
        { success: false, error: "pageType inválido" },
        { status: 400 }
      );
    }

    const setting = await prisma.setting.findFirst({
      where: {
        key: getSettingKey(ctx.userId, pageType),
        tenantId: ctx.tenantId,
      },
      select: { value: true },
    });

    let prefs = EMPTY_PREFS;
    if (setting?.value) {
      try {
        prefs = sanitizePrefs(JSON.parse(setting.value));
      } catch {
        prefs = EMPTY_PREFS;
      }
    }

    return NextResponse.json({ success: true, data: prefs });
  } catch (error) {
    console.error("Error fetching section preferences:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener preferencias de secciones" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();

    const body = (await request.json()) as Record<string, unknown>;
    const pageType = parsePageType(typeof body.pageType === "string" ? body.pageType : null);
    if (!pageType) {
      return NextResponse.json(
        { success: false, error: "pageType inválido" },
        { status: 400 }
      );
    }

    const prefs = sanitizePrefs(body);
    const key = getSettingKey(ctx.userId, pageType);

    const existing = await prisma.setting.findFirst({
      where: {
        key,
        tenantId: ctx.tenantId,
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.setting.update({
        where: { id: existing.id },
        data: { value: JSON.stringify(prefs) },
      });
    } else {
      await prisma.setting.create({
        data: {
          key,
          value: JSON.stringify(prefs),
          type: "json",
          category: "ui",
          tenantId: ctx.tenantId,
        },
      });
    }

    return NextResponse.json({ success: true, data: prefs });
  } catch (error) {
    console.error("Error saving section preferences:", error);
    return NextResponse.json(
      { success: false, error: "Error al guardar preferencias de secciones" },
      { status: 500 }
    );
  }
}
