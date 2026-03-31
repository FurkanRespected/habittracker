# Habit Tracker

Telefon ve PC’den erişilebilen habit tracker (React + Vite).

## Lokal çalıştırma

```powershell
npm install
npm run dev
```

## Netlify deploy (site Git’e bağlıysa)

Projede `netlify.toml` var; Netlify genelde **build command** ve **publish**’i buradan alır (`npm run build` → `dist`). Ekstra ayar gerekmez.

1. **Kodu Git’e gönder**  
   `main` (veya bağladığın branch) üzerine commit + push yap. Netlify otomatik build başlatır; Deploy log’da hata varsa düzelt.

2. **Supabase kullanacaksan — Netlify’da ortam değişkenleri**  
   Netlify: **Site configuration → Environment variables → Add a variable**  
   Aynı isimlerle ekle (Production için):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`  
   Değerler `.env` içindekiyle aynı. Kaydettikten sonra **Deploys → Trigger deploy → Clear cache and deploy site** (veya boş commit + push) ile yeniden derlet; aksi halde build sırasında bu değişkenler bundle’a girmez.

3. **Supabase Auth redirect**  
   Supabase Dashboard → Authentication → URL Configuration:  
   **Site URL** = Netlify URL’in (örn. `https://senin-site.netlify.app`).  
   **Redirect URLs** listesine aynı adresi (ve gerekirse `http://localhost:5173`) ekle.

SPA için `public/_redirects` (`/*` → `index.html`) zaten var; client-side route’lar çalışır.

## Supabase (senkron + çok kullanıcı)

### 1) Proje oluştur
- Supabase’te yeni proje aç.
- Auth → Email/Password açık olsun.

### 2) DB şemasını kur
- Supabase SQL Editor’da `supabase/schema.sql` içeriğini çalıştır.

### 3) Frontend ortam değişkenleri
- `.env.example` → `.env` kopyala.
- İçini doldur:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

