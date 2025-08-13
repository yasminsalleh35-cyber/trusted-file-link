import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  Send, 
  Users, 
  Building2, 
  User, 
  Megaphone,
  X,
  Plus,
  Search,
  Shield
} from 'lucide-react';
import type { AssignmentTarget } from '@/hooks/useNews';

/**
 * CreateNewsModal Component
 * 
 * Purpose: Modal for creating and assigning company news/announcements
 * Features:
 * - News creation form with title and content
 * - Assignment target selection (users, clients, broadcast)
 * - Mining-themed UI with role-based styling
 * - Real-time target search and filtering
 * - Batch assignment capabilities
 */

interface CreateNewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    newsData: { title: string; content: string },
    targets: AssignmentTarget[]
  ) => Promise<{ success: boolean; error?: string }>;
  availableTargets: AssignmentTarget[];
  isLoading?: boolean;
}

export const CreateNewsModal: React.FC<CreateNewsModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  availableTargets,
  isLoading = false
}) => {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedTargets, setSelectedTargets] = useState<AssignmentTarget[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter targets based on search
  const filteredTargets = availableTargets.filter(target =>
    target.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (target.role && target.role.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle target selection
  const handleTargetToggle = (target: AssignmentTarget) => {
    setSelectedTargets(prev => {
      const isSelected = prev.some(t => 
        t.type === target.type && t.id === target.id && t.name === target.name
      );
      
      if (isSelected) {
        return prev.filter(t => 
          !(t.type === target.type && t.id === target.id && t.name === target.name)
        );
      } else {
        // If selecting broadcast, clear other selections
        if (target.type === 'broadcast') {
          return [target];
        }
        // If selecting others while broadcast is selected, remove broadcast
        const withoutBroadcast = prev.filter(t => t.type !== 'broadcast');
        return [...withoutBroadcast, target];
      }
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please provide both title and content for the announcement.',
        variant: 'destructive'
      });
      return;
    }

    if (selectedTargets.length === 0) {
      toast({
        title: 'Assignment Required',
        description: 'Please select at least one assignment target.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await onSubmit(
        { title: title.trim(), content: content.trim() },
        selectedTargets
      );

      if (result.success) {
        toast({
          title: 'News Created Successfully',
          description: `Your announcement has been created and assigned to ${selectedTargets.length} target${selectedTargets.length > 1 ? 's' : ''}.`,
        });
        handleClose();
      } else {
        throw new Error(result.error || 'Failed to create news');
      }
    } catch (error) {
      toast({
        title: 'Error Creating News',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    setTitle('');
    setContent('');
    setSelectedTargets([]);
    setSearchTerm('');
    onClose();
  };

  // Get icon for target type
  const getTargetIcon = (target: AssignmentTarget) => {
    switch (target.type) {
      case 'broadcast':
        return <Megaphone className="h-4 w-4 text-mining-primary" />;
      case 'client':
        return <Building2 className="h-4 w-4 text-client" />;
      case 'user':
        return <User className="h-4 w-4 text-user" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'bg-admin/20 text-admin';
      case 'client':
        return 'bg-client/20 text-client';
      case 'user':
        return 'bg-user/20 text-user';
      case 'all':
        return 'bg-mining-primary/20 text-mining-primary';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b border-mining-secondary/20">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-mining-header text-mining-primary">
                Create Company Announcement
              </DialogTitle>
              <DialogDescription className="text-base mt-1">
                Create and distribute official mining operations communications
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 h-[70vh]">
            {/* Left Column - News Content */}
            <div className="p-6 space-y-4 border-r border-mining-secondary/20">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">
                  Announcement Title *
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., New Safety Protocols for Site Operations"
                  className="font-mining-body"
                  required
                />
              </div>

              <div className="space-y-2 flex-1">
                <Label htmlFor="content" className="text-sm font-medium">
                  Content *
                </Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter the full announcement content here. Include all relevant details, instructions, and any action items for recipients."
                  className="min-h-[300px] font-mining-body resize-none"
                  required
                />
              </div>

              <div className="text-xs text-muted-foreground">
                * Required fields
              </div>
            </div>

            {/* Right Column - Assignment Targets */}
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Assignment Targets * ({selectedTargets.length} selected)
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search targets..."
                    className="pl-10 font-mining-body"
                  />
                </div>
              </div>

              {/* Selected Targets */}
              {selectedTargets.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-mining-primary">
                    Selected Targets:
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedTargets.map((target, index) => (
                      <div
                        key={`${target.type}-${target.id}-${index}`}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-mining-primary/20 text-mining-primary"
                      >
                        {getTargetIcon(target)}
                        <span>{target.name}</span>
                        <button
                          type="button"
                          onClick={() => handleTargetToggle(target)}
                          className="ml-1 hover:text-destructive transition-colors"
                          aria-label={`Remove ${target.name}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Available Targets */}
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {filteredTargets.map((target, index) => {
                    const isSelected = selectedTargets.some(t => 
                      t.type === target.type && t.id === target.id && t.name === target.name
                    );

                    return (
                      <div
                        key={`${target.type}-${target.id}-${index}`}
                        className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-mining-primary/10 border-mining-primary/30' 
                            : 'hover:bg-muted/50 border-muted'
                        }`}
                        onClick={() => handleTargetToggle(target)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleTargetToggle(target)}
                        />
                        
                        <div className="flex items-center space-x-2 flex-1">
                          {getTargetIcon(target)}
                          <div className="flex-1">
                            <div className="text-sm font-medium">{target.name}</div>
                            {target.role && (
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${getRoleBadgeColor(target.role)}`}
                              >
                                {target.role === 'all' ? 'Everyone' : target.role}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 pt-4 border-t border-mining-secondary/20">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {selectedTargets.length > 0 && (
                  <span>
                    Ready to distribute to {selectedTargets.length} target{selectedTargets.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                
                <Button
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className="bg-mining-primary hover:bg-mining-primary/90"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Create & Distribute
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};