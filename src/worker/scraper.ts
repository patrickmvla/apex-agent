import { load } from "cheerio";
import { Pinecone } from "@pinecone-database/pinecone";

const PINECONE_API_KEY = process.env.PINECONE_API_KEY!;
const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME!;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

if (!PINECONE_API_KEY || !PINECONE_INDEX_NAME || !GEMINI_API_KEY) {
  throw new Error(
    "Missing required environment variables for Pinecone or Gemini."
  );
}

const pinecone = new Pinecone({ apiKey: PINECONE_API_KEY });
const pineconeIndex = pinecone.index(PINECONE_INDEX_NAME);

type GeminiEmbeddingResponse = {
  embedding: {
    values: number[];
  };
};

function chunkText(text: string): string[] {
  const paragraphs = text.split("\n\n");
  return paragraphs.map((p) => p.trim()).filter((p) => p.length > 50);
}

/**
 * Creates a vector embedding for a given text using Google's embedding model.
 * @param text The text to embed.
 * @returns A promise that resolves to the embedding vector (an array of numbers).
 */
async function createEmbedding(text: string): Promise<number[]> {
  const embeddingUrl = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`;

  try {
    const response = await fetch(embeddingUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: { parts: [{ text }] },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `Embedding API Error: ${response.status} ${response.statusText}`,
        errorBody
      );
      throw new Error(`Failed to create embedding. Status: ${response.status}`);
    }

    // Correctly type the response from the embedding API
    const data = await response.json<GeminiEmbeddingResponse>();
    return data.embedding.values;
  } catch (error) {
    console.error("Error creating embedding:", error);
    throw error;
  }
}

/**
 * Scrapes a single page from the Apex Legends wiki.
 */
async function scrapeAndChunkPage(pageName: string): Promise<string[]> {
  const targetUrl = `https://apexlegends.wiki.gg/wiki/${pageName}`;
  console.log(`-> Scraping detail page: ${targetUrl}`);
  try {
    const response = await fetch(targetUrl);
    if (!response.ok) {
      console.error(
        `Failed to fetch page ${pageName}. Status: ${response.status}`
      );
      return [];
    }
    const html = await response.text();
    const $ = load(html);
    const contentElement = $("#mw-content-text");
    contentElement.find(".toc, .mw-editsection, .navbox, .gallery").remove();
    const rawText = contentElement.text();
    const cleanedText = rawText.replace(/\n{3,}/g, "\n\n").trim();
    return chunkText(cleanedText);
  } catch (error) {
    console.error(`An error occurred while scraping ${pageName}:`, error);
    return [];
  }
}

/**
 * Visits an index page and extracts all the links to detail pages.
 */
async function getDetailLinks(indexPageName: string): Promise<string[]> {
  const url = `https://apexlegends.wiki.gg/wiki/${indexPageName}`;
  console.log(`\nDiscovering links on index page: ${url}`);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(
        `Failed to fetch index page ${indexPageName}. Status: ${response.status}`
      );
      return [];
    }
    const html = await response.text();
    const $ = load(html);
    const links: string[] = [];
    let selector = "#mw-content-text .div-col a, #mw-content-text .wikitable a";
    if (indexPageName === "Legends") {
      selector = ".character-grid .character-box-link";
    } else if (indexPageName === "Weapons") {
      selector = ".wikitable.sortable tr td:first-child a";
    } else if (indexPageName === "Cosmetics") {
      selector = ".wikitable tr td:first-child a";
    }
    $(selector).each((_i, el) => {
      const href = $(el).attr("href");
      if (
        href &&
        href.startsWith("/wiki/") &&
        !href.includes(":") &&
        !href.includes("action=edit")
      ) {
        const cleanedHref = href.split("#")[0];
        links.push(cleanedHref.replace("/wiki/", ""));
      }
    });
    const uniqueLinks = [...new Set(links)];
    console.log(
      `Found ${uniqueLinks.length} unique detail links on "${indexPageName}".`
    );
    return uniqueLinks;
  } catch (error) {
    console.error(
      `An error occurred while discovering links on ${indexPageName}:`,
      error
    );
    return [];
  }
}

async function ingestData(): Promise<void> {
  console.log("Starting the full data ingestion process...");

  // 1. Scrape and Chunk Data
  const indexPages = ["Legends", "Weapons", "Seasons", "Events", "Cosmetics"];
  const directPages = ["Apex_Legends", "Item", "Maps", "Game_modes", "Lore"];
  let allChunks: string[] = [];
  let pagesToScrape: string[] = [...directPages];

  for (const pageName of indexPages) {
    const detailLinks = await getDetailLinks(pageName);
    pagesToScrape.push(...detailLinks);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  pagesToScrape = [...new Set(pagesToScrape)];
  console.log(`\nTotal unique pages to scrape: ${pagesToScrape.length}`);

  for (const pageName of pagesToScrape) {
    const pageChunks = await scrapeAndChunkPage(pageName);
    allChunks = allChunks.concat(pageChunks);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  console.log(`\nTotal chunks collected: ${allChunks.length}`);

  // 2. Create Embeddings and Upsert to Pinecone
  console.log("\nCreating embeddings and uploading to Pinecone...");
  // We process in batches to avoid overwhelming the APIs
  const batchSize = 100;
  for (let i = 0; i < allChunks.length; i += batchSize) {
    const batch = allChunks.slice(i, i + batchSize);
    console.log(`Processing batch ${i / batchSize + 1}...`);

    const vectors = await Promise.all(
      batch.map(async (chunk, index) => {
        const embedding = await createEmbedding(chunk);
        return {
          id: `chunk-${i + index}`,
          values: embedding,
          metadata: { text: chunk },
        };
      })
    );

    await pineconeIndex.upsert(vectors);
  }

  console.log("\n------------------------------------");
  console.log("Data ingestion process completed successfully!");
  console.log("Your knowledge base is now ready.");
  console.log("------------------------------------");
}

ingestData();
