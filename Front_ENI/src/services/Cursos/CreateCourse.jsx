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
    duracion: formData.duracion,
    categoria: formData.categoria,
    nivel: formData.nivel,
    // Nuevo campo para múltiples áreas
    areaIds,
  };

  return fetch("http://localhost:3000/api/cursos", {
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