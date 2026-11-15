/**
 * E-posta servisi: taşıyıcı soyutlaması. RESEND_API_KEY tanımlıysa gerçek
 * gönderim; yoksa e-posta outbox tablosuna yazılır (yerel/demo mod) ve
 * UI'da görüntülenebilir. Secret değerleri asla bundle'a girmez.
 */
import { getEnv } from "@/lib/env";
import type { AppDatabase } from "@/server/db/driver";
import { emailOutbox } from "@/server/db/schema";

export interface OutgoingEmail {
  to: string;
  subject: string;
  kind: "verification" | "password_reset";
  html: string;
}

export async function sendEmail(db: AppDatabase, email: OutgoingEmail): Promise<{ via: "outbox" | "resend" }> {
  const env = getEnv();
  if (env.APP_MODE === "production" && env.RESEND_API_KEY) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM ?? "Product Intelligence <onboarding@resend.dev>",
        to: [email.to],
        subject: email.subject,
        html: email.html,
      }),
    });
    if (!response.ok) {
      throw new Error(`E-posta gönderimi başarısız: ${response.status}`);
    }
    await db.insert(emailOutbox).values({
      toEmail: email.to,
      subject: email.subject,
      kind: email.kind,
      bodyHtml: email.html,
      sentVia: "resend",
    });
    return { via: "resend" };
  }

  await db.insert(emailOutbox).values({
    toEmail: email.to,
    subject: email.subject,
    kind: email.kind,
    bodyHtml: email.html,
    sentVia: "outbox",
  });
  return { via: "outbox" };
}

export function renderVerificationEmail(displayName: string, verificationUrl: string): string {
  return `<p>Merhaba ${displayName},</p>
<p>Product Intelligence hesabınızı doğrulamak için aşağıdaki bağlama tıklayın:</p>
<p><a href="${verificationUrl}">E-posta adresimi doğrula</a></p>
<p>Bağlantı 24 saat geçerlidir. Bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz.</p>`;
}

export function renderPasswordResetEmail(displayName: string, resetUrl: string): string {
  return `<p>Merhaba ${displayName},</p>
<p>Parolanızı sıfırlamak için aşağıdaki bağlantıyı kullanın:</p>
<p><a href="${resetUrl}">Parolamı sıfırla</a></p>
<p>Bağlantı 1 saat geçerlidir ve tek kullanımlıktır. İsteği siz yapmadıysanız parolanızı değiştirmeyin.</p>`;
}
