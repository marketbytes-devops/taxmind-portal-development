import { Response } from 'express';
import PDFDocument from 'pdfkit';

interface PersonalDetails {
  name: string;
  email: string;
  phone: string;
  dob: string;
  profession: string;
  ppsNumber: string;
  eircode: string;
  maritalStatus: string;
  address: string;
  spouse: {
    name: string;
    email: string;
    phone: string;
    dob: string;
    profession: string;
    ppsNumber: string;
    eircode: string;
    address: string;
  } | null;
}

interface Application {
  applicationNo: string;
  submittedOn: string;
}

interface Question {
  question: string;
  answer: string;
}

interface QuestionnaireCategory {
  category: string;
  questions: Question[];
}

interface TaxData {
  application: Application;
  personalDetails: PersonalDetails;
  questionnaire: QuestionnaireCategory[];
}

export const generateTaxPdf = (data: TaxData, res: Response): void => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  const filename = `tax-summary-${data.application.applicationNo}.pdf`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  doc.pipe(res);

  const pageWidth = doc.page.width - 80; // Account for margins
  const col1Width = pageWidth * 0.25;
  const col2Width = pageWidth * 0.25;
  const col3Width = pageWidth * 0.25;
  const col4Width = pageWidth * 0.25;

  // ===== HEADER =====
  doc
    .fontSize(16)
    .fillColor('#333333')
    .font('Helvetica-Bold')
    .text('Revenue Processing Tax Filing', 40, 40)
    .moveDown(1);

  // ===== APPLICATION NUMBER =====
  doc
    .fontSize(11)
    .fillColor('#333333')
    .font('Helvetica')
    .text(`APPLICATION NO: ${data.application.applicationNo}`)
    .moveDown(1.5);

  // Draw horizontal line
  const lineY = doc.y;
  doc
    .strokeColor('#e0e0e0')
    .lineWidth(1)
    .moveTo(40, lineY)
    .lineTo(doc.page.width - 40, lineY)
    .stroke();

  doc.moveDown(1);

  // ===== PERSONAL DETAILS GRID =====
  const details = data.personalDetails;
  const startX = 40;
  let currentY = doc.y;

  // Helper function to draw a field
  const drawField = (label: string, value: string, x: number, y: number, width: number) => {
    doc
      .fontSize(9)
      .fillColor('#666666')
      .font('Helvetica-Bold')
      .text(label, x, y, { width, lineBreak: false });

    doc
      .fontSize(10)
      .fillColor('#333333')
      .font('Helvetica')
      .text(value, x, y + 15, { width, lineBreak: false });
  };

  // Row 1: Name, Email, Phone Number, Date Of Birth
  drawField('Name', details.name, startX, currentY, col1Width);
  drawField('Email', details.email, startX + col1Width, currentY, col2Width);
  drawField('Phone Number', details.phone, startX + col1Width + col2Width, currentY, col3Width);
  drawField(
    'Date Of Birth',
    details.dob,
    startX + col1Width + col2Width + col3Width,
    currentY,
    col4Width
  );

  currentY += 50;

  // Row 2: Profession, PPS Number, Eircode, Address
  drawField('Profession', details.profession, startX, currentY, col1Width);
  drawField('PPS Number', details.ppsNumber, startX + col1Width, currentY, col2Width);
  drawField('Eircode', details.eircode, startX + col1Width + col2Width, currentY, col3Width);
  drawField(
    'Address',
    details.address,
    startX + col1Width + col2Width + col3Width,
    currentY,
    col4Width
  );

  currentY += 50;

  // Row 3: Marital Status, Submitted On
  drawField('Marital Status', details.maritalStatus, startX, currentY, col1Width);
  drawField('Submitted On', data.application.submittedOn, startX + col1Width, currentY, col2Width);

  currentY += 60;

  // ===== SPOUSE DETAILS =====
  if (details.spouse) {
    // Draw horizontal line
    const spouseLineY = currentY;
    doc
      .strokeColor('#e0e0e0')
      .lineWidth(1)
      .moveTo(40, spouseLineY)
      .lineTo(doc.page.width - 40, spouseLineY)
      .stroke();

    currentY += 20;

    // Spouse Details heading
    doc
      .fontSize(14)
      .fillColor('#333333')
      .font('Helvetica-Bold')
      .text('Spouse Details', startX, currentY);

    currentY += 30;

    const spouse = details.spouse;

    // Row 1: Full Name, Email, Phone Number, Date Of Birth
    drawField('Full Name', spouse.name, startX, currentY, col1Width);
    drawField('Email', spouse.email, startX + col1Width, currentY, col2Width);
    drawField('Phone Number', spouse.phone, startX + col1Width + col2Width, currentY, col3Width);
    drawField(
      'Date Of Birth',
      spouse.dob,
      startX + col1Width + col2Width + col3Width,
      currentY,
      col4Width
    );

    currentY += 50;

    // Row 2: Profession, PPS Number, Eircode, Address
    drawField('Profession', spouse.profession, startX, currentY, col1Width);
    drawField('PPS Number', spouse.ppsNumber, startX + col1Width, currentY, col2Width);
    drawField('Eircode', spouse.eircode, startX + col1Width + col2Width, currentY, col3Width);
    drawField(
      'Address',
      spouse.address,
      startX + col1Width + col2Width + col3Width,
      currentY,
      col4Width
    );

    currentY += 60;
  }

  // Check if we need a new page before questionnaire section
  if (currentY > doc.page.height - 200) {
    doc.addPage();
    currentY = 40;
  }

  // ===== QUESTIONNAIRE OVERVIEW =====
  doc
    .fontSize(12)
    .fillColor('#333333')
    .font('Helvetica-Bold')
    .text('Questionnaire Overview', startX, currentY);

  currentY += 30;

  // Draw each category with box
  data.questionnaire.forEach((category) => {
    // Check if we need a new page for category header
    if (currentY > doc.page.height - 150) {
      doc.addPage();
      currentY = 40;
    }

    let boxStartY = currentY;
    const boxX = startX;
    const boxWidth = pageWidth;

    // Category header with background
    doc.fillColor('#f5f5f5').rect(boxX, boxStartY, boxWidth, 30).fill();

    doc
      .fontSize(10)
      .fillColor('#3b82f6')
      .font('Helvetica-Bold')
      .text(category.category, boxX + 10, boxStartY + 10);

    currentY = boxStartY + 35;

    // Draw questions
    category.questions.forEach((q) => {
      const questionX = boxX + 10;
      const questionWidth = boxWidth - 220;
      const answerX = boxX + boxWidth - 200;
      
      // Calculate question height
      const questionHeight = doc.heightOfString(q.question, { 
        width: questionWidth,
        lineGap: 2
      });
      
      // Check if we need a new page for this question-answer pair
      if (currentY + questionHeight > doc.page.height - 100) {
        // Close current box before page break
        const boxHeight = currentY - boxStartY;
        doc.strokeColor('#e0e0e0').lineWidth(1).rect(boxX, boxStartY, boxWidth, boxHeight).stroke();
        
        doc.addPage();
        currentY = 50; // Start with some top padding on new page
        
        // Reset box start for new page with padding
        boxStartY = 40;
      }

      // Draw question with wrapping enabled
      doc
        .fontSize(9)
        .fillColor('#666666')
        .font('Helvetica')
        .text(q.question, questionX, currentY, { width: questionWidth, lineGap: 2 });

      // Draw answer aligned to the right side
      doc
        .fontSize(9)
        .fillColor('#333333')
        .font('Helvetica-Bold')
        .text(q.answer, answerX, currentY, { width: 190, align: 'left' });

      // Move down based on the taller of question or answer
      const answerHeight = doc.heightOfString(q.answer, { width: 190 });
      currentY += Math.max(questionHeight, answerHeight) + 10;
    });

    // Draw final box border
    const boxHeight = currentY - boxStartY;
    doc.strokeColor('#e0e0e0').lineWidth(1).rect(boxX, boxStartY, boxWidth, boxHeight).stroke();

    currentY += 15;
  });

  // ===== FOOTER =====
  doc
    .fontSize(8)
    .fillColor('#999999')
    .font('Helvetica')
    .text(`Generated on ${new Date().toLocaleString()}`, 40, doc.page.height - 50, {
      align: 'center',
      width: doc.page.width - 80,
    });

  doc.end();
};
