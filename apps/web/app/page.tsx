import { getProducts, getTheme } from "@/lib/api";
import { ProductCatalog } from "@/components/ProductCatalog";

export default async function HomePage() {
  const [products, theme] = await Promise.all([getProducts(), getTheme()]);
  return (
    <div className="flex flex-col gap-12">
      <section className="rounded-3xl bg-gradient-to-br from-primary to-accent px-8 py-16 text-center text-white shadow-lg">
        <h1 className="font-display text-4xl font-bold sm:text-5xl">{theme.shopName}</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-white/90">{theme.tagline}</p>
      </section>

      <ProductCatalog products={products} />
    </div>
  );
}
