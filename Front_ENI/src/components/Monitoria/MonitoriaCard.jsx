import React from "react";
import { useNavigate } from "react-router-dom";
import { abbreviateAreaName } from "../../utils/areaLabel";

const MonitoriaCard = ({ formador }) => {
  const navigate = useNavigate();

  const getStatusLabel = (estado) => {
    switch (estado) {
      case 'pendiente': return 'Pendiente';
      case 'pendiente-revision': return 'En Revisión';
      case 'rechazado': return 'Rechazado';
      case 'al-dia': return 'Al día';
      default: return 'Desconocido';
    }
  };

  const getCardClass = (estado) => {
    switch (estado) {
      case 'pendiente': return 'card-pendiente';
      case 'pendiente-revision': return 'card-revision';
      case 'rechazado': return 'card-rechazado';
      default: return 'card-ok';
    }
  };

  return (
    <div className={`monitoria-card ${getCardClass(formador.estado)}`}>
      <div className="card-header">
        <div className="formador-avatar">
          {formador.nombre?.charAt(0).toUpperCase()}
        </div>
        <div className="formador-info">
          <h3>{formador.nombre} {formador.apellido}</h3>
          <p className="formador-email">{formador.email}</p>
        </div>
        <div className="monitoria-status-stack">
          <span className={`monitoria-status-pill monitoria-status-pill--${formador.estado}`}>
            {getStatusLabel(formador.estado)}
          </span>
        </div>
      </div>

      <div className="card-body">
        <div className="info-row">
          <span className="label">📍 Área:</span>
          <span className="value">
            {abbreviateAreaName(formador.areaNombre || formador.areaCodigo || `Área ${formador.areaId}`)}
          </span>
        </div>

        <div className="info-row">
          <span className="label">📚 Cursos asignados:</span>
          <span className="value">{formador.cursosAsignados ?? 0}</span>
        </div>

        <div className="info-row">
          <span className="label">📎 Total evidencias:</span>
          <span className="value">{formador.totalEvidencias}</span>
        </div>

        <div className="info-row">
          <span className="label">📅 Evidencias este mes:</span>
          <span className={`value ${formador.evidenciasEsteMes === 0 ? 'alerta' : ''}`}>
            {formador.evidenciasEsteMes}
          </span>
        </div>

        {formador.estado === 'pendiente' && formador.diasSinEvidencia !== null && (
          <div className="info-row alerta">
            <span className="label">⏳ Días en deuda:</span>
            <span className="value">{formador.diasSinEvidencia} días</span>
          </div>
        )}

        {formador.evidenciasPendientes > 0 && (
          <div className="info-row pendiente">
            <span className="label">⏳ Pendientes de revisión:</span>
            <span className="value">{formador.evidenciasPendientes}</span>
          </div>
        )}

        {formador.evidenciasRechazadas > 0 && (
          <div className="info-row rechazado">
            <span className="label">❌ Evidencias rechazadas:</span>
            <span className="value">{formador.evidenciasRechazadas}</span>
          </div>
        )}
      </div>

      <div className="card-footer">
        <button
          className="btn-detalle"
          onClick={() => navigate(`/detalles-formador/${formador.id}`)}
        >
          Ver detalles
        </button>
      </div>
    </div>
  );
};

export default MonitoriaCard;
