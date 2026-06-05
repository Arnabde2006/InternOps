const pool = require('./src/config/db');
const fs = require('fs');
const path = require('path');
(async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const dir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
    for (const file of files) {
      const sql = fs.readFileSync(path.join(dir, file), 'utf8');
      await client.query({ text: sql, timeout: 30000 });
      console.log(`Migrated: ${file}`);
    }
    await client.query('COMMIT');
    console.log('ALL_MIGRATIONS_OK');
    process.exit(0);
  } catch(e) {
    await client.query('ROLLBACK');
    console.error('Migration FAILED:', e.message);
    process.exit(1);
  } finally {
    client.release();
  }
})();
