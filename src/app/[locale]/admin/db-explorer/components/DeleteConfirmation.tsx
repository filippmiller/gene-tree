'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: Record<string, unknown> | null;
  tableName: string;
  onConfirm: (reason: string) => Promise<void>;
}

export function DeleteConfirmation({
  open,
  onOpenChange,
  record,
  tableName,
  onConfirm,
}: DeleteConfirmationProps) {
  const [reason, setReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      await onConfirm(reason || 'Admin deletion');
      setReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  const recordId = record?.id as string;
  const recordPreview = record
    ? Object.entries(record)
        .filter(([key]) => key !== 'id')
        .slice(0, 3)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ')
    : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Delete Record
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. The record will be permanently deleted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="error" className="bg-destructive/10">
            <div className="text-sm">
              <p className="font-medium">You are about to delete:</p>
              <p className="mt-1 font-mono text-xs">
                {tableName}.{recordId}
              </p>
              {recordPreview && (
                <p className="mt-1 text-muted-foreground truncate">
                  {recordPreview}
                </p>
              )}
            </div>
          </Alert>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason for deletion (optional)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this record is being deleted..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              This will be logged in the audit trail.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            loading={isDeleting}
          >
            Delete Permanently
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
