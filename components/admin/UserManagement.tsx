'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import { UserRole } from '@/types/user';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  department: string | null;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
}

interface CreateUserFormData {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: UserRole;
  department: string;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [formData, setFormData] = useState<CreateUserFormData>({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    role: 'user',
    department: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Load users
  useEffect(() => {
    async function loadUsers() {
      try {
        setLoading(true);
        setError(null);

        console.log('Fetching users from API...');

        // Use the API endpoint instead of direct Supabase call
        const response = await fetch('/api/admin/users');
        const data = await response.json();

        console.log('API response:', data);

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch users');
        }

        if (!data.users || data.users.length === 0) {
          console.log('No users found in the database');
        } else {
          console.log(`Found ${data.users.length} users`);
        }

        setUsers(data.users || []);
      } catch (err) {
        console.error('Error loading users:', err);
        setError('Failed to load users. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, []);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle role selection
  const handleRoleChange = (value: string) => {
    setFormData(prev => ({ ...prev, role: value as UserRole }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setFormLoading(true);
      setFormError(null);

      // Validate form data
      if (!formData.email || !formData.firstName || !formData.lastName || !formData.password) {
        setFormError('All required fields must be filled');
        return;
      }

      // Create user using the API endpoint
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          password: formData.password,
          role: formData.role,
          department: formData.department || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      // Reload users from API
      const usersResponse = await fetch('/api/admin/users');
      const usersData = await usersResponse.json();

      if (!usersResponse.ok) {
        throw new Error(usersData.error || 'Failed to reload users');
      }

      setUsers(usersData.users || []);

      // Reset form and close dialog
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        password: '',
        role: 'user',
        department: '',
      });

      setCreateUserOpen(false);
    } catch (err: any) {
      console.error('Error creating user:', err);
      setFormError(err.message || 'Failed to create user. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle role update
  const handleRoleUpdate = async (userId: string, newRole: UserRole) => {
    try {
      setLoading(true);

      // Use the new API endpoint instead of the dynamic route
      const response = await fetch('/api/admin/users/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, role: newRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user role');
      }

      // Update local state
      setUsers(prev =>
        prev.map(user =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
    } catch (err) {
      console.error('Error updating user role:', err);
      setError('Failed to update user role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle user activation/deactivation
  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      setLoading(true);

      // Use the new API endpoint instead of the dynamic route
      const response = await fetch('/api/admin/users/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, is_active: !isActive }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user status');
      }

      // Update local state
      setUsers(prev =>
        prev.map(user =>
          user.id === userId ? { ...user, is_active: !isActive } : user
        )
      );
    } catch (err) {
      console.error('Error toggling user active status:', err);
      setError('Failed to update user status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Users ({users.length})</h2>

        <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
          <DialogTrigger asChild>
            <Button>Create User</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              {formError && (
                <Alert variant="destructive">
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={handleRoleChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                />
              </div>

              <Button type="submit" className="w-full" disabled={formLoading}>
                {formLoading ? <Spinner size="sm" className="mr-2" /> : null}
                Create User
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Users</TabsTrigger>
          <TabsTrigger value="admin">Admins</TabsTrigger>
          <TabsTrigger value="manager">Managers</TabsTrigger>
          <TabsTrigger value="user">Users</TabsTrigger>
        </TabsList>

        {['all', 'admin', 'manager', 'user'].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users
                  .filter(user => tab === 'all' || user.role === tab)
                  .map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        {user.first_name} {user.last_name}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`
                              ${user.role === 'admin' ? 'bg-red-50 text-red-700 hover:bg-red-50 dark:bg-red-950 dark:text-red-400' : ''}
                              ${user.role === 'manager' ? 'bg-blue-50 text-blue-700 hover:bg-blue-50 dark:bg-blue-950 dark:text-blue-400' : ''}
                              ${user.role === 'user' ? 'bg-gray-50 text-gray-700 hover:bg-gray-50 dark:bg-gray-950 dark:text-gray-400' : ''}
                            `}
                          >
                            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </Badge>
                          <Select
                            value={user.role}
                            onValueChange={(value) => handleRoleUpdate(user.id, value as UserRole)}
                          >
                            <SelectTrigger className="w-[110px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="user">User</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                      <TableCell>{user.department || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? 'default' : 'destructive'}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(user.id, user.is_active)}
                        >
                          {user.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>

            {users.filter(user => tab === 'all' || user.role === tab).length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                No users found.
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
