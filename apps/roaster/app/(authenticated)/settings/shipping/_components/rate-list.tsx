"use client";

import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/design-system/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";
import { PencilIcon, PlusIcon } from "lucide-react";
import { useState } from "react";

import { formatCentsAsDollars } from "../../../products/_lib/money";
import { RateDeleteButton } from "./rate-delete-button";
import { RateForm } from "./rate-form";

export interface ShippingRateRow {
  carrier: string;
  flatRate: number;
  id: string;
  isDefault: boolean;
  label: string;
}

interface RateListProps {
  readonly rates: ShippingRateRow[];
}

export function RateList({ rates }: RateListProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<ShippingRateRow | null>(null);

  const isFirstRate = rates.length === 0;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Button onClick={() => setCreateOpen(true)} type="button">
          <PlusIcon className="mr-1 size-4" />
          Add rate
        </Button>
      </div>

      {rates.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No shipping rates yet. Add at least one flat rate so buyers see
          shipping at checkout and your products can be used in campaigns. You
          can add more options (e.g. expedited) later.
        </p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Carrier</TableHead>
                <TableHead className="text-right">Flat rate</TableHead>
                <TableHead>Default</TableHead>
                <TableHead className="w-[120px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rates.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.label}</TableCell>
                  <TableCell>{r.carrier}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    ${formatCentsAsDollars(r.flatRate)}
                  </TableCell>
                  <TableCell>
                    {r.isDefault ? (
                      <Badge variant="default">Default</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Button
                        onClick={() => setEditing(r)}
                        size="sm"
                        type="button"
                        variant="outline"
                      >
                        <PencilIcon className="size-4" />
                        <span className="sr-only">Edit rate</span>
                      </Button>
                      <RateDeleteButton rateId={r.id} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog onOpenChange={setCreateOpen} open={createOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add shipping rate</DialogTitle>
          </DialogHeader>
          <RateForm
            isFirstRate={isFirstRate}
            mode="create"
            onDone={() => setCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={(o) => {
          if (!o) {
            setEditing(null);
          }
        }}
        open={editing !== null}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit shipping rate</DialogTitle>
          </DialogHeader>
          {editing ? (
            <RateForm
              isFirstRate={rates.length === 1}
              mode="edit"
              onDone={() => setEditing(null)}
              rate={editing}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
