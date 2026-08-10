'use client';
import { useState, useEffect, useCallback } from 'react';

const ADMIN_PASS = 'Moonlight234//';
const API = '/api/stages';

function escHtml(str) {
  return String(str || '');
}

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

// ===== TOAST MODAL =====
function ToastModal({ toast, onClose }) {
  if (!toast) return null;
  const icons = { success: '✅', error: '❌', warning: '⚠️' };
  const colors = { success: '#059669', error: '#dc2626', warning: '#d97706' };
  return (
    <div className="modal-overlay" style={{ display: 'flex' }} onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 380, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>{icons[toast.type]}</div>
        <h3 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.3rem', marginBottom: 8 }}>{toast.title}</h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 20 }}>{toast.body}</p>
        <button className="btn-action" style={{ background: colors[toast.type], minWidth: 120 }} onClick={onClose}>OK</button>
      </div>
    </div>
  );
}

// ===== CONFIRM MODAL =====
function ConfirmModal({ confirm, onClose }) {
  if (!confirm) return null;
  return (
    <div className="modal-overlay" style={{ display: 'flex' }}>
      <div className="modal-card" style={{ maxWidth: 420, textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>⚠️</div>
        <h3 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.3rem', marginBottom: 8 }}>{confirm.title}</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 20 }}>{confirm.body}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn-action btn-secondary" onClick={onClose}>Batal</button>
          <button className="btn-action" style={{ background: '#dc2626' }} onClick={() => { onClose(); confirm.onConfirm(); }}>Ya, Hapus</button>
        </div>
      </div>
    </div>
  );
}

// ===== ADMIN CARD CRUD MODAL =====
function CardModal({ open, editCard, onClose, onSaved, showToast }) {
  const [form, setForm] = useState({ step_number: 1, title: '', description: '', shape: 'process', docs_json: '[]', note: '', te_term: '', tind_term: '', tb_term: '' });

  useEffect(() => {
    if (editCard) setForm({ step_number: editCard.step_number, title: editCard.title, description: editCard.description, shape: editCard.shape || 'process', docs_json: editCard.docs_json || '[]', note: editCard.note || '', te_term: editCard.te_term || '', tind_term: editCard.tind_term || '', tb_term: editCard.tb_term || '' });
    else setForm({ step_number: 1, title: '', description: '', shape: 'process', docs_json: '[]', note: '', te_term: '', tind_term: '', tb_term: '' });
  }, [editCard, open]);

  if (!open) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    const url = editCard ? `${API}?id=${editCard.id}` : API;
    const method = editCard ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, skip_tind: form.tind_term.includes('Langsung') }) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await onSaved();
      onClose();
      showToast('success', editCard ? 'Card Diperbarui' : 'Card Ditambahkan', `Tahap "${form.title}" berhasil disimpan.`);
    } catch (err) { showToast('error', 'Gagal Menyimpan', err.message); }
  }

  return (
    <div className="modal-overlay" style={{ display: 'flex' }}>
      <div className="modal-card" style={{ maxWidth: 650, width: '100%' }}>
        <div className="modal-header">
          <h3 style={{ fontFamily: "'Outfit',sans-serif" }}>{editCard ? 'Edit Card Tahap' : 'Tambah Card Tahap Baru'}</h3>
          <button className="btn-icon" onClick={onClose}><i className="fa-solid fa-xmark" /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 180px', gap: 12 }}>
            <div className="form-group"><label>No. Urut</label><input type="number" className="form-control" value={form.step_number} onChange={e => setForm(f => ({ ...f, step_number: e.target.value }))} required min="1" /></div>
            <div className="form-group"><label>Judul Tahap</label><input type="text" className="form-control" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required /></div>
            <div className="form-group">
              <label>Simbol ANSI</label>
              <select className="form-control" value={form.shape} onChange={e => setForm(f => ({ ...f, shape: e.target.value }))}>
                <option value="process">Proses (Persegi)</option>
                <option value="decision">Decision (Belah Ketupat)</option>
                <option value="terminal">Terminal (Oval)</option>
                <option value="note">Anotasi / Catatan</option>
              </select>
            </div>
          </div>
          <div className="form-group"><label>Deskripsi</label><textarea className="form-control" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required /></div>
          <div className="form-group"><label>Sub-berkas (JSON)</label><textarea className="form-control" rows={2} value={form.docs_json} onChange={e => setForm(f => ({ ...f, docs_json: e.target.value }))} /></div>
          <div className="form-group"><label>Catatan</label><input type="text" className="form-control" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div className="form-group"><label>Istilah TE</label><input type="text" className="form-control" value={form.te_term} onChange={e => setForm(f => ({ ...f, te_term: e.target.value }))} /></div>
            <div className="form-group"><label>Istilah Tind</label><input type="text" className="form-control" value={form.tind_term} onChange={e => setForm(f => ({ ...f, tind_term: e.target.value }))} /></div>
            <div className="form-group"><label>Istilah TB</label><input type="text" className="form-control" value={form.tb_term} onChange={e => setForm(f => ({ ...f, tb_term: e.target.value }))} /></div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-action btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn-action">Simpan Card</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===== PRODI MODAL =====
function ProdiModal({ open, onClose, onSaved, showToast }) {
  const [form, setForm] = useState({ code: '', name: '', color: '#2563eb' });
  if (!open) return null;
  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const res = await fetch(`${API}?type=prodi`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await onSaved();
      onClose();
      showToast('success', 'Prodi Ditambahkan', `Program Studi "${form.name}" berhasil ditambahkan.`);
    } catch (err) { showToast('error', 'Gagal Tambah Prodi', err.message); }
  }
  return (
    <div className="modal-overlay" style={{ display: 'flex' }}>
      <div className="modal-card" style={{ maxWidth: 450 }}>
        <div className="modal-header">
          <h3 style={{ fontFamily: "'Outfit',sans-serif" }}>Tambah Program Studi Baru</h3>
          <button className="btn-icon" onClick={onClose}><i className="fa-solid fa-xmark" /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Kode Singkat</label><input type="text" className="form-control" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toLowerCase() }))} required placeholder="Contoh: ti" /></div>
          <div className="form-group"><label>Nama Lengkap Prodi</label><input type="text" className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Contoh: Teknik Informatika (TI)" /></div>
          <div className="form-group"><label>Warna Aksen</label><input type="color" className="form-control" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} style={{ height: 42 }} /></div>
          <div className="modal-actions">
            <button type="button" className="btn-action btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn-action">Simpan Prodi</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===== ADMIN TABLE ROW =====
