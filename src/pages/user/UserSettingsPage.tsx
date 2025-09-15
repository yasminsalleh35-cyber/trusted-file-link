import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Settings, BarChart3, FileText, MessageSquare, Shield } from 'lucide-react';
import { AccountSecurity } from '@/components/user/AccountSecurity';

const UserSettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();

  // Profile
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Preferences
  const [theme, setTheme] = useState<'system' | 'light' | 'dark'>(() => (localStorage.getItem('app_theme') as any) || 'system');
  const [emailNotifications, setEmailNotifications] = useState<boolean>(() => localStorage.getItem('pref_email_notifications') === 'true');
  const [inAppNotifications, setInAppNotifications] = useState<boolean>(() => localStorage.getItem('pref_inapp_notifications') !== 'false');
  const [savingPrefs, setSavingPrefs] = useState(false);


  useEffect(() => {
    if (!user) return;
    setFullName(user.full_name || '');
    setEmail(user.email || '');
  }, [user]);

  const navigationItems = [
    { name: 'Dashboard', href: '/user/dashboard', icon: <BarChart3 className="h-5 w-5" /> },
    { name: 'Files', href: '/user/files', icon: <FileText className="h-5 w-5" /> },
    { name: 'Messages', href: '/user/messages', icon: <MessageSquare className="h-5 w-5" /> },
    { name: 'Settings', href: '/user/settings', icon: <Settings className="h-5 w-5" /> },
  ];

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    if (theme === 'dark') root.classList.add('dark');
    if (theme === 'light') root.classList.add('light');
  }, [theme]);

  const saveProfile = async () => {
    if (!user) return;
    try {
      setSavingProfile(true);
      const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id);
      if (error) throw error;
      toast({ title: 'Profile Updated', description: 'Your profile information has been saved.' });
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to save profile', variant: 'destructive' });
    } finally {
      setSavingProfile(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSavingPrefs(true);
      localStorage.setItem('app_theme', theme);
      localStorage.setItem('pref_email_notifications', String(emailNotifications));
      localStorage.setItem('pref_inapp_notifications', String(inAppNotifications));
      toast({ title: 'Preferences Saved', description: 'Your preferences have been updated.' });
    } finally {
      setSavingPrefs(false);
    }
  };

  return (
    <DashboardLayout userRole={user?.role || 'user'} userEmail={user?.email || ''} onLogout={logout} navigation={navigationItems}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-mining-header">Settings</h1>
            <p className="text-muted-foreground font-mining-body">Manage your account and preferences</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="font-mining-body">Profile</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input id="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={email} disabled />
              </div>
              <Button onClick={saveProfile} disabled={savingProfile}>
                {savingProfile ? 'Saving...' : 'Save Profile'}
              </Button>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="font-mining-body">Preferences</CardTitle>
              <CardDescription>Theme and notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select value={theme} onValueChange={(v: any) => setTheme(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Email Notifications</Label>
                  <p className="text-xs text-muted-foreground">Receive email updates for important events</p>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>In‑app Notifications</Label>
                  <p className="text-xs text-muted-foreground">Show alerts inside the app</p>
                </div>
                <Switch checked={inAppNotifications} onCheckedChange={setInAppNotifications} />
              </div>
              <Button onClick={savePreferences} disabled={savingPrefs}>
                {savingPrefs ? 'Saving...' : 'Save Preferences'}
              </Button>
            </CardContent>
          </Card>

          <AccountSecurity />

        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserSettingsPage;