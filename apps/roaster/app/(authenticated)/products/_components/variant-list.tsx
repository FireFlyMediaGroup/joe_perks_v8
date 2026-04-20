"use client";

import type { GrindOption } from "@joe-perks/db";
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
import { PencilIcon } from "lucide-react";
import { useState } from "react";

import { formatGrindOption } from "../_lib/format";
import { formatCentsAsDollars } from "../_lib/money";
import { VariantDeleteButton } from "./variant-delete-button";
import { VariantForm } from "./variant-form";

export interface VariantRow {
  grind: GrindOption;
  id: string;
  isAvailable: boolean;
  retailPrice: number;
  sizeOz: number;
  sku: string | null;
  wholesalePrice: number;
}

interface VariantListProps {
  readonly productId: string;
  readonly variants: VariantRow[];
}

export function VariantList({ productId, variants }: VariantListProps) {
  const [editing, setEditing] = useState<VariantRow | null>(null);

  if (variants.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No variants yet. Add a size and grind option below.
      </p>
    );
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Size</TableHead>
              <TableHead>Grind</TableHead>
              <TableHead className="text-right">Wholesale</TableHead>
              <TableHead className="text-right">Retail</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Availability</TableHead>
              <TableHead className="w-[120px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.map((v) => (
              <TableRow key={v.id}>
                <TableCell className="tabular-nums">{v.sizeOz} oz</TableCell>
                <TableCell>{formatGrindOption(v.grind)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  ${formatCentsAsDollars(v.wholesalePrice)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  ${formatCentsAsDollars(v.retailPrice)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {v.sku ?? "—"}
                </TableCell>
                <TableCell>
                  {v.isAvailable ? (
                    <Badge variant="default">Available</Badge>
                  ) : (
                    <Badge variant="secondary">Unavailable</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      onClick={() => setEditing(v)}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      <PencilIcon className="size-4" />
                      <span className="sr-only">Edit variant</span>
                    </Button>
                    <VariantDeleteButton
                      productId={productId}
                      variantId={v.id}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
          }
        }}
        open={editing !== null}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit variant</DialogTitle>
          </DialogHeader>
          {editing ? (
            <VariantForm
              onDone={() => setEditing(null)}
              productId={productId}
              variant={editing}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
