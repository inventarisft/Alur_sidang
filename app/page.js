'use client';
import { useState, useEffect, useRef } from 'react';

const API = '/api/stages';
const ADMIN_PASS_KEY = 'admin_authenticated';

function escHtml(str) { return String(str || ''); }

function getProdiTerm(card, prodiCode) {
  if (prodiCode === 'te') return card.te_term || '';
  if (prodiCode === 'tind') return card.tind_term || '';
  if (prodiCode === 'tb') return card.tb_term || '';
  return card.te_term || '';
}

function isSkipped(card, prodiCode) {
  if (card.skip_tind && prodiCode === 'tind') return true;
  if ((card.title || '').toLowerCase().includes('informatika') && prodiCode !== 'ti') return true;
  return false;
}

// ===== ANSI FLOWCHART =====
function AnsiFlowchart({ cards, prodiList, activeProdi }) {
  const prodiObj = prodiList.find(p => p.code === activeProdi) || { name: activeProdi.toUpperCase() };
  const isNote = c => c.shape === 'note';
  const noteCards = cards.filter(c => isNote(c) && !isSkipped(c, activeProdi));
  const mainCards = cards.filter(c => !isSkipped(c, activeProdi) && !isNote(c));

  const noteMap = {};
  noteCards.forEach(n => {
    const key = n.step_number;
    if (!noteMap[key]) noteMap[key] = [];
    noteMap[key].push(n);
  });

  return (
    <div className="ansi-flowchart-wrapper">
      <div className="fc-header">
        <i className="fa-solid fa-diagram-project" style={{ color: '#2563eb' }} /> Diagram Alur: {prodiObj.name}
      </div>
      {mainCards.map((c, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === mainCards.length - 1;
        const isTerminal = c.shape === 'terminal' || isFirst || isLast;
        const isDecision = c.shape === 'decision';
        const prodiTerm = getProdiTerm(c, activeProdi);
        const annotations = (noteMap[c.step_number] || []);
        const prevCard = idx > 0 ? mainCards[idx - 1] : null;

        const labelJsx = (
          <>{escHtml(c.title)}{prodiTerm ? <span className="fc-term-label"> ({escHtml(prodiTerm)})</span> : null}</>
        );

        const annotationSlot = annotations.length > 0 ? (
          <div className="fc-annotation-slot">
            {annotations.map((n, ni) => (
              <div key={ni} className="fc-annotation">
                <i className="fa-solid fa-file-lines" /><span><strong>{escHtml(n.title)}</strong><br />{escHtml(n.note || n.description)}</span>
              </div>
            ))}
          </div>
        ) : null;

        return (
          <div key={c.id} style={{ display: 'contents' }}>
            <div className="fc-row-with-note">
              {isTerminal ? (
                <div className={`fc-node-terminal ${isFirst ? 'fc-start' : 'fc-end'}`}>
                  <i className={`fa-solid ${isFirst ? 'fa-circle-play' : 'fa-flag-checkered'}`} /> {labelJsx}
                </div>
              ) : isDecision ? (
                <div className="fc-decision-wrapper">
                  <div className="fc-diamond-outer"><div className="fc-diamond-inner">{labelJsx}</div></div>
                  <div className="fc-branch-row">
                    <div className="fc-branch fc-branch-no">
                      <span className="fc-branch-label">TIDAK / Gagal</span>
                      <div className="fc-loop-back">
                        <i className="fa-solid fa-arrow-up" />
                        <div className="fc-loop-back-label">Kembali ke:<br />{prevCard ? escHtml(prevCard.title) : 'Proses Sebelumnya'}</div>
                      </div>
                    </div>
                    <div className="fc-branch-arrow-down">
                      <span className="fc-branch-label">YA / Lulus</span>
                      <i className="fa-solid fa-arrow-down" style={{ fontSize: '1.3rem' }} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="fc-node-process">
                  <div className="fc-node-title">{labelJsx}</div>
                  {c.description && <div className="fc-node-desc">{escHtml(c.description)}</div>}
                </div>
              )}
              {annotationSlot}
            </div>
            {!isLast && <div className="fc-arrow-down"><i className="fa-solid fa-arrow-down" /></div>}
          </div>
        );
      })}
    </div>
  );
}

