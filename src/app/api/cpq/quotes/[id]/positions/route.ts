/**
 * API Route: /api/cpq/quotes/[id]/positions
 * POST - Crear puesto de trabajo con estructura de servicio
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      puestoTrabajoId,
      customName,
      description,
      weekdays,
      startTime,
      endTime,
      numGuards,
      cargoId,
      rolId,
      baseSalary,
      afpName,
      healthSystem,
      healthPlanPct,
    } = body || {};

    if (
      !puestoTrabajoId ||
      !Array.isArray(weekdays) ||
      !startTime ||
      !endTime ||
      !numGuards ||
      !cargoId ||
      !rolId ||
      !baseSalary
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const healthPlan =
      healthSystem === "isapre"
        ? healthPlanPct ?? 0.07
        : 0.07;

    const payroll = await computeEmployerCost({
      base_salary_clp: Number(baseSalary),
      contract_type: "indefinite",
      afp_name: afpName || "modelo",
      health_system: healthSystem || "fonasa",
      health_plan_pct: healthPlan,
      assumptions: {
        include_vacation_provision: true,
        include_severance_provision: true,
        vacation_provision_pct: 0.0833,
        severance_provision_pct: 0.04166,
      },
    });

    const employerCost = payroll.monthly_employer_cost_clp;
    const netSalary = payroll.worker_net_salary_estimate;
    const monthlyPositionCost = employerCost * Number(numGuards);

    const result = await prisma.$transaction(async (tx) => {
      const position = await tx.cpqPosition.create({
        data: {
          quoteId: id,
          puestoTrabajoId,
          customName: customName?.trim() || null,
          description: description?.trim() || null,
          weekdays,
          startTime,
          endTime,
          numGuards: Number(numGuards),
          cargoId,
          rolId,
          baseSalary: Number(baseSalary),
          afpName: afpName || "modelo",
          healthSystem: healthSystem || "fonasa",
          healthPlanPct: healthPlan,
          employerCost,
          netSalary,
          monthlyPositionCost,
          payrollSnapshot: payroll.parameters_snapshot as any,
          payrollVersionId: payroll.parameters_snapshot?.version_id || null,
          calculatedAt: new Date(payroll.computed_at),
        },
      });

      await refreshQuoteTotals(id);
      return position;
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error("Error creating CPQ position:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create position" },
      { status: 500 }
    );
  }
}
