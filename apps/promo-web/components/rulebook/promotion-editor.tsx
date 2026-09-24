"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Day } from "@ridgeline/contracts/common";
import type { ProductResponse } from "@ridgeline/contracts/products";
import type {
  AppliesTo,
  Audience,
  BundleSlot,
  CreatePromotionInput,
  Promotion,
  PromotionType,
  VenueOverride,
} from "@ridgeline/contracts/promotions";
import type { ResolutionPolicy } from "@ridgeline/contracts/rulebooks";
import type { VenueResponse } from "@ridgeline/contracts/venues";
import { Button } from "@ridgeline/ui/button";
import { Checkbox } from "@ridgeline/ui/checkbox";
import { Input } from "@ridgeline/ui/input";
import { Label } from "@ridgeline/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ridgeline/ui/select";
import { Separator } from "@ridgeline/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@ridgeline/ui/sheet";
import { Switch } from "@ridgeline/ui/switch";
import { Textarea } from "@ridgeline/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@ridgeline/ui/toggle-group";
import { AUDIENCE_LABEL, DAY_ORDER, DAY_SHORT } from "../../lib/format";
import { useCreatePromotion, useDeletePromotion, useUpdatePromotion } from "../../lib/queries/rulebooks";

export const BLANK_PROMOTION: CreatePromotionInput = {
  name: "",
  description: "",
  type: "percent_off",
  value: 10,
  appliesTo: { kind: "all" },
  audience: "everyone",
  schedule: { days: [...DAY_ORDER], startsAt: "00:00", endsAt: "24:00", validFrom: null, validTo: null },
  venueIds: null,
  venueOverrides: [],
  stacksWith: [],
  priority: 0,
  active: true,
};

const TYPE_LABEL: Record<PromotionType, string> = {
  percent_off: "Percent off",
  fixed_price: "Set price for an item",
  bundle_price: "Bundle price",
};

const PRIORITY_HINT: Record<ResolutionPolicy, string> = {
  best_price: "Higher wins only when two deals give the same price",
  priority: "Higher wins when two deals apply, even if it costs the customer more",
};

