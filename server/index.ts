import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { storage } from "./storage";
import path from "path";

const app = express();

// Serve attached_assets directory for product images
app.use("/attached_assets", express.static(path.resolve(process.cwd(), "attached_assets")));

// Seed admin user if it doesn't exist
async function seedAdminUser() {
  try {
    const existingAdmin = await storage.getUserByUsername("admin");
    if (!existingAdmin) {
      await storage.createUser({
        username: "admin",
        password: "admin123",
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
      console.log("Admin user created successfully");
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
    if (process.env.NODE_ENV === "production") {
      serveStatic(app);
    } else {
      const { setupVite } = await import("./vite");
      await setupVite(httpServer, app);
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
