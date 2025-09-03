
import React, { useState, useEffect } from "react";
import { load, save } from "./utils/storage.js";
import { downloadOpsChecklistPDF } from "./utils/pdf.js";

// Local definition of SEED_STORES (copied from App.jsx)
const SEED_STORES = [
  { id: "S001", name: "Koramangala 1", managerId: "h1355", regionId: "south" },
  { id: "S002", name: "CMH Indiranagar", managerId: "h546", regionId: "south" },
  { id: "S024", name: "Deer Park", managerId: "h955", regionId: "north" },
  { id: "S043", name: "Kemps Corner", managerId: "h3386", regionId: "west" },
  { id: "S048", name: "Kalyani Nagar", managerId: "h2758", regionId: "west" },
];

export const CHECKLIST = [
  {
    category: "Cheerful Greeting",
    objective: "Create a welcoming and well-prepared first impression",
    checkpoints: [
      "Store front area is clean and maintained",
      "Signage is clean and lights are functioning",
      "Glass and doors are smudge-free",
      "Promotional displays reflect current offers",
      "POS tent cards are as per latest Communication",
      "Menu boards/DMB are as per latest communication",
      "Café has a welcoming environment (check ambiance – music, lighting, AC, aroma)",
      "Washrooms cleaned; checklist updated",
      "FDU counter neat and fully stocked and set as per planogram",
      "Merch rack follows VM guidelines and attracts attention",
      "Check Staff grooming (Uniform, Jewellery, Hair and Makeup)",
      "All seating/furniture/stations are tidy and organized",
      "engine area is clean and ready for operations"
    ]
  },
  {
    category: "Order Taking Assistance",
    objective: "Ensure smooth and efficient order processing",
    checkpoints: [
      "Suggestive selling at POS",
      "POS partner updated on latest promos and item availability",
      "Record order taking time for 5 customers",
      "Sufficient cash and change at POS",
      "Valid licenses displayed; expiry checked, Medical reports of",
      "Cash audits completed; verified with logbook",
      "Daily banking reports tallied",
      "Review CPI through fame pilot",
      "Swiggy/Zomato metrics reviewed (RDC, MFR, visibility) Food lock on LS and Stock control on urban piper is managed as per stock availability or opening inventory",
      "All food/drinks served as per SOP",
      "Food orders placed based on 4-week sales trend"
    ]
  },
  {
    category: "Friendly & Accurate Service",
    objective: "Deliver consistency, cleanliness, and speed with a smile",
    checkpoints: [
      "Equipment cleaned and maintained",
      "Temperature checks with Therma Pen; logs updated",
      "Documentation: GRN, RSTN, STN & TO completed",
      "Fast-moving SKUs availability checked and validated with LS",
      "Thawing chart vs actual thawing validated",
      "Clear deployment roles; coaching & appreciation done by the MOD",
      "No broken/unused tools stored in the store",
      "Proper garbage segregation (wet/dry)",
      "LTO products are served as per standards",
      "Coffee & food dial-in process followed",
      "R.O.A.S.T. and App orders executed accurately",
      "Validate 5 order service times",
      "Review Open Maintenance related points"
    ]
  },
  {
    category: "Feedback with Solution",
    objective: "Drive continuous improvement through review and correction",
    checkpoints: [
      "COGS reviewed; actions in place as per the feedback shared of the last month P&L",
      "BSC targets vs achievements reviewed",
      "People budget vs actuals (labour cost/bench planning)",
      "Variance in stock (physical vs system) verified",
      "Top 10 wastage items reviewed",
      "Store utility (units, chemical use) reviewed",
      "Shift targets, briefing and goal tracking",
      "New staff training & bench plan reviewed",
      "Review Training and QA audits",
      "Duty roster checked – off/coff, ELCL, tenure and ensure attendance is marked as per roster uploaded in the ZingHR",
      "Validate Temperature and thawing logs",
      "Cross-check audit & Data findings with store observation",
      "Pest control layout updated"
    ]
  },
  {
    category: "Enjoyable Experience",
    objective: "Enhance customer experience from entry to service",
    checkpoints: [
      "Engage 2 new + 2 repeat customers and document feedback",
      "Seating/stations are adjusted and readjusted as per customer requirement",
      "Team proactively assists customers",
      "Check CCTV to monitor customer service during peak hours",
      "CCTV backup (min 60-day), black spots checked",
      "Check Opening/closing footage for opening and closing practices",
      "No personal items/clutter in guest areas/ Personal belongings are kept in the partner lockers or at the designated place in the store"
    ]
  },
  {
    category: "Enthusiastic Exit",
    objective: "Ensure a positive and memorable closing",
    checkpoints: [
      "No unresolved issues at exits",
      "Final interaction is cheerful and courteous",
      "Create Consolidated Action Plan for the store along with SM",
      "Recognize top performers",
      "Celebrate wins and communicate improvement areas",
      "Motivate team for ongoing improvement"
    ]
  }
];

