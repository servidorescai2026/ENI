import { DataTypes, Op } from "sequelize";
import { sequelize } from "../config.js";
import { Usuario } from "./usuarios.js";
import { Curso } from "./cursos.js";

export const Inscripcion = sequelize.define(
  "Inscripcion",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Usuario,
        key: 'id'
      }
    },
    curso_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Curso,
        key: 'id'
      }
    },
    fecha_inscripcion: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    estado: {
      type: DataTypes.ENUM('activo', 'completado', 'cancelado'),
      defaultValue: 'activo',
      allowNull: false,
    },
  },
  {
    tableName: "inscripciones",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['usuario_id', 'curso_id']
      }
    ]
  }
);

async function validarUnSoloCursoActivo(inscripcion, options = {}) {
  if (inscripcion.estado !== 'activo') return;

  const where = {
    usuario_id: inscripcion.usuario_id,
    estado: 'activo',
  };

  if (inscripcion.id) {
    where.id = { [Op.ne]: inscripcion.id };
  }

  const inscripcionActivaExistente = await Inscripcion.findOne({
    where,
    transaction: options.transaction,
  });

  if (inscripcionActivaExistente) {
    const error = new Error('Solo puedes estar inscrito en un curso activo a la vez');
    error.code = 'SINGLE_ACTIVE_ENROLLMENT';
    throw error;
  }
}

Inscripcion.addHook('beforeCreate', async (inscripcion, options) => {
  await validarUnSoloCursoActivo(inscripcion, options);
});

Inscripcion.addHook('beforeUpdate', async (inscripcion, options) => {
  await validarUnSoloCursoActivo(inscripcion, options);
});

// Definir relaciones
Usuario.hasMany(Inscripcion, {
  foreignKey: 'usuario_id',
  as: 'inscripciones'
});

Inscripcion.belongsTo(Usuario, {
  foreignKey: 'usuario_id',
  as: 'usuario'
});

Curso.hasMany(Inscripcion, {
  foreignKey: 'curso_id',
  as: 'inscripciones'
});

Inscripcion.belongsTo(Curso, {
  foreignKey: 'curso_id',
  as: 'curso'
});