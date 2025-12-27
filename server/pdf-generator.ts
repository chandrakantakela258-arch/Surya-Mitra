import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
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
}

const pdfDir = path.join(process.cwd(), 'uploads', 'proposals');
if (!fs.existsSync(pdfDir)) {
  fs.mkdirSync(pdfDir, { recursive: true });
}

function formatINR(amount: number): string {
  // Use "Rs" instead of ₹ symbol since standard PDF fonts don't support Unicode rupee symbol
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0
  }).format(amount);
  return `Rs ${formatted}`;
}

export async function generateProposalPDF(data: ProposalPDFData): Promise<string> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const { width, height } = page.getSize();
  
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const orange = rgb(1, 0.4, 0);
  const green = rgb(0.13, 0.55, 0.13);
  const blue = rgb(0.1, 0.46, 0.82);
  const gray = rgb(0.4, 0.4, 0.4);
  const black = rgb(0, 0, 0);
  
  let y = height - 50;
  const margin = 50;
  const contentWidth = width - 2 * margin;
  
  page.drawRectangle({
    x: 0,
    y: height - 80,
    width: width,
    height: 80,
    color: orange,
  });
  
  page.drawText('Divyanshi Solar', {
    x: margin,
    y: height - 45,
    size: 24,
    font: fontBold,
    color: rgb(1, 1, 1),
  });
  
  page.drawText('PM Surya Ghar Yojana Authorized Partner', {
    x: margin,
    y: height - 65,
    size: 12,
    font: font,
    color: rgb(1, 1, 1),
  });
  
  y = height - 120;
  
  page.drawText('Solar Proposal', {
    x: margin,
    y,
    size: 20,
    font: fontBold,
    color: black,
  });
  y -= 30;
  
  page.drawText(`Prepared for: ${data.customerName || 'Valued Customer'}`, {
    x: margin,
    y,
    size: 14,
    font: font,
    color: gray,
  });
  y -= 20;
  
  page.drawText(`Date: ${new Date().toLocaleDateString('en-IN')}`, {
    x: margin,
    y,
    size: 12,
    font: font,
    color: gray,
  });
  y -= 40;
  
  page.drawRectangle({
    x: margin,
    y: y - 100,
    width: contentWidth,
    height: 110,
    color: rgb(1, 0.97, 0.93),
    borderColor: rgb(1, 0.8, 0.6),
    borderWidth: 1,
  });
  
  page.drawText('System Details', {
    x: margin + 15,
    y: y - 20,
    size: 14,
    font: fontBold,
    color: orange,
  });
  
  const panelLabel = data.panelType === 'dcr' ? 'DCR (Subsidy Eligible)' : 'Non-DCR';
  const inverterLabel = data.inverterType === 'hybrid' ? '3-in-1 Hybrid Inverter' : 'Ongrid Inverter';
  
  const systemDetails = [
    ['Capacity:', `${data.capacity} kWp`],
    ['Panel Type:', panelLabel],
    ['Inverter:', inverterLabel],
    ['Monthly Generation:', `${Math.round(data.monthlyGeneration)} kWh`],
  ];
  
  let detailY = y - 40;
  systemDetails.forEach(([label, value]) => {
    page.drawText(label, { x: margin + 15, y: detailY, size: 11, font: font, color: gray });
    page.drawText(value, { x: margin + 150, y: detailY, size: 11, font: fontBold, color: black });
    detailY -= 18;
  });
  
  y -= 130;
  
  page.drawRectangle({
    x: margin,
    y: y - 120,
    width: contentWidth,
    height: 130,
    color: rgb(0.89, 0.95, 0.99),
    borderColor: rgb(0.56, 0.79, 0.98),
    borderWidth: 1,
  });
  
  page.drawText('Investment Summary', {
    x: margin + 15,
    y: y - 20,
    size: 14,
    font: fontBold,
    color: blue,
  });
  
  const costDetails = [
    ['Total System Cost:', formatINR(data.totalCost)],
    ['Government Subsidy:', `- ${formatINR(data.totalSubsidy)}`],
    ['Net Investment:', formatINR(data.netCost)],
  ];
  
  detailY = y - 45;
  costDetails.forEach(([label, value], index) => {
    const isNet = index === 2;
    page.drawText(label, { 
      x: margin + 15, 
      y: detailY, 
      size: isNet ? 13 : 11, 
      font: isNet ? fontBold : font, 
      color: isNet ? blue : gray 
    });
    page.drawText(value, { 
      x: margin + 200, 
      y: detailY, 
      size: isNet ? 14 : 11, 
      font: fontBold, 
      color: index === 1 ? green : (isNet ? blue : black) 
    });
    detailY -= 22;
  });
  
  y -= 150;
  
  if (data.downPayment || data.selectedEmi) {
    page.drawRectangle({
      x: margin,
      y: y - 90,
      width: contentWidth,
      height: 100,
      color: rgb(0.95, 0.9, 0.96),
      borderColor: rgb(0.81, 0.58, 0.85),
      borderWidth: 1,
    });
    
    page.drawText('Payment Structure', {
      x: margin + 15,
      y: y - 20,
      size: 14,
      font: fontBold,
      color: rgb(0.48, 0.12, 0.64),
    });
    
    const paymentDetails = [
      [`Down Payment (${data.downPaymentPercent}%):`, formatINR(data.downPayment)],
      ['Loan Amount:', formatINR(data.loanAmount)],
      [`Monthly EMI (${data.selectedTenure} months):`, `${formatINR(data.selectedEmi)}/month`],
    ];
    
    detailY = y - 45;
    paymentDetails.forEach(([label, value]) => {
      page.drawText(label, { x: margin + 15, y: detailY, size: 11, font: font, color: gray });
      page.drawText(value, { x: margin + 200, y: detailY, size: 11, font: fontBold, color: black });
      detailY -= 18;
    });
    
    y -= 120;
  }
  
  page.drawRectangle({
    x: margin,
    y: y - 80,
    width: contentWidth,
    height: 90,
    color: rgb(0.91, 0.96, 0.91),
    borderColor: rgb(0.65, 0.84, 0.65),
    borderWidth: 1,
  });
  
  page.drawText('Your Savings', {
    x: margin + 15,
    y: y - 20,
    size: 14,
    font: fontBold,
    color: green,
  });
  
  const savingsDetails = [
    ['Monthly Savings:', formatINR(data.monthlySavings)],
    ['Annual Savings:', formatINR(data.annualSavings)],
    ['Payback Period:', `${data.paybackYears.toFixed(1)} years`],
  ];
  
  detailY = y - 45;
  savingsDetails.forEach(([label, value]) => {
    page.drawText(label, { x: margin + 15, y: detailY, size: 11, font: font, color: gray });
    page.drawText(value, { x: margin + 200, y: detailY, size: 11, font: fontBold, color: green });
    detailY -= 18;
  });
  
  y -= 110;
  
  if (data.installationAddress) {
    page.drawRectangle({
      x: margin,
      y: y - 40,
      width: contentWidth,
      height: 50,
      color: rgb(0.93, 0.94, 0.95),
      borderColor: rgb(0.69, 0.75, 0.78),
      borderWidth: 1,
    });
    
    page.drawText('Installation Site:', {
      x: margin + 15,
      y: y - 18,
      size: 10,
      font: font,
      color: gray,
    });
    
    const address = data.installationAddress.length > 70 
      ? data.installationAddress.substring(0, 67) + '...' 
      : data.installationAddress;
    
    page.drawText(address, {
      x: margin + 15,
      y: y - 32,
      size: 11,
      font: font,
      color: black,
    });
    
    y -= 60;
  }
  
  if (data.partnerName || data.partnerPhone) {
    page.drawRectangle({
      x: margin,
      y: y - 50,
      width: contentWidth,
      height: 60,
      color: rgb(0.91, 0.96, 0.91),
      borderColor: green,
      borderWidth: 1,
    });
    
    page.drawText('Your District Partner', {
      x: margin + 15,
      y: y - 18,
      size: 12,
      font: fontBold,
      color: green,
    });
    
    const partnerInfo = data.partnerName 
      ? `${data.partnerName}${data.partnerPhone ? ` | +91-${data.partnerPhone}` : ''}`
      : `+91-${data.partnerPhone}`;
    
    page.drawText(partnerInfo, {
      x: margin + 15,
      y: y - 38,
      size: 11,
      font: font,
      color: black,
    });
  }
  
  page.drawRectangle({
    x: 0,
    y: 0,
    width: width,
    height: 50,
    color: rgb(0.2, 0.2, 0.2),
  });
  
  page.drawText('Divyanshi Digital Services Pvt. Ltd. | www.divyanshisolar.com', {
    x: margin,
    y: 25,
    size: 10,
    font: font,
    color: rgb(0.7, 0.7, 0.7),
  });
  
  page.drawText('PM Surya Ghar Yojana Authorized Partner', {
    x: margin,
    y: 12,
    size: 9,
    font: font,
    color: rgb(0.5, 0.5, 0.5),
  });
  
  const pdfBytes = await pdfDoc.save();
  
  const fileName = `proposal_${Date.now()}_${Math.random().toString(36).substring(7)}.pdf`;
  const filePath = path.join(pdfDir, fileName);
  
  fs.writeFileSync(filePath, pdfBytes);
  
  setTimeout(() => {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (e) {
    }
  }, 24 * 60 * 60 * 1000);
  
  return fileName;
}

export function getProposalPath(fileName: string): string | null {
  const filePath = path.join(pdfDir, fileName);
  if (fs.existsSync(filePath)) {
    return filePath;
  }
  return null;
}
