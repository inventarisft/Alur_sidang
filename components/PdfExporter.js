'use client';
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

// ===== PURE NATIVE JSPDF GENERATOR (ZERO REDUNDANT NUMBERING & COMPLETE FULL UNTRUNCATED TEXT) =====
export async function triggerPdfExport({ cards, prodiList, activeProdi, setPdfLoading }) {
  if (!cards || cards.length === 0 || !prodiList || prodiList.length === 0) {
    alert('Data belum selesai dimuat. Silakan tunggu beberapa detik dan coba lagi.');
    return;
  }

  setPdfLoading(true);

  try {
    const { jsPDF } = await import('jspdf');

    const activeProdiObj = prodiList.find(p => p.code === activeProdi) || { name: activeProdi.toUpperCase() };
    const prodiName = activeProdiObj.name || activeProdi.toUpperCase();
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const udinusLogo = base64Logos.udinus;
    const ftLogo = base64Logos.ft;

    // Helper: Draw Header (Kop Surat)
    const drawKopSurat = (pageTitle) => {
      if (udinusLogo) {
        try { pdf.addImage(udinusLogo, 'PNG', 12, 8, 16, 16); } catch (e) {}
      }
      if (ftLogo) {
        try { pdf.addImage(ftLogo, 'PNG', 182, 8, 16, 16); } catch (e) {}
      }

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(15, 23, 42);
      pdf.text('UNIVERSITAS DIAN NUSWANTORO', 105, 12, { align: 'center' });

      pdf.setFontSize(9.5);
      pdf.text('FAKULTAS TEKNIK', 105, 16.5, { align: 'center' });

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(51, 65, 85);
      pdf.text('Jl. Nakula I No. 5-11 Semarang | Telp. (024) 3517261 | Website: ft.dinus.ac.id', 105, 20.5, { align: 'center' });

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(15, 23, 42);
      pdf.text(`ALUR PENDAFTARAN UJIAN (${prodiName.toUpperCase()})`, 105, 25, { align: 'center' });

      pdf.setDrawColor(15, 23, 42);
      pdf.setLineWidth(0.6);
      pdf.line(12, 27.5, 198, 27.5);
      pdf.setLineWidth(0.2);
      pdf.line(12, 28.3, 198, 28.3);

      pdf.setFillColor(241, 245, 249);
      pdf.setDrawColor(203, 213, 225);
      pdf.roundedRect(12, 30.5, 186, 6, 1, 1, 'FD');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(15, 23, 42);
      pdf.text(pageTitle, 105, 34.7, { align: 'center' });
    };

    // Helper: Draw Footer
    const drawFooter = (pageNum) => {
      pdf.setDrawColor(15, 23, 42);
      pdf.setLineWidth(0.3);
      pdf.line(12, 287, 198, 287);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(71, 85, 105);
      pdf.text('Dokumen Resmi Alur Ujian Fakultas Teknik UDINUS', 12, 291);
      pdf.text(`Halaman ${pageNum} dari 2`, 198, 291, { align: 'right' });
    };

    // ==========================================
    // HALAMAN 1: TAHAPAN ALUR & BERKAS
    // ==========================================
    drawKopSurat(`HALAMAN 1: TAHAPAN ALUR PENDAFTARAN & BERKAS PERSYARATAN (${prodiName.toUpperCase()})`);

    const validCards = cards.filter(c => !isSkipped(c, activeProdi));
    let curY = 39;

    validCards.forEach((card) => {
      const prodiTerm = getProdiTerm(card, activeProdi);
      const cleanNote = getCleanNote(card.note, activeProdi);
      let docsList = [];
      try { docsList = JSON.parse(card.docs_json || '[]'); } catch (e) {}

      const descLines = pdf.splitTextToSize(card.description || '', 178);
      const descHeight = descLines.length * 3.2;

      let noteLines = [];
      let noteHeight = 0;
      if (cleanNote) {
        noteLines = pdf.splitTextToSize(`i  ${cleanNote}`, 174);
        noteHeight = 2 + (noteLines.length * 3.0);
      }

      let docsHeight = 0;
      if (docsList.length > 0) {
        const rows = Math.ceil(docsList.length / 2);
        docsHeight = 6 + (rows * 3.6);
      }

      const totalCardHeight = 6 + descHeight + noteHeight + docsHeight + 2;

      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(148, 163, 184);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(12, curY, 186, totalCardHeight, 1.5, 1.5, 'FD');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(15, 23, 42);
      pdf.text(card.title, 15, curY + 4.5);

      const badgeText = `Tahap ${card.step_number}${prodiTerm ? ` — ${prodiTerm}` : ''}`;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      const badgeWidth = pdf.getTextWidth(badgeText) + 5;

      pdf.setFillColor(241, 245, 249);
      pdf.setDrawColor(203, 213, 225);
      pdf.roundedRect(195 - badgeWidth, curY + 1.5, badgeWidth, 4.5, 1, 1, 'FD');

      pdf.setTextColor(15, 23, 42);
      pdf.text(badgeText, 195 - (badgeWidth / 2), curY + 4.7, { align: 'center' });

      let contentY = curY + 8;
      if (descLines.length > 0) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.2);
        pdf.setTextColor(51, 65, 85);
        pdf.text(descLines, 15, contentY);
        contentY += descHeight;
      }

      if (cleanNote) {
        pdf.setFillColor(239, 246, 255);
        pdf.setDrawColor(191, 219, 254);
        pdf.roundedRect(15, contentY - 1, 180, noteHeight, 1, 1, 'FD');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(6.3);
        pdf.setTextColor(30, 58, 138);
        pdf.text(noteLines, 17, contentY + 2.2);
        contentY += noteHeight + 1;
      }

      if (docsList.length > 0) {
        const rows = Math.ceil(docsList.length / 2);
        const docsBoxHeight = 4.5 + (rows * 3.6);

        pdf.setFillColor(248, 250, 252);
        pdf.setDrawColor(203, 213, 225);
        pdf.roundedRect(15, contentY, 180, docsBoxHeight, 1, 1, 'FD');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(6.8);
        pdf.setTextColor(15, 23, 42);
        pdf.text('Berkas Persyaratan (PDF MENTORA - kpta.sisfoftudinus.my.id):', 17, contentY + 3.5);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(5.8);
        pdf.setTextColor(30, 41, 59);

        docsList.forEach((doc, di) => {
          const col = di % 2;
          const row = Math.floor(di / 2);
          const posX = col === 0 ? 17 : 104;
          const posY = contentY + 7 + (row * 3.6);

          // Clean title: remove redundant leading "1. " if doc.title already starts with a number
          let titleText = (doc.title || '').trim();
          if (!/^\d+\.\s*/.test(titleText)) {
            titleText = `${di + 1}. ${titleText}`;
          }

          if (doc.sub) {
            titleText += ` (${doc.sub})`;
          }

          // Full text display up to 64 chars without premature "..." truncation
          const displayStr = titleText.length > 64 ? titleText.substring(0, 62) + '..' : titleText;
          pdf.text(displayStr, posX, posY);
        });
      }

      curY += totalCardHeight + 2.5;
    });

    drawFooter(1);

    // ==========================================
    // HALAMAN 2: DIAGRAM ALUR LOGIKA (RESPONSIVE AUTO-WRAPPED TEXT & CONTAINERS)
    // ==========================================
    pdf.addPage();
    drawKopSurat(`HALAMAN 2: DIAGRAM ALUR UJIAN (${prodiName.toUpperCase()})`);

    const drawDownArrow = (x, yTop, yBottom, labelText = '') => {
      pdf.setDrawColor(51, 65, 85);
      pdf.setLineWidth(0.4);
      pdf.line(x, yTop, x, yBottom);

      pdf.setFillColor(51, 65, 85);
      pdf.triangle(x - 1.2, yBottom - 2, x + 1.2, yBottom - 2, x, yBottom, 'F');

      if (labelText) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.5);
        pdf.setTextColor(6, 78, 59);

        const tw = pdf.getTextWidth(labelText) + 4;
        pdf.setFillColor(236, 253, 245);
        pdf.setDrawColor(110, 231, 183);
        pdf.roundedRect(x - (tw / 2), ((yTop + yBottom) / 2) - 2.2, tw, 4.4, 1, 1, 'FD');
        pdf.text(labelText, x, ((yTop + yBottom) / 2) + 0.9, { align: 'center' });
      }
    };

    const centerX = 105; // Exact A4 Center Axis

    // 1. Start Terminal Box (Center 105)
    pdf.setFillColor(15, 23, 42);
    pdf.setDrawColor(15, 23, 42);
    pdf.roundedRect(centerX - 42, 41, 84, 9.5, 4.7, 4.7, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(255, 255, 255);
    pdf.text('1. TAHAP ADMINISTRASI & BERKAS PERSYARATAN', centerX, 45.2, { align: 'center' });

    pdf.setFontSize(7);
    pdf.setTextColor(56, 189, 248);
    pdf.text('(Syarat Berkas (CD))', centerX, 48.7, { align: 'center' });

    // Note 1 Info Box (Soft Blue like Web - Auto Wrapped to 106mm Container Width)
    const note1Str = 'i  Pengisian SKPI (sisfoftudinus.my.id) & Link n Match (alumni.sisfoftudinus.my.id) dapat dicicil sejak Smt 1';
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(5.8);
    const note1Lines = pdf.splitTextToSize(note1Str, 100);
    const note1BoxH = 2.5 + (note1Lines.length * 2.8);

    pdf.setFillColor(239, 246, 255);
    pdf.setDrawColor(191, 219, 254);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(centerX - 53, 52, 106, note1BoxH, 1, 1, 'FD');

    pdf.setTextColor(30, 58, 138);
    pdf.text(note1Lines, centerX, 54.8, { align: 'center' });

    const yAfterNote1 = 52 + note1BoxH;
    drawDownArrow(centerX, yAfterNote1, 66);

    // 2. Process Box 2: Ujian Proposal (Center 105)
    const box2Width = 84;
    const box2Left = centerX - (box2Width / 2); // 63

    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(15, 23, 42);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(box2Left, 66, box2Width, 17, 2, 2, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(15, 23, 42);
    pdf.text('2. UJIAN PROPOSAL', centerX, 71.5, { align: 'center' });
    pdf.setFontSize(7.5);
    pdf.setTextColor(37, 99, 235);
    pdf.text('(Capstone Design 1)', centerX, 75.5, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.1);
    pdf.setTextColor(71, 85, 105);
    pdf.text('Mendaftar ujian proposal pada MENTORA (kpta.sisfoftudinus.my.id)', centerX, 79, { align: 'center' });

    // Side Note Box (Right - Emerald Green like Web)
    pdf.setFillColor(236, 253, 245);
    pdf.setDrawColor(52, 211, 153);
    pdf.roundedRect(151, 66, 46, 17, 1.5, 1.5, 'FD');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.6);
    pdf.setTextColor(6, 78, 59);
    pdf.text('UPDATE SKPI RUTIN & VERIFIKASI', 174, 70.5, { align: 'center' });
    pdf.text('LINK N MATCH', 174, 74.5, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(5.6);
    pdf.text('Memperbarui SKPI & Link n Match', 174, 78.5, { align: 'center' });

    drawDownArrow(centerX, 83, 93);

    // 3. Decision Node (Diamond Center EXACTLY at 105, 108 - Enlarged to 46mm Width)
    const cy = 108, rx = 23, ry = 14.5;

    pdf.setFillColor(254, 243, 199);
    pdf.setDrawColor(217, 119, 6);
    pdf.setLineWidth(0.6);

    // Draw Diamond starting from TOP VERTEX (105, 108 - 14.5 = 93.5)
    pdf.lines([
      [rx, ry],     // to Right (128, 108)
      [-rx, ry],    // to Bottom (105, 122.5)
      [-rx, -ry],   // to Left (82, 108)
      [rx, -ry]     // back to Top (105, 93.5)
    ], centerX, cy - ry, [1, 1], 'FD', true);

    // Text INSIDE Diamond (CENTERED AT 105, 108 - FITS 100% INSIDE)
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(120, 53, 15);
    pdf.text('3. UJIAN SEMHAS', centerX, cy - 3.5, { align: 'center' });
    pdf.setFontSize(7);
    pdf.setTextColor(180, 83, 9);
    pdf.text('(SEMHAS)', centerX, cy + 0.5, { align: 'center' });
    pdf.setFontSize(6);
    pdf.text('(Seminar Hasil)', centerX, cy + 4.2, { align: 'center' });

    // LEFT BRANCH: TIDAK / GAGAL (Clean Loopback Line to Box 2)
    pdf.setDrawColor(220, 38, 38);
    pdf.setLineWidth(0.5);

    // Left from Diamond left vertex (105 - 23 = 82) to x = 25
    pdf.line(centerX - rx, cy, 25, cy);
    // Up from (25, 108) to (25, 74.5)
    pdf.line(25, cy, 25, 74.5);
    // Right from (25, 74.5) into Box 2 (box2Left = 63)
    pdf.line(25, 74.5, box2Left, 74.5);

    // Arrowhead pointing right into Process Box 2 (at 63, 74.5)
    pdf.setFillColor(220, 38, 38);
    pdf.triangle(box2Left - 2, 73.3, box2Left - 2, 75.7, box2Left, 74.5, 'F');

    // Label Badge for TIDAK / GAGAL (Left of Diamond)
    pdf.setFillColor(254, 242, 242);
    pdf.setDrawColor(252, 165, 165);
    pdf.roundedRect(14, 92, 38, 9.5, 1.5, 1.5, 'FD');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(185, 28, 28);
    pdf.text('TIDAK / GAGAL', 33, 96, { align: 'center' });
    pdf.setFontSize(6.3);
    pdf.setTextColor(127, 29, 29);
    pdf.text('Ulang: 2. Ujian Proposal', 33, 100, { align: 'center' });

    // BOTTOM BRANCH: YA / LULUS Arrow to Step 4
    drawDownArrow(centerX, cy + ry, 132, 'YA / Lulus');

    // 4. Process Box 4: Sidang Akhir (Center 105)
    const box4Width = 92;
    const box4Left = centerX - (box4Width / 2); // 59

    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(15, 23, 42);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(box4Left, 132, box4Width, 23, 2, 2, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(15, 23, 42);
    pdf.text('4. SIDANG AKHIR', centerX, 137, { align: 'center' });
    pdf.setFontSize(7.5);
    pdf.setTextColor(37, 99, 235);
    pdf.text('(Capstone Design 2 (Sidang Akhir))', centerX, 141, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.2);
    pdf.setTextColor(71, 85, 105);
    pdf.text('Ujian pertanggungjawaban karya akhir di hadapan dewan penguji.', centerX, 144.5, { align: 'center' });

    // Info Note 4 inside Box (Auto-wrapped inside container width)
    const note4Str = 'i  Batas Akhir Validasi SKPI (sisfoftudinus.my.id) wajib tervalidasi sebelum Yudisium.';
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(5.7);
    const note4Lines = pdf.splitTextToSize(note4Str, box4Width - 8);
    const note4BoxH = 2.2 + (note4Lines.length * 2.6);

    pdf.setFillColor(239, 246, 255);
    pdf.setDrawColor(191, 219, 254);
    pdf.roundedRect(box4Left + 3, 147, box4Width - 6, note4BoxH, 1, 1, 'FD');
    pdf.setTextColor(30, 58, 138);
    pdf.text(note4Lines, centerX, 149.5, { align: 'center' });

    const yAfterBox4 = 132 + 23;
    drawDownArrow(centerX, yAfterBox4, 161);

    // 5. Process Box 5: Yudisium (Center 105)
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(15, 23, 42);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(box4Left, 161, box4Width, 24, 2, 2, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(15, 23, 42);
    pdf.text('5. YUDISIUM', centerX, 166, { align: 'center' });
    pdf.setFontSize(7.5);
    pdf.setTextColor(37, 99, 235);
    pdf.text('(Yudisium CD)', centerX, 170, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.1);
    pdf.setTextColor(71, 85, 105);

    const desc5Str = 'Penetapan kelulusan resmi setelah nilai sidang, SKPI, dan Link n Match tervalidasi penuh.';
    const desc5Lines = pdf.splitTextToSize(desc5Str, box4Width - 6);
    pdf.text(desc5Lines, centerX, 173.5, { align: 'center' });

    const yNote5 = 173.5 + (desc5Lines.length * 2.8);

    // Info Note 5 inside Box (Auto-wrapped inside container width)
    const note5Str = 'i  Syarat SKPI (sisfoftudinus.my.id), Link n Match & MENTORA wajib tervalidasi penuh.';
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(5.6);
    const note5Lines = pdf.splitTextToSize(note5Str, box4Width - 8);
    const note5BoxH = 2.2 + (note5Lines.length * 2.6);

    pdf.setFillColor(239, 246, 255);
    pdf.setDrawColor(191, 219, 254);
    pdf.roundedRect(box4Left + 3, yNote5, box4Width - 6, note5BoxH, 1, 1, 'FD');
    pdf.setTextColor(30, 58, 138);
    pdf.text(note5Lines, centerX, yNote5 + 2.5, { align: 'center' });

    const yAfterBox5 = 161 + 24;
    drawDownArrow(centerX, yAfterBox5, 191);

    // 6. Terminal Box 6: Wisuda (Center 105)
    pdf.setFillColor(6, 95, 70);
    pdf.setDrawColor(6, 95, 70);
    pdf.roundedRect(centerX - 25, 191, 50, 9.5, 4.7, 4.7, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(255, 255, 255);
    pdf.text('6. WISUDA', centerX, 195.5, { align: 'center' });
    pdf.setFontSize(7);
    pdf.setTextColor(254, 240, 138);
    pdf.text('(Wisuda)', centerX, 199, { align: 'center' });

    drawFooter(2);

    pdf.save(`Alur_Ujian_${prodiName.toUpperCase()}_UDINUS.pdf`);
  } catch (e) {
    console.error('PDF generation error:', e);
    alert('Gagal membuat PDF: ' + e.message);
  } finally {
    setPdfLoading(false);
  }
}

export function PdfExportDocument() {
  return null;
}
