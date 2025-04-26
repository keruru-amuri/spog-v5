'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { SideNav } from '@/components/navigation/SideNav';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle, RefreshCw, Database, BarChart, LineChart, PieChart, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRange } from 'react-day-picker';
import { InventoryStatusReport } from './components/InventoryStatusReport';
import { ConsumptionReport } from './components/ConsumptionReport';
import { ReportFilters } from './components/ReportFilters';
import { checkRequiredTables, getTableRowCounts } from './utils/db-check';
import { InventoryTurnoverChart } from './components/charts/InventoryTurnoverChart';
import { ReorderForecastChart } from './components/charts/ReorderForecastChart';
import { ConsumptionByDepartmentChart } from './components/charts/ConsumptionByDepartmentChart';
import { validateDatabaseSchema } from './utils/schema-validator';

export default function ReportsV1Page() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<{ category?: string; locationId?: string; dateRange?: DateRange }>({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('inventory');
  const [tableStatus, setTableStatus] = useState<Record<string, boolean>>({});
  const [rowCounts, setRowCounts] = useState<Record<string, number>>({});

  // Schema validation state
  const [schemaValidation, setSchemaValidation] = useState<{
    valid: boolean;
    tables: Record<string, any>;
  }>({ valid: false, tables: {} });

  // Check Supabase connection
  const checkConnection = async () => {
    try {
      setConnectionStatus('checking');
      setError(null);
      setIsLoading(true);

      // First, check if Supabase URL and key are available
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error('Supabase configuration is missing. Please check your environment variables.');
      }

      // Log the URL (without the key for security)
      console.log('Using Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);

      // Check if we can access the Supabase auth API
      console.log('Checking Supabase auth API...');
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Supabase auth error:', sessionError);
          throw sessionError;
        }

        console.log('Supabase auth check successful');
      } catch (authErr) {
        console.error('Error checking Supabase auth:', authErr);
        throw new Error('Could not connect to Supabase authentication service');
      }

      // Try a simple health check query
      console.log('Attempting to connect to Supabase database...');
      try {
        // Use a direct table query instead of RPC
        const { data: healthData, error: healthError } = await supabase
          .from('inventory_items')
          .select('id')
          .limit(1);

        if (healthError) {
          console.error('Supabase query error:', healthError);
          // Try another table if the first one fails
          const { data: altData, error: altError } = await supabase
            .from('locations')
            .select('id')
            .limit(1);

          if (altError) {
            console.error('Alternative query error:', altError);
            // One more try with users table
            const { data: usersData, error: usersError } = await supabase
              .from('users')
              .select('id')
              .limit(1);

            if (usersError) {
              console.error('Users query error:', usersError);
              throw usersError;
            }
          }
        }

        console.log('Database connection successful');
      } catch (dbErr) {
        console.error('Database connection error:', dbErr);
        // Continue with table checks even if this fails
      }

      // Check required tables
      console.log('Checking required tables...');
      try {
        const tablesResult = await checkRequiredTables();
        console.log('Table check result:', tablesResult);

        if (tablesResult.success) {
          setTableStatus(tablesResult.tableStatus);

          // Get row counts
          const countsResult = await getTableRowCounts();
          console.log('Row counts result:', countsResult);

          if (countsResult.success) {
            setRowCounts(countsResult.counts);
          }

          // Validate database schema
          const schemaResult = await validateDatabaseSchema();
          console.log('Schema validation result:', schemaResult);
          setSchemaValidation(schemaResult);
        } else if (tablesResult.error) {
          console.warn('Table check warning:', tablesResult.error);
        }
      } catch (tableErr) {
        console.error('Error checking tables:', tableErr);
        // Continue even if table checks fail
      }

      setConnectionStatus('connected');
      toast({
        title: 'Database Connected',
        description: 'Successfully connected to the Supabase database',
        duration: 3000,
      });
    } catch (err) {
      console.error('Database connection error:', err);
      setConnectionStatus('disconnected');

      // Provide more detailed error information
      let errorMessage = 'Failed to connect to the database';

      if (err instanceof Error) {
        errorMessage = `${errorMessage}: ${err.message}`;
        console.error('Error details:', err.stack);
      } else {
        errorMessage = `${errorMessage}: ${JSON.stringify(err)}`;
      }

      setError(errorMessage);

      toast({
        title: 'Connection Failed',
        description: 'Could not connect to the Supabase database. See error details below.',
        variant: 'destructive',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Check connection on page load
  useEffect(() => {
    checkConnection();
  }, []);

  // Handle filter changes
  const handleFilterChange = (newFilters: { category?: string; locationId?: string; dateRange?: DateRange }) => {
    console.log('Filter changed:', newFilters);
    setFilters(newFilters);
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <ProtectedRoute requiredRoles={['admin', 'manager']}>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <SideNav />
        {/* Mobile header bar */}
        <div className="h-16 bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center md:hidden">
          <h1 className="text-xl font-bold pl-12">MABES SPOG Inventory</h1>
        </div>

        <div className="md:pl-64 transition-all duration-200">
        <div className="p-6 pt-4">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mt-0 mt-2 pl-0">
              <h1 className="text-3xl font-bold mb-4 md:mb-0">Inventory Reports</h1>
              {/* Refresh Connection button - Hidden but kept for future reference */}
              <Button
                variant="outline"
                onClick={checkConnection}
                disabled={isLoading || connectionStatus === 'checking'}
                className="hidden"
              >
                {(isLoading || connectionStatus === 'checking') ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh Connection
              </Button>
            </div>

            {/* Connection Status - Hidden but kept for future reference */}
            <Card className="mb-6 hidden">
              <CardHeader className="pb-2">
                <CardTitle>Database Connection Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  {connectionStatus === 'connected' ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      <span>Connected to Supabase database</span>
                    </>
                  ) : connectionStatus === 'disconnected' ? (
                    <>
                      <XCircle className="h-5 w-5 text-red-500 mr-2" />
                      <span>Disconnected from Supabase database</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-5 w-5 animate-spin mr-2" />
                      <span>Checking connection...</span>
                    </>
                  )}
                </div>

                {/* Table Status */}
                {connectionStatus === 'connected' && Object.keys(tableStatus).length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-2">Required Tables:</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(tableStatus).map(([table, exists]) => (
                        <div key={table} className="flex items-center">
                          {exists ? (
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500 mr-2" />
                          )}
                          <span className="text-sm">{table}</span>
                          {exists && rowCounts[table] !== undefined && (
                            <span className="text-xs text-muted-foreground ml-2">
                              ({rowCounts[table]} rows)
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Schema Validation */}
                {connectionStatus === 'connected' && Object.keys(schemaValidation.tables).length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium mb-2">Schema Validation:</h3>
                    <div className="text-sm mb-2">
                      {schemaValidation.valid ? (
                        <div className="flex items-center text-green-500">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          <span>All tables have the required columns</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-amber-500">
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          <span>Some tables are missing required columns</span>
                        </div>
                      )}
                    </div>

                    {!schemaValidation.valid && (
                      <div className="text-xs text-muted-foreground space-y-2">
                        {Object.entries(schemaValidation.tables)
                          .filter(([_, tableInfo]) => tableInfo.missingColumns.length > 0)
                          .map(([table, tableInfo]) => (
                            <div key={table} className="ml-6">
                              <span className="font-medium">{table}</span> is missing columns:
                              <span className="text-amber-500">
                                {tableInfo.missingColumns.join(', ')}
                              </span>
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>
                )}

                {/* Connection Error */}
                {error && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertTitle>Connection Error</AlertTitle>
                    <AlertDescription className="space-y-2">
                      <p>{error}</p>
                      <p className="text-sm">
                        This could be due to:
                      </p>
                      <ul className="text-sm list-disc pl-5 space-y-1">
                        <li>Missing or incorrect environment variables</li>
                        <li>Database tables not yet created</li>
                        <li>Network connectivity issues</li>
                        <li>Supabase service being temporarily unavailable</li>
                      </ul>
                      <p className="text-sm mt-2">
                        Please check your Supabase configuration and try again.
                      </p>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Report Content */}
            {connectionStatus === 'connected' && (
              <>
                {/* Report Filters */}
                <ReportFilters
                  onFilterChange={handleFilterChange}
                  onRefresh={handleRefresh}
                  isLoading={isLoading}
                  activeTab={activeTab}
                />

                {/* Report Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="inventory">
                      <BarChart className="h-4 w-4 mr-2" />
                      Inventory Status
                    </TabsTrigger>
                    <TabsTrigger value="consumption">
                      <LineChart className="h-4 w-4 mr-2" />
                      Consumption
                    </TabsTrigger>
                    <TabsTrigger value="analysis">
                      <PieChart className="h-4 w-4 mr-2" />
                      Analysis
                    </TabsTrigger>
                    <TabsTrigger value="forecast">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Forecast
                    </TabsTrigger>
                  </TabsList>

                  {/* Inventory Status Tab */}
                  <TabsContent value="inventory" className="space-y-4">
                    <InventoryStatusReport
                      key={`inventory-${refreshTrigger}`} // Force refresh when triggered
                      category={filters.category}
                      locationId={filters.locationId}
                    />
                  </TabsContent>

                  {/* Consumption Tab */}
                  <TabsContent value="consumption" className="space-y-4">
                    <ConsumptionReport
                      key={`consumption-${refreshTrigger}`} // Force refresh when triggered
                      startDate={filters.dateRange?.from}
                      endDate={filters.dateRange?.to}
                      locationId={filters.locationId}
                    />
                  </TabsContent>

                  {/* Analysis Tab */}
                  <TabsContent value="analysis" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InventoryTurnoverChart
                        key={`turnover-${refreshTrigger}`}
                        category={filters.category}
                        locationId={filters.locationId}
                      />
                      <ConsumptionByDepartmentChart
                        key={`department-${refreshTrigger}`}
                        startDate={filters.dateRange?.from}
                        endDate={filters.dateRange?.to}
                        locationId={filters.locationId}
                      />
                    </div>
                  </TabsContent>

                  {/* Forecast Tab */}
                  <TabsContent value="forecast" className="space-y-4">
                    <ReorderForecastChart
                      key={`forecast-${refreshTrigger}`}
                      category={filters.category}
                      locationId={filters.locationId}
                    />
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
