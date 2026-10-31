const { DatabaseSync, backup } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');
const source = path.resolve(process.env.SLIME_DB_PATH || path.join(__dirname, '..', 'data', 'accounts.sqlite'));
const destination = process.argv[2] && path.resolve(process.argv[2]);
if (!destination || destination === source) {
  console.error('Usage: node tools/backup-accounts.js /path/to/new-backup.sqlite');
  process.exit(1);
}
if (fs.existsSync(destination)) throw new Error('Choose a new destination; existing backups are never overwritten.');
fs.mkdirSync(path.dirname(destination), { recursive: true });
const database = new DatabaseSync(source, { readOnly: true });
backup(database, destination).then(() => console.log('Account snapshot saved:', destination)).catch(error => {
  console.error('Backup failed:', error.message);
  process.exitCode = 1;
}).finally(() => database.close());
