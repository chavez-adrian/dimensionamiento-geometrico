require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

async function generateNivel1(control) {
  const glossary = loadGlossary(control);
  const terminos = (glossary.terminos || []).join(', ');
  const definicion = glossary.definicion || '';

  const prompt = `Eres un experto en GD&T (Dimensionamiento y Tolerancias Geometricas) segun ASME Y14.5-2018.
Genera UNA pregunta de opcion multiple de nivel vocabulario sobre el control geometrico: ${control}.

Definicion de ${control}: ${definicion}

Terminos clave: ${terminos}

La pregunta debe evaluar el conocimiento basico de vocabulario y definiciones.
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

async function generateForControl(control, nivel) {
  if (nivel === 1) {
    return generateNivel1(control);
  }
  throw new Error(`nivel ${nivel} generation not implemented in this module`);
}

module.exports = { generateForControl };
