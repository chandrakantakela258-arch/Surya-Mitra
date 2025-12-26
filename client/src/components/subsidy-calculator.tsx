import { useState, useMemo, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sun, IndianRupee, Zap, TrendingDown, MapPin, BatteryCharging, Power, Check, Users, Home, Building2, Factory, FileText, Share2, Mail, MessageCircle, Download, Wallet } from "lucide-react";
import { indianStates } from "@shared/schema";
import { jsPDF } from "jspdf";
import pmSuryaGharImage from "@assets/PM_Surya_Ghar_Yojana_-_Bluebird_Solar_ce42b9b9-5592-4660-b4f5_1766775803880.webp";

// Helper function to load image and convert to base64
const loadImageAsBase64 = (imageSrc: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      } else {
        reject(new Error('Failed to get canvas context'));
      }
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageSrc;
  });
};

const stateSubsidies: Record<string, { ratePerKw: number; maxSubsidy: number; label: string }> = {
  "Odisha": { ratePerKw: 20000, maxSubsidy: 60000, label: "Odisha State Subsidy" },
  "Uttar Pradesh": { ratePerKw: 10000, maxSubsidy: 30000, label: "UP State Subsidy" },
};

// Customer types with capacity limits
type CustomerType = "residential" | "commercial" | "industrial";

const customerTypeConfig: Record<CustomerType, { 
  label: string; 
  maxCapacity: number; 
  description: string;
  icon: any;
  subsidyEligible: boolean;
}> = {
  residential: { 
    label: "Residential", 
    maxCapacity: 10, 
    description: "Home rooftop solar (1-10 kW)",
    icon: Home,
    subsidyEligible: true
  },
  commercial: { 
    label: "Commercial", 
    maxCapacity: 100, 
    description: "Shops, offices, schools (1-100 kW)",
    icon: Building2,
    subsidyEligible: false
  },
  industrial: { 
    label: "Industrial", 
    maxCapacity: 100, 
    description: "Factories, warehouses (1-100 kW)",
    icon: Factory,
    subsidyEligible: false
  },
};

// DCR Panel Pricing
const DCR_HYBRID_RATE_PER_WATT = 75;  // With 3-in-1 Hybrid Inverter
const DCR_ONGRID_RATE_PER_WATT = 66;  // With Ongrid Inverter

// Non-DCR Panel Pricing
const NON_DCR_RATE_PER_WATT = 55;

type InverterType = "hybrid" | "ongrid";

interface SubsidyResult {
  capacity: number;
  totalCost: number;
  centralSubsidy: number;
  stateSubsidy: number;
  totalSubsidy: number;
  netCost: number;
  downPayment: number;
  downPaymentPercent: number;
  loanAmount: number;
  monthlyGeneration: number;
  dailyGeneration: number;
  annualSavings: number;
  monthlySavings: number;
  paybackYears: number;
  state: string;
  emiMonthly: number;
  emiTenure: number;
  panelType: string;
  inverterType: InverterType;
  ratePerWatt: number;
  customerType: CustomerType;
  subsidyEligible: boolean;
  // EMI options for different tenures (calculated on loan amount after down payment)
  emi36Months: number;
  emi48Months: number;
  emi60Months: number;
  emi72Months: number;
  emi84Months: number;
}

interface CommissionResult {
  ddpCommission: number;
  bdpCommission: number;
  totalCommission: number;
}

function calculateEMI(principal: number, annualRate: number = 10, tenureMonths: number = 60): number {
  if (principal <= 0) return 0;
  const monthlyRate = annualRate / 12 / 100;
  const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) / 
              (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  return Math.round(emi);
}

function calculateCommission(capacityKW: number, panelType: string): CommissionResult {
  let ddpCommission = 0;
  let bdpCommission = 0;

  if (panelType === "dcr") {
    if (capacityKW === 3) {
      ddpCommission = 20000;
      bdpCommission = 10000;
    } else if (capacityKW === 5) {
      ddpCommission = 35000;
      bdpCommission = 15000;
    } else if (capacityKW >= 6 && capacityKW <= 10) {
      ddpCommission = capacityKW * 6000;
      bdpCommission = capacityKW * 3000;
    } else if (capacityKW > 10) {
      ddpCommission = capacityKW * 6000;
      bdpCommission = capacityKW * 3000;
    } else {
      ddpCommission = capacityKW * 6000;
      bdpCommission = capacityKW * 3000;
    }
  } else {
    ddpCommission = capacityKW * 4000;
    bdpCommission = capacityKW * 2000;
  }

  return {
    ddpCommission,
    bdpCommission,
    totalCommission: ddpCommission + bdpCommission,
  };
}

