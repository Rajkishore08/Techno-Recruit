const getApiBase = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    return "http://localhost:8080";
  }
  return window.API_BASE_URL || "";
};

export const API_BASE = getApiBase();

export async function parseJsonResponse(resp, defaultErrorMsg = "Server request failed.") {
  const contentType = resp.headers.get("content-type") || "";
  
  if (!resp.ok) {
    if (contentType.includes("application/json")) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.detail || defaultErrorMsg);
    } else {
      const text = await resp.text();
      if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
        throw new Error(`API endpoint returned HTML (404 / route missing). Ensure backend server is running and API URL is configured.`);
      }
      throw new Error(`Server returned error status ${resp.status}`);
    }
  }

  if (!contentType.includes("application/json")) {
    const text = await resp.text();
    if (text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
      throw new Error(`Received HTML page instead of expected JSON response. Check backend API service route.`);
    }
  }

  return resp.json();
}

export async function fetchWithAuth(url, options = {}, idToken = null) {
  const headers = { ...options.headers };
  if (idToken) {
    headers["Authorization"] = `Bearer ${idToken}`;
  } else if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
    headers["Authorization"] = `Bearer local_dev_token`;
  }
  
  const fullUrl = url.startsWith("http") ? url : `${API_BASE}${url}`;
  return fetch(fullUrl, { ...options, headers });
}

export async function parseResume(file, idToken = null) {
  const formData = new FormData();
  formData.append("file", file);
  const resp = await fetchWithAuth("/api/parse-resume", { method: "POST", body: formData }, idToken);
  return parseJsonResponse(resp, "Failed to process resume file.");
}

export async function suggestRoles(formData, idToken = null) {
  const resp = await fetchWithAuth("/api/suggest-roles", { method: "POST", body: formData }, idToken);
  return parseJsonResponse(resp, "Career Navigator evaluation failed.");
}

export async function analyzeCustomRole(resumeText, roleTitle) {
  const resp = await fetchWithAuth("/api/analyze-custom-role", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resume_text: resumeText, role_title: roleTitle })
  });
  return parseJsonResponse(resp, "Failed to analyze custom role.");
}

export async function searchTalentPool(query, idToken = null) {
  const resp = await fetchWithAuth("/api/search-talent-pool", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query })
  }, idToken);
  return parseJsonResponse(resp, "Talent search query failed.");
}

export async function optimizeResume(formData, idToken = null) {
  const resp = await fetchWithAuth("/api/optimize-resume", { method: "POST", body: formData }, idToken);
  return parseJsonResponse(resp, "ATS Resume optimization failed.");
}

export async function fetchCareerHistory(idToken = null) {
  const resp = await fetchWithAuth("/api/career-history", {}, idToken);
  if (!resp.ok) return [];
  const data = await parseJsonResponse(resp, "Failed to fetch career history.").catch(() => []);
  return data.history || data || [];
}

export async function fetchGuideHistory(idToken = null) {
  const resp = await fetchWithAuth("/api/history", {}, idToken);
  if (!resp.ok) return [];
  return parseJsonResponse(resp, "Failed to fetch guide history.").catch(() => []);
}
