'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Edit, Trash2 } from 'lucide-react';

interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue: string | null;
  isPrimaryKey: boolean;
}

interface PaginationInfo {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

interface DataGridProps {
  columns: ColumnInfo[];
  data: Record<string, unknown>[];
  isLoading: boolean;
  sortColumn: string;
  sortDir: 'asc' | 'desc';
  onSort: (column: string) => void;
  onEdit?: (record: Record<string, unknown>) => void;
  onDelete?: (record: Record<string, unknown>) => void;
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function DataGrid({
  columns,
  data,
  isLoading,
  sortColumn,
  sortDir,
  onSort,
  onEdit,
  onDelete,
  pagination,
  onPageChange,
  onPageSizeChange,
}: DataGridProps) {
  const hasActions = onEdit || onDelete;

  const formatValue = (value: unknown, type: string): string => {
    if (value === null || value === undefined) {
      return '∅ null';
    }
    if (typeof value === 'boolean') {
      return value ? 'true' : 'false';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    if (type.includes('timestamp') && typeof value === 'string') {
      return new Date(value).toLocaleString();
    }
    if (type === 'date' && typeof value === 'string') {
      return new Date(value).toLocaleDateString();
    }
    return String(value);
  };

  const getTypeColor = (type: string): string => {
    if (type === 'uuid') return 'text-purple-500 dark:text-purple-400';
    if (type.includes('int') || type === 'numeric') return 'text-blue-500 dark:text-blue-400';
    if (type === 'boolean') return 'text-orange-500 dark:text-orange-400';
    if (type.includes('timestamp') || type === 'date') return 'text-green-500 dark:text-green-400';
    if (type === 'jsonb' || type === 'json') return 'text-yellow-500 dark:text-yellow-400';
    return 'text-muted-foreground';
  };

  return (
    <div className="h-full flex flex-col border rounded-lg overflow-hidden bg-white dark:bg-slate-900">
      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-muted/50 backdrop-blur border-b">
            <tr>
              {columns.map(col => (
                <th
                  key={col.name}
                  className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-muted/80 transition-colors select-none"
                  onClick={() => onSort(col.name)}
                >
                  <div className="flex items-center gap-2">
                    <span>{col.name}</span>
                    {col.isPrimaryKey && (
                      <span className="text-xs text-yellow-500">PK</span>
                    )}
                    {sortColumn === col.name ? (
                      sortDir === 'asc' ? (
                        <ArrowUp className="w-3 h-3" />
                      ) : (
                        <ArrowDown className="w-3 h-3" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3 h-3 opacity-30" />
                    )}
                  </div>
                  <div className={cn("text-xs font-normal", getTypeColor(col.type))}>
                    {col.type}
                  </div>
                </th>
              ))}
              {hasActions && (
                <th className="px-4 py-3 text-right font-medium w-24">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length + (hasActions ? 1 : 0)} className="px-4 py-8 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (hasActions ? 1 : 0)} className="px-4 py-8 text-center text-muted-foreground">
                  No records found
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr
                  key={row.id as string || idx}
                  className="border-b hover:bg-muted/30 transition-colors"
                >
                  {columns.map(col => {
                    const value = row[col.name];
                    const formatted = formatValue(value, col.type);
                    const isNull = value === null || value === undefined;

                    return (
                      <td
                        key={col.name}
                        className={cn(
                          "px-4 py-2 max-w-xs truncate",
                          isNull && "text-muted-foreground italic"
                        )}
                        title={formatted}
                      >
                        {formatted}
                      </td>
                    );
                  })}
                  {hasActions && (
                    <td className="px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => onEdit(row)}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => onDelete(row)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="border-t px-4 py-3 flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Rows per page:</span>
          <Select
            value={pagination.pageSize.toString()}
            onValueChange={(val) => onPageSizeChange(parseInt(val))}
          >
            <SelectTrigger className="w-16 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total)
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
