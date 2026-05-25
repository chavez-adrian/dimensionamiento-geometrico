require('dotenv').config();
const express = require('express');
const fs = require('fs');
const { GEOMETRIC_CONTROLS: CONTROLS } = require('./domain');
const StateStore = require('./state-store');
const createOrchestrator = require('./session-orchestrator');
const path = require('path');

const LESSONS_CONFIG = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/lessons-config.json'), 'utf8')
);
const LESSON_IDS = new Set(LESSONS_CONFIG.map(l => l.lesson_id));

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
    const [{ rows }, completedLessons] = await Promise.all([
      stateStore.pool.query(
        'SELECT control, nivel, mastered, unlocked, attempts, correct_streak FROM knowledge_state WHERE user_id = $1',
        ['adrian']
      ),
      stateStore.getCompletedLessons('adrian'),
    ]);
    const completedSet = new Set(completedLessons);
    const lessonByCell = {};
    LESSONS_CONFIG.forEach(l => {
      const key = `${l.control}:${l.nivel}`;
      lessonByCell[key] = l.lesson_id;
    });
    const stateMap = {};
    rows.forEach(r => {
      const key = `${r.control}:${r.nivel}`;
      const lessonId = lessonByCell[key] || null;
      const lesson_required = (lessonId && !completedSet.has(lessonId)) ? lessonId : null;
      stateMap[key] = { ...r, lesson_required };
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

app.get('/api/lessons', async (req, res) => {
  try {
    const completed = await stateStore.getCompletedLessons('adrian');
    const completedSet = new Set(completed);
    const lessons = LESSONS_CONFIG.map(l => ({
      lesson_id: l.lesson_id,
      title: l.title,
      control: l.control,
      nivel: l.nivel,
      completed: completedSet.has(l.lesson_id),
    }));
    res.json(lessons);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/lesson/:id/complete', async (req, res) => {
  const lessonId = req.params.id;
  if (!LESSON_IDS.has(lessonId)) {
    return res.status(404).json({ error: 'lesson not found' });
  }
  try {
    await stateStore.completeLesson('adrian', lessonId);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

if (require.main === module) {
  LESSONS_CONFIG.forEach(lesson => {
    const htmlPath = path.join(__dirname, '../public/lessons', `${lesson.lesson_id}.html`);
    if (!fs.existsSync(htmlPath)) {
      console.warn(`[lessons] WARNING: missing HTML for lesson "${lesson.lesson_id}" at ${htmlPath}`);
    }
  });

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
