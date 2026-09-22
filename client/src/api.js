export async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      ...options, headers: { 'Content-Type': 'application/json', ...options.headers },
    });
  } catch { throw new Error('Cannot reach the server. Check that the backend is running, then try again.'); }
  if (response.status === 204) return null;
  const body = await response.json().catch(() => null);
  if (!response.ok || body === null) throw new Error(body?.error || 'The server could not complete the request. Please try again.');
  return body;
}
