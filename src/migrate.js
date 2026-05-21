require('dotenv').config();
const { Pool } = require('pg');

async function migrate() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS knowledge_state (
        user_id        TEXT,
        control        TEXT,
        nivel          INT,
        attempts       INT DEFAULT 0,
        correct_streak INT DEFAULT 0,
        mastered       BOOLEAN DEFAULT FALSE,
        unlocked       BOOLEAN DEFAULT FALSE,
        updated_at     TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (user_id, control, nivel)
      )
    `);

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
      CREATE TABLE IF NOT EXISTS exercise_bank (
        id           SERIAL PRIMARY KEY,
        control      TEXT,
        nivel        INT,
        type         TEXT,
        anchor       TEXT,
        content      JSONB,
        source       TEXT,
        validated_by TEXT,
        active       BOOLEAN DEFAULT TRUE,
        created_at   TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    console.log('Migration complete');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(err => { console.error(err); process.exit(1); });
