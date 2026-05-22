const { Pool } = require('pg');

class StateStore {
  constructor(connectionString) {
    this.pool = new Pool({ connectionString });
  }

  async connect() {
    const client = await this.pool.connect();
    client.release();
  }

  async disconnect() {
    await this.pool.end();
  }

  async loadState(userId) {
    const { rows } = await this.pool.query(
      'SELECT control, nivel, attempts, correct_streak, mastered, unlocked FROM knowledge_state WHERE user_id = $1 ORDER BY control, nivel',
      [userId]
    );
    return rows;
  }

  async saveState(userId, control, nivel, { attempts, correct_streak, mastered, unlocked }) {
    await this.pool.query(
      `UPDATE knowledge_state
       SET attempts = $4, correct_streak = $5, mastered = $6, unlocked = $7, updated_at = NOW()
       WHERE user_id = $1 AND control = $2 AND nivel = $3`,
      [userId, control, nivel, attempts, correct_streak, mastered, unlocked]
    );
  }

  async loadKnowledgeState(userId) {
    const { rows } = await this.pool.query(
      'SELECT control, nivel, attempts, correct_streak, mastered, unlocked FROM knowledge_state WHERE user_id = $1',
      [userId]
    );
    const state = {};
    rows.forEach(r => {
      if (!state[r.control]) state[r.control] = {};
      state[r.control][r.nivel] = {
        attempts: r.attempts,
        correct_streak: r.correct_streak,
        mastered: r.mastered,
        unlocked: r.unlocked,
      };
    });
    return state;
  }

  async saveCell(userId, control, nivel, cell) {
    await this.pool.query(
      `UPDATE knowledge_state
       SET attempts = $4, correct_streak = $5, mastered = $6, unlocked = $7, updated_at = NOW()
       WHERE user_id = $1 AND control = $2 AND nivel = $3`,
      [userId, control, nivel, cell.attempts, cell.correct_streak, cell.mastered, cell.unlocked]
    );
  }

  async getSeenBankIds(userId, control, nivel) {
    const { rows } = await this.pool.query(
      `SELECT DISTINCT (exercise->>'bank_id')::int AS bank_id
       FROM exercise_sessions
       WHERE user_id = $1 AND control = $2 AND nivel = $3 AND exercise->>'bank_id' IS NOT NULL`,
      [userId, control, nivel]
    ).catch(() => ({ rows: [] }));
    return rows.map(r => r.bank_id).filter(Boolean);
  }

  async getSeenQuestions(userId, control, nivel) {
    const { rows } = await this.pool.query(
      `SELECT question FROM exercise_sessions
       WHERE user_id = $1 AND control = $2 AND nivel = $3
       ORDER BY answered_at DESC LIMIT 10`,
      [userId, control, nivel]
    ).catch(() => ({ rows: [] }));
    return rows.map(r => r.question).filter(Boolean);
  }

  async getUnseenNivel2(control, nivel, seenIds) {
    const placeholders = seenIds.length > 0
      ? seenIds.map((_, i) => `$${i + 3}`).join(', ')
      : 'NULL';
    const query = seenIds.length > 0
      ? `SELECT id, content FROM exercise_bank WHERE control = $1 AND nivel = $2 AND source = 'curso_pdf' AND active = TRUE AND id NOT IN (${placeholders}) ORDER BY RANDOM() LIMIT 1`
      : `SELECT id, content FROM exercise_bank WHERE control = $1 AND nivel = $2 AND source = 'curso_pdf' AND active = TRUE ORDER BY RANDOM() LIMIT 1`;
    const params = seenIds.length > 0 ? [control, nivel, ...seenIds] : [control, nivel];
    const { rows } = await this.pool.query(query, params);
    return rows[0] || null;
  }
}

module.exports = StateStore;
