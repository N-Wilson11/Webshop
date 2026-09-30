export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  stock: number;
  imageUrl: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Theme = {
  shopName: string;
  tagline: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
};

type Data = {
  products: Product[];
  theme: Theme;
};

type SupabaseProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  stock: number;
  image_url: string;
  featured: boolean;
  created_at: string;
  updated_at: string;
};

const defaultTheme: Theme = {
  shopName: "Cookie Corner",
  tagline: "Freshly baked happiness, delivered to your door.",
  colors: {
    primary: "#8B5E3C",
    secondary: "#F4B942",
    accent: "#D96C4C",
    background: "#FFF8F0",
    text: "#3A2618"
  }
};

function seedProducts(): Product[] {
  const now = new Date().toISOString();
  return [
    {
      id: "choc-chip",
      name: "Classic Chocolate Chip",
      description: "A timeless favorite, loaded with rich chocolate chips.",
      price: 3.5,
      currency: "EUR",
      category: "cookies",
      stock: 50,
      imageUrl: "/images/chocolate-chip.png",
      featured: true,
      createdAt: now,
      updatedAt: now
    },
    {
      id: "pineapple-upside-down",
      name: "Pineapple Upside Down",
      description: "Sweet pineapple and caramelized topping on a soft cookie base.",
      price: 4,
      currency: "EUR",
      category: "cookies",
      stock: 40,
      imageUrl: "/images/pineapple-upside-down.png",
      featured: true,
      createdAt: now,
      updatedAt: now
    },
    {
      id: "brownies",
      name: "Brownies",
      description: "Rich and fudgy chocolate brownies.",
      price: 3.25,
      currency: "EUR",
      category: "cookies",
      stock: 30,
      imageUrl: "/images/brownies.png",
      featured: false,
      createdAt: now,
      updatedAt: now
    },
    {
      id: "cocada",
      name: "Cocada",
      description: "A traditional coconut treat, sweet and chewy.",
      price: 3.25,
      currency: "EUR",
      category: "cookies",
      stock: 30,
      imageUrl: "/images/cocada.png",
      featured: false,
      createdAt: now,
      updatedAt: now
    }
  ];
}

const isMemory = process.env.DATABASE_PATH === ":memory:";
let memoryData: Data | null = null;

function getMemoryData(): Data {
  if (!memoryData) {
    memoryData = { products: seedProducts(), theme: defaultTheme };
  }
  return memoryData;
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be configured");
  }

  return { url: url.replace(/\/$/, ""), serviceRoleKey };
}

async function supabaseRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { url, serviceRoleKey } = getSupabaseConfig();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      ...init.headers
    }
  });

  if (!response.ok) {
    throw new Error(`Supabase request failed (${response.status})`);
  }

  return (await response.json()) as T;
}

function toProduct(product: SupabaseProduct): Product {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    currency: product.currency,
    category: product.category,
    stock: product.stock,
    imageUrl: product.image_url,
    featured: product.featured,
    createdAt: product.created_at,
    updatedAt: product.updated_at
  };
}

function toSupabaseProduct(input: Partial<Product>) {
  const product: Record<string, string | number | boolean> = {};

  if (typeof input.name === "string") product.name = input.name;
  if (typeof input.description === "string") product.description = input.description;
  if (typeof input.price === "number") product.price = input.price;
  if (typeof input.currency === "string") product.currency = input.currency;
  if (typeof input.category === "string") product.category = input.category;
  if (typeof input.stock === "number") product.stock = input.stock;
  if (typeof input.imageUrl === "string") product.image_url = input.imageUrl;
  if (typeof input.featured === "boolean") product.featured = input.featured;

  return product;
}

export const store = {
  async listProducts(category?: string): Promise<Product[]> {
    if (isMemory) {
      const products = [...getMemoryData().products].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      return category ? products.filter((product) => product.category === category) : products;
    }

    const filter = category ? `&category=eq.${encodeURIComponent(category)}` : "";
    const products = await supabaseRequest<SupabaseProduct[]>(
      `products?select=*&order=created_at.desc${filter}`
    );
    return products.map(toProduct);
  },

  async getProduct(id: string): Promise<Product | undefined> {
    if (isMemory) {
      return getMemoryData().products.find((product) => product.id === id);
    }

    const products = await supabaseRequest<SupabaseProduct[]>(
      `products?select=*&id=eq.${encodeURIComponent(id)}&limit=1`
    );
    return products[0] ? toProduct(products[0]) : undefined;
  },

  async createProduct(input: Partial<Product> & { name: string; price: number }): Promise<Product> {
    if (isMemory) {
      const data = getMemoryData();
      const now = new Date().toISOString();
      const product: Product = {
        id: crypto.randomUUID(),
        name: input.name,
        description: input.description || "",
        price: input.price,
        currency: input.currency || "EUR",
        category: input.category || "cookies",
        stock: typeof input.stock === "number" ? input.stock : 0,
        imageUrl: input.imageUrl || "",
        featured: !!input.featured,
        createdAt: now,
        updatedAt: now
      };
      data.products.push(product);
      return product;
    }

    const products = await supabaseRequest<SupabaseProduct[]>("products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=representation"
      },
      body: JSON.stringify({
        name: input.name,
        description: input.description || "",
        price: input.price,
        currency: input.currency || "EUR",
        category: input.category || "cookies",
        stock: typeof input.stock === "number" ? input.stock : 0,
        image_url: input.imageUrl || "",
        featured: !!input.featured
      })
    });
    return toProduct(products[0]);
  },

  async updateProduct(id: string, input: Partial<Product>): Promise<Product | undefined> {
    if (isMemory) {
      const data = getMemoryData();
      const index = data.products.findIndex((product) => product.id === id);
      if (index === -1) return undefined;

      const updated = {
        ...data.products[index],
        ...input,
        id,
        updatedAt: new Date().toISOString()
      };
      data.products[index] = updated;
      return updated;
    }

    const update = toSupabaseProduct(input);
    if (Object.keys(update).length === 0) {
      return this.getProduct(id);
    }

    const products = await supabaseRequest<SupabaseProduct[]>(
      `products?id=eq.${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Prefer: "return=representation"
        },
        body: JSON.stringify(update)
      }
    );
    return products[0] ? toProduct(products[0]) : undefined;
  },

  async deleteProduct(id: string): Promise<boolean> {
    if (isMemory) {
      const data = getMemoryData();
      const before = data.products.length;
      data.products = data.products.filter((product) => product.id !== id);
      return data.products.length < before;
    }

    const products = await supabaseRequest<SupabaseProduct[]>(
      `products?id=eq.${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        headers: { Prefer: "return=representation" }
      }
    );
    return products.length > 0;
  },

  async getTheme(): Promise<Theme> {
    if (isMemory) return getMemoryData().theme;

    const settings = await supabaseRequest<Array<{ theme: Theme }>>(
      "store_settings?select=theme&id=eq.1&limit=1"
    );
    if (!settings[0]) throw new Error("Supabase store settings are not initialized");
    return settings[0].theme;
  },

  async setTheme(theme: Theme): Promise<Theme> {
    if (isMemory) {
      getMemoryData().theme = theme;
      return theme;
    }

    const settings = await supabaseRequest<Array<{ theme: Theme }>>("store_settings?id=eq.1", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Prefer: "return=representation"
      },
      body: JSON.stringify({ theme })
    });
    if (!settings[0]) throw new Error("Supabase store settings are not initialized");
    return settings[0].theme;
  }
};
