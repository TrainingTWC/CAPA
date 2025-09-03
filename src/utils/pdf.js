import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

// Support both export shapes across pdfmake builds
try {
  const vfs = (pdfFonts && (pdfFonts.vfs || (pdfFonts.pdfMake && pdfFonts.pdfMake.vfs))) || null;
  if (vfs) pdfMake.vfs = vfs;
} catch { /* ignore */ }

function tableBodyFromChecklist(state) {
  const body = [['Section', 'Checkpoint', 'Answer']];
  (state || []).forEach((sec) => {
    const secTitle = sec.category || sec.title || '';
    (sec.checkpoints || []).forEach((cp, idx) => {
      const q = (sec?.checkpointsText ? sec.checkpointsText[idx] : null) || (Array.isArray(sec.checkpoints) ? sec.checkpoints[idx] : '');
      const ans = cp?.answer || cp?.value || '';
      body.push([secTitle, q || '', String(ans).toUpperCase()]);
    });
    if (sec.sectionObservation) {
      body.push([secTitle, 'Section remarks', sec.sectionObservation]);
    }
  });
  return body;
}

function tableBodyFromTraining(sections) {
  const body = [['Section', 'Item', 'Response']];
  (sections || []).forEach((sec) => {
    (sec.rows || []).forEach((row, idx) => {
      const q = (sec?.items?.[idx]?.q) || '';
      body.push([sec.title || sec.id, q, String(row?.value || '').toUpperCase()]);
    });
    if (sec.remarks) body.push([sec.title || sec.id, 'Section remarks', sec.remarks]);
  });
  return body;
}

export function downloadOpsChecklistPDF(submitted) {
  const { storeId, storeName, auditMeta, state, submittedAt } = submitted || {};
  const docDefinition = {
    pageSize: 'A4', pageMargins: [28, 28, 28, 28],
    content: [
      { text: 'AM Ops Checklist', style: 'h1' },
      { text: `${storeName || ''} (${storeId || ''})`, style: 'h2' },
      { text: new Date(submittedAt || Date.now()).toLocaleString(), style: 'small' },
      { text: ' ' },
      auditMeta ? { columns: [
        { width: '*', stack: [
          { text: `People on shift: ${auditMeta.peopleOnShift || '-'}` },
          { text: `Month sales target: ${auditMeta.monthSalesTarget || '-'}` },
        ]},
        { width: '*', stack: [
          { text: `Time of audit: ${auditMeta.auditTime || '-'}` },
          { text: `Last audit score: ${auditMeta.lastAuditScore || '-'}` },
        ]},
      ] } : {},
      { text: ' ' },
      { table: { headerRows: 1, widths: ['*', '*', 70], body: tableBodyFromChecklist(state) }, layout: 'lightHorizontalLines' },
    ],
    styles: {
      h1: { fontSize: 18, bold: true },
      h2: { fontSize: 12, bold: true, margin: [0, 4, 0, 0] },
      small: { fontSize: 9, color: '#555' },
    }
  };
  const date = new Date(submittedAt || Date.now()).toISOString().slice(0,10);
  pdfMake.createPdf(docDefinition).download(`am-ops-checklist_${storeId || 'unknown'}_${date}.pdf`);
}

export function downloadTrainingAuditPDF(submitted) {
  const { storeId, storeName, auditMeta, sections, submittedAt } = submitted || {};
  const docDefinition = {
    pageSize: 'A4', pageMargins: [28, 28, 28, 28],
    content: [
      { text: 'Training Audit', style: 'h1' },
      { text: `${storeName || ''} (${storeId || ''})`, style: 'h2' },
      { text: new Date(submittedAt || Date.now()).toLocaleString(), style: 'small' },
      { text: ' ' },
      auditMeta ? { columns: [
        { width: '*', stack: [
          { text: `People on shift: ${auditMeta.peopleOnShift || '-'}` },
          { text: `Month sales target: ${auditMeta.monthSalesTarget || '-'}` },
        ]},
        { width: '*', stack: [
          { text: `Time of audit: ${auditMeta.auditTime || '-'}` },
          { text: `Last audit score: ${auditMeta.lastAuditScore || '-'}` },
        ]},
      ] } : {},
      { text: ' ' },
      { table: { headerRows: 1, widths: ['*', '*', 70], body: tableBodyFromTraining(sections) }, layout: 'lightHorizontalLines' },
    ],
    styles: {
      h1: { fontSize: 18, bold: true },
      h2: { fontSize: 12, bold: true, margin: [0, 4, 0, 0] },
      small: { fontSize: 9, color: '#555' },
    }
  };
  const date = new Date(submittedAt || Date.now()).toISOString().slice(0,10);
  pdfMake.createPdf(docDefinition).download(`training-audit_${storeId || 'unknown'}_${date}.pdf`);
}
