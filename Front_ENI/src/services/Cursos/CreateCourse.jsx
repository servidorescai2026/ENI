import { apiUrl } from "../../config/api";

export default function CreateCourse(formData) {
  const token = localStorage.getItem("token");

  // Permitir tanto areaIds (nuevo esquema, múltiples áreas)
  // como areaId (compatible con versiones anteriores)
  let areaIds = [];
  if (Array.isArray(formData.areaIds)) {
    areaIds = formData.areaIds;
  } else if (formData.areaIds && typeof formData.areaIds === "string") {
    try {
      const parsed = JSON.parse(formData.areaIds);
      if (Array.isArray(parsed)) {
        areaIds = parsed;
      }
    } catch (e) {
      // ignorar error de parseo, caer al fallback de areaId
    }
  }

  if (!areaIds.length && formData.areaId) {
    areaIds = [formData.areaId];
  }

  const courseData = {
    nombre: formData.nombre,
    descripcion: formData.descripcion,
    duracion: Number(formData.duracion),
    categoria: formData.categoria,
    nivel: formData.nivel,
    areaId: areaIds.length ? Number(areaIds[0]) : undefined,
    // Nuevo campo para múltiples áreas
    areaIds,
    fechaInicio: formData.fechaInicio || null,
    fechaFin: formData.fechaFin || null,
    tipoLanzamiento: formData.tipoLanzamiento || "fecha",
    maxPersonas: formData.maxPersonas ? Number(formData.maxPersonas) : null,
    fechaCierreInscripcion: formData.fechaCierreInscripcion || null,
  };

  return fetch(apiUrl("/api/cursos"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(courseData),
  }).then((res) => {
    if (!res.ok) throw new Error(`Error HTTP ${res.status}`);
    return res.json();
  });
}
