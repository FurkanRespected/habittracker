# Habit Tracker

Telefon ve PC’den erişilebilen habit tracker (React + Vite).

## Lokal çalıştırma

```powershell
npm install
npm run dev
```

## Netlify deploy

- **Build command**: `npm run build`
- **Publish directory**: `dist`
- SPA route’lar için `_redirects` dosyası zaten eklendi.

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

