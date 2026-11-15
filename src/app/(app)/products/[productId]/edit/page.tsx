import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductForm } from "@/features/products/product-form";
import { getDb } from "@/server/db/driver";
import { getProduct } from "@/server/db/repositories/product-repository";
import { resolveWorkspaceContext } from "@/server/security/workspace-context";

export const dynamic = "force-dynamic";

interface EditProductPageProps {
  params: Promise<{ productId: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { productId } = await params;
  const workspace = await resolveWorkspaceContext();
  const db = getDb();
  const product = await getProduct(db, workspace.id, productId);
  if (!product) notFound();

  return (
    <section aria-labelledby="edit-product-title" className="mx-auto max-w-3xl space-y-4">
      <Link
        href={`/products/${product.id}`}
        className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Ürün detayına dön
      </Link>
      <div>
        <h1 id="edit-product-title" className="text-2xl font-semibold tracking-tight">
          Ürünü Düzenle
        </h1>
        <p className="mt-1 text-sm text-text-secondary">{product.title}</p>
      </div>
      <ProductForm initial={product} />
    </section>
  );
}
