const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem("token");

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": `Bearer ${token}`,
      ...options.headers,
    },
  });

  // ⛔ TOKEN EXPIRADO O INVÁLIDO
  if (response.status === 401) {
    alert("Tu sesión expiró. Inicia sesión nuevamente.");

    localStorage.removeItem("token");
    localStorage.removeItem("usuario");

    window.location.href = "/login";
    return;
  }

  return response;
};

export default authFetch;
