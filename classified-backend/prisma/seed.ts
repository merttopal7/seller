import "dotenv/config";
import { PrismaClient, Role, AdStatus, UserStatus } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";

const databaseUrl = process.env.DATABASE_URL || "file:./dev.db";
const adapter = new PrismaLibSql({ url: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Veritabanı tohumlanıyor...");

  // Mevcut tabloları temizle
  await prisma.favorite.deleteMany();
  await prisma.image.deleteMany();
  await prisma.ad.deleteMany();
  await prisma.category.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.neighborhood.deleteMany();
  await prisma.city.deleteMany();
  await prisma.state.deleteMany();
  await prisma.country.deleteMany();

  // Kullanıcılar oluştur
  const hashedPassword = await bcrypt.hash("sifre123", 12);

  const admin = await prisma.user.create({
    data: {
      name: "Süper Yönetici",
      email: "yonetici@ornek.com",
      password: hashedPassword,
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      phone: "+90 (312) 999-8888",
    },
  });

  const satici1 = await prisma.user.create({
    data: {
      name: "Ahmet Yılmaz",
      email: "ahmet@ornek.com",
      password: hashedPassword,
      role: Role.USER,
      status: UserStatus.ACTIVE,
      phone: "+90 (532) 123-4567",
    },
  });

  const satici2 = await prisma.user.create({
    data: {
      name: "Ayşe Kaya",
      email: "ayse@ornek.com",
      password: hashedPassword,
      role: Role.USER,
      status: UserStatus.ACTIVE,
      phone: "+90 (533) 765-4321",
    },
  });

  console.log("Kullanıcılar başarıyla oluşturuldu");

  // Konumları oluştur
  console.log("Ülkeler ve konumlar tohumlanıyor...");
  await prisma.country.create({
    data: {
      name: "Türkiye",
      states: {
        create: [
          {
            name: "İstanbul",
            cities: {
              create: [
                {
                  name: "İstanbul",
                  neighborhoods: {
                    create: [
                      { name: "Kadıköy" },
                      { name: "Beşiktaş" },
                      { name: "Şişli" },
                      { name: "Üsküdar" },
                      { name: "Beyoğlu" },
                    ],
                  },
                },
              ],
            },
          },
          {
            name: "Ankara",
            cities: {
              create: [
                {
                  name: "Ankara",
                  neighborhoods: {
                    create: [
                      { name: "Çankaya" },
                      { name: "Kızılay" },
                      { name: "Bahçelievler" },
                      { name: "Keçiören" },
                    ],
                  },
                },
              ],
            },
          },
          {
            name: "İzmir",
            cities: {
              create: [
                {
                  name: "İzmir",
                  neighborhoods: {
                    create: [
                      { name: "Alsancak" },
                      { name: "Bornova" },
                      { name: "Karşıyaka" },
                    ],
                  },
                },
              ],
            },
          },
          {
            name: "Hatay",
            cities: {
              create: [
                {
                  name: "Antakya",
                  neighborhoods: {
                    create: [
                      { name: "Haraparası" },
                      { name: "Saraykent" },
                    ],
                  },
                },
              ],
            },
          },
          {
            name: "Bursa",
            cities: {
              create: [
                {
                  name: "Bursa",
                  neighborhoods: {
                    create: [
                      { name: "Osmangazi" },
                      { name: "Nilüfer" },
                      { name: "Yıldırım" },
                    ],
                  },
                },
              ],
            },
          },
          {
            name: "Antalya",
            cities: {
              create: [
                {
                  name: "Antalya",
                  neighborhoods: {
                    create: [
                      { name: "Lara" },
                      { name: "Kepez" },
                      { name: "Muratpaşa" },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.country.create({
    data: {
      name: "Almanya",
      states: {
        create: [
          {
            name: "Bavyera",
            cities: {
              create: [
                {
                  name: "Münih",
                  neighborhoods: {
                    create: [
                      { name: "Schwabing" },
                      { name: "Maxvorstadt" },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.country.create({
    data: {
      name: "Hollanda",
      states: {
        create: [
          {
            name: "Kuzey Hollanda",
            cities: {
              create: [
                {
                  name: "Amsterdam",
                  neighborhoods: {
                    create: [
                      { name: "Centrum" },
                      { name: "Jordaan" },
                      { name: "De Pijp" },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log("Ülkeler, şehirler ve mahalleler başarıyla tohumlandı");

  // ── Kategoriler ──────────────────────────────────────────────────────────────
  // Her ana kategori kendi alt ağacıyla birlikte oluşturuluyor.
  // İlan atamalarında en derin (yaprak) kategori ID'si kullanılıyor.
  console.log("Kategoriler tohumlanıyor...");

  // Tüm oluşturulan kategorileri slug → id haritasında tutuyoruz
  const katMap: Record<string, string> = {};

  // Yardımcı: kategori oluştur ve haritaya ekle
  async function katOlustur(data: {
    name: string;
    slug: string;
    icon: string;
    description: string;
    parentId?: string;
  }) {
    const kat = await prisma.category.create({ data });
    katMap[data.slug] = kat.id;
    return kat;
  }

  // ── 1. VASITA ─────────────────────────────────────────────────────────────
  //   Vasıta → Otomobil → Volkswagen → Passat → 1.6 TDI
  await katOlustur({ name: "Vasıta",      slug: "vasita",               icon: "car",          description: "Otomobil, motorsiklet, kamyon, yedek parça" });
  await katOlustur({ name: "Otomobil",    slug: "vasita-otomobil",       icon: "car",          description: "Binek otomobiller",                          parentId: katMap["vasita"] });
  await katOlustur({ name: "Volkswagen",  slug: "vasita-vw",             icon: "car",          description: "Volkswagen marka araçlar",                   parentId: katMap["vasita-otomobil"] });
  await katOlustur({ name: "Passat",      slug: "vasita-vw-passat",      icon: "car",          description: "Volkswagen Passat modelleri",                parentId: katMap["vasita-vw"] });
  await katOlustur({ name: "1.6 TDI",    slug: "vasita-vw-passat-16tdi", icon: "car",         description: "Passat 1.6 TDI dizel versiyonlar",           parentId: katMap["vasita-vw-passat"] });

  // Diğer vasıta alt kategorileri
  await katOlustur({ name: "Motorsiklet", slug: "vasita-motorsiklet",    icon: "bike",         description: "Her türlü motorsiklet",                      parentId: katMap["vasita"] });
  await katOlustur({ name: "Kamyon & Ticari", slug: "vasita-kamyon",     icon: "truck",        description: "Ticari araçlar ve kamyonlar",                parentId: katMap["vasita"] });

  // ── 2. EMLAK ──────────────────────────────────────────────────────────────
  //   Emlak → Konut → Kiralık → 3+1 Daire
  await katOlustur({ name: "Emlak",       slug: "emlak",                 icon: "home",         description: "Daire, ev, ticari, arsa" });
  await katOlustur({ name: "Konut",       slug: "emlak-konut",           icon: "home",         description: "Daire ve müstakil evler",                    parentId: katMap["emlak"] });
  await katOlustur({ name: "Kiralık",     slug: "emlak-konut-kiralik",   icon: "key",          description: "Kiralık konutlar",                           parentId: katMap["emlak-konut"] });
  await katOlustur({ name: "3+1 Daire",  slug: "emlak-konut-kiralik-3p1",icon: "layout",      description: "3 oda 1 salon daireler",                     parentId: katMap["emlak-konut-kiralik"] });

  // Diğer emlak alt kategorileri
  await katOlustur({ name: "Satılık",     slug: "emlak-konut-satilik",   icon: "tag",          description: "Satılık konutlar",                           parentId: katMap["emlak-konut"] });
  await katOlustur({ name: "Ticari",      slug: "emlak-ticari",          icon: "briefcase",    description: "Ofis, dükkan, depo",                         parentId: katMap["emlak"] });
  await katOlustur({ name: "Arsa & Tarla",slug: "emlak-arsa",            icon: "map",          description: "Arsa ve tarla ilanları",                     parentId: katMap["emlak"] });

  // ── 3. ELEKTRONİK ─────────────────────────────────────────────────────────
  //   Elektronik → Telefon → Samsung → Galaxy S → S24 Ultra
  await katOlustur({ name: "Elektronik",  slug: "elektronik",            icon: "smartphone",   description: "Telefon, bilgisayar, ses sistemleri, oyun" });
  await katOlustur({ name: "Telefon",     slug: "elektronik-telefon",    icon: "smartphone",   description: "Cep telefonu ve aksesuarları",               parentId: katMap["elektronik"] });
  await katOlustur({ name: "Samsung",     slug: "elektronik-samsung",    icon: "smartphone",   description: "Samsung marka telefonlar",                   parentId: katMap["elektronik-telefon"] });
  await katOlustur({ name: "Galaxy S",    slug: "elektronik-samsung-s",  icon: "smartphone",   description: "Samsung Galaxy S serisi",                    parentId: katMap["elektronik-samsung"] });
  await katOlustur({ name: "S24 Ultra",   slug: "elektronik-samsung-s24ultra", icon: "smartphone", description: "Samsung Galaxy S24 Ultra",              parentId: katMap["elektronik-samsung-s"] });

  // Diğer elektronik alt kategorileri
  await katOlustur({ name: "Bilgisayar",  slug: "elektronik-bilgisayar", icon: "monitor",      description: "Dizüstü, masaüstü, tablet",                  parentId: katMap["elektronik"] });
  await katOlustur({ name: "Ses & Görüntü",slug: "elektronik-ses",       icon: "headphones",   description: "TV, hoparlör, kulaklık",                     parentId: katMap["elektronik"] });

  // ── 4. MODA & GÜZELLİK ───────────────────────────────────────────────────
  await katOlustur({ name: "Moda & Güzellik", slug: "moda",              icon: "shirt",        description: "Giyim, ayakkabı, aksesuar, kozmetik" });
  await katOlustur({ name: "Kadın Giyim", slug: "moda-kadin",            icon: "shirt",        description: "Kadın giyim ve aksesuarları",                parentId: katMap["moda"] });
  await katOlustur({ name: "Erkek Giyim", slug: "moda-erkek",            icon: "shirt",        description: "Erkek giyim ve aksesuarları",                parentId: katMap["moda"] });
  await katOlustur({ name: "Ayakkabı",    slug: "moda-ayakkabi",         icon: "footprints",   description: "Her türlü ayakkabı",                         parentId: katMap["moda"] });
  await katOlustur({ name: "Kozmetik",    slug: "moda-kozmetik",         icon: "sparkles",     description: "Makyaj ve cilt bakım ürünleri",              parentId: katMap["moda"] });

  // ── 5. EV & BAHÇE ─────────────────────────────────────────────────────────
  //   Ev & Bahçe → Mobilya → Koltuk & Kanepe → Chester Koltuk
  await katOlustur({ name: "Ev & Bahçe",  slug: "ev-bahce",              icon: "sofa",         description: "Mobilya, beyaz eşya, dekorasyon, el aletleri" });
  await katOlustur({ name: "Mobilya",     slug: "ev-mobilya",            icon: "sofa",         description: "Her türlü ev mobilyası",                     parentId: katMap["ev-bahce"] });
  await katOlustur({ name: "Koltuk & Kanepe", slug: "ev-mobilya-koltuk", icon: "sofa",        description: "Oturma grubu ve kanepeler",                  parentId: katMap["ev-mobilya"] });
  await katOlustur({ name: "Chester Koltuk", slug: "ev-mobilya-koltuk-chester", icon: "sofa", description: "Chester model koltuk takımları",             parentId: katMap["ev-mobilya-koltuk"] });

  // Diğer ev & bahçe alt kategorileri
  await katOlustur({ name: "Beyaz Eşya",  slug: "ev-beyaz-esya",         icon: "refrigerator", description: "Buzdolabı, çamaşır makinesi vb.",            parentId: katMap["ev-bahce"] });
  await katOlustur({ name: "Dekorasyon",  slug: "ev-dekorasyon",         icon: "lamp",         description: "Aydınlatma, tablo, aksesuar",                parentId: katMap["ev-bahce"] });
  await katOlustur({ name: "Bahçe",       slug: "ev-bahce-dis",          icon: "tree",         description: "Bahçe mobilyası ve ekipmanları",             parentId: katMap["ev-bahce"] });

  // ── 6. İŞ & HİZMET ───────────────────────────────────────────────────────
  await katOlustur({ name: "İş & Hizmet", slug: "is-hizmet",             icon: "briefcase",    description: "İş ilanları, hizmet al, danışmanlık" });
  await katOlustur({ name: "İş İlanları", slug: "is-ilanlar",            icon: "newspaper",    description: "Tam ve yarı zamanlı iş fırsatları",          parentId: katMap["is-hizmet"] });
  await katOlustur({ name: "Hizmet Ver",  slug: "is-hizmet-ver",         icon: "wrench",       description: "Usta, tamirci, nakliye hizmetleri",          parentId: katMap["is-hizmet"] });
  await katOlustur({ name: "Danışmanlık", slug: "is-danismanlik",        icon: "lightbulb",    description: "Hukuk, finans, IT danışmanlığı",             parentId: katMap["is-hizmet"] });

  // ── 7. KİTAP, SPOR & HOBİ ────────────────────────────────────────────────
  //   Spor & Hobi → Bisiklet → Yol Bisikleti → Karbon Çerçeve
  await katOlustur({ name: "Kitap, Spor & Hobi", slug: "spor-hobi",      icon: "dumbbell",     description: "Spor aletleri, kitap, bisiklet, koleksiyon" });
  await katOlustur({ name: "Bisiklet",    slug: "spor-bisiklet",         icon: "bike",         description: "Her türlü bisiklet",                         parentId: katMap["spor-hobi"] });
  await katOlustur({ name: "Yol Bisikleti", slug: "spor-bisiklet-yol",   icon: "bike",         description: "Yarış ve yol bisikletleri",                  parentId: katMap["spor-bisiklet"] });
  await katOlustur({ name: "Karbon Çerçeve", slug: "spor-bisiklet-yol-karbon", icon: "bike",  description: "Karbon çerçeveli yol bisikletleri",           parentId: katMap["spor-bisiklet-yol"] });

  // Diğer spor & hobi alt kategorileri
  await katOlustur({ name: "Spor Aletleri", slug: "spor-aletler",        icon: "dumbbell",     description: "Fitness ve gym ekipmanları",                 parentId: katMap["spor-hobi"] });
  await katOlustur({ name: "Kitap & Müzik", slug: "spor-kitap",          icon: "book",         description: "İkinci el kitap, plak ve CD",                parentId: katMap["spor-hobi"] });
  await katOlustur({ name: "Koleksiyon",   slug: "spor-koleksiyon",      icon: "star",         description: "Pul, para, antika koleksiyonlar",            parentId: katMap["spor-hobi"] });

  console.log("Kategoriler başarıyla oluşturuldu");

  // Slug'a göre en derin yaprak kategori ID'sini döndür
  const getKatId = (slug: string): string => {
    if (!katMap[slug]) throw new Error(`Kategori bulunamadı: ${slug}`);
    return katMap[slug];
  };

  // Örnek ilan verileri
  const ilanlarData = [
    {
      title: "2020 Volkswagen Passat 1.6 TDI Elegance DSG",
      description:
        "Tek sahibinden, hasarsız, muayeneli araç. Otomatik şanzıman, kruz kontrol, şerit takip sistemi mevcut. Sedef beyaz renk, siyah deri iç döşeme. 78.000 km. Daima kapalı garajda muhafaza edilmiş, temiz bakımlı.",
      price: 950000,
      currency: "TRY",
      location: "Kadıköy",
      city: "İstanbul",
      status: AdStatus.ACTIVE,
      isFeatured: true,
      categoryId: getKatId("vasita-vw-passat-16tdi"),
      userId: satici1.id,
      images: [
        "https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&auto=format&fit=crop&q=80",
      ],
    },
    {
      title: "Boğaz Manzaralı 3+1 Lüks Daire",
      description:
        "Beşiktaş merkezde eşsiz Boğaz manzaralı 3+1 daire. Modern mutfak donanımı, yerden ısıtma, akıllı ev sistemi, 7/24 güvenlikli site, kapalı otopark, yüzme havuzu ve fitness merkezi dahildir.",
      price: 25000,
      currency: "TRY",
      location: "Beşiktaş",
      city: "İstanbul",
      status: AdStatus.ACTIVE,
      isFeatured: true,
      categoryId: getKatId("emlak-konut-kiralik-3p1"),
      userId: satici2.id,
      images: [
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80",
      ],
    },
    {
      title: "Samsung Galaxy S24 Ultra 512GB Titanyum Siyah",
      description:
        "Sıfır ayarında, kutusu ve tüm aksesuarları tam. Her zaman kılıf ve ekran koruyucu ile kullanıldı. %100 pil sağlığı, Türkiye garantili. Faturası mevcuttur.",
      price: 42000,
      currency: "TRY",
      location: "Çankaya",
      city: "Ankara",
      status: AdStatus.ACTIVE,
      isFeatured: false,
      categoryId: getKatId("elektronik-samsung-s24ultra"),
      userId: satici1.id,
      images: [
        "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&auto=format&fit=crop&q=80",
      ],
    },
    {
      title: "İtalyan Kadife Chester Koltuk Takımı",
      description:
        "Neredeyse sıfır, koyu zümrüt yeşili İtalyan kadife Chester koltuk takımı. Son derece konforlu yüksek yoğunluklu süngeri ve sağlam ceviz ahşap ayakları mevcuttur. Ölçüler: 210 x 90 x 85 cm.",
      price: 18500,
      currency: "TRY",
      location: "Nilüfer",
      city: "Bursa",
      status: AdStatus.ACTIVE,
      isFeatured: false,
      categoryId: getKatId("ev-mobilya-koltuk-chester"),
      userId: satici2.id,
      images: [
        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&auto=format&fit=crop&q=80",
      ],
    },
    {
      title: "Trek Domane SL5 Karbon Yol Bisikleti",
      description:
        "Mat siyah renk, 54cm çerçeve. Shimano 105 vites grubu, Bontrager tekerlek seti, çift su şişesi tutacağı. İnanılmaz hızlı ve smooth sürüş deneyimi, yakın zamanda komple bakıma girmiştir.",
      price: 55000,
      currency: "TRY",
      location: "Karşıyaka",
      city: "İzmir",
      status: AdStatus.PENDING,
      isFeatured: false,
      categoryId: getKatId("spor-bisiklet-yol-karbon"),
      userId: satici1.id,
      images: [
        "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&auto=format&fit=crop&q=80",
      ],
    },
  ];

  for (const ilanItem of ilanlarData) {
    const { images, ...ilanCore } = ilanItem;
    const ilan = await prisma.ad.create({
      data: {
        ...ilanCore,
        images: {
          create: images.map((url, index) => ({
            url,
            order: index,
          })),
        },
      },
    });

    // Aktif ilanlara favori ekle
    if (ilanItem.status === AdStatus.ACTIVE) {
      await prisma.favorite.create({
        data: {
          userId: admin.id,
          adId: ilan.id,
        },
      });
    }
  }

  console.log("İlanlar başarıyla tohumlandı");
  console.log("Veritabanı tohumlama tamamlandı!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });