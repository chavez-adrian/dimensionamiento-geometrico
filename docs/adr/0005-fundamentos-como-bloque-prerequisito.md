# Fundamentos como bloque prerequisito antes de los Controles Geométricos

El contenido de los Módulos 1 y 2 del curso (FOS, MMC/LMC/RFS, Reglas #1 y #2, Caja de Control de Rasgo, Datum, Bonus Tolerance, condiciones de frontera MMB/LMB/RMB, etc.) se agrupa en un bloque "Fundamentos" con 2 Niveles (Vocabulario y Concepto Mecánico), que el estudiante debe dominar antes de acceder a cualquier Control Geométrico.

La alternativa considerada fue distribuir estos conceptos fundacionales dentro de cada control (ej. explicar MMC al llegar a Paralelismo). Se descartó porque: (1) son conceptos transversales que aplican a los 5 controles — enseñarlos repetidamente sería redundante; (2) sin FOS, MMC/LMC y la Caja de Control de Rasgo, el Nivel 1 de cualquier control geométrico requiere definir términos previos en cada ejercicio, lo que degrada la calidad pedagógica; (3) el curso mismo los separa en módulos previos a los controles de forma.

Fundamentos no tiene Nivel 3 (Criterio de Decisión) porque los conceptos de M1+M2 no requieren que el estudiante "especifique" nada — son fundamentos de lectura e interpretación, no de diseño.

Concentricidad y Simetría (eliminadas en ASME Y14.5-2018) se mencionan en Fundamentos únicamente como notas históricas, sin ejercicios propios.

## Consequences

El sistema pasa de 15 Celdas de Conocimiento a 17 (Fundamentos × 2 + 5 controles × 3). La tabla `knowledge_state` en Neon almacena Fundamentos con `control = 'Fundamentos'` y `nivel` 1 o 2. El seed debe agregar 2 filas nuevas para el usuario 'adrian' con Fundamentos Nivel 1 desbloqueado y Nivel 2 bloqueado.
