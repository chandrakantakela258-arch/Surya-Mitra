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
