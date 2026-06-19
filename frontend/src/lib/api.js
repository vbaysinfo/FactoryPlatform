const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";

class ApiClient {
  #token = null;

  setToken(token) { this.#token = token; }
  clearToken() { this.#token = null; }

  async #request(method, path, body, opts = {}) {
    const headers = { "Content-Type": "application/json" };
    if (this.#token) headers["Authorization"] = `Bearer ${this.#token}`;
    if (opts.headers) Object.assign(headers, opts.headers);

    const res = await fetch(`${BASE}${path}`, {
      method, headers,
      body: body ? JSON.stringify(body) : undefined
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/pdf")) return res.blob();
    if (ct.includes("text/csv")) return res.text();
    return res.json();
  }

  get(path, opts) { return this.#request("GET", path, null, opts); }
  post(path, body, opts) { return this.#request("POST", path, body, opts); }
  patch(path, body, opts) { return this.#request("PATCH", path, body, opts); }
  put(path, body, opts) { return this.#request("PUT", path, body, opts); }
  delete(path, opts) { return this.#request("DELETE", path, null, opts); }
}

export const api = new ApiClient();
