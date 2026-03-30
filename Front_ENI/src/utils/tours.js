import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const DEFAULT_CONFIG = {
  showProgress: true,
  showButtons: ["next", "previous", "close"],
  nextBtnText: "Siguiente ->",
  prevBtnText: "<- Anterior",
  doneBtnText: "Listo",
};

const getFirstExistingSelector = (selectors = []) => {
  if (!Array.isArray(selectors)) return null;
  return selectors.find((selector) => document.querySelector(selector)) || null;
};

const createStep = ({ selectors, popover }) => {
  const element = getFirstExistingSelector(selectors);
  if (!element) return null;
  return { element, popover };
};

const iniciarTour = (steps, doneText = "Entendido") => {
  const filteredSteps = (steps || []).filter(Boolean);

  if (!filteredSteps.length) {
    const driverObj = driver({
      ...DEFAULT_CONFIG,
      doneBtnText: doneText,
      steps: [
        {
          element: "body",
          popover: {
            title: "Ayuda",
            description: "No se encontraron elementos para este tour en la vista actual.",
            side: "bottom",
            align: "center",
          },
        },
      ],
    });
    driverObj.drive();
    return;
  }

  const driverObj = driver({
    ...DEFAULT_CONFIG,
    doneBtnText: doneText,
    steps: filteredSteps,
  });

  driverObj.drive();
};

// Tour para la página de Login
export const iniciarTourLogin = () => {
  iniciarTour(
    [
      createStep({
        selectors: [".login-form h2"],
        popover: {
          title: "👋 ¡Bienvenido!",
          description: "Esta es la página de inicio de sesión del sistema ENI.",
          side: "bottom",
          align: "center",
        },
      }),
      createStep({
        selectors: ['input[name="email"]'],
        popover: {
          title: "📧 Correo electrónico",
          description: "Ingresa tu correo electrónico registrado en el sistema.",
          side: "bottom",
          align: "start",
        },
      }),
      createStep({
        selectors: ['input[name="password"]'],
        popover: {
          title: "🔒 Contraseña",
          description: "Ingresa tu contraseña de acceso.",
          side: "bottom",
          align: "start",
        },
      }),
      createStep({
        selectors: [".recaptcha-container"],
        popover: {
          title: "🤖 Verificación",
          description: "Completa la verificación reCAPTCHA para demostrar que no eres un robot.",
          side: "top",
          align: "center",
        },
      }),
      createStep({
        selectors: ['button[type="submit"]'],
        popover: {
          title: "🚀 Iniciar sesión",
          description: "Una vez completados todos los campos, haz clic aquí para acceder al sistema.",
          side: "top",
          align: "center",
        },
      }),
    ],
    "Entendido"
  );
};

// Tour para la página de Registro
export const iniciarTourRegistro = () => {
  iniciarTour(
    [
      createStep({
        selectors: [".registro-form h2"],
        popover: {
          title: "📝 Registro de Usuario",
          description: "Aquí puedes crear una nueva cuenta en el sistema ENI.",
          side: "bottom",
          align: "center",
        },
      }),
      createStep({
        selectors: ['input[name="nombre"]', 'input[name="apellido"]'],
        popover: {
          title: "👤 Nombre",
          description: "Ingresa tu nombre completo.",
          side: "bottom",
          align: "start",
        },
      }),
      createStep({
        selectors: ['input[name="email"]', 'input[name="password"]'],
        popover: {
          title: "Credenciales",
          description: "Define correo y contrasena para el acceso.",
          side: "bottom",
          align: "start",
        },
      }),
      createStep({
        selectors: ['select[name="codigoArea"]', '.registro-form select'],
        popover: {
          title: "Area y rol",
          description: "Selecciona el area de conocimiento y, si aplica, el rol.",
          side: "bottom",
          align: "start",
        },
      }),
      createStep({
        selectors: [".recaptcha-container", ".botones"],
        popover: {
          title: "Verificar y enviar",
          description: "Completa el reCAPTCHA y finaliza el registro.",
          side: "top",
          align: "center",
        },
      }),
    ],
    "Entendido"
  );
};

