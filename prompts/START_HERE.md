# ZCode için ilk oturum promptu

Bu depodaki Product Intelligence projesini geliştireceğiz. Önce `AGENTS.md`, `README_TR.md`, `docs/` ve `.agents/skills/` klasörlerini oku. Proje kapsamı ürün katalog yönetimi, birebir ürün ve muadil araştırması, rakip teklif fiyat/stok gözlemi, fiyat geçmişi ve maliyet bazlı satış fiyatı önerisidir.

Önemli kısıtlar: MVP yerelde çalışacak, kullanıcı kaydı UI'ı olmayacak ama workspace/tenant veri modeli bulunacak. Vercel hedefi vardır; bu nedenle PostgreSQL kullanılacak, SQLite dosyasına dayanılmayacak. DemoProvider anahtarsız çalışmalı ve tüm demo verisi açıkça işaretlenmeli. Canlı veri kaynaklarının kapsamı sınırlıdır; unknown verileri uydurma. Fiyat önerisi deterministic decimal math ile yapılacak, Gemini yalnızca yardımcı açıklama/eşleştirme fonksiyonu olacaksa kullanılacak.

Henüz tüm projeyi kodlama. Önce mimariyi özetle, belirsiz/riskli alanları listele, sonra `prompts/00_BOOTSTRAP.md` dosyasını uygula. Fazın testini `prompts/tests/TEST_00_BOOTSTRAP.md` ile tamamla ve sonraki faza geçme.
