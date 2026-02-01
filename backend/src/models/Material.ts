import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

interface MaterialAttributes {
  material_id: string;
  part_number: string;
  material_name: string;
  material_type: string;
  storage_conditions?: string;
  specification_document?: string;
  created_date?: Date;
  modified_date?: Date;
}

interface MaterialCreationAttributes extends Optional<
  MaterialAttributes,
  "created_date" | "modified_date"
> {}

export class Material
  extends Model<MaterialAttributes, MaterialCreationAttributes>
  implements MaterialAttributes
{
  public material_id!: string;
  public part_number!: string;
  public material_name!: string;
  public material_type!: string;
  public storage_conditions?: string;
  public specification_document?: string;
  public created_date!: Date;
  public modified_date!: Date;
}

Material.init(
  {
    material_id: {
      type: DataTypes.STRING(20),
      primaryKey: true,
      allowNull: false,
    },
    part_number: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    material_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    material_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [
          [
            "API",
            "Excipient",
            "Dietary Supplement",
            "Container",
            "Closure",
            "Process Chemical",
            "Testing Material",
          ],
        ],
      },
    },
    storage_conditions: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    specification_document: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    created_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    modified_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "Materials",
    timestamps: false,
  },
);
