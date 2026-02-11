/**
 * API Route: /api/cron/document-alerts
 * GET - Verificar documentos por vencer y vencidos, crear notificaciones + enviar emails
 *
 * Diseñado para ejecutarse diariamente vía Vercel Cron o similar.
 * Protegido con un token secreto (CRON_SECRET env var).
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addDays, format } from "date-fns";
import {
  sendDocumentExpiringEmail,
  sendDocumentExpiredEmail,
} from "@/lib/docs-alert-email";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  "https://opai.gard.cl";

import { getNotificationPrefs } from "@/lib/notification-prefs";

/** Obtener emails de admins/owners del tenant */
async function getAdminEmails(tenantId: string): Promise<string[]> {
  const admins = await prisma.admin.findMany({
    where: { tenantId, role: { in: ["owner", "admin"] }, status: "active" },
    select: { email: true },
  });
  return admins.map((a) => a.email);
}

export async function GET(request: NextRequest) {
  try {
    // Validate cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let expiringCount = 0;
    let expiredCount = 0;
    let emailsSent = 0;

    // 1. Find active documents approaching expiration
    const activeDocuments = await prisma.document.findMany({
      where: {
        status: "active",
        expirationDate: { not: null },
      },
      select: {
        id: true,
        tenantId: true,
        title: true,
        expirationDate: true,
        alertDaysBefore: true,
      },
    });

    // Cache per-tenant prefs and admin emails
    const prefsCache = new Map<string, Awaited<ReturnType<typeof getNotificationPrefs>>>();
    const adminCache = new Map<string, string[]>();

    async function prefs(tid: string) {
      if (!prefsCache.has(tid)) prefsCache.set(tid, await getNotificationPrefs(tid));
      return prefsCache.get(tid)!;
    }
    async function admins(tid: string) {
      if (!adminCache.has(tid)) adminCache.set(tid, await getAdminEmails(tid));
      return adminCache.get(tid)!;
    }

    for (const doc of activeDocuments) {
      if (!doc.expirationDate) continue;

      const alertDate = addDays(today, doc.alertDaysBefore);
      const expDate = new Date(doc.expirationDate);
      const daysRemaining = Math.ceil(
        (expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      // If expiration is within the alert window
      if (expDate <= alertDate && expDate > today) {
        // Check if we already sent a notification for this document
        const existing = await prisma.notification.findFirst({
          where: {
            tenantId: doc.tenantId,
            type: "contract_expiring",
            data: { path: ["documentId"], equals: doc.id },
            createdAt: { gte: addDays(today, -1) },
          },
        });

        if (!existing) {
          const p = await prefs(doc.tenantId);
          type TxOp =
            | ReturnType<typeof prisma.document.update>
            | ReturnType<typeof prisma.docHistory.create>
            | ReturnType<typeof prisma.notification.create>;
          const txOps: TxOp[] = [
            prisma.document.update({
              where: { id: doc.id },
              data: { status: "expiring" },
            }),
            prisma.docHistory.create({
              data: {
                documentId: doc.id,
                action: "status_changed",
                details: { from: "active", to: "expiring", automated: true },
                createdBy: "system",
              },
            }),
          ];

          if (p.docExpiryBellEnabled) {
            txOps.push(
              prisma.notification.create({
                data: {
                  tenantId: doc.tenantId,
                  type: "contract_expiring",
                  title: `Contrato por vencer: ${doc.title}`,
                  message: `Vence el ${format(expDate, "dd/MM/yyyy")}. Quedan ${daysRemaining} días.`,
                  data: { documentId: doc.id },
                  link: `/opai/documentos/${doc.id}`,
                },
              })
            );
          }

          await prisma.$transaction(txOps);
          expiringCount++;

          // Send email to admins
          if (p.docExpiryEmailEnabled) {
            const emails = await admins(doc.tenantId);
            const docUrl = `${SITE_URL}/opai/documentos/${doc.id}`;
            for (const email of emails) {
              try {
                await sendDocumentExpiringEmail({
                  to: email,
                  documentTitle: doc.title,
                  expirationDate: format(expDate, "dd/MM/yyyy"),
                  daysRemaining,
                  documentUrl: docUrl,
                });
                emailsSent++;
              } catch (e) {
                console.warn("DocAlert: failed to send expiring email to", email, e);
              }
            }
          }
        }
      }
    }

    // 2. Find documents that have expired
    const expiredDocs = await prisma.document.findMany({
      where: {
        status: { in: ["active", "expiring"] },
        expirationDate: { lte: today },
      },
      select: {
        id: true,
        tenantId: true,
        title: true,
        status: true,
        expirationDate: true,
      },
    });

    for (const doc of expiredDocs) {
      const p = await prefs(doc.tenantId);
      type TxOpExpired =
        | ReturnType<typeof prisma.document.update>
        | ReturnType<typeof prisma.docHistory.create>
        | ReturnType<typeof prisma.notification.create>;
      const txOps: TxOpExpired[] = [
        prisma.document.update({
          where: { id: doc.id },
          data: { status: "expired" },
        }),
        prisma.docHistory.create({
          data: {
            documentId: doc.id,
            action: "status_changed",
            details: { from: doc.status, to: "expired", automated: true },
            createdBy: "system",
          },
        }),
      ];

      if (p.docExpiryBellEnabled) {
        txOps.push(
          prisma.notification.create({
            data: {
              tenantId: doc.tenantId,
              type: "contract_expired",
              title: `Contrato vencido: ${doc.title}`,
              message: `Este contrato ha expirado y requiere renovación.`,
              data: { documentId: doc.id },
              link: `/opai/documentos/${doc.id}`,
            },
          })
        );
      }

      await prisma.$transaction(txOps);
      expiredCount++;

      // Send email to admins
      if (p.docExpiryEmailEnabled) {
        const emails = await admins(doc.tenantId);
        const docUrl = `${SITE_URL}/opai/documentos/${doc.id}`;
        const expDateStr = doc.expirationDate
          ? format(new Date(doc.expirationDate), "dd/MM/yyyy")
          : "—";
        for (const email of emails) {
          try {
            await sendDocumentExpiredEmail({
              to: email,
              documentTitle: doc.title,
              expirationDate: expDateStr,
              documentUrl: docUrl,
            });
            emailsSent++;
          } catch (e) {
            console.warn("DocAlert: failed to send expired email to", email, e);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        checked: activeDocuments.length + expiredDocs.length,
        expiringNotified: expiringCount,
        expiredNotified: expiredCount,
        emailsSent,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error in document alerts cron:", error);
    return NextResponse.json(
      { success: false, error: "Cron job failed" },
      { status: 500 }
    );
  }
}
