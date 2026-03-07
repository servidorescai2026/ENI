import authFetch from "../../utils/authFetch";
import { apiUrl } from "../../config/api";

export default async function GetCourseAreas(courseId) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const [courseResponse, areasResponse] = await Promise.all([
      authFetch(apiUrl("/api/cursos"), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        signal: controller.signal,
      }),
      fetch(apiUrl("/api/areas"), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        signal: controller.signal,
      }),
    ]);

    clearTimeout(timeoutId);

    if (!courseResponse.ok) {
      throw new Error(`HTTP ${courseResponse.status}: ${courseResponse.statusText}`);
    }

    if (!areasResponse.ok) {
      throw new Error(`HTTP ${areasResponse.status}: ${areasResponse.statusText}`);
    }

    const [courses, areas] = await Promise.all([
      courseResponse.json(),
      areasResponse.json(),
    ]);

    const course = (Array.isArray(courses) ? courses : []).find((item) => Number(item.id) === Number(courseId));
    if (!course?.areaId) {
      return [];
    }

    const area = (Array.isArray(areas) ? areas : []).find((item) => Number(item.id) === Number(course.areaId));
    return area ? [area] : [];
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(
        "La petición tardó demasiado tiempo. Verifica que el servidor esté corriendo."
      );
    }
    throw error;
  }
}
