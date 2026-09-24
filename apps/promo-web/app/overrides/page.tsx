"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { OverrideReason } from "@ridgeline/contracts/overrides";
import { Badge } from "@ridgeline/ui/badge";
import { Button } from "@ridgeline/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ridgeline/ui/card";
import { Input } from "@ridgeline/ui/input";
import { Label } from "@ridgeline/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@ridgeline/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@ridgeline/ui/table";
import { Textarea } from "@ridgeline/ui/textarea";
import { PageHeader } from "../../components/page-header";
import { QueryError } from "../../components/query-state";
import { formatCents } from "../../lib/format";
import { useProducts, useStaff, useVenues } from "../../lib/queries/catalog";
import { useCreateOverride, useOverrideSummary, useOverrides } from "../../lib/queries/overrides";

const REASON_LABEL: Record<OverrideReason, string> = {
  customer_complaint: "Customer complaint",
  wastage_or_error: "Wastage or till error",
  manager_goodwill: "Manager goodwill",
  deal_not_in_system: "Deal not in the system",
  other: "Other",
};

export default function OverridesPage() {
  const venues = useVenues();
  const staff = useStaff();
  const [venueId, setVenueId] = useState("VEN-0233");
  const products = useProducts(venueId);
  const overrides = useOverrides();
  const summary = useOverrideSummary();
  const create = useCreateOverride();

  const [staffId, setStaffId] = useState("STF-11");
  const [productId, setProductId] = useState("PRD-0201");
  const [quoted, setQuoted] = useState("18.00");
  const [charged, setCharged] = useState("16.20");
  const [reason, setReason] = useState<OverrideReason>("customer_complaint");
  const [note, setNote] = useState("Member insisted on 10% on top of Schnitzel Tuesday");

  const staffName = (id: string) => staff.data?.find((member) => member.staffId === id)?.name ?? id;
  const productName = (id: string) => products.data?.find((product) => product.productId === id)?.name ?? id;

  const submit = () =>
    create.mutate(
      {
        venueId,
        staffId,
        productId,
        quotedCents: Math.round(Number(quoted) * 100),
        chargedCents: Math.round(Number(charged) * 100),
        reason,
        note,
      },
      {
        onSuccess: (override) =>
          toast.success(`Recorded: ${formatCents(override.discountCents)} off, ${REASON_LABEL[override.reason].toLowerCase()}`),
        onError: (error) => toast.error(error.message),
      },
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Manual prices"
        description="Staff can still change a price by hand, but only supervisors, and never without a reason. These are reported separately, so promotion reports stay accurate."
        tip="Try it as J. Okonjo (a casual) first: the till refuses. Then choose M. Ferreira (a supervisor)."
      />

      <div className="grid gap-6 lg:grid-cols-[24rem_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Override a price</CardTitle>
            <CardDescription>What the till said, what the customer paid, and why.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>Venue</Label>
              <Select value={venueId} onValueChange={setVenueId}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {venues.data?.map((venue) => (
                    <SelectItem key={venue.venueId} value={venue.venueId}>
                      {venue.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Staff member</Label>
              <Select value={staffId} onValueChange={setStaffId}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {staff.data?.map((member) => (
                    <SelectItem key={member.staffId} value={member.staffId}>
                      {member.name} — {member.role}
                      {member.permissions.includes("override_price") ? "" : " (can't override)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Item</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {products.data?.map((product) => (
                    <SelectItem key={product.productId} value={product.productId}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="quoted">Till said ($)</Label>
                <Input id="quoted" type="number" step="0.01" value={quoted} onChange={(e) => setQuoted(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="charged">Charged ($)</Label>
                <Input id="charged" type="number" step="0.01" value={charged} onChange={(e) => setCharged(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Reason</Label>
              <Select value={reason} onValueChange={(value) => setReason(value as OverrideReason)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(REASON_LABEL) as OverrideReason[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {REASON_LABEL[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="note">Note</Label>
              <Textarea id="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <Button className="w-full" onClick={submit} disabled={create.isPending}>
              Record override
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardDescription>Overrides recorded</CardDescription>
                <CardTitle className="text-2xl tabular-nums">{summary.data?.count ?? 0}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Given away by hand</CardDescription>
                <CardTitle className="text-2xl tabular-nums">{formatCents(summary.data?.discountCents ?? 0)}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {summary.data && summary.data.byReason.length > 0 ? (
            <Card size="sm">
              <CardHeader>
                <CardTitle>By reason</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {summary.data.byReason.map((row) => (
                  <div key={row.reason} className="flex justify-between">
                    <span>{REASON_LABEL[row.reason]}</span>
                    <span className="tabular-nums">
                      {row.count} · {formatCents(row.discountCents)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <Card className="py-0">
            {overrides.isError ? (
              <QueryError error={overrides.error} />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Who</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-end">Till said</TableHead>
                    <TableHead className="text-end">Charged</TableHead>
                    <TableHead>Why</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overrides.data?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                        No manual prices yet.
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {overrides.data?.map((override) => (
                    <TableRow key={override.overrideId}>
                      <TableCell>{staffName(override.staffId)}</TableCell>
                      <TableCell>{productName(override.productId)}</TableCell>
                      <TableCell className="text-end tabular-nums">{formatCents(override.quotedCents)}</TableCell>
                      <TableCell className="text-end tabular-nums">{formatCents(override.chargedCents)}</TableCell>
                      <TableCell className="whitespace-normal">
                        <Badge variant="outline">{REASON_LABEL[override.reason]}</Badge>
                        {override.note ? <div className="mt-1 text-xs text-muted-foreground">{override.note}</div> : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
