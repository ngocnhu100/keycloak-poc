import express from "express";
import { checkJwt, requireRole } from "../middleware/auth";
import * as inventoryController from "../controllers/inventory.controller";

const router = express.Router();

// All routes require valid JWT token
router.use(checkJwt);

// ============================================================================
// MATERIALS ROUTES
// ============================================================================

/**
 * GET /api/inventory/materials
 * Get all materials
 * Accessible by: All authenticated users
 */
router.get(
  "/materials",
  requireRole([
    "viewer",
    "inventory_manager",
    "quality_control",
    "production",
    "admin",
  ]),
  inventoryController.getAllMaterials,
);

// ============================================================================
// INVENTORY LOTS ROUTES
// ============================================================================

/**
 * GET /api/inventory/lots
 * Get all inventory lots
 * Accessible by: All authenticated users
 */
router.get(
  "/lots",
  requireRole([
    "viewer",
    "inventory_manager",
    "quality_control",
    "production",
    "admin",
  ]),
  inventoryController.getAllLots,
);

/**
 * GET /api/inventory/lots/:lotNumber
 * Get specific lot by lot number
 * Accessible by: All authenticated users
 */
router.get(
  "/lots/:lotNumber",
  requireRole([
    "viewer",
    "inventory_manager",
    "quality_control",
    "production",
    "admin",
  ]),
  inventoryController.getLotByNumber,
);

/**
 * POST /api/inventory/lots
 * Create new inventory lot (Receiving)
 * Accessible by: inventory_manager, admin only
 */
router.post(
  "/lots",
  requireRole(["inventory_manager", "admin"]),
  inventoryController.createLot,
);

/**
 * PATCH /api/inventory/lots/:lotNumber/status
 * Update lot status (QC approval/rejection)
 * Accessible by: quality_control, admin only
 */
router.patch(
  "/lots/:lotNumber/status",
  requireRole(["quality_control", "admin"]),
  inventoryController.updateLotStatus,
);

export default router;
