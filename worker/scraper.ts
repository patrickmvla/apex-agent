import { load } from 'cheerio';

// --- Configuration ---
// These values will be read from your .dev.vars file when running locally,
// or from your Cloudflare secrets in production.
const PINECONE_API_KEY = process.env.PINECONE_API_KEY!;
const PINECONE_HOST = process.env.PINECONE_HOST!; // The full URL of your Pinecone index
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

if (!PINECONE_API_KEY || !PINECONE_HOST || !GEMINI_API_KEY) {
  throw new Error('Missing required environment variables. Please check your .dev.vars file.');
}

// --- Type Definitions ---
type GeminiEmbeddingResponse = {
  embedding: {
    values: number[];
  };
};

// --- Helper Functions ---

function chunkText(text: string): string[] {
  const paragraphs = text.split('\n\n');
  return paragraphs.map(p => p.trim()).filter(p => p.length > 50);
}

async function createEmbedding(text: string): Promise<number[]> {
  const embeddingUrl = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`;
  try {
    const response = await fetch(embeddingUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: "models/text-embedding-004", content: { parts: [{ text }] } }),
    });
    if (!response.ok) {
      throw new Error(`Failed to create embedding. Status: ${response.status}`);
    }
    const data = await response.json<GeminiEmbeddingResponse>();
    return data.embedding.values;
  } catch (error) {
    console.error("Error creating embedding:", error);
    throw error;
  }
}

async function scrapeAndChunkPage(pageName: string): Promise<string[]> {
    const targetUrl = `https://apexlegends.wiki.gg/wiki/${pageName}`;
    console.log(`-> Scraping detail page: ${targetUrl}`);
    try {
        const response = await fetch(targetUrl);
        if (!response.ok) {
          console.error(`Failed to fetch page ${pageName}. Status: ${response.status}`);
          return [];
        }
        const html = await response.text();
        const $ = load(html);
        const contentElement = $('#mw-content-text');
        contentElement.find('.toc, .mw-editsection, .navbox, .gallery').remove();
        const rawText = contentElement.text();
        const cleanedText = rawText.replace(/\n{3,}/g, '\n\n').trim();
        return chunkText(cleanedText);
    } catch (error) {
        console.error(`An error occurred while scraping ${pageName}:`, error);
        return [];
    }
}

async function getDetailLinks(indexPageName: string): Promise<string[]> {
    const url = `https://apexlegends.wiki.gg/wiki/${indexPageName}`;
    console.log(`\nDiscovering links on index page: ${url}`);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`Failed to fetch index page ${indexPageName}. Status: ${response.status}`);
            return [];
        }
        const html = await response.text();
        const $ = load(html);
        const links: string[] = [];
        let selector = '#mw-content-text .div-col a, #mw-content-text .wikitable a';
        if (indexPageName === 'Legends') {
            selector = '.character-grid .character-box-link';
        } else if (indexPageName === 'Weapons') {
            selector = '.wikitable.sortable tr td:first-child a';
        } else if (indexPageName === 'Cosmetics') {
            selector = '.wikitable tr td:first-child a';
        }
        $(selector).each((_i, el) => {
            const href = $(el).attr('href');
            if (href && href.startsWith('/wiki/') && !href.includes(':') && !href.includes('action=edit')) {
                const cleanedHref = href.split('#')[0];
                links.push(cleanedHref.replace('/wiki/', ''));
            }
        });
        const uniqueLinks = [...new Set(links)];
        console.log(`Found ${uniqueLinks.length} unique detail links on "${indexPageName}".`);
        return uniqueLinks;
    } catch (error) {
        console.error(`An error occurred while discovering links on ${indexPageName}:`, error);
        return [];
    }
}

// --- Main Ingestion Function ---
async function ingestData(): Promise<void> {
  console.log('Starting the full data ingestion process...');

  // 1. Scrape and Chunk Data
  const indexPages = ['Legends', 'Weapons', 'Seasons', 'Events', 'Cosmetics'];
  const directPages = ['Apex_Legends', 'Item', 'Maps', 'Game_modes', 'Lore'];
  let allChunks: string[] = [];
  let pagesToScrape: string[] = [...directPages];

  for (const pageName of indexPages) {
    const detailLinks = await getDetailLinks(pageName);
    pagesToScrape.push(...detailLinks);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  pagesToScrape = [...new Set(pagesToScrape)];
  console.log(`\nTotal unique pages to scrape: ${pagesToScrape.length}`);

  for (const pageName of pagesToScrape) {
    const pageChunks = await scrapeAndChunkPage(pageName);
    allChunks = allChunks.concat(pageChunks);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  console.log(`\nTotal chunks collected: ${allChunks.length}`);
  if (allChunks.length === 0) {
    console.log("No chunks found to process. Exiting.");
    return;
  }

  // 2. Create Embeddings and Upsert to Pinecone via REST API
  console.log('\nCreating embeddings and uploading to Pinecone...');
  const batchSize = 100;
  for (let i = 0; i < allChunks.length; i += batchSize) {
    const batch = allChunks.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(allChunks.length / batchSize)}...`);

    const vectors = await Promise.all(batch.map(async (chunk, index) => {
      const embedding = await createEmbedding(chunk);
      return {
        id: `chunk-${i + index}`,
        values: embedding,
        metadata: { text: chunk },
      };
    }));

    const upsertResponse = await fetch(`${PINECONE_HOST}/vectors/upsert`, {
        method: 'POST',
        headers: {
            'Api-Key': PINECONE_API_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ vectors })
    });

    if (!upsertResponse.ok) {
        console.error("Pinecone upsert error:", await upsertResponse.text());
    }
  }

  console.log('\n------------------------------------');
  console.log('Data ingestion process completed successfully!');
  console.log('------------------------------------');
}

ingestData();
