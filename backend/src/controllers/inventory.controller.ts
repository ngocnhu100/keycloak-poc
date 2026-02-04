import { Request, Response } from "express";
import { InventoryLot } from "../models/InventoryLot";
import { InventoryTransaction } from "../models/InventoryTransaction";
import { Material } from "../models/Material";
import Joi from "joi";
import sequelize from "../config/database";

/**
 * Validation schema for creating inventory lot
 */
const createLotSchema = Joi.object({
  material_id: Joi.string().max(20).required(),
  quantity_received: Joi.number().positive().required(),
  expiry_date: Joi.date().iso().required(),
  supplier: Joi.string().max(100).optional(),
  manufacturer_lot: Joi.string().max(50).optional(),
  storage_location: Joi.string().max(50).optional(),
  notes: Joi.string().optional(),
});

/**
 * GET /api/inventory/lots
 * Get all inventory lots with material details
 */
export const getAllLots = async (req: Request, res: Response) => {
  try {
    const { status, material_id, limit = 50 } = req.query;

    const whereClause: any = {};
    if (status) whereClause.lot_status = status;
    if (material_id) whereClause.material_id = material_id;

    const lots = await InventoryLot.findAll({
      where: whereClause,
      include: [
        {
          model: Material,
          as: "material",
          attributes: [
            "material_id",
            "material_name",
            "material_type",
            "part_number",
          ],
        },
      ],
      order: [["received_date", "DESC"]],
      limit: parseInt(limit as string),
    });

    res.json({
      success: true,
      count: lots.length,
      data: lots,
      user: req.user,
    });
  } catch (error: any) {
    console.error("Error fetching lots:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch inventory lots",
      details: error.message,
    });
  }
};

/**
 * GET /api/inventory/lots/:lotNumber
 * Get specific inventory lot by lot number
 */
export const getLotByNumber = async (req: Request, res: Response) => {
  try {
    const { lotNumber } = req.params;

    const lot = await InventoryLot.findByPk(lotNumber, {
      include: [
        {
          model: Material,
          as: "material",
        },
      ],
    });

    if (!lot) {
      return res.status(404).json({
        error: "Not Found",
        message: `Lot ${lotNumber} not found`,
      });
    }

    res.json({
      success: true,
      data: lot,
    });
  } catch (error: any) {
    console.error("Error fetching lot:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch lot details",
      details: error.message,
    });
  }
};

/**
 * POST /api/inventory/lots
 * Create new inventory lot (Receiving)
 * Required role: inventory_manager or admin
 */
export const createLot = async (req: Request, res: Response) => {
  try {
    // Validate request body
    const { error, value } = createLotSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: "Validation Error",
        message: error.details[0].message,
      });
    }

    const {
      material_id,
      quantity_received,
      expiry_date,
      supplier,
      manufacturer_lot,
      storage_location,
      notes,
    } = value;

    const performedBy = req.user?.id;
    if (!performedBy) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Missing user identity in token",
      });
    }

    // Check if material exists
    const material = await Material.findByPk(material_id);
    if (!material) {
      return res.status(404).json({
        error: "Not Found",
        message: `Material ${material_id} not found`,
      });
    }

    // Generate unique lot number (LOT-YYYYMMDD-XXXX)
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const lot_number = `LOT-${today}-${randomSuffix}`;

    // Create lot + receipt transaction in a single DB transaction
    await sequelize.transaction(async (t) => {
      await InventoryLot.create(
        {
          lot_number,
          material_id,
          quantity_received,
          quantity_available: quantity_received, // Initially same as received
          lot_status: "Quarantine", // Default status
          supplier,
          manufacturer_lot,
          expiry_date,
          storage_location,
          notes,
          created_by: req.user?.username,
          received_date: new Date(),
        },
        { transaction: t },
      );

      await InventoryTransaction.create(
        {
          lot_number,
          transaction_type: "Receipt",
          quantity: quantity_received,
          performed_by: performedBy,
          reason: "Lot received",
        },
        { transaction: t },
      );
    });

    // Fetch complete lot with material details
    const lotWithMaterial = await InventoryLot.findByPk(lot_number, {
      include: [
        {
          model: Material,
          as: "material",
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Inventory lot created successfully",
      data: lotWithMaterial,
      created_by: req.user?.username,
    });
  } catch (error: any) {
    console.error("Error creating lot:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to create inventory lot",
      details: error.message,
    });
  }
};

/**
 * PATCH /api/inventory/lots/:lotNumber/status
 * Update lot status (QC approval/rejection)
 * Required role: quality_control or admin
 */
export const updateLotStatus = async (req: Request, res: Response) => {
  try {
    const { lotNumber } = req.params;
    const { status, notes } = req.body;

    // Validate status
    const validStatuses = [
      "Quarantine",
      "Approved",
      "Rejected",
      "In Use",
      "Depleted",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: "Validation Error",
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    // Find lot
    const lot = await InventoryLot.findByPk(lotNumber);
    if (!lot) {
      return res.status(404).json({
        error: "Not Found",
        message: `Lot ${lotNumber} not found`,
      });
    }

    // Update status
    lot.lot_status = status;
    if (notes) lot.notes = notes;
    lot.modified_date = new Date();
    await lot.save();

    // Fetch updated lot with material
    const updatedLot = await InventoryLot.findByPk(lotNumber, {
      include: [
        {
          model: Material,
          as: "material",
        },
      ],
    });

    res.json({
      success: true,
      message: "Lot status updated successfully",
      data: updatedLot,
      updated_by: req.user?.username,
    });
  } catch (error: any) {
    console.error("Error updating lot status:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to update lot status",
      details: error.message,
    });
  }
};

/**
 * GET /api/inventory/materials
 * Get all materials
 */
export const getAllMaterials = async (req: Request, res: Response) => {
  try {
    const materials = await Material.findAll({
      order: [["material_id", "ASC"]],
    });

    res.json({
      success: true,
      count: materials.length,
      data: materials,
    });
  } catch (error: any) {
    console.error("Error fetching materials:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "Failed to fetch materials",
      details: error.message,
    });
  }
};