export function PromotionEditor({
  open,
  onOpenChange,
  promotionId,
  initial,
  otherPromotions,
  venues,
  products,
  resolution,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  promotionId: string | null;
  initial: CreatePromotionInput;
  otherPromotions: Promotion[];
  venues: VenueResponse[];
  products: ProductResponse[];
  // The draft's "When deals clash" rule: it changes what priority does.
  resolution: ResolutionPolicy;
}) {
  const [form, setForm] = useState<CreatePromotionInput>(initial);
  const create = useCreatePromotion();
  const updatePromotion = useUpdatePromotion();
  const remove = useDeletePromotion();
  const saving = create.isPending || updatePromotion.isPending;

  const set = <K extends keyof CreatePromotionInput>(key: K, value: CreatePromotionInput[K]) =>
    setForm((current) => ({ ...current, [key]: value }));
  const setSchedule = (patch: Partial<CreatePromotionInput["schedule"]>) =>
    setForm((current) => ({ ...current, schedule: { ...current.schedule, ...patch } }));

  const changeType = (type: PromotionType) => {
    setForm((current) => {
      const appliesTo: AppliesTo =
        type === "bundle_price"
          ? { kind: "bundle", slots: [{ label: "", productIds: [], quantity: 1 }] }
          : current.appliesTo.kind === "bundle"
            ? { kind: "all" }
            : current.appliesTo;
      return { ...current, type, appliesTo, value: type === "percent_off" ? 10 : 1000 };
    });
  };

  const save = async () => {
    try {
      if (promotionId) {
        await updatePromotion.mutateAsync({ promotionId, input: form });
        toast.success(`${form.name} updated in your draft`);
      } else {
        await create.mutateAsync(form);
        toast.success(`${form.name} added to your draft`);
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't save");
    }
  };

  const destroy = async () => {
    if (!promotionId) return;
    try {
      await remove.mutateAsync(promotionId);
      toast.success(`${form.name} removed from your draft`);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't remove");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{promotionId ? `Edit ${initial.name}` : "New promotion"}</SheetTitle>
          <SheetDescription>Changes go into your draft. New rules change only when you publish.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 pb-4">
          <Field label="Name">
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Melbourne Cup" />
          </Field>
          <Field label="Notes">
            <Textarea rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Kind of deal">
              <Select value={form.type} onValueChange={(type) => changeType(type as PromotionType)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(TYPE_LABEL) as PromotionType[]).map((type) => (
                    <SelectItem key={type} value={type}>
                      {TYPE_LABEL[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label={form.type === "percent_off" ? "Percent off" : "Price ($)"}>
              <Input
                type="number"
                min={0}
                step={form.type === "percent_off" ? 1 : 0.5}
                value={form.type === "percent_off" ? form.value : form.value / 100}
                onChange={(e) => {
                  const number = Number(e.target.value);
                  set("value", form.type === "percent_off" ? Math.round(number) : Math.round(number * 100));
                }}
              />
            </Field>
          </div>

          <AppliesToEditor
            appliesTo={form.appliesTo}
            isBundle={form.type === "bundle_price"}
            products={products}
            onChange={(appliesTo) => set("appliesTo", appliesTo)}
          />

          <Field label="Who gets it">
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              value={form.audience}
              onValueChange={(audience) => audience && set("audience", audience as Audience)}
            >
              {(Object.keys(AUDIENCE_LABEL) as Audience[]).map((audience) => (
                <ToggleGroupItem key={audience} value={audience}>
                  {AUDIENCE_LABEL[audience]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>

          <Separator />

          <Field label="Days">
            <ToggleGroup
              type="multiple"
              variant="outline"
              size="sm"
              spacing={1}
              value={form.schedule.days}
              onValueChange={(days) => days.length > 0 && setSchedule({ days: days as Day[] })}
            >
              {DAY_ORDER.map((day) => (
                <ToggleGroupItem key={day} value={day}>
                  {DAY_SHORT[day]}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="From" hint="Venue time">
              <Input type="time" value={form.schedule.startsAt} onChange={(e) => setSchedule({ startsAt: e.target.value })} />
            </Field>
            <Field label="Until" hint="Use 00:00 for midnight">
              <Input
                type="time"
                value={form.schedule.endsAt === "24:00" ? "00:00" : form.schedule.endsAt}
                onChange={(e) => setSchedule({ endsAt: e.target.value === "00:00" ? "24:00" : e.target.value })}
              />
            </Field>
            <Field label="First day" hint="Optional">
              <Input
                type="date"
                value={form.schedule.validFrom ?? ""}
                onChange={(e) => setSchedule({ validFrom: e.target.value || null })}
              />
            </Field>
            <Field label="Last day" hint="Optional">
              <Input
                type="date"
                value={form.schedule.validTo ?? ""}
                onChange={(e) => setSchedule({ validTo: e.target.value || null })}
              />
            </Field>
          </div>

          <Separator />

          <VenueScopeEditor venues={venues} venueIds={form.venueIds} onChange={(venueIds) => set("venueIds", venueIds)} />
          <VenueOverridesEditor
            venues={venues}
            overrides={form.venueOverrides}
            onChange={(venueOverrides) => set("venueOverrides", venueOverrides)}
          />

          <Separator />

          <Field
            label="Can be added on top of"
            hint="Leave empty for 'best single deal'. Ticking one means customers get both — a double discount."
          >
            <div className="grid gap-1.5">
              {otherPromotions.map((other) => (
                <label key={other.promotionId} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.stacksWith.includes(other.promotionId)}
                    onCheckedChange={(checked) =>
                      set(
                        "stacksWith",
                        checked
                          ? [...form.stacksWith, other.promotionId]
                          : form.stacksWith.filter((id) => id !== other.promotionId),
                      )
                    }
                  />
                  {other.name}
                </label>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Priority" hint={PRIORITY_HINT[resolution]}>
              <Input type="number" value={form.priority} onChange={(e) => set("priority", Number(e.target.value))} />
            </Field>
            <Field label="Switched on">
              <Switch checked={form.active} onCheckedChange={(active) => set("active", active)} />
            </Field>
          </div>
        </div>

        <SheetFooter className="flex-row justify-between border-t">
          {promotionId ? (
            <Button variant="destructive" onClick={destroy} disabled={remove.isPending}>
              <Trash2 /> Remove
            </Button>
          ) : (
            <span />
          )}
          <Button
            onClick={save}
            disabled={saving || form.name.trim() === "" || (form.venueIds !== null && form.venueIds.length === 0)}
          >
            {saving ? "Saving…" : "Save to draft"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function AppliesToEditor({
  appliesTo,
  isBundle,
  products,
  onChange,
}: {
  appliesTo: AppliesTo;
  isBundle: boolean;
  products: ProductResponse[];
  onChange: (appliesTo: AppliesTo) => void;
}) {
  if (isBundle && appliesTo.kind === "bundle") {
    return <BundleSlotsEditor slots={appliesTo.slots} products={products} onChange={(slots) => onChange({ kind: "bundle", slots })} />;
  }

  const categories = [...new Set(products.map((product) => product.category))];
  return (
    <Field label="What it covers">
      <Select
        value={appliesTo.kind}
        onValueChange={(kind) => {
          if (kind === "all") onChange({ kind: "all" });
          if (kind === "category") onChange({ kind: "category", category: categories[0] ?? "beverage" });
          if (kind === "products") onChange({ kind: "products", productIds: [products[0]?.productId ?? ""] });
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Everything</SelectItem>
          <SelectItem value="category">A category</SelectItem>
          <SelectItem value="products">Specific items</SelectItem>
        </SelectContent>
      </Select>
      {appliesTo.kind === "category" ? (
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={appliesTo.category}
          onValueChange={(category) => category && onChange({ kind: "category", category })}
        >
          {categories.map((category) => (
            <ToggleGroupItem key={category} value={category}>
              {category === "beverage" ? "Drinks" : category === "food" ? "Food" : category}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      ) : null}
      {appliesTo.kind === "products" ? (
        <ProductChecklist
          products={products}
          selected={appliesTo.productIds}
          onChange={(productIds) => productIds.length > 0 && onChange({ kind: "products", productIds })}
        />
      ) : null}
    </Field>
  );
}

function BundleSlotsEditor({
  slots,
  products,
  onChange,
}: {
  slots: BundleSlot[];
  products: ProductResponse[];
  onChange: (slots: BundleSlot[]) => void;
}) {
  const setSlot = (index: number, patch: Partial<BundleSlot>) =>
    onChange(slots.map((slot, i) => (i === index ? { ...slot, ...patch } : slot)));

  return (
    <Field label="What's in the bundle" hint="Each part can be filled by any of the ticked items.">
      <div className="space-y-3">
        {slots.map((slot, index) => (
          <div key={index} className="space-y-2 rounded-md border p-2">
            <div className="flex gap-2">
              <Input
                className="w-16"
                type="number"
                min={1}
                aria-label="Quantity"
                value={slot.quantity}
                onChange={(e) => setSlot(index, { quantity: Math.max(1, Number(e.target.value)) })}
              />
              <Input
                placeholder="Label, e.g. Any pint"
                value={slot.label}
                onChange={(e) => setSlot(index, { label: e.target.value })}
              />
              <Button
                variant="ghost"
                size="icon"
                aria-label="Remove part"
                disabled={slots.length === 1}
                onClick={() => onChange(slots.filter((_, i) => i !== index))}
              >
                <Trash2 />
              </Button>
            </div>
            <ProductChecklist
              products={products}
              selected={slot.productIds}
              onChange={(productIds) => setSlot(index, { productIds })}
            />
          </div>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onChange([...slots, { label: "", productIds: [], quantity: 1 }])}
        >
          <Plus /> Add part
        </Button>
      </div>
    </Field>
  );
}

function ProductChecklist({
  products,
  selected,
  onChange,
}: {
  products: ProductResponse[];
  selected: string[];
  onChange: (productIds: string[]) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
      {products.map((product) => (
        <label key={product.productId} className="flex items-center gap-2 text-xs">
          <Checkbox
            checked={selected.includes(product.productId)}
            onCheckedChange={(checked) =>
              onChange(
                checked
                  ? [...selected, product.productId]
                  : selected.filter((id) => id !== product.productId),
              )
            }
          />
          {product.name}
        </label>
      ))}
    </div>
  );
}

function VenueScopeEditor({
  venues,
  venueIds,
  onChange,
}: {
  venues: VenueResponse[];
  venueIds: string[] | null;
  onChange: (venueIds: string[] | null) => void;
}) {
  const states = [...new Set(venues.map((venue) => venue.state))].sort();
  const noneChosen = venueIds !== null && venueIds.length === 0;

  return (
    <Field label="Where does it run?">
      <ToggleGroup
        type="single"
        variant="outline"
        size="sm"
        value={venueIds === null ? "all" : "some"}
        onValueChange={(value) => {
          if (value === "all") onChange(null);
          // Start empty so "only some" means picking, not unticking.
          if (value === "some") onChange([]);
        }}
      >
        <ToggleGroupItem value="all">Every venue</ToggleGroupItem>
        <ToggleGroupItem value="some">Only some venues</ToggleGroupItem>
      </ToggleGroup>
      {venueIds !== null ? (
        <div className="space-y-2 rounded-md border p-2">
          <div className="flex flex-wrap items-center gap-1">
            <span className="me-1 text-xs text-muted-foreground">Quick pick:</span>
            {states.map((state) => (
              <Button
                key={state}
                size="xs"
                variant="outline"
                onClick={() =>
                  onChange(venues.filter((venue) => venue.state === state).map((venue) => venue.venueId))
                }
              >
                All {state}
              </Button>
            ))}
            <Button size="xs" variant="ghost" onClick={() => onChange([])}>
              Clear
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {venues.map((venue) => (
              <label key={venue.venueId} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={venueIds.includes(venue.venueId)}
                  onCheckedChange={(checked) =>
                    onChange(
                      checked ? [...venueIds, venue.venueId] : venueIds.filter((id) => id !== venue.venueId),
                    )
                  }
                />
                {venue.name} <span className="text-muted-foreground">{venue.state}</span>
              </label>
            ))}
          </div>
          {noneChosen ? (
            <p className="text-xs text-destructive">Tick at least one venue, or choose Every venue.</p>
          ) : null}
        </div>
      ) : null}
    </Field>
  );
}

function VenueOverridesEditor({
  venues,
  overrides,
  onChange,
}: {
  venues: VenueResponse[];
  overrides: VenueOverride[];
  onChange: (overrides: VenueOverride[]) => void;
}) {
  const setOverride = (index: number, patch: Partial<VenueOverride>) =>
    onChange(overrides.map((override, i) => (i === index ? { ...override, ...patch } : override)));
  const unused = venues.filter((venue) => !overrides.some((override) => override.venueId === venue.venueId));

  return (
    <Field label="Venue exceptions" hint="Different hours at one venue, or switch it off there. Blank times use the normal hours.">
      <div className="space-y-2">
        {overrides.map((override, index) => (
          <div key={override.venueId} className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-md border p-2">
            <Select value={override.venueId} onValueChange={(venueId) => setOverride(index, { venueId })}>
              <SelectTrigger className="w-full" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {venues
                  .filter((venue) => venue.venueId === override.venueId || unused.includes(venue))
                  .map((venue) => (
                    <SelectItem key={venue.venueId} value={venue.venueId}>
                      {venue.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="icon-sm" aria-label="Remove exception" onClick={() => onChange(overrides.filter((_, i) => i !== index))}>
              <Trash2 />
            </Button>
            <div className="col-span-2 flex flex-wrap items-center gap-2 text-sm">
              <label className="flex items-center gap-2">
                <Switch checked={override.enabled} onCheckedChange={(enabled) => setOverride(index, { enabled })} />
                Runs here
              </label>
              {override.enabled ? (
                <>
                  <Input
                    className="w-28"
                    type="time"
                    aria-label="From"
                    value={override.startsAt ?? ""}
                    onChange={(e) => setOverride(index, { startsAt: e.target.value || undefined })}
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    className="w-28"
                    type="time"
                    aria-label="Until"
                    value={override.endsAt ?? ""}
                    onChange={(e) => setOverride(index, { endsAt: e.target.value || undefined })}
                  />
                </>
              ) : null}
            </div>
          </div>
        ))}
        {unused.length > 0 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange([...overrides, { venueId: unused[0]!.venueId, enabled: true }])}
          >
            <Plus /> Add exception
          </Button>
        ) : null}
      </div>
    </Field>
  );
}
