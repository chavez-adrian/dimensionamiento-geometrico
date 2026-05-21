# Neon Postgres como StateStore, no archivo JSON en servidor

El KnowledgeState del estudiante se persiste en Neon Postgres, no en archivo local ni en memoria del servidor.

Render free tier suspende el servicio tras 15 minutos de inactividad y reinicia el proceso en cada wake-up. Cualquier estado en memoria o archivo local se pierde en cada ciclo. Como el objetivo del sistema es aprendizaje espaciado entre sesiones, perder el KnowledgeState eliminaría la Progresión por Maestría — el estudiante recomenzaría desde cero en cada sesión.

Neon ya está en uso en peltre-knowledge-base bajo la misma cuenta, tiene free tier activo y conexión desde Render establecida. El costo marginal de agregar este proyecto es cero.
