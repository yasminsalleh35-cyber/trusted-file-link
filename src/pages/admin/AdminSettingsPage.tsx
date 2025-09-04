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
import { Settings, BarChart3, Building2, Users, FileText, MessageSquare, Shield } from 'lucide-react';
import { JWTAuthService } from '@/services/jwtAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { validatePassword } from '@/utils/validation';

const AdminSettingsPage: React.FC = () => {
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

  // Security
  const [busySecurity, setBusySecurity] = useState(false);

  // Account security (inline)
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFullName(user.full_name || '');
    setEmail(user.email || '');
  }, [user]);

  const navigationItems = [
    { name: 'Admin Dashboard', href: '/admin/dashboard', icon: <BarChart3 className="h-5 w-5" /> },
    { name: 'Manage Clients', href: '/admin/clients', icon: <Building2 className="h-5 w-5" /> },
    { name: 'Manage Users', href: '/admin/users', icon: <Users className="h-5 w-5" /> },
    { name: 'File Management', href: '/admin/files', icon: <FileText className="h-5 w-5" /> },
    { name: 'Message', href: '/admin/messages', icon: <MessageSquare className="h-5 w-5" /> },
    { name: 'Settings', href: '/admin/settings', icon: <Settings className="h-5 w-5" /> },
  ];

  // Apply theme immediately
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
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);
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

  const sendPasswordReset = async () => {
    if (!email) return;
    try {
      setBusySecurity(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/login'
      });
      if (error) throw error;
      toast({ title: 'Reset Email Sent', description: 'Check your inbox to reset your password.' });
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to send reset email', variant: 'destructive' });
    } finally {
      setBusySecurity(false);
    }
  };

  const signOutEverywhere = async () => {
    try {
      setBusySecurity(true);
      await JWTAuthService.signOut();
      await logout();
    } catch (e) {
      toast({ title: 'Sign out warning', description: 'Some sessions may still be active.' });
    } finally {
      setBusySecurity(false);
    }
  };

  return (
    <DashboardLayout userRole={user?.role || 'admin'} userEmail={user?.email || ''} onLogout={logout} navigation={navigationItems}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-mining-header">Settings</h1>
            <p className="text-muted-foreground font-mining-body">Manage your administrator account and app preferences</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
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

          {/* Security */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="font-mining-body">Security</CardTitle>
              <CardDescription>Manage access and sessions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button variant="outline" onClick={sendPasswordReset} disabled={busySecurity}>
                  <Shield className="h-4 w-4 mr-2" /> Send password reset email
                </Button>
                <Button variant="destructive" onClick={signOutEverywhere} disabled={busySecurity}>
                  Sign out everywhere
                </Button>
              </div>

              {/* Inline Account Security */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Strong password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Must include uppercase, lowercase, number, and special character</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <div>
                  <Button
                    onClick={async () => {
                      try {
                        if (!user) throw new Error('Not authenticated');
                        if (!newPassword || !confirmPassword) throw new Error('Please fill in both password fields');
                        if (newPassword !== confirmPassword) throw new Error('Passwords do not match');
                        const ok = /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) && /\d/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword) && newPassword.length >= 8;
                        if (!ok) throw new Error('Password does not meet complexity requirements');
                        setChangingPassword(true);
                        const { error } = await supabase.auth.updateUser({ password: newPassword });
                        if (error) throw error;
                        setNewPassword('');
                        setConfirmPassword('');
                        toast({ title: 'Password changed', description: 'Your password has been updated.' });
                      } catch (e) {
                        toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to change password', variant: 'destructive' });
                      } finally {
                        setChangingPassword(false);
                      }
                    }}
                    disabled={changingPassword}
                  >
                    {changingPassword ? 'Changing...' : 'Change password'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminSettingsPage;