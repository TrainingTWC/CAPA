import React, { useState, useEffect } from "react";
import { load, save } from "./App";

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
  const [state, setState] = useState(() => {
    // Try to load from localStorage, else default to all unchecked, empty obs
    return load("checklist-state", CHECKLIST.map(cat => ({
      category: cat.category,
      checkpoints: cat.checkpoints.map(text => ({ checked: false, observation: "" }))
    })));
  });

  useEffect(() => { save("checklist-state", state); }, [state]);

  const handleCheck = (catIdx, chkIdx, checked) => {
    setState(s => s.map((cat, i) => i !== catIdx ? cat : {
      ...cat,
      checkpoints: cat.checkpoints.map((c, j) => j !== chkIdx ? c : { ...c, checked })
    }));
  };
  const handleObs = (catIdx, chkIdx, observation) => {
    setState(s => s.map((cat, i) => i !== catIdx ? cat : {
      ...cat,
      checkpoints: cat.checkpoints.map((c, j) => j !== chkIdx ? c : { ...c, observation })
    }));
  };

  return (
    <div className="space-y-8">
      {CHECKLIST.map((cat, catIdx) => (
        <div key={cat.category} className="border rounded-xl p-4 bg-white dark:bg-slate-900">
          <div className="mb-2">
            <span className="font-bold text-lg">{cat.category}</span>
            <span className="ml-2 text-slate-500 text-sm">{cat.objective}</span>
          </div>
          <div className="space-y-2">
            {cat.checkpoints.map((chk, chkIdx) => (
              <div key={chk} className="flex items-start gap-3 border-b border-slate-100 dark:border-slate-800 pb-2">
                <input
                  type="checkbox"
                  className="mt-1 accent-green-600"
                  checked={state[catIdx]?.checkpoints[chkIdx]?.checked || false}
                  onChange={e => handleCheck(catIdx, chkIdx, e.target.checked)}
                />
                <div className="flex-1">
                  <div className="font-medium text-black dark:text-white">{chk}</div>
                  <input
                    type="text"
                    className="mt-1 w-full rounded border border-slate-300 dark:border-slate-700 px-2 py-1 text-sm dark:bg-slate-800 dark:text-white"
                    placeholder="Add observation (optional)"
                    value={state[catIdx]?.checkpoints[chkIdx]?.observation || ""}
                    onChange={e => handleObs(catIdx, chkIdx, e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
