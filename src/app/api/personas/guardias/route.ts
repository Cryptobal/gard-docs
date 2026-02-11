import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, requireAuth, unauthorized } from "@/lib/api-auth";
import { createGuardiaSchema } from "@/lib/validations/ops";
import { createOpsAuditLog, ensureOpsAccess } from "@/lib/ops";

export async function GET(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    const forbidden = ensureOpsAccess(ctx);
    if (forbidden) return forbidden;

    const status = request.nextUrl.searchParams.get("status") || undefined;
    const blacklisted = request.nextUrl.searchParams.get("blacklisted");
    const search = request.nextUrl.searchParams.get("search")?.trim() || undefined;

    const guardias = await prisma.opsGuardia.findMany({
      where: {
        tenantId: ctx.tenantId,
        ...(status ? { status } : {}),
        ...(blacklisted === "true" ? { isBlacklisted: true } : {}),
        ...(blacklisted === "false" ? { isBlacklisted: false } : {}),
        ...(search
          ? {
              OR: [
                { code: { contains: search, mode: "insensitive" } },
                { persona: { firstName: { contains: search, mode: "insensitive" } } },
                { persona: { lastName: { contains: search, mode: "insensitive" } } },
                { persona: { rut: { contains: search, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      include: {
        persona: true,
        bankAccounts: {
          orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
          take: 1,
        },
        _count: {
          select: {
            flags: true,
            comments: true,
            turnosExtra: true,
          },
        },
      },
      orderBy: [{ isBlacklisted: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ success: true, data: guardias });
  } catch (error) {
    console.error("[PERSONAS] Error listing guardias:", error);
    return NextResponse.json(
      { success: false, error: "No se pudieron obtener los guardias" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    const forbidden = ensureOpsAccess(ctx);
    if (forbidden) return forbidden;

    const parsed = await parseBody(request, createGuardiaSchema);
    if (parsed.error) return parsed.error;
    const body = parsed.data;

    const existingByRut = body.rut
      ? await prisma.opsPersona.findFirst({
          where: { tenantId: ctx.tenantId, rut: body.rut },
          select: { id: true },
        })
      : null;
    if (existingByRut) {
      return NextResponse.json(
        { success: false, error: "Ya existe una persona con ese RUT" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const persona = await tx.opsPersona.create({
        data: {
          tenantId: ctx.tenantId,
          firstName: body.firstName,
          lastName: body.lastName,
          rut: body.rut || null,
          email: body.email || null,
          phone: body.phone || null,
          status: "active",
        },
      });

      const guardia = await tx.opsGuardia.create({
        data: {
          tenantId: ctx.tenantId,
          personaId: persona.id,
          code: body.code || null,
          status: "active",
        },
      });

      if (body.bankName && body.accountType && body.accountNumber && body.holderName) {
        await tx.opsCuentaBancaria.create({
          data: {
            tenantId: ctx.tenantId,
            guardiaId: guardia.id,
            bankName: body.bankName,
            accountType: body.accountType,
            accountNumber: body.accountNumber,
            holderName: body.holderName,
            holderRut: body.holderRut || body.rut || null,
            isDefault: true,
          },
        });
      }

      return tx.opsGuardia.findUnique({
        where: { id: guardia.id },
        include: {
          persona: true,
          bankAccounts: true,
        },
      });
    });

    await createOpsAuditLog(ctx, "personas.guardia.created", "ops_guardia", result?.id, {
      rut: body.rut || null,
      code: body.code || null,
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error("[PERSONAS] Error creating guardia:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo crear el guardia" },
      { status: 500 }
    );
  }
}
