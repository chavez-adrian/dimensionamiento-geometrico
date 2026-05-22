# Tabla concept_glossary dedicada en Neon para contenido rico por término

El glosario de los 93 conceptos de Fundamentos se almacena en una tabla Neon separada (`concept_glossary`) en lugar de embeberse en `course-content.json`.

La alternativa fue agregar campos `definition`, `coloquial`, `example`, `symbol` directamente al JSON del glosario. Se descartó porque: (1) el JSON ya tiene un propósito específico — servir como contexto de generación de ejercicios, y mezclarlo con contenido educativo rico lo haría difícil de mantener; (2) el contenido generado por Sonnet (~500 tokens por término × 93 términos) haría el JSON demasiado grande para cargar en cada generación de ejercicio; (3) la tabla en Neon permite consultas por capa, búsqueda por término, y actualizaciones parciales sin reemplazar el JSON completo; (4) el modelo de datos es el mismo que el resto del sistema — ya tenemos Neon en uso.

El contenido fue generado inicialmente con Claude Haiku (93 llamadas), evaluado con QA manual, y regenerado con Claude Sonnet para las 18 entradas con errores críticos detectados (cálculos incorrectos de VC, Bonus Tolerance, IB/OB, clearances de embutido). El script `seed-glossary.js` es re-ejecutable con `ON CONFLICT DO UPDATE`.

## Consequences

La tabla `concept_glossary` vive en Neon junto a `knowledge_state`, `exercise_bank` y `exercise_sessions`. Los endpoints `/api/glossary?order=N` y `/api/glossary/layers` la consultan directamente. El campo `symbol` (letra circulada ASME) se pobló con un script separado (`add-symbol-column.js`) y se mantiene con `fix-symbols-case.js` para asegurar mayúsculas en todos los campos de texto.
