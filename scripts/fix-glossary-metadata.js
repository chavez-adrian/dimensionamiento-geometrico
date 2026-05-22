require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fix() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Abreviaturas: limpiar las no-ASME o duplicadas
    const abrevFixes = [
      ['FOS Regular', ''],
      ['FOS Irregular', ''],
      ['AME sin relacionar', ''],
      ['AME relacionada', ''],
      ['Frontera de forma perfecta en MMC', ''],
      ['Frontera de condicion virtual', ''],
      ['Frontera de condicion resultante', ''],
      ['Frontera del peor caso WCB', ''],
    ];

    for (const [term, abbrev] of abrevFixes) {
      const res = await client.query(
        'UPDATE concept_glossary SET abbreviation = $1 WHERE term = $2',
        [abbrev, term]
      );
      console.log(`abbreviation "${term}": ${res.rowCount} row(s) updated`);
    }

    // english_names incorrectos
    const englishFixes = [
      ['Envoltura actual de minimo material AMME', 'Actual Minimum Material Envelope'],
      ['Modificadores tabla completa', 'Modifiers (GD&T)'],
      ['Tolerancias de cabeceo', 'Runout Tolerances'],
      ['Concentricidad nota historica eliminada en ASME 2018', 'Concentricity (Historical: Removed in ASME Y14.5-2018)'],
      ['Simetria nota historica eliminada en ASME 2018', 'Symmetry (Historical: Removed in ASME Y14.5-2018)'],
    ];

    for (const [term, engName] of englishFixes) {
      const res = await client.query(
        'UPDATE concept_glossary SET english_name = $1 WHERE term = $2',
        [engName, term]
      );
      console.log(`english_name "${term}": ${res.rowCount} row(s) updated`);
    }

    await client.query('COMMIT');
    console.log('Metadata fixes applied.');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

fix().catch(e => { console.error(e.message); process.exit(1); });
