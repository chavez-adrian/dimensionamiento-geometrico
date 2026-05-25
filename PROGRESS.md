# Estado del proyecto — 25 mayo 2026

URL: https://dimensionamiento-geometrico.onrender.com (Render free tier, wake-up ~30s)

## Lo que está funcionando en producción

- **Glosario**: 93 términos en orden pedagógico (16 capas A–P), filtro por capa, símbolo GD&T, definición técnica + coloquial + ejemplo
- **Dashboard**: Fundamentos (prerequisito) + grilla 5×3 de Controles Geométricos con estados visuales
- **Ejercicios**: Fundamentos L1+L2, 5 Controles L1+L2, anti-repetición, shuffle de opciones
- **Banco L3**: 22 escenarios en Neon con `active=FALSE` — pendientes de validación CIDESI
- **Lecciones (gate suave)**: 7 lecciones como prerequisito de cada bloque, celdas ámbar, modal de bypass, IntersectionObserver, completions en DB

## Issues cerrados

| # | Título |
|---|---|
| #2–#5 | Infraestructura + 5 controles L1+L2 |
| #8–#13 | Fundamentos + glosario + dashboard |
| #14–#17 | Refactor: computeUnlocks, domain.js, StateStore seam, ExerciseGenerator |
| #18 | Lecciones HTML como prerequisito de ejercicios GD&T |
| #20 | lesson_completions table, StateStore methods, ADR 0008 |
| #21 | API routes de Lecciones |
| #22 | Frontend: celdas ámbar, lesson-view, IntersectionObserver, modal de bypass |

## Issues abiertos

| # | Título | Estado |
|---|---|---|
| #19 | Contenido HTML 7 Lecciones [HITL] | Bloqueado — requiere casos reales de Peltre Nacional de Adrián |
| #6 | Banco L3 — validación CIDESI | Bloqueado por CIDESI |
| #7 | Nivel 3 end-to-end | Bloqueado por #6 |

## Siguiente acción

**Para #19 (HITL):** Adrián aporta 1-2 casos reales de manufactura por lección (pieza, dimensión nominal, tolerancia, control GD&T aplicado). Con ese input se genera el HTML de las 7 lecciones en sesión de Claude Code.

**Para #6/#7:** Esperar validación de CIDESI del banco L3.
