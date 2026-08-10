'use client';
import { useState, useEffect } from 'react';

const API = '/api/stages';

function getProdiTerm(card, prodiCode) {
  if (prodiCode === 'te') return card.te_term || '';
  if (prodiCode === 'tind') return card.tind_term || '';
  if (prodiCode === 'tb') return card.tb_term || '';
  return card.te_term || '';
}

function isSkipped(card, prodiCode) {
  if ((card.title || '').toLowerCase().includes('informatika')) return true;
  if (card.skip_tind && prodiCode === 'tind') return true;
  return false;
}

function getCleanNote(note, activeProdi) {
  if (!note) return '';
  const lower = note.toLowerCase();
  if (activeProdi !== 'tind' && (lower.includes('teknik industri') || lower.includes('tind:'))) {
    return '';
  }
  return note;
}

// ===== FLOWCHART FOR PDF (EXPLICIT HEX STYLES - ZERO OKLCH/LAB ERRORS) =====
function PdfFlowchart({ cards, prodiList, activeProdi }) {
  const prodiObj = prodiList.find(p => p.code === activeProdi) || { name: activeProdi.toUpperCase() };
  const isNote = c => c.shape === 'note';
  const noteCards = cards.filter(c => isNote(c) && !isSkipped(c, activeProdi));
  const mainCards = cards.filter(c => !isSkipped(c, activeProdi) && !isNote(c));

  const noteMap = {};
  noteCards.forEach(n => {
    let key = n.step_number;
    if (!mainCards.some(mc => mc.step_number === key) && key > 1) {
      key = key - 1;
    }
    if (!noteMap[key]) noteMap[key] = [];
    noteMap[key].push(n);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', width: '100%', maxWidth: '620px', margin: '0 auto' }}>
      {mainCards.map((c, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === mainCards.length - 1;
        const isTerminal = c.shape === 'terminal' || isFirst || isLast;
        const isDecision = c.shape === 'decision';
        const prodiTerm = getProdiTerm(c, activeProdi);
        const cleanNote = getCleanNote(c.note, activeProdi);
        const annotations = (noteMap[c.step_number] || []);
        const prevCard = idx > 0 ? mainCards[idx - 1] : null;

        const getLabelContent = (termColor = "#2563eb") => (
          <span style={{ fontWeight: 'bold' }}>
            {c.title}
            {prodiTerm && <span style={{ color: termColor, fontWeight: '600', display: 'block', fontSize: '8.5px', marginTop: '1px' }}>({prodiTerm})</span>}
          </span>
        );

        const annotationSlot = annotations.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '160px', flexShrink: 0, paddingTop: '2px' }}>
            {annotations.map((n, ni) => (
              <div key={ni} style={{ backgroundColor: '#ecfdf5', border: '1px solid #34d399', borderLeft: '4px solid #059669', borderRadius: '6px', padding: '5px', fontSize: '8.5px', color: '#064e3b', fontWeight: '600' }}>
                <strong style={{ display: 'block', color: '#064e3b' }}>{n.title}</strong>
                <span style={{ fontSize: '8px', fontWeight: '500', display: 'block' }}>{n.description}</span>
                {n.note && <span style={{ fontSize: '7.5px', fontStyle: 'italic', display: 'block', marginTop: '1px' }}>ℹ️ {n.note}</span>}
              </div>
            ))}
          </div>
        ) : null;

        return (
          <div key={c.id} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', width: '100%', justifyContent: 'center' }}>
              {isTerminal ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ padding: '5px 14px', borderRadius: '9999px', fontWeight: 'bold', fontSize: '9.5px', backgroundColor: isFirst ? '#0f172a' : '#065f46', color: '#ffffff', textAlign: 'center' }}>
                    {getLabelContent(isFirst ? "#38bdf8" : "#fef08a")}
                  </div>
                  {cleanNote && (
                    <div style={{ marginTop: '2px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e3a8a', fontSize: '7.5px', fontWeight: '600', padding: '2px 6px', borderRadius: '4px', textAlign: 'center', maxWidth: '240px' }}>
                      ℹ️ {cleanNote}
                    </div>
                  )}
                </div>
              ) : isDecision ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '450px', position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', position: 'relative', minHeight: '110px' }}>
                    {/* CABANG KIRI: TIDAK / GAGAL */}
                    <div style={{ position: 'absolute', left: '0px', top: '50%', transform: 'translateY(-50%)', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', padding: '5px', color: '#7f1d1d', fontSize: '8px', fontWeight: 'bold', maxWidth: '135px', zIndex: 10 }}>
                      <span style={{ display: 'block', color: '#b91c1c', fontWeight: '800', textTransform: 'uppercase' }}>TIDAK / Gagal</span>
                      <span style={{ fontSize: '7.5px', color: '#7f1d1d' }}>Ulang: {prevCard ? prevCard.title : 'Proses Sebelumnya'}</span>
                    </div>

                    {/* BELAH KETUPAT */}
                    <div style={{ width: '90px', height: '90px', backgroundColor: '#fffbeb', border: '2px solid #d97706', transform: 'rotate(45deg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '8px 0' }}>
                      <div style={{ transform: 'rotate(-45deg)', textAlign: 'center', fontSize: '8px', fontWeight: '800', color: '#78350f', padding: '3px', maxWidth: '70px' }}>
                        {getLabelContent("#b45309")}
                      </div>
                    </div>
                  </div>

                  {/* CABANG BAWAH: YA / LULUS */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#059669', marginTop: '-4px' }}>
                    <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #6ee7b7', borderRadius: '9999px', padding: '1px 8px', color: '#065f46', fontSize: '7.5px', fontWeight: '800' }}>
                      YA / Lulus ▼
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ width: '100%', maxWidth: '320px', backgroundColor: '#ffffff', border: '2px solid #0f172a', padding: '6px', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '9.5px', fontWeight: 'bold', color: '#0f172a' }}>{getLabelContent()}</div>
                  {c.description && <div style={{ fontSize: '8px', color: '#475569', marginTop: '2px', fontWeight: '500' }}>{c.description}</div>}
                  {cleanNote && (
                    <div style={{ marginTop: '3px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e3a8a', fontSize: '7.5px', fontWeight: '600', padding: '2px', borderRadius: '4px' }}>
                      ℹ️ {cleanNote}
                    </div>
                  )}
                </div>
              )}
              {annotationSlot}
            </div>
            {!isLast && <div style={{ color: '#334155', fontSize: '10px', padding: '1px 0' }}>↓</div>}
          </div>
        );
      })}
    </div>
  );
}

