// Simple text chunker used by server.js
// Splits large text into overlapping chunks so retrieval works well.
export function chunkText(text, chunkSize = 1200, overlap = 200) {
  const out = [];
  if (!text) return out;
  const clean = String(text).replace(/\r\n?/g, "\n");
  let i = 0;
  while (i < clean.length) {
    const end = Math.min(i + chunkSize, clean.length);
    out.push(clean.slice(i, end));
    if (end === clean.length) break;
    i = end - overlap;
    if (i < 0) i = 0;
  }
  return out;
}
