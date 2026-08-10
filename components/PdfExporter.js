'use client';
import React from 'react';
import base64Logos from '../public/img/logos_b64.json';

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

// ===== FLOWCHART FOR PDF (CLEAN STANDARDIZED HEX STYLES - ZERO LAB/OKLCH COLOR ERRORS) =====
export function PdfFlowchart({ cards, prodiList, activeProdi }) {
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', width: '100%', maxWidth: '650px', margin: '0 auto' }}>
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
            {prodiTerm && <span style={{ color: termColor, fontWeight: '600', display: 'block', fontSize: '9pt', marginTop: '2px' }}>({prodiTerm})</span>}
          </span>
        );

        const annotationSlot = annotations.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '180px', flexShrink: 0, paddingTop: '2px' }}>
            {annotations.map((n, ni) => (
              <div key={ni} style={{ backgroundColor: '#ecfdf5', border: '1px solid #34d399', borderLeft: '4px solid #059669', borderRadius: '6px', padding: '6px', fontSize: '8.5pt', color: '#064e3b', fontWeight: '600' }}>
                <strong style={{ display: 'block', color: '#064e3b' }}>{n.title}</strong>
                <span style={{ fontSize: '8pt', fontWeight: '500', display: 'block', marginTop: '1px' }}>{n.description}</span>
                {n.note && <span style={{ fontSize: '7.5pt', fontStyle: 'italic', display: 'block', marginTop: '2px' }}>ℹ️ {n.note}</span>}
              </div>
            ))}
          </div>
        ) : null;

        return (
          <div key={c.id} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', width: '100%', justifyContent: 'center' }}>
              {isTerminal ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ padding: '6px 18px', borderRadius: '9999px', fontWeight: 'bold', fontSize: '10pt', backgroundColor: isFirst ? '#0f172a' : '#065f46', color: '#ffffff', textAlign: 'center', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                    {getLabelContent(isFirst ? "#38bdf8" : "#fef08a")}
                  </div>
                  {cleanNote && (
                    <div style={{ marginTop: '3px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e3a8a', fontSize: '8pt', fontWeight: '600', padding: '3px 8px', borderRadius: '5px', textAlign: 'center', maxWidth: '260px' }}>
                      ℹ️ {cleanNote}
                    </div>
                  )}
                </div>
              ) : isDecision ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '480px', position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', position: 'relative', minHeight: '120px' }}>
                    {/* CABANG KIRI: TIDAK / GAGAL */}
                    <div style={{ position: 'absolute', left: '0px', top: '50%', transform: 'translateY(-50%)', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '6px 8px', color: '#7f1d1d', fontSize: '8.5pt', fontWeight: 'bold', maxWidth: '145px', zIndex: 10 }}>
                      <span style={{ display: 'block', color: '#b91c1c', fontWeight: '800', textTransform: 'uppercase' }}>TIDAK / Gagal</span>
                      <span style={{ fontSize: '8pt', color: '#7f1d1d', fontWeight: '600', display: 'block', marginTop: '1px' }}>Ulang: {prevCard ? prevCard.title : 'Proses Sebelumnya'}</span>
                    </div>

                    {/* BELAH KETUPAT */}
                    <div style={{ width: '96px', height: '96px', backgroundColor: '#fffbeb', border: '2px solid #d97706', transform: 'rotate(45deg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '8px 0' }}>
                      <div style={{ transform: 'rotate(-45deg)', textAlign: 'center', fontSize: '8.5pt', fontWeight: '800', color: '#78350f', padding: '4px', maxWidth: '75px' }}>
                        {getLabelContent("#b45309")}
                      </div>
                    </div>
                  </div>

                  {/* CABANG BAWAH: YA / LULUS */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#059669', marginTop: '-4px' }}>
                    <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #6ee7b7', borderRadius: '9999px', padding: '2px 10px', color: '#064e3b', fontSize: '8pt', fontWeight: '800' }}>
                      YA / Lulus ▼
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ width: '100%', maxWidth: '350px', backgroundColor: '#ffffff', border: '2px solid #0f172a', padding: '8px 12px', borderRadius: '10px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10pt', fontWeight: 'bold', color: '#0f172a' }}>{getLabelContent()}</div>
                  {c.description && <div style={{ fontSize: '8.5pt', color: '#475569', marginTop: '2px', fontWeight: '500' }}>{c.description}</div>}
                  {cleanNote && (
                    <div style={{ marginTop: '4px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e3a8a', fontSize: '8pt', fontWeight: '600', padding: '3px 6px', borderRadius: '5px' }}>
                      ℹ️ {cleanNote}
                    </div>
                  )}
                </div>
              )}
              {annotationSlot}
            </div>
            {!isLast && <div style={{ color: '#334155', fontSize: '12px', padding: '2px 0' }}>↓</div>}
          </div>
        );
      })}
    </div>
  );
}

