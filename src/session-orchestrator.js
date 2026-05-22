require('dotenv').config();
const { evaluate } = require('./answer-evaluator');
const { processAnswer, computeUnlocks } = require('./knowledge-state-engine');
const { USER_ID } = require('./domain');

module.exports = function createOrchestrator(stateStore) {
  const { generateForControl } = require('./exercise-generator')(stateStore);

  async function nextExercise(control, nivel) {
    let seenIds = [];
    if (nivel === 2) {
      seenIds = await stateStore.getSeenBankIds(USER_ID, control, nivel);
    }
    const seenQuestions = await stateStore.getSeenQuestions(USER_ID, control, nivel);
    const exercise = await generateForControl(control, nivel, { seenIds, seenQuestions });
    await stateStore.pool.query(
      `INSERT INTO exercise_sessions (user_id, control, nivel, question) VALUES ($1, $2, $3, $4)`,
      [USER_ID, control, nivel, exercise.question]
    ).catch(() => {});
    return exercise;
  }

  async function submitAnswer(exerciseId, answerIndex, exerciseData) {
    const { control, nivel } = exerciseData;
    const result = evaluate(exerciseData, answerIndex);

    const state = await stateStore.loadKnowledgeState(USER_ID);
    const newState = processAnswer(state, control, nivel, result.correct);

    await stateStore.saveCell(USER_ID, control, nivel, newState[control][nivel]);

    const { nextNivel, fanOut } = computeUnlocks(newState, control, nivel);
    if (nextNivel && newState[control][nextNivel]) {
      newState[control][nextNivel].unlocked = true;
      await stateStore.saveCell(USER_ID, control, nextNivel, newState[control][nextNivel]);
    }
    for (const fanControl of fanOut) {
      if (newState[fanControl] && newState[fanControl][1] && !newState[fanControl][1].unlocked) {
        newState[fanControl][1].unlocked = true;
        await stateStore.saveCell(USER_ID, fanControl, 1, newState[fanControl][1]);
      }
    }

    return { result, newState };
  }

  return { nextExercise, submitAnswer };
};
