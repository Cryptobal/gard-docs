/**
 * Modal para crear cotización CPQ
 */

"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (!open) return;

    const root = document.documentElement;
    const updateViewportVars = () => {
      const visualViewport = window.visualViewport;
      const height = visualViewport?.height ?? window.innerHeight;
      const offsetTop = visualViewport?.offsetTop ?? 0;
      const keyboardHeight = Math.max(0, window.innerHeight - height - offsetTop);

      root.style.setProperty("--vvh", `${height * 0.01}px`);
      root.style.setProperty("--vvoffset-top", `${offsetTop}px`);
      root.style.setProperty("--vkb", `${keyboardHeight}px`);
    };

    updateViewportVars();

    const visualViewport = window.visualViewport;
    visualViewport?.addEventListener("resize", updateViewportVars);
    visualViewport?.addEventListener("scroll", updateViewportVars);
    window.addEventListener("resize", updateViewportVars);

    return () => {
      visualViewport?.removeEventListener("resize", updateViewportVars);
      visualViewport?.removeEventListener("scroll", updateViewportVars);
      window.removeEventListener("resize", updateViewportVars);
      root.style.removeProperty("--vvh");
      root.style.removeProperty("--vvoffset-top");
      root.style.removeProperty("--vkb");
    };
  }, [open]);

  const handleInputFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    const target = event.currentTarget;
    window.setTimeout(() => {
      target.scrollIntoView({ block: "center", behavior: "auto" });
    }, 50);
  };

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
      <DialogContent className="left-0 top-[var(--vvoffset-top,0px)] w-screen max-w-none h-[calc(var(--vvh,1vh)*100)] max-h-[calc(var(--vvh,1vh)*100)] translate-x-0 translate-y-0 rounded-none overflow-hidden flex flex-col px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-[calc(1rem+env(safe-area-inset-bottom))] sm:left-[50%] sm:top-[50%] sm:w-full sm:max-w-md sm:h-auto sm:max-h-[90vh] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg sm:p-6">
        <DialogHeader>
          <DialogTitle>Nueva Cotización</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="flex-1 min-h-0 space-y-3 overflow-y-auto pb-[calc(1rem+env(safe-area-inset-bottom)+var(--vkb,0px))] sm:pb-0"
          style={{
            scrollPaddingBottom: "calc(1rem + env(safe-area-inset-bottom) + var(--vkb, 0px))",
          }}
        >
          <div className="space-y-1">
            <Label className="text-xs sm:text-sm">Cliente</Label>
            <Input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              onFocus={handleInputFocus}
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
              onFocus={handleInputFocus}
              className="h-11 sm:h-9 bg-background text-base sm:text-sm"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs sm:text-sm">Notas</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onFocus={handleInputFocus}
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
