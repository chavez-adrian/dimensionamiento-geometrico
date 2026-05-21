require('dotenv').config();
const { Pool } = require('pg');

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const r1 = await client.query(
      "UPDATE knowledge_state SET control = 'Planicidad' WHERE control = 'Planitud'"
    );
    const r2 = await client.query(
      "UPDATE exercise_bank SET control = 'Planicidad' WHERE control = 'Planitud'"
    );
    await client.query('COMMIT');
    console.log(`knowledge_state: ${r1.rowCount} rows updated`);
    console.log(`exercise_bank: ${r2.rowCount} rows updated`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
