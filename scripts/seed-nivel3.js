require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function seedNivel3() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    const exercises = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../data/exercise-bank-nivel3.json'), 'utf8')
    );

    let inserted = 0;
    let skipped = 0;

    for (const ex of exercises) {
      const { rows } = await client.query(
        `SELECT id FROM exercise_bank WHERE control = $1 AND nivel = $2 AND source = $3 AND content->>'scenario' = $4`,
        [ex.control, ex.nivel, ex.source, ex.content.scenario]
      );
      if (rows.length > 0) {
        skipped++;
        continue;
      }
      await client.query(
        `INSERT INTO exercise_bank (control, nivel, type, anchor, content, source, validated_by, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [ex.control, ex.nivel, ex.type, ex.anchor, JSON.stringify(ex.content), ex.source, null, false]
      );
      inserted++;
    }
    console.log(`Seed nivel 3 complete: ${inserted} inserted, ${skipped} skipped`);
  } finally {
    client.release();
    await pool.end();
  }
}

seedNivel3().catch(err => { console.error(err); process.exit(1); });