// ===== TIMELINE CARDS =====
function TimelineCards({ cards, prodiList, activeProdi }) {
  const validCards = cards.filter(c => !isSkipped(c, activeProdi));
  return (
    <div className="timeline">
      {validCards.map((card, idx) => {
        let docsList = [];
        try { docsList = JSON.parse(card.docs_json || '[]'); } catch (e) {}
        const prodiPills = prodiList.map(p => {
          let term = '';
          if (p.code === 'te') term = card.te_term;
          else if (p.code === 'tind') term = card.tind_term;
          else if (p.code === 'tb') term = card.tb_term;
          else term = card.te_term || card.title;
          if (!term) return null;
          return (
            <span key={p.code} className={`term-pill ${activeProdi !== p.code ? 'dimmed' : ''}`} style={{ borderColor: p.color || '#cbd5e1', color: p.color || '#0f172a', fontWeight: 700 }}>
              <i className={`fa-solid ${p.icon || 'fa-graduation-cap'}`} /> {p.code.toUpperCase()}: {escHtml(term)}
            </span>
          );
        }).filter(Boolean);

        return (
          <div key={card.id}>
            <div className={`timeline-node ${idx === 0 ? 'highlight-node' : ''}`}>
              <div className="node-header">
                <span className="node-title">{escHtml(card.title)}</span>
                <span className="node-step-tag">Tahap {card.step_number}</span>
              </div>
              <div className="node-desc">{escHtml(card.description)}</div>
              {docsList.length > 0 && (
                <div className="admin-docs-grid">
                  {docsList.map((doc, di) => doc.link ? (
                    <a key={di} href={escHtml(doc.link)} target="_blank" rel="noopener noreferrer" className="admin-doc-card highlight-link-card" style={{ textDecoration: 'none', borderColor: '#c7d2fe', background: '#eef2ff' }}>
                      <i className={`fa-solid ${doc.icon || 'fa-file-lines'}`} style={{ color: '#4338ca' }} />
                      <div><strong style={{ color: '#4338ca' }}>{escHtml(doc.title)} <i className="fa-solid fa-link" style={{ fontSize: '0.75rem' }} /></strong><span style={{ color: '#3730a3' }}>{escHtml(doc.sub)}</span></div>
                    </a>
                  ) : (
                    <div key={di} className="admin-doc-card">
                      <i className={`fa-solid ${doc.icon || 'fa-file-lines'}`} />
                      <div><strong>{escHtml(doc.title)}</strong><span>{escHtml(doc.sub)}</span></div>
                    </div>
                  ))}
                </div>
              )}
              {card.note && <div className="skpi-notice"><i className="fa-solid fa-circle-info" /> {escHtml(card.note)}</div>}
              {prodiPills.length > 0 && <div className="prodi-terms">{prodiPills}</div>}
            </div>
            {idx < validCards.length - 1 && <div className="connector"><i className="fa-solid fa-arrow-down" /></div>}
          </div>
        );
      })}
    </div>
  );
}

