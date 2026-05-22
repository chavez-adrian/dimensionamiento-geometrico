require('dotenv').config();
const { Pool } = require('pg');
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const courseContent = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'data', 'course-content.json'), 'utf8')
);

const terminos = courseContent.Fundamentos.terminos;
const layers = courseContent.Fundamentos.layers;

function getLayer(position1indexed) {
  for (const layer of layers) {
    if (position1indexed >= layer.range[0] && position1indexed <= layer.range[1]) {
      return { layer_id: layer.id, layer_name: layer.name };
    }
  }
  return { layer_id: 'Z', layer_name: 'Desconocida' };
}

async function generateDefinition(term) {
  const prompt = `Eres un experto en GD&T segun ASME Y14.5-2018 (R2024) y en manufactura de articulos de acero esmaltado.

Para el termino de GD&T: "${term}"

Genera en espanol:
1. definition: Definicion formal tecnica segun ASME Y14.5-2018 (2-3 oraciones, lenguaje preciso de norma).
2. coloquial: Explicacion en lenguaje simple que cualquier tecnico de manufactura sin formacion en GD&T entienda (1-2 oraciones, sin jerga, usa analogias cotidianas si ayuda).
3. example: Ejemplo concreto aplicado a un troquel de embutido en frio para lamina de acero al carbono calibre 26, como los que usa Peltre Nacional (empresa mexicana fabricante de articulos de acero esmaltado). Menciona una parte especifica del troquel (punch, dado, placa sujetadora, resortes, guias, descargador) y un valor numerico realista si aplica.

Responde SOLO con JSON valido, sin texto adicional:
{"definition": "...", "coloquial": "...", "example": "..."}`;

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }]
  });

  let text = message.content[0].text.trim();
  // Strip markdown code fences if present
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  return JSON.parse(text);
}

async function run() {
  const client = await pool.connect();
  try {
    for (let i = 0; i < terminos.length; i++) {
      const term = terminos[i];
      const position = i + 1;
      const { layer_id, layer_name } = getLayer(position);

      let definition = null;
      let coloquial = null;
      let example = null;

      try {
        const result = await generateDefinition(term);
        definition = result.definition;
        coloquial = result.coloquial;
        example = result.example;
      } catch (err) {
        console.error(`[${position}/93] ERROR generating definition for "${term}": ${err.message}`);
      }

      await client.query(
        `INSERT INTO concept_glossary (term, pedagogical_order, layer_id, layer_name, definition, coloquial, example)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (term) DO UPDATE SET
           definition = EXCLUDED.definition,
           coloquial = EXCLUDED.coloquial,
           example = EXCLUDED.example,
           pedagogical_order = EXCLUDED.pedagogical_order`,
        [term, position, layer_id, layer_name, definition, coloquial, example]
      );

      console.log(`[${position}/93] ${term}`);
    }
    console.log('Seed complete: concept_glossary populated.');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => { console.error(err); process.exit(1); });
