# Generación dinámica para Niveles 1-2, banco pre-escrito validado para Nivel 3

Los Ejercicios de Niveles 1 y 2 los genera Claude en tiempo real a partir de los PDFs del curso (ASME Y14.5-2018 (R2024)). Los Ejercicios de Nivel 3 vienen de un Banco de Ejercicios pre-escrito y validado por el contacto técnico en CIDESI antes de cargarse al sistema.

La razón es asimétrica: en Nivel 1 y 2 un error de Claude en terminología o concepto básico es detectable y de bajo costo. En Nivel 3, un valor de tolerancia incorrecto para un componente de troquel de embutido calibre 26 se aprendería como correcto sin que el estudiante pudiera detectarlo — el costo es aprender manufactura incorrecta. La validación externa de CIDESI elimina ese riesgo en el nivel donde más importa.

## Consequences

El Banco de Ejercicios de Nivel 3 debe generarse y validarse antes de que el sistema abra ese nivel al estudiante. Esto crea una dependencia de contenido: Nivel 3 no puede lanzarse hasta que CIDESI apruebe los escenarios.
