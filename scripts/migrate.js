// This is a JavaScript version of the migrate.ts script
// for compatibility with ts-node

// Use require instead of import
const { MigrationCli } = require('../lib/migrations/cli');
const { validateConfig } = require('../lib/config');

// Validate configuration
validateConfig();

// Create a new migration CLI
const cli = new MigrationCli();

// Run the CLI
cli.run().catch((error) => {
  console.error('Error running migrations:', error);
  process.exit(1);
});
