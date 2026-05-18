const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("admin_token") : null;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return res.json();
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: () => request<{ user: User }>("/api/auth/me"),
};

// ─── Stats ───────────────────────────────────────────────────────────────────

export const statsApi = {
  get: async (): Promise<Stats> => {
    const data = await request<{
      stats: Omit<Stats, "recentAds" | "recentUsers">;
      recentAds: Stats["recentAds"];
      recentUsers: Stats["recentUsers"];
    }>("/api/admin/stats");
    return { ...data.stats, recentAds: data.recentAds, recentUsers: data.recentUsers };
  },
};

// ─── Ads ─────────────────────────────────────────────────────────────────────

export const adsApi = {
  list: (params?: { status?: string; page?: number; limit?: number; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set("status", params.status);
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.search) q.set("search", params.search);
    return request<{
      ads: Ad[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/api/admin/ads?${q}`);
  },
  updateStatus: (id: string, status: string) =>
    request(`/api/admin/ads/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  delete: (id: string) =>
    request(`/api/admin/ads/${id}`, { method: "DELETE" }),
};

// ─── Users ───────────────────────────────────────────────────────────────────

export const usersApi = {
  list: (params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    return request<{
      users: User[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/api/admin/users?${q}`);
  },
  updateStatus: (id: string, status: "ACTIVE" | "BANNED") =>
    request(`/api/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};

// ─── Categories ──────────────────────────────────────────────────────────────

type CategoryPayload = Partial<Omit<Category, "customFilters">> & { customFilterIds?: string[] };

export const categoriesApi = {
  list: () => request<{ categories: Category[] }>("/api/admin/categories"),
  get: (id: string) => request<{ category: Category }>(`/api/admin/categories/${id}`),
  create: (data: CategoryPayload) =>
    request<{ category: Category }>("/api/admin/categories", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: CategoryPayload) =>
    request<{ category: Category }>(`/api/admin/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request(`/api/admin/categories/${id}`, { method: "DELETE" }),
};

// ─── Filters ─────────────────────────────────────────────────────────────────

export const filtersApi = {
  list: () => request<{ filters: CustomFilter[] }>("/api/admin/filters"),
  create: (data: { name: string; type: string; options?: string }) =>
    request<{ filter: CustomFilter }>("/api/admin/filters", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: string, data: { name?: string; type?: string; options?: string }) =>
    request<{ filter: CustomFilter }>(`/api/admin/filters/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request(`/api/admin/filters/${id}`, { method: "DELETE" }),
};

// ─── Locations ───────────────────────────────────────────────────────────────

export const locationsApi = {
  list: () => request<{ countries: Country[] }>("/api/locations"),
  createCountry: (name: string) =>
    request<{ country: Country }>("/api/locations/countries", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  updateCountry: (id: string, name: string) =>
    request<{ country: Country }>(`/api/locations/countries/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name }),
    }),
  deleteCountry: (id: string) =>
    request(`/api/locations/countries/${id}`, { method: "DELETE" }),
  createState: (name: string, countryId: string) =>
    request<{ state: LocationState }>("/api/locations/states", {
      method: "POST",
      body: JSON.stringify({ name, countryId }),
    }),
  updateState: (id: string, name: string) =>
    request<{ state: LocationState }>(`/api/locations/states/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name }),
    }),
  deleteState: (id: string) =>
    request(`/api/locations/states/${id}`, { method: "DELETE" }),
  createCity: (name: string, stateId: string) =>
    request<{ city: LocationCity }>("/api/locations/cities", {
      method: "POST",
      body: JSON.stringify({ name, stateId }),
    }),
  updateCity: (id: string, name: string) =>
    request<{ city: LocationCity }>(`/api/locations/cities/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name }),
    }),
  deleteCity: (id: string) =>
    request(`/api/locations/cities/${id}`, { method: "DELETE" }),
  createNeighborhood: (
    name: string,
    cityId: string,
    latitude?: number,
    longitude?: number,
  ) =>
    request<{ neighborhood: Neighborhood }>("/api/locations/neighborhoods", {
      method: "POST",
      body: JSON.stringify({
        name,
        cityId,
        ...(latitude != null ? { latitude } : {}),
        ...(longitude != null ? { longitude } : {}),
      }),
    }),
  updateNeighborhood: (
    id: string,
    name: string,
    latitude?: number,
    longitude?: number,
  ) =>
    request<{ neighborhood: Neighborhood }>(`/api/locations/neighborhoods/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        name,
        ...(latitude != null ? { latitude } : {}),
        ...(longitude != null ? { longitude } : {}),
      }),
    }),
  deleteNeighborhood: (id: string) =>
    request(`/api/locations/neighborhoods/${id}`, { method: "DELETE" }),
};

// ─── Types ───────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "BANNED";
  createdAt: string;
  phone?: string;
}

export interface Ad {
  id: string;
  title: string;
  price: number;
  currency: string;
  status: "DRAFT" | "PENDING" | "ACTIVE" | "REJECTED" | "EXPIRED" | "SOLD";
  createdAt: string;
  views: number;
  isFeatured: boolean;
  user: { id: string; name: string; email: string };
  category: { id: string; name: string };
}

export interface CustomFilter {
  id: string;
  name: string;
  type: "text" | "number" | "select";
  options?: string | null;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  image?: string;
  description?: string;
  order: number;
  parentId?: string;
  parent?: { id: string; name: string };
  _count?: { ads: number };
  customFilters?: CustomFilter[];
  createdAt: string;
}

export interface Stats {
  totalUsers: number;
  totalAds: number;
  activeAds: number;
  pendingAds: number;
  totalViews: number;
  recentAds: Array<{
    id: string;
    title: string;
    price: number;
    currency: string;
    status: string;
    createdAt: string;
    user: { name: string };
    category: { name: string };
  }>;
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    createdAt: string;
    role: string;
  }>;
}

export interface Neighborhood {
  id: string;
  name: string;
  cityId: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface LocationCity {
  id: string;
  name: string;
  stateId: string;
  neighborhoods: Neighborhood[];
}

export interface LocationState {
  id: string;
  name: string;
  countryId: string;
  cities: LocationCity[];
}

export interface Country {
  id: string;
  name: string;
  states: LocationState[];
}
