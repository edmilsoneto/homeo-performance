// Helper function for API calls that automatically attaches the JWT token
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const savedAuth = localStorage.getItem('homeo_auth');
  if (savedAuth) {
    try {
      const auth = JSON.parse(savedAuth);
      if (auth.token) {
        headers['Authorization'] = `Bearer ${auth.token}`;
      }
    } catch (e) {
      // Ignore
    }
  }

  // Merge custom headers
  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errText = await response.text();
    let errMsg = `Error ${response.status}`;
    try {
      const parsed = JSON.parse(errText);
      if (parsed.error) errMsg = parsed.error;
    } catch {}
    throw new Error(errMsg);
  }

  // Handle empty responses
  if (response.status === 204) return null;
  
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}
