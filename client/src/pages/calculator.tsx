import { SubsidyCalculator } from "@/components/subsidy-calculator";

export default function CalculatorPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Subsidy Calculator</h1>
        <p className="text-muted-foreground">
          Estimate government subsidies and savings under PM Surya Ghar Yojana
        </p>
      </div>
      
      <SubsidyCalculator />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-muted/30 rounded-lg space-y-4">
          <h3 className="font-semibold">Subsidy Eligibility</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">1.</span>
              Residential consumers with grid-connected electricity
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">2.</span>
              Valid electricity bill and consumer number
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">3.</span>
              Adequate shadow-free roof area
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">4.</span>
              One subsidy per residential electricity connection
            </li>
          </ul>
        </div>
        
        <div className="p-6 bg-muted/30 rounded-lg space-y-4">
          <h3 className="font-semibold">Required Documents</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">1.</span>
              Aadhaar Card (linked with mobile)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">2.</span>
              Latest electricity bill
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">3.</span>
              Bank account details (for subsidy credit)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">4.</span>
              Roof photograph (recent)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
