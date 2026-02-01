import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import sequelize from "./config/database";
import inventoryRoutes from "./routes/inventory.routes";
import { jwtErrorHandler } from "./middleware/auth";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================================
// MIDDLEWARE
// ============================================================================

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (development only)
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ============================================================================
// ROUTES
// ============================================================================

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// API routes
app.use("/api/inventory", inventoryRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// ============================================================================
// ERROR HANDLERS
// ============================================================================

// JWT authentication error handler
app.use(jwtErrorHandler);

// Global error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error("Unhandled error:", err);

    res.status(err.status || 500).json({
      error: err.name || "Internal Server Error",
      message: err.message || "An unexpected error occurred",
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  },
);

// ============================================================================
// DATABASE CONNECTION & SERVER START
// ============================================================================

const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log("✅ Database connection established successfully");

    // Sync models (development only - use migrations in production)
    if (process.env.NODE_ENV === "development") {
      await sequelize.sync({ alter: false });
      console.log("✅ Database models synchronized");
    }

    // Start Express server
    app.listen(PORT, () => {
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("🚀 Inventory Management System - Backend API");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(`📡 Server running on: http://localhost:${PORT}`);
      console.log(`🔐 Keycloak URL: ${process.env.KEYCLOAK_URL}`);
      console.log(`🗄️  Database: ${process.env.DB_NAME}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("📚 API Endpoints:");
      console.log("   GET  /health                          - Health check");
      console.log("   GET  /api/inventory/materials         - List materials");
      console.log("   GET  /api/inventory/lots              - List lots");
      console.log("   GET  /api/inventory/lots/:lotNumber   - Get lot details");
      console.log(
        "   POST /api/inventory/lots              - Create lot (InventoryManager)",
      );
      console.log(
        "   PATCH /api/inventory/lots/:lotNumber/status - Update status (QC)",
      );
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM signal received: closing server");
  await sequelize.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT signal received: closing server");
  await sequelize.close();
  process.exit(0);
});

// Start the server
startServer();
