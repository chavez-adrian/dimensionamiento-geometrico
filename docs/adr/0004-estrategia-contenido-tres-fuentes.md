# Tres fuentes de contenido según nivel: Claude nativo, PDF semilla, banco CIDESI

El ExerciseGenerator usa fuentes distintas según el Nivel:

- **Nivel 1:** Conocimiento nativo de Claude sobre ASME Y14.5-2018 (R2024) con alineación de terminología en español del curso. No depende del texto del PDF como base de conocimiento — Claude genera variaciones ilimitadas del mismo concepto desde ángulos distintos.
- **Nivel 2:** Las secciones "Preguntas de Repaso" de los PDFs del curso se extraen como banco semilla (ejercicios ya estructurados con diagramas técnicos). Claude expande el banco con variaciones que agregan contexto de embutido de lámina de acero.
- **Nivel 3:** Banco pre-escrito validado por CIDESI. Estático.

La razón de no depender del texto PDF para Nivel 1: el texto de cada control ocupa ~5-8 slides y se agota rápido si se usa como única fuente. El aprendizaje por maestría requiere 15-20 variaciones del mismo concepto preguntado desde perspectivas distintas — más de lo que el texto del módulo puede generar con calidad. Claude conoce la norma ASME Y14.5-2018 (R2024) con suficiente profundidad para generar esas variaciones sin riesgo técnico en Nivel 1.

## Consequences

Los PDFs del curso cumplen dos funciones distintas según el nivel: (1) alineación de terminología en español para Nivel 1, (2) banco de ejercicios semilla para Nivel 2. El script CourseContentIndex debe extraer ambas cosas por separado: glosario de términos y sección de Preguntas de Repaso por módulo.
