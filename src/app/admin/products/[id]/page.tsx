"use client";

import { use } from "react";
import { ProductForm } from "@/app/admin/products/product-form";
import { useStore } from "@/lib/store";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { getProduct } = useStore();
  const product = getProduct(id);

  if (!product) {
    return <p className="text-sm text-muted-foreground">Product not found.</p>;
  }

  return (
    <div>
      <ProductForm product={product} />
    </div>
  );
}