// ===== FLOWCHART FOR WEB INTERFACE =====
function AnsiFlowchart({ cards, prodiList, activeProdi }) {
  const prodiObj = prodiList.find(p => p.code === activeProdi) || { name: activeProdi.toUpperCase() };
  const isNote = c => c.shape === 'note';
  const noteCards = cards.filter(c => isNote(c) && !isSkipped(c, activeProdi));
  const mainCards = cards.filter(c => !isSkipped(c, activeProdi) && !isNote(c));

  const noteMap = {};
  noteCards.forEach(n => {
    let key = n.step_number;
    if (!mainCards.some(mc => mc.step_number === key) && key > 1) {
      key = key - 1;
    }
    if (!noteMap[key]) noteMap[key] = [];
    noteMap[key].push(n);
  });

  return (
    <div className="flex flex-col items-center gap-1 sm:gap-2 p-1 sm:p-4 w-full max-w-4xl mx-auto overflow-hidden">
      <div className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider mb-1 text-center flex items-center justify-center gap-2 no-print">
        <i className="fa-solid fa-diagram-project text-blue-600" /> Skema Alur: {prodiObj.name}
      </div>
      {mainCards.map((c, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === mainCards.length - 1;
        const isTerminal = c.shape === 'terminal' || isFirst || isLast;
        const isDecision = c.shape === 'decision';
        const prodiTerm = getProdiTerm(c, activeProdi);
        const cleanNote = getCleanNote(c.note, activeProdi);
        const annotations = (noteMap[c.step_number] || []);
        const prevCard = idx > 0 ? mainCards[idx - 1] : null;

        const getLabelContent = (termColorClass = "text-blue-600") => (
          <span className="font-bold">
            {c.title}
            {prodiTerm && <span className={`${termColorClass} font-semibold block text-[10px] sm:text-xs mt-0.5`}>({prodiTerm})</span>}
          </span>
        );

        const annotationSlot = annotations.length > 0 ? (
          <div className="flex flex-col gap-1.5 w-full sm:w-56 shrink-0 pt-1">
            {annotations.map((n, ni) => (
              <div key={ni} className="fc-annotation-parallelogram bg-emerald-50 border border-emerald-400 border-l-4 border-l-emerald-600 rounded-lg p-2 text-xs text-emerald-950 font-semibold flex items-start gap-2 shadow-xs">
                <i className="fa-solid fa-file-shield text-emerald-600 shrink-0 mt-0.5" />
                <div className="break-words">
                  <strong className="block text-emerald-950">{n.title}</strong>
                  <span className="text-[11px] font-medium text-emerald-900 block">{n.description}</span>
                  {n.note && <span className="text-[10px] text-emerald-800 italic block mt-0.5">ℹ️ {n.note}</span>}
                </div>
              </div>
            ))}
          </div>
        ) : null;

        return (
          <div key={c.id} className="w-full flex flex-col items-center">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 w-full max-w-2xl justify-center">
              {isTerminal ? (
                <div className="flex flex-col items-center">
                  <div className={`px-4 py-2 rounded-full font-bold text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 shadow-sm shrink-0 text-center max-w-full ${isFirst ? 'bg-slate-900 text-slate-50' : 'bg-emerald-800 text-emerald-50'}`}>
                    <i className={`fa-solid ${isFirst ? 'fa-circle-play text-emerald-400' : 'fa-flag-checkered text-amber-300'}`} />
                    {getLabelContent(isFirst ? "text-sky-300" : "text-amber-200")}
                  </div>
                  {cleanNote && (
                    <div className="mt-1 bg-blue-50 border border-blue-200 text-blue-900 text-[9px] sm:text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs max-w-xs text-center">
                      <i className="fa-solid fa-circle-info text-blue-600 shrink-0" />
                      <span>{cleanNote}</span>
                    </div>
                  )}
                </div>
              ) : isDecision ? (
                <div className="flex flex-col items-center w-full max-w-xl my-1 sm:my-2 relative">
                  <div className="flex items-center justify-center w-full relative min-h-[130px] sm:min-h-[160px]">
                    <div className="absolute left-0 sm:left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-red-50 border border-red-300 rounded-xl p-2 sm:p-2.5 text-red-950 text-xs font-bold shadow-xs max-w-[140px] sm:max-w-[190px] z-10">
                      <i className="fa-solid fa-arrow-turn-up text-red-600 text-sm sm:text-base shrink-0 transform -scale-x-100" />
                      <div className="leading-tight">
                        <span className="block text-red-700 font-extrabold text-[8.5px] sm:text-[10px] uppercase">TIDAK / Gagal</span>
                        <span className="text-[8px] sm:text-[10px] text-red-900 font-semibold block truncate">Ulang: {prevCard ? prevCard.title : 'Proses Sebelumnya'}</span>
                      </div>
                    </div>

                    <div className="w-28 h-28 sm:w-36 sm:h-36 bg-amber-50 border-2 border-amber-600 rotate-45 flex items-center justify-center shadow-xs shrink-0 relative z-0">
                      <div className="-rotate-45 text-center text-[9px] sm:text-xs font-extrabold text-amber-950 p-1.5 leading-tight max-w-[85px] sm:max-w-[100px] break-words">
                        {getLabelContent("text-amber-800")}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center text-emerald-600 -mt-2 sm:-mt-3 z-10">
                    <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-400 rounded-full px-3 py-0.5 text-emerald-950 text-[9px] sm:text-xs font-bold shadow-xs">
                      <span className="text-emerald-800 font-extrabold uppercase">YA / Lulus</span>
                      <i className="fa-solid fa-arrow-down text-emerald-600 text-xs" />
                    </div>
                    <div className="w-0.5 h-3 bg-emerald-600" />
                    <i className="fa-solid fa-caret-down text-sm -mt-1 text-emerald-600" />
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-md bg-white border-2 border-slate-900 p-2.5 sm:p-3 rounded-xl text-center shadow-xs">
                  <div className="text-xs sm:text-sm font-bold text-slate-900">{getLabelContent()}</div>
                  {c.description && <div className="text-[10px] sm:text-xs text-slate-600 mt-0.5 font-medium">{c.description}</div>}
                  {cleanNote && (
                    <div className="mt-1.5 bg-blue-50 border border-blue-200 text-blue-900 text-[9.5px] sm:text-[10.5px] font-semibold px-2 py-1 rounded-lg inline-flex items-center justify-center gap-1 w-full text-center">
                      <i className="fa-solid fa-circle-info text-blue-600 shrink-0" />
                      <span>{cleanNote}</span>
                    </div>
                  )}
                </div>
              )}
              {annotationSlot}
            </div>
            {!isLast && <div className="text-slate-700 text-xs sm:text-base py-0.5"><i className="fa-solid fa-arrow-down" /></div>}
          </div>
        );
      })}
    </div>
  );
}

