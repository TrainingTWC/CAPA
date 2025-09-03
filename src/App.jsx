import React, { useEffect, useMemo, useState } from "react";
import { ChecklistUI, CHECKLIST } from "./ChecklistData.jsx";
import TrainingAuditUI from "./TrainingAudit.jsx";
import { save, load } from "./utils/storage.js";

/**
 * NOTE ABOUT THE ORIGINAL SYNTAX ERROR
 * -------------------------------------------------------------
 * You hit: SyntaxError: /index.tsx: Unexpected token (10:43)
 * Root cause in this canvas preview environment: we had literal HTML
 * `</script>` tags inside a JS block comment. The preview engine embeds
 * your code in an HTML <script> tag; a raw `</script>` inside comments
 * prematurely closes that tag, corrupting the generated index.tsx and
 * causing a mysterious parse error.
 *
 *  Fix: remove/escape `</script>` in comments. Below, any script-tag
 * examples are written as `<scr` + `ipt>` and `<\/script>` to avoid
 * breaking the preview.
 *
 * (Unrelated but important) If your dark mode toggle didnt work, set
 * Tailwind to class strategy: `darkMode: 'class'`.
 */

/* ===========================
   THEME (class strategy)
   =========================== */
function useThemeClass() {
  const getInitial = () => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved) return saved === "dark";
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch { return false; }
  };

  const [dark, setDark] = useState(getInitial);

  useEffect(() => {
    const el = document.documentElement;
    const body = document.body;
    if (dark) {
      el.classList.add("dark");
      body.classList.add("dark"); // harmless, helps if styles are scoped under body
      el.style.colorScheme = "dark";
      localStorage.setItem("theme", "dark");
    } else {
      el.classList.remove("dark");
      body.classList.remove("dark");
      el.style.colorScheme = "light";
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return [dark, setDark];
}

/* ===========================
   Utils
   =========================== */
const uid = () => Math.random().toString(36).slice(2, 10);
const todayISO = () => new Date().toISOString().slice(0, 10);

/* ===========================
   Seed Master Data (editable via Import)
   =========================== */
const REGIONS = [
  { id: "north", name: "North" },
  { id: "south", name: "South" },
  { id: "west", name: "West" },
];
const SEED_RMS = [
  { id: "rm-north", name: "Yash Chopra", regionId: "north" },
  { id: "rm-south", name: "Pushpesh Sanwal", regionId: "south" },
  { id: "rm-west", name: "Hariharan Gomathinayagam Pillai", regionId: "west" },
];
const SEED_MANAGERS = [
  { id: "h1355", name: "Suresh", regionId: "south", rmId: "rm-south" },
  { id: "h546", name: "Ajay H", regionId: "south", rmId: "rm-south" },
  { id: "h3270", name: "Umakanth", regionId: "south", rmId: "rm-south" },
  { id: "h2155", name: "Jagruti", regionId: "south", rmId: "rm-south" },
  { id: "h2601", name: "Kiran", regionId: "south", rmId: "rm-south" },
  { id: "h955", name: "Himanshu", regionId: "north", rmId: "rm-north" },
  { id: "h2396", name: "Atul", regionId: "north", rmId: "rm-north" },
  { id: "h1766", name: "Vishu", regionId: "north", rmId: "rm-north" },
  { id: "h3386", name: "Abhishek", regionId: "west", rmId: "rm-west" },
  { id: "h2758", name: "Rutuja", regionId: "west", rmId: "rm-west" },
  { id: "h1575", name: "Vruchika", regionId: "west", rmId: "rm-west" },
  { id: "h2273", name: "Sanjay", regionId: "west", rmId: "rm-west" },
  { id: "h2908", name: "Shailesh", regionId: "west", rmId: "rm-west" },
  { id: "h3362", name: "Karthik", regionId: "south", rmId: "rm-south" },
];
const SEED_STORES = [
  { id: "S001", name: "Koramangala 1", managerId: "h1355", regionId: "south" },
  { id: "S002", name: "CMH Indiranagar", managerId: "h546", regionId: "south" },
  { id: "S024", name: "Deer Park", managerId: "h955", regionId: "north" },
  { id: "S043", name: "Kemps Corner", managerId: "h3386", regionId: "west" },
  { id: "S048", name: "Kalyani Nagar", managerId: "h2758", regionId: "west" },
];

/* ===========================
   CAPA constants
   =========================== */
const STATUSES = ["Open", "In-Progress", "On-Hold", "Done", "Verified"];
const SEVERITIES = ["Low", "Medium", "High", "Critical"];
const CATEGORIES = [
  "Product Quality",
  "Speed of Service",
  "Customer Experience",
  "Cleanliness & Hygiene",
  "People & Training",
  "Inventory/Material",
  "Equipment & Maintenance",
  "Cash & Compliance",
  "Other",
];

/* ===========================
   Import helpers
   =========================== */
function slugId(prefix, name) {
  return (
    prefix +
    "-" +
    String(name || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 28)
    );
  
}
function parseMaster(text) {
  // TSV/CSV without headers:
  // StoreId, StoreName, AMName, AMId, <ignored>, Region, RMName, RMId
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return { regions: [], rms: [], managers: [], stores: [] };
  const sep = /\t/.test(lines[0]) ? "\t" : ",";
  const regions = new Map(), rms = new Map(), ams = new Map(), stores = new Map();

  for (const raw of lines) {
    const cols = raw.split(sep).map((s) => s.trim());
    if (cols.length < 6) continue;
    const [storeId, storeName, amName, amId, _ignored, regionName, rmName, rmId] = cols;

    const regionId = String(regionName || "").toLowerCase();
    if (regionId) regions.set(regionId, { id: regionId, name: regionName });

    const rm_id = (rmId ? rmId.toLowerCase() : slugId("rm", rmName || regionId)) || slugId("rm", regionId);
    if (rmName) rms.set(rm_id, { id: rm_id, name: rmName, regionId });

    const am_id = (amId || slugId("am", amName)).toLowerCase();
    if (amName) ams.set(am_id, { id: am_id, name: amName, regionId, rmId: rm_id });

    const sid = (storeId || slugId("store", storeName)).toUpperCase();
    if (storeName) stores.set(sid, { id: sid, name: storeName, managerId: am_id, regionId });
  }
  return {
    regions: Array.from(regions.values()),
    rms: Array.from(rms.values()),
    managers: Array.from(ams.values()),
    stores: Array.from(stores.values()),
  };
}

/* ===========================
   CSV helpers
   =========================== */
const CSV_HEADER = [
  "id","regionId","managerId","managerName","storeId","storeName","category","severity",
  "observation","rootCause","correctiveAction","preventiveAction","owner","dueDate",
  "followUpDate","status","effectiveness","evidenceUrl","reviewNotes","createdAt","updatedAt",
];
const toCSV = (rows) => {
  const esc = (s = "") => `"${String(s).replaceAll('"', '""').replaceAll("\n", " ")}"`;
  const head = CSV_HEADER.join(",");
  const body = rows.map((r) => CSV_HEADER.map((k) => esc(r[k])).join(",")).join("\n");
  return `${head}\n${body}`;
};
const download = (name, text) => {
  const b = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(b);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
};

/* ===========================
   Small UI atoms
   =========================== */
const Stat = ({ label, value }) => (
  <div className="rounded-2xl glass p-4 transition">
    <div className="text-xs text-slate-500">{label}</div>
    <div className="mt-1 text-2xl font-bold text-black">{value}</div>
  </div>
);
const Badge = ({ children, tone = "slate" }) => {
  const map = {
    slate: "bg-slate-200 text-black",
    green: "bg-green-200 text-green-900",
    yellow: "bg-yellow-200 text-yellow-900",
    red: "bg-red-200 text-red-900",
    blue: "bg-blue-200 text-blue-900",
    purple: "bg-purple-200 text-purple-900",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[tone]}`}>{children}</span>;
};
const TextInput = ({ label, ...props }) => (
  <label className="block">
  <span className="text-sm text-black">{label}</span>
    <input
      {...props}
  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 outline-none focus:ring-2 focus:ring-black bg-white text-black"
    />
  </label>
);
const TextArea = ({ label, ...props }) => (
  <label className="block">
  <span className="text-sm text-black">{label}</span>
    <textarea
      {...props}
      rows={props.rows ?? 3}
  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 outline-none focus:ring-2 focus:ring-black bg-white text-black"
    />
  </label>
);

/* Searchable Select */
function Select({ label, options = [], value, onChange, disabled, placeholder = "— Select —" }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = React.useRef(null);

  const opts = useMemo(() => options.map((o) => (typeof o === "string" ? { value: o, label: o } : o)), [options]);
  const selected = useMemo(() => opts.find((o) => String(o.value) === String(value)), [opts, value]);
  const filtered = useMemo(() => {
    if (!query.trim()) return opts;
    const q = query.toLowerCase();
    return opts.filter((o) => (o.label ?? "").toLowerCase().includes(q) || String(o.value).toLowerCase().includes(q));
  }, [opts, query]);

  useEffect(() => {
    const onDoc = (e) => { if (!ref.current) return; if (!ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc, { passive: true });
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("touchstart", onDoc); };
  }, []);

  const selectVal = (val) => { onChange && onChange({ target: { value: val } }); setOpen(false); setQuery(""); };

  return (
    <label className="block" ref={ref}>
  <span className="text-sm text-black">{label}</span>
      <div className="relative mt-1">
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen((v) => !v)}
          className="w-full rounded-xl border border-slate-300 px-3 py-3 text-left bg-white text-black disabled:opacity-50"
        >
          {selected ? selected.label : <span className="text-slate-500">{placeholder}</span>}
        </button>
        {open && !disabled && (
          <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-slate-300 bg-white shadow-2xl">
            <div className="p-2 border-b border-slate-200">
              <input
                autoFocus placeholder="Type to search…" value={query} onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Escape") setOpen(false); }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-black bg-white text-black"
              />
            </div>
            <div className="max-h-64 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-3 py-2 text-sm text-slate-500">No matches</div>
              ) : (
                filtered.map((o) => (
                  <button
                    key={o.value} type="button" onClick={() => selectVal(o.value)}
                    className={`block w-full px-3 py-2 text-left text-sm hover:bg-slate-100 ${String(o.value)===String(value)?"bg-slate-100": ""}`}
                  >
                    {o.label}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </label>
  );
}

const Divider = () => <div className="my-4 h-px bg-slate-300" />;

/* ===========================
   Analysis rendering (bulleted, no JSON shown)
   =========================== */
function AnalysisView({ text }) {
  const cleaned = useMemo(() => {
    let t = String(text || "").trim();
    // Strip code fences like ```json ... ```
    if (t.startsWith("```")) {
      t = t.replace(/^```[a-zA-Z]*\s*/m, "");
      t = t.replace(/\n?```\s*$/m, "");
    }
    return t.trim();
  }, [text]);

  const parsedJSON = useMemo(() => {
    try {
      const looks = cleaned.startsWith("{") || cleaned.startsWith("[");
      if (!looks) return null;
      return JSON.parse(cleaned);
    } catch { return null; }
  }, [cleaned]);

  const Title = ({ children }) => (
    <h3 className="mt-3 mb-1 text-lg font-bold leading-tight text-black">{children}</h3>
  );

  const KeyVal = ({ k, v }) => (
    <li className="mb-0.5"><span className="text-slate-600">{k}: </span><span className="text-slate-800">{String(v)}</span></li>
  );

  const renderObject = (obj) => {
    // Handle SWOT shapes if present
    const low = Object.fromEntries(Object.keys(obj).map(k => [k.toLowerCase(), k]));
    const sK = low.strengths, wK = low.weaknesses, oK = low.opportunities, tK = low.threats;
    if (sK || wK || oK || tK) {
      const blocks = [];
      const sec = (label, val) => {
        if (!val) return;
        blocks.push(
          <div key={label} className="mb-2">
            <Title>{label}</Title>
            <ul className="list-disc ml-5 text-sm text-slate-800">
              {(Array.isArray(val) ? val : [val]).map((x, i) => <li key={i}>{typeof x === 'string' ? x : JSON.stringify(x)}</li>)}
            </ul>
          </div>
        );
      };
      sec('Strengths', obj[sK]);
      sec('Weaknesses', obj[wK]);
      sec('Opportunities', obj[oK]);
      sec('Threats', obj[tK]);
      return <div>{blocks}</div>;
    }
    // Generic object → key sections
    return (
      <div>
        {Object.entries(obj).map(([k, v]) => (
          <div key={k} className="mb-2">
            <Title>{k}</Title>
            {Array.isArray(v) ? (
              <ul className="list-disc ml-5 text-sm text-slate-800">
                {v.map((x, i) => <li key={i}>{typeof x === 'string' ? x : JSON.stringify(x)}</li>)}
              </ul>
            ) : typeof v === 'object' && v !== null ? (
              <ul className="list-disc ml-5 text-sm text-slate-800">
                {Object.entries(v).map(([kk, vv]) => <KeyVal key={kk} k={kk} v={typeof vv === 'string' ? vv : JSON.stringify(vv)} />)}
              </ul>
            ) : (
              <div className="text-sm text-slate-800">{String(v)}</div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderArray = (arr) => (
    <ul className="list-disc ml-5 text-sm text-slate-800">
      {arr.map((item, idx) => {
        if (typeof item === 'string' || typeof item === 'number') return <li key={idx}>{String(item)}</li>;
        if (item && typeof item === 'object') {
          const title = item.checkpoint || item.title || item.name || item.category || '';
          const rest = Object.entries(item).filter(([k]) => !['checkpoint','title','name','category'].includes(k));
          return (
            <li key={idx} className="mb-1">
              {title ? <div className="text-base font-semibold text-black leading-snug">{title}</div> : null}
              {rest.length > 0 && (
                <ul className="list-disc ml-5 mt-1">
                  {rest.map(([k,v]) => <KeyVal key={k} k={k} v={typeof v === 'string' ? v : JSON.stringify(v)} />)}
                </ul>
              )}
            </li>
          );
        }
        return <li key={idx}>{JSON.stringify(item)}</li>;
      })}
    </ul>
  );

  const renderPlain = (s) => {
  const linesRaw = s.split(/\r?\n/);
  // Strip meta-instruction echoes
  const metaRe = /(prefix|output as|do not include|format|instruction|guideline|keep (each )?line short)/i;
  const lines = linesRaw.filter(ln => !metaRe.test(ln));
    const out = [];
    let bullets = [];
    const flush = () => {
      if (bullets.length) {
        out.push(
          <ul key={out.length} className="list-disc ml-5 text-sm text-slate-800">
            {bullets.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        );
        bullets = [];
      }
    };
    lines.forEach((ln, i) => {
      const head = ln.match(/^\s*(?:#+\s+)?([^:]{2,80}):\s*$/);
      const bul = ln.match(/^\s*(?:[-*•]|\d+\.)\s+(.*)\s*$/);
  if (head) { flush(); out.push(<Title key={`h-${i}`}>{head[1]}</Title>); return; }
      if (bul) { bullets.push(bul[1]); return; }
      if (ln.trim() === '') { flush(); return; }
      // paragraph → flush bullets and render as a simple paragraph
      flush();
      out.push(<div key={`p-${i}`} className="text-sm text-slate-800 mb-1">{ln}</div>);
    });
    flush();
    return <div>{out}</div>;
  };

  if (!cleaned) return null;
  if (parsedJSON) return Array.isArray(parsedJSON) ? renderArray(parsedJSON) : renderObject(parsedJSON);
  return renderPlain(cleaned);
}

// Structured formatter for RCA/CAPA: heading, subheading, bullets, with spacing
function FormattedAnalysis({ text, type }) {
  const sections = useMemo(() => {
    const t = String(text || '').trim();
    const lines = t.split(/\r?\n/).map(l => l.replace(/^\s+|\s+$/g, ''));
    const out = [];
    let current = null;

    const flush = () => { if (current) { out.push(current); current = null; } };
    const start = (title) => { flush(); current = { title: title.trim(), sub: '', bullets: [] }; };

    lines.forEach((ln) => {
      if (!ln) { return; }
      // New section by checkpoint bullet or a line without label
      const isKV = /^(Immediate|Owner|When|Verify|Follow[- ]?up|Evidence|Root\s*Cause)\s*:/i.test(ln);
      const rcaLine = ln.match(/^[-*•]?\s*([^:]+):\s*(.+)$/); // e.g., "Checkpoint: cause; Evidence: ..."
      if (!current && rcaLine && type === 'rca') {
        // Parse RCA: heading before first colon; subheading = cause before ; Evidence
        const heading = rcaLine[1].trim();
        const rest = rcaLine[2].trim();
        const parts = rest.split(/;\s*/);
        const sub = parts[0] || '';
        start(heading);
        current.sub = sub;
        // Add remaining parts as bullets (Evidence etc.)
        parts.slice(1).forEach(p => current.bullets.push(p.replace(/\s*;\s*$/, '')));
        return;
      }

      const isTitle = /^[-*•]?\s*[^:]+$/.test(ln) && !isKV;
      if (isTitle) { start(ln.replace(/^[-*•]\s*/, '')); return; }
      if (!current) { start(ln); return; }
      // Key-value bullets
      if (type === 'capa') {
        const m = ln.match(/^(Immediate|Owner|When|Verify|Follow[- ]?up)\s*:\s*(.+)$/i);
        if (m) {
          const key = m[1]; const val = m[2];
          // Use Immediate as subheading and keep others as bullets
          if (/^Immediate$/i.test(key) && !current.sub) current.sub = val;
          else current.bullets.push(`${key}: ${val}`);
          return;
        }
      }
      // RCA remaining lines: Evidence line, etc.
      const m2 = ln.match(/^(Evidence|Owner|When|Verify|Follow[- ]?up)\s*:\s*(.+)$/i);
      if (m2) { current.bullets.push(`${m2[1]}: ${m2[2]}`); return; }
      // Fallback as bullet
      current.bullets.push(ln);
    });
    flush();
    return out;
  }, [text, type]);

  if (!sections.length) return null;
  return (
    <div>
      {sections.map((s, i) => (
        <div key={i} className="mb-5">
          <div className="text-base font-bold text-black leading-snug">{s.title}</div>
          {s.sub ? <div className="text-sm text-slate-700 mb-1">{s.sub}</div> : null}
          {s.bullets.length > 0 && (
            <ul className="list-disc ml-5 text-sm text-slate-800">
              {s.bullets.map((b, j) => <li key={j}>{b}</li>)}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
/* ===========================
   CAPA Form (modal)
   =========================== */
function CAPAForm({ managers, stores, initial, onCancel, onSave }) {
  const [form, setForm] = useState(
    initial ?? {
      id: uid(),
      managerId: "",
      storeId: "",
      category: "",
      severity: "Medium",
      observation: "",
      rootCause: "",
      correctiveAction: "",
      preventiveAction: "",
      owner: "",
      dueDate: todayISO(),
      followUpDate: "",
      status: "Open",
      effectiveness: "",
      evidenceUrl: "",
      reviewNotes: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  );
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v, updatedAt: new Date().toISOString() }));
  const storeOptions = useMemo(
    () => stores.filter((s) => !form.managerId || s.managerId === form.managerId),
    [stores, form.managerId]
  );

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-2 sm:p-4" onClick={onCancel}>
      <div
  className="relative w-full max-w-2xl sm:max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-4 sm:p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          aria-label="Close dialog" onClick={onCancel}
          className="absolute right-3 top-3 h-9 w-9 rounded-full border text-lg leading-none hover:bg-slate-50"
        >×</button>

  <h2 className="text-xl font-semibold text-black">{initial ? "Edit CAPA" : "New CAPA"}</h2>
        <Divider />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select label="Area Manager" value={form.managerId} onChange={(e) => set("managerId", e.target.value)} options={managers.map((m) => ({ value: m.id, label: `${m.name} (${m.id})` }))} />
          <Select label="Store" value={form.storeId} onChange={(e) => set("storeId", e.target.value)} options={storeOptions.map((s) => ({ value: s.id, label: `${s.id} — ${s.name}` }))} />
          <Select label="Category" value={form.category} onChange={(e) => set("category", e.target.value)} options={CATEGORIES} />
          <Select label="Severity" value={form.severity} onChange={(e) => set("severity", e.target.value)} options={SEVERITIES} />
          <TextInput label="Owner" value={form.owner} onChange={(e) => set("owner", e.target.value)} />
          <TextInput type="date" label="Due Date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
          <TextInput type="date" label="Follow-up Date" value={form.followUpDate} onChange={(e) => set("followUpDate", e.target.value)} />
          <Select label="Status" value={form.status} onChange={(e) => set("status", e.target.value)} options={STATUSES} />
          <TextArea label="Observation (What/Where)" value={form.observation} onChange={(e) => set("observation", e.target.value)} />
          <TextArea label="Root Cause (Why) – 5 Whys optional" value={form.rootCause} onChange={(e) => set("rootCause", e.target.value)} />
          <TextArea label="Corrective Action (Fix now)" value={form.correctiveAction} onChange={(e) => set("correctiveAction", e.target.value)} />
          <TextArea label="Preventive Action (Stop recurrence)" value={form.preventiveAction} onChange={(e) => set("preventiveAction", e.target.value)} />
          <TextInput label="Effectiveness (Post-check)" value={form.effectiveness} onChange={(e) => set("effectiveness", e.target.value)} />
          <TextInput label="Evidence URL (Photo/Doc)" value={form.evidenceUrl} onChange={(e) => set("evidenceUrl", e.target.value)} />
        </div>
        <Divider />
        <TextArea label="Reviewer Notes" value={form.reviewNotes} onChange={(e) => set("reviewNotes", e.target.value)} />
        <div className="mt-4 flex justify-end gap-2 sticky bottom-0 bg-white/70 backdrop-blur rounded-xl p-2">
          <button onClick={onCancel} className="rounded-xl border border-slate-300 px-4 py-2">Cancel</button>
          <button onClick={() => onSave(form)} className="rounded-xl bg-black px-4 py-2 font-medium text-white">{initial ? "Save Changes" : "Create CAPA"}</button>
        </div>
      </div>
    </div>
  );
}

/* ===========================
   CAPA Row
   =========================== */
const nextStatus = (curr) => {
  const order = ["Open", "In-Progress", "On-Hold", "Done", "Verified"];
  const i = order.indexOf(curr);
  return order[(i + 1) % order.length];
};
function CAPARow({ item, managerName, storeName, onEdit, onQuick, onClose, canEdit = false }) {
  const tone = item.severity === "Critical" ? "red" : item.severity === "High" ? "purple" : item.severity === "Medium" ? "yellow" : "green";
  const overdue = item.dueDate && new Date(item.dueDate) < new Date() && ["Open", "In-Progress", "On-Hold"].includes(item.status);
  const isClosed = item.status === "Verified";
  return (
    <div className="rounded-2xl glass p-4 hover:shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Badge tone="blue">{managerName}</Badge>
            <Badge tone="slate">{storeName}</Badge>
            <Badge tone={tone}>{item.severity}</Badge>
            <Badge tone="purple">{item.category || "Uncategorized"}</Badge>
            <Badge tone={overdue ? "red" : "green"}>{overdue ? "Overdue" : item.status}</Badge>
          </div>
          <div className="mt-2 text-sm text-black">{item.observation}</div>
        </div>
        <div className="flex gap-2">
          {canEdit && !isClosed && (
            <>
              <button onClick={() => onQuick(item, "status", nextStatus(item.status))} className="rounded-lg border border-slate-300 px-3 py-1 text-sm">Advance</button>
              <button onClick={() => onClose(item)} className="rounded-lg border border-slate-300 px-3 py-1 text-sm">Close</button>
              <button onClick={() => onEdit(item)} className="rounded-lg border border-slate-300 px-3 py-1 text-sm">Edit</button>
            </>
          )}
          {isClosed && <span className="text-xs text-green-600">Closed (Verified)</span>}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div>
          <div className="text-xs font-medium text-slate-600">Root Cause</div>
          <div className="text-sm text-black">{item.rootCause || "—"}</div>
        </div>
        <div>
          <div className="text-xs font-medium text-slate-600">Corrective</div>
          <div className="text-sm text-black">{item.correctiveAction || "—"}</div>
        </div>
        <div>
          <div className="text-xs font-medium text-slate-600">Preventive</div>
          <div className="text-sm text-black">{item.preventiveAction || "—"}</div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
        <span>Owner: <b className="text-black">{item.owner || "—"}</b></span>
        <span>Due: <b className="text-black">{item.dueDate || "—"}</b></span>
        <span>Follow-up: <b className="text-black">{item.followUpDate || "—"}</b></span>
        {item.evidenceUrl && <a href={item.evidenceUrl} target="_blank" rel="noreferrer" className="underline">Evidence</a>}
      </div>
    </div>
  );
}

/* ===========================
   MAIN APP
   =========================== */
export default function App() {

  const [dark, setDark] = useThemeClass();

  // --- AI Integration: Click-to-generate per store ---
  const [aiAnalysis, setAiAnalysis] = useState({ swot: "", rca: "", capa: "", loading: false, error: "" });
  const [formatMode, setFormatMode] = useState({ swot: false, rca: false, capa: false });
  const [submittedChecklists, setSubmittedChecklists] = useState(() => {
    try { return JSON.parse(localStorage.getItem("all-checklist-submitted")) || []; } catch { return []; }
  });
  const [submittedTraining, setSubmittedTraining] = useState(() => {
    try { return JSON.parse(localStorage.getItem("all-training-submitted")) || []; } catch { return []; }
  });
  const [selectedStoreId, setSelectedStoreId] = useState("");
  // Current UI tab (Checklist | SWOT | RCA | CAPA) — declared early so AI effect can depend on it
  const [tab, setTab] = useState("CAPA");
  // RAG grounding
  const [ragReady, setRagReady] = useState(false);
  const [ragBusy, setRagBusy] = useState(false);
  const [ragBase, setRagBase] = useState(() => {
    try { return localStorage.getItem('rag.base') || ''; } catch { return ''; }
  });

  // Resilient RAG fetch helper (try direct server then dev proxy)
  const ragFetch = async (path, init) => {
    const qs = new URLSearchParams(window.location.search);
    const paramBase = (qs.get('rag') || '').trim();
    const envBase = (import.meta?.env?.VITE_RAG_BASE || '').trim();
    const savedBase = (ragBase || '').trim() || (typeof localStorage!=='undefined' ? (localStorage.getItem('rag.base')||'') : '');
    const bases = [
      paramBase,
      envBase,
      savedBase,
      'http://localhost:8787',
      'http://127.0.0.1:8787',
      'http://localhost:7070',
      'http://127.0.0.1:7070',
      '/rag',
    ].filter(Boolean);
    let lastErr;
    for (const base of bases) {
      try {
        const r = await fetch(`${base}${path}`, init);
        if (r.ok) {
          try { localStorage.setItem('rag.base', base); } catch {}
          try { setRagBase(base); } catch {}
        }
        if (!r.ok && base === "/rag" && r.status === 404) { lastErr = new Error("404 via proxy"); continue; }
        return r;
      } catch (e) { lastErr = e; }
    }
    throw lastErr || new Error("RAG fetch failed");
  };

  // one-time health check of RAG server
  useEffect(() => {
    (async () => {
      try {
        // Probe candidates directly so we can record the working base
        const qs = new URLSearchParams(window.location.search);
        const paramBase = (qs.get('rag') || '').trim();
        const envBase = (import.meta?.env?.VITE_RAG_BASE || '').trim();
        const savedBase = (typeof localStorage!=='undefined' ? (localStorage.getItem('rag.base')||'') : '').trim();
        const candidates = [paramBase, envBase, savedBase, 'http://localhost:8787', 'http://127.0.0.1:8787', 'http://localhost:7070', 'http://127.0.0.1:7070', '/rag'].filter(Boolean);
        let ok = false;
        for (const base of candidates) {
          try {
            const r = await fetch(`${base}/api/health`);
            if (!r.ok) continue;
            const j = await r.json();
            setRagReady(Boolean(j.ok));
            try { localStorage.setItem('rag.base', base); } catch {}
            setRagBase(base);
            ok = true; break;
          } catch {}
        }
        if (!ok) setRagReady(false);
      } catch { setRagReady(false); }
    })();
  }, []);

  // Refresh list when a checklist is submitted
  useEffect(() => {
    const handler = () => {
      try { setSubmittedChecklists(JSON.parse(localStorage.getItem("all-checklist-submitted")) || []); }
      catch { setSubmittedChecklists([]); }
    };
    window.addEventListener("checklist-submitted", handler);
    const handlerT = () => {
      try { setSubmittedTraining(JSON.parse(localStorage.getItem("all-training-submitted")) || []); }
      catch { setSubmittedTraining([]); }
    };
    window.addEventListener("training-submitted", handlerT);
    return () => { window.removeEventListener("checklist-submitted", handler); window.removeEventListener("training-submitted", handlerT); };
  }, []);

  // Helper: extract failed checkpoints (answer === 'no') for targeted analysis
  const getFailedCheckpoints = (submitted) => {
    const fails = [];
    try {
      const s = submitted?.state || [];
      s.forEach((cat, ci) => {
        const catName = cat?.category || `Section ${ci + 1}`;
        const cps = cat?.checkpoints || [];
        cps.forEach((cp, pi) => {
          if (String(cp?.answer).toLowerCase() === 'no') {
            fails.push({ category: catName, checkpoint: CHECKLIST[ci]?.checkpoints?.[pi] || `Item ${pi + 1}`, sectionObservation: cat?.sectionObservation || '' });
          }
        });
      });
    } catch {}
    return fails;
  };

  // Helper: tiny rule-based CAPA output when AI is unavailable
  const ruleBasedCAPA = (fails) => {
    if (!fails || fails.length === 0) return 'No failed checkpoints found. Maintain current standards and continue routine monitoring.';
    const lines = [];
    const mapItem = (txt) => {
      const t = String(txt).toLowerCase();
      // Hand-crafted patterns for common FOH/BOH cases
      if (t.includes('store front') || (t.includes('front') && t.includes('clean'))) {
        return {
          what: 'Immediately get FOH cleaned and presentable; deploy per the store deployment chart; reinforce daily opening/shift cleaning routines.',
          who: 'MOD/Shift Lead', when: 'Today (within 2 hours)', verify: 'FOH photo + cleaning log updated', follow: 'MOD to check each shift for 3 days'
        };
      }
      if (t.includes('washroom')) {
        return {
          what: 'Deep clean washrooms; stock consumables; place hourly cleaning checklist at door and start logging.',
          who: 'Housekeeping/Barista on duty', when: 'Immediate (today)', verify: 'Before/after photo + hourly log initiated', follow: 'AM to verify logs next 7 days'
        };
      }
      if (t.includes('glass') || t.includes('smudge')) {
        return {
          what: 'Wipe all glass/doors with microfiber and approved cleaner; set 2-hour wipe schedule near entrance.',
          who: 'FOH partner', when: 'Today (start now)', verify: 'Photo + wipe schedule posted and signed', follow: 'MOD to countersign schedule daily'
        };
      }
      if (t.includes('signage') || t.includes('lights')) {
        return {
          what: 'Clean signage and replace non-functional lights; remove outdated promos.',
          who: 'SM/Vendor (for bulbs)', when: '48 hours', verify: 'Photo of fixed signage + inventory of bulbs', follow: 'Weekly visual check in opening walk'
        };
      }
      if (t.includes('fdu') || (t.includes('counter') && t.includes('stock'))) {
        return {
          what: 'Restock and set FDU per planogram; place planogram print behind counter; assign replenishment at shift change.',
          who: 'Shift Lead', when: 'Today (EOD)', verify: 'Photo vs planogram', follow: 'Daily photo check for 1 week'
        };
      }
      if (t.includes('equipment') || t.includes('cleaned and maintained')) {
        return {
          what: 'Run quick-clean cycle and wipe-down per SOP; log next preventive maintenance date on calendar.',
          who: 'MOD/Technician (if needed)', when: 'Today', verify: 'Cleaning log updated + PM date noted', follow: 'Weekly spot-check by SM'
        };
      }
      if (t.includes('temperature') || t.includes('therma')) {
        return {
          what: 'Calibrate Thermapen and record temperature checks at required intervals; brief team on critical limits.',
          who: 'MOD', when: 'Today (before next batch)', verify: 'Temp log complete + calibration check noted', follow: 'Audit logs for 1 week'
        };
      }
      if (t.includes('garbage') || t.includes('segregation') || t.includes('wet/dry')) {
        return {
          what: 'Place labeled wet/dry bins at FOH/BOH; brief team; add end-of-shift waste check to closing checklist.',
          who: 'SM/Shift Lead', when: 'Today (before close)', verify: 'Bins placed + checklist updated', follow: 'Daily closing verification'
        };
      }
      if (t.includes('thaw') || t.includes('thawing')) {
        return {
          what: 'Update thawing chart; ensure FIFO in chiller; discard out-of-spec items; brief team on thaw times.',
          who: 'Kitchen Lead', when: 'Immediate', verify: 'Chart photo + discard record', follow: 'AM to review on next visit'
        };
      }
      // Generic fallback
      return {
        what: `Fix and standardize: ${txt} — follow the SOP, assign owner, and log completion.`,
        who: 'SM/Shift Lead', when: 'Within 24–48 hours', verify: 'Photo/evidence + logbook entry', follow: 'Weekly follow-up until stable'
      };
    };
    fails.forEach((f) => {
      const act = mapItem(f.checkpoint || 'Issue');
      lines.push(`- ${f.checkpoint}\n  • Immediate: ${act.what}\n  • Owner: ${act.who}\n  • When: ${act.when}\n  • Verify: ${act.verify}\n  • Follow-up: ${act.follow}`);
    });
    return `CAPA — Ground-level actions per failed checkpoint\n\n${lines.join('\n')}`;
  };

  // Helper: rule-based RCA output to ensure useful root causes
  const ruleBasedRCA = (fails) => {
    if (!fails || fails.length === 0) return 'No failed checkpoints found.';
    const mapItem = (txt) => {
      const t = String(txt || '').toLowerCase();
      if (t.includes('store front') || (t.includes('front') && t.includes('clean'))) {
        return { cause: 'Cleaning cadence not enforced; deployment gaps during opening/peak (Process)', ev: 'Opening/shift cleaning logs, deployment chart adherence, before/after photos' };
      }
      if (t.includes('washroom')) {
        return { cause: 'Hourly housekeeping not owned; consumables not prepped (People/Process)', ev: 'Hourly checklist at door, roster assignment, supply stock' };
      }
      if (t.includes('glass') || t.includes('smudge')) {
        return { cause: 'No 2-hour wipe-down schedule; tools missing at entrance (Process/Materials)', ev: 'Wipe schedule posted, microfiber/cleaner availability, latest entries' };
      }
      if (t.includes('signage') || t.includes('lights')) {
        return { cause: 'VM upkeep ownership unclear; no preventive check (Process)', ev: 'VM calendar, last bulb replacement/cleaning ticket, photos' };
      }
      if (t.includes('fdu') || (t.includes('counter') && t.includes('stock'))) {
        return { cause: 'Planogram not visible/reviewed; replenishment not assigned (Process)', ev: 'Planogram print, shift handover notes, photo vs planogram' };
      }
      if (t.includes('equipment') || t.includes('maintained')) {
        return { cause: 'PM schedule not followed; unclear owner (Equipment/Process)', ev: 'PM calendar, cleaning log, last service record' };
      }
      if (t.includes('temperature') || t.includes('therma') || t.includes('dial-in')) {
        return { cause: 'Calibration and interval logging weak (Measurement/Process)', ev: 'Calibration record, spot readings vs log, log completeness' };
      }
      if (t.includes('garbage') || t.includes('segregation') || t.includes('wet/dry')) {
        return { cause: 'Bins unlabeled/poorly placed; close-out check missing (Environment/Process)', ev: 'Bin labels/placement photos, closing checklist entry' };
      }
      if (t.includes('thaw')) {
        return { cause: 'Thaw planning and FIFO not tracked (Process/Materials)', ev: 'Thaw chart, timestamps, discard records, chiller layout' };
      }
      return { cause: 'SOP adherence and ownership unclear (Process) (Inference)', ev: 'Relevant SOP/logbooks, rostered owner, recent evidence (photo/log)' };
    };
    return fails.map(f => {
      const { cause, ev } = mapItem(f.checkpoint);
      return `- ${f.checkpoint}: ${cause}; Evidence: ${ev}`;
    }).join('\n');
  };

  // Generate analysis when a store is selected or tab changes; produce only the active section (SWOT/RCA/CAPA)
  useEffect(() => {
    // Only generate on AI tabs
    if (!selectedStoreId) return;
    if (!["SWOT", "RCA", "CAPA"].includes(tab)) return;
    const dataOps = submittedChecklists.find(c => c.storeId === selectedStoreId);
    const dataTrain = submittedTraining.find(c => c.storeId === selectedStoreId);
    if (!dataOps || !dataTrain) {
      setAiAnalysis({ swot: "", rca: "", capa: "", loading: false, error: !dataOps && !dataTrain ? "No checklists submitted for this store yet." : !dataOps ? "Ops checklist not submitted." : "Training audit not submitted." });
      return;
    }

    // Derive failed checkpoints for targeted prompts
  const failed = getFailedCheckpoints(dataOps);
    const failedListText = failed.length
      ? failed.map((f, i) => `${i + 1}. [${f.category}] ${f.checkpoint}`).join("\n")
      : 'None';

  const section = tab === "SWOT" ? "swot" : tab === "RCA" ? "rca" : "capa";

    // Use cache if this section exists
    let cached = null;
    try { cached = JSON.parse(localStorage.getItem(`analysis:${selectedStoreId}`)); } catch {}
    if (cached && cached[section]) {
      setAiAnalysis({ ...cached, loading: false, error: "" });
      return;
    }

    // If SOP grounding is enabled and RAG server is available, try it first
  const askRAG = async (question) => {
      try {
    const r = await ragFetch('/api/ask', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question, k: 6 })
        });
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
        const j = await r.json();
        if (!j.ok) throw new Error(j.error || 'RAG error');
        return String(j.answer || '').trim();
      } catch (e) { throw e; }
    };

    // Prepare a section-specific prompt
  const basePrompt = `You are an operations excellence and learning and development expert for a 200 store cafe chain. Use clear, ground-level language that store teams can execute. Prefer FOH/BOH terms. Avoid jargon. Keep it concise and practical. Avoid generic responses. Ensure you are referring to the specific store's context as per the checklist data below.

Format the output as plain bullet points and short sections. Do NOT use JSON, code blocks, or tables. Do not include any commentary about instructions, formatting, or meta-guidelines.`;
  const promptSWOT = `${basePrompt}\n\nTask: Provide only a SWOT for the store.\n- Use BOTH checklists (Ops + Training).\n- 4 headings with exactly 3 bullets each.\n- Use concrete observations (Ops: Yes → strengths; No → weaknesses/threats. Training: strong LMS/BT/TSA → strengths; gaps → weaknesses).\n- Output as plain bullet points (no JSON, no code fences).\nDo not include RCA or CAPA.\n\nFailed OPS checkpoints (focus for W/T):\n${failedListText}\n\nOPS Checklist JSON:\n${JSON.stringify(dataOps, null, 2)}\n\nTraining Audit JSON:\n${JSON.stringify(dataTrain, null, 2)}`;
  const promptRCA = `${basePrompt}\n\nTask: Provide only Root Cause Analysis per failed OPS checkpoint, using BOTH checklists (Ops + Training).\n- For EACH failed checkpoint, output exactly ONE bullet in this format:\n  - <checkpoint>: <root cause> (primary cause: People/Process/Equipment/Materials/Environment/Measurement); Evidence: <what to check>\n- Keep each bullet short (single line).\n- Output as plain text (no JSON, no code fences).\n- Do NOT include any text about instructions or formatting.\n\nUse Training Audit signals to refine causes (e.g., LMS usage, Buddy Trainer availability, OJT/TSA scores). If SOPs do not state it explicitly, infer a plausible operational root cause and label it (Inference).\n\nExamples:\n- Washrooms cleaned; checklist updated: Checklist exists but hourly checks not enforced (Process); Evidence: last 7 days of hourly logs, supply stock, assignment on roster\n- Temperature checks with Therma Pen; logs updated: Calibration not verified; logging done post-facto (Measurement/Process); Evidence: calibration record, spot-check readings vs logs\n- FDU counter neat and fully stocked: Planogram not visible; replenishment not assigned (Process); Evidence: planogram print, shift handover, photo vs planogram\n\nFailed OPS checkpoints (with any section notes):\n${failed.map((f,i)=>`${i+1}. [${f.category}] ${f.checkpoint}${f.sectionObservation?` — Note: ${f.sectionObservation}`:''}`).join('\n')}\n\nOPS Checklist JSON:\n${JSON.stringify(dataOps, null, 2)}\n\nTraining Audit JSON:\n${JSON.stringify(dataTrain, null, 2)}`;
  const promptCAPA = `${basePrompt}\n\nTask: Provide only CAPA per failed OPS checkpoint (ground-level), using BOTH checklists (Ops + Training).\nFor EACH failed checkpoint, output 1 bullet with this structure (plain text, no JSON, no code fences):\n- <checkpoint>\n  • Immediate: <what to do now>\n  • Owner: <role>\n  • When: <due window>\n  • Verify: <how to verify (photo/log/reading)>\n  • Follow-up: <monitoring cadence>\nUse Training Audit insights (e.g., LMS/BT/OJT/TSA gaps) to add quick skill/knowledge fixes where relevant. Do not include SWOT or RCA.\n\nFailed OPS checkpoints:\n${failedListText}\n\nOPS Checklist JSON:\n${JSON.stringify(dataOps, null, 2)}\n\nTraining Audit JSON:\n${JSON.stringify(dataTrain, null, 2)}`;
    const prompt = section === "swot" ? promptSWOT : section === "rca" ? promptRCA : promptCAPA;

    setAiAnalysis(a => ({ ...a, loading: true, error: "" }));

    const run = async () => {
      // Try RAG first if enabled and healthy
  if (ragReady) {
        try {
          const q = section === 'swot'
            ? `Provide only SWOT grounded in SOPs with 3 bullets per heading. Use "No" answers as weaknesses/threats. Output as plain text bullet points (no JSON, no code fences). If not present in SOPs, say "Not in docs."\n\nFailed checkpoints:\n${failedListText}\n\nChecklist (for context):\n${JSON.stringify(data, null, 2)}`
            : section === 'rca'
            ? `Provide only RCA per failed OPS checkpoint grounded in SOPs, using BOTH checklists (Ops + Training). Output exactly one bullet per failed checkpoint in the form: - <checkpoint>: <root cause> (primary cause: People/Process/Equipment/Materials/Environment/Measurement); Evidence: <what to check>. Use plain text only (no JSON, no code fences). If SOPs do not cover it explicitly, provide a best-practice inferred root cause labeled (Inference). Do not include any sentences about formatting or instructions.\n\nFailed OPS checkpoints (with any notes):\n${failed.map((f,i)=>`${i+1}. [${f.category}] ${f.checkpoint}${f.sectionObservation?` — Note: ${f.sectionObservation}`:''}`).join('\n')}\n\nOPS Checklist (for context):\n${JSON.stringify(dataOps, null, 2)}\n\nTraining Audit (for context):\n${JSON.stringify(dataTrain, null, 2)}`
            : `Provide CAPA per failed OPS checkpoint grounded in SOPs, using BOTH checklists (Ops + Training). For EACH, include: Immediate, Owner, When, Verify, Follow-up. Output as plain text bullet points (no JSON, no code fences). If not present in SOPs, say "Not in docs."\n\nFailed OPS checkpoints:\n${failedListText}\n\nOPS Checklist (for context):\n${JSON.stringify(dataOps, null, 2)}\n\nTraining Audit (for context):\n${JSON.stringify(dataTrain, null, 2)}`;
          const text = await askRAG(q);
          if (text) {
            const next = {
              swot: cached?.swot || "",
              rca: cached?.rca || "",
              capa: cached?.capa || "",
              loading: false,
              error: "",
              usedModel: 'rag',
              usedBase: '/rag',
            };
            if (section === 'swot') next.swot = text;
            else if (section === 'rca') {
              const lines = text.split(/\r?\n/).filter(l=>/^\s*[-*•]\s+/.test(l));
              const good = lines.length >= failed.length && /evidence\s*:/i.test(text);
              next.rca = good ? text.trim() : ruleBasedRCA(failed);
            }
            else next.capa = text;
            setAiAnalysis(next);
            try { localStorage.setItem(`analysis:${selectedStoreId}`, JSON.stringify(next)); } catch {}
            return;
          }
        } catch (e) {
          // fall through to direct LLM
          try { console.warn('RAG failed, falling back:', e); } catch {}
        }
      }

      const qs = new URLSearchParams(window.location.search);
      const qpBase = (qs.get("ollama") || "").trim();
      const qpModel = (qs.get("model") || "").trim();
      const bases = [
        qpBase,
        (import.meta?.env?.VITE_OLLAMA_BASE || "").trim(),
        "http://localhost:11434",
        "/ollama",
      ].filter(Boolean);
      const pref = (qpModel || import.meta?.env?.VITE_OLLAMA_MODEL || "llama3.2:1b").trim();
      const prefAlt = pref.endsWith("-instruct") ? pref.replace(/-instruct$/, "") : `${pref}-instruct`;
      const models = Array.from(new Set([
        pref,
        prefAlt,
        "llama3.2:1b",
        "llama3.2:1b-instruct",
      ]));

      let lastError = "";
      for (const base of bases) {
        for (const model of models) {
          try {
            // Try legacy generate endpoint first
            const resp = await fetch(`${base}/api/generate`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ model, prompt, stream: false }),
            });
            if (!resp.ok) {
              // Try to parse error body (e.g., model not found)
              try {
                const err = await resp.json();
                const msg = String(err?.error || `${resp.status} ${resp.statusText}`);
                // If model not found at this base, try next model
                if (/model\s+.*not\s+found/i.test(msg)) { lastError = msg; continue; }
                // If route not found (older/newer API?), try chat endpoint fallback
                if (resp.status === 404) {
                  const chat = await fetch(`${base}/api/chat`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], stream: false }),
                  });
                  if (!chat.ok) {
                    try {
                      const ej = await chat.json();
                      lastError = String(ej?.error || `${chat.status} ${chat.statusText}`);
                    } catch {
                      lastError = `${chat.status} ${chat.statusText}`;
                    }
                    continue;
                  }
                  const cj = await chat.json();
                  const text = String(cj?.message?.content || cj?.response || cj?.message || "");
                  if (!text) { lastError = "Empty response"; continue; }
                  const next = {
                    swot: cached?.swot || "",
                    rca: cached?.rca || "",
                    capa: cached?.capa || "",
                    loading: false,
                    error: "",
                    usedModel: model,
                    usedBase: base,
                  };
                  if (section === "swot") next.swot = text.trim();
                  else if (section === "rca") {
                    const lines = text.split(/\r?\n/).filter(l=>/^\s*[-*•]\s+/.test(l));
                    const good = lines.length >= failed.length && /evidence\s*:/i.test(text);
                    next.rca = good ? text.trim() : ruleBasedRCA(failed);
                  }
                  else next.capa = text.trim();
                  try { console.info("AI via", base, "model", model, "(chat)"); } catch {}
                  setAiAnalysis(next);
                  try { localStorage.setItem(`analysis:${selectedStoreId}`, JSON.stringify(next)); } catch {}
                  return;
                }
                lastError = msg;
              } catch {
                lastError = `${resp.status} ${resp.statusText}`;
              }
              continue;
            }
            const res = await resp.json();
            if (!res) { lastError = "Empty response"; continue; }
            const text = (res && (res.response || res.message)) ? String(res.response || res.message) : "";
            if (!text) { lastError = res.error || "No text"; continue; }
            const next = {
              swot: cached?.swot || "",
              rca: cached?.rca || "",
              capa: cached?.capa || "",
              loading: false,
              error: "",
              usedModel: model,
              usedBase: base,
            };
            if (section === "swot") next.swot = text.trim();
            else if (section === "rca") {
              const lines = text.split(/\r?\n/).filter(l=>/^\s*[-*•]\s+/.test(l));
              const good = lines.length >= failed.length && /evidence\s*:/i.test(text);
              next.rca = good ? text.trim() : ruleBasedRCA(failed);
            }
            else next.capa = text.trim();
            try { console.info("AI via", base, "model", model); } catch {}
            setAiAnalysis(next);
            try { localStorage.setItem(`analysis:${selectedStoreId}`, JSON.stringify(next)); } catch {}
            return;
          } catch (e) {
            lastError = e?.message || String(e);
          }
        }
      }
      // If AI failed, provide rule-based fallback for CAPA to keep the flow practical
      if (section === 'capa') {
        const text = ruleBasedCAPA(failed);
        const next = {
          swot: cached?.swot || '',
          rca: cached?.rca || '',
          capa: text,
          loading: false,
          error: '',
          usedModel: 'rule',
          usedBase: 'local',
        };
        setAiAnalysis(next);
        try { localStorage.setItem(`analysis:${selectedStoreId}`, JSON.stringify(next)); } catch {}
      } else {
        // Add actionable hint when model is missing or API path differs
        const hint = /not\s*found/i.test(lastError || "")
          ? `${lastError}. Install the model or set ?model= to an installed tag. Example: ollama pull "llama3.2:1b"`
          : (lastError || "Failed to reach Ollama");
        setAiAnalysis(a => ({ ...a, loading: false, error: hint }));
      }
    };
    run();
  }, [selectedStoreId, submittedChecklists, tab]);

  // Test AI connectivity and selected model
  const testAI = async () => {
    try {
      const qs = new URLSearchParams(window.location.search);
      const qpBase = (qs.get("ollama") || "").trim();
      const bases = [
        qpBase,
        (import.meta?.env?.VITE_OLLAMA_BASE || "").trim(),
        "http://localhost:11434",
        "/ollama",
      ].filter(Boolean);
      const pref = (qs.get("model") || import.meta?.env?.VITE_OLLAMA_MODEL || "llama3.2:1b").trim();
      const prefAlt = pref.endsWith("-instruct") ? pref.replace(/-instruct$/, "") : `${pref}-instruct`;
      const modelsPref = [pref, prefAlt];
      let lastError = "";
      for (const base of bases) {
        // Try to read installed models first
        try {
          const tags = await fetch(`${base}/api/tags`, { method: "GET" });
          if (tags.ok) {
            const data = await tags.json();
            const names = (data?.models || []).map((m) => m?.name).filter(Boolean);
            // Prefer our defaults if present; else pick first llama*
            const pick = modelsPref.find(m => names.includes(m))
              || names.find(n => /^llama/i.test(n))
              || names[0];
            if (!pick) {
              alert(`AI reachable at ${base}, but no models installed. Try: ollama pull "${pref}"`);
              continue;
            }
            // Smoke test via generate, then chat fallback
            try {
              const r = await fetch(`${base}/api/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ model: pick, prompt: "Reply OK", stream: false }),
              });
              if (r.ok) {
                const j = await r.json();
                const txt = String(j?.response || j?.message || "").trim();
                if (txt) { alert(`AI OK via ${base} using ${pick}`); return; }
              }
              // Fallback to chat
              const c = await fetch(`${base}/api/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ model: pick, messages: [{ role: "user", content: "Reply OK" }], stream: false }),
              });
              if (c.ok) {
                const j = await c.json();
                const txt = String(j?.message?.content || j?.response || j?.message || "").trim();
                if (txt) { alert(`AI OK via ${base} using ${pick} (chat)`); return; }
              }
              lastError = `${r.status} ${r.statusText}`;
            } catch (e) {
              lastError = e?.message || String(e);
            }
          } else {
            lastError = `${tags.status} ${tags.statusText}`;
          }
        } catch (e) {
          lastError = e?.message || String(e);
        }
        // If tags endpoint not available, try direct preference
        for (const model of models) {
          try {
            const r = await fetch(`${base}/api/generate`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ model, prompt: "Reply OK", stream: false }),
            });
            if (!r.ok) {
              try { const jj = await r.json(); lastError = String(jj?.error || `${r.status} ${r.statusText}`); } catch { lastError = `${r.status} ${r.statusText}`; }
              // Try chat fallback
              const c = await fetch(`${base}/api/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ model, messages: [{ role: "user", content: "Reply OK" }], stream: false }),
              });
              if (c.ok) {
                const j = await c.json();
                const txt = String(j?.message?.content || j?.response || j?.message || "").trim();
                if (txt) { alert(`AI OK via ${base} using ${model} (chat)`); return; }
              }
              continue;
            }
            const j = await r.json();
            const txt = String(j?.response || j?.message || "").trim();
            if (!txt) { lastError = "Empty response"; continue; }
            alert(`AI OK via ${base} using ${model}`);
            return;
          } catch (e) { lastError = e?.message || String(e); }
        }
      }
      alert(`AI check failed: ${lastError || "unable to reach Ollama"}`);
    } catch (e) {
      alert(`AI check error: ${e?.message || String(e)}`);
    }
  };

  

  // Master data
  const [rms, setRms] = useState(() => load("capa.rms", SEED_RMS));
  const [regions, setRegions] = useState(() => load("capa.regions", REGIONS));
  const [managers, setManagers] = useState(() => load("capa.managers", SEED_MANAGERS));
  const [stores, setStores] = useState(() => load("capa.stores", SEED_STORES));
  const [items, setItems] = useState(() => load("capa.items", []));

  // Role & scope
  const ROLES = [
    { id: "SUPER", label: "Super Admin" },
    { id: "OPS", label: "Ops Head" },
    { id: "RM", label: "Region Manager" },
    { id: "AM", label: "Area Manager" },
  ];
  const [role, setRole] = useState(() => load("capa.role", "AM"));
  const [urlUserId, setUrlUserId] = useState("");
  const lockedByURL = !!urlUserId;
  const [activeAM, setActiveAM] = useState(() => load("capa.activeAM", SEED_MANAGERS[0]?.id || ""));
  const [activeRegion, setActiveRegion] = useState(() => load("capa.activeRegion", REGIONS[0]?.id || "north"));
  const canEdit = role === "SUPER"; // only Super Admin can edit

  // Tabs by role (role must exist before computing)
  const tabs = useMemo(() => (
    role === "AM" || role === "RM"
      ? ["Checklist", "CAPA"]
      : ["Checklist", "SWOT", "RCA", "CAPA"]
  ), [role]);
  useEffect(() => { if (!tabs.includes(tab)) setTab("CAPA"); }, [tabs, tab]);

  // Persist
  useEffect(() => save("capa.rms", rms), [rms]);
  useEffect(() => save("capa.regions", regions), [regions]);
  useEffect(() => save("capa.managers", managers), [managers]);
  useEffect(() => save("capa.stores", stores), [stores]);
  useEffect(() => save("capa.items", items), [items]);
  useEffect(() => save("capa.role", role), [role]);
  useEffect(() => save("capa.activeAM", activeAM), [activeAM]);
  useEffect(() => save("capa.activeRegion", activeRegion), [activeRegion]);

  // URL-based identity → permissions
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const id = (params.get("id") || "").toLowerCase().trim();
      if (!id) return;
      setUrlUserId(id);
      if (id === "h541") { setRole("SUPER"); return; }              // Super Admin (Amritanshu Prasad)
      const am = managers.find((m) => m.id.toLowerCase() === id);
      if (am) { setRole("AM"); setActiveAM(am.id); setActiveRegion(am.regionId); return; }
      const rm = rms.find((r) => r.id.toLowerCase() === id);
      if (rm) { setRole("RM"); setActiveRegion(rm.regionId); return; }
      if (["ops","ops-head","headofops","headops"].includes(id)) { setRole("OPS"); return; }
    } catch {}
  }, [managers, rms]);

  // Local dev (terminal access): default to Super Admin when no URL id is set
  useEffect(() => {
    try {
      const host = window.location.hostname;
      const isLocal = host === "localhost" || host === "127.0.0.1" || host === "::1";
      const isDev = import.meta?.env?.DEV;
      if ((isLocal || isDev) && !urlUserId) setRole("SUPER");
    } catch {}
  }, [urlUserId]);

  // Filters
  const [filterAM, setFilterAM] = useState("");
  const [filterStore, setFilterStore] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("");
  const [query, setQuery] = useState("");
  // AI section search (for store pills)
  const [aiFilterAM, setAiFilterAM] = useState("");
  const [aiFilterRM, setAiFilterRM] = useState("");
  const [aiStoreQuery, setAiStoreQuery] = useState("");
  const aiFilteredStores = useMemo(() => {
    const rmRegionId = aiFilterRM ? (rms.find(r => r.id === aiFilterRM)?.regionId || "") : "";
    const q = aiStoreQuery.trim().toLowerCase();
    let arr = stores;
    if (aiFilterAM) arr = arr.filter(s => s.managerId === aiFilterAM);
    if (aiFilterRM && rmRegionId) arr = arr.filter(s => s.regionId === rmRegionId);
    if (q) arr = arr.filter(s => `${s.id} ${s.name}`.toLowerCase().includes(q));
    return arr;
  }, [stores, aiFilterAM, aiFilterRM, aiStoreQuery, rms]);

  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);

  // Checklist tab: view toggle and shared audit meta
  const [checklistView, setChecklistView] = useState(() => {
    try { return localStorage.getItem('checklist.view') || 'ops'; } catch { return 'ops'; }
  });
  useEffect(() => { try { localStorage.setItem('checklist.view', checklistView); } catch {} }, [checklistView]);

  const [auditMeta, setAuditMeta] = useState(() => {
    try { return JSON.parse(localStorage.getItem('audit.meta')) || { peopleOnShift: '', auditTime: '', monthSalesTarget: '', lastAuditScore: '' }; }
    catch { return { peopleOnShift: '', auditTime: '', monthSalesTarget: '', lastAuditScore: '' }; }
  });
  useEffect(() => { try { localStorage.setItem('audit.meta', JSON.stringify(auditMeta)); } catch {} }, [auditMeta]);

  // Scope helpers
  const amInRegion = useMemo(() => managers.filter((m) => m.regionId === activeRegion), [managers, activeRegion]);
  const storesInRegion = useMemo(() => stores.filter((s) => s.regionId === activeRegion), [stores, activeRegion]);

  const inScope = (it) => {
    if (role === "SUPER" || role === "OPS") return true;
    if (role === "RM") return stores.find((s) => s.id === it.storeId)?.regionId === activeRegion;
    if (role === "AM") return it.managerId === activeAM;
    return true;
  };

  // Derived maps
  const managerById = useMemo(() => Object.fromEntries(managers.map((m) => [m.id, m])), [managers]);
  const storeById = useMemo(() => Object.fromEntries(stores.map((s) => [s.id, s])), [stores]);

  // Visible items within scope
  const filtered = useMemo(() => {
    // Apply scope first
    let arr = items.filter((it) => inScope(it));
    // Filters
    if (filterAM) arr = arr.filter((it) => it.managerId === filterAM);
    if (filterStore) arr = arr.filter((it) => it.storeId === filterStore);
    if (filterStatus) arr = arr.filter((it) => it.status === filterStatus);
    if (filterSeverity) arr = arr.filter((it) => it.severity === filterSeverity);
    // Free-text query across key fields
    const q = (query || "").toLowerCase().trim();
    if (q) {
      arr = arr.filter((it) => {
        const hay = [
          it.observation,
          it.rootCause,
          it.correctiveAction,
          it.preventiveAction,
          it.owner,
          it.status,
          it.severity,
          it.category,
          managerById[it.managerId]?.name,
          storeById[it.storeId]?.name,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }
    return arr;
  }, [items, role, activeAM, activeRegion, filterAM, filterStore, filterStatus, filterSeverity, query, managers, stores]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const byStatus = {};
    let overdue = 0;
    for (const it of filtered) {
      byStatus[it.status] = (byStatus[it.status] || 0) + 1;
      if (
        it.dueDate && new Date(it.dueDate) < new Date() &&
        ["Open", "In-Progress", "On-Hold"].includes(it.status)
      ) overdue++;
    }
    return { total, byStatus, overdue };
  }, [filtered]);

  // CRUD
  const onSave = (form) => {
    if (!canEdit) { alert("View-only: Super Admin"); return; }
    if (!form.managerId || !form.storeId || !form.observation) {
      alert("Area Manager, Store and Observation are mandatory."); return;
    }
    const regionId = storeById[form.storeId]?.regionId || managerById[form.managerId]?.regionId || "";
    const record = { ...form, regionId };
    setItems((prev) => {
      const exists = prev.some((p) => p.id === record.id);
      return exists ? prev.map((p) => (p.id === record.id ? record : p)) : [record, ...prev];
    });
    setShowForm(false); setEditItem(null);
  };

  const onQuick = (item, key, value) => {
    if (!canEdit) { alert("View-only: Super Admin"); return; }
    setItems((prev) => prev.map((p) => (p.id === item.id ? { ...p, [key]: value, updatedAt: new Date().toISOString() } : p)));
  };

  const onClose = (item) => {
    if (!canEdit) { alert("View-only: Super Admin"); return; }
    setItems((prev) =>
      prev.map((p) => (p.id === item.id ? { ...p, status: "Verified", followUpDate: p.followUpDate || todayISO(), updatedAt: new Date().toISOString() } : p))
    );
  };

  const exportCSV = () => {
    const rows = filtered.map((r) => ({ ...r, managerName: managerById[r.managerId]?.name || "", storeName: storeById[r.storeId]?.name || "" }));
    download(`capa_export_${todayISO()}.csv`, toCSV(rows));
  };
  const exportJSON = () => download(`capa_backup_${todayISO()}.json`, JSON.stringify({ rms, regions, managers, stores, items }, null, 2));
  const importJSON = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.rms) setRms(data.rms);
        if (data.regions) setRegions(data.regions);
        if (data.managers) setManagers(data.managers);
        if (data.stores) setStores(data.stores);
        if (data.items) setItems(data.items);
        alert("Imported successfully");
      } catch { alert("Invalid JSON"); }
    };
    reader.readAsText(file);
  };
  const importMaster = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const { regions: rgs, rms: rr, managers: mm, stores: ss } = parseMaster(text);
        if (rgs.length) setRegions(rgs);
        if (rr.length) setRms(rr);
        if (mm.length) setManagers(mm);
        if (ss.length) setStores(ss);
        alert(`Imported master: ${ss.length} stores, ${mm.length} AMs, ${rr.length} RMs, ${rgs.length} regions`);
      } catch (err) {
        console.error(err);
        alert("Could not parse master file. Expected TSV cols: StoreId, StoreName, AMName, AMId, <ignored>, Region, RMName, RMId");
      }
    };
    reader.readAsText(file);
  };

  // Demo data
  const seedDemoData = () => {
    const demo = [
      {
        id: uid(), regionId: "south", managerId: "h546", storeId: "S002",
        category: "Customer Experience", severity: "High",
        observation: "Queue spillover at lunch", rootCause: "Understaffed peak hour",
        correctiveAction: "Add 1 cashier 12-2 PM", preventiveAction: "Revise roster for weekends",
        owner: "S002-Lead", dueDate: todayISO(), followUpDate: "",
        status: "In-Progress", effectiveness: "", evidenceUrl: "", reviewNotes: "",
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      },
      {
        id: uid(), regionId: "north", managerId: "h955", storeId: "S024",
        category: "Cleanliness & Hygiene", severity: "Medium",
        observation: "Backroom clutter", rootCause: "No end-of-day checklist",
        correctiveAction: "Clear EOD; assign checker", preventiveAction: "Add checklist to daily ops",
        owner: "S024-SM", dueDate: todayISO(), followUpDate: "",
        status: "Open", effectiveness: "", evidenceUrl: "", reviewNotes: "",
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      },
      {
        id: uid(), regionId: "west", managerId: "h3386", storeId: "S043",
        category: "Equipment & Maintenance", severity: "Critical",
        observation: "Freezer temp fluctuating", rootCause: "Door seal worn",
        correctiveAction: "Replace seal", preventiveAction: "Monthly seal inspection",
        owner: "Tech-Vendor", dueDate: todayISO(), followUpDate: todayISO(),
        status: "Done", effectiveness: "", evidenceUrl: "", reviewNotes: "",
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      },
    ];
    setItems((prev) => [...demo, ...prev]);
  };

  const clearAllData = () => {
    if (!confirm("This will clear regions, managers, stores, RMs, and CAPAs from this browser. Continue?")) return;
    setRms(SEED_RMS); setRegions(REGIONS); setManagers(SEED_MANAGERS); setStores(SEED_STORES); setItems([]);
    setRole("AM"); setActiveAM(SEED_MANAGERS[0]?.id || ""); setActiveRegion(REGIONS[0]?.id || "north");
  };

  // UI labels
  const roleLabel = ROLES.find((r) => r.id === role)?.label;
  const activeRM = useMemo(() => rms.find((r) => r.regionId === activeRegion), [rms, activeRegion]);
  const scopeLabel =
    role === "SUPER"
      ? "Super Admin – Amritanshu Prasad (h541)"
      : role === "OPS"
      ? "All Regions"
      : role === "RM"
      ? `Region: ${regions.find((r) => r.id === activeRegion)?.name}`
      : `AM: ${managers.find((m) => m.id === activeAM)?.name ? `${managers.find((m) => m.id === activeAM)?.name} (${activeAM})` : activeAM}`;

  // Self‑tests (won't block UI)
  useEffect(() => {
    try {
      // Existing tests
      console.assert(nextStatus("Open") === "In-Progress", "nextStatus step");
      console.assert(nextStatus("Verified") === "Open", "nextStatus wrap");

      const sampleTSV = "S001\tStore A\tSam\tsam01\t-\tNorth\tRita\trm01";
      const parsedTSV = parseMaster(sampleTSV);
      console.assert(parsedTSV.stores.length === 1 && parsedTSV.managers.length === 1, "parseMaster TSV basic");

      const sampleCSV = "S010,Store X,A,ax,-,South,R,rm02\r\nS011,Store Y,B,bx,-,North,R,rm03";
      const parsedCSV = parseMaster(sampleCSV);
      console.assert(parsedCSV.stores.length === 2 && parsedCSV.managers.length === 2, "parseMaster CSV basic (CRLF)");

      const headerLine = toCSV([{ id: 1 }]).split("\n")[0];
      console.assert(headerLine === CSV_HEADER.join(","), "toCSV header present");
      const csvEsc = toCSV([{ id: 'x', observation: 'a,"b"\nnew' }]);
      console.assert(csvEsc.includes('"a,""b"" new"'), "toCSV escapes quotes/newlines");

      console.assert(slugId("rm", " Hariharan & Co ").startsWith("rm-"), "slugId prefix");

      // Additional tests
      console.assert(slugId("am", "John   Doe!!!").includes("john-doe"), "slugId sanitizes");
      console.assert(slugId("rm", "a".repeat(80)).length <= 31, "slugId length cap (prefix+28)");

      const pmNoRM = parseMaster("S100,Store Z,A,az,-,South,,\n");
      console.assert(pmNoRM.managers.length === 1 && pmNoRM.rms.length >= 0, "parseMaster handles missing RM name");

      const order = ["Open","In-Progress","On-Hold","Done","Verified","Open"];
      let s = "Open"; for (let i=1;i<order.length;i++) { s = nextStatus(s); console.assert(s === order[i], `nextStatus step ${i}`); }
    } catch {}
  }, []);

  return (
    <div id="app-theme-root">
  <div className="min-h-screen bg-white text-black transition-colors duration-300 pb-20">
      {/* Top Bar */}
  <div className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
      <div className="font-semibold tracking-tight">AM CAPA</div>
      <div className="text-xs text-slate-500">Ops, simplified</div>
        </div>
      </div>

      {/* Body: Single column content */}
      <div className="mx-auto max-w-3xl px-3 sm:px-4 py-4">
  {/* Top Tabs removed per request — bottom tab bar remains for navigation */}

        {/* Main content */}
        <main className="fade-in">
          {tab === "Checklist" && (
            <section className="fade-in space-y-6">
              {/* Toggle buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex rounded-xl border border-slate-300 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setChecklistView('ops')}
                    className={`px-4 py-2 text-sm ${checklistView==='ops' ? 'bg-black text-white' : 'bg-white text-slate-800 hover:bg-slate-50'}`}
                    aria-pressed={checklistView==='ops'}
                  >AM Ops Checklist</button>
                  <button
                    type="button"
                    onClick={() => setChecklistView('training')}
                    className={`px-4 py-2 text-sm ${checklistView==='training' ? 'bg-black text-white' : 'bg-white text-slate-800 hover:bg-slate-50'}`}
                    aria-pressed={checklistView==='training'}
                  >Training Audit</button>
                </div>
              </div>

              {/* Shared audit meta */}
              <div className="rounded-2xl glass p-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <TextInput
                    label="People on shift"
                    type="number"
                    min="0"
                    value={auditMeta.peopleOnShift}
                    onChange={(e)=>setAuditMeta(m=>({ ...m, peopleOnShift: e.target.value }))}
                  />
                  <TextInput
                    label="Time of audit"
                    type="datetime-local"
                    value={auditMeta.auditTime}
                    onChange={(e)=>setAuditMeta(m=>({ ...m, auditTime: e.target.value }))}
                  />
                  <TextInput
                    label="Month sales target"
                    type="number"
                    min="0"
                    step="0.01"
                    value={auditMeta.monthSalesTarget}
                    onChange={(e)=>setAuditMeta(m=>({ ...m, monthSalesTarget: e.target.value }))}
                  />
                  <TextInput
                    label="Last audit score"
                    type="number"
                    min="0"
                    step="1"
                    value={auditMeta.lastAuditScore}
                    onChange={(e)=>setAuditMeta(m=>({ ...m, lastAuditScore: e.target.value }))}
                  />
                </div>
              </div>

              {/* Active checklist */}
              <div>
                {checklistView === 'ops' ? (
                  <>
                    <h2 className="text-xl font-semibold mb-3">Ops Excellence Checklist</h2>
                    <ChecklistUI />
                  </>
                ) : (
                  <>
                    <h2 className="text-xl font-semibold mb-3">Training Audit</h2>
                    <TrainingAuditUI />
                  </>
                )}
              </div>
            </section>
          )}


          {/* End of main checklist section */}



          {tab === "SWOT" && (role === "SUPER" || role === "OPS") && (
            <section className="fade-in">
              <h2 className="text-xl font-semibold mb-3">SWOT (AI)</h2>
              <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
                <button
                  disabled={ragBusy}
                  onClick={async ()=>{
                    setRagBusy(true);
                    try {
                      const r = await fetch('/rag/api/build', { method: 'POST' });
                      if (r.ok) {
                        const j = await r.json();
                        if (j.ok) { alert(`SOP index built: ${j.files} files, ${j.chunks} chunks`); setRagReady(true); }
                        else alert('Build failed: ' + j.error);
                      } else { alert('Build failed: ' + r.status + ' ' + r.statusText); }
                    } catch (e) { alert('Build error: ' + (e?.message || String(e))); }
                    finally { setRagBusy(false); }
                  }}
                  className="rounded-lg border border-slate-300 px-3 py-1"
                >{ragBusy ? 'Building…' : 'Build SOP Index'}</button>
                <span className={`text-xs ${ragReady ? 'text-emerald-600' : 'text-slate-500'}`}>RAG: {ragReady ? 'Ready' : 'Not ready'}</span>
              </div>
              {/* AI store search controls */}
              <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Select
                  label="RM"
                  value={aiFilterRM}
                  onChange={(e) => setAiFilterRM(e.target.value)}
                  options={rms.map(r => ({ value: r.id, label: `${r.name} (${r.id})` }))}
                />
                <Select
                  label="AM"
                  value={aiFilterAM}
                  onChange={(e) => setAiFilterAM(e.target.value)}
                  options={managers.map(m => ({ value: m.id, label: `${m.name} (${m.id})` }))}
                />
                <TextInput label="Store search" placeholder="name or code" value={aiStoreQuery} onChange={(e) => setAiStoreQuery(e.target.value)} />
              </div>
              <div className="mb-3 flex flex-wrap gap-2">
                {(aiFilterAM || aiFilterRM || aiStoreQuery ? aiFilteredStores : []).map(s => {
                  const hasData = submittedChecklists.some(c => c.storeId === s.id);
                  return (
                    <button
                      key={s.id}
                      title={hasData ? `${s.id} — ${s.name}` : `No checklist yet for ${s.name}`}
                      onClick={() => setSelectedStoreId(s.id)}
                      className={`px-3 py-1 rounded-full border transition ${selectedStoreId === s.id ? 'bg-black text-white border-black' : 'bg-slate-100 text-slate-800 border-slate-300 hover:border-slate-400'} ${hasData ? '' : 'opacity-60'}`}
                    >{s.name}</button>
                  );
                })}
                {!(aiFilterAM || aiFilterRM || aiStoreQuery) && (
                  <div className="text-sm text-slate-500">Use the RM/AM pickers or type to search stores.</div>
                )}
              </div>
              {selectedStoreId && (
                <div className="rounded-2xl glass p-4">
                  {aiAnalysis.loading && (
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-slate-100 rounded" />
                      <div className="h-4 bg-slate-100 rounded w-5/6" />
                      <div className="h-4 bg-slate-100 rounded w-4/6" />
                    </div>
                  )}
                  {aiAnalysis.error && <div className="text-red-600">Error: {aiAnalysis.error}</div>}
                  {!aiAnalysis.loading && !aiAnalysis.error && aiAnalysis.swot && (
                    <>
                      <AnalysisView text={aiAnalysis.swot} />
                      {aiAnalysis.usedModel && (
                        <div className="mt-2 text-xs text-slate-500">Model: {aiAnalysis.usedModel} • Source: {aiAnalysis.usedBase}</div>
                      )}
                    </>
                  )}
                </div>
              )}
            </section>
          )}

          {tab === "RCA" && (role === "SUPER" || role === "OPS") && (
            <section className="fade-in">
              <h2 className="text-xl font-semibold mb-3">Root Cause Analysis (AI)</h2>
              <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
                <button
                  disabled={ragBusy}
                  onClick={async ()=>{
                    setRagBusy(true);
                    try {
                      const r = await fetch('/rag/api/build', { method: 'POST' });
                      if (r.ok) {
                        const j = await r.json();
                        if (j.ok) { alert(`SOP index built: ${j.files} files, ${j.chunks} chunks`); setRagReady(true); }
                        else alert('Build failed: ' + j.error);
                      } else { alert('Build failed: ' + r.status + ' ' + r.statusText); }
                    } catch (e) { alert('Build error: ' + (e?.message || String(e))); }
                    finally { setRagBusy(false); }
                  }}
                  className="rounded-lg border border-slate-300 px-3 py-1"
                >{ragBusy ? 'Building…' : 'Build SOP Index'}</button>
                <span className={`text-xs ${ragReady ? 'text-emerald-600' : 'text-slate-500'}`}>RAG: {ragReady ? 'Ready' : 'Not ready'}</span>
              </div>
              {/* AI store search controls */}
              <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Select
                  label="RM"
                  value={aiFilterRM}
                  onChange={(e) => setAiFilterRM(e.target.value)}
                  options={rms.map(r => ({ value: r.id, label: `${r.name} (${r.id})` }))}
                />
                <Select
                  label="AM"
                  value={aiFilterAM}
                  onChange={(e) => setAiFilterAM(e.target.value)}
                  options={managers.map(m => ({ value: m.id, label: `${m.name} (${m.id})` }))}
                />
                <TextInput label="Store search" placeholder="name or code" value={aiStoreQuery} onChange={(e) => setAiStoreQuery(e.target.value)} />
              </div>
              <div className="mb-3 flex flex-wrap gap-2">
                {(aiFilterAM || aiFilterRM || aiStoreQuery ? aiFilteredStores : []).map(s => {
                  const hasData = submittedChecklists.some(c => c.storeId === s.id);
                  return (
                    <button
                      key={s.id}
                      title={hasData ? `${s.id} — ${s.name}` : `No checklist yet for ${s.name}`}
                      onClick={() => setSelectedStoreId(s.id)}
                      className={`px-3 py-1 rounded-full border transition ${selectedStoreId === s.id ? 'bg-black text-white border-black' : 'bg-slate-100 text-slate-800 border-slate-300 hover:border-slate-400'} ${hasData ? '' : 'opacity-60'}`}
                    >{s.name}</button>
                  );
                })}
                {!(aiFilterAM || aiFilterRM || aiStoreQuery) && (
                  <div className="text-sm text-slate-500">Use the RM/AM pickers or type to search stores.</div>
                )}
              </div>
              {selectedStoreId && (
                <div className="rounded-2xl glass p-4">
                  {aiAnalysis.loading && (
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-slate-100 rounded" />
                      <div className="h-4 bg-slate-100 rounded w-5/6" />
                      <div className="h-4 bg-slate-100 rounded w-4/6" />
                    </div>
                  )}
                  {aiAnalysis.error && <div className="text-red-600">Error: {aiAnalysis.error}</div>}
                  {!aiAnalysis.loading && !aiAnalysis.error && aiAnalysis.rca && (
                    <>
                      <div className="mb-2 flex justify-end">
                        <button
                          className="rounded-lg border border-slate-300 px-3 py-1 text-xs"
                          onClick={() => setFormatMode(m => ({ ...m, rca: !m.rca }))}
                        >{formatMode.rca ? 'Raw' : 'Format'}</button>
                      </div>
                      {formatMode.rca ? (
                        <FormattedAnalysis text={aiAnalysis.rca} type="rca" />
                      ) : (
                        <AnalysisView text={aiAnalysis.rca} />
                      )}
                      {aiAnalysis.usedModel && (
                        <div className="mt-2 text-xs text-slate-500">Model: {aiAnalysis.usedModel} • Source: {aiAnalysis.usedBase}</div>
                      )}
                    </>
                  )}
                </div>
              )}
            </section>
          )}

          {tab === "CAPA" && (
            <section className="fade-in">
              <h2 className="text-xl font-semibold mb-3">CAPA (AI Recommendations)</h2>
              <div className="mb-3 flex flex-wrap items-center gap-3 text-sm">
                <button
                  disabled={ragBusy}
                  onClick={async ()=>{
                    setRagBusy(true);
                    try {
                      const r = await fetch('/rag/api/build', { method: 'POST' });
                      if (r.ok) {
                        const j = await r.json();
                        if (j.ok) { alert(`SOP index built: ${j.files} files, ${j.chunks} chunks`); setRagReady(true); }
                        else alert('Build failed: ' + j.error);
                      } else { alert('Build failed: ' + r.status + ' ' + r.statusText); }
                    } catch (e) { alert('Build error: ' + (e?.message || String(e))); }
                    finally { setRagBusy(false); }
                  }}
                  className="rounded-lg border border-slate-300 px-3 py-1"
                >{ragBusy ? 'Building…' : 'Build SOP Index'}</button>
                <span className={`text-xs ${ragReady ? 'text-emerald-600' : 'text-slate-500'}`}>RAG: {ragReady ? 'Ready' : 'Not ready'}</span>
                {role === 'SUPER' && (
                  <>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <span className="rounded-lg border border-slate-300 px-3 py-1">Upload SOP (.pdf/.txt)</span>
                      <input type="file" accept=".pdf,.txt" className="hidden" onChange={async (e)=>{
                        const f = e.target.files?.[0]; if (!f) return;
                        const reader = new FileReader();
                        reader.onload = async () => {
                          try {
                            const base64 = String(reader.result);
                            const r = await ragFetch('/api/upload', {
                              method: 'POST', headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ filename: f.name, contentBase64: base64 })
                            });
                            let j = null;
                            try { j = await r.json(); } catch {}
                            if (!r.ok || !j?.ok) {
                              const msg = (j && j.error) ? j.error : `${r.status} ${r.statusText}`;
                              alert('Upload failed: ' + msg);
                            } else {
                              alert('Uploaded: ' + j.file);
                            }
                          } catch (err) { alert('Upload error: ' + (err?.message || String(err))); }
                        };
                        reader.readAsDataURL(f);
                      }} />
                    </label>
                    <button
                      onClick={async ()=>{
                        try {
                          const r = await ragFetch('/api/docs');
                          const j = await r.json();
                          if (!r.ok || !j.ok) alert('Docs list failed');
                          else alert(j.files.map(x=>`${x.file} (${x.size}b)`).join('\n') || 'No docs');
                        } catch { alert('Docs list error'); }
                      }}
                      className="rounded-lg border border-slate-300 px-3 py-1"
                    >List SOP Docs</button>
                  </>
                )}
              </div>
              {/* AI store search controls */}
              <div className="mb-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Select
                  label="RM"
                  value={aiFilterRM}
                  onChange={(e) => setAiFilterRM(e.target.value)}
                  options={rms.map(r => ({ value: r.id, label: `${r.name} (${r.id})` }))}
                />
                <Select
                  label="AM"
                  value={aiFilterAM}
                  onChange={(e) => setAiFilterAM(e.target.value)}
                  options={managers.map(m => ({ value: m.id, label: `${m.name} (${m.id})` }))}
                />
                <TextInput label="Store search" placeholder="name or code" value={aiStoreQuery} onChange={(e) => setAiStoreQuery(e.target.value)} />
              </div>
              <div className="mb-3 flex flex-wrap gap-2">
                {(aiFilterAM || aiFilterRM || aiStoreQuery ? aiFilteredStores : []).map(s => {
                  const hasData = submittedChecklists.some(c => c.storeId === s.id);
                  return (
                    <button
                      key={s.id}
                      title={hasData ? `${s.id} — ${s.name}` : `No checklist yet for ${s.name}`}
                      onClick={() => setSelectedStoreId(s.id)}
                      className={`px-3 py-1 rounded-full border transition ${selectedStoreId === s.id ? 'bg-black text-white border-black' : 'bg-slate-100 text-slate-800 border-slate-300 hover:border-slate-400'} ${hasData ? '' : 'opacity-60'}`}
                    >{s.name}</button>
                  );
                })}
                {!(aiFilterAM || aiFilterRM || aiStoreQuery) && (
                  <div className="text-sm text-slate-500">Use the RM/AM pickers or type to search stores.</div>
                )}
              </div>
              {selectedStoreId && (
                <div className="rounded-2xl glass p-4">
                  {aiAnalysis.loading && (
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-slate-100 rounded" />
                      <div className="h-4 bg-slate-100 rounded w-5/6" />
                      <div className="h-4 bg-slate-100 rounded w-4/6" />
                    </div>
                  )}
                  {aiAnalysis.error && <div className="text-red-600">Error: {aiAnalysis.error}</div>}
                  {!aiAnalysis.loading && !aiAnalysis.error && aiAnalysis.capa && (
                    <>
                      <div className="mb-2 flex justify-end">
                        <button
                          className="rounded-lg border border-slate-300 px-3 py-1 text-xs"
                          onClick={() => setFormatMode(m => ({ ...m, capa: !m.capa }))}
                        >{formatMode.capa ? 'Raw' : 'Format'}</button>
                      </div>
                      {formatMode.capa ? (
                        <FormattedAnalysis text={aiAnalysis.capa} type="capa" />
                      ) : (
                        <AnalysisView text={aiAnalysis.capa} />
                      )}
                      {aiAnalysis.usedModel && (
                        <div className="mt-2 text-xs text-slate-500">Model: {aiAnalysis.usedModel} • Source: {aiAnalysis.usedBase}</div>
                      )}
                    </>
                  )}
                </div>
              )}
            </section>
          )}

          {tab === "CAPA" && (
            <section>
              {/* Header Actions */}
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
          <p className="text-sm text-black/80">
                    Store-wise opportunities → Root cause → CAPA → Close with evidence.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {role === "SUPER" && (
                    <button
                      onClick={() => { setEditItem(null); setShowForm(true); }}
                      className="rounded-xl bg-black text-white dark:bg-white dark:text-black px-4 py-2"
                    >
                      + New CAPA
                    </button>
                  )}
                  {role === "SUPER" && (
                    <button onClick={testAI} className="rounded-xl border border-emerald-300 px-3 py-2">
                      Test AI
                    </button>
                  )}
                  <button onClick={exportCSV} className="rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2">
                    Export CSV
                  </button>
                  <button onClick={exportJSON} className="rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2">
                    Backup JSON
                  </button>
                  {role === "SUPER" && (
                    <label className="rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 cursor-pointer">
                      Restore
                      <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importJSON(e.target.files[0])} />
                    </label>
                  )}
                  {role === "SUPER" && (
                    <label className="rounded-xl border border-emerald-300 px-3 py-2 cursor-pointer">
                      Import Master Data
                      <input type="file" accept=".csv,.tsv,text/tab-separated-values,text/csv" className="hidden" onChange={(e) => e.target.files?.[0] && importMaster(e.target.files[0])} />
                    </label>
                  )}
                  {role === "SUPER" && items.length === 0 && (
                    <button onClick={seedDemoData} className="rounded-xl border border-indigo-300 px-3 py-2">
                      Load Demo Data
                    </button>
                  )}
                  {role === "SUPER" && (
                    <button onClick={clearAllData} className="rounded-xl border border-rose-300 px-3 py-2">
                      Clear All
                    </button>
                  )}
                  {role === "SUPER" && (
                    <button
                      onClick={() => {
                        try {
                          const keys = [];
                          for (let i = 0; i < localStorage.length; i++) {
                            const k = localStorage.key(i);
                            if (k && k.startsWith("analysis:")) keys.push(k);
                          }
                          keys.forEach((k) => localStorage.removeItem(k));
                        } catch {}
                        setAiAnalysis({ swot: "", rca: "", capa: "", loading: false, error: "" });
                        setSelectedStoreId("");
                        alert("Cleared AI analysis cache for all stores.");
                      }}
                      className="rounded-xl border border-amber-300 px-3 py-2"
                    >
                      Clear AI Analysis
                    </button>
                  )}
                </div>
              </header>

              {/* Role & Scope */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                <Select label="Role" value={role} onChange={(e) => setRole(e.target.value)} options={ROLES.map((r) => ({ value: r.id, label: r.label }))} disabled={lockedByURL} />
                {role === "AM" && (
                  <Select
                    label="Area Manager (scope)"
                    value={activeAM}
                    onChange={(e) => { setActiveAM(e.target.value); setActiveRegion(managers.find((m) => m.id === e.target.value)?.regionId || activeRegion); }}
                    options={managers.map((m) => ({ value: m.id, label: `${m.name} (${m.id}) – ${regions.find((r) => r.id === m.regionId)?.name}` }))}
                  />
                )}
                {role === "RM" && (
                  <Select label="Region (scope)" value={activeRegion} onChange={(e) => setActiveRegion(e.target.value)} options={regions.map((r) => ({ value: r.id, label: r.name }))} />
                )}
                {role === "RM" && (
                  <Select label="Region Manager (auto)" value={activeRM?.id || ""} onChange={() => {}} options={rms.filter((r) => r.regionId === activeRegion).map((r) => ({ value: r.id, label: r.name }))} />
                )}
                <div className="rounded-2xl glass p-3 flex items-center text-sm md:col-span-4">
                  <span className="text-black">
                    Viewing as <b>{roleLabel}</b> — <i>{scopeLabel}</i>
                  </span>
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
                {role !== "AM" && (
                  <Select
                    label="Area Manager"
                    value={filterAM}
                    onChange={(e) => { setFilterAM(e.target.value); setFilterStore(""); }}
                    options={(role === "RM" ? amInRegion : managers).map((m) => ({ value: m.id, label: `${m.name} (${m.id})` }))}
                  />
                )}
                <Select
                  label="Store"
                  value={filterStore}
                  onChange={(e) => setFilterStore(e.target.value)}
                  options={(role === "RM" ? storesInRegion : stores)
                    .filter((s) => !filterAM || s.managerId === filterAM)
                    .map((s) => ({ value: s.id, label: `${s.id} — ${s.name}` }))}
                />
                <Select label="Status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} options={STATUSES} />
                <Select label="Severity" value={filterSeverity} onChange={(e) => setFilterSeverity(e.target.value)} options={SEVERITIES} />
                <TextInput label="Search" placeholder="owner, root cause, action…" value={query} onChange={(e) => setQuery(e.target.value)} />
                <div className="flex items-end gap-2">
                  <button
                    onClick={() => { setFilterAM(""); setFilterStore(""); setFilterStatus(""); setFilterSeverity(""); setQuery(""); }}
                    className="h-[46px] w-full rounded-xl border border-slate-300 dark:border-slate-700"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-6">
                <Stat label="Total" value={stats.total} />
                {STATUSES.map((s) => (<Stat key={s} label={s} value={stats.byStatus[s] || 0} />))}
                <Stat label="Overdue" value={stats.overdue} />
              </div>

              {/* List */}
              <div className="mt-6 grid gap-3">
                {filtered.length === 0 ? (
                  <div className="rounded-2xl glass p-8 text-center text-slate-600">
                    No CAPA yet. Add one — your future self will thank you.
                  </div>
                ) : (
                  filtered.map((it) => {
                    const m = managers.find((mm) => mm.id === it.managerId);
                    const s = stores.find((ss) => ss.id === it.storeId);
                    const managerLabel = m ? `${m.name} (${it.managerId})` : it.managerId;
                    const storeLabel = `${it.storeId} — ${s?.name || "Store"}`;
                    return (
                      <CAPARow
                        key={it.id}
                        item={it}
                        managerName={managerLabel}
                        storeName={storeLabel}
                        canEdit={canEdit}
                        onEdit={(item) => { if (!canEdit) return; setEditItem(item); setShowForm(true); }}
                        onQuick={onQuick}
                        onClose={onClose}
                      />
                    );
                  })
                )}
              </div>

              {/* Footer Tips */}
              <div className="mt-8 rounded-2xl glass p-4 text-sm text-black">
                <div className="font-medium">CAPA Workflow:</div>
                <ul className="ml-4 list-disc space-y-1">
                  <li>Observe the issue (fact-based).</li>
                  <li>Find root cause (5 Whys; verify).</li>
                  <li>Corrective action = stop the bleeding now.</li>
                  <li>Preventive action = make recurrence hard.</li>
                  <li>Assign owner + due date. Follow up. Verify. Close.</li>
                </ul>
              </div>

              {showForm && (
                <CAPAForm
                  managers={role === "AM" ? managers.filter((m) => m.id === activeAM) : role === "RM" ? amInRegion : managers}
                  stores={role === "AM" ? stores.filter((s) => s.managerId === activeAM) : role === "RM" ? storesInRegion : stores}
                  initial={editItem}
                  onCancel={() => { setShowForm(false); setEditItem(null); }}
                  onSave={onSave}
                />
              )}
            </section>
          )}
        </main>
      </div>
      </div>

      {/* Bottom Tab Bar (mobile) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-3xl px-3 py-2 grid grid-cols-4 gap-2">
          {tabs.map((t) => (
            <button
              key={`btm-${t}`}
              onClick={() => setTab(t)}
              className={`flex flex-col items-center justify-center rounded-xl px-2 py-1.5 text-xs transition ${
                tab === t ? 'bg-black text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
              title={t}
            >
              <span className="text-base leading-none">
                {t === 'Checklist' ? '📝' : t === 'SWOT' ? '📊' : t === 'RCA' ? '🧭' : '✅'}
              </span>
              <span className="mt-0.5">{t}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
