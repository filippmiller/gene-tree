'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronRight, Database, Lock, Search } from 'lucide-react';

interface TableInfo {
  name: string;
  displayName: string;
  category: string;
  accessLevel: 'full' | 'read-only' | 'no-delete';
  recordCount: number;
}

interface TableListProps {
  tables: TableInfo[];
  selectedTable: string | null;
  onSelectTable: (name: string) => void;
}

const CATEGORY_ORDER = ['core', 'content', 'system', 'reference'];

const CATEGORY_LABELS: Record<string, string> = {
  core: 'Core',
  content: 'Content',
  system: 'System',
  reference: 'Reference',
};

export function TableList({ tables, selectedTable, onSelectTable }: TableListProps) {
  const [search, setSearch] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const filteredTables = tables.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.displayName.toLowerCase().includes(search.toLowerCase())
  );

  const groupedTables = CATEGORY_ORDER.reduce((acc, category) => {
    acc[category] = filteredTables.filter(t => t.category === category);
    return acc;
  }, {} as Record<string, TableInfo[]>);

  const toggleCategory = (category: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  return (
    <div className="h-full bg-white dark:bg-slate-900 border rounded-lg overflow-hidden flex flex-col">
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Filter tables..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-8 text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {CATEGORY_ORDER.map(category => {
          const categoryTables = groupedTables[category];
          if (categoryTables.length === 0) return null;

          const isCollapsed = collapsedCategories.has(category);

          return (
            <div key={category}>
              <button
                onClick={() => toggleCategory(category)}
                className="w-full px-3 py-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:bg-muted/50"
              >
                {isCollapsed ? (
                  <ChevronRight className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
                {CATEGORY_LABELS[category] || category}
                <span className="text-muted-foreground/60">({categoryTables.length})</span>
              </button>

              {!isCollapsed && (
                <div className="pb-2">
                  {categoryTables.map(table => (
                    <button
                      key={table.name}
                      onClick={() => onSelectTable(table.name)}
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-muted/50 transition-colors",
                        selectedTable === table.name && "bg-primary/10 text-primary border-l-2 border-primary"
                      )}
                    >
                      <Database className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
                      <span className="flex-1 truncate">{table.displayName}</span>
                      {table.accessLevel === 'read-only' && (
                        <Lock className="w-3 h-3 text-muted-foreground" />
                      )}
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">
                        {table.recordCount}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
