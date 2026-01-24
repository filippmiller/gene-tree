'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue: string | null;
  isPrimaryKey: boolean;
}

interface RecordEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  columns: ColumnInfo[];
  record: Record<string, unknown> | null;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  tableName: string;
}

export function RecordEditor({
  open,
  onOpenChange,
  mode,
  columns,
  record,
  onSave,
  tableName,
}: RecordEditorProps) {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when record changes
  useEffect(() => {
    if (record && mode === 'edit') {
      const data: Record<string, string> = {};
      columns.forEach(col => {
        const value = record[col.name];
        if (value === null || value === undefined) {
          data[col.name] = '';
        } else if (typeof value === 'object') {
          data[col.name] = JSON.stringify(value, null, 2);
        } else {
          data[col.name] = String(value);
        }
      });
      setFormData(data);
    } else {
      setFormData({});
    }
    setError(null);
  }, [record, mode, columns]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Convert form data to proper types
      const data: Record<string, unknown> = {};
      columns.forEach(col => {
        const value = formData[col.name];

        // Skip empty optional fields
        if ((value === '' || value === undefined) && col.nullable) {
          data[col.name] = null;
          return;
        }

        // Skip auto-generated fields on create
        if (mode === 'create' && (col.isPrimaryKey || col.name === 'created_at' || col.name === 'updated_at')) {
          return;
        }

        // Skip id on edit
        if (mode === 'edit' && col.isPrimaryKey) {
          return;
        }

        // Convert based on type
        if (col.type === 'boolean') {
          data[col.name] = value === 'true' || value === '1';
        } else if (col.type.includes('int') || col.type === 'numeric') {
          data[col.name] = value === '' ? null : Number(value);
        } else if (col.type === 'jsonb' || col.type === 'json') {
          try {
            data[col.name] = value ? JSON.parse(value) : null;
          } catch {
            throw new Error(`Invalid JSON in field "${col.name}"`);
          }
        } else {
          data[col.name] = value || null;
        }
      });

      await onSave(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const renderField = (col: ColumnInfo) => {
    const value = formData[col.name] ?? '';
    const isDisabled = mode === 'create' && (col.isPrimaryKey || col.name === 'created_at' || col.name === 'updated_at');
    const isReadOnly = mode === 'edit' && col.isPrimaryKey;

    // JSON fields get a textarea
    if (col.type === 'jsonb' || col.type === 'json') {
      return (
        <Textarea
          value={value}
          onChange={(e) => handleChange(col.name, e.target.value)}
          disabled={isDisabled}
          readOnly={isReadOnly}
          className="font-mono text-xs min-h-[100px]"
          placeholder={isDisabled ? 'Auto-generated' : col.nullable ? 'null' : 'Required'}
        />
      );
    }

    // Boolean fields
    if (col.type === 'boolean') {
      return (
        <select
          value={value}
          onChange={(e) => handleChange(col.name, e.target.value)}
          disabled={isDisabled}
          className="w-full px-3 py-2 border rounded-md bg-background"
        >
          <option value="">-- Select --</option>
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      );
    }

    // Date fields
    if (col.type === 'date') {
      return (
        <Input
          type="date"
          value={value}
          onChange={(e) => handleChange(col.name, e.target.value)}
          disabled={isDisabled}
          readOnly={isReadOnly}
        />
      );
    }

    // Timestamp fields
    if (col.type.includes('timestamp')) {
      return (
        <Input
          type="datetime-local"
          value={value ? value.slice(0, 16) : ''}
          onChange={(e) => handleChange(col.name, e.target.value)}
          disabled={isDisabled}
          readOnly={isReadOnly}
          placeholder={isDisabled ? 'Auto-generated' : ''}
        />
      );
    }

    // Number fields
    if (col.type.includes('int') || col.type === 'numeric') {
      return (
        <Input
          type="number"
          value={value}
          onChange={(e) => handleChange(col.name, e.target.value)}
          disabled={isDisabled}
          readOnly={isReadOnly}
          placeholder={col.nullable ? 'null' : 'Required'}
        />
      );
    }

    // Default: text input
    return (
      <Input
        value={value}
        onChange={(e) => handleChange(col.name, e.target.value)}
        disabled={isDisabled}
        readOnly={isReadOnly}
        placeholder={isDisabled ? 'Auto-generated' : col.nullable ? 'null' : 'Required'}
      />
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add Record' : 'Edit Record'} - {tableName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
              {error}
            </div>
          )}

          {columns.map(col => (
            <div key={col.name} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Label htmlFor={col.name}>{col.name}</Label>
                <Badge variant="outline" className="text-xs">
                  {col.type}
                </Badge>
                {col.isPrimaryKey && (
                  <Badge variant="secondary" className="text-xs">PK</Badge>
                )}
                {!col.nullable && (
                  <span className="text-destructive text-xs">*</span>
                )}
              </div>
              {renderField(col)}
            </div>
          ))}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {mode === 'create' ? 'Create' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
