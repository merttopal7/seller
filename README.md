# 🛒 Classified Marketplace

Modern, full-stack ilan yönetim platformu. Türkiye odaklı, çok dilli lokasyon desteği ile geliştirilmiş gelişmiş sınıflı ilan sitesi.

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
- 📸 Sunucu taraflı görüntü sıkıştırma (Sharp → WebP)

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
| Multer + Sharp | — | Görüntü yükleme & sıkıştırma |
| bcryptjs | — | Şifre hashleme |
| jsonwebtoken | — | JWT kimlik doğrulama |
| Zod | v4 | Şema doğrulama |

### Frontend (`classified-marketplace`)
| Paket | Versiyon | Amaç |
|---|---|---|
| Next.js | v16 | React framework (App Router) |
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
| Let's Encrypt (Certbot) | Ücretsiz SSL sertifikası |

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
│   ├── uploads/                 # Yüklenen görseller (WebP)
│   └── Dockerfile
│
├── classified-marketplace/      # Next.js Frontend
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
├── docker-compose.prod.yml      # Production compose
├── nginx.conf                   # Nginx yapılandırması
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

### Yükleme
```
POST   /api/upload             # Görüntü yükle ve WebP'ye dönüştür (auth)
# Content-Type: multipart/form-data
# Field: file (image/jpeg, image/png, image/webp, image/gif)
# Max boyut: 5MB → Sharp ile 1200x900 WebP'ye sıkıştırılır
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

# Bağımlılıkları yükle
npm install

# .env dosyası oluştur
cp .env.example .env   # veya elle oluştur (aşağıya bakın)

# Veritabanı şeması uygula
npm run db:push

# Örnek verileri yükle
npm run db:seed

# Geliştirme sunucusunu başlat
npm run dev
# → http://localhost:5000
```

**`classified-backend/.env` örneği:**
```env
DATABASE_URL=file:./dev.db
JWT_SECRET=gizli-anahtar-buraya
PORT=5000
BACKEND_URL=http://localhost:5000
```

### 3. Frontend Kurulumu

```bash
cd classified-marketplace

# Bağımlılıkları yükle
npm install

# .env dosyası oluştur
cp .env.example .env.local   # veya elle oluştur

# Geliştirme sunucusunu başlat
npm run dev
# → http://localhost:3000
```

**`classified-marketplace/.env.local` örneği:**
```env
BACKEND_API_URL=http://localhost:5000
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=MarketPlace
JWT_SECRET=gizli-anahtar-buraya
```

> ⚠️ `JWT_SECRET` backend ve frontend'de **aynı** olmalıdır.

### 4. Elasticsearch (Opsiyonel)

Elasticsearch olmadan uygulama Prisma fallback ile çalışır, ancak tam metin arama sınırlı olur.

```bash
# Docker ile Elasticsearch başlat
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
| `BACKEND_URL` | ❌ | Yüklenen görsel URL'leri için public domain |
| `ELASTICSEARCH_URL` | ❌ | ES bağlantı URL'i (varsayılan: `http://localhost:9200`) |

### Frontend

| Değişken | Zorunlu | Açıklama |
|---|---|---|
| `BACKEND_API_URL` | ✅ | Server-side backend URL (Docker'da internal) |
| `NEXT_PUBLIC_BACKEND_URL` | ✅ | Client-side backend URL (public domain) |
| `NEXT_PUBLIC_APP_URL` | ✅ | Uygulamanın public URL'i |
| `NEXT_PUBLIC_APP_NAME` | ❌ | Site adı (varsayılan: `MarketPlace`) |
| `JWT_SECRET` | ✅ | Backend ile aynı JWT anahtarı |

---

## 🐳 Production Deployment

### Hızlı Başlangıç

```bash
# 1. Env dosyası oluştur
cp .env.production.example .env.production
nano .env.production   # Değerleri doldur

# 2. Tüm servisleri build et ve başlat
docker compose -f docker-compose.prod.yml up -d --build

# 3. Veritabanını tohumla (ilk çalıştırmada)
docker exec classified-backend node dist/index.js --seed
# veya
docker exec -it classified-backend sh -c "node --import tsx prisma/seed.ts"
```

### Servisler

| Servis | Port | Açıklama |
|---|---|---|
| `nginx` | 80, 443 | Reverse proxy & SSL |
| `frontend` | 3000 (internal) | Next.js standalone |
| `backend` | 5000 (internal) | Express.js API |
| `elasticsearch` | 9200 (internal) | Tam metin arama |

### SSL Sertifikası (Let's Encrypt)

```bash
# Certbot ile sertifika al
docker run --rm \
  -v certbot_conf:/etc/letsencrypt \
  -v certbot_www:/var/www/certbot \
  certbot/certbot certonly \
  --webroot -w /var/www/certbot \
  -d yourdomain.com \
  --email your@email.com \
  --agree-tos

# nginx.conf içindeki HTTPS bloğunu etkinleştir
# (yourdomain.com ile değiştirip `#` işaretlerini kaldır)

# Nginx'i yeniden başlat
docker compose -f docker-compose.prod.yml restart nginx
```

### Yüklenen Görseller

Görseller backend konteynerinde `/app/uploads/` dizinine kaydedilir ve `uploads_data` Docker volume'u ile kalıcı olarak saklanır. Nginx bu klasörü `/uploads/` path'i üzerinden serve eder.

```bash
# Görselleri yedekle
docker cp classified-backend:/app/uploads ./uploads-backup

# Volume boyutunu kontrol et
docker system df -v | grep uploads_data
```

---

## 🎛 Admin Paneli

Admin paneline erişim: `https://yourdomain.com/admin`

Seed verisi ile oluşturulan admin hesabı:
- **E-posta:** `yonetici@ornek.com`
- **Şifre:** `sifre123`

> ⚠️ Production'da bu bilgileri `prisma/seed.ts`'de değiştirin!

### Admin Özellikleri

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
npm start            # Production sunucusu
npm run db:push      # Şemayı DB'ye uygula
npm run db:seed      # Örnek veri yükle
npx prisma studio    # Prisma veritabanı GUI
```

### Frontend
```bash
npm run dev          # Geliştirme sunucusu
npm run build        # Production build
npm start            # Production sunucusu
npm run lint         # ESLint
```

---

## 📄 Lisans

MIT
