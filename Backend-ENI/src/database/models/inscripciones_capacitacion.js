import { DataTypes } from "sequelize";
import { sequelize } from "../config.js";

export const InscripcionCapacitacion = sequelize.define(
  "InscripcionCapacitacion",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "usuarios",
        key: "id",
      },
    },
    denominacion_capacitacion: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    fecha_inicio_cap: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    fecha_fin_cap: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    fecha_diligenciamiento: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    opcion_plan_multiplicacion: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    acta_compromiso: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    fecha_multiplicacion: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    validacion_plan: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    nombre_delegado_seguimiento: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    descripcion_plan: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    link_evidencias: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: "inscripciones_capacitacion",
    timestamps: false,
  }
);
