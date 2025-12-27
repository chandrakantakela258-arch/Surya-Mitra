import { PDFDocument, rgb, StandardFonts, PDFPage, PDFFont, RGB } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

export interface ProposalPDFData {
  customerName: string;
  capacity: number;
  panelType: string;
  inverterType: string;
  totalCost: number;
  centralSubsidy: number;
  stateSubsidy: number;
  totalSubsidy: number;
  netCost: number;
  downPayment: number;
  downPaymentPercent: number;
  loanAmount: number;
  selectedTenure: number;
  selectedEmi: number;
  monthlySavings: number;
  annualSavings: number;
  monthlyGeneration: number;
  paybackYears: number;
  state?: string;
  partnerName?: string;
  partnerPhone?: string;
  installationAddress?: string;
  interestRate?: number;
  electricityRate?: number;
  emi36Months?: number;
  emi48Months?: number;
  emi60Months?: number;
  emi72Months?: number;
  emi84Months?: number;
  ratePerWatt?: number;
}

const pdfDir = path.join(process.cwd(), 'uploads', 'proposals');
if (!fs.existsSync(pdfDir)) {
  fs.mkdirSync(pdfDir, { recursive: true });
}

function formatINR(amount: number): string {
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0
  }).format(amount);
  return `Rs ${formatted}`;
}

function calculateEMI(principal: number, annualRate: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0;
  const monthlyRate = annualRate / 12 / 100;
  if (monthlyRate === 0) return principal / months;
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
  return Math.round(emi);
}

