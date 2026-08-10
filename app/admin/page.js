'use client';
import { useState, useEffect, useCallback } from 'react';

const ADMIN_PASS = 'Moonlight234//';
const API = '/api/stages';

// ===== TOAST MODAL =====
function ToastModal({ toast, onClose }) {
  if (!toast) return null;
  const icons = { success: '✅', error: '❌', warning: '⚠️' };
  const btnBg = { success: 'bg-emerald-600 hover:bg-emerald-700', error: 'bg-red-600 hover:bg-red-700', warning: 'bg-amber-600 hover:bg-amber-700' };
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-xl border border-slate-100" onClick={e => e.stopPropagation()}>
        <div className="text-4xl mb-3">{icons[toast.type]}</div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">{toast.title}</h3>
        <p className="text-xs text-slate-600 mb-5">{toast.body}</p>
        <button className={`px-6 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-md ${btnBg[toast.type] || 'bg-slate-900'}`} onClick={onClose}>OK</button>
      </div>
    </div>
  );
}

// ===== CONFIRM MODAL =====
function ConfirmModal({ confirm, onClose }) {
  if (!confirm) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center shadow-xl border border-slate-100">
        <div className="text-4xl mb-3">⚠️</div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">{confirm.title}</h3>
        <p className="text-xs text-slate-600 mb-5">{confirm.body}</p>
        <div className="flex gap-3 justify-center">
          <button className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all" onClick={onClose}>Batal</button>
          <button className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md transition-all" onClick={() => { onClose(); confirm.onConfirm(); }}>Ya, Hapus</button>
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">{editCard ? 'Edit Card Tahap' : 'Tambah Card Tahap Baru'}</h3>
          <button className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors" onClick={onClose}><i className="fa-solid fa-xmark" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div><label className="block text-xs font-bold text-slate-700 mb-1">No. Urut</label><input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none" value={form.step_number} onChange={e => setForm(f => ({ ...f, step_number: e.target.value }))} required min="1" /></div>
            <div><label className="block text-xs font-bold text-slate-700 mb-1">Judul Tahap</label><input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required /></div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Simbol ANSI</label>
              <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none" value={form.shape} onChange={e => setForm(f => ({ ...f, shape: e.target.value }))}>
                <option value="process">Proses (Persegi)</option>
                <option value="decision">Decision (Belah Ketupat)</option>
                <option value="terminal">Terminal (Oval)</option>
                <option value="note">Anotasi / Catatan</option>
              </select>
            </div>
          </div>
          <div><label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi</label><textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required /></div>
          <div><label className="block text-xs font-bold text-slate-700 mb-1">Sub-berkas (JSON)</label><textarea className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none" rows={2} value={form.docs_json} onChange={e => setForm(f => ({ ...f, docs_json: e.target.value }))} /></div>
          <div><label className="block text-xs font-bold text-slate-700 mb-1">Catatan</label><input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} /></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div><label className="block text-xs font-bold text-slate-700 mb-1">Istilah TE</label><input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none" value={form.te_term} onChange={e => setForm(f => ({ ...f, te_term: e.target.value }))} /></div>
            <div><label className="block text-xs font-bold text-slate-700 mb-1">Istilah Tind</label><input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none" value={form.tind_term} onChange={e => setForm(f => ({ ...f, tind_term: e.target.value }))} /></div>
            <div><label className="block text-xs font-bold text-slate-700 mb-1">Istilah TB</label><input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none" value={form.tb_term} onChange={e => setForm(f => ({ ...f, tb_term: e.target.value }))} /></div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all" onClick={onClose}>Batal</button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all">Simpan Card</button>
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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100">
        <div className="flex justify-between items-center pb-4 mb-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Tambah Program Studi Baru</h3>
          <button className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors" onClick={onClose}><i className="fa-solid fa-xmark" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-xs font-bold text-slate-700 mb-1">Kode Singkat</label><input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toLowerCase() }))} required placeholder="Contoh: ti" /></div>
          <div><label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap Prodi</label><input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Contoh: Teknik Informatika (TI)" /></div>
          <div><label className="block text-xs font-bold text-slate-700 mb-1">Warna Aksen</label><input type="color" className="w-full bg-slate-50 border border-slate-200 rounded-xl h-10 p-1 cursor-pointer" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} /></div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all" onClick={onClose}>Batal</button>
            <button type="submit" className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all">Simpan Prodi</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===== ADMIN TABLE ROW =====
