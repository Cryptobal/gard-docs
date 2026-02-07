/**
 * API Route: /api/cpq/quotes/[id]/positions/[positionId]
 * PATCH  - Actualizar puesto y recalcular costos
 * DELETE - Eliminar puesto
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeEmployerCost } from "@/modules/payroll/engine/compute-employer-cost";

async function refreshQuoteTotals(quoteId: string) {
  const positions = await prisma.cpqPosition.findMany({
    where: { quoteId },
    select: { numGuards: true, monthlyPositionCost: true },
  });

  const totalPositions = positions.length;
  const totalGuards = positions.reduce((sum, p) => sum + p.numGuards, 0);
  const monthlyCost = positions.reduce(
    (sum, p) => sum + Number(p.monthlyPositionCost),
    0
  );

  return prisma.cpqQuote.update({
    where: { id: quoteId },
    data: { totalPositions, totalGuards, monthlyCost },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; positionId: string }> }
) {
  try {
    const { id, positionId } = await params;
    const body = await request.json();

    const current = await prisma.cpqPosition.findFirst({
      where: { id: positionId, quoteId: id },
    });

    if (!current) {
      return NextResponse.json(
        { success: false, error: "Position not found" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    const fields = [
      "puestoTrabajoId",
      "customName",
      "description",
      "weekdays",
      "startTime",
      "endTime",
      "numGuards",
      "cargoId",
      "rolId",
      "baseSalary",
      "afpName",
      "healthSystem",
      "healthPlanPct",
    ];

    for (const field of fields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const nextBaseSalary = Number(updateData.baseSalary ?? current.baseSalary);
    const nextAfpName = updateData.afpName ?? current.afpName;
    const nextHealthSystem = updateData.healthSystem ?? current.healthSystem;
    const nextHealthPlan =
      nextHealthSystem === "isapre"
        ? updateData.healthPlanPct ?? current.healthPlanPct ?? 0.07
        : 0.07;

    const forceRecalculate = body?.forceRecalculate === true;
    const shouldRecalc =
      forceRecalculate ||
      updateData.baseSalary !== undefined ||
      updateData.afpName !== undefined ||
      updateData.healthSystem !== undefined ||
      updateData.healthPlanPct !== undefined ||
      updateData.cargoId !== undefined ||
      updateData.rolId !== undefined;

    let employerCost = Number(current.employerCost);
    let netSalary = current.netSalary ? Number(current.netSalary) : null;
    let payrollSnapshot = current.payrollSnapshot;
    let payrollVersionId = current.payrollVersionId;
    let calculatedAt = current.calculatedAt;

    if (shouldRecalc) {
      const payroll = await computeEmployerCost({
        base_salary_clp: nextBaseSalary,
        contract_type: "indefinite",
        afp_name: nextAfpName,
        health_system: nextHealthSystem,
        health_plan_pct: nextHealthPlan,
        assumptions: {
          include_vacation_provision: true,
          include_severance_provision: true,
          vacation_provision_pct: 0.0833,
          severance_provision_pct: 0.04166,
        },
      });

      employerCost = payroll.monthly_employer_cost_clp;
      netSalary = payroll.worker_net_salary_estimate;
      payrollSnapshot = payroll.parameters_snapshot as any;
      payrollVersionId = payroll.parameters_snapshot?.version_id || null;
      calculatedAt = new Date(payroll.computed_at);
    }

    const nextNumGuards = Number(updateData.numGuards ?? current.numGuards);
    const monthlyPositionCost = employerCost * nextNumGuards;

    const position = await prisma.cpqPosition.update({
      where: { id: positionId },
      data: {
        ...updateData,
        baseSalary: nextBaseSalary,
        afpName: nextAfpName,
        healthSystem: nextHealthSystem,
        healthPlanPct: nextHealthPlan,
        employerCost,
        netSalary,
        payrollSnapshot,
        payrollVersionId,
        calculatedAt,
        monthlyPositionCost,
      },
    });

    await refreshQuoteTotals(id);
    return NextResponse.json({ success: true, data: position });
  } catch (error) {
    console.error("Error updating CPQ position:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update position" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; positionId: string }> }
) {
  try {
    const { id, positionId } = await params;
    const existing = await prisma.cpqPosition.findFirst({
      where: { id: positionId, quoteId: id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Position not found" },
        { status: 404 }
      );
    }

    await prisma.cpqPosition.delete({ where: { id: positionId } });
    await refreshQuoteTotals(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting CPQ position:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete position" },
      { status: 500 }
    );
  }
}
