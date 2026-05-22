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

async function callClaude(term) {
  const prompt = `Eres un experto en GD&T segun ASME Y14.5-2018 (R2024) y en manufactura de articulos de acero esmaltado.

Para el termino de GD&T en espanol: "${term}"

Genera en espanol los siguientes campos:
1. english_name: Nombre oficial en ingles segun ASME Y14.5-2018 (2-5 palabras).
2. abbreviation: Abreviatura oficial en ingles (ej: MMC, LMC, RFS, FOS, FCF, AME, VC, RC, WCB, FIM). Si el termino no tiene abreviatura estandar, usa cadena vacia "".
3. definition: Definicion formal tecnica segun ASME Y14.5-2018 (2-3 oraciones precisas). Si el termino involucra calculos o relaciones matematicas, incluyelas correctamente.
4. coloquial: Explicacion en lenguaje simple para un tecnico de manufactura sin formacion en GD&T (1-2 oraciones, usa analogias cotidianas).
5. example: Ejemplo concreto aplicado a un troquel de embutido en frio para lamina de acero al carbono calibre 26 (espesor 0.457 mm), como los que fabrica Peltre Nacional (empresa mexicana de articulos de acero esmaltado / peltre). Menciona una parte especifica del troquel (punch, dado, placa sujetadora, resortes, guias, descargador, porta-dado). Si el ejemplo involucra calculos numericos, verificalos: para MMC usa el mayor tamano de rasgo externo / menor de interno; VC = MMC + tolerancia geometrica (rasgo externo) o MMC - tolerancia (rasgo interno); Bonus = |tamano actual - MMC|.

Responde SOLO con JSON valido sin texto adicional:
{"english_name": "...", "abbreviation": "...", "definition": "...", "coloquial": "...", "example": "..."}`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }]
  });

  let text = message.content[0].text.trim();
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  return JSON.parse(text);
}

async function generateDefinition(term) {
  try {
    return await callClaude(term);
  } catch (err) {
    console.error(`  Retry for "${term}" after error: ${err.message}`);
    return await callClaude(term);
  }
}

async function run() {
  const client = await pool.connect();
  try {
    for (let i = 0; i < terminos.length; i++) {
      const term = terminos[i];
      const position = i + 1;
      const { layer_id, layer_name } = getLayer(position);

      let english_name = null;
      let abbreviation = null;
      let definition = null;
      let coloquial = null;
      let example = null;

      try {
        const result = await generateDefinition(term);
        english_name = result.english_name;
        abbreviation = result.abbreviation;
        definition = result.definition;
        coloquial = result.coloquial;
        example = result.example;
      } catch (err) {
        console.error(`[${position}/93] ERROR generating definition for "${term}": ${err.message}`);
      }

      await client.query(
        `INSERT INTO concept_glossary (term, pedagogical_order, layer_id, layer_name, english_name, abbreviation, definition, coloquial, example)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (term) DO UPDATE SET
           english_name = EXCLUDED.english_name,
           abbreviation = EXCLUDED.abbreviation,
           definition = EXCLUDED.definition,
           coloquial = EXCLUDED.coloquial,
           example = EXCLUDED.example`,
        [term, position, layer_id, layer_name, english_name, abbreviation, definition, coloquial, example]
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