// Tour para el Panel de Administrador
export const iniciarTourAdmin = () => {
  iniciarTour(
    [
      createStep({
        selectors: [".admin-welcome", ".welcome-text"],
        popover: {
          title: "Panel de administracion",
          description: "Desde aqui gestionas usuarios, cursos y reportes.",
          side: "bottom",
          align: "center",
        },
      }),
      createStep({
        selectors: [".header-buttons"],
        popover: {
          title: "Acciones rapidas",
          description: "Usa estos botones para navegar o cerrar sesion.",
          side: "bottom",
          align: "center",
        },
      }),
      createStep({
        selectors: [".dashboard-grid"],
        popover: {
          title: "Panel principal",
          description: "Aqui estan los modulos principales de administracion.",
          side: "top",
          align: "center",
        },
      }),
    ],
    "Listo"
  );
};

const toursPorRuta = {
  "/login": iniciarTourLogin,
  "/register": iniciarTourRegistro,
  "/admin": iniciarTourAdmin,
  "/administrador": iniciarTourAdmin,
  "/usuario": () =>
    iniciarTour(
      [
        createStep({
          selectors: [".usuario-header h2", ".usuario-header"],
          popover: {
            title: "Panel del formador",
            description: "Este panel resume tus cursos, notificaciones y accesos principales.",
            side: "bottom",
            align: "center",
          },
        }),
        createStep({
          selectors: [".usuario-header .header-buttons"],
          popover: {
            title: "Accesos rapidos",
            description: "Desde aqui puedes abrir cursos, notificaciones y subir evidencias.",
            side: "bottom",
            align: "center",
          },
        }),
        createStep({
          selectors: [".dashboard-section", ".dashboard-card"],
          popover: {
            title: "Resumen",
            description: "Consulta tus cursos activos y los cursos disponibles.",
            side: "top",
            align: "center",
          },
        }),
      ],
      "Listo"
    ),
  "/gestion-cursos": () =>
    iniciarTour(
      [
        createStep({
          selectors: [".gestion-cursos-header h2"],
          popover: {
            title: "Gestion de cursos",
            description: "Aqui administras el catalogo de cursos.",
            side: "bottom",
            align: "center",
          },
        }),
        createStep({
          selectors: [".btn-nuevo", ".header-buttons"],
          popover: {
            title: "Crear curso",
            description: "Usa este boton para abrir el formulario y crear un nuevo curso.",
            side: "bottom",
            align: "start",
          },
        }),
        createStep({
          selectors: [".gestion-cursos-main", ".curso-form"],
          popover: {
            title: "Listado y formulario",
            description: "Gestiona ediciones, inscritos y eliminaciones desde esta seccion.",
            side: "top",
            align: "center",
          },
        }),
      ],
      "Listo"
    ),
  "/gestion-usuarios": () =>
    iniciarTour(
      [
        createStep({
          selectors: [".welcome-text", ".admin-welcome"],
          popover: {
            title: "Gestion de formadores",
            description: "Visualiza y administra los formadores registrados.",
            side: "bottom",
            align: "center",
          },
        }),
        createStep({
          selectors: [".btn-anim"],
          popover: {
            title: "Gestion de archivos",
            description: "Realiza la carga completa de tus usuarios desde esta ventana.",
            side: "bottom",
            align: "center",
          },
        }),
        createStep({
          selectors: [".search-input", ".filtros-container"],
          popover: {
            title: "Busqueda",
            description: "Filtra rapidamente por nombre o correo.",
            side: "bottom",
            align: "start",
          },
        }),
        createStep({
          selectors: [".usuarios-table", ".tabla-container"],
          popover: {
            title: "Tabla de usuarios",
            description: "Aqui puedes editar o eliminar registros.",
            side: "top",
            align: "center",
          },
        }),
      ],
      "Listo"
    ),
  "/upload-usuarios": () =>
    iniciarTour(
      [
        createStep({
          selectors: [".welcome-text", ".bulk-form"],
          popover: {
            title: "Carga masiva",
            description: "Sube archivos Excel o CSV para registrar usuarios en lote.",
            side: "bottom",
            align: "center",
          },
        }),
        createStep({
          selectors: ["#file", ".bulk-form input[type='file']"],
          popover: {
            title: "Seleccionar archivo",
            description: "Elige el archivo y revisa su estructura antes de enviarlo.",
            side: "bottom",
            align: "start",
          },
        }),
      ],
      "Listo"
    ),
  "/cursos-disponibles": () =>
    iniciarTour(
      [
        createStep({
          selectors: [".cursos-disponibles-header h2"],
          popover: {
            title: "Cursos disponibles",
            description: "Explora el catalogo y revisa las opciones para inscribirte.",
            side: "bottom",
            align: "center",
          },
        }),
        createStep({
          selectors: [".cursos-grid", ".curso-card"],
          popover: {
            title: "Tarjetas de curso",
            description: "Cada tarjeta muestra descripcion, cupos y fechas de cierre.",
            side: "top",
            align: "center",
          },
        }),
        createStep({
          selectors: [".btn-inscribirse"],
          popover: {
            title: "Inscripcion",
            description: "Usa este boton para inscribirte o cancelar una inscripcion activa.",
            side: "top",
            align: "center",
          },
        }),
      ],
      "Listo"
    ),
  "/verificar-mis-cursos": () =>
    iniciarTour(
      [
        createStep({
          selectors: [".verificar-cursos-header h2"],
          popover: {
            title: "Mis cursos asignados",
            description: "Aqui ves los cursos de tu area como formador.",
            side: "bottom",
            align: "center",
          },
        }),
        createStep({
          selectors: [".btn-recargar", ".header-buttons"],
          popover: {
            title: "Actualizar informacion",
            description: "Recarga para consultar los cursos mas recientes.",
            side: "bottom",
            align: "start",
          },
        }),
        createStep({
          selectors: [".cursos-grid", ".curso-card"],
          popover: {
            title: "Detalle de cursos",
            description: "Revisa categoria, duracion y fechas de cada curso.",
            side: "top",
            align: "center",
          },
        }),
      ],
      "Listo"
    ),
  "/notificaciones": () =>
    iniciarTour(
      [
        createStep({
          selectors: [".notificacion-title"],
          popover: {
            title: "Enviar notificacion",
            description: "Selecciona areas y redacta el mensaje para los formadores.",
            side: "bottom",
            align: "center",
          },
        }),
        createStep({
          selectors: [".input-control", ".form-group"],
          popover: {
            title: "Formulario",
            description: "Completa asunto, mensaje y adjuntos PDF si lo necesitas.",
            side: "bottom",
            align: "start",
          },
        }),
        createStep({
          selectors: [".notificacion-actions"],
          popover: {
            title: "Acciones",
            description: "Desde aqui puedes volver al panel o enviar la notificacion.",
            side: "top",
            align: "center",
          },
        }),
      ],
      "Listo"
    ),
  "/mis-notificaciones": () =>
    iniciarTour(
      [
        createStep({
          selectors: [".notificacion-title"],
          popover: {
            title: "Mis notificaciones",
            description: "Consulta mensajes recibidos y su estado de lectura.",
            side: "bottom",
            align: "center",
          },
        }),
        createStep({
          selectors: [".notificaciones-list", ".notificacion-item"],
          popover: {
            title: "Listado",
            description: "Abre archivos adjuntos y revisa cada notificacion.",
            side: "top",
            align: "center",
          },
        }),
        createStep({
          selectors: [".notificacion-btn", ".notificacion-actions-bottom"],
          popover: {
            title: "Marcar y volver",
            description: "Marca como leida y regresa al panel cuando termines.",
            side: "top",
            align: "center",
          },
        }),
      ],
      "Listo"
    ),
  "/subir-evidencias": () =>
    iniciarTour(
      [
        createStep({
          selectors: [".notificacion-title"],
          popover: {
            title: "Subir evidencias",
            description: "Adjunta archivos PDF para enviar tus evidencias.",
            side: "bottom",
            align: "center",
          },
        }),
        createStep({
          selectors: [".form-group", ".input-control"],
          popover: {
            title: "Datos de envio",
            description: "Puedes agregar descripcion y nombre de carpetas en Drive.",
            side: "bottom",
            align: "start",
          },
        }),
        createStep({
          selectors: [".notificacion-actions"],
          popover: {
            title: "Enviar",
            description: "Pulsa en subir evidencias cuando tengas todo listo.",
            side: "top",
            align: "center",
          },
        }),
      ],
      "Listo"
    ),
  "/configuracion": () =>
    iniciarTour(
      [
        createStep({
          selectors: [".config-header h2"],
          popover: {
            title: "Configuracion",
            description: "Personaliza apariencia, idioma y preferencias.",
            side: "bottom",
            align: "center",
          },
        }),
        createStep({
          selectors: [".config-main", ".config-section"],
          popover: {
            title: "Secciones",
            description: "Recorre cada bloque para ajustar la experiencia de uso.",
            side: "top",
            align: "center",
          },
        }),
        createStep({
          selectors: [".config-actions"],
          popover: {
            title: "Guardar cambios",
            description: "Guarda o restaura la configuracion cuando lo necesites.",
            side: "top",
            align: "center",
          },
        }),
      ],
      "Listo"
    ),
  "/monitoria": () =>
    iniciarTour(
      [
        createStep({
          selectors: [".monitoria-header h2"],
          popover: {
            title: "Monitoria de formadores",
            description: "Supervisa el estado de evidencias por formador.",
            side: "bottom",
            align: "center",
          },
        }),
        createStep({
          selectors: [".monitoria-filtros"],
          popover: {
            title: "Filtros",
            description: "Filtra por pendientes o formadores al dia.",
            side: "bottom",
            align: "center",
          },
        }),
        createStep({
          selectors: [".monitoria-grid", ".monitoria-card"],
          popover: {
            title: "Tarjetas de seguimiento",
            description: "Cada tarjeta muestra evidencias, pendientes y estado actual.",
            side: "top",
            align: "center",
          },
        }),
      ],
      "Listo"
    ),
  "/reportes": () =>
    iniciarTour(
      [
        createStep({
          selectors: [".welcome-text", ".reportes-content"],
          popover: {
            title: "Sistema de reportes",
            description: "Genera y consulta reportes de actividad del sistema.",
            side: "bottom",
            align: "center",
          },
        }),
        createStep({
          selectors: [".estadisticas-grid", ".estadistica-card"],
          popover: {
            title: "Metricas rapidas",
            description: "Visualiza totales de reportes, estados y descargas.",
            side: "top",
            align: "center",
          },
        }),
        createStep({
          selectors: [".reportes-grid", ".reporte-card"],
          popover: {
            title: "Lista de reportes",
            description: "Abre detalles o descarga el reporte seleccionado.",
            side: "top",
            align: "center",
          },
        }),
      ],
      "Listo"
    ),
};

export const iniciarTourPorRuta = (pathname = "") => {
  const iniciar = toursPorRuta[pathname];

  if (typeof iniciar !== "function") {
    iniciarTour(
      [
        {
          element: "body",
          popover: {
            title: "Ayuda",
            description: "Esta vista no tiene un tour definido por ahora.",
            side: "bottom",
            align: "center",
          },
        },
      ],
      "Entendido"
    );
    return;
  }

  iniciar();
};


