const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem("token");
  const headers = { ...(options.headers || {}) };
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  if (!isFormData && !("Content-Type" in headers) && !("content-type" in headers)) {
    headers["Content-Type"] = "application/json";
  }

  if (!("Accept" in headers) && !("accept" in headers)) {
    headers.Accept = "application/json";
  }

  if (token && !("Authorization" in headers) && !("authorization" in headers)) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
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
