'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToastContext } from '@/contexts/ToastContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { AppLayout } from '@/components/layouts/AppLayout';
import { ServiceFactory } from '@/services/service-factory';
import { User } from '@/services/user-service';
import { CreateUserForm } from '@/components/users/CreateUserForm';
import { EditUserModal } from '@/components/users/EditUserModal';
import { useAuth } from '@/contexts/AuthContext';
import { PERMISSIONS } from '@/types/user';
import { Search, X } from 'lucide-react';

export default function UsersPage() {
  const { showSuccessToast, showErrorToast } = useToastContext();
  const { user, isLoading: authLoading, hasPermission } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Check if user has permission to access this page
  useEffect(() => {
    if (!authLoading) {
      const canReadUsers = !!user && hasPermission(PERMISSIONS.USER_READ);
      setIsAuthorized(canReadUsers);

      if (!canReadUsers && user) {
        // User is logged in but not authorized
        router.push('/dashboard');
      } else if (!user) {
        // User is not logged in
        router.push('/');
      }
    }
  }, [user, authLoading, hasPermission, router]);

  // Function to fetch users
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const userService = ServiceFactory.getUserService();
      const response = await userService.getUsers({
        limit: 50,
        sort_by: 'role',
        sort_order: 'desc',
        search: searchTerm || undefined
      });

      if (response.success && response.data) {
        setUsers(response.data);

        // Don't show toast on user refresh to avoid duplicate notifications
        // when a user is added successfully
      } else {
        setError(response.error || 'Failed to fetch users');
        showErrorToast({
          title: 'Error',
          description: response.error || 'Failed to fetch users'
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      showErrorToast({
        title: 'Error',
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
      setInitialLoadComplete(true);
    }
  };

  // Function to update user status
  const updateUserStatus = async (userId: string, isActive: boolean) => {
    try {
      setIsLoading(true);

      const userService = ServiceFactory.getUserService();
      const response = await userService.updateUserStatus(userId, isActive);

      if (response.success && response.data) {
        // Refresh the users list
        fetchUsers();
        showSuccessToast({
          title: 'User Updated',
          description: `User has been ${isActive ? 'activated' : 'deactivated'} successfully.`
        });
      } else {
        showErrorToast({
          title: 'Error',
          description: response.error || 'Failed to update user status'
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      showErrorToast({
        title: 'Error',
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    fetchUsers();
  };

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Initial fetch
  useEffect(() => {
    fetchUsers();
  }, []);

  // Show loading state while checking authorization
  if (authLoading || isAuthorized === null) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="container mx-auto">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Show unauthorized message if user doesn't have permission
  if (!isAuthorized) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="container mx-auto">
            <Alert variant="destructive">
              <AlertDescription>
                You do not have permission to access this page.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6">
        <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mt-0 mt-2 pl-0">
          <div>
            <h1 className="text-3xl font-bold mb-2 md:mb-0">User Management</h1>
            <p className="text-muted-foreground">Manage user accounts and permissions</p>
          </div>
          {hasPermission(PERMISSIONS.USER_CREATE) && (
            <Button onClick={() => setShowAddUserForm(!showAddUserForm)}>
              {showAddUserForm ? 'Cancel' : 'Add New User'}
            </Button>
          )}
        </div>

        {/* Add User Form */}
        {showAddUserForm && hasPermission(PERMISSIONS.USER_CREATE) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Add New User</CardTitle>
            </CardHeader>
            <CardContent>
              <CreateUserForm onSuccess={() => {
                setShowAddUserForm(false);
                fetchUsers();
              }} />
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="bg-red-50 border-red-200 mb-4">
            <CardContent className="pt-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : users.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">No users found.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle>Users</CardTitle>
                <div className="relative w-full max-w-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="pl-10 pr-10"
                  />
                  {searchTerm && (
                    <button
                      onClick={clearSearch}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.first_name} {user.last_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={user.is_active ? 'default' : 'secondary'}
                          className={user.is_active ? 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300'}
                        >
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {hasPermission(PERMISSIONS.USER_UPDATE) && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="mr-2"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowEditModal(true);
                            }}
                          >
                            Edit
                          </Button>
                        )}
                        {hasPermission(PERMISSIONS.USER_UPDATE) && (
                          <Button
                            variant="outline"
                            size="sm"
                            className={user.is_active ? 'text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600' : 'text-green-500 border-green-200 hover:bg-green-50 hover:text-green-600'}
                            onClick={() => updateUserStatus(user.id, !user.is_active)}
                          >
                            {user.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
        </div>

        {/* Edit User Modal */}
        <EditUserModal
          user={selectedUser}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            fetchUsers();
          }}
        />
      </div>
    </AppLayout>
  );
}
