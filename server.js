import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chunkText } from './utils/chunk.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OLLAMA = process.env.OLLAMA || 'http://localhost:11434';
const LLM = process.env.LLM || 'llama3.2:1b-instruct';
const EMBED = process.env.EMBED || 'nomic-embed-text';
const PORT = process.env.PORT || 7070;
const DOCS_DIR = path.join(__dirname, 'docs');
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'embeddings.json');

const app = express();
app.use(cors());
// Allow large base64 payloads for PDF uploads (base64 ~1.33x original size)
app.use(bodyParser.json({ limit: '200mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Ensure required directories exist
try { if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true }); } catch {}
try { if (!fs.existsSync(DOCS_DIR)) fs.mkdirSync(DOCS_DIR, { recursive: true }); } catch {}

function cosine(a, b) {
  let d = 0, na = 0, nb = 0;
  for (let i=0;i<a.length;i++){ d += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
  return d / (Math.sqrt(na) * Math.sqrt(nb) + 1e-12);
}

async function embed(text) {
  const r = await fetch(`${OLLAMA}/api/embeddings`, {
    method: 'POST',
    body: JSON.stringify({ model: EMBED, input: text })
  });
  if (!r.ok) throw new Error('Embedding request failed: ' + r.statusText);
  const j = await r.json();
  return j.embedding;
}

async function readFileText(fullPath) {
  const buf = fs.readFileSync(fullPath);
  const ext = path.extname(fullPath).toLowerCase();
  if (ext === '.pdf') {
  // Lazy import to avoid any module side-effects at startup
  const { default: pdfParse } = await import('pdf-parse');
  const data = await pdfParse(buf);
    return data.text;
  } else {
    return buf.toString('utf8');
  }
}

async function buildEmbeddings() {
  const files = fs.readdirSync(DOCS_DIR).filter(f => ['.txt','.md','.pdf'].includes(path.extname(f).toLowerCase()));
  const rows = [];
  for (const f of files) {
    const full = path.join(DOCS_DIR, f);
    const raw = await readFileText(full);
    const pieces = chunkText(raw, 1200, 180);
    let idx = 0;
    for (const piece of pieces) {
      const vec = await embed(piece);
      rows.push({ id: `${f}::${idx}`, file: f, text: piece, vec });
      idx++;
      console.log(`Embedded ${f} ${idx}/${pieces.length}`);
    }
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(rows));
  return { chunks: rows.length, files: files.length };
}

async function llmAnswer(question, context) {
  const sys = `You are a domain assistant for internal SOPs.
- Answer ONLY from the provided context.
- If the answer isn't clearly in the context, say: "Not in docs."
- Format responses as plain text bullet points and short sections. Do not use JSON, tables, or code blocks.
- Always cite bracket numbers like [1], [2] based on the provided context blocks. Be concise.`;

  const prompt = `Question: ${question}

Context:
${context.map((c,i)=>`[${i+1}] ${c.file}
${c.text}`).join('\n\n')}`;

  const r = await fetch(`${OLLAMA}/api/chat`, {
    method: 'POST',
    body: JSON.stringify({
      model: LLM,
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: prompt }
      ],
      stream: false,
      options: { temperature: 0.2 }
    })
  });
  if (!r.ok) throw new Error('Chat request failed: ' + r.statusText);
  const j = await r.json();
  return j.message?.content || '';
}

app.get('/api/health', async (req,res) => {
  try {
    try { console.log('GET /api/health'); } catch {}
    const r = await fetch(`${OLLAMA}/api/tags`);
    const j = await r.json();
  const hasIndex = fs.existsSync(DB_FILE);
  res.json({ ok: true, ollama: true, models: j.models?.map(m=>m.name) || [], hasIndex });
  } catch (e) {
  const hasIndex = fs.existsSync(DB_FILE);
  res.json({ ok: true, ollama: false, models: [], hasIndex });
  }
});

app.get('/api/ping', (req, res) => {
  try { console.log('GET /api/ping'); } catch {}
  res.json({ ok: true, pong: true });
});

app.post('/api/build', async (req,res) => {
  try {
    const result = await buildEmbeddings();
    res.json({ ok: true, ...result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: String(e) });
  }
});

app.post('/api/ask', async (req,res) => {
  try {
    const { question, k } = req.body || {};
    if (!question || !question.trim()) return res.status(400).json({ ok: false, error: 'Missing question' });
    if (!fs.existsSync(DB_FILE)) return res.status(400).json({ ok: false, error: 'Embeddings not found. Run /api/build first.' });

    const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    const qvec = await embed(question);
    const scored = db.map(r => ({ ...r, score: cosine(qvec, r.vec) }))
                     .sort((a,b)=>b.score - a.score)
                     .slice(0, k || 6);
    const answer = await llmAnswer(question, scored);
    res.json({
      ok: true,
      answer,
      citations: scored.map((r,i)=>({ index: i+1, id: r.id, file: r.file, score: Number(r.score.toFixed(4)) }))
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// Upload SOP files (txt/pdf) via base64 JSON
app.post('/api/upload', async (req, res) => {
  try {
    const { filename, contentBase64 } = req.body || {};
    if (!filename || !contentBase64) return res.status(400).json({ ok: false, error: 'Missing filename or contentBase64' });
    const ext = path.extname(filename).toLowerCase();
    if (!['.txt', '.pdf'].includes(ext)) return res.status(400).json({ ok: false, error: 'Only .txt and .pdf allowed' });
    const base64 = contentBase64.replace(/^data:[^;]+;base64,/, '');
    const buf = Buffer.from(base64, 'base64');
    const dest = path.join(DOCS_DIR, path.basename(filename));
    fs.writeFileSync(dest, buf);
    res.json({ ok: true, file: path.basename(dest), bytes: buf.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// List SOP docs
app.get('/api/docs', (req,res) => {
  try {
    const files = fs.readdirSync(DOCS_DIR)
      .filter(f => ['.txt','.pdf','.md'].includes(path.extname(f).toLowerCase()))
      .map(f => ({ file: f, size: fs.statSync(path.join(DOCS_DIR, f)).size }));
    res.json({ ok: true, files });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

app.get('/', (req,res) => {
  res.sendFile(path.join(__dirname, 'public', 'test.html'));
});

// Central error handler (including body-parser errors)
// Ensures clients always receive JSON instead of empty body/HTML
// Must be after routes that may throw synchronously.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  try { console.error('Server error:', err); } catch {}
  if (res.headersSent) return next(err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ ok: false, error: err?.type || err?.message || 'Server error' });
});

if (process.argv.includes('--health')) {
  // one-shot health check server start (useful in scripts)
  const srv = app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
} else {
  app.listen(PORT, () => console.log(`RAG server http://localhost:${PORT}`));
}
