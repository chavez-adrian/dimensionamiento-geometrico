# Consenso Estocástico: PRD Lecciones GD&T (issue #18)

**Fecha:** 2026-05-24  
**PRD:** https://github.com/chavez-adrian/dimensionamiento-geometrico/issues/18  
**Agentes:** 6 perspectivas independientes — Pedagogo, Contrarian, Arquitecto Tecnico, Primeros Principios, Voz del Usuario, Estratega de Contenido  
**Total de observaciones unicas:** 42

---

## Tier A — Consenso Alto (3+ agentes)

### A1. El boton "He leido esta leccion" es un gate decorativo sin valor real
**Agentes:** Pedagogo, Contrarian, Primeros Principios, Voz del Usuario (4/6)

El boton permite hacer clic sin leer. No hay scroll-to-bottom, tiempo minimo en pagina, ni pregunta trivial de comprension. El gate cumple su funcion tecnica (desbloquear ejercicio) pero no su funcion pedagogica (confirmar exposicion al material).

**Riesgo concreto:** Adrian puede clickear en 3 segundos, entrar al ejercicio sin vocabulario, fallar, y el sistema no puede diagnosticar si fue por falta de lectura o por mala comprension — ambas son el mismo fracaso desde el exterior.

**Opciones que el PRD deberia evaluar:**
- Tiempo minimo en pagina (ej. 60 segundos)
- Scroll obligatorio hasta el final del contenido
- 1-2 preguntas triviales de confirmacion ("cuantos tipos de tolerancias menciona esta leccion")
- Activacion automatica al terminar de hacer scroll

---

### A2. El gate duro es friccion excesiva para un adulto motivado con experiencia previa
**Agentes:** Pedagogo, Contrarian, Primeros Principios, Voz del Usuario (4/6)

Adrian tiene 20+ anos en manufactura. Para algunos conceptos (tolerancias lineales, referencias de datum) puede tener conocimiento previo que el gate ignora. LESSON_REQUIRED bloquea completamente — sin fallback, sin opcion "ya lo se", sin pre-test.

**Riesgo concreto:** Para un usuario unico con alta motivacion intrinseca, un gate duro sin escape genera resentimiento. El sistema percibido como barrera burocratica, no como apoyo pedagogico.

**Alternativas que el PRD deberia evaluar:**
- Gate suave: leccion recomendada con advertencia clara, pero no bloqueante
- Pre-test de 3 preguntas: si pasa, salta la leccion
- "He leido esta leccion" disponible desde el primer click, sin obligar a scrollear el HTML completo

---

### A3. La migracion one-shot corrompe semanticamente el estado
**Agentes:** Pedagogo, Contrarian, Arquitecto Tecnico, Voz del Usuario (4/6)

El script auto-completa lecciones para celdas ya desbloqueadas. Adrian nunca leyo esas lecciones — el sistema las marca como leidas. Esto:
1. Falsea el contrato del sistema (completada = leida)
2. No es idempotente: si corre dos veces, falla por constraint UNIQUE
3. No distingue "leida en este release" de "auto-completada por migracion"
4. Confunde a Adrian: "el sistema cree que lei algo que no lei"

**Alternativas:**
- No migrar — dejar que Adrian lea las lecciones atrasadas (decision pedagogicamente correcta)
- Migrar con campo `source: 'migration'` en `lesson_completions` para distinguir del flujo normal
- Migrar pero mostrar banner "estas lecciones se marcaron como completadas automaticamente — puedes releerlas"
- Hacer el script idempotente con `ON CONFLICT DO NOTHING`

---

### A4. El testing excluye deliberadamente las partes mas fragiles del sistema
**Agentes:** Pedagogo, Contrarian, Arquitecto Tecnico (3/6)

El PRD dice explicitamente: no testear HTML generado, no testear script de migracion, no testear frontend. Estas son exactamente las piezas con mayor probabilidad de falla en produccion:
- HTML con simbolos GD&T rotos o markup invalido
- Migracion que falla silenciosamente a mitad de ejecucion
- Boton "He leido" que no dispara el POST correcto

**Lo que el PRD deberia agregar:**
- Validacion HTML (al menos bien formado y simbolos renderizados)
- Test de migracion con estado conocido en DB de staging
- Test E2E minimo: click boton → POST → `GET /api/state` refleja cambio

