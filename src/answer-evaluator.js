function evaluate(exercise, answerIndex) {
  const correct = answerIndex === exercise.correct_index;
  return {
    correct,
    explanation: exercise.explanation,
  };
}

module.exports = { evaluate };
