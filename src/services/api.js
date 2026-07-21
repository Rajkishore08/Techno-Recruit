const API_BASE = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
  ? (window.location.port === "3000" ? "" : "http://localhost:8080")
  : "";

export async function fetchWithAuth(url, options = {}, idToken = null) {
  const headers = { ...options.headers };
  if (idToken) {
    headers["Authorization"] = `Bearer ${idToken}`;
  } else if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    headers["Authorization"] = `Bearer local_dev_token`;
  }
  return fetch(`${API_BASE}${url}`, { ...options, headers });
}

export async function parseResume(file, idToken = null) {
  const formData = new FormData();
  formData.append("file", file);
  const resp = await fetchWithAuth("/api/parse-resume", { method: "POST", body: formData }, idToken);
  if (!resp.ok) throw new Error("Failed to parse resume file.");
  return resp.json();
}

export async function suggestRoles(formData, idToken = null) {
  const resp = await fetchWithAuth("/api/suggest-roles", { method: "POST", body: formData }, idToken);
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.detail || "Career Navigator evaluation failed.");
  }
  return resp.json();
}

export async function analyzeCustomRole(resumeText, roleTitle) {
  const resp = await fetchWithAuth("/api/analyze-custom-role", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resume_text: resumeText, role_title: roleTitle })
  });
  if (!resp.ok) throw new Error("Failed to analyze custom role.");
  return resp.json();
}

export async function searchTalentPool(query, idToken = null) {
  const resp = await fetchWithAuth("/api/search-talent-pool", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query })
  }, idToken);
  if (!resp.ok) throw new Error("Talent search query failed.");
  return resp.json();
}

export async function optimizeResume(formData, idToken = null) {
  const resp = await fetchWithAuth("/api/optimize-resume", { method: "POST", body: formData }, idToken);
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.detail || "ATS Resume optimization failed.");
  }
  return resp.json();
}

export async function fetchCareerHistory(idToken = null) {
  const resp = await fetchWithAuth("/api/career-history", {}, idToken);
  if (!resp.ok) return [];
  const data = await resp.json();
  return data.history || data || [];
}

export async function fetchGuideHistory(idToken = null) {
  const resp = await fetchWithAuth("/api/history", {}, idToken);
  if (!resp.ok) return [];
  return resp.json();
}