// ===== PEMETAAN TABLE =====
function PemetaanTable({ cards, prodiList, activeProdi }) {
  return (
    <div className="table-section no-print">
      <div className="section-title"><i className="fa-solid fa-table-columns" /> Pemetaan Istilah Berdasarkan Program Studi</div>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Tahapan Ujian</th>
              {prodiList.map(p => (
                <th key={p.code} className={activeProdi === p.code ? 'highlight-col' : ''}>
                  <i className={`fa-solid ${p.icon || 'fa-graduation-cap'}`} style={{ color: p.color || '#2563eb' }} /> {p.code.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cards.map(item => (
              <tr key={item.id}>
                <td><strong>{escHtml(item.title)}</strong></td>
                {prodiList.map(p => {
                  let term = '-';
                  if (p.code === 'te') term = item.te_term || '-';
                  else if (p.code === 'tind') term = item.tind_term || '-';
                  else if (p.code === 'tb') term = item.tb_term || '-';
                  else term = item.te_term || item.title;
                  return <td key={p.code} className={activeProdi === p.code ? 'highlight-col' : ''}>{escHtml(term)}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ===== PRINT SECTIONS =====
function PrintInfoSection({ cards, prodiList, activeProdi }) {
  const prodiObj = prodiList.find(p => p.code === activeProdi) || { name: activeProdi.toUpperCase() };
  const validCards = cards.filter(c => !isSkipped(c, activeProdi) && c.shape !== 'note');
  return (
    <div className="print-only-section print-page-2">
      <div style={{ fontSize: '11pt', fontWeight: 800, textAlign: 'center', marginBottom: 10, textDecoration: 'underline' }}>RINGKASAN INFORMASI TAHAPAN UJIAN</div>
      {validCards.map(card => {
        const prodiTerm = getProdiTerm(card, activeProdi);
        const shapeText = card.shape === 'terminal' ? 'Terminal' : card.shape === 'decision' ? 'Evaluasi / Keputusan' : 'Proses';
        return (
          <div key={card.id} style={{ border: '1px solid #e2e8f0', borderLeft: '4px solid #0f172a', borderRadius: 4, padding: '10px 14px', marginBottom: 8, pageBreakInside: 'avoid' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <strong style={{ fontSize: '10pt', color: '#0f172a' }}>{escHtml(card.title)}</strong>
              <span style={{ fontSize: '8pt', background: '#e2e8f0', padding: '2px 8px', borderRadius: 4, fontWeight: 700, color: '#334155' }}>Tahap {card.step_number} — {shapeText}</span>
            </div>
            <div style={{ fontSize: '9pt', color: '#334155', marginBottom: 4 }}>{escHtml(card.description)}</div>
            {prodiTerm && <div style={{ fontSize: '8pt', color: '#1d4ed8', fontWeight: 700 }}>{prodiObj.name}: {escHtml(prodiTerm)}</div>}
            {card.note && <div style={{ fontSize: '8pt', color: '#047857', fontStyle: 'italic', marginTop: 3 }}>ℹ️ {escHtml(card.note)}</div>}
          </div>
        );
      })}
    </div>
  );
}

function PrintParafSection({ cards }) {
  const firstCard = cards.find(c => c.step_number === 1) || cards[0];
  let adminDocs = [];
  try { adminDocs = JSON.parse(firstCard?.docs_json || '[]'); } catch (e) {}
  return (
    <div className="print-only-section">
      <div style={{ fontSize: '11pt', fontWeight: 800, textAlign: 'center', marginBottom: 12, textDecoration: 'underline' }}>LEMBAR KONTROL KELENGKAPAN ADMINISTRASI &amp; PARAF VERIFIKASI</div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ width: 40, textAlign: 'center' }}>No</th>
            <th>Berkas Persyaratan Administrasi</th>
            <th>Keterangan / Sumber</th>
            <th style={{ width: 120, textAlign: 'center' }}>Status</th>
            <th style={{ width: 160, textAlign: 'center' }}>Paraf / TTD Verifikator</th>
          </tr>
        </thead>
        <tbody>
          {adminDocs.map((doc, idx) => (
            <tr key={idx}>
              <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{idx + 1}</td>
              <td><strong style={{ color: '#0f172a', fontSize: '0.92rem' }}>{escHtml(doc.title)}</strong></td>
              <td><span style={{ fontSize: '0.85rem', color: '#475569' }}>{escHtml(doc.sub)}</span></td>
              <td style={{ textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8' }}>[ Lengkap ]</td>
              <td style={{ height: 42, textAlign: 'center', verticalAlign: 'bottom', fontSize: '0.75rem', color: '#94a3b8' }}>[ Paraf / Ttd ]</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ===== MAIN PUBLIC PAGE =====
export default function HomePage() {
  const [cards, setCards] = useState([]);
  const [prodiList, setProdiList] = useState([]);
  const [activeProdi, setActiveProdi] = useState('te');

  useEffect(() => {
    async function load() {
      const [pr, cr] = await Promise.all([fetch(`${API}?type=prodi`), fetch(API)]);
      const prodiData = pr.ok ? await pr.json() : [];
      const cardData = cr.ok ? await cr.json() : [];
      setProdiList(prodiData);
      setCards(cardData);
      if (prodiData.length > 0) setActiveProdi(prodiData[0].code);
    }
    load();

    // Ctrl+Shift+A shortcut ke admin
    const handler = e => { if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') window.location.href = '/admin'; };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  function handlePdfExport() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const prodiMatch = prodiList.find(p => p.code === activeProdi);
    document.getElementById('print-timestamp-info').textContent = `Dicetak pada: ${dateStr} pukul ${timeStr} WIB`;
    document.getElementById('print-prodi-info').textContent = `Program Studi: ${prodiMatch ? prodiMatch.name : activeProdi.toUpperCase()}`;
    window.print();
  }

  return (
    <>
      {/* Kop Surat PDF */}
      <div className="print-header">
        <div className="print-kop-wrapper">
          <img src="/img/image.png" alt="Logo UDINUS" className="print-logo-left" />
          <div className="print-kop-text">
            <h2>UNIVERSITAS DIAN NUSWANTORO</h2>
            <h3>FAKULTAS TEKNIK</h3>
            <p>Jl. Nakula I No. 5-11 Semarang | Telp. (024) 3517261 | Website: ft.dinus.ac.id</p>
            <h4>LEMBAR KONTROL KELENGKAPAN ADMINISTRASI &amp; PARAF VERIFIKASI</h4>
          </div>
          <img src="/img/image-ft.png" alt="Logo FT UDINUS" className="print-logo-right" />
        </div>
      </div>

      <div className="container">
        <header>
          <div className="header-logo-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
            <img src="/img/image.png" alt="Logo UDINUS" style={{ height: 76, width: 'auto', filter: 'drop-shadow(0 4px 14px rgba(99,102,241,0.35))' }} />
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div className="badge-top" style={{ marginBottom: 6 }}><i className="fa-solid fa-graduation-cap" /> UDINUS — Fakultas Teknik</div>
              <h1 style={{ fontSize: '2.2rem', marginBottom: 0 }}>Alur Pendaftaran Ujian CD / PT</h1>
            </div>
            <img src="/img/image-ft.png" alt="Logo FT UDINUS" style={{ height: 76, width: 'auto', filter: 'drop-shadow(0 4px 14px rgba(59,130,246,0.35))' }} />
          </div>
          <p className="subtitle">Panduan alur pendaftaran dan pemetaan istilah ujian Capstone Design (CD) / Project Terpadu (PT) untuk prodi FT Udinus.</p>
        </header>

        {/* Sticky Tab Bar */}
        <div className="sticky-prodi-wrapper">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }} className="tabs-bar-flex">
            <div className="prodi-tabs">
              {prodiList.map(p => {
                const iconClass = p.icon || (p.code === 'te' ? 'fa-bolt' : p.code === 'tind' ? 'fa-industry' : p.code === 'tb' ? 'fa-heart-pulse' : 'fa-graduation-cap');
                return (
                  <button key={p.code} className={`tab-btn ${activeProdi === p.code ? 'active' : ''}`} title={p.name} onClick={() => setActiveProdi(p.code)}>
                    <i className={`fa-solid ${iconClass}`} style={{ color: activeProdi === p.code ? '#ffffff' : (p.color || '#0f172a') }} />
                    <span className="tab-text">{p.name}</span>
                  </button>
                );
              })}
            </div>
            <button className="btn-action no-print" onClick={handlePdfExport} title="Unduh PDF" style={{ padding: '10px 20px', background: '#059669', fontWeight: 700 }}>
              <i className="fa-solid fa-file-pdf" /> <span className="btn-text">Unduh / Cetak PDF</span>
            </button>
          </div>
        </div>

        {/* Timeline Card (web only) */}
        <div className="flow-container no-print">
          <div className="section-header">
            <div className="section-title"><i className="fa-solid fa-layer-group" /> Tahapan Alur Pendaftaran Ujian</div>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>Pilih prodi untuk melihat istilah spesifik</span>
          </div>
          <TimelineCards cards={cards} prodiList={prodiList} activeProdi={activeProdi} />
        </div>

        {/* ANSI Flowchart (web + PDF Halaman 1) */}
        <div className="flow-container print-page-1" style={{ marginTop: 40 }}>
          <div className="section-header">
            <div className="section-title"><i className="fa-solid fa-diagram-project" /> Diagram Flowchart Teknik (ANSI Standard)</div>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }} className="no-print">Skema alur logika &amp; percabangan prodi</span>
          </div>
          <AnsiFlowchart cards={cards} prodiList={prodiList} activeProdi={activeProdi} />
        </div>

        {/* Pemetaan Table (web only) */}
        <PemetaanTable cards={cards} prodiList={prodiList} activeProdi={activeProdi} />

        {/* PDF: Halaman 2 — Ringkasan Informatif */}
        <PrintInfoSection cards={cards} prodiList={prodiList} activeProdi={activeProdi} />

        {/* PDF: Halaman 3 — Form Paraf */}
        <PrintParafSection cards={cards} />

        {/* Print Footer */}
        <div className="print-footer">
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', borderTop: '1px solid #000', paddingTop: 6 }}>
            <span id="print-timestamp-info">Dicetak pada: -</span>
            <span id="print-prodi-info">Program Studi: -</span>
            <span>Dokumen Resmi Fakultas Teknik UDINUS</span>
          </div>
        </div>

        <footer className="no-print">
          <p>&copy; 2026 Universitas Dian Nuswantoro (UDINUS) — Fakultas Teknik</p>
        </footer>
      </div>
    </>
  );
}
