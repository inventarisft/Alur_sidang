import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_6KFOV5bIturs@ep-quiet-mouse-az82huvf-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

export const DEFAULT_PRODI = [
  { code: "te",   name: "Teknik Elektro (TE)",    icon: "fa-bolt",        color: "#dc2626" },
  { code: "tind", name: "Teknik Industri (Tind)", icon: "fa-industry",    color: "#d97706" },
  { code: "tb",   name: "Teknik Biomedis (TB)",   icon: "fa-heart-pulse", color: "#059669" },
];

// Syarat Perancangan Project Terpadu II / Capstone Design (1-8 PDF di GDRIVE MENTORA)
export const DEFAULT_DOCS = [
  { title: "1. File Berkas Laporan Lengkap", sub: "Sudah ditandatangani Dosen Pembimbing", icon: "fa-file-signature" },
  { title: "2. File Hasil Turnitin Lengkap",  sub: "Dari skor sampai akhir laporan (Max 25%)", icon: "fa-shield-halved" },
  { title: "3. File Transkrip Nilai",        sub: "Sudah ditandatangani Dekan", icon: "fa-file-lines" },
  { title: "4. File KRS Capstone Design / PT", sub: "KRS Semester Berjalan", icon: "fa-calendar-check" },
  { title: "5. File Bukti Bebas Admin",      sub: "Surat bebas keuangan BIKU", icon: "fa-receipt" },
  { title: "6. File Bukti Bebas Perpus",     sub: "Surat bebas pinjaman perpustakaan", icon: "fa-graduation-cap" },
  { title: "7. File Hasil TOEFL",            sub: "Minimal Skor >= 425 EPA UDINUS", icon: "fa-certificate" },
  { title: "8. File Poster",                 sub: "Poster ringkasan perancangan / riset karya akhir", icon: "fa-image" },
  { title: "9. Pendaftaran MENTORA",         sub: "Upload PDF di GDRIVE pendaftaran MENTORA (kpta.sisfoftudinus.my.id)", icon: "fa-link", link: "https://kpta.sisfoftudinus.my.id/" }
];

// Syarat Seminar dan Publikasi Ilmiah
export const SEMHAS_DOCS = [
  { title: "1. File Jurnal",                 sub: "File naskah publikasi ilmiah", icon: "fa-file-pdf" },
  { title: "2. Jurnal Sudah Terbit",         sub: "File Word berisi tanggal terbit & website jurnal", icon: "fa-globe" },
  { title: "3. Jurnal Belum Terbit",       sub: "File Word draft jurnal + lembar pengesahan TTD Dosen Pembimbing", icon: "fa-file-pen" }
];

export const DEFAULT_CARDS = [
  { step_number: 1, shape: "terminal", title: "1. TAHAP ADMINISTRASI & BERKAS PERSYARATAN", description: "Mahasiswa melengkapi berkas administrasi dan upload format PDF di GDRIVE MENTORA.", note: "Pengisian SKPI & MENTORA dapat dicicil sejak Semester 1 melalui Web MENTORA (kpta.sisfoftudinus.my.id).", te_term: "Syarat Berkas (CD)", tind_term: "Syarat Berkas (PT)", tb_term: "Syarat Berkas (CD)", skip_tind: false, docs_json: JSON.stringify(DEFAULT_DOCS) },
  { step_number: 2, shape: "process",  title: "2. UJIAN PROPOSAL", description: "Mendaftar ujian proposal dengan melampirkan berkas & Bukti Registrasi MENTORA.", note: "", te_term: "Capstone Design 1", tind_term: "Project Terpadu 1", tb_term: "Capstone Design 1 (Sempro)", skip_tind: false, docs_json: "[]" },
  { step_number: 3, shape: "note",     title: "UPDATE SKPI RUTIN & VERIFIKASI MENTORA", description: "Memperbarui berkas SKPI secara rutin & verifikasi di Aplikasi MENTORA.", note: "Rutin Smt 1 - Yudisium", te_term: "Rutin Smt 1 - Yudisium", tind_term: "Rutin Smt 1 - Yudisium", tb_term: "Rutin Smt 1 - Yudisium", skip_tind: false, docs_json: "[]" },
  { step_number: 4, shape: "decision", title: "3. UJIAN SEMINAR HASIL (SEMHAS)", description: "Penyampaian progres dan naskah publikasi ilmiah sebelum sidang akhir.", note: "", te_term: "Capstone Design 2 (Semhas)", tind_term: "- (Langsung Sidang)", tb_term: "Capstone Design 2 (Semhas)", skip_tind: true, docs_json: JSON.stringify(SEMHAS_DOCS) },
  { step_number: 5, shape: "process",  title: "4. SIDANG AKHIR", description: "Ujian pertanggungjawaban karya akhir di hadapan dewan penguji.", note: "Batas Akhir Validasi SKPI wajib tervalidasi sebelum Yudisium.", te_term: "Capstone Design 2 (Sidang)", tind_term: "Project Terpadu 2 (Sidang)", tb_term: "Capstone Design 2 (Sidang)", skip_tind: false, docs_json: JSON.stringify(DEFAULT_DOCS) },
  { step_number: 6, shape: "process",  title: "5. YUDISIUM", description: "Penetapan kelulusan resmi setelah nilai sidang dan SKPI valid.", note: "Syarat SKPI & MENTORA wajib tervalidasi penuh.", te_term: "Yudisium CD", tind_term: "Yudisium PT", tb_term: "Yudisium CD", skip_tind: false, docs_json: "[]" },
  { step_number: 7, shape: "terminal", title: "6. WISUDA", description: "Pelaksanaan upacara wisuda dan penyerahan ijazah resmi.", note: "", te_term: "Wisuda", tind_term: "Wisuda", tb_term: "Wisuda", skip_tind: false, docs_json: "[]" },
];

