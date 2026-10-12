import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL || "";
const TOKEN_KEY = "danz_token";

async function getToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      return window.localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string | null): Promise<void> {
  if (Platform.OS === "web") {
    try {
      if (token) window.localStorage.setItem(TOKEN_KEY, token);
      else window.localStorage.removeItem(TOKEN_KEY);
    } catch {}
    return;
  }
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function apiFetch<T = any>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  const token = await getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${BASE}/api${path}`, { ...init, headers });
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const msg = (data && (data.detail || data.message)) || `Request failed (${res.status})`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return data as T;
}

export const api = {
  // auth
  login: (email: string, password: string) =>
    apiFetch<{ access_token: string; user: any }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (email: string, password: string, display_name: string) =>
    apiFetch<{ access_token: string; user: any }>("/auth/register", { method: "POST", body: JSON.stringify({ email, password, display_name }) }),
  me: () => apiFetch<any>("/auth/me"),
  changePassword: (current_password: string, new_password: string) =>
    apiFetch("/auth/change-password", { method: "POST", body: JSON.stringify({ current_password, new_password }) }),
  // categories
  categories: () => apiFetch<any[]>("/categories"),
  // listings
  listings: (params: Record<string, any> = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v != null && v !== "" && q.append(k, String(v)));
    const s = q.toString();
    return apiFetch<any[]>(`/listings${s ? "?" + s : ""}`);
  },
  listingsPending: () => apiFetch<any[]>("/listings/pending"),
  myListings: () => apiFetch<any[]>("/listings/mine"),
  listing: (id: string) => apiFetch<any>(`/listings/${id}`),
  createListing: (body: any) => apiFetch<any>("/listings", { method: "POST", body: JSON.stringify(body) }),
  moderateListing: (id: string, action: "approve" | "reject", reason?: string) =>
    apiFetch(`/listings/${id}/moderate`, { method: "POST", body: JSON.stringify({ action, reason }) }),
  deleteListing: (id: string) => apiFetch(`/listings/${id}`, { method: "DELETE" }),
  // favorites
  favorites: () => apiFetch<any[]>("/favorites"),
  addFavorite: (id: string) => apiFetch(`/favorites/${id}`, { method: "POST" }),
  removeFavorite: (id: string) => apiFetch(`/favorites/${id}`, { method: "DELETE" }),
  // payment methods
  paymentMethods: () => apiFetch<any[]>("/payment-methods"),
  adminPaymentMethods: () => apiFetch<any[]>("/admin/payment-methods"),
  createPaymentMethod: (body: any) => apiFetch("/admin/payment-methods", { method: "POST", body: JSON.stringify(body) }),
  updatePaymentMethod: (id: string, body: any) => apiFetch(`/admin/payment-methods/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deletePaymentMethod: (id: string) => apiFetch(`/admin/payment-methods/${id}`, { method: "DELETE" }),
  // orders
  createOrder: (listing_id: string, payment_method_id: string) =>
    apiFetch<any>("/orders", { method: "POST", body: JSON.stringify({ listing_id, payment_method_id }) }),
  myOrders: () => apiFetch<any[]>("/orders/mine"),
  mySales: () => apiFetch<any[]>("/orders/sales"),
  order: (id: string) => apiFetch<any>(`/orders/${id}`),
  submitProof: (id: string, proof_url?: string, note?: string) =>
    apiFetch(`/orders/${id}/submit-proof`, { method: "POST", body: JSON.stringify({ proof_url, note }) }),
  cancelOrder: (id: string) => apiFetch(`/orders/${id}/cancel`, { method: "POST" }),
  adminOrders: () => apiFetch<any[]>("/admin/orders"),
  adminUpdateOrderStatus: (id: string, status: string, note?: string) =>
    apiFetch(`/admin/orders/${id}/status`, { method: "POST", body: JSON.stringify({ status, note }) }),
  // admin
  adminUsers: () => apiFetch<any[]>("/admin/users"),
  toggleUser: (id: string) => apiFetch(`/admin/users/${id}/toggle-disabled`, { method: "POST" }),
  adminStats: () => apiFetch<any>("/admin/stats"),
  siteSettings: () => apiFetch<any>("/site-settings"),
  updateSiteSettings: (body: any) => apiFetch("/admin/site-settings", { method: "PUT", body: JSON.stringify(body) }),
};
