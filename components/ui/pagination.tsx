'use client';

import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZES = [10, 25, 50] as const;

export interface PaginationProps {
  /** 1-based current page */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total number of items */
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  /** Optional label for the entity (e.g. "clientes", "contratos") */
  label?: string;
}

export function Pagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  label = 'itens',
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  const canPrev = page > 1;
  const canNext = page < totalPages;

  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, 'ellipsis', totalPages];
    if (page >= totalPages - 3) return [1, 'ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, 'ellipsis', page - 1, page, page + 1, 'ellipsis', totalPages];
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-700/50">
      <div className="flex items-center gap-4 text-sm text-slate-400 order-2 sm:order-1">
        <span>
          A mostrar <span className="font-medium text-slate-300">{start}</span>
          –<span className="font-medium text-slate-300">{end}</span> de{' '}
          <span className="font-medium text-slate-300">{totalItems}</span> {label}
        </span>
        {onPageSizeChange && totalItems > PAGE_SIZES[0] && (
          <Select
            value={String(pageSize)}
            onValueChange={(v) => onPageSizeChange(Number(v))}
          >
            <SelectTrigger className="w-[72px] h-8 bg-slate-700/50 border-slate-600/50 text-slate-200 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)} className="text-xs">
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
      <div className="flex items-center gap-1 order-1 sm:order-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-50"
          onClick={() => onPageChange(page - 1)}
          disabled={!canPrev}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {getPageNumbers().map((n, i) =>
          n === 'ellipsis' ? (
            <span key={`e-${i}`} className="px-2 text-slate-500 text-sm">
              …
            </span>
          ) : (
            <Button
              key={n}
              variant={page === n ? 'default' : 'outline'}
              size="sm"
              className={`h-8 min-w-8 px-2 text-sm ${
                page === n
                  ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
                  : 'border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
              onClick={() => onPageChange(n)}
            >
              {n}
            </Button>
          )
        )}
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-50"
          onClick={() => onPageChange(page + 1)}
          disabled={!canNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
