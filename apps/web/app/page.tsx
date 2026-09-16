import { getProducts, getTheme } from "@/lib/api";
import { ProductCard } from "@/components/ProductCard";

export default async function HomePage() {
  const [products, theme] = await Promise.all([getProducts(), getTheme()]);
  const featured = products.filter((p) => p.featured);

  return (
    <div className="flex flex-col gap-12">
      <section className="rounded-3xl bg-gradient-to-br from-primary to-accent px-8 py-16 text-center text-white shadow-lg">
        <h1 className="font-display text-4xl font-bold sm:text-5xl">{theme.shopName}</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-white/90">{theme.tagline}</p>
      </section>

      {featured.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-2xl font-semibold text-ink">Featured Cookies</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 font-display text-2xl font-semibold text-ink">All Cookies</h2>
        {products.length === 0 ? (
          <p className="text-ink/70">
            No products yet. Add some from the{" "}
            <a href="/admin" className="text-primary underline">
              admin CMS
            </a>
            .
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
