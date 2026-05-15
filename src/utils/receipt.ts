import { jsPDF } from 'jspdf';
import { AuditEntry, UserProfile } from '../types';
import { formatNaira } from './format';

export const generateReceipt = (entry: AuditEntry, profile: UserProfile) => {
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 150] // Receipt style format
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;
  let y = 15;

  // Header - Business Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(profile.businessName.toUpperCase(), pageWidth / 2, y, { align: 'center' });
  y += 8;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const location = profile.businessAddress || `${profile.city}, ${profile.state}`;
  doc.text(location, pageWidth / 2, y, { align: 'center' });
  y += 4;
  if (profile.businessPhone) {
    doc.text(profile.businessPhone, pageWidth / 2, y, { align: 'center' });
    y += 4;
  }
  y += 6;

  // Separator
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Content
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('RECEIPT', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(new Date(entry.timestamp).toLocaleString(), pageWidth - margin, y, { align: 'right' });
  y += 12;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('ITEM:', margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(entry.productName, margin, y);
  y += 5;
  doc.text(entry.variantName, margin, y);
  y += 12;

  // Pricing
  if (entry.originalPrice && entry.discount && entry.discount > 0) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('ORIGINAL PRICE:', margin, y);
    doc.text(formatNaira(entry.originalPrice), pageWidth - margin, y, { align: 'right' });
    y += 5;
    
    doc.setFont('helvetica', 'italic');
    doc.text('DISCOUNT:', margin, y);
    doc.text('-' + formatNaira(entry.discount), pageWidth - margin, y, { align: 'right' });
    y += 8;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', margin, y);
  doc.text(formatNaira(entry.price || 0), pageWidth - margin, y, { align: 'right' });
  y += 15;

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Thank you for your business!', pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.text('Powered by Inventory Master', pageWidth / 2, y, { align: 'center' });

  // Watermark if voided
  if (entry.isVoided) {
    doc.setTextColor(255, 0, 0);
    doc.setFontSize(30);
    doc.setFont('helvetica', 'bold');
    // Save state is sometimes finicky in jspdf depending on version, 
    // but we can just use normal text for compatibility if graphics state GState isn't available
    doc.text('CANCELLED / VOID', pageWidth / 2, 80, { 
      align: 'center', 
      angle: 45
    });
  }

  return doc;
};

export const shareReceipt = async (entry: AuditEntry, profile: UserProfile) => {
  try {
    const doc = generateReceipt(entry, profile);
    const pdfBlob = doc.output('blob');
    const fileName = `Receipt_${entry.productName.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
    const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'Receipt',
          text: `Receipt for ${entry.productName} - ${entry.variantName}`,
        });
        return 'SHARED';
      } catch (error) {
        doc.save(fileName);
        return 'DOWNLOADED';
      }
    } else {
      doc.save(fileName);
      return 'DOWNLOADED';
    }
  } catch (error) {
    return 'FAILED';
  }
};