function AdminTableRow({ item, currentProdi, prodiList, onEdit, onDelete, onBypass }) {
  const shapeLabels = { decision: 'Belah Ketupat', terminal: 'Oval Terminal', note: 'Anotasi', process: 'Persegi Process' };
  const shapeBadgeClass = {
    decision: 'bg-amber-50 text-amber-800 border-amber-300',
    terminal: 'bg-slate-100 text-slate-900 border-slate-300',
    note: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    process: 'bg-indigo-50 text-indigo-800 border-indigo-300'
  };

  const isSkippedCurrent = currentProdi === 'tind' && item.skip_tind;
  let termVal = '-';
  if (currentProdi === 'te') termVal = item.te_term || '-';
  else if (currentProdi === 'tind') termVal = item.tind_term || '-';
  else if (currentProdi === 'tb') termVal = item.tb_term || '-';

  let docCount = 0;
  try { docCount = JSON.parse(item.docs_json || '[]').length; } catch (e) {}
  const prodiObj = prodiList.find(p => p.code === currentProdi) || { name: currentProdi.toUpperCase() };

  return (
    <tr className={`hover:bg-slate-50 transition-colors ${isSkippedCurrent ? 'opacity-50 bg-amber-50/40' : ''}`}>
      <td className="p-3.5 font-bold text-slate-900">{item.step_number}</td>
      <td className="p-3.5 font-bold text-slate-900">{item.title}</td>
      <td className="p-3.5">
        <span className={`inline-block px-2.5 py-0.5 text-[11px] font-bold rounded-md border ${shapeBadgeClass[item.shape] || 'bg-slate-100 text-slate-800 border-slate-200'}`}>
          {shapeLabels[item.shape] || 'Persegi'}
        </span>
      </td>
      <td className="p-3.5"><div className="max-w-[200px] text-xs text-slate-600">{item.description}</div></td>
      <td className="p-3.5">
        {isSkippedCurrent ? (
          <span className="inline-block px-2 py-0.5 text-[11px] font-bold rounded-md bg-amber-100 text-amber-900 border border-amber-200">Dilewati ({currentProdi.toUpperCase()})</span>
        ) : (
          <strong className="text-blue-700 text-xs font-bold">{termVal}</strong>
        )}
      </td>
      <td className="p-3.5"><span className="inline-block px-2 py-0.5 text-[11px] font-bold rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">{docCount} Items</span></td>
      <td className="p-3.5"><div className="max-w-[140px] text-xs text-slate-500">{item.note || '-'}</div></td>
      <td className="p-3.5 text-right">
        <div className="flex gap-1.5 justify-end">
          <button className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-900 hover:text-white text-slate-700 text-xs flex items-center justify-center transition-all shadow-sm" onClick={() => onEdit(item)} title="Edit"><i className="fa-solid fa-pen-to-square" /></button>
          <button className={`w-7 h-7 rounded-lg border border-slate-200 bg-white text-xs flex items-center justify-center transition-all shadow-sm ${isSkippedCurrent ? 'text-emerald-600 hover:bg-emerald-50' : 'text-amber-600 hover:bg-amber-50'}`} onClick={() => onBypass(item)} title="Toggle bypass"><i className={`fa-solid ${isSkippedCurrent ? 'fa-eye' : 'fa-eye-slash'}`} /></button>
          <button className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-red-600 hover:text-white text-red-600 text-xs flex items-center justify-center transition-all shadow-sm" onClick={() => onDelete(item)} title="Hapus"><i className="fa-solid fa-trash" /></button>
        </div>
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
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl border border-slate-100">
          <div className="flex justify-center gap-4 mb-4">
            <img src="/img/image.png" alt="Logo UDINUS" className="h-14 w-auto" />
            <img src="/img/image-ft.png" alt="Logo FT" className="h-14 w-auto" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 mb-1">Akses Admin UDINUS</h3>
          <p className="text-xs text-slate-500 mb-6">Masukkan kata sandi untuk mengelola Card Tahap Alur.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="text-left">
              <label className="block text-xs font-bold text-slate-700 mb-1">Kata Sandi Admin</label>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none pr-10" value={passInput} onChange={e => setPassInput(e.target.value)} placeholder="Masukkan kata sandi" required autoFocus />
                <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <i className={`fa-solid ${showPass ? 'fa-eye-slash' : 'fa-eye'}`} />
                </button>
              </div>
              {authError && <div className="text-red-500 text-[11px] mt-1.5 font-bold">Kata sandi salah! Coba lagi.</div>}
            </div>
            <div className="flex gap-2 pt-2">
              <a href="/" className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all text-center">Ke Halaman Publik</a>
              <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all">Masuk</button>
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

      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
            <img src="/img/image.png" alt="Logo UDINUS" className="h-14 w-auto" />
            <div className="text-center flex-1 min-w-[240px]">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200 mb-1">
                <i className="fa-solid fa-user-shield" /> UDINUS — Panel Kontrol Admin
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Manajemen Card Tahap Alur &amp; Prodi</h1>
            </div>
            <img src="/img/image-ft.png" alt="Logo FT" className="h-14 w-auto" />
          </div>
          <p className="text-center text-xs text-slate-500">Tambah, edit, atau hapus Card Tahap Alur &amp; Program Studi.</p>
          <div className="flex justify-center gap-3 mt-4">
            <a href="/" className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all"><i className="fa-solid fa-eye mr-1.5" /> Lihat Halaman Publik</a>
            <button className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-all" onClick={() => { sessionStorage.removeItem('admin_authenticated'); setAuthed(false); }}><i className="fa-solid fa-right-from-bracket mr-1.5" /> Keluar</button>
          </div>
        </header>

        {/* Daftar Prodi */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <i className="fa-solid fa-graduation-cap text-blue-600" /> Daftar Program Studi (Prodi)
            </h2>
            <button className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm" onClick={() => setProdiModalOpen(true)}>
              <i className="fa-solid fa-plus" /> Tambah Prodi Baru
            </button>
          </div>
          <div className="flex gap-3 flex-wrap">
            {prodi.map(p => (
              <div key={p.id} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color || '#0f172a' }} />
                <div><strong className="block text-slate-900">{p.name}</strong><span className="text-slate-500 text-[10px]">Kode: {p.code}</span></div>
                {!['te','tind','tb'].includes(p.code) && (
                  <button className="w-5 h-5 rounded hover:bg-red-100 text-red-600 flex items-center justify-center text-[10px] ml-1 transition-colors" onClick={() => handleDeleteProdi(p)}><i className="fa-solid fa-trash" /></button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sticky Prodi Tabs */}
        <div className="sticky top-4 z-30 mb-6">
          <div className="backdrop-blur-md bg-white/60 border border-white/60 rounded-2xl p-2 shadow-lg shadow-slate-900/5 flex gap-1.5 overflow-x-auto">
            {prodi.map(p => {
              const isActive = activeProdi === p.code;
              return (
                <button key={p.code} onClick={() => setActiveProdi(p.code)} className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all shrink-0 ${isActive ? 'bg-slate-900 text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color || '#0f172a' }} />
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Table Management */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <i className="fa-solid fa-layer-group text-blue-600" /> Daftar Card Tahap Alur
            </h2>
            <div className="flex gap-2">
              <button className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5" onClick={handleReset}><i className="fa-solid fa-rotate-left" /> Reset Default</button>
              <button className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm" onClick={() => { setEditCard(null); setCardModalOpen(true); }}><i className="fa-solid fa-plus" /> Tambah Card</button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-800">
                  <th className="p-3.5">No</th><th className="p-3.5">Judul Tahap</th><th className="p-3.5">Simbol ANSI</th><th className="p-3.5">Deskripsi</th>
                  <th className="p-3.5">Istilah ({activeProdiObj.name})</th><th className="p-3.5">Sub-berkas</th><th className="p-3.5">Catatan</th>
                  <th className="p-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
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

        <footer className="mt-8 text-center text-xs text-slate-500 border-t border-slate-200 pt-4">
          <p>&copy; 2026 Universitas Dian Nuswantoro (UDINUS) — Panel Kontrol Manajemen</p>
        </footer>
      </div>
    </>
  );
}
