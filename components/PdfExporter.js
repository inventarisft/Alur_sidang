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

// ===== PURE NATIVE JSPDF GENERATOR (ZERO HTML2CANVAS - ZERO TEXT CLIPPING - PERFECT VECTOR ARROWS) =====
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
      // Logos
      if (udinusLogo) {
        try { pdf.addImage(udinusLogo, 'PNG', 12, 8, 16, 16); } catch (e) {}
      }
      if (ftLogo) {
        try { pdf.addImage(ftLogo, 'PNG', 182, 8, 16, 16); } catch (e) {}
      }

      // Kop Text
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(15, 23, 42); // dark slate
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

      // Double Line Separator
      pdf.setDrawColor(15, 23, 42);
      pdf.setLineWidth(0.6);
      pdf.line(12, 27.5, 198, 27.5);
      pdf.setLineWidth(0.2);
      pdf.line(12, 28.3, 198, 28.3);

      // Section Banner Badge
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

      // Calculate required card height dynamically to ensure ZERO clipping
      const descLines = pdf.splitTextToSize(card.description || '', 178);
      const descHeight = descLines.length * 3.2;
      const noteHeight = cleanNote ? 4.5 : 0;

      let docsHeight = 0;
      if (docsList.length > 0) {
        const rows = Math.ceil(docsList.length / 2);
        docsHeight = 6 + (rows * 3.6);
      }

      const totalCardHeight = 6 + descHeight + noteHeight + docsHeight + 2;

      // Draw Main Stage Card Box
      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(148, 163, 184);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(12, curY, 186, totalCardHeight, 1.5, 1.5, 'FD');

      // Card Header Title
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(15, 23, 42);
      pdf.text(card.title, 15, curY + 4.5);

      // Stage Badge Pill (Right Aligned)
      const badgeText = `Tahap ${card.step_number}${prodiTerm ? ` — ${prodiTerm}` : ''}`;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      const badgeWidth = pdf.getTextWidth(badgeText) + 5;

      pdf.setFillColor(241, 245, 249);
      pdf.setDrawColor(203, 213, 225);
      pdf.roundedRect(195 - badgeWidth, curY + 1.5, badgeWidth, 4.5, 1, 1, 'FD');

      pdf.setTextColor(15, 23, 42);
      pdf.text(badgeText, 195 - (badgeWidth / 2), curY + 4.7, { align: 'center' });

      // Description
      let contentY = curY + 8;
      if (descLines.length > 0) {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(7.2);
        pdf.setTextColor(51, 65, 85);
        pdf.text(descLines, 15, contentY);
        contentY += descHeight;
      }

      // Clean Note (Info Box)
      if (cleanNote) {
        pdf.setFillColor(239, 246, 255);
        pdf.setDrawColor(191, 219, 254);
        pdf.roundedRect(15, contentY - 1, 180, 4.2, 1, 1, 'FD');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(6.5);
        pdf.setTextColor(30, 58, 138);
        pdf.text(`i  ${cleanNote}`, 17, contentY + 2);
        contentY += 4.5;
      }

      // Berkas Persyaratan Box
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
        pdf.setFontSize(6.5);
        pdf.setTextColor(30, 41, 59);

        docsList.forEach((doc, di) => {
          const col = di % 2; // 0 = Left, 1 = Right
          const row = Math.floor(di / 2);
          const posX = col === 0 ? 17 : 106;
          const posY = contentY + 7 + (row * 3.6);

          const docText = `${di + 1}. ${doc.title}${doc.sub ? ` (${doc.sub})` : ''}`;
          const truncatedDoc = docText.length > 48 ? docText.substring(0, 46) + '...' : docText;
          pdf.text(truncatedDoc, posX, posY);
        });
      }

      curY += totalCardHeight + 2.5;
    });

    drawFooter(1);

    // ==========================================
    // HALAMAN 2: DIAGRAM ALUR LOGIKA (FLOWCHART)
    // ==========================================
    pdf.addPage();
    drawKopSurat(`HALAMAN 2: DIAGRAM ALUR UJIAN (${prodiName.toUpperCase()})`);

    // Helper: Draw Arrowhead pointing down
    const drawDownArrow = (x, yTop, yBottom, labelText = '') => {
      pdf.setDrawColor(51, 65, 85);
      pdf.setLineWidth(0.4);
      pdf.line(x, yTop, x, yBottom);

      // Arrow head triangle
      pdf.setFillColor(51, 65, 85);
      pdf.triangle(x - 1.2, yBottom - 2, x + 1.2, yBottom - 2, x, yBottom, 'F');

      if (labelText) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.5);
        pdf.setTextColor(6, 78, 59);

        const tw = pdf.getTextWidth(labelText) + 4;
        pdf.setFillColor(236, 253, 245);
        pdf.setDrawColor(110, 231, 183);
        pdf.roundedRect(x - (tw / 2), ((yTop + yBottom) / 2) - 2.5, tw, 4.5, 1, 1, 'FD');
        pdf.text(labelText, x, ((yTop + yBottom) / 2) + 0.8, { align: 'center' });
      }
    };

    // Flowchart Nodes Positioning
    // 1. Start Terminal Box
    pdf.setFillColor(15, 23, 42);
    pdf.setDrawColor(15, 23, 42);
    pdf.roundedRect(65, 41, 80, 10, 5, 5, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(255, 255, 255);
    pdf.text('1. TAHAP ADMINISTRASI & BERKAS PERSYARATAN', 105, 47, { align: 'center' });

    pdf.setFontSize(7);
    pdf.setTextColor(56, 189, 248);
    pdf.text('(Syarat Berkas (CD))', 105, 50, { align: 'center' });

    // Annotation Note 1 Box
    pdf.setFillColor(236, 253, 245);
    pdf.setDrawColor(52, 211, 153);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(70, 53, 70, 6, 1, 1, 'FD');

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(6, 78, 59);
    pdf.text('Pengisian SKPI (sisfoftudinus.my.id) & Link n Match dicicil sejak Smt 1', 105, 57, { align: 'center' });

    drawDownArrow(105, 59, 68);

    // 2. Process Box 2: Ujian Proposal
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(15, 23, 42);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(50, 68, 70, 16, 2, 2, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(15, 23, 42);
    pdf.text('2. UJIAN PROPOSAL', 85, 74, { align: 'center' });
    pdf.setFontSize(7.5);
    pdf.setTextColor(37, 99, 235);
    pdf.text('(Capstone Design 1)', 85, 78, { align: 'center' });
    pdf.setFontSize(6.5);
    pdf.setTextColor(71, 85, 105);
    pdf.text('Mendaftar ujian proposal pada MENTORA', 85, 82, { align: 'center' });

    // Side Note Box (Right)
    pdf.setFillColor(236, 253, 245);
    pdf.setDrawColor(52, 211, 153);
    pdf.roundedRect(125, 68, 55, 16, 2, 2, 'FD');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(6, 78, 59);
    pdf.text('UPDATE SKPI RUTIN & VERIFIKASI', 152.5, 73, { align: 'center' });
    pdf.text('LINK N MATCH', 152.5, 77, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.text('Memperbarui SKPI & Link n Match', 152.5, 81, { align: 'center' });

    drawDownArrow(85, 84, 95);

    // 3. Decision Node (Diamond)
    // Diamond Coordinates (Center 85, 110, Size 30x30)
    const cx = 85, cy = 110, rx = 20, ry = 14;
    pdf.setFillColor(254, 243, 199);
    pdf.setDrawColor(217, 119, 6);
    pdf.setLineWidth(0.6);

    // Polygon Diamond Points: Top(cx, cy-ry), Right(cx+rx, cy), Bottom(cx, cy+ry), Left(cx-rx, cy)
    pdf.lines([
      [rx, ry],
      [-rx, ry],
      [-rx, -ry],
      [rx, -ry]
    ], cx - rx, cy, [1, 1], 'FD', true);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(120, 53, 15);
    pdf.text('3. UJIAN SEMHAS', cx, cy - 3, { align: 'center' });
    pdf.setFontSize(7);
    pdf.text('(SEMINAR HASIL)', cx, cy + 1, { align: 'center' });
    pdf.setFontSize(6.5);
    pdf.setTextColor(180, 83, 9);
    pdf.text('(Seminar Hasil (Semhas))', cx, cy + 5, { align: 'center' });

    // LEFT BRANCH: TIDAK / GAGAL (Clean Loopback Vector Arrow)
    pdf.setDrawColor(220, 38, 38);
    pdf.setLineWidth(0.5);

    // Horizontal line left from diamond vertex (cx-rx, cy) to (30, 110)
    pdf.line(cx - rx, cy, 30, cy);
    // Vertical line up from (30, 110) to (30, 76)
    pdf.line(30, cy, 30, 76);
    // Horizontal line right from (30, 76) into Process Box 2 (50, 76)
    pdf.line(30, 76, 50, 76);

    // Arrowhead pointing right into Process Box 2
    pdf.setFillColor(220, 38, 38);
    pdf.triangle(48, 74.8, 48, 77.2, 50, 76, 'F');

    // Label Badge for TIDAK / GAGAL
    pdf.setFillColor(254, 242, 242);
    pdf.setDrawColor(252, 165, 165);
    pdf.roundedRect(18, 92, 38, 10, 1.5, 1.5, 'FD');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(185, 28, 28);
    pdf.text('TIDAK / GAGAL', 37, 96, { align: 'center' });
    pdf.setFontSize(6.5);
    pdf.setTextColor(127, 29, 29);
    pdf.text('Ulang: 2. Ujian Proposal', 37, 100, { align: 'center' });

    // BOTTOM BRANCH: YA / LULUS Arrow to Step 4
    drawDownArrow(cx, cy + ry, 134, 'YA / Lulus');

    // 4. Process Box 4: Sidang Akhir
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(15, 23, 42);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(45, 134, 80, 18, 2, 2, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(15, 23, 42);
    pdf.text('4. SIDANG AKHIR', cx, 140, { align: 'center' });
    pdf.setFontSize(7.5);
    pdf.setTextColor(37, 99, 235);
    pdf.text('(Capstone Design 2 (Sidang Akhir))', cx, 144, { align: 'center' });
    pdf.setFontSize(6.5);
    pdf.setTextColor(71, 85, 105);
    pdf.text('Ujian pertanggungjawaban karya akhir di hadapan penguji', cx, 148, { align: 'center' });

    drawDownArrow(cx, 152, 160);

    // 5. Process Box 5: Yudisium
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(15, 23, 42);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(45, 160, 80, 18, 2, 2, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(15, 23, 42);
    pdf.text('5. YUDISIUM', cx, 166, { align: 'center' });
    pdf.setFontSize(7.5);
    pdf.setTextColor(37, 99, 235);
    pdf.text('(Yudisium CD)', cx, 170, { align: 'center' });
    pdf.setFontSize(6.5);
    pdf.setTextColor(71, 85, 105);
    pdf.text('Penetapan kelulusan resmi setelah nilai & berkas terverifikasi', cx, 174, { align: 'center' });

    drawDownArrow(cx, 178, 186);

    // 6. Terminal Box 6: Wisuda
    pdf.setFillColor(6, 95, 70);
    pdf.setDrawColor(6, 95, 70);
    pdf.roundedRect(65, 186, 40, 10, 5, 5, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(255, 255, 255);
    pdf.text('6. WISUDA', cx, 191, { align: 'center' });
    pdf.setFontSize(7);
    pdf.setTextColor(254, 240, 138);
    pdf.text('(Wisuda)', cx, 194.5, { align: 'center' });

    drawFooter(2);

    // Save PDF file directly!
    pdf.save(`Alur_Ujian_${prodiName.toUpperCase()}_UDINUS.pdf`);
  } catch (e) {
    console.error('PDF generation error:', e);
    alert('Gagal membuat PDF: ' + e.message);
  } finally {
    setPdfLoading(false);
  }
}

// ===== EXPORT DOCUMENT REACT WRAPPER (FOR RENDERING) =====
export function PdfExportDocument() {
  return null; // Pure native PDF generator doesn't need DOM elements!
}
