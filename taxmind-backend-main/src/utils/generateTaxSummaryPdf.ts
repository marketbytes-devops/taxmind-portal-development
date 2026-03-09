import PDFDocument from 'pdfkit';

interface SummaryData {
    name: string;
    summary: string;
    year: number | string;
}

export const generateTaxSummaryPdf = async (data: SummaryData): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 40, size: 'A4' });
            const chunks: Buffer[] = [];

            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', (err) => reject(err));

            // Header
            doc.fontSize(16)
                .fillColor('#333333')
                .font('Helvetica-Bold')
                .text('Tax Document Summary', 40, 40)
                .moveDown(1);

            doc.fontSize(11)
                .fillColor('#333333')
                .font('Helvetica')
                .text(`Tax Year: ${data.year}`)
                .moveDown(0.5)
                .text(`Client Name: ${data.name}`)
                .moveDown(1.5);

            const lineY = doc.y;
            doc.strokeColor('#e0e0e0')
                .lineWidth(1)
                .moveTo(40, lineY)
                .lineTo(doc.page.width - 40, lineY)
                .stroke();

            doc.moveDown(1);

            doc.fontSize(10)
                .fillColor('#333333')
                .font('Helvetica');

            doc.text(data.summary, {
                width: doc.page.width - 80,
                align: 'left'
            });

            // Footer
            doc.fontSize(8)
                .fillColor('#999999')
                .text(`Generated on ${new Date().toLocaleString()}`, 40, doc.page.height - 50, {
                    align: 'center',
                    width: doc.page.width - 80,
                });

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
};
