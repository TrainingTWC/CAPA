import React, { useEffect, useMemo, useState } from "react";
import { load, save } from "./utils/storage.js";
import { downloadTrainingAuditPDF } from "./utils/pdf.js";

// Sections derived from Trainingaudit.html
export const TRAINING_SECTIONS = [
  { id: 'TrainingMaterials', title: 'Training Materials', items: [
    { id: 'TM_1', q: 'FRM available at store?' },
    { id: 'TM_2', q: 'BRM available at store?' },
    { id: 'TM_3', q: 'One-pager – Hot/Cue Cards displayed?' },
    { id: 'TM_4', q: 'One-pager – Cold/Cue Cards displayed?' },
    { id: 'TM_5', q: 'Dial-in One-pager visible?' },
    { id: 'TM_6', q: 'New-launch learning material available?' },
    { id: 'TM_7', q: 'COFFEE & HD Playbook in store?' },
    { id: 'TM_8', q: 'MSDS, chemical chart and Shelf life chart available?' },
    { id: 'TM_9', q: 'Career Progression Chart & Reward Poster displayed?' },
  ]},
  { id: 'LMS', title: 'LMS Usage', items: [
    { id: 'LMS_1', q: 'Orientation & Induction completed within 3 days of joining?' },
    { id: 'LMS_2', q: 'All assessments & knowledge checks completed on LMS?' },
    { id: 'LMS_3', q: 'Team uses LMS for new info & comms?' },
  ]},
  { id: 'Buddy', title: 'Buddy Trainer Availability & Capability', items: [
    { id: 'Buddy_1', q: 'Does the café have at least 20% of the staff certified Buddy Trainers?' },
    { id: 'Buddy_2', q: 'Have Buddy Trainers completed their Skill Check?' },
    { id: 'Buddy_3', q: 'Are trainees rostered with Buddy Trainers and working in the same shift?' },
    { id: 'Buddy_4', q: 'Have Buddy Trainers attended the BT workshop?' },
    { id: 'Buddy_5', q: 'Can Buddy Trainers explain the 4-step training process effectively?' },
    { id: 'Buddy_6', q: 'Can Buddy Trainers navigate Zing LMS flawlessly?' },
  ]},
  { id: 'NewJoiner', title: 'New Joiner Training & Records', items: [
    { id: 'NJ_1', q: 'Is the OJT book available for all partners?' },
    { id: 'NJ_2', q: 'Are trainees referring to the OJT book and completing their skill checks?' },
    { id: 'NJ_3', q: 'Is training progression aligned with the Training Calendar/Plan?' },
    { id: 'NJ_4', q: 'Are team members aware of post-barista training progressions?' },
    { id: 'NJ_5', q: 'Have managers completed SHLP training as per the calendar?' },
    { id: 'NJ_6', q: 'Are there at least 2 FOSTAC-certified managers in the store?' },
    { id: 'NJ_7', q: 'Is ASM/SM training completed as per the Training Calendar?' },
  ]},
  { id: 'PartnerKnowledge', title: 'Partner Knowledge', items: [
    { id: 'PK_1', q: 'Are team members aware of current company communications?' },
    { id: 'PK_2', q: 'Ask a team member to conduct a Coffee Tasting & Sampling' },
    { id: 'PK_3', q: 'Is Sampling being conducted as per the set guidelines?' },
    { id: 'PK_4', q: 'Is Coffee Tasting engaging and effective?' },
    { id: 'PK_5', q: 'Are team members aware of manual brewing methods and standards?' },
    { id: 'PK_6', q: 'Are partners following grooming standards?' },
    { id: 'PK_7', q: 'Ask questions about key topics: COFFEE, LEAST, ROAST, Dial-in, Milk Steaming, LTO, Values(RESPECT), MSDS, Chemcial Dilution, Food Safety, and Security.' },
  ]},
  { id: 'TSA', title: 'TSA - Training Skill Assessment', items: [
    { id: 'TSA_1', q: 'Partner 1 – Hot & Cold stations work?', type: 'score' },
    { id: 'TSA_2', q: 'Partner 2 – Food station cleanliness?', type: 'score' },
    { id: 'TSA_3', q: 'Partner 3 – Customer Service quality?', type: 'score' },
  ]},
  { id: 'CustomerExperience', title: 'Customer Experience', items: [
    { id: 'CX_1', q: 'Is background music at appropriate volume?' },
    { id: 'CX_2', q: 'Is store temperature comfortable?' },
    { id: 'CX_3', q: 'Are washrooms clean and well-maintained?' },
    { id: 'CX_4', q: 'Is Wi-Fi available & functioning properly?' },
    { id: 'CX_5', q: 'Are marketing & Visual Merchandise displayes correct?' },
    { id: 'CX_6', q: 'Is store furniture clean & well-kept?' },
    { id: 'CX_7', q: 'What do you understand by MA, CPI, QA scores?' },
    { id: 'CX_8', q: 'What was the latest Mystery Audit score for the store?' },
    { id: 'CX_9', q: 'Top 2 CX opportunity areas last month?' },
  ]},
  { id: 'ActionPlan', title: 'Action Plan & Continuous Improvement', items: [
    { id: 'AP_1', q: 'Concerns addressed within 48hrs?' },
    { id: 'AP_2', q: 'Action points closed/work-in-progress?' },
    { id: 'AP_3', q: 'Managers aware of action plan?' },
  ]},
];

