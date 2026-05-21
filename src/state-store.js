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
}

module.exports = StateStore;
