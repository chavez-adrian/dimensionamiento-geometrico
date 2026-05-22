# dimensionamiento-geometrico

Herramienta de aprendizaje adaptativo GD&T (ASME Y14.5-2018 (R2024)) para que Adrián Chávez domine la especificación de tolerancias geométricas aplicadas al diseño de troqueles de embutido de lámina de acero al carbono calibre 26 (Peltre Nacional SA de CV).

## Stack

- **Runtime:** Node.js v24, Express
- **DB:** Neon Postgres (`gdt_learning`) — `DATABASE_URL` en `.env`
- **AI:** Anthropic SDK — `ANTHROPIC_API_KEY` en `.env`
  - Generación L1/L2: `claude-haiku-4-5-20251001`
  - Evaluación L3 (respuesta abierta): `claude-sonnet-4-6`
  - Contenido de glosario generado con: `claude-sonnet-4-6`
- **Deploy:** Render free tier — https://dimensionamiento-geometrico.onrender.com
- **Repo:** https://github.com/chavez-adrian/dimensionamiento-geometrico (rama `master`)

## Rutas críticas

```
Node:    C:\Program Files\nodejs\node.exe
Git:     $env:PATH += ";C:\Program Files\Git\bin"  (PowerShell)
PDFs:    C:\Users\chave\Dropbox\PELTRE NACIONAL\2.0 PRODUCCIÓN\DOCUMENTACIÓN TÉCNICA\EMBUTIDO\GD&T Basico\
.env:    C:\Users\chave\OneDrive\Documents\_Claude\dimensionamiento-geometrico\.env
```

## Correr tests

```powershell
Set-Location "C:\Users\chave\OneDrive\Documents\_Claude\dimensionamiento-geometrico"
& "C:\Program Files\nodejs\node.exe" --test test\knowledge-state-engine.test.js
& "C:\Program Files\nodejs\node.exe" --test test\exercise-generator.test.js
& "C:\Program Files\nodejs\node.exe" --test test\server.test.js
```

Los tests de `exercise-generator` llaman a la API de Anthropic — son de integración y tardan ~30s.

## Schema Neon

```
knowledge_state   PRIMARY KEY (user_id, control, nivel)
exercise_bank     id SERIAL PK, control, nivel, type, anchor, content JSONB, source, active
exercise_sessions id SERIAL PK, user_id, control, nivel, question, answered_at
concept_glossary  id SERIAL PK, term UNIQUE, pedagogical_order, layer_id, layer_name,
                  english_name, abbreviation, symbol, definition, coloquial, example
```

Usuario único: `'adrian'`. No hay autenticación.

## Dominio — leer antes de tocar código

- `CONTEXT.md` — glosario completo del dominio (Fundamentos, Celda de Conocimiento, Progresión por Maestría, terminología canónica)
- `docs/adr/` — 7 ADRs con las decisiones de arquitectura

**Terminología crítica** (no sustituir):
- Flatness → **Planicidad** (no "Planitud")
- Cylindricity → **Cilindricidad** (no "Cilindridad")
- Circularity → **Circularidad** (no "Redondez")
- ASME Y14.5-**2018 (R2024)** (no "2024" a secas)

## Estado actual del proyecto

| Módulo | Estado |
|---|---|
| Infraestructura Express + Neon + Render | ✅ |
| 5 Controles Geométricos L1+L2 | ✅ |
| Banco L3 (22 escenarios, `active=FALSE`) | ✅ pendiente CIDESI |
| Fundamentos L1+L2 + fan-out + anti-repetición | ✅ |
| Orden pedagógico 16 capas (A–P) | ✅ |
| Glosario concept_glossary (93 términos, Sonnet) | ✅ |
| Vista glosario — tarjeta + filtro capa | ✅ |
| Nivel 3 end-to-end | 🔒 bloqueado por CIDESI |

## Arquitectura de módulos (tras refactor #14–#17)

