import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { BarChart3, FileText, MessageSquare, Settings, Building2, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const ClientProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const [companyName, setCompanyName] = useState<string>('');
  const [joinedAt, setJoinedAt] = useState<string>('');

  useEffect(() => {
    (async () => {
      if (user?.client_id) {
        const { data } = await supabase.from('clients').select('company_name').eq('id', user.client_id).single();
        if (data?.company_name) setCompanyName(data.company_name);
      }
      if (user?.id) {
        const { data: p } = await supabase.from('profiles').select('created_at').eq('id', user.id).single();
        if (p?.created_at) setJoinedAt(new Date(p.created_at).toLocaleString());
      }
    })();
  }, [user?.id, user?.client_id]);

  const navigationItems = [
    { name: 'Dashboard', href: '/client/dashboard', icon: <BarChart3 className="h-5 w-5" /> },
    { name: 'Files', href: '/admin/files', icon: <FileText className="h-5 w-5" /> },
    { name: 'Messages', href: '/client/messages', icon: <MessageSquare className="h-5 w-5" /> },
    { name: 'Site Settings', href: '/client/settings', icon: <Settings className="h-5 w-5" /> },
  ];

  return (
    <DashboardLayout userRole={user?.role || 'client'} userEmail={user?.email || ''} onLogout={logout} navigation={navigationItems}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-mining-header">Profile</h1>
            <p className="text-muted-foreground font-mining-body">Client account overview</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-mining-body flex items-center gap-2"><User className="h-5 w-5"/> {user?.full_name}</CardTitle>
            <CardDescription>Account and company details</CardDescription>
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
              <Label className="text-xs text-muted-foreground">Company</Label>
              <div>{companyName || '-'}</div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Joined</Label>
              <div>{joinedAt || '-'}</div>
            </div>
            <div className="flex items-end">
              <Button variant="outline" asChild>
                <a href="/client/settings">Edit Profile</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ClientProfilePage;