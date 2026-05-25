require('dotenv').config();
const { Client } = require('pg');

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();
  const res = await client.query(`
    SELECT pedagogical_order, layer_id, layer_name, term, english_name, abbreviation, definition, coloquial, example
    FROM concept_glossary
    ORDER BY pedagogical_order
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}

main().catch(e => { console.error(e); process.exit(1); });
