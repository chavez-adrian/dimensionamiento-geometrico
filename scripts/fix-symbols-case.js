require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Letras circuladas minúsculas → mayúsculas (símbolos GD&T son siempre mayúsculas)
const REPLACEMENTS = [
  ['ⓜ', 'Ⓜ'],  // MMC
  ['ⓛ', 'Ⓛ'],  // LMC
  ['ⓟ', 'Ⓟ'],  // Projected tolerance zone
  ['ⓣ', 'Ⓣ'],  // Tangent plane
  ['ⓘ', 'Ⓘ'],  // Independency
  ['ⓕ', 'Ⓕ'],  // Free state
  ['ⓢ', 'Ⓢ'],  // Statistical (por si acaso)
  ['ⓤ', 'Ⓤ'],  // Unequally disposed
];

const FIELDS = ['definition', 'coloquial', 'example', 'abbreviation', 'symbol'];

async function run() {
  const client = await pool.connect();
  try {
    let totalFixes = 0;

    for (const [wrong, correct] of REPLACEMENTS) {
      for (const field of FIELDS) {
        const { rows } = await client.query(
          `SELECT pedagogical_order, term, ${field} FROM concept_glossary WHERE ${field} LIKE $1`,
          [`%${wrong}%`]
        );
        if (rows.length > 0) {
          for (const row of rows) {
            await client.query(
              `UPDATE concept_glossary SET ${field} = REPLACE(${field}, $1, $2) WHERE pedagogical_order = $3`,
              [wrong, correct, row.pedagogical_order]
            );
            console.log(`  ✓ #${row.pedagogical_order} [${field}]: ${wrong} → ${correct}  ("${row.term}")`);
            totalFixes++;
          }
        }
      }
    }

    if (totalFixes === 0) {
      console.log('No se encontraron símbolos en minúscula.');
    } else {
      console.log(`\nTotal corregidos: ${totalFixes}`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(e => { console.error(e.message); process.exit(1); });
