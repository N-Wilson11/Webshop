import { notFound } from "next/navigation";
import { getProduct } from "@/lib/api";
import { AddToCartPanel } from "@/components/AddToCartPanel";

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <AddToCartPanel product={product} />
    </div>
  );
}
