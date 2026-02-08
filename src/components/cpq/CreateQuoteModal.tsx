/**
 * Modal para crear cotización CPQ
 */

"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

interface CreateQuoteModalProps {
  onCreated?: () => void;
}

export function CreateQuoteModal({ onCreated }: CreateQuoteModalProps) {
  const [open, setOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/cpq/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientName, validUntil, notes }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Error");
      setOpen(false);
      setClientName("");
      setValidUntil("");
      setNotes("");
      onCreated?.();
    } catch (err) {
      console.error("Error creating CPQ quote:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2 bg-teal-600 hover:bg-teal-700 text-white">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Nueva Cotización</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="left-0 top-0 w-screen max-w-none h-screen max-h-screen h-[100svh] max-h-[100svh] h-[100dvh] max-h-[100dvh] translate-x-0 translate-y-0 rounded-none overflow-hidden flex flex-col px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1rem+env(safe-area-inset-bottom))] sm:left-[50%] sm:top-[50%] sm:w-full sm:max-w-md sm:h-auto sm:max-h-[90vh] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg sm:p-6">
        <DialogHeader>
          <DialogTitle>Nueva Cotización</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 space-y-3 overflow-y-auto pb-24 sm:pb-0">
          <div className="space-y-1">
            <Label className="text-xs sm:text-sm">Cliente</Label>
            <Input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Nombre cliente"
              className="h-11 sm:h-9 bg-background text-base sm:text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs sm:text-sm">Válida hasta</Label>
            <Input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="h-11 sm:h-9 bg-background text-base sm:text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs sm:text-sm">Notas</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones"
              className="h-11 sm:h-9 bg-background text-base sm:text-sm"
            />
          </div>
          <Button type="submit" size="sm" className="w-full" disabled={loading}>
            {loading ? "Creando..." : "Crear"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
