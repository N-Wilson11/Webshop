"use client";

import { PRODUCTS_API_PUBLIC, UPLOAD_API_PUBLIC, type Product, type Theme } from "./api";

const TOKEN_KEY = "cms_admin_token";

export function getAdminToken(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(TOKEN_KEY) || "";
}

export function setAdminToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

function authHeaders() {
  return { Authorization: `Bearer ${getAdminToken()}` };
}

export async function fetchOrdersAdmin() {
  const res = await fetch("/api/admin/orders", {
    headers: authHeaders(),
    cache: "no-store"
  });
  if (!res.ok) {
    throw new Error((await res.json()).error || "Failed to load orders");
  }
  return res.json();
}

export async function isTokenValid(): Promise<boolean> {
  // Validate the stored token by re-saving the current theme (a harmless admin write).
  const currentTheme = await (await fetch(`${PRODUCTS_API_PUBLIC}/settings/theme`)).json();
  const res = await fetch(`${PRODUCTS_API_PUBLIC}/settings/theme`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(currentTheme)
  });
  return res.ok;
}

export async function fetchProductsAdmin(): Promise<Product[]> {
  const res = await fetch(`${PRODUCTS_API_PUBLIC}/products`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export async function createProduct(data: Partial<Product>) {
  const res = await fetch(`${PRODUCTS_API_PUBLIC}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error((await res.json()).error || "Failed to create product");
  return res.json();
}

export async function updateProduct(id: string, data: Partial<Product>) {
  const res = await fetch(`${PRODUCTS_API_PUBLIC}/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error((await res.json()).error || "Failed to update product");
  return res.json();
}

export async function deleteProduct(id: string) {
  const res = await fetch(`${PRODUCTS_API_PUBLIC}/products/${id}`, {
    method: "DELETE",
    headers: authHeaders()
  });
  if (!res.ok) throw new Error("Failed to delete product");
}

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("image", file);
  const res = await fetch(`${UPLOAD_API_PUBLIC}/upload`, {
    method: "POST",
    headers: authHeaders(),
    body: form
  });
  if (!res.ok) throw new Error((await res.json()).error || "Failed to upload image");
  const data = await res.json();
  return data.url as string;
}

export async function fetchThemeAdmin(): Promise<Theme> {
  const res = await fetch(`${PRODUCTS_API_PUBLIC}/settings/theme`, { cache: "no-store" });
  return res.json();
}

export async function saveTheme(theme: Theme) {
  const res = await fetch(`${PRODUCTS_API_PUBLIC}/settings/theme`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(theme)
  });
  if (!res.ok) throw new Error("Failed to save theme");
  return res.json();
}