function AdminTableRow({ item, currentProdi, prodiList, onEdit, onDelete, onBypass }) {
  const shapeLabels = { decision: 'Belah Ketupat', terminal: 'Oval Terminal', note: 'Anotasi', process: 'Persegi Process' };
  const shapeBg = { decision: '#fffbeb', terminal: '#f1f5f9', note: '#f0fdf4', process: '#eef2ff' };
  const shapeColor = { decision: '#b45309', terminal: '#0f172a', note: '#15803d', process: '#4338ca' };
  const isSkippedCurrent = currentProdi === 'tind' && item.skip_tind;
  let termVal = '-';
  if (currentProdi === 'te') termVal = item.te_term || '-';
  else if (currentProdi === 'tind') termVal = item.tind_term || '-';
  else if (currentProdi === 'tb') termVal = item.tb_term || '-';

  let docCount = 0;
  try { docCount = JSON.parse(item.docs_json || '[]').length; } catch (e) {}
  const prodiObj = prodiList.find(p => p.code === currentProdi) || { name: currentProdi.toUpperCase() };

  return (
    <tr style={isSkippedCurrent ? { opacity: 0.55, background: '#fffbeb' } : {}}>
      <td><strong>{item.step_number}</strong></td>
      <td><strong>{item.title}</strong></td>
      <td><span className="node-step-tag" style={{ background: shapeBg[item.shape] || '#eef2ff', color: shapeColor[item.shape] || '#0f172a', border: '1px solid currentColor' }}>{shapeLabels[item.shape] || 'Persegi'}</span></td>
      <td><div style={{ maxWidth: 200, fontSize: '0.85rem' }}>{item.description}</div></td>
      <td>{isSkippedCurrent ? <span className="node-step-tag" style={{ background: '#fef3c7', color: '#b45309' }}>Dilewati ({currentProdi.toUpperCase()})</span> : <strong style={{ color: '#2563eb', fontSize: '0.88rem' }}>{termVal}</strong>}</td>
      <td><span className="node-step-tag" style={{ background: '#eef2ff', color: '#4338ca' }}>{docCount} Items</span></td>
      <td><div style={{ maxWidth: 140, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.note || '-'}</div></td>
      <td className="action-cell">
        <button className="btn-icon edit" onClick={() => onEdit(item)} title="Edit"><i className="fa-solid fa-pen-to-square" /></button>
        <button className="btn-icon" onClick={() => onBypass(item)} title="Toggle bypass" style={{ color: isSkippedCurrent ? '#059669' : '#d97706' }}><i className={`fa-solid ${isSkippedCurrent ? 'fa-eye' : 'fa-eye-slash'}`} /></button>
        <button className="btn-icon delete" onClick={() => onDelete(item)} title="Hapus permanen"><i className="fa-solid fa-trash" /></button>
      </td>
    </tr>
  );
}

// ===== ADMIN PAGE =====
export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [passInput, setPassInput] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [authError, setAuthError] = useState(false);

  const [cards, setCards] = useState([]);
  const [prodi, setProdi] = useState([]);
  const [activeProdi, setActiveProdi] = useState('te');

  const [toast, setToast] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [editCard, setEditCard] = useState(null);
  const [prodiModalOpen, setProdiModalOpen] = useState(false);

  const showToast = (type, title, body) => setToast({ type, title, body });

  const fetchAll = useCallback(async () => {
    try {
      const [pr, cr] = await Promise.all([fetch(`${API}?type=prodi`), fetch(API)]);
      if (pr.ok) setProdi(await pr.json());
      if (cr.ok) setCards(await cr.json());
    } catch (err) { showToast('error', 'Gagal Memuat Data', err.message); }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ok = sessionStorage.getItem('admin_authenticated') === 'true';
      if (ok) { setAuthed(true); fetchAll(); }
    }
  }, [fetchAll]);

  function handleLogin(e) {
    e.preventDefault();
    if (passInput === ADMIN_PASS) { sessionStorage.setItem('admin_authenticated', 'true'); setAuthed(true); fetchAll(); setAuthError(false); }
    else { setAuthError(true); setPassInput(''); }
  }

  async function handleDeleteCard(item) {
    setConfirmState({ title: 'Hapus Tahap Permanen?', body: `Tahap "${item.title}" akan dihapus PERMANEN dari semua prodi.`, onConfirm: async () => {
      try {
        const res = await fetch(`${API}?id=${item.id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        await fetchAll(); showToast('success', 'Tahap Dihapus', `"${item.title}" berhasil dihapus.`);
      } catch (err) { showToast('error', 'Gagal Hapus', err.message); }
    }});
  }

  async function handleDeleteProdi(p) {
    setConfirmState({ title: 'Hapus Program Studi?', body: `"${p.name}" akan dihapus permanen.`, onConfirm: async () => {
      try {
        const res = await fetch(`${API}?type=prodi&id=${p.id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        await fetchAll(); showToast('success', 'Prodi Dihapus', `"${p.name}" berhasil dihapus.`);
      } catch (err) { showToast('error', 'Gagal Hapus Prodi', err.message); }
    }});
  }

  async function handleBypass(item) {
    const prodiObj = prodi.find(p => p.code === activeProdi) || { name: activeProdi.toUpperCase() };
    if (activeProdi === 'tind') {
      const newSkip = !item.skip_tind;
      setConfirmState({ title: newSkip ? `Sembunyikan untuk ${prodiObj.name}?` : `Tampilkan untuk ${prodiObj.name}?`, body: `Tahap "${item.title}" akan ${newSkip ? 'dilewati' : 'diaktifkan kembali'} untuk ${prodiObj.name}.`, onConfirm: async () => {
        try {
          const res = await fetch(`${API}?id=${item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...item, skip_tind: newSkip, tind_term: newSkip ? '- (Langsung Sidang)' : 'Project Terpadu 2 (Sidang)' }) });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          await fetchAll(); showToast('success', 'Diperbarui', `Tahap berhasil ${newSkip ? 'dilewati' : 'diaktifkan'} untuk ${prodiObj.name}.`);
        } catch (err) { showToast('error', 'Gagal', err.message); }
      }});
    } else {
      showToast('warning', 'Tidak Tersedia', `Gunakan tombol Edit untuk mengosongkan istilah untuk prodi ${prodiObj.name}.`);
    }
  }

  async function handleReset() {
    setConfirmState({ title: 'Reset ke Default?', body: 'Seluruh Card Tahap akan dikembalikan ke susunan default awal.', onConfirm: async () => {
      try {
        const res = await fetch(`${API}?action=reset`, { method: 'POST' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        await fetchAll(); showToast('success', 'Reset Berhasil', 'Semua card dikembalikan ke default.');
      } catch (err) { showToast('error', 'Gagal Reset', err.message); }
    }});
  }

  if (!authed) {
    return (
      <div className="modal-overlay" style={{ display: 'flex' }}>
        <div className="modal-card" style={{ maxWidth: 400, textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 12 }}>
            <img src="/img/image.png" alt="Logo UDINUS" style={{ height: 54 }} />
            <img src="/img/image-ft.png" alt="Logo FT" style={{ height: 54 }} />
          </div>
          <h3 style={{ fontFamily: "'Outfit',sans-serif", fontSize: '1.4rem', marginBottom: 8 }}>Akses Admin UDINUS</h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 20 }}>Masukkan kata sandi untuk mengelola Card Tahap Alur.</p>
          <form onSubmit={handleLogin}>
            <div className="form-group" style={{ textAlign: 'left' }}>
              <label>Kata Sandi Admin</label>
              <div style={{ position: 'relative' }}>
                <input type={showPass ? 'text' : 'password'} className="form-control" value={passInput} onChange={e => setPassInput(e.target.value)} placeholder="Masukkan kata sandi" required autoFocus style={{ paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <i className={`fa-solid ${showPass ? 'fa-eye-slash' : 'fa-eye'}`} />
                </button>
              </div>
              {authError && <div style={{ color: '#f87171', fontSize: '0.82rem', marginTop: 6 }}>Kata sandi salah! Coba lagi.</div>}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <a href="/" className="btn-action btn-secondary" style={{ textDecoration: 'none', flex: 1, textAlign: 'center', justifyContent: 'center' }}>Ke Halaman Publik</a>
              <button type="submit" className="btn-action" style={{ flex: 1, justifyContent: 'center' }}>Masuk</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  const activeProdiObj = prodi.find(p => p.code === activeProdi) || { name: activeProdi.toUpperCase() };

  return (
    <>
      <ToastModal toast={toast} onClose={() => setToast(null)} />
      <ConfirmModal confirm={confirmState} onClose={() => setConfirmState(null)} />
      <CardModal open={cardModalOpen} editCard={editCard} onClose={() => { setCardModalOpen(false); setEditCard(null); }} onSaved={fetchAll} showToast={showToast} />
      <ProdiModal open={prodiModalOpen} onClose={() => setProdiModalOpen(false)} onSaved={fetchAll} showToast={showToast} />

      <div className="container" id="admin-content">
        <header>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, marginBottom: 16, flexWrap: 'wrap' }}>
            <img src="/img/image.png" alt="Logo UDINUS" style={{ height: 60 }} />
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div className="badge-top" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', marginBottom: 4 }}>
                <i className="fa-solid fa-user-shield" /> UDINUS — Panel Kontrol Admin
              </div>
              <h1 style={{ fontSize: '2.1rem', marginBottom: 0 }}>Manajemen Card Tahap Alur &amp; Prodi</h1>
            </div>
            <img src="/img/image-ft.png" alt="Logo FT" style={{ height: 60 }} />
          </div>
          <p className="subtitle">Tambah, edit, atau hapus Card Tahap Alur &amp; Program Studi.</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 30 }}>
            <a href="/" className="tab-btn" style={{ textDecoration: 'none' }}><i className="fa-solid fa-eye" /> Lihat Halaman Publik</a>
            <button className="tab-btn" style={{ color: '#f87171' }} onClick={() => { sessionStorage.removeItem('admin_authenticated'); setAuthed(false); }}><i className="fa-solid fa-right-from-bracket" /> Keluar</button>
          </div>
        </header>

        {/* Daftar Prodi */}
        <div className="flow-container" style={{ marginBottom: 30 }}>
          <div className="section-header">
            <div className="section-title"><i className="fa-solid fa-graduation-cap" /> Daftar Program Studi (Prodi)</div>
            <button className="btn-action" onClick={() => setProdiModalOpen(true)}><i className="fa-solid fa-plus" /> Tambah Prodi Baru</button>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {prodi.map(p => (
              <div key={p.id} className="admin-doc-card" style={{ borderColor: p.color || '#e2e8f0', background: '#ffffff' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.color || '#0f172a', flexShrink: 0 }} />
                <div><strong>{p.name}</strong><span>Kode: {p.code}</span></div>
                {!['te','tind','tb'].includes(p.code) && (
                  <button className="btn-icon delete" onClick={() => handleDeleteProdi(p)} style={{ marginLeft: 8, width: 24, height: 24, fontSize: '0.7rem' }}><i className="fa-solid fa-trash" /></button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sticky Prodi Tabs */}
        <div className="sticky-prodi-wrapper">
          <div className="prodi-tabs" id="admin-prodi-tabs" style={{ justifyContent: 'flex-start' }}>
            {prodi.map(p => (
              <button key={p.code} className={`tab-btn ${activeProdi === p.code ? 'active' : ''}`} style={{ fontSize: '0.88rem', padding: '8px 16px' }} onClick={() => setActiveProdi(p.code)}>
                <span style={{ background: p.color || '#0f172a', width: 8, height: 8, borderRadius: '50%', flexShrink: 0 }} />
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Table Management */}
        <div className="table-section" style={{ marginTop: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div className="section-title"><i className="fa-solid fa-layer-group" /> Daftar Card Tahap Alur</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-action btn-secondary" onClick={handleReset}><i className="fa-solid fa-rotate-left" /> Reset Default</button>
              <button className="btn-action" onClick={() => { setEditCard(null); setCardModalOpen(true); }}><i className="fa-solid fa-plus" /> Tambah Card</button>
            </div>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>No</th><th>Judul Tahap</th><th>Simbol ANSI</th><th>Deskripsi</th>
                  <th>Istilah ({activeProdiObj.name})</th><th>Sub-berkas</th><th>Catatan</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {cards.map(item => (
                  <AdminTableRow key={item.id} item={item} currentProdi={activeProdi} prodiList={prodi}
                    onEdit={card => { setEditCard(card); setCardModalOpen(true); }}
                    onDelete={handleDeleteCard}
                    onBypass={handleBypass}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <footer><p>&copy; 2026 Universitas Dian Nuswantoro (UDINUS) — Panel Kontrol Manajemen</p></footer>
      </div>
    </>
  );
}
