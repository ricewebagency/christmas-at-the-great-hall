import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const API_KEY = process.env.SERPAPI_API_KEY;
const PLACE_ID = "ChIJnb5wp7L7xUcRQVe1bmz4bRo";
const OUTPUT_PATH = path.join("src", "assets", "files", "google-reviews.json");
const MAX_PAGE_REQUESTS = 50;

if (!API_KEY) {
  console.error("SERPAPI_API_KEY ontbreekt. Stel deze eerst in.");
  process.exit(1);
}

function buildRequestUrl(nextPageToken) {
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_maps_reviews");
  url.searchParams.set("place_id", PLACE_ID);
  url.searchParams.set("hl", "en");
  url.searchParams.set("api_key", API_KEY);

  if (nextPageToken) {
    url.searchParams.set("next_page_token", nextPageToken);
  }

  return url;
}

async function fetchReviewsPage(nextPageToken) {
  const response = await fetch(buildRequestUrl(nextPageToken));

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`SerpAPI ${response.status}: ${errorBody}`);
  }

  const json = await response.json();
  const reviews = Array.isArray(json.reviews) ? json.reviews : [];
  const newNextPageToken =
    json.serpapi_pagination?.next_page_token ?? json.next_page_token ?? null;

  return { reviews, nextPageToken: newNextPageToken };
}

try {
  const reviews = [];
  let nextPageToken = null;
  let pageRequests = 0;

  while (pageRequests < MAX_PAGE_REQUESTS) {
    const page = await fetchReviewsPage(nextPageToken);
    pageRequests += 1;

    if (page.reviews.length === 0) {
      break;
    }

    reviews.push(...page.reviews);

    if (!page.nextPageToken) {
      break;
    }

    nextPageToken = page.nextPageToken;
  }

  const payload = {
    updatedAt: new Date().toISOString(),
    reviews,
  };

  mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, "utf-8");

  console.log(`Reviews opgeslagen in ${OUTPUT_PATH}`);
  console.log(`Aantal reviews: ${payload.reviews.length}`);
} catch (error) {
  console.error("Kon reviews niet ophalen:", error.message);
  process.exit(1);
}
