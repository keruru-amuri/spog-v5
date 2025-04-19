export * from './types';
export * from './migration-manager';
export * from './migration-factory';
export * from './cli';

// Export a default instance of the migration manager
import { MigrationManager } from './migration-manager';
export default new MigrationManager();
