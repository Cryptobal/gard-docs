"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, RotateCcw } from "lucide-react";
import { CrmRecordHeader, type CrmRecordHeaderProps } from "./CrmRecordHeader";
import { CrmSectionNav, type SectionNavItem } from "./CrmSectionNav";
import { CollapsibleSection } from "./CollapsibleSection";
import { CRM_SECTIONS, type CrmSectionKey } from "./CrmModuleIcons";
import { useSectionPreferences, type SectionPageType } from "@/lib/use-section-preferences";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/* ── Types ── */

export interface DetailSection {
  /** Key de la sección (debe coincidir con CrmSectionKey) */
  key: CrmSectionKey;
  /** Override del label por defecto */
  label?: string;
  /** Conteo para la nav y el header de sección */
  count?: number;
  /** Acción en el header de la sección (ej: botón "Agregar") */
  action?: ReactNode;
  /** Contenido de la sección */
  children: ReactNode;
  /** Si la sección empieza colapsada (default: abierta) */
  defaultCollapsed?: boolean;
}

interface CrmDetailLayoutProps extends CrmRecordHeaderProps {
  /** Secciones del detalle (se renderizan en el orden dado) */
  sections: DetailSection[];
  /** Tipo de ficha para persistir preferencias */
  pageType: SectionPageType;
  /** Sección fija (siempre arriba y abierta). Default: primera sección */
  fixedSectionKey?: CrmSectionKey;
  /** Clases CSS adicionales al contenedor */
  className?: string;
}

type SortableSectionItemProps = {
  section: DetailSection;
  label: string;
  icon: ReactNode;
  open: boolean;
  locked: boolean;
  onToggle: (nextOpen: boolean) => void;
};

function SortableSectionItem({
  section,
  label,
  icon,
  open,
  locked,
  onToggle,
}: SortableSectionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: section.key,
    disabled: locked,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      id={`section-${section.key}`}
      className={cn("scroll-mt-32", isDragging && "z-20")}
    >
      <CollapsibleSection
        icon={icon}
        title={label}
        count={section.count}
        action={section.action}
        open={open}
        onToggle={onToggle}
        locked={locked}
        dragHandle={
          locked ? null : (
            <span
              ref={setActivatorNodeRef}
              {...attributes}
              {...listeners}
              role="button"
              aria-label={`Reordenar sección ${label}`}
              className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
              onClick={(event) => event.stopPropagation()}
            >
              <GripVertical className="h-4 w-4" />
            </span>
          )
        }
        className={cn(isDragging && "shadow-lg ring-1 ring-primary/25")}
      >
        {section.children}
      </CollapsibleSection>
    </div>
  );
}

/**
 * CrmDetailLayout — Layout wrapper para páginas de detalle CRM.
 *
 * Orquesta:
 * 1. CrmRecordHeader (sticky, con icono, título, badge, acciones, link "Volver")
 * 2. CrmSectionNav (tabs de anclas sticky con intersection observer)
 * 3. Secciones con CollapsibleSection (cada una con id para anclas)
 *
 * Uso:
 * ```tsx
 * <CrmDetailLayout
 *   module="accounts"
 *   title={account.name}
 *   subtitle="Cliente activo · Seguridad"
 *   badge={{ label: "Activo", variant: "success" }}
 *   backHref="/crm/accounts"
 *   actions={[{ label: "Editar", icon: Pencil, onClick: handleEdit }]}
 *   sections={[
 *     { key: "general", children: <GeneralSection /> },
 *     { key: "contacts", count: 5, children: <ContactsSection /> },
 *   ]}
 * />
 * ```
 */
export function CrmDetailLayout({
  sections,
  pageType,
  fixedSectionKey,
  className,
  // RecordHeader props
  module,
  title,
  subtitle,
  badge,
  backHref,
  backLabel,
  actions,
  extra,
}: CrmDetailLayoutProps) {
  const sectionByKey = useMemo(
    () => Object.fromEntries(sections.map((section) => [section.key, section])),
    [sections]
  ) as Partial<Record<CrmSectionKey, DetailSection>>;
  const sectionKeys = useMemo(() => sections.map((section) => section.key), [sections]);
  const firstSectionKey = (fixedSectionKey ?? sections[0]?.key ?? "general") as CrmSectionKey;

  const {
    orderedKeys,
    collapsedKeys,
    openSection,
    closeSection,
    reorderSections,
    resetToDefault,
  } = useSectionPreferences({
    pageType,
    fixedSectionKey: firstSectionKey,
    sectionKeys,
  });

  const orderedSections = useMemo(
    () =>
      orderedKeys
        .map((key) => sectionByKey[key as CrmSectionKey])
        .filter((section): section is DetailSection => Boolean(section)),
    [orderedKeys, sectionByKey]
  );

  const navItems: SectionNavItem[] = orderedSections.map((s) => ({
    key: s.key,
    label: s.label,
    count: s.count,
  }));

  const sortableKeys = orderedSections
    .map((section) => section.key)
    .filter((key) => key !== firstSectionKey);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 6 },
    })
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeKey = String(active.id);
    const overKey = String(over.id);
    const from = sortableKeys.indexOf(activeKey as CrmSectionKey);
    const to = sortableKeys.indexOf(overKey as CrmSectionKey);
    if (from < 0 || to < 0) return;

    reorderSections(arrayMove(sortableKeys, from, to));
  };

  return (
    <div className={cn("relative", className)}>
      {/* Header sticky */}
      <CrmRecordHeader
        module={module}
        title={title}
        subtitle={subtitle}
        badge={badge}
        backHref={backHref}
        backLabel={backLabel}
        actions={actions}
        extra={extra}
      />

      {/* Navegación por secciones */}
      <CrmSectionNav
        sections={navItems}
        onSectionClick={(key) => {
          if (key !== firstSectionKey) openSection(key);
        }}
        extraAction={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-[11px]"
            onClick={resetToDefault}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restablecer orden
          </Button>
        }
      />

      {/* Secciones */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={orderedSections.map((section) => section.key)} strategy={verticalListSortingStrategy}>
          <div className="mt-6 space-y-4">
            {orderedSections.map((section) => {
          const config = CRM_SECTIONS[section.key];
          const Icon = config.icon;
          const label = section.label || config.label;
              const isFixed = section.key === firstSectionKey;
              const isOpen = isFixed ? true : !collapsedKeys.has(section.key);

          return (
                <SortableSectionItem
                  key={section.key}
                  section={section}
                  label={label}
                  icon={<Icon className="h-4 w-4" />}
                  open={isOpen}
                  locked={isFixed}
                  onToggle={(nextOpen) =>
                    nextOpen ? openSection(section.key) : closeSection(section.key)
                  }
                />
          );
        })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
