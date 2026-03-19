import PDFDocument from 'pdfkit';

interface SummaryData {
    name: string;
    summary: string;
    year: number | string;
}

// -------------------------------------------------------------
// Regex parsers to pull structured values out of the AI text
// -------------------------------------------------------------
const extractValue = (text: string, key: string, defaultValue = '€0.00'): string => {
    // E.g. "Gross Income: €54,713.21" -> captures "€54,713.21"
    const regex = new RegExp(`${key}:\\s*(.+)`, 'i');
    const match = text.match(regex);
    if (match && match[1] && match[1].trim() !== 'Not Specified') {
        return match[1].trim();
    }
    return defaultValue;
};

// -------------------------------------------------------------
// The Main PDF Builder
// -------------------------------------------------------------
export const generateTaxSummaryPdf = async (data: SummaryData): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 40, size: 'A4' });
            const chunks: Buffer[] = [];

            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', (err) => reject(err));

            // Theme Constants
            const colors = {
                bg: '#0F172A',         // slate-900
                bgLight: '#1E293B',    // slate-800
                textMain: '#F8FAFC',   // slate-50
                textLight: '#94A3B8',  // slate-400
                primary: '#10B981',    // green
                blue: '#3B82F6',       // blue
                yellow: '#F59E0B',     // yellow
                border: '#334155'      // slate-700
            };

            // 1. Draw Full Background Page
            doc.rect(0, 0, doc.page.width, doc.page.height).fill(colors.bg);

            // ---------------------------------------------
            // Extract parsed data from string
            // ---------------------------------------------
            const rawText = data.summary;

            const grossIncome = extractValue(rawText, 'Gross Income', '€0.00');
            const totalTaxPaid = extractValue(rawText, 'Total Tax Paid', '€0.00');
            const payeDeducted = extractValue(rawText, 'PAYE Deducted', '€0.00');
            const uscDeducted = extractValue(rawText, 'USC Deducted', '€0.00');
            const assessmentResult = extractValue(rawText, 'Assessment Result', 'Balanced');
            const assessmentAmount = extractValue(rawText, 'Amount', '€0.00');

            // ---------------------------------------------
            // SECTION: Header
            // ---------------------------------------------
            let currentY = 40;
            const marginX = 40;
            const contentWidth = doc.page.width - (marginX * 2);

            doc.fontSize(22)
                .fillColor(colors.primary)
                .font('Helvetica-Bold')
                .text('TAXMIND.IE', marginX, currentY);

            doc.fontSize(10)
                .fillColor(colors.textLight)
                .font('Helvetica')
                .text(`TAX YEAR`, marginX, currentY, { align: 'right', width: contentWidth });

            doc.fontSize(20)
                .fillColor(colors.textMain)
                .font('Helvetica-Bold')
                .text(`${data.year}`, marginX, currentY + 12, { align: 'right', width: contentWidth });

            currentY += 30;
            doc.fontSize(10)
                .fillColor(colors.textLight)
                .font('Helvetica')
                .text(`Client: ${data.name} · Analysis powered by TaxMind AI`, marginX, currentY);

            // Break Line
            currentY += 25;
            doc.moveTo(marginX, currentY)
                .lineTo(marginX + contentWidth, currentY)
                .strokeColor(colors.border)
                .lineWidth(1)
                .stroke();

            // ---------------------------------------------
            // SECTION: Total Assessment Result
            // ---------------------------------------------
            currentY += 25;

            doc.fontSize(12)
                .fillColor(colors.primary)
                .font('Helvetica-Bold')
                .text(`TOTAL ${assessmentResult.toUpperCase()}`, marginX, currentY);

            currentY += 15;
            doc.fontSize(48)
                .fillColor(colors.primary)
                .font('Helvetica-Bold')
                .text(assessmentAmount, marginX, currentY);

            // ---------------------------------------------
            // SECTION: Metrics Row
            // ---------------------------------------------
            currentY += 50;

            const cardWidth = (contentWidth - 30) / 4; // 4 columns, 10px spacing
            let currentX = marginX;

            const drawMetricCard = (title: string, value: string, subtext: string, color: string, x: number) => {
                // Background Box
                doc.roundedRect(x, currentY, cardWidth, 70, 5)
                    .fillAndStroke(colors.bgLight, color);

                // Content inside
                doc.fontSize(9)
                    .fillColor(colors.textLight)
                    .font('Helvetica')
                    .text(title, x + 10, currentY + 12);

                doc.fontSize(16)
                    .fillColor(color)
                    .font('Helvetica-Bold')
                    .text(value, x + 10, currentY + 28);

                doc.fontSize(8)
                    .fillColor(colors.textLight)
                    .font('Helvetica')
                    .text(subtext, x + 10, currentY + 50);
            };

            // Calculate Effective Rate roughly for display if exact not provided
            let effectiveRate = '0.0%';
            if (grossIncome !== '€0.00' && totalTaxPaid !== '€0.00') {
                const gInc = parseFloat(grossIncome.replace(/[^0-9.]/g, ''));
                const tTax = parseFloat(totalTaxPaid.replace(/[^0-9.]/g, ''));
                if (gInc > 0) {
                    effectiveRate = ((tTax / gInc) * 100).toFixed(1) + '%';
                }
            }

            drawMetricCard('Gross Income', grossIncome, 'Total Recorded', colors.blue, currentX);
            currentX += cardWidth + 10;
            drawMetricCard('Income Tax Paid', payeDeducted, 'PAYE deducted', colors.yellow, currentX);
            currentX += cardWidth + 10;
            drawMetricCard('USC Paid', uscDeducted, 'Universal Social Charge', colors.textLight, currentX);
            currentX += cardWidth + 10;
            drawMetricCard('Effective Rate', effectiveRate, 'Tax + USC on gross', colors.primary, currentX);

            // ---------------------------------------------
            // SECTION: Plain English Detailed Text (The raw AI Summary)
            // ---------------------------------------------
            currentY += 85;

            doc.fontSize(12)
                .fillColor(colors.textLight)
                .font('Helvetica-Bold')
                .text('RAW AI SUMMARY ANALYSIS', marginX, currentY);

            currentY += 20;

            doc.fontSize(9) // Reduce font size to fit on one page
                .fillColor(colors.textMain)
                .font('Helvetica')
                .text(rawText, marginX, currentY, {
                    width: contentWidth,
                    lineGap: 3
                });

            // Footer
            doc.fontSize(8)
                .fillColor(colors.textLight)
                .font('Helvetica')
                .text(`Automated TaxMind Document Generator • ${new Date().toLocaleDateString()}`, 40, doc.page.height - 40, {
                    align: 'center',
                    width: doc.page.width - 80,
                });

            doc.end();
        } catch (err) {
            reject(err);
        }
    });
};