---

### A5. Las lecciones pasivas tienen retension deficiente para contenido tecnico denso
**Agentes:** Pedagogo, Primeros Principios, Voz del Usuario (3/6)

GD&T es conceptualmente denso: simbolos, Feature Control Frames, referencias de datum, Bonus Tolerance con condiciones. La lectura pasiva de HTML tiene retencion ~10-30%. Sin procesamiento activo (preguntas intercaladas, ejemplos interactivos, ejercicios de reconocimiento de simbolos), el alumno puede leer y olvidar el 70% antes de llegar al ejercicio.

**Esto no invalida las lecciones — las hace insuficientes en su forma actual.**

**Opciones minimas sin over-engineering:**
- 1-2 preguntas de reconocimiento al final ("identifica el simbolo de planicidad en esta imagen")
- Glosario con hover-tooltip dentro de los ejercicios (no bloquea, solo apoya)
- Flujo inverso: ejercicio → fallo → mini-leccion contextual → reintento

---

## Tier B — Consenso Medio (2 agentes)

### B1. Redundancia no resuelta: Bonus Tolerance en F2 y en Posicion
**Agentes:** Contrarian, Estratega de Contenido (2/6)

Fundamentals II introduce Bonus Tolerance como concepto. Leccion de Posicion la repite con ejemplos. El PRD no define si F2 hace introduccion superficial (y Posicion la profundiza) o si ambas la cubren al mismo nivel. Sin esa distincion, el alumno percibe repeticion innecesaria en la lectura mas densa del curso.

**Decision que el PRD debe explicitar:** F2 = Bonus Tolerance a nivel "existe y se calcula asi"; Posicion = "cuando y como se aplica en localizacion con agujeros flotantes".

---

### B2. Datum: F2 lo introduce nominalmente, Paralelismo lo profundiza — el salto no esta preparado
**Agentes:** Contrarian, Estratega de Contenido (2/6)

F2 menciona datum como concepto. Paralelismo lo explica a fondo (datum reference frame primario/secundario/terciario). Pero un alumno que leyO F2 y llego a Paralelismo no tiene senales de que el concepto que "ya vio" va a reaparecer con mayor complejidad. El salto parece ruptura, no profundizacion.

**Solucion minima:** En F2, agregar: "El concepto de Datum se profundizara en la Leccion de Paralelismo". En Paralelismo, agregar: "Esto es lo que se vio en F2 y lo que agregamos ahora".

---

### B3. El contenido generado por Claude no tiene proceso de auditoria tecnica
**Agentes:** Contrarian, Estratega de Contenido (2/6)

Claude lee PDFs de AAMC y genera HTML. ASME Y14.5-2018 es normativa, no pedagogica. Si Claude simplifica, interpola o malinterpreta una definicion para mayor claridad, el alumno aprende algo que "parece oficial" pero tiene errores de norma.

**Riesgo especifico:** Datum Reference Frame, RFS (Regardless of Feature Size), y Bonus Tolerance son conceptos donde simplificaciones inocentes generan malentendidos graves en aplicacion real.

**Lo que falta en el PRD:** Quien revisa el HTML antes del commit. Debe ser Adrian leyendo contra el PDF fuente — no es suficiente con "Adrian revisa en el navegador".

---

### B4. Los ejemplos de manufactura en troqueles pueden ser ficcion pedagogica
**Agentes:** Primeros Principios, Estratega de Contenido (2/6)

El PRD promete ejemplos "aplicados a troqueles de embutido calibre 26". Pero los PDFs fuente (AAMC) son genericos. Claude generara ejemplos que suenen plausibles pero pueden no reflejar tolerancias reales en las piezas de Peltre Nacional.

**Consecuencia:** Si el ejemplo dice "cavidad con tolerancia +/-0.05mm" y en la fabrica real las tolerancias son +/-0.2mm por capacidad de troqueles, la leccion crea expectativas incorrectas sobre que es "normal" en manufactura de peltre.

**Lo que falta:** Adrian deberia aportar 1-2 casos reales de su proceso (dimensiones, tolerancias, controles) como input para Claude antes de generar el HTML.

---

