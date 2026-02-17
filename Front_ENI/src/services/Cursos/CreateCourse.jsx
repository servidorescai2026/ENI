export default function CreateCourse(formData) {
  const token = localStorage.getItem("token");

  const courseData = {
    nombre: formData.nombre,
    descripcion: formData.descripcion,
    duracion: formData.duracion,
    categoria: formData.categoria,
    nivel: formData.nivel,
    areaId: formData.areaId,
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