function calculateSubsidy(
  capacityKW: number, 
  state: string = "", 
  panelType: string = "dcr", 
  inverterType: InverterType = "hybrid",
  customerType: CustomerType = "residential",
  interestRate: number = 10,
  electricityUnitRate: number = 7,
  downPaymentPercent: number = 15
): SubsidyResult {
  // Calculate rate per watt based on panel type and inverter type
  let ratePerWatt: number;
  if (panelType === "dcr") {
    ratePerWatt = inverterType === "hybrid" ? DCR_HYBRID_RATE_PER_WATT : DCR_ONGRID_RATE_PER_WATT;
  } else {
    ratePerWatt = NON_DCR_RATE_PER_WATT;
  }
  
  const totalCost = capacityKW * ratePerWatt * 1000;
  
  // Subsidy only for residential DCR installations up to 3 kW
  const subsidyEligible = customerType === "residential" && panelType === "dcr";
  
  let centralSubsidy = 0;
  let stateSubsidy = 0;
  
  if (subsidyEligible) {
    if (capacityKW <= 2) {
      centralSubsidy = capacityKW * 30000;
    } else if (capacityKW <= 3) {
      centralSubsidy = 2 * 30000 + (capacityKW - 2) * 18000;
    } else {
      centralSubsidy = 78000; // Max subsidy capped at 3 kW equivalent
    }
    
    if (state && stateSubsidies[state]) {
      const calculatedStateSubsidy = Math.min(capacityKW, 3) * stateSubsidies[state].ratePerKw;
      stateSubsidy = Math.min(calculatedStateSubsidy, stateSubsidies[state].maxSubsidy);
    }
  }
  
  const totalSubsidy = centralSubsidy + stateSubsidy;
  const netCost = Math.max(0, totalCost - totalSubsidy);
  
  // Calculate down payment and effective loan amount
  const downPayment = Math.round(netCost * (downPaymentPercent / 100));
  const loanAmount = netCost - downPayment;
  
  // Power generation: 4 units per kW per day average
  const dailyGeneration = capacityKW * 4;
  const monthlyGeneration = dailyGeneration * 30;
  
  // Use custom electricity unit rate for savings calculation
  const unitCost = electricityUnitRate;
  const monthlySavings = monthlyGeneration * unitCost;
  const annualSavings = monthlySavings * 12;
  
  const paybackYears = netCost > 0 ? netCost / annualSavings : 0;
  
  // Calculate EMI for different tenures using custom interest rate on LOAN AMOUNT (not netCost)
  const emiTenure = 60;
  const emiMonthly = calculateEMI(loanAmount, interestRate, emiTenure);
  const emi36Months = calculateEMI(loanAmount, interestRate, 36);
  const emi48Months = calculateEMI(loanAmount, interestRate, 48);
  const emi60Months = calculateEMI(loanAmount, interestRate, 60);
  const emi72Months = calculateEMI(loanAmount, interestRate, 72);
  const emi84Months = calculateEMI(loanAmount, interestRate, 84);
  
  return {
    capacity: capacityKW,
    totalCost,
    centralSubsidy,
    stateSubsidy,
    totalSubsidy,
    netCost,
    downPayment,
    downPaymentPercent,
    loanAmount,
    dailyGeneration,
    monthlyGeneration,
    monthlySavings,
    annualSavings,
    paybackYears: Math.round(paybackYears * 10) / 10,
    state,
    emiMonthly,
    emiTenure,
    panelType,
    inverterType,
    ratePerWatt,
    customerType,
    subsidyEligible,
    emi36Months,
    emi48Months,
    emi60Months,
    emi72Months,
    emi84Months,
  };
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatINRPlain(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(amount);
}

interface ProposalData {
  customerName: string;
  partnerName: string;
  partnerPhone: string;
  installationAddress: string;
  capacity: number;
  panelType: string;
  inverterType: string;
  customerType: string;
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
  interestRate: number;
  electricityRate: number;
  monthlyGeneration: number;
  monthlySavings: number;
  annualSavings: number;
  effectiveMonthlyPayment: number;
  paybackYears: number;
  state: string;
  ratePerWatt: number;
  emi36Months: number;
  emi48Months: number;
  emi60Months: number;
  emi72Months: number;
  emi84Months: number;
  pmSuryaGharImageData?: string;
}

function generateProposalPDF(data: ProposalData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  
  const primaryColor: [number, number, number] = [255, 102, 0];
  const darkColor: [number, number, number] = [33, 33, 33];
  const grayColor: [number, number, number] = [100, 100, 100];
  const lightGray: [number, number, number] = [150, 150, 150];
  const greenColor: [number, number, number] = [34, 139, 34];
  const blueColor: [number, number, number] = [41, 98, 255];
  const whiteColor: [number, number, number] = [255, 255, 255];
  
  const totalPages = 8;
  
  const addHeader = (pageNum: number, sectionTitle: string) => {
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 8, 'F');
    
    doc.setFillColor(250, 250, 250);
    doc.rect(0, 8, pageWidth, 22, 'F');
    
    doc.setTextColor(...darkColor);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("DIVYANSHI SOLAR", margin, 22);
    
    doc.setTextColor(...lightGray);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(sectionTitle, pageWidth - margin, 22, { align: "right" });
    
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.5);
    doc.line(0, 30, pageWidth, 30);
  };
  
  const addFooter = (pageNum: number) => {
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.5);
    doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);
    
    doc.setTextColor(...lightGray);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("PM Surya Ghar Yojana Authorized Partner | www.divyanshisolar.com", margin, pageHeight - 12);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin, pageHeight - 12, { align: "right" });
  };
  
  // ========== PAGE 1: COVER PAGE ==========
  // Add PM Surya Ghar Yojana image at the top if available
  let headerEndY = 0;
  if (data.pmSuryaGharImageData) {
    try {
      // Image dimensions: original is ~900x600, we'll scale proportionally
      const imgWidth = pageWidth;
      const imgHeight = 55; // Reduced height for header banner
      doc.addImage(data.pmSuryaGharImageData, 'PNG', 0, 0, imgWidth, imgHeight);
      headerEndY = imgHeight;
    } catch (e) {
      console.error('Failed to add image to PDF:', e);
      headerEndY = 0;
    }
  }
  
  // Company branding section below image
  const brandingY = headerEndY > 0 ? headerEndY : 0;
  doc.setFillColor(...primaryColor);
  doc.rect(0, brandingY, pageWidth, 35, 'F');
  
  doc.setTextColor(...whiteColor);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("DIVYANSHI SOLAR", pageWidth / 2, brandingY + 15, { align: "center" });
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("(Divyanshi Digital Services Pvt. Ltd.)", pageWidth / 2, brandingY + 24, { align: "center" });
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text("\"For us Customers are not clients - They are Family\"", pageWidth / 2, brandingY + 32, { align: "center" });
  
  // Main title
  let y = brandingY + 50;
  doc.setTextColor(...darkColor);
  doc.setFontSize(26);
  doc.setFont("helvetica", "bold");
  doc.text("SOLAR ROOFTOP SYSTEM PROPOSAL", pageWidth / 2, y, { align: "center" });
  
  // Decorative line
  y += 8;
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(3);
  doc.line(pageWidth / 2 - 60, y, pageWidth / 2 + 60, y);
  
  // Customer details grid with prominent borders
  y += 18;
  const boxWidth = 82;
  const boxHeight = 36;
  const boxGap = 8;
  const leftX = (pageWidth - (boxWidth * 2 + boxGap)) / 2;
  const rightX = leftX + boxWidth + boxGap;
  
  // Row 1 - Customer Name & Location
  doc.setFillColor(255, 250, 245);
  doc.roundedRect(leftX, y, boxWidth, boxHeight, 4, 4, 'F');
  doc.roundedRect(rightX, y, boxWidth, boxHeight, 4, 4, 'F');
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(1);
  doc.roundedRect(leftX, y, boxWidth, boxHeight, 4, 4, 'S');
  doc.roundedRect(rightX, y, boxWidth, boxHeight, 4, 4, 'S');
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("PREPARED FOR", leftX + 6, y + 10);
  doc.text("STATE", rightX + 6, y + 10);
  
  doc.setTextColor(...darkColor);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(data.customerName || "Valued Customer", leftX + 6, y + 25);
  doc.text(data.state || "India", rightX + 6, y + 25);
  
  // Row 2 - Capacity & Date
  y += boxHeight + 6;
  doc.setFillColor(255, 250, 245);
  doc.roundedRect(leftX, y, boxWidth, boxHeight, 4, 4, 'F');
  doc.roundedRect(rightX, y, boxWidth, boxHeight, 4, 4, 'F');
  doc.setDrawColor(...primaryColor);
  doc.roundedRect(leftX, y, boxWidth, boxHeight, 4, 4, 'S');
  doc.roundedRect(rightX, y, boxWidth, boxHeight, 4, 4, 'S');
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("SYSTEM CAPACITY", leftX + 6, y + 10);
  doc.text("PROPOSAL DATE", rightX + 6, y + 10);
  
  doc.setTextColor(...darkColor);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`${data.capacity} kWp`, leftX + 6, y + 25);
  doc.text(new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), rightX + 6, y + 25);
  
  // Row 3 - Property & System Type
  y += boxHeight + 6;
  doc.setFillColor(255, 250, 245);
  doc.roundedRect(leftX, y, boxWidth, boxHeight, 4, 4, 'F');
  doc.roundedRect(rightX, y, boxWidth, boxHeight, 4, 4, 'F');
  doc.setDrawColor(...primaryColor);
  doc.roundedRect(leftX, y, boxWidth, boxHeight, 4, 4, 'S');
  doc.roundedRect(rightX, y, boxWidth, boxHeight, 4, 4, 'S');
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("PROPERTY TYPE", leftX + 6, y + 10);
  doc.text("SYSTEM TYPE", rightX + 6, y + 10);
  
  doc.setTextColor(...darkColor);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(data.customerType.charAt(0).toUpperCase() + data.customerType.slice(1), leftX + 6, y + 25);
  doc.text(data.inverterType === "hybrid" ? "Hybrid Inverter" : "Ongrid Inverter", rightX + 6, y + 25);
  
  // Installation Address Section (if provided)
  if (data.installationAddress) {
    y += boxHeight + 10;
    doc.setFillColor(240, 255, 240);
    doc.roundedRect(margin, y, contentWidth, 28, 4, 4, 'F');
    doc.setDrawColor(...greenColor);
    doc.setLineWidth(1.5);
    doc.roundedRect(margin, y, contentWidth, 28, 4, 4, 'S');
    
    doc.setTextColor(...greenColor);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("PROPOSED PLANT INSTALLATION SITE", margin + 10, y + 10);
    
    doc.setTextColor(...darkColor);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const addressLines = doc.splitTextToSize(data.installationAddress, contentWidth - 20);
    doc.text(addressLines.slice(0, 2), margin + 10, y + 20);
  }
  
  // Partner info section (if provided)
  if (data.partnerName || data.partnerPhone) {
    y = pageHeight - 88;
    doc.setFillColor(240, 248, 255);
    doc.roundedRect(margin, y, contentWidth, 28, 4, 4, 'F');
    doc.setDrawColor(...blueColor);
    doc.setLineWidth(1.5);
    doc.roundedRect(margin, y, contentWidth, 28, 4, 4, 'S');
    
    doc.setTextColor(...blueColor);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("YOUR DISTRICT PARTNER", margin + 10, y + 10);
    
    doc.setTextColor(...darkColor);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const partnerInfo = data.partnerName ? `${data.partnerName}${data.partnerPhone ? ` | +91-${data.partnerPhone}` : ''}` : `+91-${data.partnerPhone}`;
    doc.text(partnerInfo, margin + 10, y + 21);
  }
  
  // Bottom info box - Panel & System details
  y = pageHeight - 55;
  doc.setFillColor(255, 248, 240);
  doc.roundedRect(margin, y, contentWidth, 32, 4, 4, 'F');
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(1);
  doc.roundedRect(margin, y, contentWidth, 32, 4, 4, 'S');
  
  doc.setTextColor(...darkColor);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const panelInfo = data.panelType === "dcr" ? "DCR Panels (Subsidy Eligible)" : "Non-DCR Panels";
  const systemInfo = data.inverterType === "hybrid" ? "Hybrid system with battery backup capability" : "Grid-connected system for maximum savings";
  doc.text(`Panel Type: ${panelInfo}`, margin + 10, y + 12);
  doc.text(`System: ${systemInfo}`, margin + 10, y + 24);
  
  addFooter(1);
  
  // ========== PAGE 2: WHY SOLAR ==========
  doc.addPage();
  addHeader(2, "WHY SOLAR");
  
  y = 45;
  doc.setTextColor(...primaryColor);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Power Your Home with Free Solar Energy", margin, y);
  
  y = 58;
  doc.setTextColor(...darkColor);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const introText = "Join India's largest rooftop solar installation program. Get up to Rs 78,000 subsidy and reduce your electricity bills to zero.";
  doc.text(doc.splitTextToSize(introText, contentWidth), margin, y);
  
  y = 80;
  doc.setTextColor(...darkColor);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Why Every Indian Home Needs Solar", margin, y);
  
  y = 92;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const whyText = "With rising electricity costs and growing energy demands, rooftop solar is no longer optional - it's essential for India's energy security and your family's financial future.";
  doc.text(doc.splitTextToSize(whyText, contentWidth), margin, y);
  
  // Benefits grid
  y = 115;
  const benefitW = (contentWidth - 10) / 2;
  const benefitH = 42;
  
  const solarBenefits = [
    { title: "Rising Electricity Costs", desc: "Electricity tariffs have increased by 30-50% in the last 5 years. Solar locks in your energy costs for 25+ years.", icon: "Rs" },
    { title: "Growing Energy Demand", desc: "With EVs, ACs, and smart appliances, household energy consumption is doubling every decade.", icon: "+" },
    { title: "Limited Time Subsidy", desc: "PM Surya Ghar Yojana offers up to Rs 78,000 subsidy only until 2027. After that, you pay full price.", icon: "!" },
    { title: "Earn From Surplus Power", desc: "Net metering allows you to sell excess electricity back to the grid. Turn your rooftop into income.", icon: "Rs" },
  ];
  
  solarBenefits.forEach((benefit, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const bx = margin + col * (benefitW + 10);
    const by = y + row * (benefitH + 8);
    
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(bx, by, benefitW, benefitH, 2, 2, 'F');
    
    doc.setTextColor(...primaryColor);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(benefit.title, bx + 8, by + 12);
    
    doc.setTextColor(...grayColor);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(doc.splitTextToSize(benefit.desc, benefitW - 16), bx + 8, by + 22);
  });
  
  // Impact stats
  y = 220;
  doc.setFillColor(...primaryColor);
  doc.roundedRect(margin, y, contentWidth, 45, 3, 3, 'F');
  
  doc.setTextColor(...whiteColor);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("National Impact of PM Surya Ghar Yojana", pageWidth / 2, y + 14, { align: "center" });
  
  const statW = contentWidth / 2;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("720 Million Tonnes CO2 Saved over 25 years", margin + statW / 2, y + 30, { align: "center" });
  doc.text("17 Lakh Jobs Created in solar sector", margin + statW + statW / 2, y + 30, { align: "center" });
  
  addFooter(2);
  
  // ========== PAGE 3: ABOUT US ==========
  doc.addPage();
  addHeader(3, "ABOUT US");
  
  y = 45;
  doc.setTextColor(...primaryColor);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("About DIVYANSHI SOLAR", margin, y);
  
  y = 60;
  doc.setTextColor(...darkColor);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const aboutText = "DIVYANSHI SOLAR delivers premium renewable energy solutions focused on long-term value, substantial savings, and lifetime customer support. We are committed to transforming how India consumes energy through innovative solar technology.";
  doc.text(doc.splitTextToSize(aboutText, contentWidth), margin, y);
  
  // Experience section
  y = 88;
  doc.setFillColor(248, 248, 248);
  doc.roundedRect(margin, y, contentWidth, 50, 3, 3, 'F');
  
  doc.setTextColor(...darkColor);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const expText = "For the last 8 years, we have been closely associated with Hitachi Payment Services Pvt. Ltd., delivering mission-critical financial infrastructure. This deep experience in nationwide deployment, compliance, partner management, and operations forms the backbone of Divyanshi Solar.";
  doc.text(doc.splitTextToSize(expText, contentWidth - 20), margin + 10, y + 14);
  
  // Stats
  const statBoxW = (contentWidth - 20) / 3;
  const statsY = y + 55;
  
  doc.setFillColor(255, 248, 240);
  doc.roundedRect(margin, statsY, statBoxW, 35, 2, 2, 'F');
  doc.setTextColor(...primaryColor);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("300+", margin + statBoxW / 2, statsY + 15, { align: "center" });
  doc.setTextColor(...grayColor);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("White Label ATMs", margin + statBoxW / 2, statsY + 26, { align: "center" });
  
  doc.setFillColor(240, 255, 240);
  doc.roundedRect(margin + statBoxW + 10, statsY, statBoxW, 35, 2, 2, 'F');
  doc.setTextColor(...greenColor);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("500+", margin + statBoxW + 10 + statBoxW / 2, statsY + 15, { align: "center" });
  doc.setTextColor(...grayColor);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("ATMs Sourced", margin + statBoxW + 10 + statBoxW / 2, statsY + 26, { align: "center" });
  
  doc.setFillColor(240, 248, 255);
  doc.roundedRect(margin + statBoxW * 2 + 20, statsY, statBoxW, 35, 2, 2, 'F');
  doc.setTextColor(...blueColor);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("5,000+", margin + statBoxW * 2 + 20 + statBoxW / 2, statsY + 15, { align: "center" });
  doc.setTextColor(...grayColor);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Partners Onboarded", margin + statBoxW * 2 + 20 + statBoxW / 2, statsY + 26, { align: "center" });
  
  // Values section
  y = statsY + 50;
  doc.setTextColor(...darkColor);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Our Values", margin, y);
  
  const values = [
    { title: "Trust & Transparency", desc: "Complete honesty in pricing and processes" },
    { title: "Execution Excellence", desc: "Timely installation and regulatory compliance" },
    { title: "Sustainability First", desc: "Every installation protects our environment" },
    { title: "Partner Empowerment", desc: "Enabling local partners to grow with us" },
    { title: "Nation Building", desc: "Aligned with India's vision of self-reliance" },
    { title: "Customer-Centric", desc: "Simple processes and long-term support" },
  ];
  
  const valueW = (contentWidth - 10) / 2;
  const valueH = 22;
  y += 10;
  
  values.forEach((val, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const vx = margin + col * (valueW + 10);
    const vy = y + row * (valueH + 5);
    
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(vx, vy, valueW, valueH, 2, 2, 'F');
    
    doc.setTextColor(...primaryColor);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(val.title, vx + 6, vy + 9);
    
    doc.setTextColor(...grayColor);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(val.desc, vx + 6, vy + 17);
  });
  
  addFooter(3);
  
  // ========== PAGE 4: BENEFITS ==========
  doc.addPage();
  
  doc.setTextColor(...grayColor);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("BENEFITS", pageWidth - 20, 20, { align: "right" });
  
  y = 50;
  doc.setTextColor(...primaryColor);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Why Choose DIVYANSHI SOLAR", 20, y);
  
  y = 75;
  const benefitBoxWidth = (pageWidth - 50) / 2;
  const benefitBoxHeight = 50;
  
  const benefits = [
    { title: "Financial Savings", desc: "Dramatically reduce your monthly electricity bills and build lifetime savings with solar power.", color: primaryColor },
    { title: "Government Support", desc: `PM Surya Ghar Yojana subsidy credited directly to your account - up to Rs ${formatINRPlain(data.totalSubsidy)} benefits.`, color: greenColor },
    { title: "Sustainability", desc: "Zero emission clean energy that protects our environment for future generations.", color: blueColor },
    { title: "Property Value", desc: "Solar installations significantly increase your property's market value and appeal.", color: [139, 69, 19] as [number, number, number] },
  ];
  
  benefits.forEach((benefit, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 20 + col * (benefitBoxWidth + 10);
    const boxY = y + row * (benefitBoxHeight + 15);
    
    doc.setFillColor(250, 250, 250);
    doc.rect(x, boxY, benefitBoxWidth, benefitBoxHeight, 'F');
    
    doc.setTextColor(...benefit.color);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(benefit.title, x + 10, boxY + 15);
    
    doc.setTextColor(...darkColor);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const descText = doc.splitTextToSize(benefit.desc, benefitBoxWidth - 20);
    doc.text(descText, x + 10, boxY + 28);
  });
  
  y = 210;
  doc.setFillColor(255, 102, 0);
  doc.rect(20, y, pageWidth - 40, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("25-Year Performance Warranty", pageWidth / 2, y + 18, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Complete peace of mind with our industry-leading warranty coverage.", pageWidth / 2, y + 30, { align: "center" });
  
  addFooter(4);
  
  // ========== PAGE 5: INVESTMENT SUMMARY ==========
  doc.addPage();
  
  doc.setTextColor(...grayColor);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("INVESTMENT", pageWidth - 20, 20, { align: "right" });
  
  y = 50;
  doc.setTextColor(...primaryColor);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("System Quotation & Financials", 20, y);
  
  y = 70;
  doc.setTextColor(...darkColor);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Investment Summary", 20, y);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...grayColor);
  doc.text(`${data.capacity} kWp ${data.inverterType === "hybrid" ? "Hybrid" : "Ongrid"} Solar Rooftop System`, 20, y + 10);
  
  y = 95;
  doc.setFillColor(250, 250, 250);
  doc.rect(20, y, pageWidth - 40, 70, 'F');
  
  doc.setTextColor(...darkColor);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Project Cost", 30, y + 15);
  doc.setFont("helvetica", "bold");
  doc.text(formatINR(data.totalCost), pageWidth - 30, y + 15, { align: "right" });
  
  if (data.totalSubsidy > 0) {
    doc.setFont("helvetica", "normal");
    doc.text("Government Subsidy", 30, y + 30);
    doc.setTextColor(...grayColor);
    doc.setFontSize(9);
    doc.text("PM Surya Ghar", 30, y + 38);
    doc.setTextColor(...greenColor);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("- " + formatINR(data.totalSubsidy), pageWidth - 30, y + 34, { align: "right" });
  }
  
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(1);
  doc.line(30, y + 50, pageWidth - 30, y + 50);
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Net Investment", 30, y + 62);
  doc.text(formatINR(data.netCost), pageWidth - 30, y + 62, { align: "right" });
  
  // Payment Structure Section - Fixed layout with stacked rows
  y = 175;
  doc.setFillColor(240, 255, 240);
  doc.roundedRect(20, y, pageWidth - 40, 50, 4, 4, 'F');
  doc.setDrawColor(...greenColor);
  doc.setLineWidth(1);
  doc.roundedRect(20, y, pageWidth - 40, 50, 4, 4, 'S');
  
  doc.setTextColor(...greenColor);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Payment Structure", 30, y + 14);
  
  // Row 1 - Down Payment
  doc.setTextColor(...darkColor);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Down Payment (${data.downPaymentPercent}%):`, 30, y + 30);
  doc.setFont("helvetica", "bold");
  doc.text(formatINR(data.downPayment), 120, y + 30);
  
  // Row 2 - Net Loan Amount
  doc.setFont("helvetica", "normal");
  doc.text("Net Loan Amount:", 30, y + 42);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...primaryColor);
  doc.text(formatINR(data.loanAmount), 120, y + 42);
  
  y = 235;
  const savingsBoxWidth = (pageWidth - 60) / 3;
  
  doc.setFillColor(240, 255, 240);
  doc.roundedRect(20, y, savingsBoxWidth, 50, 4, 4, 'F');
  doc.setDrawColor(...greenColor);
  doc.roundedRect(20, y, savingsBoxWidth, 50, 4, 4, 'S');
  doc.setTextColor(...grayColor);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("ANNUAL SAVINGS", 25, y + 14);
  doc.setTextColor(...greenColor);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(formatINR(data.annualSavings), 25, y + 35);
  
  doc.setFillColor(255, 250, 240);
  doc.roundedRect(30 + savingsBoxWidth, y, savingsBoxWidth, 50, 4, 4, 'F');
  doc.setDrawColor(...primaryColor);
  doc.roundedRect(30 + savingsBoxWidth, y, savingsBoxWidth, 50, 4, 4, 'S');
  doc.setTextColor(...grayColor);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("25-YEAR SAVINGS", 35 + savingsBoxWidth, y + 14);
  doc.setTextColor(...primaryColor);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(formatINR(data.annualSavings * 25), 35 + savingsBoxWidth, y + 35);
  
  doc.setFillColor(240, 248, 255);
  doc.roundedRect(40 + savingsBoxWidth * 2, y, savingsBoxWidth, 50, 4, 4, 'F');
  doc.setDrawColor(...blueColor);
  doc.roundedRect(40 + savingsBoxWidth * 2, y, savingsBoxWidth, 50, 4, 4, 'S');
  doc.setTextColor(...grayColor);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("PAYBACK PERIOD", 45 + savingsBoxWidth * 2, y + 14);
  doc.setTextColor(...blueColor);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`${data.paybackYears} Years`, 45 + savingsBoxWidth * 2, y + 35);
  
  addFooter(5);
  
  // ========== PAGE 6: EMI SCHEDULE ==========
  doc.addPage();
  
  doc.setTextColor(...grayColor);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("LOAN EMI SCHEDULE", pageWidth - 20, 20, { align: "right" });
  
  y = 50;
  doc.setTextColor(...primaryColor);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Loan EMI Options", 20, y);
  
  y = 70;
  doc.setTextColor(...darkColor);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Choose the EMI tenure that suits your financial planning:", 20, y);
  
  // Loan Summary Box
  y = 85;
  doc.setFillColor(255, 248, 240);
  doc.roundedRect(20, y, pageWidth - 40, 35, 4, 4, 'F');
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(1.5);
  doc.roundedRect(20, y, pageWidth - 40, 35, 4, 4, 'S');
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("LOAN DETAILS", 30, y + 12);
  
  doc.setTextColor(...darkColor);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Loan Amount: ${formatINR(data.loanAmount)}`, 30, y + 26);
  doc.text(`Interest Rate: ${data.interestRate}% p.a.`, pageWidth / 2, y + 26);
  
  // EMI Options Table
  y = 135;
  doc.setTextColor(...darkColor);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("EMI Payment Schedule", 20, y);
  
  // Table Header
  y = 150;
  doc.setFillColor(...primaryColor);
  doc.rect(20, y, pageWidth - 40, 12, 'F');
  doc.setTextColor(...whiteColor);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("TENURE", 30, y + 8);
  doc.text("MONTHLY EMI", 80, y + 8);
  doc.text("TOTAL PAYMENT", 130, y + 8);
  doc.text("TOTAL INTEREST", pageWidth - 30, y + 8, { align: "right" });
  
  // Table Rows - Calculate EMI details
  const emiTenures = [
    { months: 36, emi: data.emi36Months },
    { months: 48, emi: data.emi48Months },
    { months: 60, emi: data.emi60Months },
    { months: 72, emi: data.emi72Months },
    { months: 84, emi: data.emi84Months },
  ];
  
  y = 162;
  emiTenures.forEach((tenure, index) => {
    const totalPayment = tenure.emi * tenure.months;
    const totalInterest = totalPayment - data.loanAmount;
    const isSelected = tenure.months === data.selectedTenure;
    
    if (isSelected) {
      doc.setFillColor(240, 255, 240);
      doc.rect(20, y, pageWidth - 40, 14, 'F');
      doc.setDrawColor(...greenColor);
      doc.setLineWidth(1);
      doc.rect(20, y, pageWidth - 40, 14, 'S');
    } else if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(20, y, pageWidth - 40, 14, 'F');
    }
    
    doc.setTextColor(...darkColor);
    doc.setFontSize(10);
    doc.setFont(isSelected ? "helvetica" : "helvetica", isSelected ? "bold" : "normal");
    doc.text(`${tenure.months} Months`, 30, y + 10);
    doc.text(formatINR(tenure.emi), 80, y + 10);
    doc.text(formatINR(totalPayment), 130, y + 10);
    doc.text(formatINR(totalInterest), pageWidth - 30, y + 10, { align: "right" });
    
    y += 14;
  });
  
  // Highlight Selected EMI
  y += 15;
  doc.setFillColor(240, 255, 240);
  doc.roundedRect(20, y, pageWidth - 40, 45, 4, 4, 'F');
  doc.setDrawColor(...greenColor);
  doc.setLineWidth(2);
  doc.roundedRect(20, y, pageWidth - 40, 45, 4, 4, 'S');
  
  doc.setTextColor(...greenColor);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("YOUR SELECTED EMI PLAN", 30, y + 14);
  
  doc.setTextColor(...darkColor);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Tenure: ${data.selectedTenure} Months`, 30, y + 30);
  doc.setTextColor(...greenColor);
  doc.setFontSize(16);
  doc.text(`EMI: ${formatINR(data.selectedEmi)}/month`, pageWidth / 2, y + 30);
  
  // Effective EMI after savings
  y += 55;
  doc.setFillColor(255, 250, 240);
  doc.roundedRect(20, y, pageWidth - 40, 35, 4, 4, 'F');
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(1);
  doc.roundedRect(20, y, pageWidth - 40, 35, 4, 4, 'S');
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("EFFECTIVE MONTHLY PAYMENT (After Power Savings)", 30, y + 14);
  
  doc.setTextColor(...darkColor);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`EMI: ${formatINR(data.selectedEmi)} - Monthly Savings: ${formatINR(data.monthlySavings)} =`, 30, y + 26);
  doc.setTextColor(...greenColor);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(formatINR(data.effectiveMonthlyPayment), pageWidth - 30, y + 26, { align: "right" });
  
  addFooter(6);
  
  // ========== PAGE 7: ENVIRONMENTAL IMPACT ==========
  doc.addPage();
  
  doc.setTextColor(...grayColor);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("SUSTAINABILITY", pageWidth - 20, 20, { align: "right" });
  
  y = 50;
  doc.setTextColor(...primaryColor);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Environmental Impact", 20, y);
  
  const annualGeneration = data.capacity * 4 * 365;
  const co2Mitigated = Math.round(annualGeneration * 0.82);
  const treesEquivalent = Math.round(co2Mitigated / 21);
  const distanceEquivalent = Math.round(co2Mitigated * 4);
  const roi = ((data.annualSavings / data.netCost) * 100).toFixed(2);
  
  y = 80;
  doc.setFillColor(240, 255, 240);
  doc.rect(pageWidth / 2 - 50, y, 100, 50, 'F');
  doc.setTextColor(...grayColor);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("CO2 Mitigated (Annual)", pageWidth / 2, y + 15, { align: "center" });
  doc.setTextColor(...greenColor);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(`${formatINRPlain(co2Mitigated)} Kg`, pageWidth / 2, y + 38, { align: "center" });
  
  y = 145;
  doc.setFillColor(255, 250, 240);
  doc.rect(pageWidth / 2 - 50, y, 100, 50, 'F');
  doc.setTextColor(...grayColor);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Trees Planted Equivalent", pageWidth / 2, y + 15, { align: "center" });
  doc.setTextColor(...primaryColor);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(`${treesEquivalent} Trees`, pageWidth / 2, y + 38, { align: "center" });
  
  y = 210;
  doc.setFillColor(240, 248, 255);
  doc.rect(pageWidth / 2 - 50, y, 100, 50, 'F');
  doc.setTextColor(...grayColor);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Distance Equivalent", pageWidth / 2, y + 15, { align: "center" });
  doc.setTextColor(...blueColor);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(`${formatINRPlain(distanceEquivalent)} Kms`, pageWidth / 2, y + 38, { align: "center" });
  
  addFooter(7);
  
  // ========== PAGE 8: TERMS & CONDITIONS ==========
  doc.addPage();
  
  doc.setTextColor(...grayColor);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("TERMS", pageWidth - 20, 20, { align: "right" });
  
  y = 50;
  doc.setTextColor(...primaryColor);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Terms & Conditions", 20, y);
  
  y = 75;
  const terms = [
    "This proposal is valid for 7 business days from the date of issuance.",
    "Net-metering and subsidy approvals are subject to DISCOM and MNRE feasibility.",
    "Final project cost may vary based on site-specific structural requirements.",
    "System includes a comprehensive 5-year maintenance package.",
    "All electrical work follows national safety standards.",
    "Subsidy will be credited directly to customer bank account as per MNRE norms.",
  ];
  
  doc.setTextColor(...darkColor);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  terms.forEach((term, i) => {
    doc.setFillColor(250, 250, 250);
    doc.rect(20, y + (i * 20), pageWidth - 40, 15, 'F');
    doc.text(term, 30, y + 10 + (i * 20));
  });
  
  y = 210;
  doc.setFillColor(255, 102, 0);
  doc.rect(0, y, pageWidth, 50, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.text("\"For us Customers are not clients - They are Family\"", pageWidth / 2, y + 15, { align: "center" });
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Divyanshi Solar", pageWidth / 2, y + 32, { align: "center" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("PM Surya Ghar Yojana Authorized Partner", pageWidth / 2, y + 42, { align: "center" });
  
  y = 270;
  doc.setTextColor(...grayColor);
  doc.setFontSize(9);
  doc.text("info@divyanshisolar.com | www.divyanshisolar.com", pageWidth / 2, y, { align: "center" });
  
  addFooter(8);
  
  return doc;
}

interface SubsidyCalculatorProps {
  onCapacityChange?: (capacity: number) => void;
  onStateChange?: (state: string) => void;
  onCustomerTypeChange?: (type: CustomerType) => void;
  initialCapacity?: number;
  initialState?: string;
  initialCustomerType?: CustomerType;
  compact?: boolean;
  showCommission?: 'none' | 'ddp_only' | 'bdp_only' | 'all';
}

export function SubsidyCalculator({ 
  onCapacityChange, 
  onStateChange,
  onCustomerTypeChange,
  initialCapacity = 5,
  initialState = "",
  initialCustomerType = "residential",
  compact = false,
  showCommission = 'none'
}: SubsidyCalculatorProps) {
  const [capacity, setCapacity] = useState(initialCapacity);
  const [selectedState, setSelectedState] = useState(initialState);
  const [panelType, setPanelType] = useState<"dcr" | "non_dcr">("dcr");
  const [inverterType, setInverterType] = useState<InverterType>("hybrid");
  const [customCapacity, setCustomCapacity] = useState(initialCapacity.toString());
  const [customerType, setCustomerType] = useState<CustomerType>(initialCustomerType);
  const [selectedEmiTenure, setSelectedEmiTenure] = useState<number>(60);
  const [interestRate, setInterestRate] = useState<number>(10);
  const [interestRateInput, setInterestRateInput] = useState<string>("10");
  const [electricityUnitRate, setElectricityUnitRate] = useState<number>(7);
  const [electricityRateInput, setElectricityRateInput] = useState<string>("7");
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(15);
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  const [partnerName, setPartnerName] = useState<string>("");
  const [partnerPhone, setPartnerPhone] = useState<string>("");
  const [installationAddress, setInstallationAddress] = useState<string>("");
  
  const maxCapacity = customerTypeConfig[customerType].maxCapacity;
  
  const result = useMemo(() => calculateSubsidy(capacity, selectedState, panelType, inverterType, customerType, interestRate, electricityUnitRate, downPaymentPercent), [capacity, selectedState, panelType, inverterType, customerType, interestRate, electricityUnitRate, downPaymentPercent]);
  const commission = useMemo(() => calculateCommission(capacity, panelType), [capacity, panelType]);
  
  // Get EMI for selected tenure
  const selectedEmi = useMemo(() => {
    switch (selectedEmiTenure) {
      case 36: return result.emi36Months;
      case 48: return result.emi48Months;
      case 60: return result.emi60Months;
      case 72: return result.emi72Months;
      case 84: return result.emi84Months;
      default: return result.emi60Months;
    }
  }, [result, selectedEmiTenure]);
  
  // Capacity options based on customer type
  const capacityOptions = useMemo(() => {
    if (customerType === "residential") {
      return [1, 2, 3, 5, 7, 10];
    } else {
      return [10, 15, 20, 25, 50, 75, 100];
    }
  }, [customerType]);
  
  function handleCapacityChange(value: number) {
    const clampedValue = Math.max(1, Math.min(maxCapacity, value));
    setCapacity(clampedValue);
    setCustomCapacity(clampedValue.toString());
    onCapacityChange?.(clampedValue);
  }
  
  function handleCustomCapacityChange(value: string) {
    setCustomCapacity(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= maxCapacity) {
      setCapacity(numValue);
      onCapacityChange?.(numValue);
    }
  }
  
  function handleStateChange(state: string) {
    setSelectedState(state);
    onStateChange?.(state);
  }
  
  function handleCustomerTypeChange(type: CustomerType) {
    setCustomerType(type);
    onCustomerTypeChange?.(type);
    // Reset capacity to appropriate default for new customer type
    const newMaxCapacity = customerTypeConfig[type].maxCapacity;
    if (capacity > newMaxCapacity) {
      handleCapacityChange(type === "residential" ? 3 : 25);
    } else if (type !== "residential" && capacity < 10) {
      handleCapacityChange(10);
    }
  }
  
  const getProposalData = useCallback((): ProposalData => {
    const effectiveMonthlyPayment = Math.max(0, selectedEmi - result.monthlySavings);
    
    return {
      customerName,
      partnerName,
      partnerPhone,
      installationAddress,
      capacity,
      panelType,
      inverterType,
      customerType,
      totalCost: result.totalCost,
      centralSubsidy: result.centralSubsidy,
      stateSubsidy: result.stateSubsidy,
      totalSubsidy: result.totalSubsidy,
      netCost: result.netCost,
      downPayment: result.downPayment,
      downPaymentPercent: result.downPaymentPercent,
      loanAmount: result.loanAmount,
      selectedTenure: selectedEmiTenure,
      selectedEmi,
      interestRate,
      electricityRate: electricityUnitRate,
      monthlyGeneration: result.monthlyGeneration,
      monthlySavings: result.monthlySavings,
      annualSavings: result.annualSavings,
      effectiveMonthlyPayment,
      paybackYears: result.paybackYears,
      state: selectedState,
      ratePerWatt: result.ratePerWatt,
      emi36Months: result.emi36Months,
      emi48Months: result.emi48Months,
      emi60Months: result.emi60Months,
      emi72Months: result.emi72Months,
      emi84Months: result.emi84Months,
    };
  }, [capacity, panelType, inverterType, customerType, result, selectedEmiTenure, selectedEmi, interestRate, electricityUnitRate, selectedState, customerName, partnerName, partnerPhone, installationAddress]);
  
  async function handleDownloadProposal() {
    try {
      const data = getProposalData();
      // Load PM Surya Ghar image for PDF
      const imageData = await loadImageAsBase64(pmSuryaGharImage);
      data.pmSuryaGharImageData = imageData;
      const doc = generateProposalPDF(data);
      doc.save(`Divyanshi_Solar_Proposal_${capacity}kW_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback: generate PDF without image
      const data = getProposalData();
      const doc = generateProposalPDF(data);
      doc.save(`Divyanshi_Solar_Proposal_${capacity}kW_${new Date().toISOString().split('T')[0]}.pdf`);
    }
  }
  
  function handleShareWhatsApp() {
    const data = getProposalData();
    const message = `*Divyanshi Solar - PM Surya Ghar Yojana Proposal*

*Plant Details:*
- Capacity: ${data.capacity} kW ${data.panelType === "dcr" ? "DCR" : "Non-DCR"}
- Inverter: ${data.inverterType === "hybrid" ? "3-in-1 Hybrid" : "Ongrid"}

*Cost Breakdown:*
- Material Cost: Rs ${formatINRPlain(data.totalCost)}
- Govt. Subsidy: Rs ${formatINRPlain(data.totalSubsidy)}
- Net Cost: Rs ${formatINRPlain(data.netCost)}

*Payment Structure:*
- Down Payment (${data.downPaymentPercent}%): Rs ${formatINRPlain(data.downPayment)}
- Loan Amount: Rs ${formatINRPlain(data.loanAmount)}
- EMI (${data.selectedTenure} months): Rs ${formatINRPlain(data.selectedEmi)}/month

*Your Savings @ Rs ${data.electricityRate}/unit:*
- Monthly: Rs ${formatINRPlain(data.monthlySavings)}
- Annual: Rs ${formatINRPlain(data.annualSavings)}
- Effective EMI: Rs ${formatINRPlain(data.effectiveMonthlyPayment)}/month

Website: https://divyanshisolar.com`;
    
    const whatsappUrl = `https://wa.me/91${customerPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }
  
  function handleShareEmail() {
    const data = getProposalData();
    const subject = `Divyanshi Solar - ${data.capacity} kW Solar Rooftop Proposal`;
    const body = `Dear Customer,

Thank you for your interest in Divyanshi Solar's PM Surya Ghar Yojana Solar Rooftop Installation.

PLANT DETAILS:
- Plant Capacity: ${data.capacity} kW
- Panel Type: ${data.panelType === "dcr" ? "DCR (Subsidy Eligible)" : "Non-DCR"}
- Inverter: ${data.inverterType === "hybrid" ? "3-in-1 Hybrid Inverter" : "Ongrid Inverter"}

COST BREAKDOWN:
- Material Cost: Rs ${formatINRPlain(data.totalCost)}
- Central Govt. Subsidy: Rs ${formatINRPlain(data.centralSubsidy)}
- State Govt. Subsidy: Rs ${formatINRPlain(data.stateSubsidy)}
- Total Subsidy Benefit: Rs ${formatINRPlain(data.totalSubsidy)}
- Net System Cost: Rs ${formatINRPlain(data.netCost)}

PAYMENT STRUCTURE:
- ${data.downPaymentPercent}% Down Payment: Rs ${formatINRPlain(data.downPayment)}
- Loan Amount: Rs ${formatINRPlain(data.loanAmount)}
- EMI (${data.selectedTenure} months @ ${data.interestRate}% p.a.): Rs ${formatINRPlain(data.selectedEmi)}/month

YOUR SAVINGS (@ Rs ${data.electricityRate}/unit):
- Monthly Power Generation: ${data.monthlyGeneration} units
- Monthly Savings: Rs ${formatINRPlain(data.monthlySavings)}
- Annual Savings: Rs ${formatINRPlain(data.annualSavings)}
- Effective Monthly Payment: Rs ${formatINRPlain(data.effectiveMonthlyPayment)}
- Payback Period: ${data.paybackYears} years

For more information, visit: https://divyanshisolar.com

Best Regards,
Divyanshi Solar Team
PM Surya Ghar Yojana Authorized Partner`;
    
    const mailtoUrl = `mailto:${customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
  }
  
  if (compact) {
    return (
      <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Sun className="h-5 w-5 text-orange-500" />
            <span className="font-medium">Capacity: {capacity} kW</span>
          </div>
          <Badge variant="secondary" className="text-green-600 dark:text-green-400">
            {result.subsidyEligible ? `Subsidy: ${formatINR(result.totalSubsidy)}` : "No Subsidy"}
          </Badge>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {capacityOptions.map((kw) => (
            <Button
              key={kw}
              type="button"
              variant={capacity === kw ? "default" : "outline"}
              size="sm"
              onClick={() => handleCapacityChange(kw)}
              data-testid={`button-capacity-${kw}kw`}
            >
              {kw} kW
            </Button>
          ))}
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">System Cost:</span>
            <p className="font-medium">{formatINR(result.totalCost)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Your Cost:</span>
            <p className="font-medium text-primary">{formatINR(result.netCost)}</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <Card data-testid="card-subsidy-calculator">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sun className="h-6 w-6 text-orange-500" />
          <CardTitle>PM Surya Ghar Yojana Subsidy Calculator</CardTitle>
        </div>
        <CardDescription>
          Calculate your subsidy amount, estimated savings, and partner commission under the government scheme
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Customer Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.entries(customerTypeConfig) as [CustomerType, typeof customerTypeConfig[CustomerType]][]).map(([type, config]) => {
            const Icon = config.icon;
            return (
              <div
                key={type}
                onClick={() => handleCustomerTypeChange(type)}
                className={`p-4 rounded-lg cursor-pointer transition-all ${
                  customerType === type 
                    ? "bg-primary/10 border-2 border-primary" 
                    : "bg-muted/50 border-2 border-transparent hover-elevate"
                }`}
                data-testid={`button-customer-type-${type}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    customerType === type ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium">{config.label}</p>
                    <p className="text-xs text-muted-foreground">{config.description}</p>
                  </div>
                </div>
                {config.subsidyEligible && (
                  <Badge className="mt-2 bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                    Subsidy Eligible
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-4">
            <Label>Panel Type</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={panelType === "dcr" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setPanelType("dcr")}
                data-testid="button-panel-dcr"
              >
                DCR
              </Button>
              <Button
                type="button"
                variant={panelType === "non_dcr" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setPanelType("non_dcr")}
                data-testid="button-panel-non-dcr"
              >
                Non-DCR
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {panelType === "dcr" 
                ? (result.subsidyEligible ? "DCR panels are eligible for government subsidy" : "DCR panels (subsidy only for residential)")
                : "Non-DCR panels have no subsidy (Rs 55/W)"}
            </p>
          </div>
          
          {panelType === "dcr" && (
            <div className="space-y-4">
              <Label>Inverter Type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={inverterType === "hybrid" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setInverterType("hybrid")}
                  data-testid="button-inverter-hybrid"
                >
                  3-in-1 Hybrid
                </Button>
                <Button
                  type="button"
                  variant={inverterType === "ongrid" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setInverterType("ongrid")}
                  data-testid="button-inverter-ongrid"
                >
                  Ongrid
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {inverterType === "hybrid" 
                  ? `3-in-1 Hybrid Inverter @ Rs ${DCR_HYBRID_RATE_PER_WATT}/W` 
                  : `Ongrid Inverter @ Rs ${DCR_ONGRID_RATE_PER_WATT}/W`}
              </p>
            </div>
          )}
          
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <Label>Solar Plant Capacity</Label>
              <Badge variant="outline" className="font-mono text-lg">
                {capacity} kW
              </Badge>
            </div>
            <div className="flex gap-2 flex-wrap">
              {capacityOptions.map((kw) => (
                <Button
                  key={kw}
                  type="button"
                  variant={capacity === kw ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleCapacityChange(kw)}
                  data-testid={`button-capacity-${kw}kw-full`}
                >
                  {kw} kW
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                max={maxCapacity}
                value={customCapacity}
                onChange={(e) => handleCustomCapacityChange(e.target.value)}
                placeholder="Custom kW"
                className="w-full"
                data-testid="input-custom-capacity"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">kW</span>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {customerType === "residential" 
                ? `Residential: 1-${maxCapacity} kW (Rs ${result.ratePerWatt}/Watt)`
                : `${customerTypeConfig[customerType].label}: 1-${maxCapacity} kW (Rs ${result.ratePerWatt}/Watt)`}
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="state-select">Select State</Label>
            </div>
            <Select value={selectedState} onValueChange={handleStateChange}>
              <SelectTrigger id="state-select" data-testid="select-state">
                <SelectValue placeholder="Select your state for additional subsidies" />
              </SelectTrigger>
              <SelectContent>
                {indianStates.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state} {stateSubsidies[state] ? `(+${formatINR(stateSubsidies[state].ratePerKw)}/kW)` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedState && stateSubsidies[selectedState] && panelType === "dcr" && (
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                {stateSubsidies[selectedState].label}: {formatINR(stateSubsidies[selectedState].ratePerKw)}/kW (Max {formatINR(stateSubsidies[selectedState].maxSubsidy)})
              </Badge>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-muted/30 rounded-lg">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="interest-rate">Loan Interest Rate (%)</Label>
            </div>
            <div className="flex items-center gap-2">
              <Input
                id="interest-rate"
                type="text"
                inputMode="decimal"
                value={interestRateInput}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || /^\d*\.?\d*$/.test(val)) {
                    setInterestRateInput(val);
                    const numVal = parseFloat(val);
                    if (!isNaN(numVal) && numVal >= 1 && numVal <= 25) {
                      setInterestRate(numVal);
                    }
                  }
                }}
                onBlur={() => {
                  const numVal = parseFloat(interestRateInput);
                  if (isNaN(numVal) || numVal < 1) {
                    setInterestRate(10);
                    setInterestRateInput("10");
                  } else if (numVal > 25) {
                    setInterestRate(25);
                    setInterestRateInput("25");
                  } else {
                    setInterestRate(numVal);
                    setInterestRateInput(numVal.toString());
                  }
                }}
                className="w-full"
                data-testid="input-interest-rate"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">% p.a.</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Bank loan interest rate for EMI calculation
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="down-payment">Down Payment (%)</Label>
            </div>
            <div className="flex items-center gap-2">
              <Input
                id="down-payment"
                type="number"
                min="0"
                max="100"
                step="5"
                value={downPaymentPercent}
                onChange={(e) => setDownPaymentPercent(Math.min(100, Math.max(0, parseFloat(e.target.value) || 15)))}
                className="w-full"
                data-testid="input-down-payment"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Initial payment ({formatINR(Math.round(result.netCost * (downPaymentPercent / 100)))})
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="electricity-rate">Electricity Rate (Rs/kWh)</Label>
            </div>
            <div className="flex items-center gap-2">
              <Input
                id="electricity-rate"
                type="text"
                inputMode="decimal"
                value={electricityRateInput}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || /^\d*\.?\d*$/.test(val)) {
                    setElectricityRateInput(val);
                    const numVal = parseFloat(val);
                    if (!isNaN(numVal) && numVal >= 1 && numVal <= 20) {
                      setElectricityUnitRate(numVal);
                    }
                  }
                }}
                onBlur={() => {
                  const numVal = parseFloat(electricityRateInput);
                  if (isNaN(numVal) || numVal < 1) {
                    setElectricityUnitRate(7);
                    setElectricityRateInput("7");
                  } else if (numVal > 20) {
                    setElectricityUnitRate(20);
                    setElectricityRateInput("20");
                  } else {
                    setElectricityUnitRate(numVal);
                    setElectricityRateInput(numVal.toString());
                  }
                }}
                className="w-full"
                data-testid="input-electricity-rate"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">Rs/kWh</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Your electricity bill rate for savings
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-4 bg-muted/50 rounded-lg space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <IndianRupee className="h-4 w-4" />
              <span className="text-sm">System Cost</span>
            </div>
            <p className="text-xl font-semibold font-mono">{formatINR(result.totalCost)}</p>
            <p className="text-xs text-muted-foreground">Rs {result.ratePerWatt}/Watt</p>
          </div>
          
          {panelType === "dcr" && (
            <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg space-y-1">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <TrendingDown className="h-4 w-4" />
                <span className="text-sm">Central Subsidy</span>
              </div>
              <p className="text-xl font-semibold font-mono text-green-600 dark:text-green-400">
                - {formatINR(result.centralSubsidy)}
              </p>
              {capacity > 3 && (
                <p className="text-xs text-muted-foreground">Capped at Rs 78,000</p>
              )}
            </div>
          )}
          
          {panelType === "dcr" && result.stateSubsidy > 0 && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg space-y-1">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">State Subsidy</span>
              </div>
              <p className="text-xl font-semibold font-mono text-blue-600 dark:text-blue-400">
                - {formatINR(result.stateSubsidy)}
              </p>
            </div>
          )}
          
          <div className="p-4 bg-primary/10 rounded-lg space-y-1">
            <div className="flex items-center gap-2 text-primary">
              <IndianRupee className="h-4 w-4" />
              <span className="text-sm">Your Net Cost</span>
            </div>
            <p className="text-xl font-semibold font-mono text-primary">{formatINR(result.netCost)}</p>
          </div>
          
          <div className="p-4 bg-orange-50 dark:bg-orange-950/30 rounded-lg space-y-1">
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <Zap className="h-4 w-4" />
              <span className="text-sm">Annual Savings</span>
            </div>
            <p className="text-xl font-semibold font-mono text-orange-600 dark:text-orange-400">
              {formatINR(result.annualSavings)}
            </p>
          </div>
        </div>
        
        {panelType === "dcr" && result.totalSubsidy > 0 && (
          <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/30 dark:to-blue-950/30 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Subsidy (Central + State)</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                {formatINR(result.totalSubsidy)}
              </p>
            </div>
          </div>
        )}

        {showCommission !== 'none' && (
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-purple-700 dark:text-purple-300">
                <Users className="w-5 h-5" />
                {(showCommission === 'ddp_only' || showCommission === 'bdp_only') ? 'Your Commission' : 'Partner Commission Structure'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {showCommission === 'ddp_only' ? (
                <div className="text-center">
                  <div className="p-4 bg-background rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Your Commission</p>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{formatINR(commission.ddpCommission)}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {panelType === "dcr" 
                        ? (capacity === 3 ? "Rs 20,000 fixed" : capacity === 5 ? "Rs 35,000 fixed" : "Rs 6,000/kW")
                        : "Rs 4,000/kW"}
                    </p>
                  </div>
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground text-center">
                      <strong>{panelType === "dcr" ? "DCR Commission:" : "Non-DCR Commission:"}</strong>{" "}
                      {panelType === "dcr" 
                        ? "3 kW: Rs 20k | 5 kW: Rs 35k | 6+ kW: Rs 6k/kW"
                        : "All capacities: Rs 4,000/kW"}
                    </p>
                  </div>
                </div>
              ) : showCommission === 'bdp_only' ? (
                <div className="text-center">
                  <div className="p-4 bg-background rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Your Commission</p>
                    <p className="text-3xl font-bold text-pink-600 dark:text-pink-400">{formatINR(commission.bdpCommission)}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {panelType === "dcr" 
                        ? (capacity === 3 ? "Rs 10,000 fixed" : capacity === 5 ? "Rs 15,000 fixed" : "Rs 3,000/kW")
                        : "Rs 2,000/kW"}
                    </p>
                  </div>
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground text-center">
                      <strong>{panelType === "dcr" ? "DCR Commission:" : "Non-DCR Commission:"}</strong>{" "}
                      {panelType === "dcr" 
                        ? "3 kW: Rs 10k | 5 kW: Rs 15k | 6+ kW: Rs 3k/kW"
                        : "All capacities: Rs 2,000/kW"}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-background rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">DDP Commission</p>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{formatINR(commission.ddpCommission)}</p>
                      <p className="text-xs text-muted-foreground">
                        {panelType === "dcr" 
                          ? (capacity === 3 ? "Rs 20,000 fixed" : capacity === 5 ? "Rs 35,000 fixed" : "Rs 6,000/kW")
                          : "Rs 4,000/kW"}
                      </p>
                    </div>
                    <div className="p-4 bg-background rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">BDP Commission</p>
                      <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">{formatINR(commission.bdpCommission)}</p>
                      <p className="text-xs text-muted-foreground">
                        {panelType === "dcr" 
                          ? (capacity === 3 ? "Rs 10,000 fixed" : capacity === 5 ? "Rs 15,000 fixed" : "Rs 3,000/kW")
                          : "Rs 2,000/kW"}
                      </p>
                    </div>
                    <div className="p-4 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                      <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Total Commission</p>
                      <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{formatINR(commission.totalCommission)}</p>
                      <p className="text-xs text-muted-foreground">DDP + BDP</p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground text-center">
                      <strong>{panelType === "dcr" ? "DCR Commission:" : "Non-DCR Commission:"}</strong>{" "}
                      {panelType === "dcr" 
                        ? "3 kW (DDP Rs 20k, BDP Rs 10k) | 5 kW (DDP Rs 35k, BDP Rs 15k) | 6+ kW (DDP Rs 6k/kW, BDP Rs 3k/kW)"
                        : "All capacities: DDP Rs 4,000/kW | BDP Rs 2,000/kW"}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
        
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-green-700 dark:text-green-300">
              <Zap className="w-5 h-5" />
              Power Generation & Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-background rounded-lg">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{result.dailyGeneration}</p>
                <p className="text-xs text-muted-foreground">Units/Day</p>
              </div>
              <div className="p-3 bg-background rounded-lg">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{result.monthlyGeneration}</p>
                <p className="text-xs text-muted-foreground">Units/Month</p>
              </div>
              <div className="p-3 bg-background rounded-lg">
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{formatINR(result.monthlySavings)}</p>
                <p className="text-xs text-muted-foreground">Monthly Savings</p>
              </div>
              <div className="p-3 bg-background rounded-lg">
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{formatINR(result.annualSavings)}</p>
                <p className="text-xs text-muted-foreground">Annual Savings</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">
              Based on 4 units/kW/day generation and Rs 7 per unit electricity cost
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-blue-700 dark:text-blue-300">
              <IndianRupee className="w-5 h-5" />
              EMI Calculator with Power Savings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-background rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Net Cost {result.subsidyEligible ? "(After Subsidy)" : ""}</p>
                <p className="text-xl font-bold font-mono">{formatINR(result.netCost)}</p>
              </div>
              <div className="p-4 bg-background rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Down Payment ({result.downPaymentPercent}%)</p>
                <p className="text-xl font-bold font-mono text-green-600">{formatINR(result.downPayment)}</p>
              </div>
              <div className="p-4 bg-background rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Effective Loan Amount</p>
                <p className="text-xl font-bold font-mono text-primary">{formatINR(result.loanAmount)}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4 text-center">
              <div className="p-4 bg-background rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Select EMI Tenure</p>
                <div className="flex gap-1 flex-wrap justify-center">
                  {[36, 48, 60, 72, 84].map((months) => (
                    <Button
                      key={months}
                      type="button"
                      variant={selectedEmiTenure === months ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedEmiTenure(months)}
                      data-testid={`button-emi-${months}months`}
                    >
                      {months}M
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* EMI Comparison Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-3 text-left">Tenure</th>
                    <th className="py-2 px-3 text-right">EMI/Month</th>
                    <th className="py-2 px-3 text-right">Total Interest</th>
                    <th className="py-2 px-3 text-right">Total Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { months: 36, emi: result.emi36Months },
                    { months: 48, emi: result.emi48Months },
                    { months: 60, emi: result.emi60Months },
                    { months: 72, emi: result.emi72Months },
                    { months: 84, emi: result.emi84Months },
                  ].map(({ months, emi }) => (
                    <tr 
                      key={months} 
                      className={`border-b ${selectedEmiTenure === months ? "bg-primary/10" : ""}`}
                    >
                      <td className="py-2 px-3 font-medium">{months} Months ({months / 12} Years)</td>
                      <td className="py-2 px-3 text-right font-mono">{formatINR(emi)}</td>
                      <td className="py-2 px-3 text-right font-mono text-muted-foreground">{formatINR(emi * months - result.netCost)}</td>
                      <td className="py-2 px-3 text-right font-mono">{formatINR(emi * months)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly EMI ({selectedEmiTenure}M)</p>
                  <p className="text-xl font-bold font-mono">{formatINR(selectedEmi)}</p>
                </div>
                <div>
                  <p className="text-sm text-green-600 dark:text-green-400">- Monthly Power Savings</p>
                  <p className="text-xl font-bold font-mono text-green-600 dark:text-green-400">- {formatINR(result.monthlySavings)}</p>
                </div>
                <div className="p-3 bg-background rounded-lg">
                  <p className="text-sm font-medium text-primary">Effective Monthly Payment</p>
                  <p className="text-2xl font-bold font-mono text-primary">
                    {result.monthlySavings >= selectedEmi 
                      ? formatINR(0) + " (FREE!)"
                      : formatINR(selectedEmi - result.monthlySavings)}
                  </p>
                  <p className="text-xs text-muted-foreground">Your actual pocket expense</p>
                </div>
              </div>
            </div>
            
            {result.monthlySavings >= selectedEmi && (
              <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg text-center">
                <p className="text-green-700 dark:text-green-300 font-medium">
                  Your power savings cover the entire EMI! Solar pays for itself from Day 1!
                </p>
              </div>
            )}
            
            <p className="text-xs text-muted-foreground text-center">
              Power savings based on 4 units/kW/day generation at Rs {customerType === "industrial" ? 9 : customerType === "commercial" ? 8 : 7}/unit electricity cost ({customerTypeConfig[customerType].label} rate)
            </p>
          </CardContent>
        </Card>

        <div className="p-4 bg-muted/30 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{result.paybackYears}</p>
              <p className="text-sm text-muted-foreground">Years Payback Period</p>
            </div>
            <div>
              <p className="text-2xl font-bold">25+</p>
              <p className="text-sm text-muted-foreground">Years Panel Lifespan</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{formatINR(result.annualSavings * 25)}</p>
              <p className="text-sm text-muted-foreground">Lifetime Savings</p>
            </div>
          </div>
        </div>
        
        <Card className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border-orange-200 dark:border-orange-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-orange-700 dark:text-orange-300">
              <Power className="w-5 h-5" />
              3-in-1 Hybrid Inverter - Exclusive Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">Works During Power Cuts</p>
                  <p className="text-xs text-muted-foreground">
                    Our solar plant works even when grid power is off. Other solar plants stop working during power cuts.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-background rounded-lg">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                  <BatteryCharging className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-sm">Battery Ready for Night Use</p>
                  <p className="text-xs text-muted-foreground">
                    Add a battery later to store power for night usage. Other plants cannot support battery storage.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-orange-700 dark:text-orange-300 pt-2 border-t border-orange-200 dark:border-orange-800">
              <Check className="w-4 h-4" />
              <span className="font-medium">Included: 3-in-1 Hybrid Inverter with your solar plant at no extra cost</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-purple-700 dark:text-purple-300">
              <FileText className="w-5 h-5" />
              Generate Customer Proposal
            </CardTitle>
            <CardDescription>
              Create a professional PDF proposal to share with your customer
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer-name">Customer Name</Label>
              <Input
                id="customer-name"
                type="text"
                placeholder="Enter customer name for personalized proposal"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                data-testid="input-customer-name"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer-phone">Customer WhatsApp Number</Label>
                <Input
                  id="customer-phone"
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  data-testid="input-customer-phone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-email">Customer Email (Optional)</Label>
                <Input
                  id="customer-email"
                  type="email"
                  placeholder="Enter email address"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  data-testid="input-customer-email"
                />
              </div>
            </div>
            
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-muted-foreground mb-3">District Partner Details (for PDF Proposal)</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="partner-name">Partner Name</Label>
                  <Input
                    id="partner-name"
                    type="text"
                    placeholder="Enter district partner name"
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    data-testid="input-partner-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partner-phone">Partner Mobile Number</Label>
                  <Input
                    id="partner-phone"
                    type="tel"
                    placeholder="Enter 10-digit mobile number"
                    value={partnerPhone}
                    onChange={(e) => setPartnerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    data-testid="input-partner-phone"
                  />
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="installation-address">Proposed Plant Installation Site Address</Label>
                <Input
                  id="installation-address"
                  type="text"
                  placeholder="Enter complete address for solar plant installation"
                  value={installationAddress}
                  onChange={(e) => setInstallationAddress(e.target.value)}
                  data-testid="input-installation-address"
                />
                <p className="text-xs text-muted-foreground">This address will appear on the proposal PDF</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleDownloadProposal}
                className="flex items-center gap-2"
                data-testid="button-download-proposal"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
              
              <Button
                onClick={handleShareWhatsApp}
                disabled={customerPhone.length !== 10}
                variant="outline"
                className="flex items-center gap-2 bg-green-50 hover:bg-green-100 dark:bg-green-950/50 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                data-testid="button-share-whatsapp"
              >
                <MessageCircle className="w-4 h-4" />
                Share on WhatsApp
              </Button>
              
              <Button
                onClick={handleShareEmail}
                disabled={!customerEmail || !customerEmail.includes('@')}
                variant="outline"
                className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                data-testid="button-share-email"
              >
                <Mail className="w-4 h-4" />
                Send via Email
              </Button>
            </div>
            
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>Proposal includes:</strong> {capacity} kW {panelType === "dcr" ? "DCR" : "Non-DCR"} Plant | 
                Material Cost: {formatINR(result.totalCost)} | 
                Subsidy: {formatINR(result.totalSubsidy)} | 
                Down Payment ({downPaymentPercent}%): {formatINR(Math.round(result.netCost * (downPaymentPercent / 100)))} | 
                EMI: {formatINR(selectedEmi)}/month ({selectedEmiTenure} months) | 
                Monthly Savings: {formatINR(result.monthlySavings)}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <div className="text-xs text-muted-foreground space-y-1">
          <p>* DCR Panel Rate: Rs {DCR_HYBRID_RATE_PER_WATT}/W (Hybrid Inverter) | Rs {DCR_ONGRID_RATE_PER_WATT}/W (Ongrid Inverter)</p>
          <p>* Non-DCR Panel Rate: Rs {NON_DCR_RATE_PER_WATT}/W (No Subsidy)</p>
          <p>* Central Subsidy (DCR only): Up to 2 kW - Rs 30,000/kW | 2-3 kW - Rs 18,000/kW | Above 3 kW - Capped at Rs 78,000</p>
          <p>* State Subsidies (DCR only): Odisha - Rs 20,000/kW (Max Rs 60,000) | UP - Rs 10,000/kW (Max Rs 30,000)</p>
          <p>* DCR Commission: 3kW (DDP Rs 20k, BDP Rs 10k) | 5kW (DDP Rs 35k, BDP Rs 15k) | 6+ kW (DDP Rs 6k/kW, BDP Rs 3k/kW)</p>
          <p>* Non-DCR Commission: DDP Rs 4,000/kW | BDP Rs 2,000/kW</p>
          <p>* Calculations based on average solar generation of 4 kWh/kW/day and Rs 7/kWh electricity tariff</p>
        </div>
      </CardContent>
    </Card>
  );
}

export { calculateSubsidy, calculateCommission, formatINR, stateSubsidies, DCR_HYBRID_RATE_PER_WATT, DCR_ONGRID_RATE_PER_WATT, NON_DCR_RATE_PER_WATT };
export type { SubsidyResult, CommissionResult, InverterType };
