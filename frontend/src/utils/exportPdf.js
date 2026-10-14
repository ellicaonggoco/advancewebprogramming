import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Creates and downloads a professional, corporate-styled PDF document.
 * 
 * @param {Object} options
 * @param {string} options.title - Document title (e.g. "Attendance Audit Records")
 * @param {string} options.subtitle - Secondary explanation or period
 * @param {Array<string>} options.meta - Metadata rows (e.g. ["Scope: All Departments", "Generated: Oct 15, 2026"])
 * @param {Array<string>} options.headers - Column header labels
 * @param {Array<Array<string>>} options.rows - Table cell values
 * @param {string} options.filename - Download filename (without .pdf)
 * @param {boolean} [options.landscape=false] - Whether to orient landscape
 * @param {boolean} [options.includeSignatures=false] - Whether to render academic sign-off lines
 */
export function generatePdfDocument({
  title,
  subtitle = 'Official Institutional Workforce Report',
  meta = [],
  headers = [],
  rows = [],
  filename = 'report',
  landscape = false,
  includeSignatures = false
}) {
  const doc = new jsPDF({
    orientation: landscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // 1. Executive Dark Header Banner
  doc.setFillColor(45, 38, 48); // #2D2630
  doc.roundedRect(margin, 12, pageWidth - (margin * 2), 26, 3, 3, 'F');

  // Gold Brand Tag
  doc.setTextColor(223, 192, 144); // #DFC090
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('ATTENDEASE ENTERPRISE • OFFICIAL AUDIT REPORT', margin + 6, 18);

  // Document Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(title, margin + 6, 26);

  // Subtitle
  doc.setTextColor(209, 197, 211);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(subtitle, margin + 6, 32);

  // 2. Metadata Box
  let startY = 44;
  if (meta && meta.length > 0) {
    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(margin, 42, pageWidth - (margin * 2), 10 + (meta.length * 4.5), 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(75, 85, 99);

    meta.forEach((item, idx) => {
      doc.text(item, margin + 5, 48 + (idx * 5));
    });

    startY = 46 + (meta.length * 5) + 4;
  }

  // 3. AutoTable Data Grid
  autoTable(doc, {
    startY: startY,
    head: [headers],
    body: rows,
    theme: 'grid',
    margin: { left: margin, right: margin, bottom: 20 },
    headStyles: {
      fillColor: [45, 38, 48], // #2D2630
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
      cellPadding: 2.8
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [55, 65, 81],
      cellPadding: 2.4,
      valign: 'middle'
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    },
    tableLineColor: [229, 231, 235],
    tableLineWidth: 0.15,
    didDrawPage: (data) => {
      // Footer page numbering
      const totalPages = doc.internal.getNumberOfPages();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(156, 163, 175);
      doc.text(
        `Generated: ${new Date().toLocaleString()}  •  Page ${data.pageNumber} of ${totalPages}`,
        pageWidth / 2,
        pageHeight - 8,
        { align: 'center' }
      );
      doc.text('AttendEase Enterprise Workforce Attendance System', margin, pageHeight - 8);
    }
  });

  // 4. Optional Academic / Formal Sign-off block
  if (includeSignatures) {
    let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 12 : pageHeight - 45;

    // Check if enough room on current page, else add page
    if (finalY + 30 > pageHeight - 15) {
      doc.addPage();
      finalY = 25;
    }

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128);
    doc.text(
      'This document certifies that the above workforce records have been audited and verified for institutional compliance.',
      margin,
      finalY
    );

    const signY = finalY + 16;
    const colWidth = (pageWidth - (margin * 2) - 20) / 3;

    // Signature 1: Group Leader
    doc.setDrawColor(31, 41, 55);
    doc.line(margin, signY, margin + colWidth, signY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(17, 24, 39);
    doc.text('ELLICA CHRIS ONNGOCO', margin, signY + 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(107, 114, 128);
    doc.text('Group Leader & System Admin', margin, signY + 7.5);

    // Signature 2: Lead Architect
    const x2 = margin + colWidth + 10;
    doc.line(x2, signY, x2 + colWidth, signY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(17, 24, 39);
    doc.text('JOHN HERZSEL DATUL', x2, signY + 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(107, 114, 128);
    doc.text('Lead Systems Architect', x2, signY + 7.5);

    // Signature 3: Course Evaluator
    const x3 = x2 + colWidth + 10;
    doc.line(x3, signY, x3 + colWidth, signY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(17, 24, 39);
    doc.text('_____________________________', x3, signY + 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(107, 114, 128);
    doc.text('Project Evaluator / Instructor', x3, signY + 7.5);
  }

  // 5. Trigger download directly in user's browser
  const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  doc.save(cleanFilename);
}