export async function generateProposalPDF(data: ProposalPDFData): Promise<string> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const orange = rgb(1, 0.4, 0);
  const green = rgb(0.13, 0.55, 0.13);
  const blue = rgb(0.1, 0.46, 0.82);
  const purple = rgb(0.48, 0.12, 0.64);
  const gray = rgb(0.4, 0.4, 0.4);
  const lightGray = rgb(0.6, 0.6, 0.6);
  const black = rgb(0, 0, 0);
  const white = rgb(1, 1, 1);
  
  const margin = 50;
  const pageWidth = 595;
  const pageHeight = 842;
  const contentWidth = pageWidth - 2 * margin;
  
  const interestRate = data.interestRate || 10;
  const electricityRate = data.electricityRate || 7;
  
  const emi36 = data.emi36Months || calculateEMI(data.loanAmount, interestRate, 36);
  const emi48 = data.emi48Months || calculateEMI(data.loanAmount, interestRate, 48);
  const emi60 = data.emi60Months || calculateEMI(data.loanAmount, interestRate, 60);
  const emi72 = data.emi72Months || calculateEMI(data.loanAmount, interestRate, 72);
  const emi84 = data.emi84Months || calculateEMI(data.loanAmount, interestRate, 84);

  // ========== PAGE 1: Cover Page ==========
  const page1 = pdfDoc.addPage([pageWidth, pageHeight]);
  
  // Header banner
  page1.drawRectangle({
    x: 0, y: pageHeight - 120, width: pageWidth, height: 120, color: orange,
  });
  
  page1.drawText('Divyanshi Solar', {
    x: margin, y: pageHeight - 55, size: 32, font: fontBold, color: white,
  });
  
  page1.drawText('PM Surya Ghar Yojana Authorized Partner', {
    x: margin, y: pageHeight - 85, size: 14, font: font, color: white,
  });
  
  page1.drawText('www.divyanshisolar.com', {
    x: margin, y: pageHeight - 105, size: 12, font: font, color: rgb(1, 0.9, 0.8),
  });
  
  // Main title
  let y = pageHeight - 180;
  page1.drawText('Solar Installation Proposal', {
    x: margin, y, size: 28, font: fontBold, color: black,
  });
  
  y -= 50;
  page1.drawText(`Prepared for: ${data.customerName || 'Valued Customer'}`, {
    x: margin, y, size: 18, font: font, color: gray,
  });
  
  y -= 30;
  page1.drawText(`Date: ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, {
    x: margin, y, size: 14, font: font, color: lightGray,
  });
  
  if (data.state) {
    y -= 25;
    page1.drawText(`Location: ${data.state}`, {
      x: margin, y, size: 14, font: font, color: lightGray,
    });
  }
  
  // Highlight box with key numbers
  y -= 60;
  page1.drawRectangle({
    x: margin, y: y - 180, width: contentWidth, height: 190,
    color: rgb(0.98, 0.96, 0.93), borderColor: orange, borderWidth: 2,
  });
  
  page1.drawText('Proposal Highlights', {
    x: margin + 20, y: y - 30, size: 16, font: fontBold, color: orange,
  });
  
  const highlights = [
    [`System Capacity:`, `${data.capacity} kWp ${data.panelType === 'dcr' ? 'DCR' : 'Non-DCR'} Solar Plant`],
    [`Inverter Type:`, data.inverterType === 'hybrid' ? '3-in-1 Hybrid Inverter' : 'Ongrid Inverter'],
    [`Total Investment:`, formatINR(data.totalCost)],
    [`Government Subsidy:`, formatINR(data.totalSubsidy)],
    [`Your Net Cost:`, formatINR(data.netCost)],
    [`Monthly Savings:`, formatINR(data.monthlySavings)],
  ];
  
  let hy = y - 55;
  highlights.forEach(([label, value]) => {
    page1.drawText(label, { x: margin + 20, y: hy, size: 12, font: font, color: gray });
    page1.drawText(value, { x: margin + 200, y: hy, size: 12, font: fontBold, color: black });
    hy -= 22;
  });
  
  // Installation address if provided
  if (data.installationAddress) {
    y -= 220;
    page1.drawRectangle({
      x: margin, y: y - 60, width: contentWidth, height: 70,
      color: rgb(0.95, 0.97, 1), borderColor: blue, borderWidth: 1,
    });
    
    page1.drawText('Installation Site Address', {
      x: margin + 15, y: y - 20, size: 12, font: fontBold, color: blue,
    });
    
    const addressLines = data.installationAddress.match(/.{1,80}/g) || [data.installationAddress];
    let ay = y - 40;
    addressLines.slice(0, 2).forEach(line => {
      page1.drawText(line, { x: margin + 15, y: ay, size: 11, font: font, color: black });
      ay -= 16;
    });
  }
  
  // Partner info
  if (data.partnerName || data.partnerPhone) {
    const partnerY = 150;
    page1.drawRectangle({
      x: margin, y: partnerY - 60, width: contentWidth, height: 70,
      color: rgb(0.93, 0.98, 0.93), borderColor: green, borderWidth: 2,
    });
    
    page1.drawText('Your District Partner', {
      x: margin + 15, y: partnerY - 20, size: 14, font: fontBold, color: green,
    });
    
    const partnerInfo = data.partnerName 
      ? `${data.partnerName}${data.partnerPhone ? ` | Mobile: +91-${data.partnerPhone}` : ''}`
      : `Mobile: +91-${data.partnerPhone}`;
    
    page1.drawText(partnerInfo, {
      x: margin + 15, y: partnerY - 45, size: 12, font: font, color: black,
    });
  }
  
  // Footer
  drawFooter(page1, font, 1);

  // ========== PAGE 2: System Details & Cost Breakdown ==========
  const page2 = pdfDoc.addPage([pageWidth, pageHeight]);
  drawHeader(page2, fontBold, font, 'System Details & Investment');
  
  y = pageHeight - 140;
  
  // System Specifications - increased height to accommodate all 6 items
  page2.drawRectangle({
    x: margin, y: y - 160, width: contentWidth, height: 170,
    color: rgb(1, 0.97, 0.93), borderColor: orange, borderWidth: 1,
  });
  
  page2.drawText('System Specifications', {
    x: margin + 15, y: y - 25, size: 14, font: fontBold, color: orange,
  });
  
  const panelLabel = data.panelType === 'dcr' ? 'DCR (Domestic Content Requirement)' : 'Non-DCR (Imported)';
  const inverterLabel = data.inverterType === 'hybrid' ? '3-in-1 Hybrid Inverter (with Battery Support)' : 'Ongrid Inverter';
  const ratePerWatt = data.ratePerWatt || (data.panelType === 'dcr' ? (data.inverterType === 'hybrid' ? 52 : 45) : 40);
  
  const specs = [
    ['Solar Plant Capacity:', `${data.capacity} kWp (${data.capacity * 1000} Watts)`],
    ['Panel Type:', panelLabel],
    ['Inverter Type:', inverterLabel],
    ['Rate per Watt:', `Rs ${ratePerWatt}/Watt`],
    ['Expected Daily Generation:', `${Math.round(data.capacity * 4)} kWh/day`],
    ['Expected Monthly Generation:', `${Math.round(data.monthlyGeneration)} kWh/month`],
  ];
  
  let sy = y - 50;
  specs.forEach(([label, value]) => {
    page2.drawText(label, { x: margin + 15, y: sy, size: 11, font: font, color: gray });
    page2.drawText(value, { x: margin + 220, y: sy, size: 11, font: fontBold, color: black });
    sy -= 20;
  });
  
  y -= 190;
  
  // Investment Breakdown
  page2.drawRectangle({
    x: margin, y: y - 150, width: contentWidth, height: 160,
    color: rgb(0.95, 0.97, 1), borderColor: blue, borderWidth: 1,
  });
  
  page2.drawText('Investment Breakdown', {
    x: margin + 15, y: y - 25, size: 14, font: fontBold, color: blue,
  });
  
  const costs: Array<{ label: string; value: string; valueColor: RGB }> = [
    { label: 'Total System Cost:', value: formatINR(data.totalCost), valueColor: black },
    { label: 'Central Government Subsidy:', value: `- ${formatINR(data.centralSubsidy)}`, valueColor: green },
    { label: 'State Government Subsidy:', value: `- ${formatINR(data.stateSubsidy)}`, valueColor: green },
    { label: 'Total Subsidy:', value: `- ${formatINR(data.totalSubsidy)}`, valueColor: green },
  ];
  
  sy = y - 50;
  costs.forEach(({ label, value, valueColor }) => {
    page2.drawText(label, { x: margin + 15, y: sy, size: 11, font: font, color: gray });
    page2.drawText(value, { x: margin + 280, y: sy, size: 11, font: fontBold, color: valueColor });
    sy -= 20;
  });
  
  // Net cost highlight
  sy -= 10;
  page2.drawRectangle({
    x: margin + 10, y: sy - 20, width: contentWidth - 20, height: 30,
    color: rgb(0.9, 0.95, 1), borderColor: blue, borderWidth: 1,
  });
  page2.drawText('Your Net Investment:', { x: margin + 20, y: sy - 12, size: 13, font: fontBold, color: blue });
  page2.drawText(formatINR(data.netCost), { x: margin + 280, y: sy - 12, size: 14, font: fontBold, color: blue });
  
  y -= 180;
  
  // Subsidy Details
  if (data.panelType === 'dcr') {
    page2.drawRectangle({
      x: margin, y: y - 150, width: contentWidth, height: 160,
      color: rgb(0.93, 0.98, 0.93), borderColor: green, borderWidth: 1,
    });
    
    page2.drawText('PM Surya Ghar Yojana - Subsidy Details', {
      x: margin + 15, y: y - 25, size: 14, font: fontBold, color: green,
    });
    
    const subsidyInfo = [
      'Central Subsidy Structure (for Residential DCR Installations):',
      '  - Up to 2 kW: Rs 30,000 per kW',
      '  - 2 kW to 3 kW: Rs 18,000 per kW (for capacity above 2 kW)',
      '  - Above 3 kW: Maximum subsidy capped at Rs 78,000',
      '',
      data.state ? `State Subsidy (${data.state}): ${formatINR(data.stateSubsidy)}` : 'State Subsidy: Check with your district partner',
    ];
    
    sy = y - 50;
    subsidyInfo.forEach(line => {
      const isIndented = line.startsWith('  ');
      page2.drawText(line, { 
        x: margin + (isIndented ? 25 : 15), 
        y: sy, 
        size: 10, 
        font: isIndented ? font : fontBold, 
        color: isIndented ? gray : black 
      });
      sy -= 16;
    });
  }
  
  drawFooter(page2, font, 2);

  // ========== PAGE 3: Payment Options & EMI Comparison ==========
  const page3 = pdfDoc.addPage([pageWidth, pageHeight]);
  drawHeader(page3, fontBold, font, 'Payment Options & EMI Plans');
  
  y = pageHeight - 140;
  
  // Payment Structure
  page3.drawRectangle({
    x: margin, y: y - 100, width: contentWidth, height: 110,
    color: rgb(0.95, 0.93, 0.98), borderColor: purple, borderWidth: 1,
  });
  
  page3.drawText('Your Payment Structure', {
    x: margin + 15, y: y - 25, size: 14, font: fontBold, color: purple,
  });
  
  const paymentInfo = [
    [`Down Payment (${data.downPaymentPercent}%):`, formatINR(data.downPayment)],
    ['Loan Amount:', formatINR(data.loanAmount)],
    [`Selected EMI (${data.selectedTenure} months):`, `${formatINR(data.selectedEmi)}/month`],
    [`Interest Rate:`, `${interestRate}% per annum`],
  ];
  
  sy = y - 50;
  paymentInfo.forEach(([label, value]) => {
    page3.drawText(label, { x: margin + 15, y: sy, size: 11, font: font, color: gray });
    page3.drawText(value, { x: margin + 250, y: sy, size: 11, font: fontBold, color: black });
    sy -= 18;
  });
  
  y -= 130;
  
  // EMI Comparison Table
  page3.drawText('EMI Options Comparison', {
    x: margin, y, size: 14, font: fontBold, color: black,
  });
  
  y -= 25;
  
  // Table header
  page3.drawRectangle({
    x: margin, y: y - 25, width: contentWidth, height: 30,
    color: blue,
  });
  
  const colWidths = [100, 100, 120, 175];
  let colX = margin;
  ['Tenure', 'Monthly EMI', 'Total Interest', 'Total Payment'].forEach((header, i) => {
    page3.drawText(header, { x: colX + 10, y: y - 18, size: 11, font: fontBold, color: white });
    colX += colWidths[i];
  });
  
  y -= 25;
  
  // Table rows
  const emiOptions = [
    { tenure: 36, emi: emi36 },
    { tenure: 48, emi: emi48 },
    { tenure: 60, emi: emi60 },
    { tenure: 72, emi: emi72 },
    { tenure: 84, emi: emi84 },
  ];
  
  emiOptions.forEach((option, index) => {
    const rowColor = index % 2 === 0 ? rgb(0.97, 0.97, 0.97) : white;
    const isSelected = option.tenure === data.selectedTenure;
    
    page3.drawRectangle({
      x: margin, y: y - 25, width: contentWidth, height: 28,
      color: isSelected ? rgb(0.9, 0.95, 1) : rowColor,
      borderColor: isSelected ? blue : rgb(0.9, 0.9, 0.9),
      borderWidth: isSelected ? 2 : 1,
    });
    
    const totalPayment = option.emi * option.tenure;
    const totalInterest = totalPayment - data.loanAmount;
    
    colX = margin;
    const rowData = [
      `${option.tenure} months`,
      formatINR(option.emi),
      formatINR(totalInterest),
      formatINR(totalPayment),
    ];
    
    rowData.forEach((cell, i) => {
      page3.drawText(cell, { 
        x: colX + 10, 
        y: y - 18, 
        size: 10, 
        font: isSelected ? fontBold : font, 
        color: isSelected ? blue : black 
      });
      colX += colWidths[i];
    });
    
    y -= 28;
  });
  
  y -= 30;
  
  // Effective Cost After Savings
  page3.drawRectangle({
    x: margin, y: y - 90, width: contentWidth, height: 100,
    color: rgb(0.93, 0.98, 0.93), borderColor: green, borderWidth: 2,
  });
  
  page3.drawText('Effective Monthly Cost (After Power Savings)', {
    x: margin + 15, y: y - 25, size: 14, font: fontBold, color: green,
  });
  
  const effectiveEmi = Math.max(0, data.selectedEmi - data.monthlySavings);
  
  const effectiveInfo = [
    [`Monthly EMI:`, formatINR(data.selectedEmi)],
    [`Monthly Power Savings:`, `- ${formatINR(data.monthlySavings)}`],
    [`Effective Monthly Payment:`, formatINR(effectiveEmi)],
  ];
  
  sy = y - 50;
  effectiveInfo.forEach(([label, value], i) => {
    const isTotal = i === 2;
    page3.drawText(label, { x: margin + 15, y: sy, size: isTotal ? 12 : 11, font: isTotal ? fontBold : font, color: isTotal ? green : gray });
    page3.drawText(value, { x: margin + 280, y: sy, size: isTotal ? 13 : 11, font: fontBold, color: green });
    sy -= 20;
  });
  
  drawFooter(page3, font, 3);

  // ========== PAGE 4: Savings Analysis ==========
  const page4 = pdfDoc.addPage([pageWidth, pageHeight]);
  drawHeader(page4, fontBold, font, 'Savings & Returns Analysis');
  
  y = pageHeight - 140;
  
  // Electricity Savings
  page4.drawRectangle({
    x: margin, y: y - 130, width: contentWidth, height: 140,
    color: rgb(0.93, 0.98, 0.93), borderColor: green, borderWidth: 1,
  });
  
  page4.drawText('Your Electricity Savings', {
    x: margin + 15, y: y - 25, size: 14, font: fontBold, color: green,
  });
  
  const savingsCalc = [
    [`Daily Generation:`, `${Math.round(data.capacity * 4)} kWh/day`],
    [`Monthly Generation:`, `${Math.round(data.monthlyGeneration)} kWh/month`],
    [`Annual Generation:`, `${Math.round(data.monthlyGeneration * 12)} kWh/year`],
    [`Electricity Rate:`, `Rs ${electricityRate}/kWh`],
    [`Monthly Savings:`, formatINR(data.monthlySavings)],
    [`Annual Savings:`, formatINR(data.annualSavings)],
  ];
  
  sy = y - 50;
  savingsCalc.forEach(([label, value]) => {
    page4.drawText(label, { x: margin + 15, y: sy, size: 11, font: font, color: gray });
    page4.drawText(value, { x: margin + 250, y: sy, size: 11, font: fontBold, color: black });
    sy -= 18;
  });
  
  y -= 160;
  
  // Long-term Returns
  page4.drawRectangle({
    x: margin, y: y - 180, width: contentWidth, height: 190,
    color: rgb(0.95, 0.97, 1), borderColor: blue, borderWidth: 1,
  });
  
  page4.drawText('Long-term Financial Returns', {
    x: margin + 15, y: y - 25, size: 14, font: fontBold, color: blue,
  });
  
  const years = [5, 10, 15, 20, 25];
  const lifetimeSavings = years.map(yr => ({
    year: yr,
    savings: data.annualSavings * yr,
    roi: ((data.annualSavings * yr - data.netCost) / data.netCost * 100)
  }));
  
  // Table header
  sy = y - 50;
  page4.drawRectangle({
    x: margin + 10, y: sy - 20, width: contentWidth - 20, height: 25,
    color: blue,
  });
  
  const savingsColWidths = [120, 150, 200];
  colX = margin + 20;
  ['Years', 'Total Savings', 'Return on Investment'].forEach((header, i) => {
    page4.drawText(header, { x: colX, y: sy - 14, size: 10, font: fontBold, color: white });
    colX += savingsColWidths[i];
  });
  
  sy -= 20;
  
  lifetimeSavings.forEach((item, index) => {
    const rowColor = index % 2 === 0 ? rgb(0.97, 0.97, 0.97) : white;
    page4.drawRectangle({
      x: margin + 10, y: sy - 22, width: contentWidth - 20, height: 24,
      color: rowColor,
    });
    
    colX = margin + 20;
    const rowData = [
      `${item.year} Years`,
      formatINR(item.savings),
      `${item.roi.toFixed(0)}% ROI`,
    ];
    
    rowData.forEach((cell, i) => {
      page4.drawText(cell, { x: colX, y: sy - 16, size: 10, font: font, color: i === 2 && item.roi > 0 ? green : black });
      colX += savingsColWidths[i];
    });
    
    sy -= 24;
  });
  
  y -= 210;
  
  // Payback Period
  page4.drawRectangle({
    x: margin, y: y - 80, width: contentWidth, height: 90,
    color: rgb(1, 0.97, 0.93), borderColor: orange, borderWidth: 2,
  });
  
  page4.drawText('Investment Payback', {
    x: margin + 15, y: y - 25, size: 14, font: fontBold, color: orange,
  });
  
  page4.drawText(`Your investment of ${formatINR(data.netCost)} will be recovered in approximately`, {
    x: margin + 15, y: y - 50, size: 11, font: font, color: gray,
  });
  
  page4.drawText(`${data.paybackYears.toFixed(1)} Years`, {
    x: margin + 15, y: y - 70, size: 18, font: fontBold, color: orange,
  });
  
  page4.drawText('through electricity bill savings', {
    x: margin + 130, y: y - 70, size: 11, font: font, color: gray,
  });
  
  drawFooter(page4, font, 4);

  // ========== PAGE 5: Product & Warranty Info ==========
  const page5 = pdfDoc.addPage([pageWidth, pageHeight]);
  drawHeader(page5, fontBold, font, 'Product Information & Warranty');
  
  y = pageHeight - 140;
  
  // Product Details
  page5.drawRectangle({
    x: margin, y: y - 160, width: contentWidth, height: 170,
    color: rgb(0.97, 0.97, 0.97), borderColor: gray, borderWidth: 1,
  });
  
  page5.drawText('Product Specifications', {
    x: margin + 15, y: y - 25, size: 14, font: fontBold, color: black,
  });
  
  const productSpecs = [
    ['Solar Panels:', `${data.capacity} kWp ${data.panelType === 'dcr' ? 'Made in India (DCR)' : 'Imported'} Panels`],
    ['Panel Efficiency:', 'High-efficiency Monocrystalline (21%+)'],
    ['Inverter:', data.inverterType === 'hybrid' ? '3-in-1 Hybrid with Battery Support' : 'Grid-tied Ongrid Inverter'],
    ['Mounting Structure:', 'Galvanized Iron / Aluminum Rails'],
    ['Wiring:', 'DC Solar Cables with MC4 Connectors'],
    ['Protection:', 'ACDB/DCDB with Surge Protection'],
    ['Monitoring:', 'Mobile App for Real-time Generation Tracking'],
  ];
  
  sy = y - 50;
  productSpecs.forEach(([label, value]) => {
    page5.drawText(label, { x: margin + 15, y: sy, size: 10, font: font, color: gray });
    page5.drawText(value, { x: margin + 150, y: sy, size: 10, font: fontBold, color: black });
    sy -= 16;
  });
  
  y -= 190;
  
  // Warranty Information
  page5.drawRectangle({
    x: margin, y: y - 140, width: contentWidth, height: 150,
    color: rgb(0.93, 0.98, 0.93), borderColor: green, borderWidth: 1,
  });
  
  page5.drawText('Warranty Coverage', {
    x: margin + 15, y: y - 25, size: 14, font: fontBold, color: green,
  });
  
  const warranties = [
    ['Solar Panels:', '25 Years Performance Warranty'],
    ['Inverter:', '5-10 Years Manufacturer Warranty'],
    ['Mounting Structure:', '10 Years Anti-corrosion Warranty'],
    ['Workmanship:', '5 Years Installation Warranty'],
    ['After-sales Support:', 'Lifetime Technical Support'],
  ];
  
  sy = y - 50;
  warranties.forEach(([label, value]) => {
    page5.drawText(label, { x: margin + 15, y: sy, size: 11, font: font, color: gray });
    page5.drawText(value, { x: margin + 180, y: sy, size: 11, font: fontBold, color: green });
    sy -= 18;
  });
  
  y -= 170;
  
  // Installation Process
  page5.drawText('Installation Timeline', {
    x: margin, y, size: 14, font: fontBold, color: black,
  });
  
  y -= 25;
  
  const milestones = [
    ['1. Site Survey', '1-2 Days', 'Technical assessment of your rooftop'],
    ['2. Documentation', '3-5 Days', 'Subsidy application & approvals'],
    ['3. Material Delivery', '7-10 Days', 'Panels, inverter & accessories'],
    ['4. Installation', '2-3 Days', 'Complete system installation'],
    ['5. Grid Connection', '7-14 Days', 'DISCOM approval & net metering'],
    ['6. Commissioning', '1 Day', 'System handover & training'],
  ];
  
  milestones.forEach(([step, duration, desc]) => {
    page5.drawRectangle({
      x: margin, y: y - 20, width: contentWidth, height: 25,
      color: rgb(0.98, 0.98, 0.98), borderColor: rgb(0.9, 0.9, 0.9), borderWidth: 1,
    });
    
    page5.drawText(step, { x: margin + 10, y: y - 14, size: 10, font: fontBold, color: black });
    page5.drawText(duration, { x: margin + 150, y: y - 14, size: 10, font: font, color: orange });
    page5.drawText(desc, { x: margin + 230, y: y - 14, size: 9, font: font, color: gray });
    
    y -= 27;
  });
  
  drawFooter(page5, font, 5);

  // ========== PAGE 6: Terms & Contact ==========
  const page6 = pdfDoc.addPage([pageWidth, pageHeight]);
  drawHeader(page6, fontBold, font, 'Terms & Contact Information');
  
  y = pageHeight - 140;
  
  // Terms and Conditions
  page6.drawText('Terms & Conditions', {
    x: margin, y, size: 14, font: fontBold, color: black,
  });
  
  y -= 25;
  
  const terms = [
    '1. Prices are valid for 15 days from the date of this proposal.',
    '2. Subsidy amount is subject to government approval and policies.',
    '3. Installation timeline may vary based on DISCOM and site conditions.',
    '4. Customer is responsible for providing safe roof access and electricity.',
    '5. Payment terms: Down payment before material dispatch, balance before commissioning.',
    '6. All prices are inclusive of GST and installation charges.',
    '7. Net metering application to be filed within 30 days of installation.',
    '8. Annual maintenance contract available at nominal charges after warranty period.',
  ];
  
  terms.forEach(term => {
    page6.drawText(term, { x: margin, y, size: 10, font: font, color: gray });
    y -= 18;
  });
  
  y -= 30;
  
  // Why Choose Us
  page6.drawRectangle({
    x: margin, y: y - 120, width: contentWidth, height: 130,
    color: rgb(1, 0.97, 0.93), borderColor: orange, borderWidth: 1,
  });
  
  page6.drawText('Why Choose Divyanshi Solar?', {
    x: margin + 15, y: y - 25, size: 14, font: fontBold, color: orange,
  });
  
  const whyUs = [
    'PM Surya Ghar Yojana Authorized Partner',
    'End-to-end installation with subsidy processing',
    'Experienced team with 1000+ installations',
    'Premium quality components with full warranty',
    'Dedicated after-sales support',
    '24/7 monitoring and maintenance services',
  ];
  
  sy = y - 50;
  whyUs.forEach(point => {
    page6.drawText(`• ${point}`, { x: margin + 15, y: sy, size: 10, font: font, color: black });
    sy -= 15;
  });
  
  y -= 160;
  
  // Contact Information
  page6.drawRectangle({
    x: margin, y: y - 100, width: contentWidth, height: 110,
    color: rgb(0.2, 0.2, 0.2),
  });
  
  page6.drawText('Contact Us', {
    x: margin + 15, y: y - 25, size: 14, font: fontBold, color: white,
  });
  
  const contactInfo = [
    'Divyanshi Digital Services Pvt. Ltd.',
    'Website: www.divyanshisolar.com',
    'Email: info@divyanshisolar.com',
    'Phone: +91-XXXXXXXXXX',
  ];
  
  sy = y - 50;
  contactInfo.forEach(info => {
    page6.drawText(info, { x: margin + 15, y: sy, size: 11, font: font, color: rgb(0.8, 0.8, 0.8) });
    sy -= 16;
  });
  
  // Partner contact at bottom
  if (data.partnerName || data.partnerPhone) {
    y -= 130;
    page6.drawRectangle({
      x: margin, y: y - 70, width: contentWidth, height: 80,
      color: rgb(0.93, 0.98, 0.93), borderColor: green, borderWidth: 2,
    });
    
    page6.drawText('Your Local Contact - District Partner', {
      x: margin + 15, y: y - 25, size: 14, font: fontBold, color: green,
    });
    
    if (data.partnerName) {
      page6.drawText(`Name: ${data.partnerName}`, {
        x: margin + 15, y: y - 50, size: 12, font: font, color: black,
      });
    }
    
    if (data.partnerPhone) {
      page6.drawText(`Mobile: +91-${data.partnerPhone}`, {
        x: margin + 250, y: y - 50, size: 12, font: fontBold, color: black,
      });
    }
  }
  
  drawFooter(page6, font, 6);
  
  // Save PDF
  const pdfBytes = await pdfDoc.save();
  
  const fileName = `proposal_${Date.now()}_${Math.random().toString(36).substring(7)}.pdf`;
  const filePath = path.join(pdfDir, fileName);
  
  fs.writeFileSync(filePath, pdfBytes);
  
  // Auto-delete after 24 hours
  setTimeout(() => {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {}
  }, 24 * 60 * 60 * 1000);
  
  return fileName;
}

function drawHeader(page: PDFPage, fontBold: PDFFont, font: PDFFont, title: string) {
  const orange = rgb(1, 0.4, 0);
  const white = rgb(1, 1, 1);
  const pageWidth = 595;
  const pageHeight = 842;
  const margin = 50;
  
  page.drawRectangle({
    x: 0, y: pageHeight - 80, width: pageWidth, height: 80, color: orange,
  });
  
  page.drawText('Divyanshi Solar', {
    x: margin, y: pageHeight - 40, size: 20, font: fontBold, color: white,
  });
  
  page.drawText(title, {
    x: margin, y: pageHeight - 65, size: 14, font: font, color: white,
  });
}

function drawFooter(page: PDFPage, font: PDFFont, pageNum: number) {
  const pageWidth = 595;
  const gray = rgb(0.5, 0.5, 0.5);
  
  page.drawText(`Page ${pageNum} | Divyanshi Solar - PM Surya Ghar Yojana Partner | www.divyanshisolar.com`, {
    x: 50, y: 25, size: 8, font, color: gray,
  });
}

export function getProposalPath(fileName: string): string | null {
  const filePath = path.join(pdfDir, fileName);
  if (fs.existsSync(filePath)) {
    return filePath;
  }
  return null;
}
