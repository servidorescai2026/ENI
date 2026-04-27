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
      type: DataTypes.STRING(50),
      allowNull: false,
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
    centroFormacion: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "centro_formacion",
    },
    redConocimiento: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "red_conocimiento",
    },
    areaTematica: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "area_tematica",
    },
    competenciaPic: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "competencia_pic",
    },
    modalidad: {
      type: DataTypes.ENUM('Presencial', 'Mixta'),
      allowNull: true,
    },
    estrategia: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    tipoCapacitacion: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "tipo_capacitacion",
    },
    claseCapacitacion: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "clase_capacitacion",
    },
    entidadCapacitadora: {
      type: DataTypes.ENUM('SIEMENS', 'SENA'),
      allowNull: true,
      field: "entidad_capacitadora",
    },
    codigoPrograma: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "codigo_programa",
    },
    codigoCapacitacion: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "codigo_capacitacion",
    },
    nombreFormador: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "nombre_formador",
    },
    fechaInicioPresencial: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "fecha_inicio_presencial",
    },
    fechaFinPresencial: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "fecha_fin_presencial",
    },
    horario: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    lugarCapacitacion: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "lugar_capacitacion",
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
