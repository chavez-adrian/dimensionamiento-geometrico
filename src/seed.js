require('dotenv').config();
const { Pool } = require('pg');
const { GEOMETRIC_CONTROLS: CONTROLS, USER_ID } = require('./domain');

const LEVELS = [1, 2, 3];

async function seed() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
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
    for (const control of CONTROLS) {
      for (const nivel of LEVELS) {
        const unlocked = nivel === 1;
        await client.query(`
          INSERT INTO knowledge_state (user_id, control, nivel, attempts, correct_streak, mastered, unlocked)
          VALUES ($1, $2, $3, 0, 0, FALSE, $4)
          ON CONFLICT (user_id, control, nivel) DO NOTHING
        `, [USER_ID, control, nivel, unlocked]);
      }
    }
    console.log('Seed complete: 17 rows inserted for user adrian');
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(err => { console.error(err); process.exit(1); });