// ===== TIMELINE CARDS =====
function TimelineCards({ cards, prodiList, activeProdi }) {
  const prodiObj = prodiList.find(p => p.code === activeProdi) || { name: activeProdi.toUpperCase() };
  const validCards = cards.filter(c => !isSkipped(c, activeProdi));
  const [expandedDocs, setExpandedDocs] = useState({});

  const toggleDocs = (cardId) => {
    setExpandedDocs(prev => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {validCards.map((card, idx) => {
        let docsList = [];
        try { docsList = JSON.parse(card.docs_json || '[]'); } catch (e) {}
        const currentTerm = getProdiTerm(card, activeProdi);
        const isOpen = !!expandedDocs[card.id];

        return (
          <div key={card.id} className="flex flex-col items-center">
            <div className={`w-full bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm hover:shadow-md transition-all ${idx === 0 ? 'ring-2 ring-blue-500/20 border-blue-300' : ''}`}>
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">{card.title}</h3>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-200 shrink-0">Tahap {card.step_number}</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mb-3">{card.description}</p>

              {/* Tombol Collapsible Berkas Persyaratan */}
              {docsList.length > 0 && (
                <div className="my-2.5">
                  <button
                    onClick={() => toggleDocs(card.id)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-200 text-slate-800 text-xs font-bold transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <i className="fa-solid fa-folder-open text-blue-600 text-sm" />
                      <span>Lihat Berkas Persyaratan ({docsList.length} Items)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-blue-700 font-semibold">
                      <span className="text-[11px]">{isOpen ? 'Tutup' : 'Tampilkan'}</span>
                      <i className={`fa-solid fa-chevron-down text-xs transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </button>

                  {/* Isi Accordion Berkas */}
                  {isOpen && (
                    <div className="mt-2.5 p-3.5 rounded-xl border border-blue-200/80 bg-blue-50/40 space-y-3">
                      <div className="flex items-start gap-2.5 text-xs font-medium text-blue-950 bg-blue-100/70 border border-blue-200 rounded-lg p-2.5">
                        <i className="fa-solid fa-cloud-arrow-up text-blue-600 text-base shrink-0 mt-0.5" />
                        <div>
                          <strong className="block text-blue-950 font-bold mb-0.5">Ketentuan Format Berkas &amp; Portal Resmi:</strong>
                          <span>*Semua berkas (No. 1 s/d {docsList.length}) disiapkan dalam <strong>format PDF</strong> dan diunggah di <strong>GDRIVE Pendaftaran MENTORA</strong>.</span>
                          <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                            <a href="https://kpta.sisfoftudinus.my.id/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-blue-700 hover:text-blue-900 font-bold bg-white px-2.5 py-1 rounded-lg border border-blue-200 shadow-2xs hover:bg-blue-50 transition-all">
                              <i className="fa-solid fa-graduation-cap text-blue-600" /> MENTORA (kpta.sisfoftudinus.my.id) <i className="fa-solid fa-arrow-up-right-from-square text-[9px]" />
                            </a>
                            <a href="https://alumni.sisfoftudinus.my.id/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-900 font-bold bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs hover:bg-emerald-50 transition-all">
                              <i className="fa-solid fa-briefcase text-emerald-600" /> Link n Match (alumni.sisfoftudinus.my.id) <i className="fa-solid fa-arrow-up-right-from-square text-[9px]" />
                            </a>
                            <a href="https://sisfoftudinus.my.id/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-indigo-700 hover:text-indigo-900 font-bold bg-white px-2.5 py-1 rounded-lg border border-indigo-200 shadow-2xs hover:bg-indigo-50 transition-all">
                              <i className="fa-solid fa-certificate text-indigo-600" /> Portal SKPI (sisfoftudinus.my.id) <i className="fa-solid fa-arrow-up-right-from-square text-[9px]" />
                            </a>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {docsList.map((doc, di) => doc.link ? (
                          <a key={di} href={doc.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 p-2.5 rounded-xl border border-indigo-200 bg-white hover:bg-indigo-50 transition-colors text-indigo-900 text-xs font-semibold shadow-sm">
                            <i className={`fa-solid ${doc.icon || 'fa-file-lines'} text-indigo-600 text-sm shrink-0`} />
                            <div className="min-w-0 flex-1"><strong className="block text-indigo-950 truncate">{doc.title} <i className="fa-solid fa-link text-[9px]" /></strong><span className="text-indigo-700 font-normal text-[10px] block truncate">{doc.sub}</span></div>
                          </a>
                        ) : (
                          <div key={di} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 shadow-sm">
                            <i className={`fa-solid ${doc.icon || 'fa-file-pdf'} text-red-500 text-sm shrink-0`} />
                            <div className="min-w-0 flex-1"><strong className="block text-slate-900 truncate">{doc.title}</strong><span className="text-slate-500 text-[10px] block truncate">{doc.sub}</span></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(() => {
                const cleanNote = getCleanNote(card.note, activeProdi);
                return cleanNote ? (
                  <div className="bg-blue-50 border border-blue-200 text-blue-900 text-xs p-3 rounded-xl flex items-start gap-2 mt-3 font-medium">
                    <i className="fa-solid fa-circle-info text-blue-600 mt-0.5 shrink-0" />
                    <span>{cleanNote}</span>
                  </div>
                ) : null;
              })()}

              {currentTerm && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg border font-bold bg-blue-50 text-blue-700 border-blue-300 shadow-sm">
                    <i className={`fa-solid ${prodiObj.icon || 'fa-graduation-cap'}`} style={{ color: prodiObj.color || '#2563eb' }} />
                    {prodiObj.name}: {currentTerm}
                  </span>
                </div>
              )}
            </div>
            {idx < validCards.length - 1 && <div className="text-slate-400 text-base py-1.5"><i className="fa-solid fa-arrow-down" /></div>}
          </div>
        );
      })}
    </div>
  );
}

// ===== PEMETAAN TABLE =====
function PemetaanTable({ cards, prodiList, activeProdi }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs bg-white">
      <table className="w-full text-left text-xs sm:text-sm">
        <thead>
          <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-800 whitespace-nowrap">
            <th className="p-3.5">Tahapan Ujian</th>
            {prodiList.map(p => (
              <th key={p.code} className={`p-3.5 ${activeProdi === p.code ? 'bg-blue-50 text-blue-900 border-x border-blue-200' : ''}`}>
                <i className={`fa-solid ${p.icon || 'fa-graduation-cap'} mr-1`} style={{ color: p.color || '#2563eb' }} /> {p.code.toUpperCase()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {cards.filter(item => !isSkipped(item, activeProdi)).map(item => (
            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
              <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">{item.title}</td>
              {prodiList.map(p => {
                let term = '-';
                if (p.code === 'te') term = item.te_term || '-';
                else if (p.code === 'tind') term = item.tind_term || '-';
                else if (p.code === 'tb') term = item.tb_term || '-';
                else term = item.te_term || item.title;
                return (
                  <td key={p.code} className={`p-3.5 text-slate-700 whitespace-nowrap ${activeProdi === p.code ? 'bg-blue-50/50 font-bold text-blue-950 border-x border-blue-200' : ''}`}>
                    {term}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ===== SKELETON LOADING COMPONENTS =====
function TimelineSkeleton() {
  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {[1, 2, 3].map(i => (
        <div key={i} className="w-full bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-3 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="h-5 bg-slate-200 rounded-lg w-1/3" />
            <div className="h-5 bg-slate-100 rounded-full w-20" />
          </div>
          <div className="h-3.5 bg-slate-100 rounded-md w-full" />
          <div className="h-3.5 bg-slate-100 rounded-md w-3/4" />
          <div className="h-11 bg-slate-50 border border-slate-100 rounded-xl w-full" />
        </div>
      ))}
    </div>
  );
}

function FlowchartSkeleton() {
  return (
    <div className="flex flex-col items-center gap-4 py-6 w-full max-w-md mx-auto animate-pulse">
      <div className="h-10 bg-slate-200 rounded-full w-48" />
      <div className="w-1 h-6 bg-slate-200 rounded-full" />
      <div className="h-14 bg-white border border-slate-200 rounded-xl w-full" />
      <div className="w-1 h-6 bg-slate-200 rounded-full" />
      <div className="w-28 h-28 bg-amber-50/50 border border-amber-200 rotate-45 rounded-xl my-2" />
    </div>
  );
}

// ===== MAIN PUBLIC PAGE =====
export default function HomePage() {
  const [cards, setCards] = useState([]);
  const [prodiList, setProdiList] = useState([]);
  const [activeProdi, setActiveProdi] = useState('te');
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [openSections, setOpenSections] = useState({
    timeline: true,   // Default Terbuka
    flowchart: true,  // Default Terbuka
    table: false      // Default Tertutup
  });

  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    async function load() {
      try {
        const [pr, cr] = await Promise.all([fetch(`${API}?type=prodi`), fetch(API)]);
        const prodiData = pr.ok ? await pr.json() : [];
        const cardData = cr.ok ? await cr.json() : [];
        setProdiList(prodiData);
        setCards(cardData);
        if (prodiData.length > 0) setActiveProdi(prodiData[0].code);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();

    const handler = e => { if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') window.location.href = '/admin'; };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ===== BULLETPROOF EXPORTER USING MODERN HTML2CANVAS & JSPDF =====
  async function handlePdfExport() {
    setPdfLoading(true);
    const prodiMatch = prodiList.find(p => p.code === activeProdi);
    const page1El = document.getElementById('pdf-page-1');
    const page2El = document.getElementById('pdf-page-2');

    if (!page1El || !page2El) {
      setPdfLoading(false);
      return;
    }

    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      // Render Halaman 1
      const canvas1 = await html2canvas(page1El, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      const imgData1 = canvas1.toDataURL('image/jpeg', 0.98);
      pdf.addImage(imgData1, 'JPEG', 0, 0, 210, 297);

      // Render Halaman 2
      pdf.addPage();
      const canvas2 = await html2canvas(page2El, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      const imgData2 = canvas2.toDataURL('image/jpeg', 0.98);
      pdf.addImage(imgData2, 'JPEG', 0, 0, 210, 297);

      pdf.save(`Alur_Ujian_${(prodiMatch?.code || activeProdi).toUpperCase()}_UDINUS.pdf`);
    } catch (e) {
      console.error('PDF export error:', e);
      alert('Gagal mengekspor PDF: ' + e.message);
    } finally {
      setPdfLoading(false);
    }
  }

  const activeProdiObj = prodiList.find(p => p.code === activeProdi) || { name: activeProdi.toUpperCase() };

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10">
        <header className="no-print mb-6 sm:mb-10">
          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
            <img src="/img/image.png" alt="Logo UDINUS" className="h-12 sm:h-16 w-auto drop-shadow-md" />
            <div className="text-center flex-1 min-w-[200px]">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200 mb-2">
                <i className="fa-solid fa-graduation-cap" /> UDINUS — Fakultas Teknik
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Alur Pendaftaran Ujian CD / PT</h1>
            </div>
            <img src="/img/image-ft.png" alt="Logo FT UDINUS" className="h-12 sm:h-16 w-auto drop-shadow-md" />
          </div>
          <p className="text-center text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto">
            Panduan alur pendaftaran dan istilah spesifik ujian Capstone Design (CD) / Project Terpadu (PT) Fakultas Teknik UDINUS.
          </p>
        </header>

        {/* Sticky Tab Bar */}
        <div className="no-print sticky top-3 z-30 mb-8">
          <div className="backdrop-blur-md bg-white/70 border border-white/60 rounded-2xl p-2 sm:p-2.5 shadow-lg shadow-slate-900/5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full no-scrollbar py-0.5 px-0.5 shrink">
              {prodiList.map(p => {
                const iconClass = p.icon || (p.code === 'te' ? 'fa-bolt' : p.code === 'tind' ? 'fa-industry' : p.code === 'tb' ? 'fa-heart-pulse' : 'fa-graduation-cap');
                const isActive = activeProdi === p.code;
                return (
                  <button key={p.code} onClick={() => setActiveProdi(p.code)} className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl transition-all shrink-0 whitespace-nowrap ${isActive ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100/90 text-slate-700 hover:bg-slate-200'}`}>
                    <i className={`fa-solid ${iconClass}`} style={{ color: isActive ? '#38bdf8' : (p.color || '#0f172a') }} />
                    <span className="hidden sm:inline">{p.name}</span>
                    <span className="inline sm:hidden uppercase font-extrabold">{p.code}</span>
                  </button>
                );
              })}
            </div>
            <button
              onClick={handlePdfExport}
              disabled={pdfLoading}
              className="no-print inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-md transition-all shrink-0 whitespace-nowrap cursor-pointer disabled:opacity-50"
            >
              {pdfLoading ? (
                <>
                  <i className="fa-solid fa-spinner animate-spin" />
                  <span>Mengunduh...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-file-pdf" />
                  <span className="hidden sm:inline">Unduh PDF (2 Hal)</span>
                  <span className="inline sm:hidden">PDF</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Section 1: Tahapan Alur Pendaftaran (default TERBUKA) */}
        <div className="no-print mb-8 bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
          <button
            onClick={() => toggleSection('timeline')}
            className="w-full flex items-center justify-between gap-2 text-left cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 text-base font-bold shadow-xs">
                <i className="fa-solid fa-layer-group" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                  Tahapan Alur Pendaftaran ({activeProdiObj.name})
                </h2>
                <span className="text-xs text-slate-500 hidden sm:inline">Menampilkan alur spesifik & berkas {activeProdiObj.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-blue-700 font-bold text-xs bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200/60">
              <span>{openSections.timeline ? 'Sembunyikan' : 'Tampilkan'}</span>
              <i className={`fa-solid fa-chevron-down text-xs transition-transform duration-200 ${openSections.timeline ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {openSections.timeline && (
            <div className="mt-6 pt-5 border-t border-slate-100">
              {loading ? <TimelineSkeleton /> : <TimelineCards cards={cards} prodiList={prodiList} activeProdi={activeProdi} />}
            </div>
          )}
        </div>

        {/* Section 2: Diagram Alur Ujian (default TERBUKA) */}
        <div className="no-print mb-8 bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
          <button
            onClick={() => toggleSection('flowchart')}
            className="w-full flex items-center justify-between gap-2 text-left cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 text-base font-bold shadow-xs">
                <i className="fa-solid fa-diagram-project" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 group-hover:text-amber-600 transition-colors">
                  Diagram Alur Ujian ({activeProdiObj.name})
                </h2>
                <span className="text-xs text-slate-500 hidden sm:inline">Skema alur logika & percabangan {activeProdiObj.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200/60">
              <span>{openSections.flowchart ? 'Sembunyikan' : 'Tampilkan'}</span>
              <i className={`fa-solid fa-chevron-down text-xs transition-transform duration-200 ${openSections.flowchart ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {openSections.flowchart && (
            <div className="mt-4 pt-4 sm:pt-5 border-t border-slate-100">
              {loading ? <FlowchartSkeleton /> : <AnsiFlowchart cards={cards} prodiList={prodiList} activeProdi={activeProdi} />}
            </div>
          )}
        </div>

        {/* Section 3: Pemetaan Istilah (bisa dibuka-tutup) */}
        <div className="no-print mb-12 bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
          <button
            onClick={() => toggleSection('table')}
            className="w-full flex items-center justify-between gap-2 text-left cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 text-base font-bold shadow-xs">
                <i className="fa-solid fa-table-columns" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Pemetaan Istilah Berdasarkan Program Studi
                </h2>
                <span className="text-xs text-slate-500 hidden sm:inline">Tabel perbandingan istilah antarmata kuliah prodi</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-indigo-700 font-bold text-xs bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200/60">
              <span>{openSections.table ? 'Sembunyikan' : 'Tampilkan'}</span>
              <i className={`fa-solid fa-chevron-down text-xs transition-transform duration-200 ${openSections.table ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {openSections.table && (
            <div className="mt-5 pt-4 border-t border-slate-100">
              <PemetaanTable cards={cards} prodiList={prodiList} activeProdi={activeProdi} />
            </div>
          )}
        </div>

        {/* PDF DIRECT EXPORTER (OFFSCREEN FIXED POSITIONS - 2 PAGES A4) */}
        <div style={{ position: 'fixed', left: '-9999px', top: '0px', width: '210mm', opacity: 1, zIndex: -9999 }}>
          {/* HALAMAN 1 */}
          <div id="pdf-page-1" style={{ backgroundColor: '#ffffff', color: '#0f172a', width: '210mm', height: '297mm', boxSizing: 'border-box', padding: '10px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              {/* KOP SURAT */}
              <div style={{ borderBottom: '2px solid #000000', paddingBottom: '4px', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <img src="/img/image.png" alt="Logo UDINUS" style={{ height: '32px', width: 'auto' }} />
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <h2 style={{ fontSize: '10pt', fontWeight: 'bold', margin: 0, padding: 0, color: '#000000' }}>UNIVERSITAS DIAN NUSWANTORO</h2>
                    <h3 style={{ fontSize: '8.5pt', fontWeight: 'bold', margin: 0, padding: 0, color: '#000000' }}>FAKULTAS TEKNIK</h3>
                    <p style={{ fontSize: '6.5pt', margin: '1px 0', padding: 0, color: '#334155' }}>Jl. Nakula I No. 5-11 Semarang | Telp. (024) 3517261 | Website: ft.dinus.ac.id</p>
                    <h4 style={{ fontSize: '7.5pt', fontWeight: 'bold', textTransform: 'uppercase', margin: 0, paddingTop: '1px', borderTop: '1px solid #000000', display: 'inline-block', color: '#000000' }}>
                      ALUR PENDAFTARAN UJIAN ({activeProdiObj.name})
                    </h4>
                  </div>
                  <img src="/img/image-ft.png" alt="Logo FT UDINUS" style={{ height: '32px', width: 'auto' }} />
                </div>
              </div>

              <div style={{ textAlign: 'center', fontWeight: '800', fontSize: '8pt', marginBottom: '4px', textTransform: 'uppercase', color: '#0f172a', borderBottom: '1px solid #000000', paddingBottom: '2px' }}>
                HALAMAN 1: TAHAPAN ALUR PENDAFTARAN &amp; BERKAS PERSYARATAN ({activeProdiObj.name})
              </div>

              {/* 7 STAGE CARDS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {cards.filter(c => !isSkipped(c, activeProdi)).map(card => {
                  const prodiTerm = getProdiTerm(card, activeProdi);
                  let docsList = [];
                  try { docsList = JSON.parse(card.docs_json || '[]'); } catch (e) {}
                  const cleanNote = getCleanNote(card.note, activeProdi);

                  return (
                    <div key={card.id} style={{ border: '1px solid #94a3b8', borderRadius: '4px', padding: '5px 8px', fontSize: '7pt', lineHeight: 1.2, backgroundColor: '#ffffff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <strong style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '7.5pt' }}>{card.title}</strong>
                        <span style={{ backgroundColor: '#f1f5f9', color: '#0f172a', fontSize: '6.5pt', fontWeight: 'bold', padding: '1px 5px', borderRadius: '3px', border: '1px solid #cbd5e1' }}>
                          Tahap {card.step_number} {prodiTerm ? `— ${prodiTerm}` : ''}
                        </span>
                      </div>
                      <p style={{ color: '#334155', fontSize: '6.5pt', margin: '1px 0 2px 0' }}>{card.description}</p>
                      {cleanNote && <div style={{ color: '#1e3a8a', fontSize: '6pt', fontStyle: 'italic', marginBottom: '2px', fontWeight: '600' }}>ℹ️ {cleanNote}</div>}
                      {docsList.length > 0 && (
                        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '3px', padding: '4px 6px', fontSize: '6pt', marginTop: '2px' }}>
                          <strong style={{ display: 'block', color: '#0f172a', fontWeight: 'bold', marginBottom: '2px' }}>
                            Berkas Persyaratan (PDF MENTORA - kpta.sisfoftudinus.my.id):
                          </strong>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px 8px' }}>
                            {docsList.map((doc, di) => (
                              <span key={di} style={{ color: '#1e293b', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {di + 1}. {doc.title} {doc.sub ? `(${doc.sub})` : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* FOOTER HALAMAN 1 */}
            <div style={{ borderTop: '1px solid #000000', paddingTop: '3px', fontSize: '6.5pt', display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
              <span>Dokumen Resmi Alur Ujian Fakultas Teknik UDINUS</span>
              <span>Halaman 1 dari 2</span>
            </div>
          </div>

          {/* HALAMAN 2 */}
          <div id="pdf-page-2" style={{ backgroundColor: '#ffffff', color: '#0f172a', width: '210mm', height: '297mm', boxSizing: 'border-box', padding: '10px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              {/* KOP SURAT */}
              <div style={{ borderBottom: '2px solid #000000', paddingBottom: '4px', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <img src="/img/image.png" alt="Logo UDINUS" style={{ height: '32px', width: 'auto' }} />
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <h2 style={{ fontSize: '10pt', fontWeight: 'bold', margin: 0, padding: 0, color: '#000000' }}>UNIVERSITAS DIAN NUSWANTORO</h2>
                    <h3 style={{ fontSize: '8.5pt', fontWeight: 'bold', margin: 0, padding: 0, color: '#000000' }}>FAKULTAS TEKNIK</h3>
                    <p style={{ fontSize: '6.5pt', margin: '1px 0', padding: 0, color: '#334155' }}>Jl. Nakula I No. 5-11 Semarang | Telp. (024) 3517261 | Website: ft.dinus.ac.id</p>
                    <h4 style={{ fontSize: '7.5pt', fontWeight: 'bold', textTransform: 'uppercase', margin: 0, paddingTop: '1px', borderTop: '1px solid #000000', display: 'inline-block', color: '#000000' }}>
                      DIAGRAM ALUR LOGIKA UJIAN ({activeProdiObj.name})
                    </h4>
                  </div>
                  <img src="/img/image-ft.png" alt="Logo FT UDINUS" style={{ height: '32px', width: 'auto' }} />
                </div>
              </div>

              <div style={{ textAlign: 'center', fontWeight: '800', fontSize: '8pt', marginBottom: '6px', textTransform: 'uppercase', color: '#0f172a', borderBottom: '1px solid #000000', paddingBottom: '2px' }}>
                HALAMAN 2: DIAGRAM ALUR UJIAN ({activeProdiObj.name})
              </div>

              {/* FLOWCHART PDF (PURE HEX STYLES) */}
              <div style={{ marginTop: '6px' }}>
                <PdfFlowchart cards={cards} prodiList={prodiList} activeProdi={activeProdi} />
              </div>
            </div>

            {/* FOOTER HALAMAN 2 */}
            <div style={{ borderTop: '1px solid #000000', paddingTop: '3px', fontSize: '6.5pt', display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
              <span>Dokumen Resmi Alur Ujian Fakultas Teknik UDINUS</span>
              <span>Halaman 2 dari 2</span>
            </div>
          </div>
        </div>

        <footer className="no-print mt-12 text-center text-xs text-slate-500 border-t border-slate-200 pt-6">
          <p>&copy; 2026 Universitas Dian Nuswantoro (UDINUS) — Fakultas Teknik</p>
        </footer>
      </div>

      <ScrollToTopButton />
    </>
  );
}

function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const toggleVisible = () => {
      if (window.scrollY > 250) setVisible(true);
      else setVisible(false);
    };
    window.addEventListener('scroll', toggleVisible);
    return () => window.removeEventListener('scroll', toggleVisible);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="no-print fixed bottom-5 right-5 z-40 w-10 h-10 rounded-full bg-slate-900/85 hover:bg-slate-900 text-white border border-white/20 shadow-lg backdrop-blur-md flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer"
      title="Kembali ke Atas"
      aria-label="Kembali ke Atas"
    >
      <i className="fa-solid fa-arrow-up text-xs" />
    </button>
  );
}
