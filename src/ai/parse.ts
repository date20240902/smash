// Local parser: extract a paper preset from free-form Korean/English text.
// Swappable later: replace this with a Claude API call returning the same
// shape. Cost = 0.

import { PAPER_PRESETS, type PaperPreset } from '../data/papers'

export interface ParseResult {
  paper: PaperPreset | null
  matched: boolean
}

export function parsePrompt(text: string): ParseResult {
  const q = text.trim().toLowerCase()
  if (!q) return { paper: null, matched: false }
  for (const p of PAPER_PRESETS) {
    if (p.names.some((n) => q.includes(n.toLowerCase()))) {
      return { paper: p, matched: true }
    }
  }
  return { paper: null, matched: false }
}
