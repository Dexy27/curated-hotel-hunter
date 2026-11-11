import { displayDate, loadDeals, offerStatus } from "./offer-status.mjs";

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

function makeDealCard(deal, status, onFeature = false) {
  const card = document.createElement("article");
  card.className = "card";
  if (!onFeature) {
    card.id = deal.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    appendText(card, "div", deal.location, "tag");
    appendText(card, "h3", deal.title);
  }

  if (!onFeature && Array.isArray(deal.photos)) {
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
  if (status.showCancellation) {
    appendText(card, "p", `Free cancellation before ${displayDate(status.cancellationCutoff)}.`);
  }
  appendText(card, "p", deal.priceNote, "small");
  if (!status.historical && status.lastVerified) {
    appendText(card, "p", `Last checked ${displayDate(status.lastVerified)}`, "small");
  }

  if (hasDiscovery && !onFeature) {
    const link = document.createElement("a");
    link.href = discoveryPage;
    link.textContent = "Read discovery →";
    card.append(link);
  }

  const bookingUrl = typeof deal.bookingUrl === "string" ? parseUrl(deal.bookingUrl) : null;
  if (bookingUrl?.protocol === "https:") {
    const link = document.createElement("a");
    link.href = bookingUrl.href;
    if (hasDiscovery && !onFeature) link.className = "deal-booking-link";
    if (!onFeature) link.rel = "sponsored";
    link.textContent = onFeature ? "Check availability →" : "View hotel →";
    card.append(link);
  }

  return card;
}

async function renderOffers() {
  const deals = await loadDeals();
  const visibleDeals = deals.map(deal => ({ deal, status: offerStatus(deal) }))
    .filter(({ status }) => !status.expired && !status.retired);

  const featureSections = [...document.querySelectorAll("[data-feature-offer]")];
  if (hotelFinds) {
    const featurePages = new Set(featureSections.map(section => section.dataset.featureOffer));
    const cards = visibleDeals
      .filter(({ deal, status }) => status.historical || !featurePages.has(deal.discoveryPage))
      .map(({ deal, status }) => makeDealCard(deal, status));
    hotelFinds.replaceChildren(...cards);
    const target = document.getElementById(window.location.hash.slice(1));
    target?.scrollIntoView();
  }

  for (const section of featureSections) {
    const offer = visibleDeals.find(({ deal, status }) => (
      !status.historical && deal.discoveryPage === section.dataset.featureOffer
    ));
    if (!offer) continue;
    section.querySelector("[data-offer-content]").append(makeDealCard(offer.deal, offer.status, true));
    section.hidden = false;
  }
}

renderOffers().catch(error => console.warn("Unable to load hotel deals.", error));
