import React, { useState } from 'react';
import { Client } from '@/hooks/useClients';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';

interface DeleteClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
  onClientDeleted: (clientId: string) => Promise<{ success: boolean; error?: string }>;
}

/**
 * DeleteClientModal Component
 * 
 * Purpose: Confirmation modal for deactivating clients
 * Features:
 * - Clear warning about consequences
 * - Shows client information
 * - Soft delete (deactivation) by default
 * - Loading states
 * - Error handling
 */
export const DeleteClientModal: React.FC<DeleteClientModalProps> = ({
  open,
  onOpenChange,
  client,
  onClientDeleted
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Handle client deletion (deactivation)
  const handleDelete = async () => {
    setIsLoading(true);
    
    try {
      const result = await onClientDeleted(client.id);
      
      if (result.success) {
        toast({
          title: "Client Deleted",
          description: `${client.company_name} has been permanently deleted.`,
        });
        
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete client. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center text-destructive">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Delete Client
          </DialogTitle>
          <DialogDescription>
            This action will permanently delete the client and all associated data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Client Information */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Client Details:</h4>
            <div className="space-y-1 text-sm">
              <div><strong>Company:</strong> {client.company_name}</div>
              <div><strong>Email:</strong> {client.contact_email}</div>
              <div><strong>Users:</strong> {client.user_count || 0} users will lose access</div>
              <div><strong>Status:</strong> {client.status}</div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <h4 className="font-medium text-destructive">What happens when you delete this client?</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• The client record will be permanently removed</li>
                  <li>• All associated users will lose their client assignment</li>
                  <li>• Files and data may become inaccessible</li>
                  <li>• This action cannot be undone</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Confirmation */}
          <div className="bg-card p-4 rounded-lg border">
            <p className="text-sm">
              Are you sure you want to delete <strong>{client.company_name}</strong>? 
              This will permanently remove the client and affect {client.user_count || 0} users 
              from this company.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Client
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};