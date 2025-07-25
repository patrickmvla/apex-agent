import { load, CheerioAPI } from "cheerio";
import type { Element } from "domhandler";

const PINECONE_API_KEY = process.env.PINECONE_API_KEY!;
const PINECONE_HOST = process.env.PINECONE_HOST!;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

if (!PINECONE_API_KEY || !PINECONE_HOST || !GEMINI_API_KEY) {
  throw new Error(
    "Missing required environment variables. Please check your .dev.vars file."
  );
}

type GeminiEmbeddingResponse = {
  embedding: {
    values: number[];
  };
};

type Chunk = {
  content: string;
  metadata: {
    source: string;
    pageTitle: string;
    sectionTitle: string;
  };
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  initialDelay = 1000
): Promise<Response> {
  let lastError: Error | null = null;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.status === 429) {
        const delay = initialDelay * Math.pow(2, i);
        console.warn(
          `Rate limit exceeded. Retrying in ${delay}ms... (Attempt ${
            i + 1
          }/${retries})`
        );
        await sleep(delay);
        lastError = new Error(`API rate limited after ${retries} retries.`);
        continue;
      }
      return response;
    } catch (error) {
      lastError = error as Error;
      await sleep(initialDelay * Math.pow(2, i));
    }
  }
  throw (
    lastError || new Error("An unknown error occurred during fetch with retry.")
  );
}

async function createEmbedding(text: string): Promise<number[]> {
  const embeddingUrl = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${GEMINI_API_KEY}`;

  const response = await fetchWithRetry(embeddingUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "models/text-embedding-004",
      content: { parts: [{ text }] },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to create embedding. Status: ${response.status}, Body: ${errorText}`
    );
  }
  const data = await response.json<GeminiEmbeddingResponse>();
  return data.embedding.values;
}

function processTable($: CheerioAPI, element: Element): string {
  const rows: string[] = [];
  $(element)
    .find("tr")
    .each((_i, row) => {
      const headers = $(row)
        .find("th")
        .map((_j, th) => $(th).text().trim())
        .get();
      const cells = $(row)
        .find("td")
        .map((_j, td) => $(td).text().trim())
        .get();

      if (headers.length === 1 && cells.length === 1) {
        rows.push(`${headers[0]}: ${cells[0]}`);
        return;
      }

      if (headers.length > 0) {
        rows.push(`| ${headers.join(" | ")} |`);
        rows.push(`| ${headers.map(() => "---").join(" | ")} |`);
      }
      if (cells.length > 0) {
        rows.push(`| ${cells.join(" | ")} |`);
      }
    });
  return rows.join("\n");
}

function processList($: CheerioAPI, element: Element, level = 0): string {
  const items: string[] = [];
  const indent = "  ".repeat(level);
  $(element)
    .children("li")
    .each((_i, li) => {
      const liText = $(li)
        .clone()
        .children("ul, ol")
        .remove()
        .end()
        .text()
        .trim();
      if (liText) {
        items.push(`${indent}- ${liText}`);
      }
      $(li)
        .children("ul, ol")
        .each((_j, sublist) => {
          items.push(processList($, sublist, level + 1));
        });
    });
  return items.join("\n");
}

function extractInfoboxData(
  $: CheerioAPI,
  pageTitle: string,
  sourceUrl: string
): Chunk | null {
  const infobox = $(".infobox");
  if (infobox.length === 0) return null;

  const extracted = infobox.extract({
    rows: [
      {
        selector: "tr",
        value: {
          label: "th",
          value: "td",
        },
      },
    ],
  });

  const data = extracted.rows
    .map((row) => {
      if (row.label && row.value) {
        return `- ${row.label}: ${row.value}`;
      }
      return null;
    })
    .filter((item): item is string => item !== null);

  if (data.length === 0) return null;

  const content = `Key information for ${pageTitle}:\n${data.join("\n")}`;

  return {
    content,
    metadata: {
      source: sourceUrl,
      pageTitle: pageTitle,
      sectionTitle: "Infobox Summary",
    },
  };
}

async function scrapeAndChunkPage(pageName: string): Promise<Chunk[]> {
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

    const pageTitle = $("h1#firstHeading").text().trim();
    const chunks: Chunk[] = [];

    const infoboxChunk = extractInfoboxData($, pageTitle, targetUrl);
    if (infoboxChunk) {
      chunks.push(infoboxChunk);
    }

    const contentElement = $("#mw-content-text");
    contentElement
      .find(
        ".infobox, .toc, .mw-editsection, .navbox, .gallery, .nomobile, .notheme"
      )
      .remove();

    let currentSectionTitle = "Introduction";
    contentElement.find("h2, h3, p, ul, table").each((_i, element) => {
      const el = $(element);

      if (el.is("h2, h3")) {
        currentSectionTitle =
          el.find(".mw-headline").text().trim() || "Untitled Section";
        return;
      }

      let content = "";
      if (el.is("p")) {
        content = el.text().trim();
      } else if (el.is("ul")) {
        content = processList($, element);
      } else if (el.is("table.wikitable")) {
        content = processTable($, element);
      }

      if (content && content.length > 50) {
        chunks.push({
          content,
          metadata: {
            source: targetUrl,
            pageTitle: pageTitle,
            sectionTitle: currentSectionTitle,
          },
        });
      }
    });

    return chunks;
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

  const indexPages = ["Legends", "Weapons", "Seasons", "Events", "Cosmetics"];
  const directPages = ["Apex_Legends", "Item", "Maps", "Game_modes", "Lore"];
  let allChunks: Chunk[] = [];
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
  if (allChunks.length === 0) {
    console.log("No chunks found to process. Exiting.");
    return;
  }

  console.log("\nCreating embeddings and uploading to Pinecone...");
  const batchSize = 100;
  for (let i = 0; i < allChunks.length; i += batchSize) {
    const batch = allChunks.slice(i, i + batchSize);
    console.log(
      `Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(
        allChunks.length / batchSize
      )}...`
    );

    const vectors = await Promise.all(
      batch.map(async (chunk, index) => {
        const embedding = await createEmbedding(chunk.content);
        return {
          id: `chunk-${i + index}`,
          values: embedding,
          metadata: {
            text: chunk.content,
            ...chunk.metadata,
          },
        };
      })
    );

    const upsertResponse = await fetch(`${PINECONE_HOST}/vectors/upsert`, {
      method: "POST",
      headers: {
        "Api-Key": PINECONE_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ vectors }),
    });

    if (!upsertResponse.ok) {
      console.error("Pinecone upsert error:", await upsertResponse.text());
    }
  }

  console.log("\n------------------------------------");
  console.log("Data ingestion process completed successfully!");
  console.log("------------------------------------");
}

ingestData();
