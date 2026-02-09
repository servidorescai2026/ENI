import { DataTypes } from "sequelize";
import { sequelize } from "../config.js";

export const Area = sequelize.define(
  "Area",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    codigo: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    nombre: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
  },
  {
    tableName: "areas",
    timestamps: false,
  }
);
