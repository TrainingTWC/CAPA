<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Training Audit | Third wave coffee</title>
  <meta name="description" content="Audit checklist for training at Third Wave Coffee." />
  <meta name="theme-color" content="#f8fafc" />
  <link rel="icon" href="/favicon.ico" />
  <meta property="og:title" content="Training Audit | Third wave coffee" />
  <meta property="og:description" content="Audit checklist for training at Third Wave Coffee." />
  <meta property="og:type" content="website" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/exif-js/2.3.0/exif.min.js"></script>
  <style>
    .fade-in { opacity: 0; animation: fadeIn 0.6s forwards; }
    @keyframes fadeIn { to { opacity: 1; } }
    .report-box {
      border-radius: 18px;
      background: #f8fafc;
      border: 2px solid #e0e7ef;
      box-shadow: 0 2px 8px #e0e7ef77;
    }
    .section-title {
      font-size: 1.1rem;
      font-weight: bold;
      text-align: center;
      margin: 0;
      padding: 8px 0 8px 0;
      color: #293241;
    }
    .autotable-header {
      color: #23272f !important;
      background: #e3e8f2 !important;
      font-weight: bold !important;
      font-size: 11px !important;
      text-align: center !important;
    }
  </style>
</head>
<body class="bg-gray-100">
  <div id="root"></div>
  <script type="text/babel">
    const { useState, useEffect } = React;
    const params = new URLSearchParams(window.location.search);
    const auditorName = params.get('auditorName')||params.get('name')||'';
    const auditorId   = params.get('auditorId')||params.get('id')||'';
    const LOG_ENDPOINT = 'https://script.google.com/macros/s/AKfycbz9tedGmiD8XoRdMxbpI_UB-8aRQ5jdM_92bzedq27MQFPUmQmRlryC-ewNflCedVMD2w/exec';
    const safeVibrate = pattern => { if(navigator?.vibrate) navigator.vibrate(pattern); };
    const safeLS = { get:k=>{try{return localStorage.getItem(k)}catch{return null}}, set:(k,v)=>{try{localStorage.setItem(k,v)}catch{}}, clear:()=>{try{localStorage.clear()}catch{}} };

    // Checklist Data
    // Note: Flat scoring model – each item has weight 1. Yes=1, No=0, N/A excluded from max.
    const SECTIONS = [
      { id:'TrainingMaterials', title:'Training Materials', items:[
        {id:'TM_1',q:'FRM available at store?'},
        {id:'TM_2',q:'BRM available at store?'},
        {id:'TM_3',q:'One-pager – Hot/Cue Cards displayed?'},
        {id:'TM_4',q:'One-pager – Cold/Cue Cards displayed?'},
        {id:'TM_5',q:'Dial-in One-pager visible?'},
        {id:'TM_6',q:'New-launch learning material available?'},
        {id:'TM_7',q:'COFFEE & HD Playbook in store?'},
        {id:'TM_8',q:'MSDS, chemical chart and Shelf life chart available?'},
        {id:'TM_9',q:'Career Progression Chart & Reward Poster displayed?'}
      ]},
      { id:'LMS', title:'LMS Usage', items:[
        {id:'LMS_1',q:'Orientation & Induction completed within 3 days of joining?'},
        {id:'LMS_2',q:'All assessments & knowledge checks completed on LMS?'},
        {id:'LMS_3',q:'Team uses LMS for new info & comms?'}
      ]},
      { id:'Buddy', title:'Buddy Trainer Availability & Capability', items:[
        {id:'Buddy_1',q:'Does the café have at least 20% of the staff certified Buddy Trainers?'},
        {id:'Buddy_2',q:'Have Buddy Trainers completed their Skill Check?'},
        {id:'Buddy_3',q:'Are trainees rostered with Buddy Trainers and working in the same shift?'},
        {id:'Buddy_4',q:'Have Buddy Trainers attended the BT workshop?'},
        {id:'Buddy_5',q:'Can Buddy Trainers explain the 4-step training process effectively?'},
        {id:'Buddy_6',q:'Can Buddy Trainers navigate Zing LMS flawlessly?'}
      ]},
      { id:'NewJoiner', title:'New Joiner Training & Records', items:[
        {id:'NJ_1',q:'Is the OJT book available for all partners?'},
        {id:'NJ_2',q:'Are trainees referring to the OJT book and completing their skill checks?'},
        {id:'NJ_3',q:'Is training progression aligned with the Training Calendar/Plan?'},
        {id:'NJ_4',q:'Are team members aware of post-barista training progressions?'},
        {id:'NJ_5',q:'Have managers completed SHLP training as per the calendar?'},
        {id:'NJ_6',q:'Are there at least 2 FOSTAC-certified managers in the store?'},
        {id:'NJ_7',q:'Is ASM/SM training completed as per the Training Calendar?'}
      ]},
      { id:'PartnerKnowledge', title:'Partner Knowledge', items:[
        {id:'PK_1',q:'Are team members aware of current company communications?'},
        {id:'PK_2',q:'Ask a team member to conduct a Coffee Tasting & Sampling'},
        {id:'PK_3',q:'Is Sampling being conducted as per the set guidelines?'},
        {id:'PK_4',q:'Is Coffee Tasting engaging and effective?'},
        {id:'PK_5',q:'Are team members aware of manual brewing methods and standards?'},
        {id:'PK_6',q:'Are partners following grooming standards?'},
        {id:'PK_7',q:'Ask questions about key topics: COFFEE, LEAST, ROAST, Dial-in, Milk Steaming, LTO, Values(RESPECT), MSDS, Chemcial Dilution, Food Safety, and Security.'}
      ]},
      { id:'TSA', title:'TSA - Training Skill Assessment', items:[
        {id:'TSA_1',q:'Partner 1 – Hot & Cold stations work?'},
        {id:'TSA_2',q:'Partner 2 – Food station cleanliness?'},
        {id:'TSA_3',q:'Partner 3 – Customer Service quality?'}
      ]},
      { id:'CustomerExperience', title:'Customer Experience', items:[
        {id:'CX_1',q:'Is background music at appropriate volume?'},
        {id:'CX_2',q:'Is store temperature comfortable?'},
        {id:'CX_3',q:'Are washrooms clean and well-maintained?'},
        {id:'CX_4',q:'Is Wi-Fi available & functioning properly?'},
        {id:'CX_5',q:'Are marketing & Visual Merchandise displayes correct?'},
        {id:'CX_6',q:'Is store furniture clean & well-kept?'},
        {id:'CX_7',q:'What do you understand by MA, CPI, QA scores?'},
        {id:'CX_8',q:'What was the latest Mystery Audit score for the store?'},
        {id:'CX_9',q:'Top 2 CX opportunity areas last month?'}
      ]},
      { id:'ActionPlan', title:'Action Plan & Continuous Improvement', items:[
        {id:'AP_1',q:'Concerns addressed within 48hrs?'},
        {id:'AP_2',q:'Action points closed/work-in-progress?'},
        {id:'AP_3',q:'Managers aware of action plan?'}
      ]}
    ];
    const optionColors = { yes:'green', no:'red', na:'yellow' };
    const options = Object.entries(optionColors);

    const colorMap = {
      yes: {
        selected: "bg-green-200 ring-2 ring-green-500 hover:bg-green-300",
        base: "bg-green-100 hover:bg-green-300"
      },
      no: {
        selected: "bg-red-200 ring-2 ring-red-500 hover:bg-red-300",
        base: "bg-red-100 hover:bg-red-300"
      },
      na: {
        selected: "bg-yellow-200 ring-2 ring-yellow-500 hover:bg-yellow-300",
        base: "bg-yellow-100 hover:bg-yellow-300"
      }
    };

    function App(){
      const [resp,setResp]=useState(()=>JSON.parse(safeLS.get('resp')||'{}'));
      const [storeName,setStoreName]=useState(safeLS.get('storeName')||'');
      const [storeId,setStoreId]=useState(safeLS.get('storeId')||'');
      const [imgs,setImgs]=useState(()=>JSON.parse(safeLS.get('imgs')||'{}'));
      const [remarks, setRemarks] = useState(() => JSON.parse(safeLS.get('remarks') || '{}')); // REMARKS
      const [mod, setMod] = useState(safeLS.get('mod') || '');
      const [downloading,setDownloading]=useState(false);
      const [downloaded, setDownloaded] = useState(false);
      const [showPopup, setShowPopup] = useState(false);

      useEffect(()=>{
        safeLS.set('resp',JSON.stringify(resp));
        safeLS.set('storeName',storeName);
        safeLS.set('storeId',storeId);
        safeLS.set('mod', mod);
        safeLS.set('imgs',JSON.stringify(imgs));
        safeLS.set('remarks', JSON.stringify(remarks)); // REMARKS
      },[resp,storeName,storeId,mod,imgs,remarks]); // REMARKS

      const handleOption=(sec,it,val)=>{
        const key=`${sec.id}_${it.id}`;
        setResp(p=>({...p,[key]:val}));
        if(navigator?.vibrate){
          if(val==='yes')safeVibrate(50);
          else if(val==='no')safeVibrate([50,50]);
        }
      };
  // TSA uses the same Yes/No/NA model now; no special numeric scoring
      const addImages=(sec,e)=>{
        Array.from(e.target.files).forEach(f=>{
          EXIF.getData(f,function(){
            const r=new FileReader();
            r.onload=ev=>setImgs(p=>({...p,[sec.id]:[...(p[sec.id]||[]),ev.target.result]}));
            r.readAsDataURL(f);
          });
        });
        e.target.value=null;
      };
      // Check completion
      const allDone = storeName.trim() && storeId.trim() &&
        SECTIONS.every(sec=>sec.items.every(it=>resp[`${sec.id}_${it.id}`]!=null));

      // SUBMIT & PDF
      const handleSubmit=async e=>{
        e.preventDefault();
        if(!allDone){safeVibrate([200,200]);return;}
        setDownloading(true);
        // Score calculation (flat): Yes=1, No=0, NA excluded
        let total=0, max=0, sectionScores={}, sectionMax={};
        SECTIONS.forEach(sec=>{
          let secTotal=0, secMax=0;
          sec.items.forEach(it=>{
            const key=`${sec.id}_${it.id}`;
            const r=resp[key];
            if(r==='yes') { secTotal+=1; secMax+=1; }
            else if(r==='no') { secTotal+=0; secMax+=1; }
            else if(r==='na') { /* not applicable, do not add to max */ }
          });
          sectionScores[sec.id]=secTotal;
          sectionMax[sec.id]=secMax;
          total+=secTotal; max+=secMax;
        });
        const pct = max?Math.round((total/max)*100):0;
        const completion=new Date().toLocaleString('en-GB',{hour12:false});
        // Logging
        const data = new URLSearchParams({
          date: completion,
          auditorName, auditorId, storeName, storeId,
          score: total, percentage: pct
        });
        try {
          await fetch(LOG_ENDPOINT, { method: "POST", body: data });
        } catch {}
        safeVibrate(100);
        // PDF Generation
        const {jsPDF}=window.jspdf;
        const doc=new jsPDF({orientation:'portrait',unit:'mm'});
        const sectionBg = [
          '#E3F6FC','#FEF6E4','#E4F7EE','#FFF1F6','#F1F2FB',
          '#FFF5DA','#F8F9F9','#F5F6F6'
        ];

        // HEADER
        doc.setFillColor('#FFFFFF');
        doc.rect(10,10,190,20,'F');
        doc.setFontSize(20);
        doc.setFont('helvetica','bold');
        doc.setTextColor('#263140');
        doc.text(`Training Audit | ${storeName}`, 105, 19, {align:'center'});
        doc.setFontSize(10);
        doc.setFont('helvetica','normal');
        doc.setTextColor('#24272e');

        // PDF HEADER
const headerFields = [
  { label: 'Date/Time', value: completion },
  { label: 'Auditor', value: auditorName },
  { label: 'Auditor ID', value: auditorId },
  { label: 'Store ID', value: storeId },
  { label: 'MOD', value: mod }
].filter(f => f.value && String(f.value).trim() !== '');
let headerText = headerFields.map(f => `${f.label}: ${f.value}`).join('  |  ');
doc.setFontSize(10);
doc.setFont('helvetica','normal');
doc.setTextColor('#24272e');
doc.text(headerText, 105, 28, {align:'center'});
// Score and Percentage - bold and big
const scoreText = `Score: ${total} / ${max}`;
const pctText = `${pct}%`;
doc.setFontSize(18);
doc.setFont('helvetica','bold');
doc.setTextColor('#086972');
doc.text(scoreText, 18, 38, {align:'left'});
doc.text(pctText, 190, 38, {align:'right'});

        let y = 40;
        for(let s=0;s<SECTIONS.length;s++){
          const sec=SECTIONS[s];
          const bg = sectionBg[s%sectionBg.length];
          // Pre-box: measure table height
          const rows = sec.items.map(it=>{
            const key = `${sec.id}_${it.id}`;
            const r = resp[key];
            const respText = r==='yes'?'Yes':r==='no'?'No':r==='na'?'NA':r;
            const score = r==='yes' ? 1 : r==='no' ? 0 : '';
            return [it.q, respText, score];
          });

          // Section title in box
          doc.setFont('helvetica','bold');
          doc.setFontSize(13);
          doc.setFillColor(bg);
          doc.roundedRect(13, y, 184, 12, 9, 9, 'F');
          doc.setFontSize(12);
          doc.setTextColor('#23272f');
          doc.text(`${sec.title}  (Score: ${sectionScores[sec.id]} / ${sectionMax[sec.id]})`, 105, y+8, {align:'center'});

          // Table below title, inside box
          doc.autoTable({
            startY: y+12,
            head:[['Question','Response','Score']],
            body: rows.map(row=>row.slice(0,3)),
            margin:{left:18,right:18},
            styles:{fontSize:9,cellPadding:2,textColor:'#23272f'},
            headStyles:{fillColor:'#dbeafe',textColor:'#23272f',fontStyle:'bold'},
            tableLineColor:'#c3dafe',tableLineWidth:0.7,
            theme:'grid',
            showHead:'everyPage'
          });

          let nextY = doc.lastAutoTable.finalY + 4;

          // REMARKS: Insert remarks below table, above images
          if (remarks[sec.id] && remarks[sec.id].trim()) {
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(10);
            doc.setTextColor('#444');
            let splitRemarks = doc.splitTextToSize('Remarks: ' + remarks[sec.id], 170);
            doc.text(splitRemarks, 18, nextY);
            nextY += splitRemarks.length * 6 + 2;
          }

          // IMAGES (below remarks, still in section box)
          let imgH = 0;
          if(imgs[sec.id] && imgs[sec.id].length){
  let imgPerRow = 6;
  let imgW = 24, imgH = 24, gap = 6;
  let baseX = 18, baseY = nextY;
  imgs[sec.id].forEach((src, i)=>{
    let row = Math.floor(i / imgPerRow);
    let col = i % imgPerRow;
    let x = baseX + col * (imgW + gap);
    let y = baseY + row * (imgH + gap);
    if(y > 265){ doc.addPage(); baseY = 20; y = baseY; }
    doc.addImage(src,'JPEG', x, y, imgW, imgH);
    imgH = Math.max(imgH, 24);
  });
  let rows = Math.ceil(imgs[sec.id].length / imgPerRow);
  nextY = baseY + rows * (imgH + gap) + 2;
}
          // Now draw the box *after* knowing full height
          const boxH = nextY-y+3;
          doc.setDrawColor('#b5bfc7');
          doc.setLineWidth(1.1);
          doc.roundedRect(13, y, 184, boxH, 9, 9);
          y = nextY+8;
          if(y>200 && s!==SECTIONS.length-1){ doc.addPage(); y=20;}
        }
        doc.save(`audit_${storeName}_${Date.now()}.pdf`);
        setDownloading(false);
        setDownloaded(true);
        setShowPopup(true);
        setTimeout(()=>{
          setDownloaded(false);
          setShowPopup(false);
        }, 3000);
      };

      const resetAll=()=>{
        safeLS.clear();
        setResp({});
        setStoreName('');
        setStoreId('');
        setImgs({});
        setRemarks({}); // REMARKS
        setMod('');
        safeVibrate([200,200]);
      };

      // UI
      return(
        <>
          {showPopup && (
            <div style={{position:'fixed',top:'30%',left:'50%',transform:'translate(-50%,-50%)',zIndex:9999}} className="px-6 py-4 bg-green-600 text-white rounded-lg shadow-lg text-center fade-in">
              Report downloaded!
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6 p-3 pt-4 max-w-2xl mx-auto">
            <h1 className="text-xl sm:text-2xl font-bold text-center mb-2">Training Audit | Third wave coffee</h1>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-2">
              <div>
                <label className="block text-xs font-semibold">Auditor Name</label>
                <input id="auditorName" readOnly value={auditorName} className="w-full p-2 border rounded bg-gray-100"/>
              </div>
              <div>
                <label className="block text-xs font-semibold">Auditor ID</label>
                <input id="auditorId" readOnly value={auditorId} className="w-full p-2 border rounded bg-gray-100"/>
              </div>
              <div>
                <label className="block text-xs font-semibold">Store Name</label>
                <input id="storeName" value={storeName} onChange={e=>setStoreName(e.target.value)} required className="w-full p-2 border rounded"/>
              </div>
              <div>
                <label className="block text-xs font-semibold">Store ID</label>
                <input id="storeId" value={storeId} onChange={e=>setStoreId(e.target.value)} required className="w-full p-2 border rounded"/>
              </div>
              <div>
                <label className="block text-xs font-semibold">MOD</label>
                <input id="mod" value={mod} onChange={e=>setMod(e.target.value)} className="w-full p-2 border rounded"/>
              </div>
            </div>
            {SECTIONS.map(sec=>(
              <div key={sec.id} id={`${sec.id}-section`} className="mb-4 report-box p-2 fade-in">
                <h2 className="section-title">{sec.title}</h2>
                <table className="w-full border-collapse mt-1 mb-2">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border px-2 py-1 text-left text-xs font-bold">Question</th>
                      {options.map(([opt])=>
                        <th key={opt} className="border px-2 py-1 text-center text-xs uppercase">{opt}</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {sec.items.map(it=>{
                      const key=`${sec.id}_${it.id}`;
                      return (
                        <tr id={key} key={it.id} className="even:bg-gray-50 hover:bg-gray-50">
                          <td className="border px-2 py-1">{it.q}</td>
                          {options.map(([opt])=>{
                            const sel=resp[key]===opt;
                            return (
                              <td key={opt} className="border px-2 py-1 text-center">
                                <button
                                  type="button"
                                  onClick={()=>handleOption(sec,it,opt)}
                                  className={
                                    sel
                                      ? `${colorMap[opt].selected} px-2 py-0.5 text-xs rounded-full transition`
                                      : `${colorMap[opt].base} px-2 py-0.5 text-xs rounded-full transition`
                                  }
                                >{opt.toUpperCase()}</button>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {/* REMARKS: Add remarks textarea for each section */}
                <div className="mt-2 fade-in">
                  <label className="block text-xs font-semibold">Section Remarks</label>
                  <textarea
                    value={remarks[sec.id] || ''}
                    onChange={e => setRemarks(r => ({ ...r, [sec.id]: e.target.value }))}
                    className="w-full p-2 border rounded mt-1"
                    placeholder="Enter remarks for this section (optional)"
                    rows={2}
                  />
                </div>
                {/* Images */}
                <div className="mt-2 fade-in">
                  <label className="block text-xs font-semibold">Upload Images</label>
                  <input type="file" accept="image/*" capture="environment" multiple onChange={e=>addImages(sec,e)} className="mt-1"/>
                  <div className="flex space-x-2 mt-2 overflow-x-auto">
                    {(imgs[sec.id]||[]).map((s,i)=><img key={i} src={s} className="w-16 h-16 object-cover rounded-md border"/>) }
                  </div>
                </div>
              </div>
            ))}
            <div className="flex space-x-4 fade-in">
              <button type="button" onClick={resetAll} className="flex-1 bg-blue-100 py-3 rounded-full hover:bg-blue-200 transition">New Response</button>
              <button type="submit" className={`flex-1 bg-green-100 py-3 rounded-full hover:bg-green-200 transition ${downloading?'opacity-70 pointer-events-none':''}`}>
                {downloading? 'Generating Report...':'Submit & Download PDF'}
              </button>
            </div>
          </form>
        </>
      );
    }
    ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
  </script>
</body>
</html>