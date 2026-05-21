require('dotenv').config();
const { Pool } = require('pg');

const USER_ID = 'adrian';

async function migrateFundamentos() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS exercise_sessions (
        id          SERIAL PRIMARY KEY,
        user_id     TEXT,
        control     TEXT,
        nivel       INT,
        question    TEXT,
        answered_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`
      INSERT INTO knowledge_state (user_id, control, nivel, attempts, correct_streak, mastered, unlocked)
      VALUES ($1, 'Fundamentos', 1, 0, 0, FALSE, TRUE)
      ON CONFLICT (user_id, control, nivel) DO NOTHING
    `, [USER_ID]);

    await client.query(`
      INSERT INTO knowledge_state (user_id, control, nivel, attempts, correct_streak, mastered, unlocked)
      VALUES ($1, 'Fundamentos', 2, 0, 0, FALSE, FALSE)
      ON CONFLICT (user_id, control, nivel) DO NOTHING
    `, [USER_ID]);

    console.log('Migration complete: Fundamentos L1+L2 inserted, exercise_sessions table created');
  } finally {
    client.release();
    await pool.end();
  }
}

migrateFundamentos().catch(err => { console.error(err); process.exit(1); });
