import { MigrationCli } from '../lib/migrations/cli';
import { validateConfig } from '../lib/config';

// Validate configuration
validateConfig();

// Create a new migration CLI
const cli = new MigrationCli();

// Run the CLI
cli.run().catch((error) => {
  console.error('Error running migrations:', error);
  process.exit(1);
});
