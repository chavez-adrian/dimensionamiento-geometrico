require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const CONTROLS = ['Planitud', 'Paralelismo', 'Perpendicularidad', 'Posicion', 'Cilindricidad'];
const LEVELS = [
  { num: 1, label: 'Vocabulario' },
  { num: 2, label: 'Concepto Mecanico' },
  { num: 3, label: 'Criterio de Decision' },
];

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'disconnected', message: err.message });
  }
});

app.get('/', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT control, nivel, mastered, unlocked FROM knowledge_state WHERE user_id = $1',
    ['adrian']
  );

  const stateMap = {};
  rows.forEach(r => {
    stateMap[`${r.control}:${r.nivel}`] = r;
  });

  const cells = CONTROLS.map(control =>
    LEVELS.map(level => {
      const key = `${control}:${level.num}`;
      const cell = stateMap[key] || { unlocked: false, mastered: false };
      return { control, level, unlocked: cell.unlocked, mastered: cell.mastered };
    })
  );

  const gridHtml = cells.map(row =>
    row.map(cell => {
      let cls = 'cell';
      if (cell.mastered) cls += ' mastered';
      else if (cell.unlocked) cls += ' unlocked';
      else cls += ' locked';
      return `<div class="${cls}"><span class="control">${cell.control}</span><span class="nivel">${cell.level.label}</span></div>`;
    }).join('')
  ).join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GD&amp;T - Dimensionamiento Geometrico</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; padding: 2rem; }
    h1 { text-align: center; margin-bottom: 0.5rem; font-size: 1.5rem; color: #f8fafc; }
    p.subtitle { text-align: center; color: #94a3b8; margin-bottom: 2rem; font-size: 0.875rem; }
    .grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: repeat(5, auto);
      gap: 0.75rem;
      max-width: 800px;
      margin: 0 auto;
    }
    .cell {
      border-radius: 0.5rem;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-height: 80px;
      justify-content: center;
    }
    .cell .control { font-weight: 600; font-size: 0.875rem; }
    .cell .nivel { font-size: 0.75rem; opacity: 0.75; }
    .cell.locked { background: #1e293b; border: 1px solid #334155; color: #475569; }
    .cell.unlocked { background: #1e3a5f; border: 1px solid #2563eb; color: #93c5fd; }
    .cell.mastered { background: #14532d; border: 1px solid #16a34a; color: #86efac; }
    .legend { display: flex; gap: 1.5rem; justify-content: center; margin-top: 1.5rem; font-size: 0.75rem; }
    .legend-item { display: flex; align-items: center; gap: 0.4rem; }
    .dot { width: 12px; height: 12px; border-radius: 50%; }
    .dot.locked { background: #334155; }
    .dot.unlocked { background: #2563eb; }
    .dot.mastered { background: #16a34a; }
    .levels-header {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
      max-width: 800px;
      margin: 0 auto 0.5rem;
    }
    .levels-header div { text-align: center; font-size: 0.75rem; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
  </style>
</head>
<body>
  <h1>GD&amp;T Aprendizaje Adaptativo</h1>
  <p class="subtitle">ASME Y14.5-2018 (R2024) - Troqueles de Embutido</p>
  <div class="levels-header">
    <div>Vocabulario</div>
    <div>Concepto Mecanico</div>
    <div>Criterio de Decision</div>
  </div>
  <div class="grid">
    ${gridHtml}
  </div>
  <div class="legend">
    <div class="legend-item"><div class="dot locked"></div> Bloqueado</div>
    <div class="legend-item"><div class="dot unlocked"></div> Disponible</div>
    <div class="legend-item"><div class="dot mastered"></div> Dominado</div>
  </div>
</body>
</html>`;

  res.send(html);
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
