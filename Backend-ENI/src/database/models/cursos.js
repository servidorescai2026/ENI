import { DataTypes } from "sequelize";
import { sequelize } from "../config.js";

export const Curso = sequelize.define(
  "Curso",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    nombre: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      }
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    duracion: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    categoria: {
      type: DataTypes.ENUM('Programación', 'Idiomas', 'Matemáticas', 'Ciencias', 'Negocios', 'Arte', 'Otro'),
      allowNull: false,
    },
    nivel: {
      type: DataTypes.ENUM('Básico', 'Intermedio', 'Avanzado'),
      allowNull: false,
    },
    areaId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'areas',
        key: 'id'
      }
    },
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'usuarios',
        key: 'id'
      }
    },
    fechaInicio: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    fechaFin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    tipoLanzamiento: {
      type: DataTypes.ENUM('fecha', 'cantidad', 'ambos'),
      allowNull: true,
      defaultValue: 'fecha',
    },
    maxPersonas: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
      },
    },
    fechaCierreInscripcion: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notificacionTransferenciaEnviada: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "Indica si ya se envió notificación de transferencia de conocimiento",
    },
    notificacionFaltaEvidenciaEnviada: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: "Indica si ya se notificó al admin sobre falta de evidencia a los 3 meses",
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "cursos",
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);