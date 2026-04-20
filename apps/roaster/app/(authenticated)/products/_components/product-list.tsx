import type { ProductStatus, RoastLevel } from "@joe-perks/db";
import { Badge } from "@repo/design-system/components/ui/badge";
import { Button } from "@repo/design-system/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/design-system/components/ui/table";
import Image from "next/image";
import Link from "next/link";

import { formatProductStatus, formatRoastLevel } from "../_lib/format";

export interface ProductListRow {
  id: string;
  imageUrl: string | null;
  name: string;
  roastLevel: RoastLevel;
  status: ProductStatus;
  variantCount: number;
}

interface ProductListProps {
  readonly products: ProductListRow[];
}

export function ProductList({ products }: ProductListProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
        <p>
          No products yet. Create your first coffee product to sell through
          campaigns.
        </p>
        <Button asChild className="mt-4">
          <Link href="/products/new">New product</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[72px]" />
            <TableHead>Name</TableHead>
            <TableHead>Roast</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Variants</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                <Link
                  className="relative block h-12 w-12 overflow-hidden rounded-md bg-muted"
                  href={`/products/${p.id}`}
                >
                  {p.imageUrl ? (
                    <Image
                      alt={p.name}
                      className="object-cover"
                      fill
                      sizes="48px"
                      src={p.imageUrl}
                      unoptimized
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center text-muted-foreground text-xs">
                      —
                    </span>
                  )}
                </Link>
              </TableCell>
              <TableCell>
                <Link
                  className="font-medium text-primary hover:underline"
                  href={`/products/${p.id}`}
                >
                  {p.name}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatRoastLevel(p.roastLevel)}
              </TableCell>
              <TableCell>
                <ProductStatusBadge status={p.status} />
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {p.variantCount}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function productStatusBadgeVariant(
  status: ProductStatus
): "default" | "secondary" | "outline" {
  if (status === "ACTIVE") {
    return "default";
  }
  if (status === "DRAFT") {
    return "secondary";
  }
  return "outline";
}

function ProductStatusBadge({ status }: { status: ProductStatus }) {
  return (
    <Badge variant={productStatusBadgeVariant(status)}>
      {formatProductStatus(status)}
    </Badge>
  );
}
