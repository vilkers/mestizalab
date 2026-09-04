/* =========================================================
   Mestiza Lab — cliente de API
   Sessão vive num cookie HttpOnly emitido pelo Worker. O
   navegador manda sozinho; nenhum token toca o JavaScript,
   que é o que impede um XSS de roubar a sessão.
   ========================================================= */

import { API_BASE } from './config.js';

export class ApiError extends Error {
  constructor(status, body) {
    super((body && body.error) || `Erro ${status}`);
    this.status = status;
    this.body = body || {};
  }
}

async function request(path, { method = 'GET', body, headers = {}, raw = false, signal } = {}) {
  const opts = { method, credentials: 'include', headers: { ...headers }, signal };
  if (body instanceof FormData) opts.body = body;
  else if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(API_BASE + path, opts);
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    throw new ApiError(0, { error: 'Sem conexão com o servidor.' });
  }

  if (res.status === 401 && !path.startsWith('/auth/')) {
    // Sessão caiu: devolve para o login sem deixar a tela travada.
    window.dispatchEvent(new CustomEvent('mz:unauthorized'));
    throw new ApiError(401, { error: 'Sessão expirada.' });
  }
  if (raw) {
    if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => null));
    return res;
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

export const api = {
  /* --- primeiro acesso --- */
  precisaSetup: () => request('/setup'),
  setup: (dados) => request('/setup', { method: 'POST', body: dados }),

  /* --- sessão --- */
  login: (email, senha) => request('/auth/login', { method: 'POST', body: { email, senha } }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/me'),

  /* --- posts --- */
  listPosts: (q = {}) => request('/posts?' + new URLSearchParams(q)),
  getPost: (id) => request(`/posts/${id}`),
  createPost: (data) => request('/posts', { method: 'POST', body: data }),
  updatePost: (id, data) => request(`/posts/${id}`, { method: 'PUT', body: data }),
  deletePost: (id) => request(`/posts/${id}`, { method: 'DELETE' }),

  /* --- mídia --- */
  listMedia: (q = {}) => request('/media?' + new URLSearchParams(q)),
  updateMedia: (id, data) => request(`/media/${id}`, { method: 'PUT', body: data }),
  deleteMedia: (id) => request(`/media/${id}`, { method: 'DELETE' }),
  listColecoes: () => request('/colecoes'),
  /** Upload com progresso — fetch não expõe progresso de envio, então XHR. */
  uploadMedia(file, { onProgress, signal, colecao } = {}) {
    return new Promise((resolve, reject) => {
      const fd = new FormData();
      fd.append('file', file, file.name);
      if (colecao) fd.append('colecao', colecao);
      const xhr = new XMLHttpRequest();
      xhr.open('POST', API_BASE + '/media');
      xhr.withCredentials = true;
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total);
      };
      xhr.onload = () => {
        let data = null;
        try { data = JSON.parse(xhr.responseText); } catch {}
        if (xhr.status >= 200 && xhr.status < 300) resolve(data);
        else reject(new ApiError(xhr.status, data));
      };
      xhr.onerror = () => reject(new ApiError(0, { error: 'Falha no upload.' }));
      xhr.onabort = () => reject(new ApiError(0, { error: 'Upload cancelado.' }));
      if (signal) signal.addEventListener('abort', () => xhr.abort());
      xhr.send(fd);
    });
  },

  /** Miniatura do post — chave fixa, fora da biblioteca. */
  uploadThumb: (id, blob) => {
    const fd = new FormData();
    fd.append('file', blob, 'thumb.jpg');
    return request(`/posts/${id}/thumb`, { method: 'POST', body: fd });
  },

  /* --- editorias --- */
  listEditorias: () => request('/editorias'),

  /* --- briefings vindos do Claude --- */
  listBriefings: (q = {}) => request('/briefings?' + new URLSearchParams(q)),
  getBriefing: (id) => request(`/briefings/${id}`),
  updateBriefing: (id, data) => request(`/briefings/${id}`, { method: 'PUT', body: data }),

  /* --- usuários (admin) --- */
  listUsers: () => request('/users'),
  createUser: (data) => request('/users', { method: 'POST', body: data }),
  updateUser: (id, data) => request(`/users/${id}`, { method: 'PUT', body: data }),

  /* --- tokens de integração --- */
  listTokens: () => request('/tokens'),
  createToken: (nome) => request('/tokens', { method: 'POST', body: { nome } }),
  revokeToken: (id) => request(`/tokens/${id}`, { method: 'DELETE' }),
};

export { request };
