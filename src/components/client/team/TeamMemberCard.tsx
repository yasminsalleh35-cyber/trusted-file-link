import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  MoreHorizontal, 
  Mail, 
  Edit, 
  Trash2, 
  User,
  Calendar
} from 'lucide-react';
import type { TeamMember } from '@/hooks/useClientData';

/**
 * TeamMemberCard Component
 * 
 * Purpose: Display individual team member information with actions
 * Features:
 * - Member details display
 * - Status indicators
 * - Edit/delete actions
 * - Confirmation dialogs
 */

interface TeamMemberCardProps {
  member: TeamMember;
  onEdit: (member: TeamMember) => void;
  onDelete: (memberId: string) => Promise<void>;
  isDeleting?: boolean;
}

export const TeamMemberCard: React.FC<TeamMemberCardProps> = ({
  member,
  onEdit,
  onDelete,
  isDeleting = false
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Handle delete confirmation
  const handleDelete = async () => {
    try {
      await onDelete(member.id);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting member:', error);
      // Error handling is done in parent component
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              {/* Avatar */}
              <div className="h-12 w-12 bg-client/10 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-client">
                  {getInitials(member.full_name)}
                </span>
              </div>

              {/* Member Info */}
              <div className="flex-1">
                <h3 className="font-medium text-sm">{member.full_name}</h3>
                <div className="flex items-center space-x-1 mt-1">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{member.email}</span>
                </div>
                <div className="flex items-center space-x-1 mt-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Joined {formatDate(member.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              {/* Status Badge */}
              <Badge 
                variant={member.status === 'online' ? 'default' : 'secondary'}
                className="text-xs"
              >
                <div className={`h-2 w-2 rounded-full mr-1 ${
                  member.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                {member.status}
              </Badge>

              {/* Actions Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(member)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Member
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove Member
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <User className="h-3 w-3" />
                <span>Role: {member.role}</span>
              </div>
              {member.last_active && (
                <span>Last active: {member.last_active}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{member.full_name}</strong> from your team? 
              This action cannot be undone and they will lose access to all team resources.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? 'Removing...' : 'Remove Member'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};