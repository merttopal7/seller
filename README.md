# 🛒 Classified Marketplace

Modern, full-stack ilan yönetim platformu. Türkiye odaklı, 4 kademeli konum hiyerarşisi ve gerçek zamanlı mesajlaşma ile geliştirilmiş sınıflı ilan sitesi.

---

## 📋 İçindekiler

- [Özellikler](#-özellikler)
- [Teknoloji Yığını](#-teknoloji-yığını)
- [Proje Yapısı](#-proje-yapısı)
- [Veri Modeli](#-veri-modeli)
- [API Referansı](#-api-referansı)
- [Yerel Kurulum](#-yerel-kurulum)
- [Ortam Değişkenleri](#-ortam-değişkenleri)
- [Production Deployment](#-production-deployment)
- [Admin Paneli](#-admin-paneli)
- [Komutlar Referansı](#-komutlar-referansı)

---

## ✨ Özellikler

### Kullanıcı Tarafı
- 🔐 JWT tabanlı kimlik doğrulama (kayıt / giriş / oturum)
- 📝 Adım adım ilan oluşturma (Kategori → Bilgiler → Fotoğraflar → Önizleme)
- 🗂 Taslak kaydetme — ilan formundan çıkınca otomatik saklanır
- 🔍 Elasticsearch destekli tam metin arama + Prisma fallback
- 📍 4 kademeli konum filtresi: Ülke → İl → İlçe → Mahalle
- 🗺 Leaflet harita entegrasyonu — ilan konumunu haritadan seçme
- ❤️ Favorilere ekleme / kaldırma
- 💬 Gerçek zamanlı mesajlaşma (Socket.IO)
- 📸 Sunucu taraflı görüntü sıkıştırma (Sharp → WebP, max 1200×900)

### Admin Paneli
- 👥 Kullanıcı yönetimi (listeleme, banlama, rol değiştirme)
- 🌳 Ağaç yapısında kategori yönetimi (sınırsız alt kategori derinliği)
- 🔧 Kategoriye özel özellik filtreleri (text, number, select)
- 🌍 4 kademeli konum hiyerarşisi yönetimi (CRUD)
- 📋 İlan moderasyonu (onay, red, öne çıkarma)
- 📊 Dashboard istatistikleri

---

## 🛠 Teknoloji Yığını

### Backend (`classified-backend`)
| Paket | Versiyon | Amaç |
|---|---|---|
| Express.js | v5 | REST API sunucusu |
| TypeScript | v6 | Tip güvenliği |
| Prisma ORM | v7 | Veritabanı erişimi |
| SQLite (libSQL) | — | Veritabanı |
| Elasticsearch | v8 | Tam metin arama |
| Socket.IO | v4 | Gerçek zamanlı mesajlaşma |
| Multer + Sharp | — | Görüntü yükleme & sıkıştırma (yerel depolama) |
| bcryptjs | — | Şifre hashleme |
| jsonwebtoken | — | JWT kimlik doğrulama |
| Zod | v4 | Şema doğrulama |

### Frontend (`classified-marketplace`)
| Paket | Versiyon | Amaç |
|---|---|---|
| Next.js | v16 | React framework (App Router, standalone) |
| React | v19 | UI kütüphanesi |
| TypeScript | v5 | Tip güvenliği |
| Tailwind CSS | v4 | Stil sistemi |
| Radix UI | — | Erişilebilir UI primitifleri |
| React Hook Form + Zod | — | Form yönetimi & doğrulama |
| TipTap | v3 | Zengin metin editörü |
| Leaflet + react-leaflet | — | Etkileşimli harita |
| Socket.IO Client | v4 | Gerçek zamanlı iletişim |
| Lucide React | — | İkon seti |

### Altyapı
| Araç | Amaç |
|---|---|
| Docker + Docker Compose | Konteynerleştirme |
| Nginx | Reverse proxy, SSL terminasyonu |

---

## 📁 Proje Yapısı

```
Burkina/
├── classified-backend/          # Express.js REST API
│   ├── prisma/
│   │   ├── schema.prisma        # Veritabanı şeması
│   │   └── seed.ts              # Örnek veri tohumlama
│   ├── src/
│   │   ├── index.ts             # Giriş noktası (Express + Socket.IO)
│   │   ├── lib/
│   │   │   ├── prisma.ts        # Prisma istemcisi
│   │   │   ├── elasticsearch.ts # ES bağlantısı & index yönetimi
│   │   │   └── search-service.ts# Arama servisi
│   │   ├── middleware/
│   │   │   └── auth.ts          # JWT doğrulama middleware
│   │   └── routes/
│   │       ├── auth.ts          # /api/auth
│   │       ├── ads.ts           # /api/ads
│   │       ├── categories.ts    # /api/categories
│   │       ├── locations.ts     # /api/locations
│   │       ├── messages.ts      # /api/messages
│   │       ├── upload.ts        # /api/upload
│   │       └── admin.ts         # /api/admin
│   ├── uploads/                 # Yüklenen görseller (WebP, Docker volume)
│   ├── entrypoint.sh            # DB migration + sunucu başlatma scripti
│   └── Dockerfile
│
├── classified-marketplace/      # Next.js Frontend (standalone output)
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx         # Ana sayfa
│   │   │   ├── listings/        # İlan arama & listeleme
│   │   │   ├── ads/
│   │   │   │   ├── create/      # İlan oluşturma (çok adımlı)
│   │   │   │   └── [id]/        # İlan detay & düzenleme
│   │   │   ├── auth/            # Giriş / kayıt sayfaları
│   │   │   ├── dashboard/       # Kullanıcı paneli
│   │   │   ├── messages/        # Mesajlaşma
│   │   │   ├── admin/           # Admin paneli
│   │   │   └── api/[...path]/   # Backend proxy route
│   │   ├── components/
│   │   │   ├── ads/             # İlan bileşenleri
│   │   │   ├── ui/              # Genel UI bileşenleri
│   │   │   ├── messages/        # Mesajlaşma bileşenleri
│   │   │   └── map-picker.tsx   # Leaflet harita seçici
│   │   └── lib/
│   │       ├── auth.ts          # Oturum yönetimi
│   │       ├── utils.ts         # Yardımcı fonksiyonlar
│   │       └── validations.ts   # Zod şemaları
│   └── Dockerfile
│
├── docker-compose.prod.yml      # Production compose (nginx hariç)
├── .env.production.example      # Ortam değişkenleri şablonu
├── .gitignore
└── README.md
```

---

## 🗄 Veri Modeli

```
User ──┬── Ad ──── Image
       │     └── Favorite
       │     └── Conversation ── Message
       └── Session

Category ──── Ad
Category ──── CustomFilter

Country ── State ── City ── Neighborhood
```

### Konum Hiyerarşisi
```
Türkiye
  └── Hatay (İl)
        └── Antakya (İlçe)
              └── Haraparası (Mahalle) [lat/lng opsiyonel]
```

### İlan Durumları
| Durum | Açıklama |
|---|---|
| `DRAFT` | Taslak (kullanıcı kaydetmedi) |
| `PENDING` | Yayımlandı, admin onayı bekleniyor |
| `ACTIVE` | Aktif, sitede görünür |
| `REJECTED` | Admin tarafından reddedildi |
| `SOLD` | Satıldı |
| `EXPIRED` | Süresi doldu |

---

## 📡 API Referansı

### Kimlik Doğrulama
```
POST   /api/auth/register     # Kayıt ol
POST   /api/auth/login        # Giriş yap
POST   /api/auth/logout       # Çıkış yap
GET    /api/auth/me           # Oturum bilgisi
```

### İlanlar
```
GET    /api/ads               # İlanları listele / ara
GET    /api/ads/:id           # İlan detayı
POST   /api/ads               # İlan oluştur (auth)
PUT    /api/ads/:id           # İlan güncelle (auth)
DELETE /api/ads/:id           # İlan sil (auth)
POST   /api/ads/:id/favorite  # Favoriye ekle/çıkar (auth)
```

#### Arama Parametreleri
| Parametre | Tip | Açıklama |
|---|---|---|
| `q` | string | Tam metin arama |
| `category` | string | Kategori slug'ı (tüm alt kategoriler dahil) |
| `country` | string | Ülke filtresi |
| `state` | string | İl filtresi |
| `city` | string | İlçe filtresi |
| `location` | string | Mahalle filtresi |
| `minPrice` | number | Minimum fiyat |
| `maxPrice` | number | Maksimum fiyat |
| `featured` | boolean | Sadece öne çıkan ilanlar |
| `sort` | string | `newest`, `price_asc`, `price_desc` |
| `page` | number | Sayfa numarası |
| `limit` | number | Sayfa başına sonuç (max: 24) |
| `cf_<ALAN>` | string | Özel kategori filtresi |
| `cf_<ALAN>_min` | number | Özel alan minimum değeri |
| `cf_<ALAN>_max` | number | Özel alan maksimum değeri |

### Konumlar
```
GET    /api/locations                          # Tüm hiyerarşi
POST   /api/locations/countries                # Ülke ekle (admin)
PUT    /api/locations/countries/:id            # Ülke düzenle (admin)
DELETE /api/locations/countries/:id            # Ülke sil (admin)
POST   /api/locations/states                   # İl ekle (admin)
PUT    /api/locations/states/:id               # İl düzenle (admin)
DELETE /api/locations/states/:id               # İl sil (admin)
POST   /api/locations/cities                   # İlçe ekle (admin)
PUT    /api/locations/cities/:id               # İlçe düzenle (admin)
DELETE /api/locations/cities/:id               # İlçe sil (admin)
POST   /api/locations/neighborhoods            # Mahalle ekle (admin)
PUT    /api/locations/neighborhoods/:id        # Mahalle düzenle (admin)
DELETE /api/locations/neighborhoods/:id        # Mahalle sil (admin)
```

### Kategoriler
```
GET    /api/categories         # Tüm kategoriler (ağaç)
GET    /api/categories/:slug   # Kategori detayı + filtreleri
POST   /api/categories         # Kategori oluştur (admin)
PUT    /api/categories/:id     # Kategori güncelle (admin)
DELETE /api/categories/:id     # Kategori sil (admin)
```

### Mesajlaşma
```
GET    /api/messages/conversations         # Konuşmalar
GET    /api/messages/conversations/:id     # Konuşma detayı
POST   /api/messages/conversations         # Yeni konuşma
```

#### Socket.IO Olayları
```
# İstemci → Sunucu
join_conversation(conversationId)
leave_conversation(conversationId)
send_message({ conversationId, content })
mark_read(conversationId)
typing_start(conversationId)
typing_stop(conversationId)

# Sunucu → İstemci
new_message(message)
conversation_updated({ conversationId })
messages_read({ conversationId, userId })
user_typing({ userId, name })
user_stopped_typing({ userId })
```

### Görüntü Yükleme
```
POST   /api/upload             # Görüntü yükle (auth gerekli)
# Content-Type: multipart/form-data, Field: file
# Desteklenen: jpeg, jpg, png, webp, gif  |  Max: 5MB
# Çıktı: 1200×900 WebP, /uploads/ dizinine kaydedilir
```

---

## 🚀 Yerel Kurulum

### Gereksinimler
- Node.js 20+
- npm 10+

### 1. Repo'yu Klonla

```bash
git clone <repo-url>
cd Burkina
```

### 2. Backend Kurulumu

```bash
cd classified-backend
npm install

# .env dosyası oluştur
cp .env.example .env
```

**`classified-backend/.env`:**
```env
DATABASE_URL=file:./dev.db
JWT_SECRET=gizli-anahtar-min-32-karakter
PORT=5000
BACKEND_URL=http://localhost:5000
```

```bash
npx prisma db push   # Tabloları oluştur
npm run db:seed      # Örnek veri yükle
npm run dev          # → http://localhost:5000
```

### 3. Frontend Kurulumu

```bash
cd classified-marketplace
npm install
```

**`classified-marketplace/.env.local`:**
```env
BACKEND_API_URL=http://localhost:5000
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=MarketPlace
JWT_SECRET=gizli-anahtar-min-32-karakter
```

> ⚠️ `JWT_SECRET` backend ve frontend'de **aynı** olmalıdır.

```bash
npm run dev   # → http://localhost:3000
```

### 4. Elasticsearch (Opsiyonel)

Elasticsearch olmadan uygulama Prisma fallback ile çalışır.

```bash
docker run -d \
  --name es-local \
  -p 9200:9200 \
  -e discovery.type=single-node \
  -e xpack.security.enabled=false \
  docker.elastic.co/elasticsearch/elasticsearch:8.13.4
```

---

## 🔐 Ortam Değişkenleri

### Backend

| Değişken | Zorunlu | Açıklama |
|---|---|---|
| `DATABASE_URL` | ✅ | SQLite yolu (`file:./dev.db`) |
| `JWT_SECRET` | ✅ | JWT imzalama anahtarı (min 32 karakter) |
| `PORT` | ❌ | Sunucu portu (varsayılan: `5000`) |
| `BACKEND_URL` | ❌ | Yüklenen görsel URL'leri için **public** domain |
| `ELASTICSEARCH_URL` | ❌ | ES bağlantı URL'i (varsayılan: `http://localhost:9200`) |

### Frontend

| Değişken | Zorunlu | Açıklama |
|---|---|---|
| `BACKEND_API_URL` | ✅ | Server-side backend URL (Docker içinde internal adres) |
| `NEXT_PUBLIC_BACKEND_URL` | ✅ | Client-side backend URL (tarayıcıdan erişilen public domain) |
| `NEXT_PUBLIC_APP_URL` | ✅ | Uygulamanın public URL'i |
| `NEXT_PUBLIC_APP_NAME` | ❌ | Site adı (varsayılan: `MarketPlace`) |
| `JWT_SECRET` | ✅ | Backend ile **aynı** JWT anahtarı |

---

## 🐳 Production Deployment

Bu proje harici bir nginx reverse proxy arkasında çalışacak şekilde yapılandırılmıştır.
Docker Compose dosyasında nginx servisi **yoktur** — kendi nginx'inizi kullanın.

### Port Atamaları (önerilen)

| Servis | Host Port | Container Port |
|---|---|---|
| Backend (Express) | `127.0.0.1:5155` | `5000` |
| Frontend (Next.js) | `127.0.0.1:3155` | `3000` |
| Elasticsearch | internal only | `9200` |

### 1. Env Dosyasını Oluştur

```bash
cp .env.production.example .env.production
nano .env.production
```

```env
JWT_SECRET=<openssl rand -base64 48 ile üret>
NEXTAUTH_SECRET=<openssl rand -base64 48 ile üret>

NEXT_PUBLIC_APP_URL=https://market.temirshield.com
NEXTAUTH_URL=https://market.temirshield.com
NEXT_PUBLIC_BACKEND_URL=https://market.temirshield.com

NEXT_PUBLIC_APP_NAME=Market
```

> **`NEXT_PUBLIC_BACKEND_URL` neden domain?**
> Backend `5155` portunda, frontend `3155` portunda çalışır.
> Nginx her iki portu da tek domain altında toplar.
> Tarayıcı `/api/...` isteği atarken domain üzerinden gider, nginx backend'e yönlendirir.

### 2. Servisleri Build Et ve Başlat

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Container başladığında `entrypoint.sh` otomatik olarak `prisma db push` çalıştırır —
**tablolar otomatik oluşturulur**, elle müdahale gerekmez.

### 3. Seed'i Bir Kere Çalıştır (İlk Kurulumda)

```bash
docker exec -it classified-backend npx prisma db seed
```

> ⚠️ `docker exec classified-backend node dist/index.js --seed` **yanlış** komuttur —
> sunucuyu yeniden başlatmaya çalışır ve port çakışması verir. Doğrusu `npx prisma db seed`.

### 4. Nginx Yapılandırması

Nginx config dosyanıza aşağıdaki server bloğunu ekleyin:

```nginx
server {
    listen 443 ssl;
    http2 on;
    server_name market.temirshield.com;
    client_max_body_size 50M;

    ssl_certificate     /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;

    # Yüklenen görseller → Backend
    location /uploads/ {
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto https;
        proxy_pass http://host.docker.internal:5155;
    }

    # REST API → Backend
    location /api/ {
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto https;
        proxy_read_timeout 60s;
        proxy_pass http://host.docker.internal:5155;
    }

    # Socket.IO → Backend (WebSocket zorunlu)
    location /socket.io/ {
        proxy_http_version 1.1;
        proxy_set_header Upgrade    $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto https;
        proxy_read_timeout 86400s;
        proxy_pass http://host.docker.internal:5155;
    }

    # Her şey → Next.js Frontend
    location / {
        proxy_http_version 1.1;
        proxy_set_header Upgrade    $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto https;
        proxy_read_timeout 3600s;
        proxy_pass http://host.docker.internal:3155;
    }
}
```

```bash
nginx -t && nginx -s reload
```

### Görsel Yedekleme

```bash
# Tüm görselleri yedekle
docker cp classified-backend:/app/uploads ./uploads-backup

# Volume boyutunu kontrol et
docker system df -v | grep uploads_data
```

---

## 🎛 Admin Paneli

Admin paneline erişim: `https://market.temirshield.com/admin`

Seed verisi ile oluşturulan admin hesabı:
- **E-posta:** `yonetici@ornek.com`
- **Şifre:** `sifre123`

> ⚠️ **Production'dan önce** bu bilgileri `prisma/seed.ts`'de değiştirin!

### Admin Sayfaları

| Sayfa | URL | Açıklama |
|---|---|---|
| Dashboard | `/admin` | İstatistikler |
| İlanlar | `/admin/ads` | Moderasyon |
| Kullanıcılar | `/admin/users` | Kullanıcı yönetimi |
| Kategoriler | `/admin/categories` | Ağaç yapısı CRUD |
| Konumlar | `/admin/locations` | 4 kademeli hiyerarşi |

---

## 📜 Komutlar Referansı

### Backend
```bash
npm run dev          # Geliştirme sunucusu (nodemon + tsx)
npm run build        # TypeScript derle → dist/
npm start            # Production sunucusu (entrypoint.sh kullanın)
npm run db:push      # Şemayı DB'ye uygula (tablo oluştur/güncelle)
npm run db:seed      # Örnek veri yükle
npx prisma studio    # Prisma veritabanı GUI
```

### Frontend
```bash
npm run dev          # Geliştirme sunucusu
npm run build        # Production build (standalone)
npm start            # Production sunucusu
npm run lint         # ESLint
```

### Docker
```bash
# Tüm servisleri başlat
docker compose -f docker-compose.prod.yml up -d --build

# Sadece backend'i yeniden build et
docker compose -f docker-compose.prod.yml up -d --build backend

# Logları izle
docker logs classified-backend -f
docker logs classified-frontend -f

# Seed çalıştır (ilk kurulumda)
docker exec -it classified-backend npx prisma db seed

# Container'a gir
docker exec -it classified-backend sh

# Tüm servisleri durdur
docker compose -f docker-compose.prod.yml down
```

---

## 📄 Lisans

MIT
