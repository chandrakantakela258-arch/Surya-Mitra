import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import path from "path";

const app = express();

// Serve attached_assets directory for product images
app.use("/attached_assets", express.static(path.resolve(process.cwd(), "attached_assets")));

// Serve uploads directory for site pictures and videos
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

// Seed admin user if it doesn't exist
async function seedAdminUser() {
  try {
    const existingAdmin = await storage.getUserByUsername("admin");
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await storage.createUser({
        username: "admin",
        password: hashedPassword,
        name: "System Admin",
        email: "admin@divyanshisolar.com",
        phone: "9999999999",
        role: "admin",
        district: "All India",
        state: "All India",
        address: "DivyanshiSolar HQ",
        status: "approved",
        parentId: null,
      });
      console.log("Admin user created successfully with hashed password");
    }
  } catch (error) {
    console.error("Error seeding admin user:", error);
  }
}

// Default products catalog
const defaultProducts = [
  // Solar Packages - DCR with Hybrid Inverter
  { name: "3 kW DCR Solar Package (Hybrid Inverter)", description: "Complete 3 kW DCR solar panel system with 3-in-1 hybrid inverter. Eligible for government subsidy. Installation included.", category: "solar_package", price: 225000 },
  { name: "5 kW DCR Solar Package (Hybrid Inverter)", description: "Complete 5 kW DCR solar panel system with 3-in-1 hybrid inverter. Subsidy eligible up to 3 kW. Installation included.", category: "solar_package", price: 375000 },
  { name: "10 kW DCR Solar Package (Hybrid Inverter)", description: "Complete 10 kW DCR solar panel system with 3-in-1 hybrid inverter. Ideal for larger homes. Installation included.", category: "solar_package", price: 750000 },
  // Solar Packages - DCR with Ongrid Inverter
  { name: "3 kW DCR Solar Package (Ongrid Inverter)", description: "Complete 3 kW DCR solar panel system with ongrid inverter. Eligible for government subsidy. Installation included.", category: "solar_package", price: 198000 },
  { name: "5 kW DCR Solar Package (Ongrid Inverter)", description: "Complete 5 kW DCR solar panel system with ongrid inverter. Subsidy eligible up to 3 kW. Installation included.", category: "solar_package", price: 330000 },
  // Solar Packages - Non-DCR
  { name: "3 kW Non-DCR Solar Package", description: "Complete 3 kW non-DCR solar panel system. Budget-friendly option without subsidy. Installation included.", category: "solar_package", price: 165000 },
  { name: "5 kW Non-DCR Solar Package", description: "Complete 5 kW non-DCR solar panel system. Budget-friendly option without subsidy. Installation included.", category: "solar_package", price: 275000 },
  { name: "10 kW Non-DCR Solar Package", description: "Complete 10 kW non-DCR solar panel system. Budget-friendly option for larger installations without subsidy.", category: "solar_package", price: 550000 },
  // Inverters
  { name: "SunPunch Trimax 3.5 kW Inverter", description: "Market's only On-Grid + Off-Grid + Hybrid Inverter. Supports grid-tie, off-grid, and grid-tie with backup modes. Features backflow prevention, parallel operation up to 12 units, remote WiFi monitoring, high PV input up to 500Vdc, built-in MPPT solar controller with 99% efficiency.", category: "accessory", price: 42000 },
  { name: "SunPunch Trimax 5.5 kW Inverter", description: "Market's only On-Grid + Off-Grid + Hybrid Inverter. Supports grid-tie, off-grid, and grid-tie with backup modes. Features backflow prevention, parallel operation up to 12 units, remote WiFi monitoring, high PV input up to 500Vdc, built-in MPPT solar controller with 99% efficiency.", category: "accessory", price: 55000 },
  { name: "SunPunch Trimax 6.2 kW Inverter", description: "Market's only On-Grid + Off-Grid + Hybrid Inverter. Supports grid-tie, off-grid, and grid-tie with backup modes. Features backflow prevention, parallel operation up to 12 units, remote WiFi monitoring, high PV input up to 500Vdc, built-in MPPT solar controller with 99% efficiency.", category: "accessory", price: 65000 },
  // Marketing Materials
  { name: "Solar Panel Brochure Pack (50 pcs)", description: "High-quality printed brochures explaining PM Surya Ghar Yojana benefits and solar installation process. Pack of 50 pieces.", category: "marketing_material", price: 500 },
  { name: "Brochures Tri-Fold (100 pcs)", description: "High-quality tri-fold brochures explaining PM Surya Ghar Yojana benefits and solar installation process. Pack of 100 pieces.", category: "marketing_material", price: 1300 },
  { name: "Solar Subsidy Pamphlet (100 pcs)", description: "Informative pamphlets detailing central and state subsidies for rooftop solar. Pack of 100 pieces.", category: "marketing_material", price: 350 },
  { name: "DivyanshiSolar Banner (3x6 ft)", description: "Large vinyl banner with DivyanshiSolar branding for office or event display. Weather-resistant material.", category: "marketing_material", price: 1200 },
  { name: "Standee Display (Roll-up 3x6 ft)", description: "Portable roll-up standee with solar benefits graphics. Easy to carry and set up at events.", category: "marketing_material", price: 2500 },
  { name: "Standee (2ft x 5ft)", description: "Portable roll-up standee with DivyanshiSolar branding and solar benefits graphics. Easy to carry and set up at events.", category: "marketing_material", price: 1800 },
  { name: "Customer Visiting Cards (500 pcs)", description: "Professional visiting cards with your details and DivyanshiSolar branding. Pack of 500 cards.", category: "marketing_material", price: 800 },
  { name: "Visiting Cards (100 pcs)", description: "Professional visiting cards with your details and DivyanshiSolar branding. Pack of 100 cards.", category: "marketing_material", price: 300 },
  { name: "Personalised Notebooks", description: "Customized notebooks with DivyanshiSolar branding. Perfect for partners and customer meetings.", category: "marketing_material", price: 350 },
  { name: "Customized Key Chains", description: "Branded key chains with DivyanshiSolar logo. Perfect for customer giveaways and promotions.", category: "marketing_material", price: 250 },
];