### Constantes del dominio

`src/domain.js` es la fuente canónica de constantes:
- `GEOMETRIC_CONTROLS` — los 5 controles geométricos
- `PREREQUISITE` — `'Fundamentos'`
- `ALL_CONTROLS` — `[PREREQUISITE, ...GEOMETRIC_CONTROLS]` (6 elementos)
- `USER_ID` — `'adrian'`

### Factory pattern

`session-orchestrator.js` y `exercise-generator.js` son ahora factory functions. `server.js` crea el `StateStore` y lo pasa a ambos:

```js
const stateStore = new StateStore(process.env.DATABASE_URL);
const { nextExercise, submitAnswer } = require('./session-orchestrator')(stateStore);
```

### StateStore como único seam de DB

`StateStore` es el único módulo que habla con Postgres. Métodos públicos:
- `loadState(userId)` — rows crudas
- `saveState(userId, control, nivel, cell)` — UPDATE
- `loadKnowledgeState(userId)` → estado como mapa anidado `{ control: { nivel: cell } }`
- `saveCell(userId, control, nivel, cell)` → UPDATE
- `getSeenBankIds(userId, control, nivel)` → array de IDs
- `getSeenQuestions(userId, control, nivel)` → array de strings
- `getUnseenNivel2(control, nivel, seenIds)` → row del banco o null

### ExerciseGenerator: selectFromBank vs generateDynamic

Dentro de `exercise-generator.js`:
- `selectFromBank(control, nivel, seenIds)` — banco sin Claude
- `generateDynamic(control, nivel, opts)` — Claude Haiku, sin DB
- `generateForControl` compone ambas (banco primero, dinámico como fallback)

### computeUnlocks

`computeUnlocks(state, control, nivel)` reemplaza las antiguas `shouldUnlockNext` y `getFanOutControls`:

```js
{ nextNivel: number | null, fanOut: string[] }
```

### Tests con stateStore fake

Para testear orchestrator o generator sin Neon:

```js
const fakeStore = { getUnseenNivel2: async () => myFakeRow, ... };
const gen = createGenerator(fakeStore);
```

## Convenciones de desarrollo

- **TDD estricto** — escribir tests en RED antes de implementar (ver `/tdd` skill)
- **Subagentes de uno en uno** — no lanzar en paralelo para evitar conflictos de contexto
- **Sin `git add .`** — siempre stagear archivos por nombre
- **Sin comentarios** en código salvo WHY no obvio
- **Shuffle obligatorio** en ejercicios de opción múltiple — usar `shuffleOptions()` en `exercise-generator.js` al retornar cualquier ejercicio generado o del banco

## Scripts de mantenimiento

```
src/migrate.js              — CREATE TABLE IF NOT EXISTS (todas las tablas)
src/seed.js                 — Seed knowledge_state para user 'adrian' (17 filas)
src/seed-nivel2.js          — Carga exercise-bank-seed.json en exercise_bank
scripts/seed-glossary.js    — Genera/regenera concept_glossary con Claude Sonnet
scripts/fix-symbols-case.js — Corrige letras circuladas minúscula → mayúscula en concept_glossary
scripts/migrate-planitud.js — Migración histórica Planitud → Planicidad (ya aplicada)
scripts/migrate-fundamentos.js — Migración histórica seed Fundamentos (ya aplicada)
```

## Convenciones de símbolos GD&T

Los símbolos circulados ASME son siempre **mayúsculas**: Ⓜ Ⓛ Ⓟ Ⓣ Ⓘ Ⓕ
Si encuentras ⓜ ⓛ ⓟ ⓣ ⓘ ⓕ en cualquier campo de texto → ejecutar `fix-symbols-case.js`.

El clearance punch-dado para lámina calibre 26 en embutido en frío es **0.046–0.069 mm por lado** (10–15% de 0.457 mm). Nunca usar 0.48–0.51 mm.
