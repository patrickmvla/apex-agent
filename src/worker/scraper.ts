import { load } from "cheerio";

async function scrapeWiki() {
  console.log("Starting the scraping process...");

  const targetUrl = "https://apexlegends.wiki.gg/wiki/Lifeline";

  try {
    console.log(`Fetching content from: ${targetUrl}`);

    const response = await fetch(targetUrl);

    if (!response.ok) {
      console.error(`Failed to fetch the page. Status: ${response.status}`);
    }

    const html = await response.text();

    const $ = load(html);

    const contentElement = $("#mw-content-text");

    contentElement.find(".tac, .mv-editsection, .navbox").remove();

    const rawText = contentElement.text();

    const cleanedText = rawText.replace(/\{3,}/g, "\n\n").trim();

    console.log("\n--- Successfully scraped content ---");
    console.log(cleanedText.substring(0, 500) + "---");
    console.log("\n-----------------------------------");
  } catch (error) {
    console.error("An error occurred during scraping:", error);
  }
}

scrapeWiki();
