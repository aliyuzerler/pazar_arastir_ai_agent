// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { CardSkeleton } from "@/components/feedback/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

describe("durum bileşenleri (Faz 1)", () => {
  it("EmptyState başlık, açıklama ve aksiyon gösterir", () => {
    render(
      <EmptyState title="Veri yok" description="Henüz kayıt eklenmedi." action={<button>Ürün ekle</button>} />,
    );
    expect(screen.getByText("Veri yok")).toBeInTheDocument();
    expect(screen.getByText("Henüz kayıt eklenmedi.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ürün ekle" })).toBeInTheDocument();
  });

  it("ErrorState role=alert ile duyurulur ve tekrar dene tetiklenir", async () => {
    const onRetry = vi.fn();
    render(<ErrorState description="Sunucuya ulaşılamadı." onRetry={onRetry} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /yeniden dene/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("CardSkeleton loading durumunu duyurur", () => {
    render(<CardSkeleton rows={2} />);
    expect(screen.getByRole("status", { name: "İçerik yükleniyor" })).toBeInTheDocument();
  });
});

describe("temel bileşenler (Faz 1)", () => {
  it("Button varyantları render edilir", () => {
    render(<Button variant="primary">Birincil</Button>);
    const button = screen.getByRole("button", { name: "Birincil" });
    expect(button).toHaveClass("bg-accent");
  });

  it("Badge varyant metni ile birlikte görünür (renk tek başına anlam taşımaz)", () => {
    render(<Badge variant="demo">DEMO VERİ</Badge>);
    const badge = screen.getByText("DEMO VERİ");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("DEMO VERİ");
  });

  it("Tabs sekmeler arasında geçiş yapar", async () => {
    render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">Birebir aynı</TabsTrigger>
          <TabsTrigger value="b">Muadiller</TabsTrigger>
        </TabsList>
        <TabsContent value="a">A paneli</TabsContent>
        <TabsContent value="b">B paneli</TabsContent>
      </Tabs>,
    );
    expect(screen.getByText("A paneli")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("tab", { name: "Muadiller" }));
    expect(screen.getByText("B paneli")).toBeInTheDocument();
    expect(screen.queryByText("A paneli")).not.toBeInTheDocument();
  });

  it("Table başlık ve satırları erişilebilir şekilde sunar", () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ürün</TableHead>
            <TableHead>Fiyat</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Test Ürünü</TableCell>
            <TableCell>1.299,90</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole("columnheader", { name: "Ürün" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Test Ürünü" })).toBeInTheDocument();
  });
});
