// Local parser: extract { object, tool } from free-form Korean/English text.
// Swappable later: replace this function with a Claude API call returning the
// same shape. Cost = 0.
//
// Heuristic: split by common separators, then try matching each chunk against
// object names; whatever doesn't match an object is checked against tools.

import { matchObject, OBJECT_PRESETS, type ObjectPreset } from '../data/objects'
import { matchTool, TOOL_PRESETS, type ToolPreset } from '../data/tools'

export interface ParseResult {
  object: ObjectPreset
  tool: ToolPreset
  matchedObject: boolean
  matchedTool: boolean
}

const SEPARATORS = /[,，、/|와과랑]|그리고|and|with|로|으로/g

export function parsePrompt(text: string): ParseResult {
  const chunks = text
    .toLowerCase()
    .split(SEPARATORS)
    .map((s) => s.trim())
    .filter(Boolean)

  let object: ObjectPreset | null = null
  let tool: ToolPreset | null = null

  for (const c of chunks) {
    if (!object) {
      const found = OBJECT_PRESETS.find((p) => p.names.some((n) => c.includes(n.toLowerCase())))
      if (found) {
        object = found
        continue
      }
    }
    if (!tool) {
      const found = TOOL_PRESETS.find((t) => t.names.some((n) => c.includes(n.toLowerCase())))
      if (found) {
        tool = found
        continue
      }
    }
  }

  // Fallback: whole-string match
  return {
    object: object ?? matchObject(text),
    tool: tool ?? matchTool(text),
    matchedObject: !!object,
    matchedTool: !!tool,
  }
}
