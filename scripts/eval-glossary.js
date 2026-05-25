require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Muestra representativa de capas A-F: posiciones 2, 5, 9, 14, 20, 25, 28
const IDS = [2, 5, 9, 14, 20, 25, 28];

pool.query(
  'SELECT pedagogical_order, term, layer_id, definition, coloquial, example FROM concept_glossary WHERE pedagogical_order = ANY($1) ORDER BY pedagogical_order',
  [IDS]
).then(r => {
  r.rows.forEach(row => {
    console.log('\n=== #' + row.pedagogical_order + ' [Capa ' + row.layer_id + '] ' + row.term + ' ===');
    console.log('DEF: ' + row.definition);
    console.log('COL: ' + row.coloquial);
    console.log('EJM: ' + row.example);
  });
  pool.end();
}).catch(e => { console.error(e.message); pool.end(); });
