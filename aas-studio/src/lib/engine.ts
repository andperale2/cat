import { Shot } from "@/components/Timeline";

/**
 * Assembles the final injection string for Google Flow based strictly on
 * the 7-block formatting requested by the user methodology.
 */
export function assemblePrompt(shot: Shot, entitiesDetected: any): string {
  const parts: string[] = [];

  // 1. SCENE
  // Extract all tags used for the top line mapping
  const sceneTags = shot.refs_used.join(", ");
  parts.push(`SCENE — {${sceneTags}} · SHOT ${shot.slot_id} · ${shot.duration_seconds}s · ${shot.mode}`);

  // 2. REFS
  // Reconstruct descriptions for the refs used from the master entities schema
  const refParts: string[] = [];
  shot.refs_used.forEach(refTag => {
    // Check if it's a character
    const char = entitiesDetected?.characters?.find((c: any) => c.tag === refTag);
    if (char) {
      refParts.push(`${char.tag} (${char.role_label})`);
    } else if (entitiesDetected?.place?.tag === refTag) {
      refParts.push(`${entitiesDetected.place.tag} (${entitiesDetected.place.description})`);
    } else {
      refParts.push(refTag);
    }
  });
  parts.push(`REFS: ${refParts.join(" · ")}`);

  // 3. BEATS
  const beatStrings: string[] = [];
  shot.timeline_beats.forEach(beat => {
    if (beat.beat_name) {
      beatStrings.push(`${beat.beat_name} (${beat.range}) — ${beat.description}`);
    } else {
      beatStrings.push(`${beat.range} — ${beat.description}`);
    }
  });
  parts.push(beatStrings.join("\n"));

  // 4. CAMERA
  parts.push(`CAMERA: ${shot.camera}`);

  // 5. SOUND (includes dialogue inside corner brackets if present)
  let soundBlock = `SOUND: ${shot.sound}`;
  if (shot.dialogue_line) {
    soundBlock += `\n「${shot.dialogue_line}」`;
  }
  parts.push(soundBlock);

  // 6. COLOR GRADE
  parts.push(`COLOR GRADE: ${shot.color_grade}`);

  // 7. AVOID
  if (shot.avoid && shot.avoid.length > 0) {
    parts.push(`AVOID: ${shot.avoid.join(", ")}`);
  }

  return parts.join("\n\n");
}
