const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getToken(): string {
  try {
    const stored = localStorage.getItem('vedaai-auth');
    if (stored) return JSON.parse(stored)?.state?.token || '';
  } catch {}
  return '';
}

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = getToken();
  return { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra };
}

export async function submitAssignment(formData: any): Promise<{ assignmentId: string; jobId: string; shareToken: string }> {
  const payload = { ...formData };
  delete payload.file;

  if (formData.file) {
    const fd = new FormData();
    Object.entries(payload).forEach(([k, v]) => fd.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v)));
    fd.append('file', formData.file);
    const res = await fetch(`${API}/api/assignments`, { method: 'POST', headers: authHeaders(), body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed');
    return data.data;
  }

  const res = await fetch(`${API}/api/assignments`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed');
  return data.data;
}

export const api = {
  async getAssignment(id: string) {
    const res = await fetch(`${API}/api/assignments/${id}`, { headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data.data;
  },
  async listAssignments(page = 1, limit = 20) {
    const res = await fetch(`${API}/api/assignments?page=${page}&limit=${limit}`, { headers: authHeaders() });
    return res.json();
  },
  async regenerateAssignment(id: string) {
    const res = await fetch(`${API}/api/assignments/${id}/regenerate`, { method: 'POST', headers: authHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data.data;
  },
};

export const apiClient = {
  async listTemplates() {
    const res = await fetch(`${API}/api/assignments/templates/list`, { headers: authHeaders() });
    return res.json();
  },
  async createTemplate(name: string, input: any) {
    const res = await fetch(`${API}/api/assignments/templates`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ name, input }),
    });
    return res.json();
  },
  async deleteTemplate(id: string) {
    return fetch(`${API}/api/assignments/templates/${id}`, { method: 'DELETE', headers: authHeaders() });
  },
};
