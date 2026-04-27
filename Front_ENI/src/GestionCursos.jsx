import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "./config/api";
import GetAllCourses from "./services/Cursos/GetAllCourses";
import CreateCourse from "./services/Cursos/CreateCourse";
import UpdateCourse from "./services/Cursos/UpdateCourse";
import DeleteCourse from "./services/Cursos/DeleteCourse";
import GetCourseAreas from "./services/Cursos/GetCourseAreas";
import GetCourseEnrollments from "./services/Inscripciones/GetCourseEnrollments";

export default function GestionCursos() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [areas, setAreas] = useState([]);
  const [areasSeleccionadas, setAreasSeleccionadas] = useState([]);
  const [areaSeleccionTemporal, setAreaSeleccionTemporal] = useState("");
  const [showEnrollments, setShowEnrollments] = useState(false);
  const [currentEnrollments, setCurrentEnrollments] = useState([]);
  const [currentCourseTitle, setCurrentCourseTitle] = useState("");
  const [formData, setFormData] = useState({
    nombre: "",
    descripcion: "",
    duracion: 0,
    categoria: "",
    nivel: "Básico",
    areaId: "",
    fechaInicio: "",
    fechaFin: "",
    tipoLanzamiento: "fecha", // "fecha", "cantidad", "ambos"
    maxPersonas: 0,
    fechaCierreInscripcion: ""
  });

  const parseDateOnlyAsLocal = (value) => {
    if (!value) return null;

    const raw = String(value).trim().slice(0, 10);
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      const [, y, m, d] = match;
      return new Date(Number(y), Number(m) - 1, Number(d), 12, 0, 0);
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const formatDateLocal = (value, locale = "es-ES") => {
    const date = parseDateOnlyAsLocal(value);
    return date ? date.toLocaleDateString(locale) : "N/A";
  };

  useEffect(() => {
    const datosUsuario = JSON.parse(localStorage.getItem("usuario"));
    const token = localStorage.getItem("token");

    if (!token || !datosUsuario) {
      navigate("/login");
    } else if (datosUsuario.rol !== "Administrador") {
      navigate("/usuario");
    } else {
      setUsuario(datosUsuario);
      loadCursos();
      loadAreas();
    }
  }, [navigate]);

  const loadAreas = async () => {
    try {
      const response = await fetch(apiUrl("/api/areas"));
      const data = await response.json();
      setAreas(data.areas || data);
    } catch (error) {
      console.error("Error cargando áreas:", error);
    }
  };

  const loadCursos = async () => {
    try {
      const data = await GetAllCourses();
      setCursos(data);
    } catch (error) {
      console.error("Error cargando cursos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("handleSubmit - Iniciando envío del formulario");
    console.log("FormData:", formData);
    console.log("EditingCourse:", editingCourse);

    // Validación manual antes del envío
    if (
      !formData.nombre ||
      !formData.descripcion ||
      !formData.categoria ||
      formData.duracion <= 0 ||
      areasSeleccionadas.length === 0
    ) {
      console.log("Validación fallida - campos faltantes o inválidos");
      console.log("Datos del formulario:", formData);
      alert(
        "Por favor completa todos los campos requeridos correctamente. " +
          "La duración debe ser mayor a 0 y debes seleccionar al menos un área."
      );
      return;
    }

    try {
      const dataToSend = {
        ...formData,
        // Enviamos un arreglo de áreas, similar al enfoque de notificaciones
        areaIds: areasSeleccionadas.map((a) => a.id)
      };

      if (editingCourse) {
        console.log("Actualizando curso existente");
        await UpdateCourse(editingCourse.id, dataToSend);
      } else {
        console.log("Creando nuevo curso");
        const result = await CreateCourse(dataToSend);
        console.log("Resultado de CreateCourse:", result);
      }
      console.log("Operación exitosa, cerrando modal");
      setShowForm(false);
      setEditingCourse(null);
      setFormData({
        nombre: "",
        descripcion: "",
        duracion: 0,
        categoria: "",
        nivel: "Básico",
        areaId: "",
        fechaInicio: "",
        fechaFin: "",
        tipoLanzamiento: "fecha",
        maxPersonas: 0,
        fechaCierreInscripcion: ""
      });
      // Reiniciar selección de áreas (múltiples)
      setAreasSeleccionadas([]);
      setAreaSeleccionTemporal("");
      loadCursos();
    } catch (error) {
      console.error("Error guardando curso:", error);
      alert(`Error al guardar el curso: ${error.message || 'Error desconocido'}`);
    }
  };

  const handleEdit = async (curso) => {
    setEditingCourse(curso);
    setFormData({
      nombre: curso.nombre,
      descripcion: curso.descripcion,
      duracion: curso.duracion,
      categoria: curso.categoria,
      nivel: curso.nivel,
      areaId: curso.areaId,
      fechaInicio: curso.fechaInicio ? curso.fechaInicio.split('T')[0] : "",
      fechaFin: curso.fechaFin ? curso.fechaFin.split('T')[0] : "",
      tipoLanzamiento: curso.tipoLanzamiento || "fecha",
      maxPersonas: curso.maxPersonas || 0,
      fechaCierreInscripcion: curso.fechaCierreInscripcion ? curso.fechaCierreInscripcion.split('T')[0] : ""
    });

    try {
      // Intentamos obtener las áreas reales del curso desde el backend (many-to-many)
      const areasCurso = await GetCourseAreas(curso.id);
      if (Array.isArray(areasCurso) && areasCurso.length > 0) {
        setAreasSeleccionadas(areasCurso);
      } else if (curso.areaId) {
        // Fallback: si no hay relación many-to-many todavía, usamos el areaId simple
        const areaBase = areas.find((a) => a.id === curso.areaId);
        setAreasSeleccionadas(areaBase ? [areaBase] : []);
      } else {
        setAreasSeleccionadas([]);
      }
    } catch (error) {
      console.error("Error obteniendo áreas del curso:", error);
      // Fallback seguro
      if (curso.areaId) {
        const areaBase = areas.find((a) => a.id === curso.areaId);
        setAreasSeleccionadas(areaBase ? [areaBase] : []);
      } else {
        setAreasSeleccionadas([]);
      }
    }

    setAreaSeleccionTemporal("");
    setShowForm(true);
  };

  const handleDelete = async (cursoId) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este curso?")) {
      try {
        await DeleteCourse(cursoId);
        loadCursos();
      } catch (error) {
        console.error("Error eliminando curso:", error);
        alert(`Error al eliminar el curso: ${error.message || 'Error desconocido'}`);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Convertir campos numéricos a números
    const numericFields = ['duracion', 'maxPersonas'];
    const processedValue = numericFields.includes(name) ? parseFloat(value) || 0 : value;

    setFormData({
      ...formData,
      [name]: processedValue
    });
  };

  const handleViewEnrollments = async (curso) => {
    try {
      const data = await GetCourseEnrollments(curso.id);
      setCurrentEnrollments(data.inscritos || []);
      setCurrentCourseTitle(curso.nombre);
      setShowEnrollments(true);
    } catch (error) {
      console.error("Error cargando inscritos:", error);
      alert("No se pudieron cargar los inscritos del curso");
    }
  };

  if (!usuario) return <p>Cargando...</p>;

  return (
    <div className="gestion-cursos-container">
      <header className="gestion-cursos-header">
        <div className="header-top">
          <div className="header-title-section">
            <h2>📚 Gestión de Cursos</h2>
            <p className="header-subtitle">Administra los cursos disponibles en la plataforma</p>
          </div>
          <div className="header-buttons">
            <button className="btn-panel" onClick={() => navigate("/admin")}>
              🏠 Panel de Usuario
            </button>
            <button className="btn-anim" onClick={() => navigate("/upload-cursos")} type="button">
              📥 Carga masiva
            </button>
            <button className="btn-nuevo" onClick={() => {
              setShowForm(true);
              setEditingCourse(null);
              setFormData({
                nombre: "",
                descripcion: "",
                duracion: 0,
                categoria: "",
                nivel: "Básico",
                areaId: "",
                fechaInicio: "",
                fechaFin: "",
                tipoLanzamiento: "fecha",
                maxPersonas: 0,
                fechaCierreInscripcion: ""
              });
              setAreasSeleccionadas([]);
              setAreaSeleccionTemporal("");
            }}>
              <span className="btn-icon-plus">+</span> Nuevo Curso
            </button>
          </div>
        </div>
      </header>

      <main className="gestion-cursos-main">
        {showForm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>{editingCourse ? "Editar Curso" : "Crear Nuevo Curso"}</h3>
              <form onSubmit={handleSubmit} className="curso-form">
                <div className="form-group">
                  <label>Nombre del Curso:</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Descripción:</label>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleInputChange}
                    required
                    rows="3"
                    style={{
                      maxHeight: "120px",
                      overflowY: "auto",
                      resize: "vertical",
                    }}
                    placeholder="Describe brevemente el contenido del curso..."
                  />
                </div>

                <div className="form-group">
                  <label>Duración (horas):</label>
                  <input
                    type="number"
                    name="duracion"
                    value={formData.duracion}
                    onChange={handleInputChange}
                    required
                    min="1"
                    step="0.5"
                    placeholder="Ej: 4, 7.5, 10"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Categoría:</label>
                    <select
                      name="categoria"
                      value={formData.categoria}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Seleccionar categoría</option>
                      <option value="Programación">Programación</option>
                      <option value="Idiomas">Idiomas</option>
                      <option value="Matemáticas">Matemáticas</option>
                      <option value="Ciencias">Ciencias</option>
                      <option value="Negocios">Negocios</option>
                      <option value="Arte">Arte</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Nivel:</label>
                    <select
                      name="nivel"
                      value={formData.nivel}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="Básico">Básico</option>
                      <option value="Intermedio">Intermedio</option>
                      <option value="Avanzado">Avanzado</option>
                    </select>
                  </div>
                </div>

                {/* Selector de áreas (múltiples) */}
                <div className="form-group">
                  <label>Áreas / Redes del curso:</label>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <select
                      className="input-control"
                      value={areaSeleccionTemporal}
                      onChange={(e) => setAreaSeleccionTemporal(e.target.value)}
                    >
                      <option value="">Selecciona un área</option>
                      {areas.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.codigo} - {a.nombre}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn-anim"
                      onClick={() => {
                        if (!areaSeleccionTemporal) return;

                        const yaExiste = areasSeleccionadas.some(
                          (a) => a.id === Number(areaSeleccionTemporal)
                        );
                        if (yaExiste) return;

                        const areaObj = areas.find(
                          (a) => a.id === Number(areaSeleccionTemporal)
                        );
                        if (!areaObj) return;

                        setAreasSeleccionadas((prev) => [...prev, areaObj]);
                        setAreaSeleccionTemporal("");
                      }}
                    >
                      Agregar
                    </button>
                  </div>

                  {/* Lista de áreas seleccionadas */}
                  {areasSeleccionadas.length > 0 && (
                    <div
                      style={{
                        marginTop: "0.75rem",
                        padding: "0.75rem 1rem",
                        borderRadius: "8px",
                        border: "1px solid #e0e0e0",
                        background: "#f9fafb",
                      }}
                    >
                      <p
                        style={{
                          margin: "0 0 0.5rem 0",
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          color: "#374151",
                        }}
                      >
                        Áreas seleccionadas:
                      </p>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "0.5rem",
                        }}
                      >
                        {areasSeleccionadas.map((a) => (
                          <div
                            key={a.id}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.35rem",
                              padding: "0.35rem 0.6rem",
                              borderRadius: "999px",
                              background: "#e0f2fe",
                              color: "#0f172a",
                              fontSize: "0.85rem",
                            }}
                          >
                            <span>
                              {a.codigo} - {a.nombre}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setAreasSeleccionadas((prev) =>
                                  prev.filter((x) => x.id !== a.id)
                                )
                              }
                              style={{
                                border: "none",
                                background: "transparent",
                                color: "#0f172a",
                                cursor: "pointer",
                                fontWeight: "bold",
                                lineHeight: 1,
                              }}
                              title="Quitar área"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Fechas del curso */}
                <div className="form-row">
                  <div className="form-group">
                    <label>📅 Fecha de Inicio:</label>
                    <input
                      type="date"
                      name="fechaInicio"
                      value={formData.fechaInicio}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>📅 Fecha de Finalización:</label>
                    <input
                      type="date"
                      name="fechaFin"
                      value={formData.fechaFin}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                {/* Tipo de lanzamiento */}
                <div className="form-group">
                  <label>🚀 Tipo de Lanzamiento:</label>
                  <select
                    name="tipoLanzamiento"
                    value={formData.tipoLanzamiento}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="fecha">Por Fecha de Cierre</option>
                    <option value="cantidad">Por Cantidad de Personas</option>
                    <option value="ambos">Ambos (Fecha y Cantidad)</option>
                  </select>
                </div>

                {/* Campos condicionales según tipo de lanzamiento */}
                {(formData.tipoLanzamiento === "fecha" || formData.tipoLanzamiento === "ambos") && (
                  <div className="form-group">
                    <label>📆 Fecha de Cierre de Inscripción:</label>
                    <input
                      type="date"
                      name="fechaCierreInscripcion"
                      value={formData.fechaCierreInscripcion}
                      onChange={handleInputChange}
                      required={formData.tipoLanzamiento === "fecha" || formData.tipoLanzamiento === "ambos"}
                    />
                    <small className="form-hint">Los usuarios podrán inscribirse hasta esta fecha</small>
                  </div>
                )}

                {(formData.tipoLanzamiento === "cantidad" || formData.tipoLanzamiento === "ambos") && (
                  <div className="form-group">
                    <label>👥 Máximo de Personas:</label>
                    <input
                      type="number"
                      name="maxPersonas"
                      value={formData.maxPersonas}
                      onChange={handleInputChange}
                      required={formData.tipoLanzamiento === "cantidad" || formData.tipoLanzamiento === "ambos"}
                      min="1"
                      placeholder="Ej: 30"
                    />
                    <small className="form-hint">El curso se cerrará al alcanzar este número de inscritos</small>
                  </div>
                )}

                <div className="form-actions">
                  <button type="submit" className="btn-guardar">
                    {editingCourse ? "Actualizar" : "Crear"} Curso
                  </button>
                  <button type="button" className="btn-cancelar" onClick={() => {
                    setShowForm(false);
                    setEditingCourse(null);
                  }}>
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="cursos-section">
          <div className="section-header">
            <h3>Cursos Disponibles</h3>
            <div className="curso-count-badge">
              <span>{cursos.length}</span>
              <small>{cursos.length === 1 ? 'curso' : 'cursos'}</small>
            </div>
          </div>

          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Cargando cursos...</p>
            </div>
          ) : cursos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <h4>No hay cursos disponibles</h4>
              <p>Crea el primer curso para comenzar a gestionar tu catálogo educativo</p>
              <button className="btn-nuevo-empty" onClick={() => {
                setShowForm(true);
                setEditingCourse(null);
                setFormData({
                  nombre: "",
                  descripcion: "",
                  duracion: 0,
                  categoria: "",
                  nivel: "Básico",
                  areaId: "",
                  fechaInicio: "",
                  fechaFin: "",
                  tipoLanzamiento: "fecha",
                  maxPersonas: 0,
                  fechaCierreInscripcion: ""
                });
                // Reiniciar selección de áreas (múltiples)
                setAreasSeleccionadas([]);
                setAreaSeleccionTemporal("");
              }}>
                + Crear Primer Curso
              </button>
            </div>
          ) : (
            <div className="cursos-grid">
              {cursos.map((curso) => (
                <div key={curso.id} className="curso-card">
                  <div className="curso-card-header">
                    <div className="curso-header-info">
                      <h4>{curso.nombre}</h4>
                      <span className={`categoria-badge categoria-${curso.categoria.toLowerCase().replace(/\s+/g, '-')}`}>
                        {curso.categoria}
                      </span>
                    </div>
                    <span className={`nivel-badge nivel-${curso.nivel.toLowerCase()}`}>
                      {curso.nivel}
                    </span>
                  </div>

                  <div className="curso-card-body">
                    <p className="curso-descripcion">{curso.descripcion}</p>
                    <div className="curso-info-grid">
                      <div className="info-item">
                        <span className="info-icon">⏱️</span>
                        <div>
                          <span className="info-label">Duración</span>
                          <span className="info-value">{curso.duracion} horas</span>
                        </div>
                      </div>
                      <div className="info-item">
                        <span className="info-icon">🏢</span>
                        <div>
                          <span className="info-label">Área</span>
                          <span className="info-value">{curso.areaId}</span>
                        </div>
                      </div>
                      {curso.fechaInicio && (
                        <div className="info-item">
                          <span className="info-icon">📅</span>
                          <div>
                            <span className="info-label">Inicio</span>
                            <span className="info-value">{formatDateLocal(curso.fechaInicio, "es-ES")}</span>
                          </div>
                        </div>
                      )}
                      {curso.fechaFin && (
                        <div className="info-item">
                          <span className="info-icon">🏁</span>
                          <div>
                            <span className="info-label">Fin</span>
                            <span className="info-value">{formatDateLocal(curso.fechaFin, "es-ES")}</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Contador de inscritos */}
                    <div style={{ marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px solid #e0e0e0' }}>
                      <div className="info-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span className="info-icon">👥</span>
                          <span style={{ marginLeft: '0.5rem' }}>
                            <strong>Inscritos activos:</strong> {curso.inscritosActivos || 0}
                            {curso.maxPersonas ? ` / ${curso.maxPersonas}` : ''}
                          </span>
                        </div>
                        {(curso.inscritosActivos > 0) && (
                          <button 
                            className="btn-editar" 
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.85rem', margin: 0 }}
                            onClick={() => handleViewEnrollments(curso)}
                            type="button"
                          >
                            Ver lista
                          </button>
                        )}
                      </div>
                      {curso.cuposDisponibles !== null && curso.cuposDisponibles === 0 && (
                        <span style={{ color: 'red', fontSize: '0.85rem', marginTop: '0.3rem', display: 'block' }}>
                          ⚠️ Cupo lleno
                        </span>
                      )}
                    </div>
                    
                    {/* Badge de tipo de lanzamiento */}
                    {curso.tipoLanzamiento && (
                      <div style={{ marginTop: '0.8rem' }}>
                        <span className={`lanzamiento-badge ${curso.tipoLanzamiento}`}>
                          {curso.tipoLanzamiento === 'fecha' && `📆 Cierre: ${curso.fechaCierreInscripcion ? formatDateLocal(curso.fechaCierreInscripcion, "es-ES") : 'N/A'}`}
                          {curso.tipoLanzamiento === 'cantidad' && `👥 Máx: ${curso.maxPersonas || 0} personas`}
                          {curso.tipoLanzamiento === 'ambos' && `📆 Cierre: ${curso.fechaCierreInscripcion ? formatDateLocal(curso.fechaCierreInscripcion, "es-ES") : 'N/A'} | 👥 Máx: ${curso.maxPersonas || 0}`}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="curso-card-actions">
                    <button className="btn-editar" onClick={() => handleEdit(curso)}>
                      <span>✏️</span> Editar
                    </button>
                    <button className="btn-eliminar" onClick={() => handleDelete(curso.id)}>
                      <span>🗑️</span> Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal de inscritos */}
      {showEnrollments && (
        <div className="modal-overlay" onClick={() => setShowEnrollments(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <h3 style={{ 
              color: '#2c3e50', 
              borderBottom: '3px solid #3498db', 
              paddingBottom: '0.8rem',
              marginBottom: '1.5rem'
            }}>
              👥 Inscritos en: {currentCourseTitle}
            </h3>
            {currentEnrollments.length === 0 ? (
              <p style={{ 
                textAlign: 'center', 
                padding: '2rem', 
                color: '#666',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #dee2e6'
              }}>
                No hay inscritos activos en este curso.
              </p>
            ) : (
              <div>
                <div style={{ 
                  backgroundColor: '#f1f3f5',
                  padding: '0.8rem',
                  borderRadius: '8px 8px 0 0',
                  marginBottom: '0.5rem'
                }}>
                  <strong style={{ color: '#495057' }}>
                    Total de inscritos: {currentEnrollments.length}
                  </strong>
                </div>
                <div style={{ 
                  maxHeight: '400px', 
                  overflowY: 'auto',
                  border: '1px solid #dee2e6',
                  borderRadius: '0 0 8px 8px'
                }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ 
                        backgroundColor: '#4a90e2',
                        color: 'white',
                        textAlign: 'left',
                        position: 'sticky',
                        top: 0
                      }}>
                        <th style={{ padding: '1rem', fontWeight: '600' }}>Nombre Completo</th>
                        <th style={{ padding: '1rem', fontWeight: '600' }}>Correo Electrónico</th>
                        <th style={{ padding: '1rem', fontWeight: '600', textAlign: 'center' }}>Fecha Inscripción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentEnrollments.map((inscripcion, index) => (
                        <tr 
                          key={inscripcion.id || index} 
                          style={{ 
                            backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa',
                            borderBottom: '1px solid #dee2e6',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e7f3ff'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa'}
                        >
                          <td style={{ padding: '1rem', color: '#2c3e50', fontWeight: '500' }}>
                            {inscripcion.usuario.nombre} {inscripcion.usuario.apellido}
                          </td>
                          <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#495057' }}>
                            {inscripcion.usuario.email}
                          </td>
                          <td style={{ 
                            padding: '1rem', 
                            fontSize: '0.9rem', 
                            color: '#6c757d',
                            textAlign: 'center'
                          }}>
                            {new Date(inscripcion.fecha_inscripcion).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: '2-digit', 
                              year: 'numeric'
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <button className="btn-cancelar" onClick={() => setShowEnrollments(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
