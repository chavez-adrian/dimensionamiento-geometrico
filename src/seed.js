require('dotenv').config();
const { Pool } = require('pg');

const CONTROLS = ['Planicidad', 'Paralelismo', 'Perpendicularidad', 'Posicion', 'Cilindricidad'];
const LEVELS = [1, 2, 3];
const USER_ID = 'adrian';

async function seed() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
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
    console.log('Seed complete: 15 rows inserted for user adrian');
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(err => { console.error(err); process.exit(1); });
