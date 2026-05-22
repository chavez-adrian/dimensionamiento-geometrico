require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function loadGlossary(control) {
  try {
    const content = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../data/course-content.json'), 'utf8')
    );
    return content[control] || {};
  } catch {
    return {};
  }
}

function getFundamentosLayerName(layers, position) {
  if (!layers) return '';
  const layer = layers.find(l => position >= l.range[0] && position <= l.range[1]);
  return layer ? layer.name : '';
}

function getFundamentosFocusTerm(glossary, seenQuestions) {
  const terminos = glossary.terminos || [];
  const coveredCount = Math.min(seenQuestions.length, terminos.length - 1);
  return {
    focusTerm: terminos[coveredCount],
    recentTerms: terminos.slice(Math.max(0, coveredCount - 5), coveredCount),
    layerName: getFundamentosLayerName(glossary.layers, coveredCount + 1)
  };
}

async function generateNivel1(control, opts) {
  const glossary = loadGlossary(control);
  const seenQuestions = (opts && opts.seenQuestions) || [];

  let prompt;

  if (control === 'Fundamentos') {
    const { focusTerm, recentTerms, layerName } = getFundamentosFocusTerm(glossary, seenQuestions);
    const recentContext = recentTerms.length > 0
      ? `\nConceptos previos que el estudiante ya conoce (usa como contexto o distractores si aplica): ${recentTerms.join(', ')}`
      : '';
    const seenHint = seenQuestions.length > 0
      ? `\nNO repitas preguntas similares a estas ya vistas: ${seenQuestions.join(' | ')}`
      : '';

    prompt = `Eres un experto en GD&T segun ASME Y14.5-2018.
Genera UNA pregunta de opcion multiple de nivel vocabulario sobre el concepto: ${focusTerm}.
Capa pedagogica actual: ${layerName}${recentContext}${seenHint}
Devuelve SOLO un objeto JSON valido con exactamente esta estructura:
{
  "question": "texto de la pregunta",
  "options": ["opcion A", "opcion B", "opcion C", "opcion D"],
  "correct_index": 0,
  "explanation": "explicacion clara de por que es correcta"
}

Reglas:
- correct_index es el indice (0-3) de la respuesta correcta en el array options
- Las 3 opciones incorrectas deben ser plausibles pero claramente incorrectas
- La explicacion debe ser educativa y mencionar el concepto clave
- Escribe todo en espanol`;
  } else {
    const terminos = (glossary.terminos || []).join(', ');
    const definicion = glossary.definicion || '';
    const seenHint = seenQuestions.length > 0
      ? `\nNO formules preguntas similares a estas ya vistas: ${seenQuestions.join(' | ')}`
      : '';

    prompt = `Eres un experto en GD&T (Dimensionamiento y Tolerancias Geometricas) segun ASME Y14.5-2018.
Genera UNA pregunta de opcion multiple de nivel vocabulario sobre el control geometrico: ${control}.

Definicion de ${control}: ${definicion}

Terminos clave: ${terminos}

La pregunta debe evaluar el conocimiento basico de vocabulario y definiciones.${seenHint}
Devuelve SOLO un objeto JSON valido con exactamente esta estructura:
{
  "question": "texto de la pregunta",
  "options": ["opcion A", "opcion B", "opcion C", "opcion D"],
  "correct_index": 0,
  "explanation": "explicacion clara de por que es correcta"
}

Reglas:
- correct_index es el indice (0-3) de la respuesta correcta en el array options
- Las 3 opciones incorrectas deben ser plausibles pero claramente incorrectas
- La explicacion debe ser educativa y mencionar el concepto clave
- Escribe todo en espanol`;
  }

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].text.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in response');
  const parsed = JSON.parse(jsonMatch[0]);

  return {
    id: uuidv4(),
    question: parsed.question,
    options: parsed.options,
    correct_index: parsed.correct_index,
    explanation: parsed.explanation,
  };
}

async function getUnseenNivel2FromBank(control, seenIds) {
  const placeholders = seenIds.length > 0
    ? seenIds.map((_, i) => `$${i + 3}`).join(', ')
    : 'NULL';
  const query = seenIds.length > 0
    ? `SELECT id, content FROM exercise_bank WHERE control = $1 AND nivel = $2 AND source = 'curso_pdf' AND active = TRUE AND id NOT IN (${placeholders}) ORDER BY RANDOM() LIMIT 1`
    : `SELECT id, content FROM exercise_bank WHERE control = $1 AND nivel = $2 AND source = 'curso_pdf' AND active = TRUE ORDER BY RANDOM() LIMIT 1`;
  const params = seenIds.length > 0 ? [control, 2, ...seenIds] : [control, 2];
  const { rows } = await pool.query(query, params);
  return rows[0] || null;
}

async function generateNivel2Dynamic(control) {
  const glossary = loadGlossary(control);
  const terminos = (glossary.terminos || []).join(', ');
  const definicion = glossary.definicion || '';
  const reglas = (glossary.reglas || []).join('\n- ');

  const prompt = `Eres un experto en GD&T (Dimensionamiento y Tolerancias Geometricas) aplicado a fabricacion de troqueles de embutido y lamina de acero para la industria metalmecanica mexicana.

Genera UNA pregunta de opcion multiple de nivel CONCEPTO MECANICO sobre el control geometrico: ${control}.

Contexto de aplicacion: troqueles de embutido para lamina de acero esmaltada. Considera que las piezas se fabrican con lamina de acero que se deforma por embutido profundo.

Definicion de ${control}: ${definicion}

Reglas de especificacion:
- ${reglas}

Terminos clave: ${terminos}

La pregunta debe evaluar comprension del concepto mecanico: cuando usar el control, por que, implicaciones practicas en fabricacion o inspeccion.
Al menos el 40% de las preguntas generadas deben mencionar lamina de acero, embutido o troquel en la pregunta o explicacion.

Devuelve SOLO un objeto JSON valido con exactamente esta estructura:
{
  "question": "texto de la pregunta",
  "options": ["opcion A", "opcion B", "opcion C", "opcion D"],
  "correct_index": 0,
  "explanation": "explicacion clara mencionando el contexto de embutido o lamina de acero cuando sea relevante"
}

Reglas:
- correct_index es el indice (0-3) de la respuesta correcta
- Las 3 opciones incorrectas deben ser plausibles
- Escribe todo en espanol`;

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].text.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in response');
  const parsed = JSON.parse(jsonMatch[0]);

  return {
    id: uuidv4(),
    question: parsed.question,
    options: parsed.options,
    correct_index: parsed.correct_index,
    explanation: parsed.explanation,
  };
}

async function generateNivel2(control, opts) {
  const forceDynamic = opts && opts.forceDynamic;
  const seenIds = (opts && opts.seenIds) || [];

  if (!forceDynamic) {
    const bankRow = await getUnseenNivel2FromBank(control, seenIds);
    if (bankRow) {
      return {
        id: uuidv4(),
        question: bankRow.content.question,
        options: bankRow.content.options,
        correct_index: bankRow.content.correct_index,
        explanation: bankRow.content.explanation,
        source: 'banco',
        bank_id: bankRow.id,
      };
    }
  }

  return generateNivel2Dynamic(control);
}

async function generateForControl(control, nivel, opts) {
  if (nivel === 1) {
    return generateNivel1(control, opts);
  }
  if (nivel === 2) {
    return generateNivel2(control, opts);
  }
  throw new Error(`nivel ${nivel} generation not implemented`);
}

module.exports = { generateForControl };
