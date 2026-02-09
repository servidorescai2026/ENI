import { driver } from "driver.js";
import "driver.js/dist/driver.css";

// Tour para la página de Login
export const iniciarTourLogin = () => {
  const driverObj = driver({
    showProgress: true,
    showButtons: ["next", "previous", "close"],
    steps: [
      {
        element: ".login-form h2",
        popover: {
          title: "👋 ¡Bienvenido!",
          description: "Esta es la página de inicio de sesión del sistema ENI.",
          side: "bottom",
          align: "center",
        },
      },
      {
        element: 'input[name="email"]',
        popover: {
          title: "📧 Correo electrónico",
          description: "Ingresa tu correo electrónico registrado en el sistema.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: 'input[name="password"]',
        popover: {
          title: "🔒 Contraseña",
          description: "Ingresa tu contraseña de acceso.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: ".recaptcha-container",
        popover: {
          title: "🤖 Verificación",
          description: "Completa la verificación reCAPTCHA para demostrar que no eres un robot.",
          side: "top",
          align: "center",
        },
      },
      {
        element: 'button[type="submit"]',
        popover: {
          title: "🚀 Iniciar sesión",
          description: "Una vez completados todos los campos, haz clic aquí para acceder al sistema.",
          side: "top",
          align: "center",
        },
      },
    ],
    nextBtnText: "Siguiente →",
    prevBtnText: "← Anterior",
    doneBtnText: "¡Entendido!",
  });

  driverObj.drive();
};

// Tour para la página de Registro
export const iniciarTourRegistro = () => {
  const driverObj = driver({
    showProgress: true,
    showButtons: ["next", "previous", "close"],
    steps: [
      {
        element: ".registro-form h2",
        popover: {
          title: "📝 Registro de Usuario",
          description: "Aquí puedes crear una nueva cuenta en el sistema ENI.",
          side: "bottom",
          align: "center",
        },
      },
      {
        element: 'input[name="nombre"]',
        popover: {
          title: "👤 Nombre",
          description: "Ingresa tu nombre completo.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: 'input[name="apellido"]',
        popover: {
          title: "👤 Apellido",
          description: "Ingresa tu apellido completo.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: 'input[name="email"]',
        popover: {
          title: "📧 Correo electrónico",
          description: "Ingresa un correo electrónico válido. Este será tu usuario para iniciar sesión.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: 'input[name="password"]',
        popover: {
          title: "🔒 Contraseña",
          description: "Crea una contraseña segura para tu cuenta.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: 'input[name="codigoArea"]',
        popover: {
          title: "🏢 Código de Área",
          description: "Ingresa el código del área a la que perteneces.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: ".recaptcha-container",
        popover: {
          title: "🤖 Verificación",
          description: "Completa la verificación reCAPTCHA.",
          side: "top",
          align: "center",
        },
      },
      {
        element: ".botones",
        popover: {
          title: "✅ Acciones",
          description: "Puedes regresar a la página anterior o completar tu registro.",
          side: "top",
          align: "center",
        },
      },
    ],
    nextBtnText: "Siguiente →",
    prevBtnText: "← Anterior",
    doneBtnText: "¡Entendido!",
  });

  driverObj.drive();
};

// Tour para el Panel de Administrador
export const iniciarTourAdmin = () => {
  const driverObj = driver({
    showProgress: true,
    showButtons: ["next", "previous", "close"],
    steps: [
      {
        element: ".admin-welcome",
        popover: {
          title: "👋 Panel de Administración",
          description: "¡Bienvenido al panel de administración del sistema ENI!",
          side: "bottom",
          align: "center",
        },
      },
      {
        element: ".header-buttons",
        popover: {
          title: "🔧 Acciones rápidas",
          description: "Desde aquí puedes registrar nuevos usuarios, enviar notificaciones o cerrar sesión.",
          side: "bottom",
          align: "center",
        },
      },
      {
        element: ".btn-anim:first-child",
        popover: {
          title: "➕ Registrar usuario",
          description: "Haz clic aquí para crear una nueva cuenta de usuario en el sistema.",
          side: "bottom",
          align: "start",
        },
      },
      {
        element: ".btn-notificacion",
        popover: {
          title: "🔔 Notificaciones",
          description: "Envía notificaciones a los usuarios del sistema.",
          side: "bottom",
          align: "center",
        },
      },
      {
        element: ".btn-cerrar",
        popover: {
          title: "🚪 Cerrar sesión",
          description: "Haz clic aquí para salir del sistema de forma segura.",
          side: "bottom",
          align: "end",
        },
      },
      {
        element: ".dashboard-grid",
        popover: {
          title: "📊 Panel de control",
          description: "Aquí encontrarás las principales funciones del sistema.",
          side: "top",
          align: "center",
        },
      },
      {
        element: ".dashboard-card:first-child",
        popover: {
          title: "👥 Gestión de Usuarios",
          description: "Administra los usuarios registrados: edita, elimina o consulta información.",
          side: "right",
          align: "start",
        },
      },
      {
        element: ".dashboard-card:nth-child(3)",
        popover: {
          title: "📈 Reportes",
          description: "Genera reportes y estadísticas del sistema.",
          side: "left",
          align: "start",
        },
      },
    ],
    nextBtnText: "Siguiente →",
    prevBtnText: "← Anterior",
    doneBtnText: "¡Listo!",
  });

  driverObj.drive();
};


