"use client";

import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { QrCode } from "lucide-react";

export function CheckpointQrGenerator({
  code,
  checkpointName,
  installationName,
}: {
  code: string;
  checkpointName: string;
  installationName?: string;
}) {
  const download = async () => {
    const qrCanvas = document.createElement("canvas");
    await QRCode.toCanvas(qrCanvas, code, { width: 640, margin: 2, errorCorrectionLevel: "H" });

    const footerHeight = 140;
    const canvas = document.createElement("canvas");
    canvas.width = qrCanvas.width;
    canvas.height = qrCanvas.height + footerHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(qrCanvas, 0, 0);

    ctx.textAlign = "center";
    ctx.fillStyle = "#111827";
    ctx.font = "bold 28px Inter, Arial, sans-serif";
    ctx.fillText(installationName || "Instalación", canvas.width / 2, qrCanvas.height + 44);
    ctx.font = "22px Inter, Arial, sans-serif";
    ctx.fillText(checkpointName, canvas.width / 2, qrCanvas.height + 78);
    ctx.font = "16px Inter, Arial, sans-serif";
    ctx.fillStyle = "#4b5563";
    ctx.fillText(code, canvas.width / 2, qrCanvas.height + 108);

    const data = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = data;
    a.download = `QR-${(installationName || "Instalacion").replace(/\s+/g, "-")}-${checkpointName.replace(/\s+/g, "-")}-${code}.png`;
    a.click();
  };

  return (
    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => void download()}>
      <QrCode className="mr-1 h-3.5 w-3.5" />
      Descargar QR
    </Button>
  );
}
