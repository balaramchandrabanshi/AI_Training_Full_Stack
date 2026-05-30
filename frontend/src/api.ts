import { API_URL } from './config';
import { User, Inventory, Category, Item, DashboardStats, ItemCreate, ItemUpdate } from './types';

const TOKEN_KEY = 'inventrack_token';

// Get access token from local storage
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

// Set access token in local storage
export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

// Remove access token from local storage
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// Central API fetch helper
async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  // Handle unauthorized responses automatically
  if (response.status === 401) {
    clearToken();
    localStorage.removeItem('inventrack_user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  // Parse errors throwing detailing objects
  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    try {
      const errorJson = await response.json();
      if (errorJson && errorJson.detail) {
        errorMessage = typeof errorJson.detail === 'string' 
          ? errorJson.detail 
          : JSON.stringify(errorJson.detail);
      }
    } catch (e) {
      // Ignore parser failure and fall back
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return;
  }

  return response.json();
}

// ── Auth API ──────────────────────────────────────────────────────────────────

export async function register(email: string, password: string, name?: string): Promise<{ access_token: string; token_type: string }> {
  return request('/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, name: name || null }),
  });
}

export async function login(email: string, password: string): Promise<{ access_token: string; token_type: string }> {
  // OAuth2 form format payload (x-www-form-urlencoded)
  const bodyParams = new URLSearchParams();
  bodyParams.append('username', email);
  bodyParams.append('password', password);

  return request('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: bodyParams.toString(),
  });
}

export async function getMe(): Promise<User> {
  return request('/auth/me');
}

// ── Dashboard API ─────────────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  return request('/dashboard/stats');
}

// ── Inventories API ───────────────────────────────────────────────────────────

export async function getInventories(): Promise<Inventory[]> {
  return request('/inventories');
}

export async function createInventory(name: string, description?: string): Promise<Inventory> {
  return request('/inventories', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, description: description || null }),
  });
}

export async function updateInventory(id: string, name: string, description?: string): Promise<Inventory> {
  return request(`/inventories/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, description: description || null }),
  });
}

export async function deleteInventory(id: string): Promise<void> {
  return request(`/inventories/${id}`, {
    method: 'DELETE',
  });
}

export async function getInventory(id: string): Promise<Inventory> {
  return request(`/inventories/${id}`);
}

// ── Categories API ────────────────────────────────────────────────────────────

export async function getCategories(invId: string): Promise<Category[]> {
  return request(`/inventories/${invId}/categories`);
}

export async function createCategory(invId: string, name: string, description?: string): Promise<Category> {
  return request(`/inventories/${invId}/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, description: description || null }),
  });
}

export async function updateCategory(invId: string, catId: string, name: string, description?: string): Promise<Category> {
  return request(`/inventories/${invId}/categories/${catId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, description: description || null }),
  });
}

export async function deleteCategory(invId: string, catId: string): Promise<void> {
  return request(`/inventories/${invId}/categories/${catId}`, {
    method: 'DELETE',
  });
}

// ── Items API ─────────────────────────────────────────────────────────────────

export async function getItems(params?: { cat_id?: string; inv_id?: string }): Promise<Item[]> {
  const query = new URLSearchParams();
  if (params?.cat_id) query.append('cat_id', params.cat_id);
  if (params?.inv_id) query.append('inv_id', params.inv_id);
  const queryString = query.toString() ? `?${query.toString()}` : '';
  return request(`/items${queryString}`);
}

export async function createItem(data: ItemCreate): Promise<Item> {
  return request('/items', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

export async function updateItem(id: string, data: ItemUpdate): Promise<Item> {
  return request(`/items/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
}

export async function deleteItem(id: string): Promise<void> {
  return request(`/items/${id}`, {
    method: 'DELETE',
  });
}
