import { Client } from "@elastic/elasticsearch";

export const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || "http://localhost:9200",
});

export const ADS_INDEX = "ads";

export async function ensureAdsIndex(): Promise<void> {
  const exists = await esClient.indices.exists({ index: ADS_INDEX });
  if (exists) return;

  await esClient.indices.create({
    index: ADS_INDEX,
    mappings: {
      properties: {
        id:          { type: "keyword" },
        title:       { type: "text", analyzer: "standard", fields: { keyword: { type: "keyword" } } },
        description: { type: "text", analyzer: "standard" },
        price:       { type: "double" },
        currency:    { type: "keyword" },
        city:        { type: "keyword" },
        state:       { type: "keyword" },
        country:     { type: "keyword" },
        location:    { type: "text", fields: { keyword: { type: "keyword" } } },
        categoryId:  { type: "keyword" },
        categorySlug:{ type: "keyword" },
        userId:      { type: "keyword" },
        status:      { type: "keyword" },
        isFeatured:  { type: "boolean" },
        customValues:{ type: "flattened" },
        createdAt:   { type: "date" },
        views:       { type: "integer" },
      },
    },
  });

  console.log(`✅ Elasticsearch index "${ADS_INDEX}" created`);
}
