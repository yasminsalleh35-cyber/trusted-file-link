import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { BarChart3, Building2, Users, FileText, MessageSquare, Settings, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const AdminProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const [joinedAt, setJoinedAt] = useState<string>('');

  useEffect(() => {
    (async () => {
      if (!user?.id) return;
      const { data } = await supabase.from('profiles').select('created_at, updated_at').eq('id', user.id).single();
      if (data?.created_at) setJoinedAt(new Date(data.created_at).toLocaleString());
    })();
  }, [user?.id]);

  const navigationItems = [
    { name: 'Admin Dashboard', href: '/admin/dashboard', icon: <BarChart3 className="h-5 w-5" /> },
    { name: 'Manage Clients', href: '/admin/clients', icon: <Building2 className="h-5 w-5" /> },
    { name: 'Manage Users', href: '/admin/users', icon: <Users className="h-5 w-5" /> },
    { name: 'File Management', href: '/admin/files', icon: <FileText className="h-5 w-5" /> },
    { name: 'Message', href: '/admin/messages', icon: <MessageSquare className="h-5 w-5" /> },
    { name: 'Settings', href: '/admin/settings', icon: <Settings className="h-5 w-5" /> },
  ];

  return (
    <DashboardLayout userRole={user?.role || 'admin'} userEmail={user?.email || ''} onLogout={logout} navigation={navigationItems}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-mining-header">Profile</h1>
            <p className="text-muted-foreground font-mining-body">Administrator account overview</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-mining-body flex items-center gap-2"><User className="h-5 w-5"/> {user?.full_name}</CardTitle>
            <CardDescription>Account details</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <div className="font-mono">{user?.email}</div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Role</Label>
              <div className="capitalize">{user?.role}</div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Joined</Label>
              <div>{joinedAt || '-'}</div>
            </div>
            <div className="flex items-end">
              <Button variant="outline" asChild>
                <a href="/admin/settings">Edit Profile</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminProfilePage;