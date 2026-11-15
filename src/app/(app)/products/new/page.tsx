import { ProductForm } from "@/features/products/product-form";

export default function NewProductPage() {
  return (
    <section aria-labelledby="new-product-title" className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 id="new-product-title" className="text-2xl font-semibold tracking-tight">
          Ürün Ekle
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Ürün kimliği ve maliyet girdilerini girin. Piyasa araştırması sonraki adımda
          ürün detayından başlatılır.
        </p>
      </div>
      <ProductForm />
    </section>
  );
}
