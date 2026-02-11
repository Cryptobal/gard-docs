import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, unauthorized } from "@/lib/api-auth";
import { ensureOpsAccess } from "@/lib/ops";

type Params = { id: string };

function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const ctx = await requireAuth();
    if (!ctx) return unauthorized();
    const forbidden = ensureOpsAccess(ctx);
    if (forbidden) return forbidden;

    const { id } = await params;

    const lote = await prisma.opsPagoTeLote.findFirst({
      where: {
        id,
        tenantId: ctx.tenantId,
      },
      include: {
        items: {
          include: {
            guardia: {
              include: {
                persona: {
                  select: { firstName: true, lastName: true, rut: true },
                },
                bankAccounts: {
                  orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
                },
              },
            },
          },
        },
      },
    });

    if (!lote) {
      return NextResponse.json(
        { success: false, error: "Lote no encontrado" },
        { status: 404 }
      );
    }

    const header = [
      "rut",
      "nombre_completo",
      "banco",
      "tipo_cuenta",
      "numero_cuenta",
      "monto_clp",
      "referencia",
    ];

    const rows = lote.items.map((item) => {
      const persona = item.guardia.persona;
      const account = item.guardia.bankAccounts[0];
      const fullName = `${persona.firstName} ${persona.lastName}`.trim();

      return [
        csvEscape(persona.rut ?? ""),
        csvEscape(fullName),
        csvEscape(account?.bankName ?? ""),
        csvEscape(account?.accountType ?? ""),
        csvEscape(account?.accountNumber ?? ""),
        csvEscape(String(Number(item.amountClp))),
        csvEscape(lote.code),
      ].join(",");
    });

    const csv = [header.join(","), ...rows].join("\n");

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=\"${lote.code}-santander.csv\"`,
      },
    });
  } catch (error) {
    console.error("[TE] Error exporting lote CSV:", error);
    return NextResponse.json(
      { success: false, error: "No se pudo exportar el lote" },
      { status: 500 }
    );
  }
}