// Seed default products if they don't exist
async function seedProducts() {
  try {
    const existingProducts = await storage.getAllProducts();
    if (existingProducts.length === 0) {
      console.log("No products found, seeding default catalog...");
      for (const product of defaultProducts) {
        await storage.createProduct({
          name: product.name,
          description: product.description,
          category: product.category,
          price: product.price,
          imageUrl: null,
          isActive: "active",
          stock: 0,
        });
      }
      console.log(`Seeded ${defaultProducts.length} products successfully`);
    } else {
      console.log(`Found ${existingProducts.length} existing products, skipping seed`);
    }
  } catch (error) {
    console.error("Error seeding products:", error);
  }
}
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    limit: '50mb',
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    console.log("Starting server initialization...");
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`PORT: ${process.env.PORT || "5000 (default)"}`);
    console.log(`DATABASE_URL configured: ${!!process.env.DATABASE_URL}`);
    console.log(`SESSION_SECRET configured: ${!!process.env.SESSION_SECRET}`);
    
    // Verify database connection before proceeding
    console.log("Importing database module...");
    const { pool } = await import("./db");
    
    console.log("Testing database connection...");
    try {
      await pool.query("SELECT 1");
      console.log("Database connection successful");
    } catch (dbError) {
      console.error("Database connection failed:", dbError);
      console.log("Continuing server startup - some features may not work");
    }
    
    // Ensure solar_bot_leads table exists (for WhatsApp lead capture)
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "solar_bot_leads" (
          "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
          "phone" text NOT NULL UNIQUE,
          "mobile_number" text,
          "name" text,
          "email" text,
          "language" text DEFAULT 'en',
          "state" text,
          "district" text,
          "city" text,
          "pincode" text,
          "gps_location" text,
          "electricity_board" text,
          "consumer_number" text,
          "meter_type" text,
          "roof_space" text,
          "business_type" text,
          "monthly_billing" text,
          "plant_capacity" text,
          "proposal_status" text,
          "status" text NOT NULL DEFAULT 'New',
          "current_step" decimal DEFAULT '0',
          "created_at" timestamp DEFAULT now(),
          "updated_at" timestamp DEFAULT now()
        );
      `);
      await pool.query(`ALTER TABLE "solar_bot_leads" ADD COLUMN IF NOT EXISTS "mobile_number" text`).catch(() => {});
      await pool.query(`ALTER TABLE "solar_bot_leads" ADD COLUMN IF NOT EXISTS "action_taken" text`).catch(() => {});
      console.log("solar_bot_leads table ready");

      await pool.query(`
        CREATE TABLE IF NOT EXISTS "chatbot_nodes" (
          "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          "step_id" TEXT NOT NULL UNIQUE,
          "label_en" TEXT NOT NULL,
          "label_hi" TEXT NOT NULL,
          "message_en" TEXT NOT NULL,
          "message_hi" TEXT NOT NULL,
          "input_type" TEXT NOT NULL DEFAULT 'text',
          "options" TEXT,
          "media_type" TEXT,
          "media_url" TEXT,
          "media_title" TEXT,
          "saves_field" TEXT,
          "sort_order" INTEGER NOT NULL DEFAULT 0,
          "is_active" BOOLEAN NOT NULL DEFAULT true,
          "created_at" TIMESTAMP DEFAULT now(),
          "updated_at" TIMESTAMP DEFAULT now()
        );
      `);
      await pool.query(`ALTER TABLE "chatbot_nodes" ADD COLUMN IF NOT EXISTS "next_step_rules" JSONB`).catch(() => {});
      console.log("chatbot_nodes table ready");

      const nodeCount = await pool.query(`SELECT COUNT(*) as cnt FROM chatbot_nodes`);
      if (parseInt(nodeCount.rows[0].cnt) === 0) {
        console.log("Seeding default chatbot nodes...");
        await pool.query(`
          INSERT INTO chatbot_nodes (step_id, label_en, label_hi, message_en, message_hi, input_type, options, saves_field, sort_order) VALUES
          ('0', 'Language Selection', 'भाषा चुनें', 'Hi! I am the PM Surya Ghar Solar Bot ☀️\nPlease select your language / कृपया भाषा चुनें:', 'Hi! I am the PM Surya Ghar Solar Bot ☀️\nPlease select your language / कृपया भाषा चुनें:', 'buttons', 'English,हिन्दी', 'language', 1),
          ('1', 'Customer Name', 'ग्राहक का नाम', 'Q1: What is your Name?', 'प्रश्न 1: आपका नाम क्या है?', 'text', NULL, 'name', 2),
          ('1.1', 'Mobile Number', 'मोबाइल नंबर', 'Please enter your 10-digit Mobile Number:', 'कृपया अपना 10-अंकीय मोबाइल नंबर दर्ज करें:', 'text', NULL, 'mobileNumber', 3),
          ('1.2', 'Email ID', 'ईमेल आईडी', 'What is your Email ID?', 'आपकी ईमेल आईडी क्या है?', 'text', NULL, 'email', 4),
          ('2', 'State Selection', 'राज्य चुनें', 'Q2: Please select your State:', 'प्रश्न 2: अपना राज्य चुनें:', 'dropdown', NULL, 'state', 5),
          ('2.1', 'District Selection', 'जिला चुनें', 'Please select your District:', 'अपना जिला चुनें:', 'dropdown', NULL, 'district', 6),
          ('2.2', 'City Selection', 'शहर चुनें', 'Please select your City/Town:', 'अपना शहर/कस्बा चुनें:', 'dropdown', NULL, 'city', 7),
          ('2.3', 'Pin Code', 'पिन कोड', 'What is your Pin Code?', 'आपका पिन कोड क्या है?', 'text', NULL, 'pincode', 8),
          ('2.4', 'GPS Location', 'GPS लोकेशन', 'Please share your GPS Location:', 'अपनी GPS लोकेशन साझा करें:', 'location', NULL, 'gpsLocation', 9),
          ('3', 'Electricity Board', 'विद्युत बोर्ड', 'Q3: Select State Electricity Board:', 'प्रश्न 3: राज्य विद्युत बोर्ड चुनें:', 'dropdown', 'NBPDCL,SBPDCL,UPPCL,DHBVN,UHBVN,JVVNL,Other', 'electricityBoard', 10),
          ('3.1', 'Consumer Number', 'उपभोक्ता नंबर', 'Q3(a): What is your Consumer Number?', 'प्रश्न 3(a): आपका उपभोक्ता नंबर क्या है?', 'text', NULL, 'consumerNumber', 11),
          ('4', 'Connection Type', 'कनेक्शन प्रकार', 'Q4: What is your Connection Type?', 'प्रश्न 4: आपका कनेक्शन प्रकार क्या है?', 'dropdown', 'Residential,Commercial,Industrial', 'meterType', 12),
          ('4.5', 'Residential Plant', 'घरेलू प्लांट', 'Great! For a Residential connection, here are the recommended solar plants for you. Please select:', 'बढ़िया! आपके घरेलू कनेक्शन के लिए अनुशंसित सोलर प्लांट चुनें:', 'dropdown', '3kW On-Grid,3kW 3-in-1 Hybrid,5kW 3-in-1 Hybrid,6kW On-Grid,6kW 3-in-1 Hybrid,6.5kW On-Grid', 'plantCapacity', 13),
          ('6', 'Roof Space', 'छत की जगह', 'Q6: Available Roof Space (in sq ft)?', 'प्रश्न 6: छत पर उपलब्ध जगह (वर्ग फुट में)?', 'text', NULL, 'roofSpace', 14),
          ('7', 'Business Type', 'व्यवसाय का प्रकार', 'Q7: What is your Business Type?', 'प्रश्न 7: आपके व्यवसाय का प्रकार?', 'dropdown', 'Bike/Car Showroom,Aata/Oil/Masala Mill,Tractor Agency,RO/Packaging Plant,Rice Mill,Fabrication Plant,Other Industrial Unit', 'businessType', 15),
          ('7.5', 'Showroom Plant', 'शोरूम प्लांट', 'For Bike/Car Showroom, here are the best suited solar plants. Please select:', 'बाइक/कार शोरूम के लिए अनुशंसित सोलर प्लांट चुनें:', 'dropdown', '3kW On-Grid,3kW 3-in-1 Hybrid', 'plantCapacity', 16),
          ('7.1', 'Monthly Billing', 'मासिक बिल', 'Q7(a): Monthly Electricity Bill Amount?', 'प्रश्न 7(a): मासिक बिजली बिल राशि?', 'dropdown', 'Less than ₹1000,₹2000 - ₹4000,₹4000 - ₹10000,₹15000 - ₹30000,₹50000+,₹100000+', 'monthlyBilling', 17),
          ('7.2', 'Capacity Selection', 'क्षमता चुनें', 'Q7(b): What Capacity Plant do you want to Install?', 'प्रश्न 7(b): कितनी क्षमता का प्लांट लगाना चाहते हैं?', 'dropdown', '2 kW,3 kW,6 kW,15 kW,25 kW,50 kW,100 kW,500 kW,1000 kW', 'plantCapacity', 18),
          ('8', 'Proposal & Interest', 'प्रस्ताव और रुचि', '📄 Based on your selection, here is your estimated Solar Proposal.\n\nOur team will prepare a detailed customized proposal for you shortly.\n\nAre you interested in proceeding?', '📄 आपके चयन के आधार पर यहाँ आपका अनुमानित सोलर प्रस्ताव है।\n\nहमारी टीम जल्द ही एक विस्तृत अनुकूलित प्रस्ताव तैयार करेगी।\n\nक्या आप आगे बढ़ने में रुचि रखते हैं?', 'buttons', 'Interested,Not Interested,Will Call Later,Install after 2-3 months', 'proposalStatus', 19),
          ('9', 'Next Steps', 'अगला कदम', 'Great! How would you like to proceed?', 'बहुत बढ़िया! आप कैसे आगे बढ़ना चाहेंगे?', 'buttons', 'Fill Online Form,Call for Understanding,Schedule Home Visit', 'status', 20),
          ('10', 'Thank You', 'धन्यवाद', 'Thank you for choosing Divyanshi Solar! Our team will contact you soon. ☀️', 'दिव्यांशी सोलर को चुनने के लिए धन्यवाद! हमारी टीम जल्द ही संपर्क करेगी। ☀️', 'none', NULL, NULL, 21)
          ON CONFLICT (step_id) DO NOTHING;
        `);
        console.log("Default chatbot nodes seeded");
      }
    } catch (e) {
      console.log("solar_bot_leads table check:", (e as any).message);
    }

    // Seed admin user on startup
    console.log("Seeding admin user...");
    await seedAdminUser();
    
    // Seed default products on startup
    console.log("Checking products catalog...");
    await seedProducts();
    
    console.log("Registering routes...");
    await registerRoutes(httpServer, app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      console.error("Request error:", err);
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    console.log("Setting up static file serving...");
    if (process.env.NODE_ENV === "development") {
      // Use variable to prevent esbuild from bundling vite dev server into production build
      const vitePath = "./vite" + "";
      const { setupVite } = await import(/* @vite-ignore */ vitePath);
      await setupVite(httpServer, app);
    } else {
      serveStatic(app);
    }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || "5000", 10);
    console.log(`Starting HTTP server on port ${port}...`);
    
    httpServer.listen(
      {
        port,
        host: "0.0.0.0",
        reusePort: true,
      },
      () => {
        log(`serving on port ${port}`);
        console.log("Server initialization complete!");
      },
    );
  } catch (error) {
    console.error("Failed to start server:", error);
    console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace");
    process.exit(1);
  }
})();
