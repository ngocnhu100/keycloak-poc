import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

interface InventoryTransactionAttributes {
  transaction_id?: number;
  lot_number: string;
  transaction_type: string;
  quantity: number;
  transaction_date?: Date;
  performed_by: string;
  reason?: string;
  reference_document?: string;
}

interface InventoryTransactionCreationAttributes extends Optional<
  InventoryTransactionAttributes,
  "transaction_id" | "transaction_date" | "reason" | "reference_document"
> {}

export class InventoryTransaction
  extends Model<
    InventoryTransactionAttributes,
    InventoryTransactionCreationAttributes
  >
  implements InventoryTransactionAttributes
{
  public transaction_id!: number;
  public lot_number!: string;
  public transaction_type!: string;
  public quantity!: number;
  public transaction_date!: Date;
  public performed_by!: string;
  public reason?: string;
  public reference_document?: string;
}

InventoryTransaction.init(
  {
    transaction_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    lot_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
      references: {
        model: "InventoryLots",
        key: "lot_number",
      },
    },
    transaction_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [["Receipt", "Dispense", "Adjust", "Return", "Waste"]],
      },
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
    },
    transaction_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    performed_by: {
      type: DataTypes.STRING(36),
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    reference_document: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "InventoryTransactions",
    timestamps: false,
  },
);
