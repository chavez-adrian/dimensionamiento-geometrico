# Dimensionamiento Geométrico (GD&T)

Herramienta de aprendizaje adaptativo para que Adrián Chávez domine la especificación de tolerancias geométricas (ASME Y14.5-2018 (R2024)) aplicadas al diseño de troqueles de embutido de lámina de acero al carbono calibre 26.

## Language

### Dominio de aprendizaje

**Control Geométrico**:
Una de las 5 características geométricas en alcance: Planicidad, Paralelismo, Perpendicularidad, Posición, Cilindricidad.
_Evitar_: Característica GD&T, símbolo geométrico, tolerancia.

**Celda de Conocimiento**:
Par (Control Geométrico, Nivel) que representa la unidad atómica de seguimiento del progreso del estudiante. Hay 15 celdas en total (5 controles × 3 niveles).
_Evitar_: Módulo, unidad, tema.

**Nivel**:
Etapa de maestría dentro de un Control Geométrico. Tres posibles: Vocabulario (1), Concepto Mecánico (2), Criterio de Decisión (3). El Nivel no puede avanzarse sin demostrar maestría en el anterior.
_Evitar_: Grado, etapa, dificultad.

**Progresión por Maestría**:
Regla que impide al estudiante acceder al siguiente Nivel sin demostrar dominio del actual en la Celda correspondiente. La decisión de avance la toma el sistema automáticamente; no existe override manual.
_Evitar_: Desbloqueo, avance automático, progreso.

**Vocabulario (Nivel 1)**:
Nivel que evalúa el reconocimiento de términos y símbolos de GD&T mediante opción múltiple con Ejercicios Genéricos.

**Concepto Mecánico (Nivel 2)**:
Nivel que evalúa la comprensión del comportamiento físico del Control mediante opción múltiple combinada con escenarios de embutido. Usa mezcla de Ejercicios Genéricos y Anclados.

**Criterio de Decisión (Nivel 3)**:
Nivel que evalúa la capacidad del estudiante de especificar el Control correcto, el datum y el valor de tolerancia para un componente real de troquel. Usa Ejercicios Anclados con respuesta abierta evaluada por Claude. Objetivo final del sistema.

### Ejercicios

**Ejercicio**:
Ítem de aprendizaje presentado al estudiante. Tiene un tipo (opción múltiple, respuesta abierta) y un anclaje (Genérico o Anclado).
_Evitar_: Pregunta, reto, actividad.

**Ejercicio Genérico**:
Ejercicio sin referencia a un proceso o pieza específica. Usado en Niveles 1 y 2.
_Evitar_: Ejercicio abstracto, ejercicio teórico.

**Ejercicio Anclado**:
Ejercicio cuyo escenario especifica componentes reales de un troquel de embutido de lámina de acero calibre 26. Usado en Niveles 2 y 3.
_Evitar_: Ejercicio de troquel, ejercicio práctico, ejercicio aplicado.

**Banco de Ejercicios**:
Conjunto de Ejercicios Anclados de Nivel 3 pre-escritos y validados por el contacto técnico en CIDESI antes de cargarse al sistema.
_Evitar_: Biblioteca, repositorio, base de preguntas.

**Evaluación por Claude**:
Proceso por el cual el modelo evalúa la respuesta abierta del estudiante en Nivel 3 contra la especificación GD&T correcta para el escenario dado. Solo aplica en Nivel 3.
_Evitar_: Corrección automática, calificación IA, revisión.

### Manufactura

**Troquel de Embutido**:
Herramental de embutido profundo (deep drawing die) para lámina de acero al carbono calibre 26. Contexto de manufactura que ancla todos los Ejercicios de Nivel 3.
_Evitar_: Herramental, molde, matriz (cuando se usa como sinónimo del troquel completo).

## Flagged ambiguities

**"Módulo"**: En el curso base (ASME Y14.5-2018 (R2024)) se usa para referirse a las 7 secciones del temario. En este sistema, la unidad de organización es la Celda de Conocimiento, no el módulo del curso. No usar "módulo" para referirse a unidades del sistema.

## Example dialogue

> **Dev:** Voy a agregar ejercicios para Paralelismo básico.
>
> **Dominio:** ¿Nivel 1 o Nivel 2?
>
> **Dev:** Para alguien que acaba de ver el símbolo por primera vez.
>
> **Dominio:** Entonces es Nivel 1, Vocabulario — opción múltiple, Genérico. No uses escenarios de troquel ahí, eso es Nivel 2.
>
> **Dev:** ¿Y si quiero que practique decidir entre Paralelismo y Perpendicularidad?
>
> **Dominio:** Eso es Criterio de Decisión — Nivel 3. Necesita un Ejercicio Anclado con un componente real del troquel y respuesta abierta. Ese ejercicio tiene que estar en el Banco de Ejercicios, validado por CIDESI antes de usarse.
