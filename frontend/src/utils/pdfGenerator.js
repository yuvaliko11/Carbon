import { jsPDF } from 'jspdf';

export const generateLeasePDF = (lease) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;

    // Helper for adding text
    const addText = (text, fontSize = 10, isBold = false) => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        doc.text(text, margin, y);
        y += (fontSize / 2) + 2;
    };

    const addKeyValue = (key, value) => {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${key}:`, margin, y);
        doc.setFont('helvetica', 'normal');
        doc.text(`${value || 'N/A'}`, margin + 40, y);
        y += 7;
    };

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Lease Summary', pageWidth / 2, y, { align: 'center' });
    y += 15;

    // Basic Info
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Contract Details', margin, y);
    y += 10;

    // Draw a line
    doc.setLineWidth(0.5);
    doc.line(margin, y - 5, pageWidth - margin, y - 5);

    addKeyValue('Lease Number', lease.leaseNumber);
    addKeyValue('Status', lease.status);
    addKeyValue('Type', lease.type);
    addKeyValue('Purpose', lease.purpose);
    addKeyValue('Term', `${lease.termYears} Years`);
    addKeyValue('Start Date', new Date(lease.startDate).toLocaleDateString());
    addKeyValue('Expiry Date', new Date(lease.expiryDate).toLocaleDateString());

    y += 5;
    addKeyValue('Annual Rent', `${lease.annualRent?.amount || 0} ${lease.annualRent?.currency || 'FJD'}`);
    addKeyValue('Payable', lease.annualRent?.payableInAdvance ? 'In Advance' : 'In Arrears');

    y += 10;

    // Parties
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Parties', margin, y);
    y += 10;
    doc.line(margin, y - 5, pageWidth - margin, y - 5);

    addKeyValue('Lessor (Land Unit)', lease.lessorLandUnit?.name);
    addKeyValue('Lessee', lease.lesseeOrganization?.name);

    y += 10;

    // Parcels
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Parcels (${lease.parcels?.length || 0})`, margin, y);
    y += 10;
    doc.line(margin, y - 5, pageWidth - margin, y - 5);

    if (lease.parcels && lease.parcels.length > 0) {
        lease.parcels.forEach((p, index) => {
            const parcelName = p.parcel?.name || `Parcel ${index + 1}`;
            const area = `${p.areaHaAtGrant} Ha`;
            const carbon = p.isDemarcatedForCarbon ? '(Demarcated for Carbon)' : '';
            addText(`${index + 1}. ${parcelName} - ${area} ${carbon}`);
        });
    } else {
        addText('No parcels listed.');
    }

    y += 10;

    // Documents
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Documents (${lease.documents?.length || 0})`, margin, y);
    y += 10;
    doc.line(margin, y - 5, pageWidth - margin, y - 5);

    if (lease.documents && lease.documents.length > 0) {
        lease.documents.forEach((d, index) => {
            const date = new Date(d.uploadedAt).toLocaleDateString();
            addText(`${index + 1}. ${d.name} (${d.type}) - Uploaded: ${date}`);
            // Optional: Add URL if clickable (though standard PDF viewers handle links differently)
        });
    } else {
        addText('No documents attached.');
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Generated on ${new Date().toLocaleString()}`, margin, doc.internal.pageSize.getHeight() - 10);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
    }

    // Save
    doc.save(`Lease-${lease.leaseNumber}.pdf`);
};

export const generateLeasePDFBlob = (lease) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;

    // Helper for adding text
    const addText = (text, fontSize = 10, isBold = false) => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        doc.text(text, margin, y);
        y += (fontSize / 2) + 2;
    };

    const addKeyValue = (key, value) => {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${key}:`, margin, y);
        doc.setFont('helvetica', 'normal');
        doc.text(`${value || 'N/A'}`, margin + 40, y);
        y += 7;
    };

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Lease Summary', pageWidth / 2, y, { align: 'center' });
    y += 15;

    // Basic Info
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Contract Details', margin, y);
    y += 10;

    // Draw a line
    doc.setLineWidth(0.5);
    doc.line(margin, y - 5, pageWidth - margin, y - 5);

    addKeyValue('Lease Number', lease.leaseNumber);
    addKeyValue('Status', lease.status);
    addKeyValue('Type', lease.type);
    addKeyValue('Purpose', lease.purpose);
    addKeyValue('Term', `${lease.termYears} Years`);
    addKeyValue('Start Date', new Date(lease.startDate).toLocaleDateString());
    addKeyValue('Expiry Date', new Date(lease.expiryDate).toLocaleDateString());

    y += 5;
    addKeyValue('Annual Rent', `${lease.annualRent?.amount || 0} ${lease.annualRent?.currency || 'FJD'}`);
    addKeyValue('Payable', lease.annualRent?.payableInAdvance ? 'In Advance' : 'In Arrears');

    y += 10;

    // Parties
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Parties', margin, y);
    y += 10;
    doc.line(margin, y - 5, pageWidth - margin, y - 5);

    addKeyValue('Lessor (Land Unit)', lease.lessorLandUnit?.name);
    addKeyValue('Lessee', lease.lesseeOrganization?.name);

    y += 10;

    // Parcels
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Parcels (${lease.parcels?.length || 0})`, margin, y);
    y += 10;
    doc.line(margin, y - 5, pageWidth - margin, y - 5);

    if (lease.parcels && lease.parcels.length > 0) {
        lease.parcels.forEach((p, index) => {
            const parcelName = p.parcel?.name || `Parcel ${index + 1}`;
            const area = `${p.areaHaAtGrant} Ha`;
            const carbon = p.isDemarcatedForCarbon ? '(Demarcated for Carbon)' : '';
            addText(`${index + 1}. ${parcelName} - ${area} ${carbon}`);
        });
    } else {
        addText('No parcels listed.');
    }

    y += 10;

    // Documents
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Documents (${lease.documents?.length || 0})`, margin, y);
    y += 10;
    doc.line(margin, y - 5, pageWidth - margin, y - 5);

    if (lease.documents && lease.documents.length > 0) {
        lease.documents.forEach((d, index) => {
            const date = new Date(d.uploadedAt).toLocaleDateString();
            addText(`${index + 1}. ${d.name} (${d.type}) - Uploaded: ${date}`);
        });
    } else {
        addText('No documents attached.');
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`Generated on ${new Date().toLocaleString()}`, margin, doc.internal.pageSize.getHeight() - 10);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
    }

    return doc.output('blob');
};
