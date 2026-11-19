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
    const photos = document.createDocumentFragment();
    for (const photo of deal.photos) {
      if (typeof photo?.image !== "string") continue;

      const url = parseUrl(photo.image, window.location.origin);
      if (url?.origin !== window.location.origin || !url.pathname.startsWith("/deal-photos/")) continue;

      const image = document.createElement("img");
      image.className = "deal-photo";
      image.src = url.href;
      image.alt = typeof photo.alt === "string" ? photo.alt : "";
      image.loading = "lazy";
      if (typeof photo.caption === "string" && photo.caption.trim()) {
        const figure = document.createElement("figure");
        figure.className = "deal-photo-captioned";
        figure.append(image);
        appendText(figure, "figcaption", photo.caption, "small");
        photos.append(figure);
      } else {
        photos.append(image);
      }
    }

    if (photos.firstChild) card.append(photos.firstChild);
    if (photos.firstChild) {
      const gallery = document.createElement("details");
      appendText(gallery, "summary", "See more photos");
      gallery.append(photos);
      card.append(gallery);
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
  if (deal.noPrepayment === true) {
    const payment = document.createElement("p");
    appendText(payment, "strong", "No prepayment needed");
    payment.append(". Pay at the property.");
    card.append(payment);
  }
  if (Array.isArray(deal.priceDetails) && deal.priceDetails.length) {
    const list = document.createElement("ul");
    for (const detail of deal.priceDetails) {
      const item = document.createElement("li");
      appendText(item, "strong", detail.lead);
      if (typeof detail.detail === "string" && detail.detail.trim()) {
        item.append(` ${detail.detail.trim()}`);
      }
      list.append(item);
    }
    card.append(list);
  }
  appendText(card, "p", deal.priceNote, "small");
  if (!status.historical && status.lastVerified) {
    appendText(card, "p", `Last checked ${displayDate(status.lastVerified)}`, "small");
  }

  if (!onFeature && typeof deal.recommendedFor === "string" && deal.recommendedFor.trim()) {
    appendText(card, "strong", "Recommended for:");
    const recommendation = document.createElement("p");
    appendText(recommendation, "strong", deal.recommendedFor);
    card.append(recommendation);
  }

  if (!onFeature && Array.isArray(deal.highlights) && deal.highlights.length) {
    appendText(card, "strong", deal.highlightsLabel || "Highlights");
    const highlights = document.createElement("ul");
    for (const highlight of deal.highlights) {
      const item = document.createElement("li");
      appendText(item, "strong", highlight);
      highlights.append(item);
    }
    card.append(highlights);
  }
  if (!onFeature && typeof deal.stayNote === "string") {
    for (const paragraph of deal.stayNote.split(/\r?\n/)) {
      appendText(card, "p", paragraph.trim());
    }
  }
  if (typeof deal.valueNote === "string" && deal.valueNote.trim()) {
    appendText(card, "strong", "CHH verdict");
    appendText(card, "p", deal.valueNote);
  }

  if (hasDiscovery && !onFeature) {
    const link = document.createElement("a");
    link.href = discoveryPage;
    link.textContent = "Read discovery →";
    card.append(link);
  }

  const bookingUrl = typeof deal.bookingUrl === "string" ? parseUrl(deal.bookingUrl) : null;
  if (bookingUrl?.protocol === "https:") {
    if (deal.affiliate === true) {
      appendText(card, "p", "We may earn a commission if you book through this offer at no extra cost to you.", "small");
    }
    const link = document.createElement("a");
    link.href = bookingUrl.href;
    if (hasDiscovery && !onFeature) link.className = "deal-booking-link";
    if (!onFeature || deal.affiliate === true) link.rel = "sponsored";
    link.textContent = deal.affiliate === true ? "View offer" : onFeature ? "Check availability →" : "View hotel →";
    card.append(link);

    if (typeof deal.bookingQr === "string") {
      const qrUrl = parseUrl(deal.bookingQr, window.location.origin);
      if (qrUrl?.origin === window.location.origin && qrUrl.pathname.startsWith("/deal-photos/")) {
        const qr = document.createElement("details");
        appendText(qr, "summary", "Show booking QR code");
        const image = document.createElement("img");
        image.src = qrUrl.href;
        image.alt = `Scan to open the ${deal.title} offer on another device`;
        image.width = 180;
        image.height = 180;
        image.loading = "lazy";
        qr.append(image);
        card.append(qr);
      }
    }
  }

  return card;
}

async function renderOffers() {
  const deals = await loadDeals();
  const visibleDeals = deals.map(deal => ({ deal, status: offerStatus(deal) }))
    .filter(({ status }) => !status.expired && !status.retired);

  for (const entry of document.querySelectorAll("[data-destination-offer]")) {
    entry.hidden = !visibleDeals.some(({ deal, status }) => (
      !status.historical && deal.title === entry.dataset.destinationOffer
    ));
  }

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
