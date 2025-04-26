'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { SideNav } from '@/components/navigation/SideNav';
// We'll use the updateProfile function from AuthContext instead of importing updateUserProfile
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import { ProfileUpdateRequest } from '@/types/user';

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [department, setDepartment] = useState('');
  const [activeTab, setActiveTab] = useState('account');
  const isAdmin = user?.role === 'admin';

  // Available departments
  const departments = [
    'Engineering',
    'Operations',
    'Maintenance',
    'Administration',
    'Logistics',
    'Quality Control',
    'Safety',
    'Training'
  ];

  // Available roles
  const roles = [
    'admin',
    'manager',
    'user'
  ];

  // State for email and role
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');

  // Initialize form values when user data is available
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setDepartment(user.department || '');
      setEmail(user.email || '');
      setRole(user.role || '');
    }
  }, [user]);

  // Mock settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    stockAlerts: true,
    weeklyReports: false,
    systemUpdates: true
  });

  const [displaySettings, setDisplaySettings] = useState({
    theme: 'system'
  });

  // Initialize theme from next-themes
  useEffect(() => {
    if (theme) {
      setDisplaySettings(prev => ({
        ...prev,
        theme: theme
      }));
    }
  }, [theme]);

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleDisplayChange = (key: string, value: string) => {
    setDisplaySettings(prev => ({
      ...prev,
      [key]: value
    }));

    // If theme is changed, update it using next-themes
    if (key === 'theme') {
      setTheme(value);
    }
  };

  const handleSaveSettings = async () => {
    if (!user) return;

    setSaving(true);
    console.log('Saving settings for user:', user.id);

    try {
      // Prepare profile update data
      const profileData: ProfileUpdateRequest = {};

      // Only include fields that have changed
      if (firstName !== user.firstName) {
        profileData.firstName = firstName;
        console.log('First name changed:', firstName);
      }

      if (lastName !== user.lastName) {
        profileData.lastName = lastName;
        console.log('Last name changed:', lastName);
      }

      // Only admin can update department, email, and role
      if (isAdmin) {
        if (department !== user.department) {
          profileData.department = department;
          console.log('Department changed:', department);
        }

        if (email !== user.email) {
          profileData.email = email;
          console.log('Email changed:', email);
        }

        if (role !== user.role) {
          profileData.role = role;
          console.log('Role changed:', role);
        }
      }

      // Only update if there are changes
      if (Object.keys(profileData).length > 0) {
        console.log('Updating profile with data:', profileData);
        // Call the API to update the profile using the context function
        const updatedProfile = await updateProfile(profileData);
        console.log('Profile updated successfully:', updatedProfile);

        // Show success message with more details
        toast({
          title: 'Settings Saved',
          description: 'Your profile has been successfully updated.',
          variant: 'success',
          duration: 3000, // 3 seconds
        });

        // Update the user context if needed
        // This might be necessary if your auth context doesn't automatically refresh
        // You might need to add a refreshUser function to your auth context
      } else {
        console.log('No changes detected');
        toast({
          title: 'No Changes',
          description: 'No changes were made to your profile.',
          variant: 'info',
          duration: 3000, // 3 seconds
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update profile',
        variant: 'destructive',
        duration: 5000, // 5 seconds for errors to give more time to read
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <SideNav />

        {/* Mobile header bar */}
        <div className="h-16 bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center md:hidden">
          <h1 className="text-xl font-bold pl-12">MABES SPOG Inventory</h1>
        </div>

        <div className="md:pl-64 transition-all duration-200">
          <div className="p-6">
            <div className="container mx-auto">
              <div className="mb-6">
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground">
                  Manage your account and application preferences
                </p>
              </div>

              <Tabs defaultValue="account" className="space-y-6" onValueChange={(value) => setActiveTab(value)}>
                <TabsList>
                  <TabsTrigger value="account">Account</TabsTrigger>
                  <TabsTrigger value="display">Display</TabsTrigger>
                  {/* Hidden tabs for future implementation */}
                  {/* <TabsTrigger value="notifications">Notifications</TabsTrigger> */}
                  {/* <TabsTrigger value="security">Security</TabsTrigger> */}
                </TabsList>

                {/* Account Settings */}
                <TabsContent value="account">
                  <Card>
                    <CardHeader>
                      <CardTitle>Account Information</CardTitle>
                      <CardDescription>
                        Update your personal information and preferences
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            disabled={!user}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            disabled={!user}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        {isAdmin ? (
                          <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        ) : (
                          <>
                            <Input
                              id="email"
                              type="email"
                              value={email}
                              disabled={true}
                            />
                            <p className="text-sm text-muted-foreground">
                              Email address can only be changed by administrators.
                            </p>
                          </>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
                        {isAdmin ? (
                          <Select value={department} onValueChange={setDepartment}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent>
                              {departments.map((dept) => (
                                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            id="department"
                            value={department}
                            disabled={true}
                          />
                        )}
                        {!isAdmin && (
                          <p className="text-sm text-muted-foreground">
                            Department can only be changed by administrators.
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        {isAdmin ? (
                          <>
                            <Select value={role} onValueChange={setRole}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                {roles.map((r) => (
                                  <SelectItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <p className="text-sm text-muted-foreground">
                              As an administrator, you can change user roles. Be careful when changing roles as this affects permissions.
                            </p>
                          </>
                        ) : (
                          <>
                            <Input
                              id="role"
                              value={role}
                              disabled={true}
                            />
                            <p className="text-sm text-muted-foreground">
                              Your role determines your permissions in the system. Contact an administrator to change your role.
                            </p>
                          </>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button onClick={handleSaveSettings} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>

                {/* Notification Settings - Hidden for now */}
                {/* <TabsContent value="notifications">
                  <Card>
                    <CardHeader>
                      <CardTitle>Notification Preferences</CardTitle>
                      <CardDescription>
                        Configure how and when you receive notifications
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="email-notifications">Email Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive notifications via email
                          </p>
                        </div>
                        <Switch
                          id="email-notifications"
                          checked={notificationSettings.emailNotifications}
                          onCheckedChange={(checked) => handleNotificationChange('emailNotifications', checked)}
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="stock-alerts">Stock Alerts</Label>
                          <p className="text-sm text-muted-foreground">
                            Get notified when inventory items reach low or critical levels
                          </p>
                        </div>
                        <Switch
                          id="stock-alerts"
                          checked={notificationSettings.stockAlerts}
                          onCheckedChange={(checked) => handleNotificationChange('stockAlerts', checked)}
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="weekly-reports">Weekly Reports</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive weekly summary reports of inventory status
                          </p>
                        </div>
                        <Switch
                          id="weekly-reports"
                          checked={notificationSettings.weeklyReports}
                          onCheckedChange={(checked) => handleNotificationChange('weeklyReports', checked)}
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="system-updates">System Updates</Label>
                          <p className="text-sm text-muted-foreground">
                            Get notified about system updates and maintenance
                          </p>
                        </div>
                        <Switch
                          id="system-updates"
                          checked={notificationSettings.systemUpdates}
                          onCheckedChange={(checked) => handleNotificationChange('systemUpdates', checked)}
                        />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button onClick={handleSaveSettings} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent> */}

                {/* Display Settings */}
                <TabsContent value="display">
                  <Card>
                    <CardHeader>
                      <CardTitle>Display Settings</CardTitle>
                      <CardDescription>
                        Customize the appearance of the application
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="theme">Theme</Label>
                        <Select
                          value={displaySettings.theme}
                          onValueChange={(value) => handleDisplayChange('theme', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select theme" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="system">System Default</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                          Choose between light, dark, or system default theme
                        </p>
                      </div>

                      {/* Display density section removed as it's not implemented */}
                    </CardContent>
                    <CardFooter>
                      {activeTab === 'account' && (
                        <Button onClick={handleSaveSettings} disabled={saving}>
                          {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                </TabsContent>

                {/* Security Settings - Hidden for now */}
                {/* <TabsContent value="security">
                  <Card>
                    <CardHeader>
                      <CardTitle>Security Settings</CardTitle>
                      <CardDescription>
                        Manage your password and security preferences
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input id="current-password" type="password" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input id="new-password" type="password" />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input id="confirm-password" type="password" />
                        <p className="text-sm text-muted-foreground">
                          Password must be at least 8 characters and include a mix of letters, numbers, and symbols
                        </p>
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                          <p className="text-sm text-muted-foreground">
                            Add an extra layer of security to your account
                          </p>
                        </div>
                        <Button variant="outline">Set Up</Button>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Session Management</h3>
                        <p className="text-sm text-muted-foreground">
                          You are currently logged in on this device
                        </p>
                        <Button variant="destructive" size="sm">
                          Log Out All Other Devices
                        </Button>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button onClick={handleSaveSettings} disabled={saving}>
                        {saving ? 'Saving...' : 'Update Password'}
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent> */}
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
