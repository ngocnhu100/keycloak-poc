import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

interface UserAttributes {
  user_id: string;
  username: string;
  email?: string;
  created_at?: Date;
  last_seen_at?: Date;
}

interface UserCreationAttributes extends Optional<
  UserAttributes,
  "email" | "created_at" | "last_seen_at"
> {}

export class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public user_id!: string;
  public username!: string;
  public email?: string;
  public created_at?: Date;
  public last_seen_at?: Date;
}

User.init(
  {
    user_id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    last_seen_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: "Users",
    timestamps: false,
  },
);