### B5. Adrian aprende mejor haciendo que leyendo — el flujo es contra su estilo cognitivo
**Agentes:** Primeros Principios, Voz del Usuario (2/6)

Adrian aprendio manufactura en fabrica: ver-hacer-iterar, no leer-luego-hacer. El flujo del PRD (leccion HTML → boton → ejercicio) invierte su patron natural. Un flujo alternativo (ejercicio → fallo → micro-leccion contextual → reintento) seria mas efectivo para su perfil.

**Esto no es bloqueante para la implementacion actual**, pero es una hipotesis pedagogica que el PRD adopta sin cuestionar.

---

### B6. El numero 7 de lecciones no esta justificado desde cero
**Agentes:** Pedagogo, Primeros Principios (2/6)

"7 lecciones" emerge de mapear 1-a-1 los modulos AAMC a lecciones. Pero eso es estructura del libro, no estructura del aprendizaje. Un analisis de frecuencia de terminos en los ejercicios existentes podria revelar que 3-4 conceptos nucleares explican el 80% de los errores de Adrian, y que 7 lecciones es exceso.

**Pregunta que el PRD no responde:** ¿Se analizo cuales terminos generan mas friccion en los ejercicios actuales antes de decidir el numero y tema de lecciones?

---

## Tier C — Outliers Unicos (1 agente, alta densidad de ideas)

### C1. lessons-config.json desincronizado del HTML puede bloquear al usuario indefinidamente
**Agente:** Arquitecto Tecnico

Si se agrega una leccion a lessons-config.json pero no se genera el HTML correspondiente, `GET /api/state` devuelve `lesson_required: 'nueva-leccion'`, el frontend busca `/lessons/nueva-leccion.html` y recibe 404. El usuario queda bloqueado sin error comprensible. Se necesita validacion en CI: cada `lesson_id` en config tiene su HTML correspondiente.

### C2. innerHTML con HTML no validado = superficie de XSS
**Agente:** Arquitecto Tecnico

Los archivos HTML generados por Claude se inyectan via `innerHTML`. Si un archivo .html tiene markup invalido o contenido no esperado (por error de generacion o edicion manual), hay riesgo de ejecucion de scripts. Alternativa: sanitizar con DOMPurify antes de `innerHTML`, o servir via endpoint del servidor en lugar de fetch directo a estaticos.

### C3. Endpoint POST /api/lesson/:id/complete no esta especificado en el PRD
**Agente:** Arquitecto Tecnico

El PRD menciona la ruta pero no especifica: tipo de body (JSON vs. FormData), validacion de que el lesson_id existe, respuesta en caso de ya completada (200 idempotente vs. 409 conflict), ni manejo de error si el usuario envia un lesson_id invalido.

### C4. El problema puede ser lexico, no conceptual — soluciones distintas para cada uno
**Agente:** Primeros Principios

"Las preguntas presuponen vocabulario que el estudiante no tiene" puede significar dos cosas distintas:
- Problema lexico: no sabe que significa "tolerancia bilateral" → solucion minima: tooltip/glosario en el ejercicio
- Problema conceptual: no entiende por que existe la tolerancia bilateral → requiere leccion explicativa

Sin diagnostico de cuales ejercicios fallO Adrian y por que, el PRD asume que el problema es conceptual y sobre-ingenia la solucion (7 lecciones HTML) cuando podria resolverse con glosario inline.

### C5. Sin estimacion de tiempo por bloque, Adrian no puede planear sesiones de estudio
**Agente:** Voz del Usuario

Director general con tiempo fragmentado: 10-15 minutos entre reuniones. Sin "esta leccion: 8 min + estos ejercicios: 12 min = 20 min total", no puede decidir si iniciar un bloque nuevo. Sesiones incompletas generan friction y abandono.

### C6. Falta mapa visible de todos los temas con estado de progreso
**Agente:** Voz del Usuario

Adrian no puede ver de un vistazo: cuantos temas hay, cuales domina, cuales tienen leccion pendiente, cuales estan bloqueados. El dashboard de celdas cubre esto parcialmente, pero la distincion leccion-pendiente (ambar) vs. bloqueado-por-maestria (gris) puede no ser suficientemente clara.

