import { NextRequest, NextResponse } from "next/server";
import type { GuardScheduleDay } from "@/lib/guard-portal";

export async function GET(request: NextRequest) {
  // TODO: Replace with Prisma query + guard session validation
  const { searchParams } = new URL(request.url);
  const guardiaId = searchParams.get("guardiaId");
  const month = searchParams.get("month"); // e.g. "2026-02"

  if (!guardiaId) {
    return NextResponse.json(
      { success: false, error: "guardiaId es requerido" },
      { status: 400 },
    );
  }

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json(
      { success: false, error: "month es requerido (formato YYYY-MM)" },
      { status: 400 },
    );
  }

  const [yearStr, monthStr] = month.split("-");
  const year = parseInt(yearStr, 10);
  const monthNum = parseInt(monthStr, 10);
  const daysInMonth = new Date(year, monthNum, 0).getDate();

  // 4-on / 2-off pattern: T T T T - - T T T T - - ...
  const pattern = ["T", "T", "T", "T", "-", "-"];
  const shiftLabels: Record<string, string> = {
    T: "Trabajo",
    "-": "Descanso",
  };

  const data: GuardScheduleDay[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(monthNum).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const patternIndex = (day - 1) % pattern.length;
    const shiftCode = pattern[patternIndex];

    data.push({
      date: dateStr,
      shiftCode,
      shiftLabel: shiftLabels[shiftCode] ?? shiftCode,
      installationName: shiftCode === "T" ? "Sede Central" : null,
      turno: shiftCode === "T" ? "07:00-19:00" : null,
    });
  }

  return NextResponse.json({ success: true, data });
}
