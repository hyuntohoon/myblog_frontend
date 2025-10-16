// src/lib/api.ts
export const API = (import.meta as any).env?.PUBLIC_API_BASE || "http://127.0.0.1:8000";

export type ApiPost = {
  id: number;
  slug?: string;
  title: string;
  excerpt?: string | null;
  status?: "draft" | "published" | "archived";
  visibility?: "public" | "private" | "unlisted";
  published_at?: string | null;
  created_at?: string | null;
  content_html?: string | null;
  content_md?: string | null;
};

export async function getPosts(page?: number, limit?: number): Promise<ApiPost[]> {
  try {
    const u = new URL("/posts/", API);
    if (page) u.searchParams.set("page", String(page));
    if (limit) u.searchParams.set("limit", String(limit));
    const r = await fetch(u.toString(), { headers: { accept: "application/json" } });
    return r.ok ? await r.json() : [];
  } catch {
    return [];
  }
}

/** ✅ ID만 허용 (slug 금지) */
export async function getPost(id: string | number): Promise<ApiPost | null> {
  const s = String(id).trim();
  if (!/^\d+$/.test(s)) return null; // 숫자 아니면 거부
  try {
    const r = await fetch(`${API}/posts/${s}`, { headers: { accept: "application/json" } });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

export async function createPost(payload: {
  title: string;
  excerpt?: string;
  content_md?: string;
  visibility?: "public" | "private" | "unlisted";
}) {
  const r = await fetch(`${API}/posts/`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    let msg = `HTTP ${r.status} ${r.statusText}`;
    try {
      const body = await r.json();
      msg = body?.detail || body?.message || body?.error || msg;
    } catch {}
    throw new Error(msg);
  }
  return r.json();
}