const YES_NO_NA = [
  { value: 'yes', label: 'Yes', color: 'text-green-600', ring: 'accent-green-500' },
  { value: 'no', label: 'No', color: 'text-red-600', ring: 'accent-red-500' },
  { value: 'na', label: 'N/A', color: 'text-slate-500', ring: 'accent-slate-400' },
];

export function TrainingAuditUI() {
  const [storeId, setStoreId] = useState("");
  const [storeName, setStoreName] = useState("");
  const stores = useMemo(() => load("capa.stores", []), []);

  const [state, setState] = useState(() => {
    const saved = load("training.state", null);
    if (saved) return saved;
    return TRAINING_SECTIONS.map(sec => ({
      id: sec.id,
      title: sec.title,
      rows: sec.items.map(() => ({ value: "" })),
      remarks: "",
    }));
  });

  useEffect(() => { save("training.state", state); }, [state]);

  const setAnswer = (secIdx, rowIdx, val) => {
    setState(s => s.map((sec, i) => i !== secIdx ? sec : {
      ...sec,
      rows: sec.rows.map((r, j) => j !== rowIdx ? r : { ...r, value: val })
    }));
  };

  const setRemarks = (secIdx, text) => {
    setState(s => s.map((sec, i) => i !== secIdx ? sec : ({ ...sec, remarks: text })));
  };

  const onSubmit = () => {
    const auditMeta = (()=>{ try { return JSON.parse(localStorage.getItem('audit.meta')) || {}; } catch { return {}; } })();
    // attach items for question text rendering
    const sectionsWithItems = state.map((sec, i) => ({ ...sec, items: (TRAINING_SECTIONS?.[i]?.items || []) }));
    const submitted = { storeId, storeName, sections: sectionsWithItems, auditMeta, submittedAt: new Date().toISOString() };
    try { localStorage.setItem("training-submitted", JSON.stringify(submitted)); } catch {}
    try {
      const all = JSON.parse(localStorage.getItem("all-training-submitted")) || [];
      const idx = all.findIndex(x => x.storeId === storeId);
      if (idx >= 0) all[idx] = submitted; else all.push(submitted);
      localStorage.setItem("all-training-submitted", JSON.stringify(all));
    } catch {}
    try { window.dispatchEvent(new Event("training-submitted")); } catch {}
  downloadTrainingAuditPDF(submitted);
  alert("Training Audit submitted and PDF downloaded.");
  };

  return (
    <div className="space-y-6">
      {/* Store selection */}
      <div className="mb-4 flex flex-col sm:flex-row gap-4 items-start sm:items-end rounded-2xl glass p-3">
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-1">Store Name</label>
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900"
            value={storeId}
            onChange={(e) => { const id = e.target.value; setStoreId(id); const s = stores.find(x => x.id === id); setStoreName(s?.name || ""); }}
          >
            <option value="">Select store…</option>
            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-1">Store ID</label>
          <input className="rounded-lg border border-slate-300 px-3 py-2 bg-slate-100 text-slate-900" value={storeId} readOnly />
        </div>
      </div>

      {TRAINING_SECTIONS.map((sec, si) => (
        <div key={sec.id} className="p-0">
          <div className="mb-2">
            <span className="font-semibold text-lg text-slate-900">{sec.title}</span>
          </div>
          <div className="divide-y divide-slate-200">
            {sec.items.map((it, ri) => {
              const val = state[si]?.rows?.[ri]?.value || "";
              const isScore = it.type === 'score';
              return (
                <div key={it.id} className="py-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex-1 text-slate-900 text-base">{it.q}</div>
                    <div className="flex gap-3 ml-0 sm:ml-4 items-center">
                      {isScore ? (
                        [10,5,0].map(n => (
                          <label key={n} className="inline-flex items-center gap-1">
                            <input
                              type="radio"
                              name={`t-${si}-${ri}`}
                              value={String(n)}
                              checked={val === String(n)}
                              onChange={() => setAnswer(si, ri, String(n))}
                              className="accent-blue-500"
                            />
                            <span className="text-slate-700 text-sm">{n}</span>
                          </label>
                        ))
                      ) : (
                        YES_NO_NA.map(opt => (
                          <label key={opt.value} className="inline-flex items-center gap-1">
                            <input
                              type="radio"
                              name={`t-${si}-${ri}`}
                              value={opt.value}
                              checked={val === opt.value}
                              onChange={() => setAnswer(si, ri, opt.value)}
                              className={opt.ring}
                            />
                            <span className={`${opt.color} text-sm`}>{opt.label}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Section remarks */}
          <div className="mt-3">
            <input
              type="text"
              className="w-full border-b border-slate-300 bg-transparent px-0 py-2 text-sm focus:outline-none focus:border-blue-400 transition"
              placeholder="Add remarks for this section (optional)"
              value={state[si]?.remarks || ""}
              onChange={(e) => setRemarks(si, e.target.value)}
            />
          </div>
        </div>
      ))}

      <div className="mt-6 flex justify-end">
        <button
          className="rounded-xl bg-black text-white px-6 py-3 text-base font-semibold shadow hover:bg-slate-800 transition"
          onClick={onSubmit}
          disabled={!storeId}
        >
          Submit Training Audit
        </button>
      </div>
    </div>
  );
}

export default TrainingAuditUI;
