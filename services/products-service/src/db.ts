import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";

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
      imageUrl: "",
      featured: true,
      createdAt: now,
      updatedAt: now
    },
    {
      id: "double-choc",
      name: "Double Chocolate Fudge",
      description: "Decadent cocoa dough packed with dark chocolate chunks.",
      price: 4,
      currency: "EUR",
      category: "cookies",
      stock: 40,
      imageUrl: "",
      featured: true,
      createdAt: now,
      updatedAt: now
    },
    {
      id: "oatmeal-raisin",
      name: "Oatmeal Raisin",
      description: "Hearty oats, sweet raisins and a hint of cinnamon.",
      price: 3.25,
      currency: "EUR",
      category: "cookies",
      stock: 30,
      imageUrl: "",
      featured: false,
      createdAt: now,
      updatedAt: now
    }
  ];
}

// In-memory mode is used for tests (DATABASE_PATH=":memory:") so no file I/O happens.
const isMemory = process.env.DATABASE_PATH === ":memory:";
const dataDir = path.join(__dirname, "..", "data");
const dbPath = process.env.DATABASE_PATH || path.join(dataDir, "products.json");

let memoryData: Data | null = null;

function load(): Data {
  if (isMemory) {
    if (!memoryData) {
      memoryData = { products: seedProducts(), theme: defaultTheme };
    }
    return memoryData;
  }

  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dbPath)) {
    const initial: Data = { products: seedProducts(), theme: defaultTheme };
    fs.writeFileSync(dbPath, JSON.stringify(initial, null, 2));
    return initial;
  }
  const raw = fs.readFileSync(dbPath, "utf-8");
  return JSON.parse(raw) as Data;
}

function save(data: Data) {
  if (isMemory) {
    memoryData = data;
    return;
  }
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

export const store = {
  listProducts(category?: string): Product[] {
    const data = load();
    const sorted = [...data.products].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return category ? sorted.filter((p) => p.category === category) : sorted;
  },

  getProduct(id: string): Product | undefined {
    return load().products.find((p) => p.id === id);
  },

  createProduct(input: Partial<Product> & { name: string; price: number }): Product {
    const data = load();
    const now = new Date().toISOString();
    const product: Product = {
      id: randomUUID(),
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
    save(data);
    return product;
  },

  updateProduct(id: string, input: Partial<Product>): Product | undefined {
    const data = load();
    const idx = data.products.findIndex((p) => p.id === id);
    if (idx === -1) return undefined;
    const updated: Product = {
      ...data.products[idx],
      ...input,
      id,
      updatedAt: new Date().toISOString()
    };
    data.products[idx] = updated;
    save(data);
    return updated;
  },

  deleteProduct(id: string): boolean {
    const data = load();
    const before = data.products.length;
    data.products = data.products.filter((p) => p.id !== id);
    save(data);
    return data.products.length < before;
  },

  getTheme(): Theme {
    return load().theme;
  },

  setTheme(theme: Theme): Theme {
    const data = load();
    data.theme = theme;
    save(data);
    return theme;
  }
};
