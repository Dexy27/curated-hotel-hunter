"use strict";

const hotelFinds = document.querySelector("[data-hotel-deals]");

function appendText(parent, element, value, className = "") {
  if (typeof value !== "string" || !value.trim()) return;

  const node = document.createElement(element);
  node.className = className;
  node.textContent = value;
  parent.append(node);
}

function parseUrl(value, base) {
  try {
    return new URL(value, base);
  } catch {
    return null;
  }
}

function makeDealCard(deal) {
  const card = document.createElement("article");
  card.className = "card";
  card.id = deal.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  appendText(card, "div", deal.location, "tag");
  appendText(card, "h3", deal.title);

  if (Array.isArray(deal.photos)) {
    for (const photo of deal.photos) {
      if (typeof photo?.image !== "string") continue;

      const url = parseUrl(photo.image, window.location.origin);
      if (url?.origin !== window.location.origin || !url.pathname.startsWith("/deal-photos/")) continue;

      const image = document.createElement("img");
      image.className = "deal-photo";
      image.src = url.href;
      image.alt = typeof photo.alt === "string" ? photo.alt : "";
      image.loading = "lazy";
      card.append(image);
    }
  }

  const discoveryPage = typeof deal.discoveryPage === "string" ? deal.discoveryPage.trim() : "";
  const hasDiscovery = /^[a-z0-9-]+\.html$/.test(discoveryPage);
  if (hasDiscovery) appendText(card, "p", deal.description, "deal-description");
  appendText(card, "div", deal.price, "price");
  if (!hasDiscovery) appendText(card, "p", deal.description, "deal-description");
  appendText(card, "p", deal.priceNote, "small");

  if (hasDiscovery) {
    const link = document.createElement("a");
    link.href = discoveryPage;
    link.textContent = "Read discovery →";
    card.append(link);
  }

  const bookingUrl = typeof deal.bookingUrl === "string" ? parseUrl(deal.bookingUrl) : null;
  if (bookingUrl?.protocol === "https:") {
    const link = document.createElement("a");
    link.href = bookingUrl.href;
    link.rel = "sponsored";
    link.textContent = "View hotel →";
    card.append(link);
  }

  return card;
}

async function loadHotelDeals() {
  const response = await fetch("/hotel-deals.json");
  if (!response.ok) throw new Error(`Hotel deals returned HTTP ${response.status}`);

  const { deals } = await response.json();
  if (!Array.isArray(deals)) return;

  const cards = deals
    .filter(deal => typeof deal?.title === "string" && deal.title.trim())
    .map(makeDealCard);
  hotelFinds.replaceChildren(...cards);

  const target = cards.find(card => `#${card.id}` === window.location.hash);
  target?.scrollIntoView();
}

loadHotelDeals().catch(error => console.warn("Unable to load hotel deals.", error));
