import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sun, IndianRupee, Zap, TrendingDown, MapPin, BatteryCharging, Power, Check, Users, Home, Building2, Factory, FileText, Share2, Mail, MessageCircle, Download, Wallet } from "lucide-react";
import { indianStates } from "@shared/schema";
import { jsPDF } from "jspdf";

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
  // EMI options for different tenures
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
  electricityUnitRate: number = 7
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
  
  // Power generation: 4 units per kW per day average
  const dailyGeneration = capacityKW * 4;
  const monthlyGeneration = dailyGeneration * 30;
  
  // Use custom electricity unit rate for savings calculation
  const unitCost = electricityUnitRate;
  const monthlySavings = monthlyGeneration * unitCost;
  const annualSavings = monthlySavings * 12;
  
  const paybackYears = netCost > 0 ? netCost / annualSavings : 0;
  
  // Calculate EMI for different tenures using custom interest rate
  const emiTenure = 60;
  const emiMonthly = calculateEMI(netCost, interestRate, emiTenure);
  const emi36Months = calculateEMI(netCost, interestRate, 36);
  const emi48Months = calculateEMI(netCost, interestRate, 48);
  const emi60Months = calculateEMI(netCost, interestRate, 60);
  const emi72Months = calculateEMI(netCost, interestRate, 72);
  const emi84Months = calculateEMI(netCost, interestRate, 84);
  
  return {
    capacity: capacityKW,
    totalCost,
    centralSubsidy,
    stateSubsidy,
    totalSubsidy,
    netCost,
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
}

