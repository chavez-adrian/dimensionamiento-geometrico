require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const { nextExercise, submitAnswer } = require('./session-orchestrator');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const CONTROLS = ['Planicidad', 'Paralelismo', 'Perpendicularidad', 'Posicion', 'Cilindricidad'];
const LEVELS = [
  { num: 1, label: 'Vocabulario' },
  { num: 2, label: 'Concepto Mecanico' },
  { num: 3, label: 'Criterio de Decision' },
];

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'disconnected', message: err.message });
  }
});

app.get('/api/state', async (req, res) => {
  try {
    const { rows } = await pool.query(
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

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
