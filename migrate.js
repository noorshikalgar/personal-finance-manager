// migrate.js
const { execSync } = require('child_process');

try {
  console.log('Running migrations...');
  // We use the prisma binary that was already used during the build
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  console.log('Migrations completed successfully.');
} catch (error) {
  console.error('Migration failed:', error);
  process.exit(1);
}