function generateProposalPDF(data: ProposalData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;
  
  const primaryColor: [number, number, number] = [255, 102, 0];
  const darkColor: [number, number, number] = [51, 51, 51];
  const grayColor: [number, number, number] = [128, 128, 128];
  const greenColor: [number, number, number] = [34, 139, 34];
  
  doc.setFillColor(255, 102, 0);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("DIVYANSHI SOLAR", pageWidth / 2, 18, { align: "center" });
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("PM Surya Ghar Yojana - Solar Rooftop Proposal", pageWidth / 2, 30, { align: "center" });
  
  y = 55;
  
  doc.setTextColor(...darkColor);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Solar Plant Proposal", 20, y);
  
  doc.setFontSize(10);
  doc.setTextColor(...grayColor);
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, pageWidth - 20, y, { align: "right" });
  
  y += 15;
  
  doc.setFillColor(245, 245, 245);
  doc.rect(15, y - 5, pageWidth - 30, 35, 'F');
  
  doc.setTextColor(...darkColor);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("SYSTEM SPECIFICATIONS", 20, y + 3);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  y += 12;
  
  const specs = [
    ["Plant Capacity:", `${data.capacity} kW`],
    ["Panel Type:", data.panelType === "dcr" ? "DCR (Domestic Content Requirement)" : "Non-DCR"],
    ["Inverter Type:", data.inverterType === "hybrid" ? "3-in-1 Hybrid Inverter" : "Ongrid Inverter"],
    ["Customer Type:", data.customerType.charAt(0).toUpperCase() + data.customerType.slice(1)],
  ];
  
  specs.forEach(([label, value], i) => {
    doc.setTextColor(...grayColor);
    doc.text(label, 25, y + (i * 6));
    doc.setTextColor(...darkColor);
    doc.setFont("helvetica", "bold");
    doc.text(value, 75, y + (i * 6));
    doc.setFont("helvetica", "normal");
  });
  
  y += 40;
  
  doc.setFillColor(255, 250, 240);
  doc.rect(15, y - 5, pageWidth - 30, 55, 'F');
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.rect(15, y - 5, pageWidth - 30, 55, 'S');
  
  doc.setTextColor(...primaryColor);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("COST BREAKDOWN", 20, y + 3);
  
  y += 12;
  doc.setFontSize(10);
  
  const costItems = [
    ["Material Cost (@ Rs " + data.ratePerWatt + "/Watt):", formatINR(data.totalCost)],
  ];
  
  if (data.centralSubsidy > 0) {
    costItems.push(["Central Govt. Subsidy:", "- " + formatINR(data.centralSubsidy)]);
  }
  if (data.stateSubsidy > 0) {
    costItems.push(["State Govt. Subsidy:", "- " + formatINR(data.stateSubsidy)]);
  }
  if (data.totalSubsidy > 0) {
    costItems.push(["Total Subsidy Benefit:", "- " + formatINR(data.totalSubsidy)]);
  }
  costItems.push(["Net System Cost:", formatINR(data.netCost)]);
  
  costItems.forEach(([label, value], i) => {
    doc.setTextColor(...grayColor);
    doc.setFont("helvetica", "normal");
    doc.text(label, 25, y + (i * 7));
    
    if (value.startsWith("-")) {
      doc.setTextColor(...greenColor);
    } else {
      doc.setTextColor(...darkColor);
    }
    doc.setFont("helvetica", "bold");
    doc.text(value, pageWidth - 30, y + (i * 7), { align: "right" });
  });
  
  y += costItems.length * 7 + 15;
  
  doc.setFillColor(240, 255, 240);
  doc.rect(15, y - 5, pageWidth - 30, 40, 'F');
  doc.setDrawColor(...greenColor);
  doc.rect(15, y - 5, pageWidth - 30, 40, 'S');
  
  doc.setTextColor(...greenColor);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("PAYMENT STRUCTURE", 20, y + 3);
  
  y += 12;
  doc.setFontSize(10);
  
  const paymentItems = [
    [`${data.downPaymentPercent}% Down Payment:`, formatINR(data.downPayment)],
    ["Loan Amount:", formatINR(data.loanAmount)],
    [`EMI (${data.selectedTenure} months @ ${data.interestRate}% p.a.):`, formatINR(data.selectedEmi) + "/month"],
  ];
  
  paymentItems.forEach(([label, value], i) => {
    doc.setTextColor(...grayColor);
    doc.setFont("helvetica", "normal");
    doc.text(label, 25, y + (i * 7));
    doc.setTextColor(...darkColor);
    doc.setFont("helvetica", "bold");
    doc.text(value, pageWidth - 30, y + (i * 7), { align: "right" });
  });
  
  y += 40;
  
  doc.setFillColor(255, 248, 225);
  doc.rect(15, y - 5, pageWidth - 30, 50, 'F');
  doc.setDrawColor(255, 165, 0);
  doc.rect(15, y - 5, pageWidth - 30, 50, 'S');
  
  doc.setTextColor(200, 100, 0);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("YOUR SAVINGS (@ Rs " + data.electricityRate + "/unit)", 20, y + 3);
  
  y += 12;
  doc.setFontSize(10);
  
  const savingsItems = [
    ["Monthly Power Generation:", data.monthlyGeneration + " units"],
    ["Monthly Savings:", formatINR(data.monthlySavings)],
    ["Annual Savings:", formatINR(data.annualSavings)],
    ["Effective Monthly Payment:", formatINR(data.effectiveMonthlyPayment)],
    ["Payback Period:", data.paybackYears + " years"],
  ];
  
  savingsItems.forEach(([label, value], i) => {
    doc.setTextColor(...grayColor);
    doc.setFont("helvetica", "normal");
    doc.text(label, 25, y + (i * 7));
    doc.setTextColor(...darkColor);
    doc.setFont("helvetica", "bold");
    doc.text(value, pageWidth - 30, y + (i * 7), { align: "right" });
  });
  
  y += 55;
  
  if (data.effectiveMonthlyPayment <= 0) {
    doc.setFillColor(0, 128, 0);
    doc.rect(15, y - 5, pageWidth - 30, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("SOLAR PAYS FOR ITSELF! Your savings cover the entire EMI!", pageWidth / 2, y + 5, { align: "center" });
    y += 20;
  }
  
  const footerY = doc.internal.pageSize.getHeight() - 25;
  doc.setFillColor(51, 51, 51);
  doc.rect(0, footerY - 5, pageWidth, 30, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Divyanshi Solar - Your Trusted Solar Partner", pageWidth / 2, footerY + 5, { align: "center" });
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("Website: https://divyanshisolar.com | PM Surya Ghar Yojana Authorized Partner", pageWidth / 2, footerY + 12, { align: "center" });
  
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
  const [electricityUnitRate, setElectricityUnitRate] = useState<number>(7);
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(15);
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [customerEmail, setCustomerEmail] = useState<string>("");
  
  const maxCapacity = customerTypeConfig[customerType].maxCapacity;
  
  const result = useMemo(() => calculateSubsidy(capacity, selectedState, panelType, inverterType, customerType, interestRate, electricityUnitRate), [capacity, selectedState, panelType, inverterType, customerType, interestRate, electricityUnitRate]);
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
    const downPayment = Math.round(result.netCost * (downPaymentPercent / 100));
    const loanAmount = result.netCost - downPayment;
    const effectiveMonthlyPayment = Math.max(0, selectedEmi - result.monthlySavings);
    
    return {
      capacity,
      panelType,
      inverterType,
      customerType,
      totalCost: result.totalCost,
      centralSubsidy: result.centralSubsidy,
      stateSubsidy: result.stateSubsidy,
      totalSubsidy: result.totalSubsidy,
      netCost: result.netCost,
      downPayment,
      downPaymentPercent,
      loanAmount,
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
    };
  }, [capacity, panelType, inverterType, customerType, result, selectedEmiTenure, selectedEmi, interestRate, electricityUnitRate, selectedState, downPaymentPercent]);
  
  function handleDownloadProposal() {
    const data = getProposalData();
    const doc = generateProposalPDF(data);
    doc.save(`Divyanshi_Solar_Proposal_${capacity}kW_${new Date().toISOString().split('T')[0]}.pdf`);
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
                type="number"
                min="1"
                max="25"
                step="0.5"
                value={interestRate}
                onChange={(e) => setInterestRate(parseFloat(e.target.value) || 10)}
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
                type="number"
                min="1"
                max="20"
                step="0.5"
                value={electricityUnitRate}
                onChange={(e) => setElectricityUnitRate(parseFloat(e.target.value) || 7)}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-background rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Loan Amount {result.subsidyEligible ? "(After Subsidy)" : ""}</p>
                <p className="text-2xl font-bold font-mono text-primary">{formatINR(result.netCost)}</p>
              </div>
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
