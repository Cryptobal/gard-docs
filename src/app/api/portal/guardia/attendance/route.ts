import { NextRequest, NextResponse } from "next/server";
import type { GuardAttendanceRecord } from "@/lib/guard-portal";

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
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  // 4-on / 2-off pattern matching schedule
  const pattern = ["T", "T", "T", "T", "-", "-"];

  const statusLabels: Record<string, string> = {
    present: "Presente",
    absent: "Ausente",
    late: "Atraso",
    rest: "Descanso",
  };

  const data: GuardAttendanceRecord[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(monthNum).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dateObj = new Date(`${dateStr}T23:59:59`);

    // Only include past days
    if (dateObj > today) break;

    const patternIndex = (day - 1) % pattern.length;
    const isWorkDay = pattern[patternIndex] === "T";

    if (!isWorkDay) {
      data.push({
        date: dateStr,
        status: "rest",
        statusLabel: statusLabels.rest,
        entryTime: null,
        exitTime: null,
        installationName: null,
      });
      continue;
    }

    // Mock: mostly present, every 7th work day is late, every 13th is absent
    let status: GuardAttendanceRecord["status"] = "present";
    let entryTime: string | null = "07:02";
    let exitTime: string | null = "19:05";

    if (day % 13 === 0) {
      status = "absent";
      entryTime = null;
      exitTime = null;
    } else if (day % 7 === 0) {
      status = "late";
      entryTime = "07:18";
      exitTime = "19:10";
    }

    data.push({
      date: dateStr,
      status,
      statusLabel: statusLabels[status] ?? status,
      entryTime,
      exitTime,
      installationName: status !== "absent" ? "Sede Central" : null,
    });
  }

  return NextResponse.json({ success: true, data });
}
