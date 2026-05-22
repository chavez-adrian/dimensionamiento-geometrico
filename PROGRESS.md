# Estado del proyecto — 22 mayo 2026

## Lo que está funcionando en producción

URL: https://dimensionamiento-geometrico.onrender.com (Render free tier, wake-up ~30s)

- **Glosario**: 93 términos de Fundamentos en orden pedagógico (16 capas A–P), navegación por tarjeta, filtro por capa, símbolo GD&T, definición técnica + coloquial + ejemplo por troquel
- **Dashboard**: sección Fundamentos (prerequisito) + grilla 5×3 de Controles Geométricos con candados visuales
- **Ejercicios**: Fundamentos L1+L2, 5 Controles Geométricos L1+L2, anti-repetición, shuffle de opciones
- **Banco L3**: 22 escenarios cargados en Neon con `active=FALSE` — pendientes de validación CIDESI

## Issues cerrados (todo el trabajo hasta hoy)

| # | Título |
|---|---|
| #2–#5 | Infraestructura + 5 controles L1+L2 |
| #8–#13 | Fundamentos + glosario + dashboard |
| #14 | `computeUnlocks` — Progresión por Maestría unificada |
| #15 | `domain.js` — constantes canónicas de dominio |
| #16 | `StateStore` como único seam de DB (factory pattern) |
| #17 | `ExerciseGenerator` — selección separada de generación |

## Issues abiertos

| # | Título | Bloqueante |
|---|---|---|
| #6 | Banco L3 — validación CIDESI | Requiere aprobación de CIDESI |
| #7 | Nivel 3 end-to-end | Bloqueado por #6 |

## Arquitectura actual

```
src/domain.js                 ← constantes del dominio (LEER PRIMERO)
src/state-store.js            ← único seam de DB, factory class
src/knowledge-state-engine.js ← lógica pura: computeUnlocks, processAnswer
src/exercise-generator.js     ← factory createGenerator(stateStore)
src/session-orchestrator.js   ← factory createOrchestrator(stateStore)
src/server.js                 ← entry point: crea StateStore, pasa a factories
public/index.html             ← dashboard + glosario (HTML/CSS/JS vanilla)
data/course-content.json      ← glosario por control (Fundamentos con 93 términos ordenados)
data/exercise-bank-seed.json  ← ejercicios L2 del PDF del curso
data/exercise-bank-nivel3.json← 22 escenarios L3 (pendientes CIDESI)
```

## Neon — tablas

| Tabla | Filas | Estado |
|---|---|---|
| `knowledge_state` | 17 (Fundamentos×2 + controles×15) | ✅ |
| `exercise_bank` | L2 PDF + 22 L3 (active=FALSE) | ✅ |
| `exercise_sessions` | crece con cada ejercicio servido | ✅ |
| `concept_glossary` | 93 términos con 7 columnas de contenido | ✅ |

## Cómo retomar trabajo

1. Leer `CLAUDE.md` — tiene stack, rutas, convenciones y arquitectura de módulos
2. Leer `CONTEXT.md` — glosario del dominio y terminología canónica
3. Leer `docs/adr/` — 7 ADRs con decisiones de arquitectura
4. Issues abiertos en GitHub: solo #6 y #7 quedan, ambos bloqueados por CIDESI

## Siguiente acción cuando se retome

**Si CIDESI validó el banco L3:** Implementar Issue #7 (Nivel 3 end-to-end) con `/tdd` en subagente con contexto fresco. El issue tiene todos los detalles.

**Si se trabaja en features nuevas:** Crear issue con `/to-issues`, implementar con `/tdd` en subagente.