### C7. Las norma ASME evoluciona, las lecciones estaticas no
**Agente:** Contrarian

ASME Y14.5-2018 ya tiene revision (R2024). Si hay una R2026 o un cambio de interpretacion relevante, las 7 lecciones HTML comprometidas al repo quedan desactualizadas sin mecanismo de actualizacion. El PRD no menciona versioning ni plan de mantenimiento de contenido.

### C8. Falta narrativa "por que existe GD&T" al inicio de F1
**Agente:** Estratega de Contenido

F1 cubre limitaciones de metodos actuales pero no la pregunta-ancla: "¿que problema especifico resolvia GD&T que el dimensionamiento convencional no podia?" Sin esa narrativa motivacional, las 7 lecciones son reglas sin contexto de por que existen.

### C9. El orden L3→L7 sigue estructura del libro, no workflow real de diseno
**Agente:** Estratega de Contenido

Forma → Orientacion → Localizacion es el orden de ASME. Pero en diseno real de troqueles, un ingeniero decide primero localizacion (donde va el agujero) y luego orientacion (perpendicularidad del agujero al plano). El orden de aprendizaje puede no reflejar el orden de aplicacion.

### C10. Falta leccion o seccion sobre "cuando GD&T no aplica"
**Agente:** Estratega de Contenido

Un alumno que aprende solo aplicaciones puede sobre-especificar (GD&T innecesario = costo mayor, inspeccion mas cara). Las 7 lecciones ensenen aplicacion pero no juicio critico sobre trade-offs.

### C11. RFS (Regardless of Feature Size) no cubierto en F2 — produce confusion en Posicion
**Agente:** Estratega de Contenido

F2 cubre Bonus Tolerance pero no su excepcion (RFS). Cuando el alumno llega a Posicion y ve casos donde Bonus NO aplica (RFS), la sorpresa no esta preparada. F2 deberia mencionar "Bonus Tolerance tiene una excepcion importante que veras en Posicion".

### C12. Simbolos GD&T en HTML: Unicode vs. SVG no especificado
**Agente:** Estratega de Contenido

Los simbolos GD&T (planicidad ◻, perpendicularidad ⊥, circulo de diametro ⌀, etc.) pueden renderizarse como Unicode, SVG o imagen PNG. El PRD no especifica cual usar. Unicode puede aparecer como cuadros rotos en algunos entornos; PNG no escala; SVG es correcto pero requiere decision explicita.

---

## Resumen Ejecutivo: Top 5 Decisiones a Revisar

| # | Decision | Tier | Impacto |
|---|----------|------|---------|
| 1 | **Reemplazar boton "He leido" con validacion minima** (scroll, tiempo, o 1 pregunta trivial) | A | Salva el modelo pedagogico completo |
| 2 | **Redisenar migracion**: idempotente + distinguir `source: 'migration'` + mostrar a Adrian que se auto-completo | A | Evita corrupcion semantica del estado |
| 3 | **Agregar auditoria de contenido HTML**: Adrian revisa cada leccion contra el PDF fuente antes del commit, con checklist de simbolos y ejemplos | A+B | Calidad tecnica del material |
| 4 | **Ampliar testing**: validacion HTML bien-formado, test de migracion con estado conocido, 1 test E2E del flujo completo | A | Cubre las partes mas fragiles |
| 5 | **Evaluar gate suave vs. duro**: para un usuario unico adulto motivado, recomendacion fuerte puede ser suficiente; si se mantiene gate duro, agregar pre-test de 3 preguntas para saltar la leccion | A | Reduce friccion sin sacrificar pedagogia |

---

## Decisiones que el PRD puede mantener sin cambios

- **Schema `lesson_completions`**: simple, correcto, UNIQUE constraint adecuado
- **`GET /api/state` con `lesson_required`**: diseno limpio, resolucion en servidor
- **7 lecciones mapeadas a modulos AAMC**: estructura razonable si se valida con diagnostico de errores reales de Adrian
- **Fan-out simultaneo de 5 lecciones de control**: correcto, preserva autonomia del alumno
- **Gate solo en L1, no en L2**: decision correcta, no sobre-ingenia la progresion por maestria

---

*Generado via stochastic-consensus — 6 agentes independientes — 2026-05-24*