let dbInited = false;
export async function initDb() {
  if (dbInited) return;
  await pool.query(`CREATE TABLE IF NOT EXISTS prodi_list (id SERIAL PRIMARY KEY, code TEXT UNIQUE NOT NULL, name TEXT NOT NULL, icon TEXT DEFAULT 'fa-graduation-cap', color TEXT DEFAULT '#0f172a')`);
  await pool.query(`CREATE TABLE IF NOT EXISTS flow_cards (id SERIAL PRIMARY KEY, step_number INT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL, note TEXT DEFAULT '', te_term TEXT DEFAULT '', tind_term TEXT DEFAULT '', tb_term TEXT DEFAULT '', skip_tind BOOLEAN DEFAULT false, shape TEXT DEFAULT 'process', docs_json TEXT DEFAULT '[]', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
  await pool.query(`ALTER TABLE flow_cards ADD COLUMN IF NOT EXISTS shape TEXT DEFAULT 'process'`);

  // Hapus otomatis card berlabel INFORMATIKA dari database jika ada
  await pool.query("DELETE FROM flow_cards WHERE title ILIKE '%informatika%'");

  // Update berkas persyaratan & URL MENTORA terbaru ke database
  await pool.query(`UPDATE flow_cards SET note='' WHERE step_number=4 AND (note LIKE '%Teknik Industri%' OR note LIKE '%Tind%')`);
  await pool.query(`UPDATE flow_cards SET docs_json=$1 WHERE step_number=1 OR step_number=5`, [JSON.stringify(DEFAULT_DOCS)]);
  await pool.query(`UPDATE flow_cards SET docs_json=$1 WHERE step_number=4`, [JSON.stringify(SEMHAS_DOCS)]);
  await pool.query(`UPDATE flow_cards SET docs_json = replace(docs_json, 'https://alumni.sisfoftudinus.my.id/', 'https://kpta.sisfoftudinus.my.id/')`);
  await pool.query(`UPDATE flow_cards SET docs_json = replace(docs_json, 'alumni.sisfoftudinus.my.id', 'kpta.sisfoftudinus.my.id')`);
  await pool.query(`UPDATE flow_cards SET description = replace(description, 'alumni.sisfoftudinus.my.id', 'kpta.sisfoftudinus.my.id')`);
  await pool.query(`UPDATE flow_cards SET note = replace(note, 'alumni.sisfoftudinus.my.id', 'kpta.sisfoftudinus.my.id')`);

  const prodiCount = await pool.query('SELECT COUNT(*) FROM prodi_list');
  if (parseInt(prodiCount.rows[0].count) === 0) {
    for (const p of DEFAULT_PRODI) await pool.query('INSERT INTO prodi_list (code, name, icon, color) VALUES ($1,$2,$3,$4)', [p.code, p.name, p.icon, p.color]);
  }
  const cardCount = await pool.query('SELECT COUNT(*) FROM flow_cards');
  if (parseInt(cardCount.rows[0].count) === 0) {
    for (const c of DEFAULT_CARDS) await pool.query('INSERT INTO flow_cards (step_number, title, description, note, te_term, tind_term, tb_term, skip_tind, shape, docs_json) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)', [c.step_number, c.title, c.description, c.note, c.te_term, c.tind_term, c.tb_term, c.skip_tind, c.shape, c.docs_json]);
  }
  dbInited = true;
}

export { pool };
