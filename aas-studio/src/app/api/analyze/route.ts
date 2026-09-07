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

    const prompt = `Actúa como un Director de Fotografía y Motor de Interpolación Keyframe I2V (Image-to-Video).
Analiza meticulosamente este clip de video adjunto. Desglosa la secuencia cronológica en planos clave exactos (shots).

Devuelve EXCLUSIVAMENTE un objeto JSON válido con la siguiente estructura, sin texto adicional ni bloques de código markdown:
{
  "shots": [
    {
      "id": 1,
      "timecode": "00:00-00:02",
      "shot_type": "Descripción técnica del encuadre",
      "motion_prompt": "Animate strictly from @startframe. [Movimiento exacto de cámara y efectos ambientales]. Maintain identical facial structure, costume, and anatomy from @startframe. Zero character mutation."
    }
  ]
}

REGLAS ESTRICTAS PARA EL 'motion_prompt':
1. DEBE comenzar siempre con "Animate strictly from @startframe."
2. DEBE terminar siempre con "Maintain identical facial structure, costume, and anatomy from @startframe. Zero character mutation."
3. NO describas personajes. Solo describe cámara, físicas, luces y efectos.
4. Redacta el prompt en inglés cinematográfico.`;

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
