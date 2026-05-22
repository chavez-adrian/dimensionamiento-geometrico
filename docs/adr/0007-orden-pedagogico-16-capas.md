# Secuencia pedagógica de 93 conceptos en 16 capas para generación de ejercicios Fundamentos

Los 93 términos de Fundamentos se ordenan en 16 capas (A–P) donde cada concepto depende de los anteriores, y el generador de ejercicios respeta esta secuencia: usa `seenQuestions.length` como índice para seleccionar el siguiente `focusTerm` en `course-content.json`.

La alternativa fue dejar que Claude elija el tema libremente del glosario completo. Se descartó porque Claude tiende a seleccionar los mismos términos centrales (MMC, Regla #1, Datum) y puede presentar Bonus Tolerance antes de que el estudiante haya visto MMC, violando la dependencia conceptual.

Las 16 capas en orden son: A (Lenguaje del dibujo), B (Tolerancias convencionales), C (Métodos de dimensionamiento), D (Problema del dimensionamiento coordenado), E (Rasgos y geometría), F (Condiciones de material), G (Envoltura actual AME/AMME), H (Estructura GD&T — FCF y símbolos), I (Datum), J (Reglas fundamentales #1 y #2), K (Fronteras de material MMB/LMB/RMB), L (Condiciones virtuales y Bonus Tolerance), M (Verificación), N (Modificadores avanzados), O (Las 14 características geométricas intro), P (Notas históricas).

La dependencia entre capas fue verificada término a término en una sesión de análisis exhaustivo de los PDFs del curso.

## Consequences

El campo `terminos` en `course-content.json` para la entrada `Fundamentos` está ordenado en la secuencia pedagógica (Dibujo de Ingeniería primero, Simetría última). El campo `layers` del mismo JSON mapea rangos de posiciones a capas. `getFundamentosFocusTerm()` en `exercise-generator.js` selecciona `terminos[seenQuestions.length]` — avanza un concepto por pregunta respondida, garantizando progresión. La secuencia también está reflejada en `concept_glossary.pedagogical_order` y `concept_glossary.layer_id` en Neon.
