import OpenAI from "openai";
import type { Customer } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export interface LeadScoreResult {
  score: number;
  tier: "hot" | "warm" | "cold";
  factors: {
    name: string;
    score: number;
    maxScore: number;
    reason: string;
  }[];
  recommendation: string;
  conversionProbability: number;
}

export async function calculateLeadScore(customer: Customer): Promise<LeadScoreResult> {
  const prompt = `You are an expert lead scoring AI for a solar panel installation company in India under PM Surya Ghar Yojana scheme.

Analyze this customer and provide a lead score from 0-100.

Customer Data:
- Name: ${customer.name}
- State: ${customer.state}
- District: ${customer.district}
- Proposed Capacity: ${customer.proposedCapacity || "Not specified"} kW
- Panel Type: ${customer.panelType || "Not specified"} (DCR = subsidized, Non-DCR = no subsidy)
- Average Monthly Bill: Rs ${customer.avgMonthlyBill || "Not specified"}
- Sanctioned Load: ${customer.sanctionedLoad || "Not specified"} kW
- Roof Type: ${customer.roofType || "Not specified"}
- Roof Area: ${customer.roofArea || "Not specified"} sq ft
- Current Status: ${customer.status}
- Has Email: ${customer.email ? "Yes" : "No"}
- Has Site Pictures: ${customer.sitePictures?.length || 0} pictures uploaded
- Application Age: ${customer.createdAt ? Math.floor((Date.now() - new Date(customer.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : "Unknown"} days

Scoring Factors to Consider:
1. Capacity (higher = more revenue, 3kW+ is ideal for subsidy)
2. Panel Type (DCR is better - eligible for govt subsidy)
3. Monthly Bill (higher bill = more motivation to go solar)
4. Roof Readiness (RCC roof is best, larger area is better)
5. Engagement (email provided, pictures uploaded = more serious)
6. State (Odisha and UP have additional state subsidies)
7. Application Status (further in pipeline = more likely to convert)

Respond in this exact JSON format:
{
  "score": <0-100>,
  "tier": "<hot|warm|cold>",
  "factors": [
    {"name": "Capacity", "score": <0-20>, "maxScore": 20, "reason": "<explanation>"},
    {"name": "Panel Type", "score": <0-15>, "maxScore": 15, "reason": "<explanation>"},
    {"name": "Monthly Bill", "score": <0-15>, "maxScore": 15, "reason": "<explanation>"},
    {"name": "Roof Readiness", "score": <0-15>, "maxScore": 15, "reason": "<explanation>"},
    {"name": "Engagement", "score": <0-15>, "maxScore": 15, "reason": "<explanation>"},
    {"name": "Location", "score": <0-10>, "maxScore": 10, "reason": "<explanation>"},
    {"name": "Status", "score": <0-10>, "maxScore": 10, "reason": "<explanation>"}
  ],
  "recommendation": "<brief action recommendation for the sales team>",
  "conversionProbability": <0-100>
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_completion_tokens: 1024,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    const result = JSON.parse(content) as LeadScoreResult;
    return result;
  } catch (error) {
    console.error("Lead scoring error:", error);
    return calculateFallbackScore(customer);
  }
}

function calculateFallbackScore(customer: Customer): LeadScoreResult {
  let score = 0;
  const factors: LeadScoreResult["factors"] = [];

  const capacity = parseFloat(customer.proposedCapacity || "0");
  const capacityScore = Math.min(20, capacity * 4);
  score += capacityScore;
  factors.push({
    name: "Capacity",
    score: Math.round(capacityScore),
    maxScore: 20,
    reason: capacity >= 3 ? "Good capacity for subsidy" : "Lower capacity",
  });

  const panelScore = customer.panelType === "dcr" ? 15 : 5;
  score += panelScore;
  factors.push({
    name: "Panel Type",
    score: panelScore,
    maxScore: 15,
    reason: customer.panelType === "dcr" ? "DCR - Subsidy eligible" : "Non-DCR - No subsidy",
  });

  const billScore = Math.min(15, ((customer.avgMonthlyBill || 0) / 500) * 3);
  score += billScore;
  factors.push({
    name: "Monthly Bill",
    score: Math.round(billScore),
    maxScore: 15,
    reason: (customer.avgMonthlyBill || 0) >= 2000 ? "High bill - good motivation" : "Lower bill",
  });

  const roofScore = customer.roofType === "rcc" ? 15 : customer.roofType ? 10 : 5;
  score += roofScore;
  factors.push({
    name: "Roof Readiness",
    score: roofScore,
    maxScore: 15,
    reason: customer.roofType === "rcc" ? "RCC roof - ideal" : "Other roof type",
  });

  const engagementScore = (customer.email ? 5 : 0) + ((customer.sitePictures?.length || 0) * 2);
  score += Math.min(15, engagementScore);
  factors.push({
    name: "Engagement",
    score: Math.min(15, engagementScore),
    maxScore: 15,
    reason: engagementScore >= 10 ? "Good engagement" : "Low engagement",
  });

  const locationScore = ["odisha", "up", "uttar pradesh"].includes(customer.state.toLowerCase()) ? 10 : 7;
  score += locationScore;
  factors.push({
    name: "Location",
    score: locationScore,
    maxScore: 10,
    reason: locationScore === 10 ? "State with additional subsidy" : "Standard state",
  });

  const statusScores: Record<string, number> = {
    pending: 2,
    verified: 4,
    approved: 6,
    installation_scheduled: 8,
    completed: 10,
  };
  const statusScore = statusScores[customer.status] || 2;
  score += statusScore;
  factors.push({
    name: "Status",
    score: statusScore,
    maxScore: 10,
    reason: `Status: ${customer.status}`,
  });

  const tier = score >= 70 ? "hot" : score >= 40 ? "warm" : "cold";
  const conversionProbability = Math.min(95, Math.max(5, score));

  return {
    score: Math.round(score),
    tier,
    factors,
    recommendation: tier === "hot" 
      ? "Priority lead - contact immediately for installation scheduling"
      : tier === "warm"
      ? "Follow up within 48 hours to address concerns"
      : "Nurture with information about subsidies and benefits",
    conversionProbability,
  };
}

export async function batchCalculateLeadScores(customers: Customer[]): Promise<Map<string, LeadScoreResult>> {
  const results = new Map<string, LeadScoreResult>();
  
  for (const customer of customers) {
    if (customer.status === "completed") {
      results.set(customer.id, {
        score: 100,
        tier: "hot",
        factors: [],
        recommendation: "Completed installation",
        conversionProbability: 100,
      });
      continue;
    }
    
    try {
      const result = await calculateLeadScore(customer);
      results.set(customer.id, result);
    } catch (error) {
      console.error(`Error scoring customer ${customer.id}:`, error);
      results.set(customer.id, calculateFallbackScore(customer));
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return results;
}
