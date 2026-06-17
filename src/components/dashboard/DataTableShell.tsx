import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/dashboard/DataTablePagination";
import { dataTableClass, dataTableWrapper } from "@/lib/dashboard-mobile";
import { cn } from "@/lib/utils";

export function DataTableShell({
  children,
  pagination,
  emptyMessage,
  isEmpty,
  colSpan = 1,
  className,
}: {
  children: ReactNode;
  pagination?: {
    page: number;
    totalPages: number;
    total: number;
    rangeStart: number;
    rangeEnd: number;
    onPageChange: (page: number) => void;
  };
  emptyMessage?: string;
  isEmpty?: boolean;
  colSpan?: number;
  className?: string;
}) {
  return (
    <div className={cn(dataTableWrapper, className)}>
      <p className="border-b border-border bg-muted/30 px-3 py-1.5 text-[10px] text-muted-foreground sm:hidden">
        Glissez horizontalement pour voir tout le tableau
      </p>
      <Table className={dataTableClass}>{children}</Table>
      {isEmpty && emptyMessage && (
        <p className="px-3 py-8 text-center text-xs text-muted-foreground sm:px-4 sm:py-10 sm:text-sm">
          {emptyMessage}
        </p>
      )}
      {pagination && (
        <DataTablePagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          rangeStart={pagination.rangeStart}
          rangeEnd={pagination.rangeEnd}
          onPageChange={pagination.onPageChange}
        />
      )}
    </div>
  );
}

export function DataTableEmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-20 px-2 text-center text-xs text-muted-foreground sm:h-24 sm:text-sm">
        {message}
      </TableCell>
    </TableRow>
  );
}

export { TableHeader, TableBody, TableHead, TableRow, TableCell };
