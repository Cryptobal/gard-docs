"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Clock,
  Filter,
  Loader2,
  Plus,
  Search,
  Ticket as TicketIcon,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type Ticket,
  type TicketCategory,
  type TicketStatus,
  type TicketPriority,
  TICKET_STATUS_CONFIG,
  TICKET_PRIORITY_CONFIG,
  TICKET_TEAM_CONFIG,
  TICKET_CATEGORIES_SEED,
  getSlaRemaining,
  isSlaBreached,
} from "@/lib/tickets";

interface TicketsClientProps {
  userRole: string;
}

type ViewState =
  | { view: "list" }
  | { view: "create" };

export function TicketsClient({ userRole }: TicketsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Pre-fill from guard event link (?source=guard_event&sourceId=xxx&title=xxx)
  const prefillSource = searchParams.get("source");
  const prefillSourceId = searchParams.get("sourceId");
  const prefillTitle = searchParams.get("title");

  const [viewState, setViewState] = useState<ViewState>(
    prefillSource ? { view: "create" } : { view: "list" },
  );
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | TicketStatus>("active");
  const [filterPriority, setFilterPriority] = useState<"all" | TicketPriority>("all");

  const categories = useMemo(
    () => TICKET_CATEGORIES_SEED.map((c, i) => ({ id: `cat-${i}`, ...c })),
    [],
  );

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ops/tickets");
      const data = await res.json();
      if (data.success) setTickets(data.data.items);
    } catch {
      toast.error("Error al cargar tickets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const filteredTickets = useMemo(() => {
    let result = tickets;
    if (filterStatus === "active") {
      result = result.filter((t) => ["open", "in_progress", "waiting"].includes(t.status));
    } else if (filterStatus !== "all") {
      result = result.filter((t) => t.status === filterStatus);
    }
    if (filterPriority !== "all") {
      result = result.filter((t) => t.priority === filterPriority);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.code.toLowerCase().includes(q) ||
          (t.description ?? "").toLowerCase().includes(q),
      );
    }
    return result;
  }, [tickets, filterStatus, filterPriority, searchQuery]);

  function handleTicketCreated(ticket: Ticket) {
    setTickets((prev) => [ticket, ...prev]);
    setViewState({ view: "list" });
    toast.success(`Ticket ${ticket.code} creado`);
    // Navigate to detail
    router.push(`/ops/tickets/${ticket.id}`);
  }

  if (viewState.view === "create") {
    return (
      <TicketCreateForm
        categories={categories}
        onBack={() => setViewState({ view: "list" })}
        onCreated={handleTicketCreated}
        prefillTitle={prefillTitle ?? undefined}
        prefillSource={prefillSource ?? undefined}
        prefillSourceId={prefillSourceId ?? undefined}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tickets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Button
          size="sm"
          onClick={() => setViewState({ view: "create" })}
          className="h-9 gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          Nuevo ticket
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as typeof filterStatus)}>
          <SelectTrigger className="h-8 w-[130px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activos</SelectItem>
            <SelectItem value="open">Abierto</SelectItem>
            <SelectItem value="in_progress">En progreso</SelectItem>
            <SelectItem value="waiting">En espera</SelectItem>
            <SelectItem value="resolved">Resuelto</SelectItem>
            <SelectItem value="closed">Cerrado</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={(v) => setFilterPriority(v as typeof filterPriority)}>
          <SelectTrigger className="h-8 w-[120px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Prioridad</SelectItem>
            <SelectItem value="p1">P1 Crítica</SelectItem>
            <SelectItem value="p2">P2 Alta</SelectItem>
            <SelectItem value="p3">P3 Media</SelectItem>
            <SelectItem value="p4">P4 Baja</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-8 text-center">
          <TicketIcon className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <p className="mt-2 text-sm text-muted-foreground">
            {tickets.length === 0
              ? "No hay tickets creados todavía."
              : "No hay tickets con los filtros seleccionados."}
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={() => setViewState({ view: "create" })}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Crear primer ticket
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTickets.map((ticket) => (
            <TicketListItem
              key={ticket.id}
              ticket={ticket}
              onClick={() => router.push(`/ops/tickets/${ticket.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  LIST ITEM
// ═══════════════════════════════════════════════════════════════

function TicketListItem({ ticket, onClick }: { ticket: Ticket; onClick: () => void }) {
  const statusCfg = TICKET_STATUS_CONFIG[ticket.status];
  const priorityCfg = TICKET_PRIORITY_CONFIG[ticket.priority];
  const slaText = getSlaRemaining(ticket.slaDueAt);
  const breached = isSlaBreached(ticket.slaDueAt);

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-md border border-border bg-card p-3 text-left transition-colors hover:bg-accent/50 active:bg-accent"
    >
      {/* Priority indicator */}
      <div className={`h-9 w-1 shrink-0 rounded-full ${
        ticket.priority === "p1" ? "bg-red-500" :
        ticket.priority === "p2" ? "bg-orange-500" :
        ticket.priority === "p3" ? "bg-yellow-500" :
        "bg-muted-foreground/30"
      }`} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-muted-foreground">{ticket.code}</span>
          <Badge variant={statusCfg.variant} className="text-[10px]">
            {statusCfg.label}
          </Badge>
          {breached && (
            <Badge variant="destructive" className="text-[10px] gap-0.5">
              <AlertTriangle className="h-2.5 w-2.5" />
              SLA
            </Badge>
          )}
        </div>
        <p className="mt-0.5 truncate text-sm font-medium">{ticket.title}</p>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>{ticket.category?.name ?? ticket.assignedTeam}</span>
          <span className="text-border">·</span>
          <span className={priorityCfg.color}>{ticket.priority.toUpperCase()}</span>
          {slaText && (
            <>
              <span className="text-border">·</span>
              <Clock className="h-3 w-3" />
              <span className={breached ? "text-red-500" : ""}>{slaText}</span>
            </>
          )}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
//  CREATE FORM
// ═══════════════════════════════════════════════════════════════

function TicketCreateForm({
  categories,
  onBack,
  onCreated,
  prefillTitle,
  prefillSource,
  prefillSourceId,
}: {
  categories: (TicketCategory & { id: string })[];
  onBack: () => void;
  onCreated: (ticket: Ticket) => void;
  prefillTitle?: string;
  prefillSource?: string;
  prefillSourceId?: string;
}) {
  const [saving, setSaving] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [title, setTitle] = useState(prefillTitle ?? "");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority | "">("");

  const selectedCategory = categories.find((c) => c.id === categoryId);

  // Auto-set priority from category default
  function handleCategoryChange(val: string) {
    setCategoryId(val);
    const cat = categories.find((c) => c.id === val);
    if (cat && !priority) setPriority(cat.defaultPriority);
  }

  const isValid = categoryId && title.trim();

  async function handleSubmit() {
    if (!isValid || !selectedCategory) return;
    setSaving(true);
    try {
      const res = await fetch("/api/ops/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          title: title.trim(),
          description: description.trim() || null,
          priority: priority || selectedCategory.defaultPriority,
          assignedTeam: selectedCategory.assignedTeam,
          source: prefillSource ?? "manual",
          sourceGuardEventId: prefillSourceId ?? null,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      onCreated({ ...data.data, category: selectedCategory });
    } catch {
      toast.error("Error al crear ticket");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
        Cancelar
      </button>

      <h3 className="text-sm font-semibold">Nuevo ticket</h3>

      {/* Source indicator */}
      {prefillSource === "guard_event" && (
        <div className="rounded-md border border-blue-500/20 bg-blue-500/5 p-2.5 text-xs text-blue-700 dark:text-blue-400">
          Creando ticket asociado a un evento laboral
        </div>
      )}

      {/* Category */}
      <div className="space-y-1.5">
        <Label className="text-xs">Categoría *</Label>
        <Select value={categoryId} onValueChange={handleCategoryChange}>
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Seleccionar categoría..." />
          </SelectTrigger>
          <SelectContent>
            {categories.filter((c) => c.isActive).map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                <div className="flex items-center gap-2">
                  <span>{cat.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {TICKET_TEAM_CONFIG[cat.assignedTeam]?.label}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedCategory?.description && (
          <p className="text-[11px] text-muted-foreground">{selectedCategory.description}</p>
        )}
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <Label className="text-xs">Título *</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-sm"
          placeholder="Descripción breve del ticket..."
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label className="text-xs">Descripción</Label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          placeholder="Detalle adicional (opcional)..."
        />
      </div>

      {/* Priority */}
      <div className="space-y-1.5">
        <Label className="text-xs">Prioridad</Label>
        <Select value={priority} onValueChange={(v) => setPriority(v as TicketPriority)}>
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Según categoría" />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(TICKET_PRIORITY_CONFIG) as [TicketPriority, typeof TICKET_PRIORITY_CONFIG.p1][]).map(
              ([key, cfg]) => (
                <SelectItem key={key} value={key}>
                  <span className={cfg.color}>{cfg.label}</span>
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      </div>

      {/* SLA info */}
      {selectedCategory && (
        <div className="rounded-md bg-muted/50 p-2.5 text-xs text-muted-foreground">
          <p>
            SLA: <strong>{selectedCategory.slaHours}h</strong> · Equipo:{" "}
            <strong>{TICKET_TEAM_CONFIG[selectedCategory.assignedTeam]?.label}</strong>
          </p>
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center gap-2 pt-2">
        <Button onClick={handleSubmit} disabled={!isValid || saving} className="gap-1.5">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Crear ticket
        </Button>
        <Button variant="ghost" onClick={onBack} disabled={saving}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
