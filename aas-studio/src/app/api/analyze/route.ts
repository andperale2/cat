import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No video file provided" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing GEMINI_API_KEY environment variable" }, { status: 500 });
    }

    // Initialize Gemini 1.5 Pro (best for multimodal video tasks)
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    // Convert File to base64 buffer for inline data
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || "video/mp4";

    const prompt = `Eres el "Director IA" de un pipeline de recreación de anime a live-action.
Analiza el clip recibido y devuelve EXCLUSIVAMENTE el JSON del schema dado. No uses ninguna plantilla predefinida ni reutilices resultados de análisis anteriores.

REGLAS OBLIGATORIAS (se aplican a CUALQUIER anime, no solo a un personaje conocido):
1. IDENTIDAD POR REFERENCIA, NUNCA POR DESCRIPCIÓN: Nunca vuelques rasgos físicos de un personaje en el campo "camera", "sound" ni en ningún beat. Los personajes se identifican solo por su tag (@PERS1, @PERS2...).
2. CÓDIGOS, NO NOMBRES: JAMÁS escribas su nombre propio en ningún campo del JSON. Usa siempre @PERS1, @PERS2, @LUGAR.
3. UN LUGAR, UNA REFERENCIA: Detecta el escenario dominante de la secuencia y asígnale @LUGAR una sola vez. Si cambia de locación explícitamente usa @LUGAR2.
4. UN EFECTO POR IMPACTO: Cualquier efecto físico (polvo, chispas) debe describirse como transitorio.
5. CONGELA AL PERSONAJE QUE NO ACTÚA: En cada beat de combate, identifica cuál personaje ejecuta la acción y cuál permanece quieto.
6. LA CÁMARA SIEMPRE TIENE UN TRABAJO: El campo "camera" nunca puede ser genérico. Debe describir acción concreta (orbital, push-in, whip-pan).
7. SONIDO DIEGÉTICO POR DEFECTO: "sound" describe SFX, respiración, ambiente — nunca "música" salvo tensión narrativa.
8. UNA LÍNEA DE COLOR GRADE PARA TODA LA SECUENCIA: Genera el "color_grade" UNA sola vez para el primer shot y repítelo IDÉNTICO en todos.
9. AVOID ACUMULATIVO: Cada shot hereda "deformed limbs, fused fingers, ghosting, weightless particles" y agrega lo específico de ese beat.
10. GENERACIONES LARGAS > COSTURA EN EDICIÓN: Agrupa 2 o más cortes consecutivos cortos (<5s) en un solo shot con varios "timeline_beats" marcados con nombre (OPENING/STRIKE/FLURRY/FINISH). Usa "continuation_of_previous_shot": true.
11. DIÁLOGO ENTRE CORCHETES: Si un personaje habla, coloca la línea en "dialogue_line" envuelta en 「corchetes japoneses」. Si no, null.

Devuelve EXCLUSIVAMENTE un objeto JSON válido con esta estructura exacta, en inglés cinematográfico para las descripciones (excepto labels y keys que pueden ir como el schema):
{
  "sequence_title": "string",
  "total_duration": 0.0,
  "entities_detected": {
    "characters": [
      { "tag": "@PERS1", "role_label": "the attacker", "first_seen_slot": 1 }
    ],
    "place": { "tag": "@LUGAR", "description": "concrete arena with balconies" }
  },
  "shots": [
    {
      "slot_id": 1,
      "timecode": "00:00 - 00:05",
      "mode": "I2V",
      "duration_seconds": 5,
      "raw_keyframe_extract_at": 0.5,
      "refs_used": ["@PERS1", "@LUGAR"],
      "timeline_beats": [
        { "range": "0-2s", "beat_name": "OPENING", "description": "..." }
      ],
      "camera": "...",
      "sound": "...",
      "dialogue_line": null,
      "color_grade": "...",
      "avoid": ["deformed limbs", "fused fingers"],
      "continuation_of_previous_shot": false
    }
  ]
}`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType: mimeType
        }
      }
    ]);

    const responseText = result.response.text();

    // Clean potential markdown blocks
    let cleanJson = responseText.replace(/^\s*```json\s*/i, '').replace(/\s*```\s*$/i, '').trim();

    try {
      const parsedData = JSON.parse(cleanJson);
      return NextResponse.json(parsedData, { status: 200 });
    } catch (parseError) {
      console.error("Failed to parse Gemini output:", responseText);
      return NextResponse.json({ error: "Gemini returned invalid JSON", raw: responseText }, { status: 502 });
    }

  } catch (error: any) {
    console.error("Analysis Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
