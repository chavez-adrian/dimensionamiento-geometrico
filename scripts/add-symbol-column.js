require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Símbolos GD&T oficiales per ASME Y14.5-2018
// Solo los términos que tienen símbolo propio; el resto queda NULL
const SYMBOLS = [
  // Modificadores de condición de material
  ['Condicion de maximo material MMC',        'Ⓜ'],
  ['Condicion de minimo material LMC',        'Ⓛ'],
  ['Zona de tolerancia proyectada',           'Ⓟ'],
  ['Plano tangente',                          'Ⓣ'],
  ['Simbolo de independencia',                'Ⓘ'],
  ['Partes no rigidas variacion en estado libre', 'Ⓕ'],
  ['Rasgos de tamano continuo CF',            'CF'],
  // Símbolo de diámetro
  ['Simbolo de diametro',                     'Ø'],
  ['Radio y Radio controlado',                'R / CR'],
  // Características geométricas — tolerancias de forma
  ['Rectitud introduccion',                   '—'],
  ['Planicidad introduccion',                 '⏥'],
  ['Circularidad introduccion',               '○'],
  ['Cilindricidad introduccion',              '⌭'],
  // Tolerancias de perfil
  ['Perfil de una linea introduccion',        '⌒'],
  ['Perfil de una superficie introduccion',   '⌓'],
  // Tolerancias de orientación
  ['Angularidad introduccion',                '∠'],
  ['Perpendicularidad introduccion',          '⊥'],
  ['Paralelismo introduccion',                '∥'],
  // Tolerancias de localización
  ['Posicion introduccion',                   '⊕'],
  ['Concentricidad nota historica eliminada en ASME 2018', '◎'],
  ['Simetria nota historica eliminada en ASME 2018',       '≡'],
  // Tolerancias de cabeceo
  ['Cabeceo circular introduccion',           '↗'],
  ['Cabeceo total introduccion',              '⇗'],
  // Datum
  ['Rasgo datum simbolo',                     '▷'],
];

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('ALTER TABLE concept_glossary ADD COLUMN IF NOT EXISTS symbol TEXT');
    console.log('Column added (or already existed).');

    for (const [term, symbol] of SYMBOLS) {
      const r = await client.query(
        'UPDATE concept_glossary SET symbol = $1 WHERE term = $2',
        [symbol, term]
      );
      if (r.rowCount === 0) {
        console.warn(`  NOT FOUND: "${term}"`);
      } else {
        console.log(`  ✓ ${symbol}  ${term}`);
      }
    }

    await client.query('COMMIT');
    const { rows } = await client.query(
      'SELECT COUNT(*) as total FROM concept_glossary WHERE symbol IS NOT NULL'
    );
    console.log(`\nDone. ${rows[0].total} terms have a symbol.`);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(e => { console.error(e.message); process.exit(1); });
