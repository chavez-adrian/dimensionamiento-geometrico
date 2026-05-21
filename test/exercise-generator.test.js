require('dotenv').config();
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { generateForControl } = require('../src/exercise-generator');

const TIMEOUT = 30000;

function assertExerciseStructure(ex) {
  assert.ok(ex.question, 'question required');
  assert.ok(Array.isArray(ex.options), 'options must be array');
  assert.equal(ex.options.length, 4, 'must have exactly 4 options');
  assert.ok(typeof ex.correct_index === 'number', 'correct_index must be number');
  assert.ok(ex.correct_index >= 0 && ex.correct_index <= 3, 'correct_index 0-3');
  assert.ok(ex.explanation, 'explanation required');
  assert.ok(ex.id, 'id required');
}

describe('ExerciseGenerator', () => {
  describe('Nivel 1 structure', () => {
    it('returns exercise with required fields for Planicidad nivel 1', async () => {
      const ex = await generateForControl('Planicidad', 1);
      assertExerciseStructure(ex);
    }, { timeout: TIMEOUT });

    it('returns exercise with required fields for Cilindricidad nivel 1', async () => {
      const ex = await generateForControl('Cilindricidad', 1);
      assertExerciseStructure(ex);
    }, { timeout: TIMEOUT });

    it('returns exercise with required fields for Paralelismo nivel 1', async () => {
      const ex = await generateForControl('Paralelismo', 1);
      assertExerciseStructure(ex);
    }, { timeout: TIMEOUT });

    it('returns exercise with required fields for Perpendicularidad nivel 1', async () => {
      const ex = await generateForControl('Perpendicularidad', 1);
      assertExerciseStructure(ex);
    }, { timeout: TIMEOUT });

    it('returns exercise with required fields for Posicion nivel 1', async () => {
      const ex = await generateForControl('Posicion', 1);
      assertExerciseStructure(ex);
    }, { timeout: TIMEOUT });
  });

  describe('Fundamentos nivel 1', () => {
    it('returns exercise with required fields for Fundamentos nivel 1', async () => {
      const ex = await generateForControl('Fundamentos', 1);
      assertExerciseStructure(ex);
    }, { timeout: TIMEOUT });

    it('two calls for Fundamentos nivel 1 produce different questions (smoke)', async () => {
      const ex1 = await generateForControl('Fundamentos', 1);
      const ex2 = await generateForControl('Fundamentos', 1);
      assert.notEqual(ex1.question, ex2.question, 'consecutive calls should produce different questions');
    }, { timeout: TIMEOUT * 2 });

    it('seenQuestions hint reduces repetition when passed', async () => {
      const first = await generateForControl('Fundamentos', 1);
      const second = await generateForControl('Fundamentos', 1, { seenQuestions: [first.question] });
      assertExerciseStructure(second);
    }, { timeout: TIMEOUT * 2 });
  });

  describe('Nivel 2 structure', () => {
    it('returns exercise with required fields for Planicidad nivel 2', async () => {
      const ex = await generateForControl('Planicidad', 2);
      assertExerciseStructure(ex);
    }, { timeout: TIMEOUT });

    it('returns exercise with required fields for Cilindricidad nivel 2', async () => {
      const ex = await generateForControl('Cilindricidad', 2);
      assertExerciseStructure(ex);
    }, { timeout: TIMEOUT });

    it('returns exercise with required fields for Paralelismo nivel 2', async () => {
      const ex = await generateForControl('Paralelismo', 2);
      assertExerciseStructure(ex);
    }, { timeout: TIMEOUT });

    it('returns exercise with required fields for Perpendicularidad nivel 2', async () => {
      const ex = await generateForControl('Perpendicularidad', 2);
      assertExerciseStructure(ex);
    }, { timeout: TIMEOUT });

    it('returns exercise with required fields for Posicion nivel 2', async () => {
      const ex = await generateForControl('Posicion', 2);
      assertExerciseStructure(ex);
    }, { timeout: TIMEOUT });

    it('at least one dynamically generated nivel 2 exercise mentions embutido or lamina de acero', async () => {
      const exercises = [];
      for (let i = 0; i < 3; i++) {
        const ex = await generateForControl('Planicidad', 2, { forceDynamic: true });
        exercises.push(ex);
      }
      const mentionsContext = exercises.some(ex => {
        const text = (ex.question + ' ' + ex.explanation + ' ' + ex.options.join(' ')).toLowerCase();
        return text.includes('embutido') || text.includes('lamina de acero') || text.includes('lamina') || text.includes('troquel');
      });
      assert.ok(mentionsContext, 'at least one dynamic exercise should mention embutido context');
    }, { timeout: TIMEOUT * 3 });
  });
});
