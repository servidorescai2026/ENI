export const abbreviateAreaName = (name = "") => {
  const text = String(name || "").trim();
  if (!text) return "N/A";

  if (/^sin\s+área$/i.test(text) || /^sin\s+area$/i.test(text) || /^n\/?a$/i.test(text)) {
    return "N/A";
  }

  if (/^á?rea\s*\d+$/i.test(text) || /^area\s*\d+$/i.test(text)) {
    return "N/A";
  }

  const compact = text.replace(/\s+/g, " ");
  const short = compact.slice(0, 4).trim();
  return short ? short.toUpperCase() : "N/A";
};

export const getAreaLabel = (area, fallback = "Sin área") => {
  if (area === null || area === undefined || area === "") return fallback;

  const text = String(area).trim();
  if (!text) return fallback;

  return abbreviateAreaName(text);
};

export default abbreviateAreaName;
