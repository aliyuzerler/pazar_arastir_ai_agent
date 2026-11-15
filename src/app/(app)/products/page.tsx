import { Archive, Package, Plus, Upload } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/feedback/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableWrapper,
} from "@/components/ui/table";
import { ProductArchiveButton } from "@/features/products/product-archive-button";
import { getDb } from "@/server/db/driver";
import { listProducts, type ProductSortField } from "@/server/db/repositories/product-repository";
import { formatDateTime, formatMoney } from "@/lib/format";
import { resolveWorkspaceContext } from "@/server/security/workspace-context";

export const dynamic = "force-dynamic";

const SORTS: { value: string; label: string }[] = [
  { value: "createdAt:desc", label: "En yeni" },
  { value: "title:asc", label: "Başlık (A-Z)" },
  { value: "unitCost:desc", label: "Maliyet (yüksek)" },
  { value: "unitCost:asc", label: "Maliyet (düşük)" },
];

interface ProductsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function param(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const sp = await searchParams;
  const query = param(sp.query);
  const category = param(sp.category);
  const archived = param(sp.archived) === "true";
  const tracking = param(sp.tracking);
  const sortPair = (param(sp.sort) || "createdAt:desc").split(":");
  const sort = sortPair[0] as ProductSortField;
  const order = sortPair[1] === "asc" ? "asc" : "desc";
  const page = Math.max(Number(param(sp.page) || "1"), 1);
  const pageSize = 20;

  const workspace = await resolveWorkspaceContext();
  const db = getDb();
  const { items, total } = await listProducts(db, workspace.id, {
    query: query || undefined,
    category: category || undefined,
    tracking: tracking === "true" ? true : tracking === "false" ? false : undefined,
    archived,
    sort: ["title", "unitCost", "createdAt", "updatedAt"].includes(sort) ? sort : "createdAt",
    order,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  function pageUrl(nextPage: number): string {
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    if (category) params.set("category", category);
    if (archived) params.set("archived", "true");
    params.set("sort", `${sort}:${order}`);
    params.set("page", String(nextPage));
    return `/products?${params.toString()}`;
  }

  return (
    <section aria-labelledby="products-title" className="space-y-4">
      <header className="flex flex-wrap items-center gap-2">
        <div>
          <h1 id="products-title" className="text-2xl font-semibold tracking-tight">
            Ürünler
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {total} kayıt · kendi kataloğunuz (rakip teklifleri ayrı tutulur)
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <Link href="/products/import">
            <Button variant="secondary">
              <Upload aria-hidden />
              CSV İçe Aktar
            </Button>
          </Link>
          <Link href="/products/new">
            <Button>
              <Plus aria-hidden />
              Ürün Ekle
            </Button>
          </Link>
        </div>
      </header>

      <form method="get" className="flex flex-wrap items-end gap-2" aria-label="Ürün filtreleri">
        <div className="w-full sm:w-64">
          <label htmlFor="query" className="mb-1 block text-xs font-medium text-text-secondary">
            Ara (başlık, marka, SKU, GTIN)
          </label>
          <Input id="query" name="query" defaultValue={query} placeholder="örn. kulaklık" />
        </div>
        <div className="w-40">
          <label htmlFor="category" className="mb-1 block text-xs font-medium text-text-secondary">
            Kategori
          </label>
          <Input id="category" name="category" defaultValue={category} />
        </div>
        <div className="w-44">
          <label htmlFor="tracking" className="mb-1 block text-xs font-medium text-text-secondary">
            İzleme
          </label>
          <Select id="tracking" name="tracking" defaultValue={tracking}>
            <option value="">Tümü</option>
            <option value="true">İzleniyor</option>
            <option value="false">İzlenmiyor</option>
          </Select>
        </div>
        <div className="w-44">
          <label htmlFor="sort" className="mb-1 block text-xs font-medium text-text-secondary">
            Sıralama
          </label>
          <Select id="sort" name="sort" defaultValue={`${sort}:${order}`}>
            {SORTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
        <input type="hidden" name="archived" value={archived ? "true" : "false"} />
        <Button type="submit" variant="secondary">
          Filtrele
        </Button>
        <Link href={archived ? "/products" : "/products?archived=true"}>
          <Button variant={archived ? "primary" : "ghost"} type="button">
            <Archive aria-hidden />
            {archived ? "Aktifleri göster" : "Arşiv"}
          </Button>
        </Link>
      </form>

      {items.length === 0 ? (
        <EmptyState
          icon={Package}
          title={archived ? "Arşivde ürün yok" : "Henüz ürün eklenmedi"}
          description={
            archived
              ? "Arşivlenen ürünler burada listelenir; geri yükleyebilirsiniz."
              : "İlk ürününüzü ekleyin veya CSV ile toplu içe aktarın. Ürün kataloğu araştırma ve fiyat önerilerinin temelidir."
          }
          action={
            archived ? undefined : (
              <Link href="/products/new">
                <Button>İlk ürünü ekle</Button>
              </Link>
            )
          }
        />
      ) : (
        <>
          <div className="rounded-xl border border-border-subtle bg-surface">
            <TableWrapper>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ürün</TableHead>
                    <TableHead className="hidden md:table-cell">SKU / GTIN</TableHead>
                    <TableHead className="text-right">Birim maliyet</TableHead>
                    <TableHead className="hidden lg:table-cell">Son güncelleme</TableHead>
                    <TableHead className="text-right">İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Link
                          href={`/products/${product.id}`}
                          className="font-medium hover:underline"
                        >
                          {product.title}
                        </Link>
                        <p className="text-xs text-text-secondary">
                          {[product.brand, product.model].filter(Boolean).join(" · ") || "—"}
                          {product.trackingEnabled ? (
                            <Badge variant="info" className="ml-2">
                              İzleniyor
                            </Badge>
                          ) : null}
                        </p>
                      </TableCell>
                      <TableCell className="hidden font-mono text-xs text-text-secondary md:table-cell">
                        {product.sku ?? "—"}
                        {product.gtin ? ` / ${product.gtin}` : ""}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(product.unitCost, product.currency)}
                      </TableCell>
                      <TableCell className="hidden text-xs text-text-secondary lg:table-cell">
                        {formatDateTime(product.updatedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <ProductArchiveButton productId={product.id} archived={archived} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableWrapper>
          </div>

          <nav className="flex items-center justify-between text-sm text-text-secondary" aria-label="Sayfalama">
            <p>
              Sayfa {page} / {totalPages} · {total} kayıt
            </p>
            <div className="flex gap-2">
              {page > 1 ? (
                <Link href={pageUrl(page - 1)}>
                  <Button variant="secondary" size="sm">
                    Önceki
                  </Button>
                </Link>
              ) : null}
              {page < totalPages ? (
                <Link href={pageUrl(page + 1)}>
                  <Button variant="secondary" size="sm">
                    Sonraki
                  </Button>
                </Link>
              ) : null}
            </div>
          </nav>
        </>
      )}
    </section>
  );
}