export function ChecklistUI() {
  // Store selection state
  const [storeId, setStoreId] = useState("");
  const [storeName, setStoreName] = useState("");
  // Load all stores from master data (fallback to seeds)
  const [stores] = useState(() => load("capa.stores", SEED_STORES));

  // Checklist state: answer can be "yes", "no", or "na"
  const [state, setState] = useState(() => {
    return load("checklist-state", CHECKLIST.map(cat => ({
      category: cat.category,
      checkpoints: cat.checkpoints.map(() => ({ answer: "", /* yes|no|na */ })),
      sectionObservation: ""
    })));
  });

  useEffect(() => { save("checklist-state", state); }, [state]);

  // Store select handlers
  const handleStoreChange = (e) => {
    const val = e.target.value;
    setStoreId(val);
    const store = stores.find(s => s.id === val);
    setStoreName(store ? store.name : "");
  };

  // Checklist answer handler
  const handleAnswer = (catIdx, chkIdx, answer) => {
    setState(s => s.map((cat, i) => i !== catIdx ? cat : {
      ...cat,
      checkpoints: cat.checkpoints.map((c, j) => j !== chkIdx ? c : { ...c, answer })
    }));
  };

  return (
    <div className="space-y-8">
      {/* Store selection */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-end rounded-2xl glass p-3">
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-1">Store Name</label>
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900"
            value={storeId}
            onChange={handleStoreChange}
          >
            <option value="">Select store…</option>
            {stores.map(store => (
              <option key={store.id} value={store.id}>{store.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-900 mb-1">Store ID</label>
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 bg-slate-100 text-slate-900"
            value={storeId}
            readOnly
          />
        </div>
      </div>

      {CHECKLIST.map((cat, catIdx) => (
        <div key={cat.category} className="p-0">
          <div className="mb-2">
            <span className="font-semibold text-lg text-slate-900">{cat.category}</span>
            <span className="ml-2 text-slate-400 text-sm">{cat.objective}</span>
          </div>
          <div className="divide-y divide-slate-200">
            {cat.checkpoints.map((chk, chkIdx) => {
              const answer = state[catIdx]?.checkpoints[chkIdx]?.answer || "";
              return (
                <div key={chk} className="py-3">
                  <div className="flex items-center">
                    <div className="flex-1 text-slate-900 text-base">{chk}</div>
                    <div className="flex gap-3 ml-4">
                      <label className="inline-flex items-center gap-1">
                        <input
                          type="radio"
                          name={`q-${catIdx}-${chkIdx}`}
                          value="yes"
                          checked={answer === "yes"}
                          onChange={() => handleAnswer(catIdx, chkIdx, "yes")}
                          className="accent-green-500"
                        />
                        <span className="text-green-600 text-sm">Yes</span>
                      </label>
                      <label className="inline-flex items-center gap-1">
                        <input
                          type="radio"
                          name={`q-${catIdx}-${chkIdx}`}
                          value="no"
                          checked={answer === "no"}
                          onChange={() => handleAnswer(catIdx, chkIdx, "no")}
                          className="accent-red-500"
                        />
                        <span className="text-red-600 text-sm">No</span>
                      </label>
                      <label className="inline-flex items-center gap-1">
                        <input
                          type="radio"
                          name={`q-${catIdx}-${chkIdx}`}
                          value="na"
                          checked={answer === "na"}
                          onChange={() => handleAnswer(catIdx, chkIdx, "na")}
                          className="accent-slate-400"
                        />
                        <span className="text-slate-500 text-sm">N/A</span>
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Section-level observation */}
      <div className="mt-4">
            <input
              type="text"
        className="w-full border-b border-slate-300 bg-transparent px-0 py-2 text-sm focus:outline-none focus:border-blue-400 transition"
              placeholder="Add comments for this section (optional)"
              value={state[catIdx]?.sectionObservation || ""}
              onChange={e => {
                const val = e.target.value;
                setState(s => s.map((cat, i) => i !== catIdx ? cat : {
                  ...cat,
                  sectionObservation: val
                }));
              }}
            />
          </div>
        </div>
      ))}

    {/* Submit button */}
  <div className="mt-8 flex justify-end">
      <button
    className="rounded-xl bg-black text-white px-6 py-3 text-base font-semibold shadow hover:bg-slate-800 transition"
        onClick={() => {
          // Save submitted checklist to localStorage for analysis
          const auditMeta = (()=>{ try { return JSON.parse(localStorage.getItem('audit.meta')) || {}; } catch { return {}; } })();
          // attach checkpoint text for PDF rendering
          const stateWithText = state.map((cat, i) => ({
            ...cat,
            checkpointsText: (cat.checkpoints || []).map((_, j) => (CHECKLIST?.[i]?.checkpoints?.[j] || `Item ${j+1}`))
          }));
          const submitted = { storeId, storeName, state: stateWithText, auditMeta, submittedAt: new Date().toISOString() };
          localStorage.setItem("checklist-submitted", JSON.stringify(submitted));
          // Save to all-checklist-submitted (array)
          let all = [];
          try {
            all = JSON.parse(localStorage.getItem("all-checklist-submitted")) || [];
          } catch {}
          // Replace if already exists for this storeId
          const idx = all.findIndex(c => c.storeId === storeId);
          if (idx >= 0) all[idx] = submitted;
          else all.push(submitted);
          localStorage.setItem("all-checklist-submitted", JSON.stringify(all));
          localStorage.setItem("checklist-analysis-ready", "1");
          window.dispatchEvent(new Event("checklist-submitted")); // Notify App to re-fetch
          // Download a local PDF copy
          downloadOpsChecklistPDF(submitted);
          alert("Checklist submitted and PDF downloaded.");
        }}
        disabled={!storeId}
      >
        Submit Checklist
      </button>
    </div>
  </div>
  );
}
