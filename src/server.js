require('dotenv').config();
const express = require('express');
const { GEOMETRIC_CONTROLS: CONTROLS } = require('./domain');
const StateStore = require('./state-store');
const createOrchestrator = require('./session-orchestrator');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const stateStore = new StateStore(process.env.DATABASE_URL);
const { nextExercise, submitAnswer } = createOrchestrator(stateStore);

const LEVELS = [
  { num: 1, label: 'Vocabulario' },
  { num: 2, label: 'Concepto Mecanico' },
  { num: 3, label: 'Criterio de Decision' },
];

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/api/health', async (req, res) => {
  try {
    await stateStore.pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'disconnected', message: err.message });
  }
});

app.get('/api/state', async (req, res) => {
  try {
    const { rows } = await stateStore.pool.query(
      'SELECT control, nivel, mastered, unlocked, attempts, correct_streak FROM knowledge_state WHERE user_id = $1',
      ['adrian']
    );
    const stateMap = {};
    rows.forEach(r => {
      stateMap[`${r.control}:${r.nivel}`] = r;
    });
    res.json({ state: stateMap });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/exercise/next', async (req, res) => {
  try {
    const { control, nivel } = req.body;
    if (!control || !nivel) {
      return res.status(400).json({ error: 'control and nivel are required' });
    }
    const exercise = await nextExercise(control, parseInt(nivel));
    res.json({ exercise: { ...exercise, control, nivel: parseInt(nivel) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/exercise/evaluate', async (req, res) => {
  try {
    const { exercise, answer_index } = req.body;
    if (!exercise || answer_index === undefined) {
      return res.status(400).json({ error: 'exercise and answer_index are required' });
    }
    const { result, newState } = await submitAnswer(exercise.id, answer_index, exercise);
    res.json({ result, newState });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/glossary/layers', async (req, res) => {
  try {
    const { rows } = await stateStore.pool.query(
      'SELECT layer_id, layer_name, MIN(pedagogical_order) as first_order FROM concept_glossary GROUP BY layer_id, layer_name ORDER BY first_order'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/glossary', async (req, res) => {
  const order = parseInt(req.query.order);
  if (!order || order < 1 || order > 93) {
    return res.status(404).json({ error: 'Not found' });
  }
  try {
    const { rows } = await stateStore.pool.query(
      'SELECT term, english_name, abbreviation, symbol, definition, coloquial, example, layer_id, layer_name, pedagogical_order FROM concept_glossary WHERE pedagogical_order = $1',
      [order]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
