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

// ===== PURE NATIVE JSPDF GENERATOR (100% PERFECT VECTOR ALIGNMENT - CENTER 105mm) =====
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

      const descLines = pdf.splitTextToSize(card.description || '', 178);
      const descHeight = descLines.length * 3.2;
      const noteHeight = cleanNote ? 4.5 : 0;

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
        pdf.roundedRect(15, contentY - 1, 180, 4.2, 1, 1, 'FD');

        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(6.5);
        pdf.setTextColor(30, 58, 138);
        pdf.text(`i  ${cleanNote}`, 17, contentY + 2);
        contentY += 4.5;
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
        pdf.setFontSize(6.5);
        pdf.setTextColor(30, 41, 59);

        docsList.forEach((doc, di) => {
          const col = di % 2;
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
    // HALAMAN 2: DIAGRAM ALUR LOGIKA (ALL CENTERED AT X = 105mm)
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
        pdf.roundedRect(x - (tw / 2), ((yTop + yBottom) / 2) - 2.5, tw, 4.5, 1, 1, 'FD');
        pdf.text(labelText, x, ((yTop + yBottom) / 2) + 0.8, { align: 'center' });
      }
    };

    const centerX = 105; // Perfect A4 Center

    // 1. Start Terminal Box (Center 105)
    pdf.setFillColor(15, 23, 42);
    pdf.setDrawColor(15, 23, 42);
    pdf.roundedRect(centerX - 42, 41, 84, 10, 5, 5, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(255, 255, 255);
    pdf.text('1. TAHAP ADMINISTRASI & BERKAS PERSYARATAN', centerX, 45.5, { align: 'center' });

    pdf.setFontSize(7);
    pdf.setTextColor(56, 189, 248);
    pdf.text('(Syarat Berkas (CD))', centerX, 49, { align: 'center' });

    // Note 1 Box (Center 105)
    pdf.setFillColor(236, 253, 245);
    pdf.setDrawColor(52, 211, 153);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(centerX - 42, 53, 84, 5.5, 1, 1, 'FD');

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6.5);
    pdf.setTextColor(6, 78, 59);
    pdf.text('Pengisian SKPI (sisfoftudinus.my.id) & Link n Match dicicil sejak Smt 1', centerX, 56.8, { align: 'center' });

    drawDownArrow(centerX, 58.5, 68);

    // 2. Process Box 2: Ujian Proposal (Center 105)
    const box2Width = 84;
    const box2Left = centerX - (box2Width / 2); // 105 - 42 = 63

    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(15, 23, 42);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(box2Left, 68, box2Width, 16, 2, 2, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(15, 23, 42);
    pdf.text('2. UJIAN PROPOSAL', centerX, 73.5, { align: 'center' });
    pdf.setFontSize(7.5);
    pdf.setTextColor(37, 99, 235);
    pdf.text('(Capstone Design 1)', centerX, 77.5, { align: 'center' });
    pdf.setFontSize(6.5);
    pdf.setTextColor(71, 85, 105);
    pdf.text('Mendaftar ujian proposal pada MENTORA', centerX, 81, { align: 'center' });

    // Side Note Box (Right)
    pdf.setFillColor(236, 253, 245);
    pdf.setDrawColor(52, 211, 153);
    pdf.roundedRect(153, 68, 43, 16, 2, 2, 'FD');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(6, 78, 59);
    pdf.text('UPDATE SKPI RUTIN & VERIFIKASI', 174.5, 72.5, { align: 'center' });
    pdf.text('LINK N MATCH', 174.5, 76.5, { align: 'center' });
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6);
    pdf.text('Memperbarui SKPI & Link n Match', 174.5, 80.5, { align: 'center' });

    drawDownArrow(centerX, 84, 94);

    // 3. Decision Node (Diamond Center 105, 110)
    const cy = 110, rx = 20, ry = 14;

    pdf.setFillColor(254, 243, 199);
    pdf.setDrawColor(217, 119, 6);
    pdf.setLineWidth(0.6);

    // Diamond Polygon at exact centerX (105)
    pdf.lines([
      [rx, ry],
      [-rx, ry],
      [-rx, -ry],
      [rx, -ry]
    ], centerX - rx, cy, [1, 1], 'FD', true);

    // Text INSIDE Diamond (ALL EXACTLY CENTERED AT centerX = 105mm!)
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(120, 53, 15);
    pdf.text('3. UJIAN SEMHAS', centerX, cy - 3, { align: 'center' });
    pdf.setFontSize(7);
    pdf.text('(SEMINAR HASIL)', centerX, cy + 1, { align: 'center' });
    pdf.setFontSize(6.5);
    pdf.setTextColor(180, 83, 9);
    pdf.text('(Seminar Hasil (Semhas))', centerX, cy + 5, { align: 'center' });

    // LEFT BRANCH: TIDAK / GAGAL (Clean Loopback Vector Line)
    pdf.setDrawColor(220, 38, 38);
    pdf.setLineWidth(0.5);

    // From left vertex (centerX - rx = 85) left to x = 26
    pdf.line(centerX - rx, cy, 26, cy);
    // Up from (26, cy) to (26, 76)
    pdf.line(26, cy, 26, 76);
    // Right from (26, 76) to box2Left (63)
    pdf.line(26, 76, box2Left, 76);

    // Arrowhead pointing right into Process Box 2 (at 63, 76)
    pdf.setFillColor(220, 38, 38);
    pdf.triangle(box2Left - 2, 74.8, box2Left - 2, 77.2, box2Left, 76, 'F');

    // Label Badge for TIDAK / GAGAL
    pdf.setFillColor(254, 242, 242);
    pdf.setDrawColor(252, 165, 165);
    pdf.roundedRect(15, 92, 34, 10, 1.5, 1.5, 'FD');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(185, 28, 28);
    pdf.text('TIDAK / GAGAL', 32, 96, { align: 'center' });
    pdf.setFontSize(6.5);
    pdf.setTextColor(127, 29, 29);
    pdf.text('Ulang: 2. Ujian Proposal', 32, 100, { align: 'center' });

    // BOTTOM BRANCH: YA / LULUS Arrow to Step 4
    drawDownArrow(centerX, cy + ry, 134, 'YA / Lulus');

    // 4. Process Box 4: Sidang Akhir (Center 105)
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(15, 23, 42);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(box2Left, 134, box2Width, 18, 2, 2, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(15, 23, 42);
    pdf.text('4. SIDANG AKHIR', centerX, 140, { align: 'center' });
    pdf.setFontSize(7.5);
    pdf.setTextColor(37, 99, 235);
    pdf.text('(Capstone Design 2 (Sidang Akhir))', centerX, 144, { align: 'center' });
    pdf.setFontSize(6.5);
    pdf.setTextColor(71, 85, 105);
    pdf.text('Ujian pertanggungjawaban karya akhir di hadapan penguji', centerX, 148, { align: 'center' });

    drawDownArrow(centerX, 152, 160);

    // 5. Process Box 5: Yudisium (Center 105)
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(15, 23, 42);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(box2Left, 160, box2Width, 18, 2, 2, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(15, 23, 42);
    pdf.text('5. YUDISIUM', centerX, 166, { align: 'center' });
    pdf.setFontSize(7.5);
    pdf.setTextColor(37, 99, 235);
    pdf.text('(Yudisium CD)', centerX, 170, { align: 'center' });
    pdf.setFontSize(6.5);
    pdf.setTextColor(71, 85, 105);
    pdf.text('Penetapan kelulusan resmi setelah nilai & berkas terverifikasi', centerX, 174, { align: 'center' });

    drawDownArrow(centerX, 178, 186);

    // 6. Terminal Box 6: Wisuda (Center 105)
    pdf.setFillColor(6, 95, 70);
    pdf.setDrawColor(6, 95, 70);
    pdf.roundedRect(centerX - 25, 186, 50, 10, 5, 5, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(255, 255, 255);
    pdf.text('6. WISUDA', centerX, 191, { align: 'center' });
    pdf.setFontSize(7);
    pdf.setTextColor(254, 240, 138);
    pdf.text('(Wisuda)', centerX, 194.5, { align: 'center' });

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
