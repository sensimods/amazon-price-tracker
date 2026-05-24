"use client";

import { formatDistanceToNow } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface PriceRecord {
  id: string;
  price: string;
  currency: string | null;
  isAvailable: boolean | null;
  scrapedAt: Date | string;
}

interface PriceTableProps {
  data: PriceRecord[];
  limit?: number;
}

export function PriceTable({ data, limit }: PriceTableProps) {
  const displayData = limit ? data.slice(0, limit) : data;

  const formatPrice = (price: string, currency: string | null) => {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency ?? "USD",
      }).format(parseFloat(price));
    } catch {
      return `$${price}`;
    }
  };

  if (displayData.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        No price records yet.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Price</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Checked</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {displayData.map((record) => (
          <TableRow key={record.id}>
            <TableCell className="font-medium">
              {formatPrice(record.price, record.currency)}
            </TableCell>
            <TableCell>
              <Badge variant={record.isAvailable ? "default" : "secondary"}>
                {record.isAvailable ? "Available" : "Unavailable"}
              </Badge>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(record.scrapedAt), {
                addSuffix: true,
              })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}