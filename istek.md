# PROJE VİZYONU VE YOL HARİTASI (MASTER PLAN)

Merhaba. Bu projede seninle birlikte modern, kapsamlı ve oyunlaştırılmış bir "Kişisel Gelişim ve Performans İşletim Sistemi (Life/Performance OS)" geliştiriyoruz. Kod yazarken, mimariyi kurarken ve UI/UX tasarımı yaparken her zaman bu belgedeki vizyonu göz önünde bulundurmanı istiyorum.

## 1. Tasarım Dili ve UI/UX Felsefesi (Felsefeyi anla şuanki tasarım uyuyor mu kontrol et fark ne onu söyle)

- **Vibe:** Discord, Cursor, Linear gibi modern SaaS uygulamalarının premium hissiyatı.
- **Tema:** Dark mode ağırlıklı, minimalist, temiz tipografi, modern border-radius'lar ve ince blur/glassmorphism efektleri.
- **Layout:** Panel tasarımlarında "Bento Grid" (kutu kutu modüler yapı) kullanılacak.
- **Deneyim:** Kullanıcı veri girerken minimum efor harcamalı (Frictionless UI).

## 2. Sayfalar ve Modüller (Core Features)

### A. Landing Page & Pricing

- Premium bir SaaS açılış sayfası.
- Sağ üstte "Log In" ve dikkat çekici "Try for Free" butonu.
- Hero Section: Uygulamanın ne olduğunu basitçe anlatan bir başlık ve panelin şık bir mock-up görseli.
- Fiyatlandırma (Pricing): Basit ve modern kartlar halinde 3 paket (Free, Pro, Coach).

### B. Dashboard (Komuta Merkezi)

- Notion veya Apple widget'ları gibi çalışan modüler bir sayfa.
- **Sabit Kısım:** Üstte kullanıcının günlük özetini (Odak Puanı, Bugünkü Antrenman, Kalan Kalori vb.) veren fix bir alan.
- **Kişiselleştirilebilir Kısım (Drag & Drop):** Kullanıcıların kendi istedikleri widget'ları (Su takibi, kilo grafiği vb.) ekleyip çıkarabileceği dinamik bir grid alanı.

### C. Protokoller (Alışkanlıklar & Odak)

- Alışkanlık takibi (Habit Tracker) ve To-Do listesi. Zincir kırma (streak) mantığı.
- Gelecek özellik: "Focus Timer" (Pomodoro/Zamanlayıcı). Kullanıcı odaklandıkça sistemden XP (Puan) kazanacak.

### D. Workout Hub (Antrenman ve Beslenme Merkezi)

- **Spor Log & Şablon Sistemi:** Kullanıcı "İtme/Çekme/Bacak" gibi bir şablon oluşturacak. Bu şablon haftalara otomatik dağılacak.
- **Progressive Overload Tracking:** Kullanıcı set/tekrar/ağırlık girecek. Sistem her egzersizde geçmiş veriyi (örn: "Geçen hafta bu ağırlığı kaldırdın") gösterecek. Geçmiş antrenmanlar düzenlenebilecek.
- **Kalori Takibi:** Basit, hızlı veri eklenebilen ve makro gösteren kullanışlı bir tracker.
- **Takviye (Supplement) Tracker:** Günlük takviye kullanım logları.
- Gelecek özellik: Egzersiz hareketlerini gösteren kütüphane/videolar.

### E. Community & Koçluk (Uygulamanın Sosyal Ağı)

- **Sosyal Akış:** Arkadaşların antrenman/protokol tamamlamalarının düştüğü feed.
- **Oyunlaştırma (Gamification):** Uygulamanın verdiği görevleri (örn: "1 saat derin çalışma yap") tamamlayanlar XP kazanacak ve seviye atlayacak.
- **Marketplace (Koçluk):** İleri düzey veya onaylı üyeler, diğer kullanıcılara uygulama üzerinden antrenman/beslenme programı satabilecek. Koçlar, müşterilerinin verilerini uygulama içinden canlı izleyebilecek.

## 3. Geliştirici Talimatları (Cursor İçin Kurallar)

1. **Geleceğe Hazır Ol (Scalability):** Veritabanı şemalarını (özellikle Users, Workouts, Templates, Community tablolarını) kurarken, ileride Koç-Öğrenci ilişkisi ve XP/Puan sistemi ekleneceğini hesaba katarak ilişkisel (relational) kur.
2. **Modüler Componentler:** UI parçalarını (Örn: Widget'lar, Workout Kartları) tekrar kullanılabilir (reusable) componentler halinde yaz.
3. **Kapsam Yönetimi:** Bir özelliği geliştirirken sana verdiğim adımlara odaklan, ancak sistemin geri kalanıyla nasıl entegre olacağını kod yorumlarında veya mimaride belirt.

Anlaşıldıysa, "Vizyonu anladım, mimariyi ve gelecekteki özellikleri not aldım." şeklinde yanıt ver ve roadmapi planla.
