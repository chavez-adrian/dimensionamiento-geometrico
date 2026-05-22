require('dotenv').config();
const { Pool } = require('pg');
const Anthropic = require('@anthropic-ai/sdk');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CRITICAL_ORDERS = [8, 18, 19, 20, 29, 34, 41, 51, 52, 56, 57, 62, 63, 64, 65, 67, 76, 77];

function buildPrompt(term, layer_id, layer_name) {
  return `Eres un experto en GD&T segun ASME Y14.5-2018 (R2024) y en manufactura de troqueles de embutido en frio.

Para el termino: "${term}" (Capa ${layer_id}: ${layer_name})

Genera en espanol:
1. english_name: Nombre oficial en ingles segun ASME Y14.5-2018 (2-6 palabras, solo el nombre, sin parentesis ni notas).
2. abbreviation: Abreviatura oficial de ASME Y14.5-2018 unicamente. Si no tiene abreviatura oficial estandar, devuelve cadena vacia "".
3. definition: Definicion formal tecnica segun ASME Y14.5-2018 (2-3 oraciones). Si involucra formulas, usa las correctas:
   - VC rasgo EXTERNO (pin/shaft/punch) = MMC + tolerancia geometrica
   - VC rasgo INTERNO (agujero/dado) = MMC - tolerancia geometrica
   - Bonus Tolerance = |tamano actual AME - MMC| (cuando modificador es MMC) o |tamano actual - LMC| (cuando es LMC)
   - MMB rasgo interno = MMC del datum - tolerancia geometrica del datum
   - IB (Inner Boundary) rasgo externo = LMC - tolerancia geometrica total en LMC
   - IB rasgo interno = MMC - tolerancia geometrica
   - OB (Outer Boundary) rasgo externo = MMC + tolerancia geometrica (= VC cuando usa MMC)
   - OB rasgo interno = LMC + tolerancia geometrica
   - Datum shift = tamano real del rasgo datum - MMB (no dividir entre 2; es valor diametral)
4. coloquial: Explicacion en lenguaje simple (1-2 oraciones, sin jerga GD&T, analogia cotidiana si ayuda).
5. example: Ejemplo concreto aplicado a un troquel de embutido en frio para lamina de acero al carbono calibre 26 (espesor 0.457 mm), como los de Peltre Nacional (empresa mexicana de articulos esmaltados). REGLAS CRITICAS para el ejemplo:
   - Menciona una parte especifica del troquel: punch, dado, placa sujetadora, guias, descargador, porta-dado
   - Clearance punch-dado para calibre 26: SIEMPRE entre 0.046 mm y 0.069 mm por lado (10-15% de 0.457 mm). NUNCA usar 0.48-0.51 mm.
   - Cilindricidad NUNCA puede tener modificador MMC o LMC (es tolerancia de forma, siempre RFS). Si el ejemplo involucra cilindricidad, no aplicar MMC.
   - Si calculas VC, Bonus, IB, OB o datum shift, verifica la formula segun el tipo de rasgo (externo vs interno) antes de escribir el valor.
   - Usa valores numericos realistas: diametros de punch tipicos 20-150 mm, tolerancias geometricas 0.005-0.050 mm para troquel de precision.

Responde SOLO con JSON valido sin texto adicional:
{"english_name": "...", "abbreviation": "...", "definition": "...", "coloquial": "...", "example": "..."}`;
}

async function generateWithRetry(term, layer_id, layer_name) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const msg = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{ role: 'user', content: buildPrompt(term, layer_id, layer_name) }],
      });
      const text = msg.content[0].text.trim();
      // Strip markdown code fences if present
      const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
      return JSON.parse(clean);
    } catch (e) {
      if (attempt === 2) throw e;
      console.log(`  Retrying after parse error: ${e.message}`);
    }
  }
}

async function main() {
  const client = await pool.connect();
  try {
    // Fetch current data for the 18 critical terms
    const placeholders = CRITICAL_ORDERS.map((_, i) => `$${i + 1}`).join(', ');
    const { rows } = await client.query(
      `SELECT pedagogical_order, term, layer_id, layer_name
       FROM concept_glossary
       WHERE pedagogical_order IN (${placeholders})
       ORDER BY pedagogical_order`,
      CRITICAL_ORDERS
    );

    console.log(`Found ${rows.length} terms to regenerate.`);

    for (let i = 0; i < rows.length; i++) {
      const { pedagogical_order, term, layer_id, layer_name } = rows[i];
      console.log(`[${i + 1}/${rows.length}] #${pedagogical_order} -- ${term}`);

      const data = await generateWithRetry(term, layer_id, layer_name);

      await client.query(
        `UPDATE concept_glossary
         SET english_name=$1, abbreviation=$2, definition=$3, coloquial=$4, example=$5
         WHERE pedagogical_order=$6`,
        [data.english_name, data.abbreviation, data.definition, data.coloquial, data.example, pedagogical_order]
      );
      console.log(`  -> updated`);
    }

    console.log('All 18 critical terms regenerated.');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(e => { console.error(e.message); process.exit(1); });