// ===== PDF TEMPLATE DOCUMENT (PAGES 1 & 2) =====
export function PdfExportDocument({ cards, prodiList, activeProdi }) {
  const activeProdiObj = prodiList.find(p => p.code === activeProdi) || { name: activeProdi.toUpperCase() };

  // Use pre-encoded base64 data URLs to eliminate CORS issues on Vercel
  const udinusLogo = base64Logos.udinus || '/img/image.png';
  const ftLogo = base64Logos.ft || '/img/image-ft.png';

  return (
    <div style={{ position: 'fixed', left: '-9999px', top: '0px', width: '210mm', opacity: 1, zIndex: -9999, fontFamily: 'sans-serif' }}>
      {/* HALAMAN 1: TAHAPAN ALUR PENDAFTARAN & BERKAS */}
      <div id="pdf-page-1" style={{ backgroundColor: '#ffffff', color: '#0f172a', width: '210mm', height: '297mm', boxSizing: 'border-box', padding: '12px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          {/* KOP SURAT (PROPORTIONAL LOGOS & BALANCED HEADER) */}
          <div style={{ borderBottom: '3px double #0f172a', paddingBottom: '6px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '0 8px' }}>
              <img src={udinusLogo} alt="Logo UDINUS" style={{ height: '48px', width: 'auto', objectFit: 'contain' }} />
              <div style={{ textAlign: 'center', flex: 1 }}>
                <h2 style={{ fontSize: '11pt', fontWeight: 'bold', margin: 0, padding: 0, color: '#000000', letterSpacing: '0.3px' }}>UNIVERSITAS DIAN NUSWANTORO</h2>
                <h3 style={{ fontSize: '9.5pt', fontWeight: 'bold', margin: '2px 0 0 0', padding: 0, color: '#000000' }}>FAKULTAS TEKNIK</h3>
                <p style={{ fontSize: '7pt', margin: '2px 0', padding: 0, color: '#334155' }}>Jl. Nakula I No. 5-11 Semarang | Telp. (024) 3517261 | Website: ft.dinus.ac.id</p>
                <div style={{ marginTop: '2px', borderTop: '1px solid #000000', paddingTop: '2px', display: 'inline-block' }}>
                  <h4 style={{ fontSize: '8pt', fontWeight: 'bold', textTransform: 'uppercase', margin: 0, color: '#000000' }}>
                    ALUR PENDAFTARAN UJIAN ({activeProdiObj.name})
                  </h4>
                </div>
              </div>
              <img src={ftLogo} alt="Logo FT UDINUS" style={{ height: '48px', width: 'auto', objectFit: 'contain' }} />
            </div>
          </div>

          <div style={{ textAlign: 'center', fontWeight: '800', fontSize: '8.5pt', marginBottom: '6px', textTransform: 'uppercase', color: '#0f172a', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', padding: '3px 0', borderRadius: '4px' }}>
            HALAMAN 1: TAHAPAN ALUR PENDAFTARAN &amp; BERKAS PERSYARATAN ({activeProdiObj.name})
          </div>

          {/* 7 STAGE CARDS WITH PROPER SPACING AND LEGIBLE BERKAS GRID */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {cards.filter(c => !isSkipped(c, activeProdi)).map(card => {
              const prodiTerm = getProdiTerm(card, activeProdi);
              let docsList = [];
              try { docsList = JSON.parse(card.docs_json || '[]'); } catch (e) {}
              const cleanNote = getCleanNote(card.note, activeProdi);

              return (
                <div key={card.id} style={{ border: '1px solid #94a3b8', borderRadius: '6px', padding: '6px 10px', fontSize: '7.5pt', lineHeight: 1.35, backgroundColor: '#ffffff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                    <strong style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '8.5pt' }}>{card.title}</strong>
                    <span style={{ backgroundColor: '#f1f5f9', color: '#0f172a', fontSize: '7pt', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}>
                      Tahap {card.step_number} {prodiTerm ? `— ${prodiTerm}` : ''}
                    </span>
                  </div>
                  <p style={{ color: '#334155', fontSize: '7pt', margin: '1px 0 3px 0', lineHeight: '1.3' }}>{card.description}</p>
                  {cleanNote && <div style={{ color: '#1e3a8a', fontSize: '6.5pt', fontStyle: 'italic', marginBottom: '3px', fontWeight: '600', backgroundColor: '#eff6ff', padding: '2px 6px', borderRadius: '4px', border: '1px solid #bfdbfe' }}>ℹ️ {cleanNote}</div>}
                  {docsList.length > 0 && (
                    <div style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '5px 8px', fontSize: '6.5pt', marginTop: '3px' }}>
                      <strong style={{ display: 'block', color: '#0f172a', fontWeight: 'bold', marginBottom: '3px', fontSize: '7pt' }}>
                        Berkas Persyaratan (PDF MENTORA - kpta.sisfoftudinus.my.id):
                      </strong>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px' }}>
                        {docsList.map((doc, di) => (
                          <span key={di} style={{ color: '#1e293b', fontWeight: '500', lineHeight: '1.35', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
        <div style={{ borderTop: '1px solid #000000', paddingTop: '4px', fontSize: '7pt', display: 'flex', justifyContent: 'space-between', color: '#475569', fontWeight: '500' }}>
          <span>Dokumen Resmi Alur Ujian Fakultas Teknik UDINUS</span>
          <span>Halaman 1 dari 2</span>
        </div>
      </div>

      {/* HALAMAN 2: DIAGRAM ALUR UJIAN (FLOWCHART) */}
      <div id="pdf-page-2" style={{ backgroundColor: '#ffffff', color: '#0f172a', width: '210mm', height: '297mm', boxSizing: 'border-box', padding: '12px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          {/* KOP SURAT */}
          <div style={{ borderBottom: '3px double #0f172a', paddingBottom: '6px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '0 8px' }}>
              <img src={udinusLogo} alt="Logo UDINUS" style={{ height: '48px', width: 'auto', objectFit: 'contain' }} />
              <div style={{ textAlign: 'center', flex: 1 }}>
                <h2 style={{ fontSize: '11pt', fontWeight: 'bold', margin: 0, padding: 0, color: '#000000', letterSpacing: '0.3px' }}>UNIVERSITAS DIAN NUSWANTORO</h2>
                <h3 style={{ fontSize: '9.5pt', fontWeight: 'bold', margin: '2px 0 0 0', padding: 0, color: '#000000' }}>FAKULTAS TEKNIK</h3>
                <p style={{ fontSize: '7pt', margin: '2px 0', padding: 0, color: '#334155' }}>Jl. Nakula I No. 5-11 Semarang | Telp. (024) 3517261 | Website: ft.dinus.ac.id</p>
                <div style={{ marginTop: '2px', borderTop: '1px solid #000000', paddingTop: '2px', display: 'inline-block' }}>
                  <h4 style={{ fontSize: '8pt', fontWeight: 'bold', textTransform: 'uppercase', margin: 0, color: '#000000' }}>
                    DIAGRAM ALUR LOGIKA UJIAN ({activeProdiObj.name})
                  </h4>
                </div>
              </div>
              <img src={ftLogo} alt="Logo FT UDINUS" style={{ height: '48px', width: 'auto', objectFit: 'contain' }} />
            </div>
          </div>

          <div style={{ textAlign: 'center', fontWeight: '800', fontSize: '8.5pt', marginBottom: '8px', textTransform: 'uppercase', color: '#0f172a', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', padding: '3px 0', borderRadius: '4px' }}>
            HALAMAN 2: DIAGRAM ALUR UJIAN ({activeProdiObj.name})
          </div>

          {/* FLOWCHART PDF */}
          <div style={{ marginTop: '8px' }}>
            <PdfFlowchart cards={cards} prodiList={prodiList} activeProdi={activeProdi} />
          </div>
        </div>

        {/* FOOTER HALAMAN 2 */}
        <div style={{ borderTop: '1px solid #000000', paddingTop: '4px', fontSize: '7pt', display: 'flex', justifyContent: 'space-between', color: '#475569', fontWeight: '500' }}>
          <span>Dokumen Resmi Alur Ujian Fakultas Teknik UDINUS</span>
          <span>Halaman 2 dari 2</span>
        </div>
      </div>
    </div>
  );
}

// ===== EXPORT PDF HELPER FUNCTION =====
export async function triggerPdfExport({ cards, prodiList, activeProdi, setPdfLoading }) {
  if (!cards || cards.length === 0 || !prodiList || prodiList.length === 0) {
    alert('Data belum selesai dimuat. Silakan tunggu beberapa detik dan coba lagi.');
    return;
  }

  setPdfLoading(true);
  const prodiMatch = prodiList.find(p => p.code === activeProdi);
  const page1El = document.getElementById('pdf-page-1');
  const page2El = document.getElementById('pdf-page-2');

  if (!page1El || !page2El) {
    alert('Elemen template PDF tidak ditemukan di halaman.');
    setPdfLoading(false);
    return;
  }

  try {
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');

    // Inline convert images to base64 before rendering to avoid any canvas taint / CORS error
    async function inlineImgs(el) {
      const imgs = el.querySelectorAll('img');
      await Promise.all(Array.from(imgs).map(img => new Promise(resolve => {
        if (!img.src || img.src.startsWith('data:')) { resolve(); return; }
        const canvas = document.createElement('canvas');
        const imgObj = new Image();
        imgObj.crossOrigin = 'anonymous';
        imgObj.onload = () => {
          canvas.width = imgObj.naturalWidth;
          canvas.height = imgObj.naturalHeight;
          canvas.getContext('2d').drawImage(imgObj, 0, 0);
          try { img.src = canvas.toDataURL('image/png'); } catch (e) {}
          resolve();
        };
        imgObj.onerror = () => resolve();
        imgObj.src = img.src;
      })));
    }

    await inlineImgs(page1El);
    await inlineImgs(page2El);

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    // Render Page 1
    const canvas1 = await html2canvas(page1El, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      imageTimeout: 0
    });
    const imgData1 = canvas1.toDataURL('image/jpeg', 0.98);
    pdf.addImage(imgData1, 'JPEG', 0, 0, 210, 297);

    // Render Page 2
    pdf.addPage();
    const canvas2 = await html2canvas(page2El, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      imageTimeout: 0
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
