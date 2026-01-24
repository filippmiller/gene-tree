'use client';

import { useState, useEffect, useCallback } from 'react';
import { TableList } from './components/TableList';
import { DataGrid } from './components/DataGrid';
import { RecordEditor } from './components/RecordEditor';
import { DeleteConfirmation } from './components/DeleteConfirmation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, RefreshCw, Search, Download } from 'lucide-react';

interface TableInfo {
  name: string;
  displayName: string;
  category: string;
  accessLevel: 'full' | 'read-only' | 'no-delete';
  recordCount: number;
}

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

export default function DatabaseExplorer({ adminName }: { adminName: string }) {
  // State
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 25,
    totalCount: 0,
    totalPages: 0,
  });
  const [accessLevel, setAccessLevel] = useState<'full' | 'read-only' | 'no-delete'>('full');
  const [sortColumn, setSortColumn] = useState<string>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create');
  const [editingRecord, setEditingRecord] = useState<Record<string, unknown> | null>(null);

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingRecord, setDeletingRecord] = useState<Record<string, unknown> | null>(null);

  // Fetch tables on mount
  useEffect(() => {
    fetchTables();
  }, []);

  // Fetch data when table selection or pagination changes
  useEffect(() => {
    if (selectedTable) {
      fetchSchema(selectedTable);
      fetchData(selectedTable);
    }
  }, [selectedTable, pagination.page, pagination.pageSize, sortColumn, sortDir]);

  // Debounced search
  useEffect(() => {
    if (selectedTable) {
      const timer = setTimeout(() => {
        fetchData(selectedTable);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  const fetchTables = async () => {
    try {
      const res = await fetch('/api/admin/tables');
      if (!res.ok) throw new Error('Failed to fetch tables');
      const json = await res.json();
      setTables(json.tables || []);

      // Select first table by default
      if (json.tables?.length > 0 && !selectedTable) {
        setSelectedTable(json.tables[0].name);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tables');
    }
  };

  const fetchSchema = async (table: string) => {
    try {
      const res = await fetch(`/api/admin/tables/${table}/schema`);
      if (!res.ok) throw new Error('Failed to fetch schema');
      const json = await res.json();
      setColumns(json.columns || []);
      setAccessLevel(json.accessLevel || 'full');
    } catch (err) {
      console.error('Schema fetch error:', err);
    }
  };

  const fetchData = useCallback(async (table: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        sort: sortColumn,
        sortDir: sortDir,
        ...(searchQuery && { search: searchQuery }),
      });

      const res = await fetch(`/api/admin/tables/${table}?${params}`);
      if (!res.ok) throw new Error('Failed to fetch data');
      const json = await res.json();

      setData(json.data || []);
      setPagination(prev => ({
        ...prev,
        totalCount: json.pagination?.totalCount || 0,
        totalPages: json.pagination?.totalPages || 0,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.pageSize, sortColumn, sortDir, searchQuery]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDir('asc');
    }
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleAddRecord = () => {
    setEditorMode('create');
    setEditingRecord(null);
    setEditorOpen(true);
  };

  const handleEditRecord = (record: Record<string, unknown>) => {
    setEditorMode('edit');
    setEditingRecord(record);
    setEditorOpen(true);
  };

  const handleDeleteClick = (record: Record<string, unknown>) => {
    setDeletingRecord(record);
    setDeleteDialogOpen(true);
  };

  const handleSaveRecord = async (data: Record<string, unknown>) => {
    if (!selectedTable) return;

    try {
      const url = editorMode === 'create'
        ? `/api/admin/tables/${selectedTable}`
        : `/api/admin/tables/${selectedTable}/${editingRecord?.id}`;

      const method = editorMode === 'create' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save');
      }

      setEditorOpen(false);
      fetchData(selectedTable);
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteConfirm = async (reason: string) => {
    if (!selectedTable || !deletingRecord?.id) return;

    try {
      const res = await fetch(
        `/api/admin/tables/${selectedTable}/${deletingRecord.id}?reason=${encodeURIComponent(reason)}`,
        { method: 'DELETE' }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete');
      }

      setDeleteDialogOpen(false);
      setDeletingRecord(null);
      fetchData(selectedTable);
    } catch (err) {
      throw err;
    }
  };

  const handleExportCSV = () => {
    if (!data.length || !columns.length) return;

    const headers = columns.map(c => c.name);
    const rows = data.map(row =>
      headers.map(h => {
        const val = row[h];
        if (val === null || val === undefined) return '';
        if (typeof val === 'object') return JSON.stringify(val);
        return String(val);
      })
    );

    const csv = [
      headers.join(','),
      ...rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTable}-export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedTableInfo = tables.find(t => t.name === selectedTable);

  return (
    <div className="flex gap-6 h-[calc(100vh-200px)]">
      {/* Left sidebar - Table list */}
      <aside className="w-64 flex-shrink-0">
        <TableList
          tables={tables}
          selectedTable={selectedTable}
          onSelectTable={(name) => {
            setSelectedTable(name);
            setPagination(prev => ({ ...prev, page: 1 }));
            setSearchQuery('');
            // Reset sort to safe defaults when switching tables
            setSortColumn('created_at');
            setSortDir('desc');
          }}
        />
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {selectedTable ? (
          <>
            {/* Toolbar */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{selectedTableInfo?.displayName || selectedTable}</h2>
                <Badge variant={accessLevel === 'read-only' ? 'secondary' : accessLevel === 'no-delete' ? 'outline' : 'default'}>
                  {accessLevel === 'read-only' ? 'Read Only' : accessLevel === 'no-delete' ? 'No Delete' : 'Full Access'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {pagination.totalCount} records
                </span>
              </div>

              <div className="flex-1" />

              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Button variant="outline" size="icon" onClick={() => fetchData(selectedTable)}>
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>

              <Button variant="outline" size="icon" onClick={handleExportCSV}>
                <Download className="w-4 h-4" />
              </Button>

              {accessLevel !== 'read-only' && (
                <Button onClick={handleAddRecord}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Record
                </Button>
              )}
            </div>

            {/* Error display */}
            {error && (
              <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
                {error}
              </div>
            )}

            {/* Data grid */}
            <div className="flex-1 overflow-hidden">
              <DataGrid
                columns={columns}
                data={data}
                isLoading={isLoading}
                sortColumn={sortColumn}
                sortDir={sortDir}
                onSort={handleSort}
                onEdit={accessLevel !== 'read-only' ? handleEditRecord : undefined}
                onDelete={accessLevel === 'full' ? handleDeleteClick : undefined}
                pagination={pagination}
                onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
                onPageSizeChange={(pageSize) => setPagination(prev => ({ ...prev, pageSize, page: 1 }))}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a table from the sidebar
          </div>
        )}
      </main>

      {/* Record editor modal */}
      <RecordEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        mode={editorMode}
        columns={columns}
        record={editingRecord}
        onSave={handleSaveRecord}
        tableName={selectedTable || ''}
      />

      {/* Delete confirmation dialog */}
      <DeleteConfirmation
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        record={deletingRecord}
        tableName={selectedTable || ''}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
