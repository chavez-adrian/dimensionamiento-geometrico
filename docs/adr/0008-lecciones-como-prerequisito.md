# ADR 0008 — Lecciones HTML como prerequisito de ejercicios GD&T

**Estado:** Aceptado  
**Fecha:** 2026-05-25

## Contexto

El usuario (Adrian) aprende GD&T a traves de ejercicios adaptativos. Sin embargo, cada bloque de conocimiento asume familiaridad con conceptos que no se han explicado explicitamente en la herramienta. Antes de que Adrian practique ejercicios de Planicidad, por ejemplo, debe haber leido material explicativo sobre ese control geometrico.

La pregunta de diseno es: ¿el sistema debe **bloquear** el acceso al ejercicio hasta que la leccion este completada (gate duro), o debe **advertir** pero permitir el bypass (gate suave)?

## Opciones consideradas

**Gate duro (bloqueo server-side):** El servidor rechaza `POST /api/exercise/next` si la leccion correspondiente no esta completada.

- Pro: garantiza que el usuario leyera antes de practicar.
- Contra: penaliza al usuario si ya conoce el material, rompe el flujo si el HTML de leccion no existe aun, agrega complejidad en el servidor.

**Gate suave (advertencia + bypass):** El frontend muestra estado ambar (`lesson-required`) y un modal de confirmacion, pero el servidor no bloquea. El usuario puede ignorar la advertencia.

- Pro: respeta la autonomia de un adulto motivado con conocimiento previo.
- Pro: el sistema funciona aunque los HTMLs de leccion no existan aun (issue #19 es HITL).
- Pro: simplicidad — no hay logica de gates en la capa de ejercicios.
- Contra: el usuario puede saltar lecciones sin consecuencia tecnica.

## Decision

**Gate suave.** No se bloquea el ejercicio desde el servidor si la leccion no esta completada.

## Razonamiento

1. **Usuario unico adulto motivado.** Adrian es el unico usuario. Ya tiene conocimiento previo de manufactura y troqueles. Forzarlo a leer puede ser contraproducente.
2. **Autonomia de aprendizaje.** El objetivo de la herramienta es reforzar conocimiento, no gatekeepear contenido. El gate suave respeta esa autonomia.
3. **Simplicidad operativa.** El issue #19 (contenido HTML de las lecciones) es trabajo humano que aun no esta hecho. Con gate duro, el sistema quedaria inutilizable hasta que existan todos los HTMLs. Con gate suave, los ejercicios siguen funcionando.
4. **Consistencia con el diseno existente.** El sistema ya usa logica de desbloqueo progresivo en `knowledge_state`. El gate suave complementa ese sistema sin duplicar logica de control de acceso.

## Consecuencias

- Se agrega tabla `lesson_completions` para persistir estado de lecciones.
- El campo `lesson_required` en `GET /api/state` informa al frontend que celda tiene leccion pendiente.
- El frontend es responsable de mostrar el estado ambar y el modal de confirmacion.
- El servidor NO valida `lesson_completions` en `POST /api/exercise/next`.
- Al arrancar, el servidor emite `console.warn` si falta algun HTML de leccion, sin crashear.
