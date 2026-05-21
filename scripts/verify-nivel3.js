require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT control, COUNT(*) as count, bool_and(active = false) as all_inactive FROM exercise_bank WHERE nivel = 3 GROUP BY control ORDER BY control')
  .then(r => {
    console.log('Nivel 3 records by control:');
    r.rows.forEach(row => console.log('  ' + row.control + ': ' + row.count + ' rows, all active=false: ' + row.all_inactive));
    return pool.end();
  })
  .catch(e => { console.error(e); pool.end(); });
