export const MAX_CHUNK_LENGTH = 180;

export function splitIntoSpeechChunks(text, maxLength = MAX_CHUNK_LENGTH) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];

  const sentences = normalized.match(/[^。！？!?]+[。！？!?]?|[^。！？!?]+$/g) ?? [normalized];
  const result = [];
  let buffer = '';

  for (const sentence of sentences) {
    const candidate = `${buffer}${sentence}`.trim();
    if (candidate.length <= maxLength) {
      buffer = candidate;
      continue;
    }

    if (buffer) result.push(buffer);
    if (sentence.length <= maxLength) {
      buffer = sentence.trim();
      continue;
    }

    for (let start = 0; start < sentence.length; start += maxLength) {
      result.push(sentence.slice(start, start + maxLength).trim());
    }
    buffer = '';
  }

  if (buffer) result.push(buffer);
  return result.filter(Boolean);
}
