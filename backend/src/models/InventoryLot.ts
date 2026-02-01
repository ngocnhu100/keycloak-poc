import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import { Material } from "./Material";

interface InventoryLotAttributes {
  lot_number: string;
  material_id: string;
  quantity_received: number;
  quantity_available: number;
  lot_status: string;
  supplier?: string;
  manufacturer_lot?: string;
  expiry_date: Date;
  received_date?: Date;
  storage_location?: string;
  notes?: string;
  created_by?: string;
  modified_date?: Date;
}

interface InventoryLotCreationAttributes extends Optional<
  InventoryLotAttributes,
  | "lot_number"
  | "quantity_available"
  | "lot_status"
  | "received_date"
  | "modified_date"
> {}

export class InventoryLot
  extends Model<InventoryLotAttributes, InventoryLotCreationAttributes>
  implements InventoryLotAttributes
{
  public lot_number!: string;
  public material_id!: string;
  public quantity_received!: number;
  public quantity_available!: number;
  public lot_status!: string;
  public supplier?: string;
  public manufacturer_lot?: string;
  public expiry_date!: Date;
  public received_date!: Date;
  public storage_location?: string;
  public notes?: string;
  public created_by?: string;
  public modified_date!: Date;
}

InventoryLot.init(
  {
    lot_number: {
      type: DataTypes.STRING(20),
      primaryKey: true,
      allowNull: false,
    },
    material_id: {
      type: DataTypes.STRING(20),
      allowNull: false,
      references: {
        model: "Materials",
        key: "material_id",
      },
    },
    quantity_received: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    quantity_available: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    lot_status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "Quarantine",
      validate: {
        isIn: [["Quarantine", "Approved", "Rejected", "In Use", "Depleted"]],
      },
    },
    supplier: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    manufacturer_lot: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    expiry_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    received_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    storage_location: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    modified_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "InventoryLots",
    timestamps: false,
  },
);

// Define associations
InventoryLot.belongsTo(Material, { foreignKey: "material_id", as: "material" });
Material.hasMany(InventoryLot, { foreignKey: "material_id", as: "lots" });
