import PDFDocument from 'pdfkit';

type Indicator = {
  displayName: string;
  description: string;
  alignedSoftSkills: string[];
};

type Section = {
  top1Indicator?: Indicator | null;
  top2Indicator?: Indicator | null;
  top3Indicator?: Indicator | null;
};

interface PDFOptions {
  domain1: string;
  domain2: string;
  domain3: string;
  domain1ScoreAcquired: number;
  domain1ScoreToWork: number;
  domain2ScoreAcquired: number;
  domain2ScoreToWork: number;
  domain3ScoreAcquired: number;
  domain3ScoreToWork: number;
  surveyScore: number;
  personalityTrait: string;
  traitDescription: string;
  keyStrengths: Section;
  growthOpportunities: Section;
}

export const generateSurveyResultPdf = (pdfOptions: PDFOptions, stream: NodeJS.WritableStream) => {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
  });

  doc.pipe(stream);

  // Colors and Fonts
  const purple = '#7E22CE';
  const gray = '#666666';
  const lightGray = '#F5F5F5';
  const orange = '#F97316';

  const imagePath = './public/images/success-cup.png';
  const pageWidth = doc.page.width;
  const imageWidth = 100;

  doc.image(imagePath, (pageWidth - imageWidth) / 2, 50, { width: imageWidth });

  doc.moveDown(6);

  doc.moveDown(2);
  // Score
  doc
    .font('Helvetica-Bold')
    .fontSize(20)
    .fillColor(orange)
    .text(`Your Score : ${pdfOptions.surveyScore}`, {
      align: 'center',
    });

  doc.moveDown(0.5).fontSize(15).fillColor(gray).text('Thank you for participating in the survey', {
    align: 'center',
  });

  // -------------------------------------------------------------------------------------------------------------------------
  // --------------------------------------------- MATRIX FOR SCORING LAYOUT -------------------------------------------------
  // -------------------------------------------------------------------------------------------------------------------------

  doc
    .moveDown(1.5)
    .font('Helvetica-Bold')
    .fontSize(14)
    .fillColor('black')
    .text('Matrix for Scoring', {
      align: 'center',
    });

  // Table
  doc.moveDown(1);
  const tableTop = doc.y;

  const tableData = [
    [
      `${pdfOptions.domain1}`,
      `Acquired: ${pdfOptions.domain1ScoreAcquired}%`,
      `To work: ${pdfOptions.domain1ScoreToWork}%`,
    ],
    [
      `${pdfOptions.domain2}`,
      `Acquired: ${pdfOptions.domain2ScoreAcquired}%`,
      `To work: ${pdfOptions.domain2ScoreToWork}%`,
    ],
    [
      `${pdfOptions.domain3}`,
      `Acquired: ${pdfOptions.domain3ScoreAcquired}%`,
      `To work: ${pdfOptions.domain3ScoreToWork}%`,
    ],
  ];

  tableData.forEach((row, i) => {
    const rowY = tableTop + i * 30;
    const bgColor = i % 2 === 0 ? '#F9FAFB' : lightGray;
    // const bgColor = i % 2 === 0 ? lightGray : lightGray;

    doc
      .rect(50, rowY, 500, 30)
      .fill(bgColor)
      .fillColor(purple)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text(row[0], 60, rowY + 8);

    doc
      .fillColor('black')
      .font('Helvetica')
      .text(row[1], 200, rowY + 8)
      .text(row[2], 370, rowY + 8);
  });

  doc.moveDown(3);

  // -------------------------------------------------------------------------------------------------------------------------
  // --------------------------------------------- PERSONALITY LAYOUT -------------------------------------------------------
  // -------------------------------------------------------------------------------------------------------------------------

  doc
    .font('Helvetica-Bold')
    .fontSize(13)
    .text('Your Trait', 255, doc.y + 2, { width: 460 });

  doc.moveDown(0.7);

  // // Description Box
  doc.roundedRect(50, doc.y, 500, 400, 10).fillAndStroke(lightGray, lightGray);

  doc.moveDown(0.7);

  doc
    .fillColor('#77C388')
    .font('Helvetica-Bold')
    .fontSize(11)
    .text(pdfOptions.personalityTrait, 60, doc.y + 2, { width: 460 });

  doc.moveDown(0.7);

  doc
    .font('Helvetica')
    .fontSize(12)
    .fillColor(gray)
    .text(pdfOptions.traitDescription, 60, doc.y + 2, { width: 460 });

  doc.addPage({ size: 'A4', margin: 50 });

  // Background
  doc.rect(0, 0, 595.28, 841.89).fill('#fff');

  // -------------------------------------------------------------------------------------------------------------------------
  // --------------------------------------------- KEY STRENGHT LAYOUT -------------------------------------------------------
  // -------------------------------------------------------------------------------------------------------------------------
  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .fillColor('#000')
    .text('Key Strengths', 10, 40, { align: 'center' });

  // Outer rounded rectangle
  const boxX = 60;
  const boxY = 65;
  const boxWidth = 480;
  const boxHeight = 430;
  doc
    .save()
    .lineWidth(1)
    .strokeColor('#6B0AF7')
    .roundedRect(boxX, boxY, boxWidth, boxHeight, 18)
    .stroke()
    .restore();

  // Section 1
  let y = boxY + 20;

  if (pdfOptions.keyStrengths.top1Indicator) {
    const top1Indicator = pdfOptions.keyStrengths.top1Indicator;

    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#222')
      .text(`1. ${top1Indicator.displayName}: `, boxX + 20, y, {
        width: boxWidth - 40,
        continued: true,
      })
      .font('Helvetica')
      .text(top1Indicator.description, boxX + 20, y, { width: boxWidth - 40 });

    y += 35;

    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#222')
      .text('Soft Skills', boxX + 20, y, { width: boxWidth - 40 });

    y += 20;

    // Tags for Section 1
    drawTag(doc, top1Indicator.alignedSoftSkills[0], boxX + 20, y);
    drawTag(doc, top1Indicator.alignedSoftSkills[1], boxX + 240, y);
    drawTag(doc, top1Indicator.alignedSoftSkills[2], boxX + 20, y + 30);
    drawTag(doc, top1Indicator.alignedSoftSkills[3], boxX + 240, y + 30);
  }

  y += 60;

  // Divider
  drawDivider(doc, boxX + 10, y, boxWidth - 20);
  y += 15;

  // Section 2
  if (pdfOptions.keyStrengths.top2Indicator) {
    const top2Indicator = pdfOptions.keyStrengths.top2Indicator;
    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#222')
      .text(`2. ${top2Indicator.displayName}: `, boxX + 20, y, {
        width: boxWidth - 40,
        continued: true,
      })
      .font('Helvetica')
      .text(top2Indicator.description, boxX + 20, y, { width: boxWidth - 40 });
    y += 35;

    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#222')
      .text('Soft Skills', boxX + 20, y, { width: boxWidth - 40 });

    y += 20;

    // Tags for Section 2
    drawTag(doc, top2Indicator.alignedSoftSkills[0], boxX + 20, y);
    drawTag(doc, top2Indicator.alignedSoftSkills[1], boxX + 240, y);
    drawTag(doc, top2Indicator.alignedSoftSkills[2], boxX + 20, y + 30);
    drawTag(doc, top2Indicator.alignedSoftSkills[3], boxX + 240, y + 30);
  }

  y += 60;

  // Divider
  drawDivider(doc, boxX + 10, y, boxWidth - 20);
  y += 15;

  // Section 3
  if (pdfOptions.keyStrengths.top3Indicator) {
    const top3Indicator = pdfOptions.keyStrengths.top3Indicator;
    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#222')
      .text(`3. ${top3Indicator.displayName}: `, boxX + 20, y, {
        width: boxWidth - 40,
        continued: true,
      })
      .font('Helvetica')
      .text(top3Indicator.description, boxX + 20, y, { width: boxWidth - 40 });
    y += 35;

    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#222')
      .text('Soft Skills', boxX + 20, y, { width: boxWidth - 40 });

    y += 20;

    // Tags for Section 3
    drawTag(doc, top3Indicator.alignedSoftSkills[0], boxX + 20, y);
    drawTag(doc, top3Indicator.alignedSoftSkills[1], boxX + 240, y);
    drawTag(doc, top3Indicator.alignedSoftSkills[2], boxX + 20, y + 30);
    drawTag(doc, top3Indicator.alignedSoftSkills[3], boxX + 240, y + 30);
  }

  y += 60;

  // Bottom divider
  drawDivider(doc, boxX + 10, y, boxWidth - 20);
  y += 20;

  // -------------------------------------------------------------------------------------------------------------------------
  // --------------------------------------------- GROWTH OPPORTUNITIES LAYOUT -----------------------------------------------
  // -------------------------------------------------------------------------------------------------------------------------

  doc.addPage({ size: 'A4', margin: 50 });

  doc
    .font('Helvetica-Bold')
    .fontSize(14)
    .fillColor('#000')
    .text('Growth Opportunities', 10, 40, { align: 'center' });

  // Outer rounded rectangle
  // const boxX = 60;
  // const boxY = 80;
  // const boxWidth = 480;
  // const boxHeight = 430;
  doc
    .save()
    .lineWidth(1)
    .strokeColor('#6B0AF7')
    .roundedRect(boxX, boxY, boxWidth, boxHeight, 18)
    .stroke()
    .restore();

  // Section 1
  y = boxY + 20;

  if (pdfOptions.growthOpportunities.top1Indicator) {
    const top1Indicator = pdfOptions.growthOpportunities.top1Indicator;

    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#222')
      .text(`1. ${top1Indicator.displayName}: `, boxX + 20, y, {
        width: boxWidth - 40,
        continued: true,
      })
      .font('Helvetica')
      .text(top1Indicator.description, boxX + 20, y, { width: boxWidth - 40 });

    y += 35;

    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#222')
      .text('Soft Skills', boxX + 20, y, { width: boxWidth - 40 });

    y += 20;

    // Tags for Section 1
    drawTag(doc, top1Indicator.alignedSoftSkills[0], boxX + 20, y);
    drawTag(doc, top1Indicator.alignedSoftSkills[1], boxX + 240, y);
    drawTag(doc, top1Indicator.alignedSoftSkills[2], boxX + 20, y + 30);
    drawTag(doc, top1Indicator.alignedSoftSkills[3], boxX + 240, y + 30);
  }

  y += 60;

  // Divider
  drawDivider(doc, boxX + 10, y, boxWidth - 20);
  y += 15;

  // Section 2
  if (pdfOptions.growthOpportunities.top2Indicator) {
    const top2Indicator = pdfOptions.growthOpportunities.top2Indicator;
    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#222')
      .text(`2. ${top2Indicator.displayName}: `, boxX + 20, y, {
        width: boxWidth - 40,
        continued: true,
      })
      .font('Helvetica')
      .text(top2Indicator.description, boxX + 20, y, { width: boxWidth - 40 });
    y += 35;

    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#222')
      .text('Soft Skills', boxX + 20, y, { width: boxWidth - 40 });

    y += 20;

    // Tags for Section 2
    drawTag(doc, top2Indicator.alignedSoftSkills[0], boxX + 20, y);
    drawTag(doc, top2Indicator.alignedSoftSkills[1], boxX + 240, y);
    drawTag(doc, top2Indicator.alignedSoftSkills[2], boxX + 20, y + 30);
    drawTag(doc, top2Indicator.alignedSoftSkills[3], boxX + 240, y + 30);
  }

  y += 60;

  // Divider
  drawDivider(doc, boxX + 10, y, boxWidth - 20);
  y += 15;

  // Section 3
  if (pdfOptions.growthOpportunities.top3Indicator) {
    const top3Indicator = pdfOptions.growthOpportunities.top3Indicator;
    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#222')
      .text(`3. ${top3Indicator.displayName}: `, boxX + 20, y, {
        width: boxWidth - 40,
        continued: true,
      })
      .font('Helvetica')
      .text(top3Indicator.description, boxX + 20, y, { width: boxWidth - 40 });
    y += 35;

    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#222')
      .text('Soft Skills', boxX + 20, y, { width: boxWidth - 40 });

    y += 20;

    // Tags for Section 3
    drawTag(doc, top3Indicator.alignedSoftSkills[0], boxX + 20, y);
    drawTag(doc, top3Indicator.alignedSoftSkills[1], boxX + 240, y);
    drawTag(doc, top3Indicator.alignedSoftSkills[2], boxX + 20, y + 30);
    drawTag(doc, top3Indicator.alignedSoftSkills[3], boxX + 240, y + 30);
  }

  y += 60;

  // Bottom divider
  drawDivider(doc, boxX + 10, y, boxWidth - 20);
  y += 20;

  doc.end();
};

// -----------------------------------------------------------------------------------------------------------------
// ----------------------------------------------HELPER FUNCTIONS---------------------------------------------------
// -----------------------------------------------------------------------------------------------------------------

// Helper to draw a tag
function drawTag(doc: PDFKit.PDFDocument, text: string, x: number, y: number) {
  const paddingX = 10;
  doc.font('Helvetica').fontSize(11);
  const textWidth = doc.widthOfString(text);
  const tagWidth = textWidth + paddingX * 2;
  const tagHeight = 22;

  doc
    .save()
    .roundedRect(x, y, tagWidth, tagHeight, 7)
    .fillAndStroke('#F5F5F5', '#F5F5F5')
    .restore();

  doc.fillColor('#6B0AF7').text(text, x + paddingX, y + 5, { lineBreak: false });
}

// Helper to draw divider
function drawDivider(doc: PDFKit.PDFDocument, x: number, y: number, width: number) {
  doc
    .save()
    .moveTo(x, y)
    .lineTo(x + width, y)
    .lineWidth(1)
    .strokeColor('#e0e0e0')
    .stroke()
    .restore();
}
