import { displayDate, loadDeals, offerStatus } from "./offer-status.mjs";

const hotelFinds = document.querySelector("[data-finds-browser]");

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

function dealId(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const stayDates = new Intl.DateTimeFormat("en-GB", {
  day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
});

function makeDealCard(deal, status, onFeature = false, compact = false) {
  const card = document.createElement("article");
  card.className = compact ? "card finds-card" : "card";
  const details = compact ? document.createElement("details") : card;
  if (!onFeature) {
    card.id = dealId(deal.title);
    appendText(card, "div", deal.location, "tag");
    appendText(card, "h3", deal.title);
  }

  if (deal.firsthand === true || ["vilamendhoo.html", "ao-prao-koh-samet.html", "riu-jambo-zanzibar.html"].includes(deal.discoveryPage)) {
    appendText(card, "span", "Personally visited", "visited-badge");
  }

  if (!onFeature && deal.banner) {
    const imageUrl = parseUrl(deal.banner.image, window.location.origin);
    const targetUrl = typeof deal.banner.url === "string" ? parseUrl(deal.banner.url) : null;
    if (imageUrl?.origin === window.location.origin && imageUrl.pathname.startsWith("/deal-photos/") &&
        targetUrl?.protocol === "https:" && typeof deal.banner.alt === "string" && deal.banner.alt.trim()) {
      const link = document.createElement("a");
      link.className = "deal-banner";
      link.dataset.analyticsHotel = deal.title;
      link.href = targetUrl.href;
      link.rel = "sponsored";
      const image = document.createElement("img");
      image.src = imageUrl.href;
      image.alt = deal.banner.alt;
      image.loading = "lazy";
      link.append(image);
      card.append(link);
    }
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
      details.append(gallery);
    }
  }

  const discoveryPage = typeof deal.discoveryPage === "string" ? deal.discoveryPage.trim() : "";
  const hasDiscovery = /^[a-z0-9-]+\.html$/.test(discoveryPage);
  const start = parseDate(deal.checkIn);
  if (compact) {
    const end = parseDate(deal.checkOut);
    if (start) appendText(card, "p", end && end > start ? stayDates.formatRange(start, end) : displayDate(deal.checkIn), "finds-dates");
    if (!start && status.historical) appendText(card, "p", deal.description, "finds-dates");
  } else if (hasDiscovery) {
    appendText(card, "p", deal.description, "deal-description");
  }
  appendText(card, "div", deal.price, "price");
  if (deal.price && status.lastVerified) {
    appendText(card, "p", `Price seen on ${displayDate(status.lastVerified)}`, "small");
  }
  if (compact) {
    const highlight = Array.isArray(deal.highlights) ? deal.highlights[0] : "";
    appendText(card, "p", highlight || deal.recommendedFor, "finds-highlight");
    if (start || !status.historical) appendText(details, "p", deal.description, "deal-description");
  } else if (!hasDiscovery) {
    appendText(card, "p", deal.description, "deal-description");
  }
  if (status.showCancellation) {
    appendText(details, "p", `Free cancellation before ${displayDate(status.cancellationCutoff)}.`);
  }
  if (deal.noPrepayment === true) {
    const payment = document.createElement("p");
    appendText(payment, "strong", "No prepayment needed");
    payment.append(". Pay at the property.");
    details.append(payment);
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
    details.append(list);
  }
  appendText(details, "p", deal.priceNote, "small");

  if (!onFeature && typeof deal.recommendedFor === "string" && deal.recommendedFor.trim()) {
    appendText(details, "strong", "Recommended for:");
    const recommendation = document.createElement("p");
    appendText(recommendation, "strong", deal.recommendedFor);
    details.append(recommendation);
  }

  if (!onFeature && Array.isArray(deal.highlights) && deal.highlights.length) {
    appendText(details, "strong", deal.highlightsLabel || "Highlights");
    const highlights = document.createElement("ul");
    for (const highlight of deal.highlights) {
      const item = document.createElement("li");
      appendText(item, "strong", highlight);
      highlights.append(item);
    }
    details.append(highlights);
  }
  if (!onFeature && typeof deal.stayNote === "string") {
    for (const paragraph of deal.stayNote.split(/\r?\n/)) {
      appendText(details, "p", paragraph.trim());
    }
  }
  if (typeof deal.valueNote === "string" && deal.valueNote.trim()) {
    appendText(details, "strong", "CHH verdict");
    appendText(details, "p", deal.valueNote);
  }

  if (hasDiscovery && !onFeature) {
    const link = document.createElement("a");
    link.href = discoveryPage;
    link.dataset.analyticsHotel = deal.title;
    link.textContent = compact && hotelFindsOrder(deal) === 0 ? "Read about the stay" : "Read discovery →";
    card.append(link);
  }

  const bookingUrl = typeof deal.bookingUrl === "string" ? parseUrl(deal.bookingUrl) : null;
  if (bookingUrl?.protocol === "https:") {
    if (deal.affiliate === true) {
      appendText(card, "p", "We may earn a commission if you book through this offer at no extra cost to you.", "small");
    }
    const link = document.createElement("a");
    link.href = bookingUrl.href;
    link.dataset.analyticsHotel = deal.title;
    if (compact) link.className = "finds-offer-link";
    else if (hasDiscovery && !onFeature) link.className = "deal-booking-link";
    if (!onFeature || deal.affiliate === true) link.rel = "sponsored";
    const defaultBookingLabel = deal.affiliate === true || compact ? "View offer" : onFeature ? "Check availability →" : "View hotel →";
    link.textContent = deal.bookingLabel || defaultBookingLabel;
    card.append(link);
    appendText(card, "p", deal.bookingNote, "small");

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
        details.append(qr);
      }
    }
  }

  if (compact && details.firstChild) {
    details.className = "finds-details";
    const summary = document.createElement("summary");
    summary.textContent = deal.price ? "Offer details" : "Stay details";
    summary.dataset.analyticsHotel = deal.title;
    details.prepend(summary);
    card.append(details);
  }

  return card;
}

function hotelFindsOrder(deal) {
  const hasFirsthandPhotos = typeof deal.stayNote === "string" && deal.stayNote.trim() &&
    Array.isArray(deal.photos) && deal.photos.some(photo => typeof photo?.image === "string" && photo.image.trim());
  if (deal.firsthand === true || hasFirsthandPhotos) return 0;
  return deal.affiliate === true ? 1 : 2;
}

const monthLabels = new Intl.DateTimeFormat("en-GB", {
  month: "long", year: "numeric", timeZone: "UTC",
});
const pageSize = 12;
const featuredOfferIds = ["iberostar-selection-zanzibar", "joali-being"];

function parseDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
}

function travelMonths(deal, status) {
  const start = parseDate(deal.checkIn);
  if (!start || status.historical) return [];
  const end = parseDate(deal.checkOut);
  const lastNight = end && end > start ? new Date(end.getTime() - 86400000) : start;
  const date = new Date(start);
  date.setUTCDate(1);
  const months = [];
  while (date <= lastNight) {
    months.push(date.toISOString().slice(0, 7));
    date.setUTCMonth(date.getUTCMonth() + 1);
  }
  return months;
}

function searchable(value) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function renderHotelFinds(deals, visibleDeals) {
  const form = hotelFinds.querySelector("[data-finds-filters]");
  const search = form.elements.namedItem("q");
  const destination = form.elements.namedItem("destination");
  const month = form.elements.namedItem("month");
  const results = hotelFinds.querySelector("[data-finds-results]");
  const heading = hotelFinds.querySelector("#finds-results-title");
  const count = hotelFinds.querySelector("[data-finds-count]");
  const browseAll = hotelFinds.querySelector("[data-browse-all]");
  const pages = hotelFinds.querySelector("[data-finds-pages]");

  const archives = deals.filter(deal => (
    deal.firsthand === true && deal.discoveryPage &&
    !visibleDeals.some(entry => entry.deal === deal)
  )).map(deal => ({
    deal: {
      title: deal.title, destination: deal.destination, location: deal.destination,
      firsthand: true, photos: deal.photos, highlights: deal.highlights,
      highlightsLabel: deal.highlightsLabel, discoveryPage: deal.discoveryPage,
    },
    status: { historical: true },
  }));
  const entries = [...visibleDeals, ...archives]
    .sort((a, b) => hotelFindsOrder(a.deal) - hotelFindsOrder(b.deal) ||
      Number(b.deal.firsthand === true) - Number(a.deal.firsthand === true))
    .map(entry => ({
      ...entry,
      id: dealId(entry.deal.title),
      months: travelMonths(entry.deal, entry.status),
      searchText: searchable([entry.deal.title, entry.deal.destination, entry.deal.location].join(" ")),
    }));

  const destinations = [...new Set(entries.map(entry => entry.deal.destination).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "en"));
  const months = [...new Set(entries.flatMap(entry => entry.months))].sort();
  for (const name of destinations) destination.add(new Option(name, name));
  for (const value of months) month.add(new Option(monthLabels.format(new Date(value + "-01")), value));
  const featuredOffers = featuredOfferIds.map(id => entries.find(entry => (
    entry.id === id && !entry.status.historical && entry.deal.price
  ))).filter(Boolean);

  const url = new URL(window.location.href);
  const initialTarget = entries.find(entry => entry.id === url.hash.slice(1));
  search.value = url.searchParams.get("q") || "";
  destination.value = destinations.includes(url.searchParams.get("destination")) ? url.searchParams.get("destination") : "";
  month.value = months.includes(url.searchParams.get("month")) ? url.searchParams.get("month") : "";
  let all = url.searchParams.get("all") === "1" || Boolean(initialTarget);
  let page = Number.parseInt(url.searchParams.get("page"), 10) || 1;
  const hasFilters = () => Boolean(search.value.trim() || destination.value || month.value);

  function syncUrl() {
    const current = new URL(window.location.href);
    current.hash = "";
    const params = {
      q: search.value.trim(), destination: destination.value, month: month.value,
      all: all ? "1" : "", page: page > 1 ? String(page) : "",
    };
    for (const [key, value] of Object.entries(params)) {
      if (value) current.searchParams.set(key, value);
      else current.searchParams.delete(key);
    }
    window.history.replaceState(null, "", current);
  }

  function changePage(nextPage) {
    page = nextPage;
    render();
    syncUrl();
    heading.focus();
  }

  function render(initial = false) {
    const keywords = searchable(search.value.trim()).split(/\s+/).filter(Boolean);
    const filtered = hasFilters();
    const featured = !filtered && !all && featuredOffers.length > 0 && entries.length > featuredOffers.length;
    const matching = featured ? featuredOffers : entries.filter(entry => (
      (!destination.value || entry.deal.destination === destination.value) &&
      (!month.value || entry.months.includes(month.value)) &&
      keywords.every(word => entry.searchText.includes(word))
    ));
    const targetIndex = initial && initialTarget ? matching.indexOf(initialTarget) : -1;
    if (targetIndex >= 0) page = Math.floor(targetIndex / pageSize) + 1;
    const pageCount = Math.max(1, Math.ceil(matching.length / pageSize));
    page = Math.min(pageCount, Math.max(1, page));
    const first = (page - 1) * pageSize;
    const visible = matching.slice(first, first + pageSize);

    heading.textContent = featured ? "Featured offers" : filtered ? "Search results" : "All hotel finds";
    browseAll.hidden = !featured;
    if (featured) count.textContent = `Showing ${featuredOffers.length} of ${entries.length} hotel finds.`;
    else if (!matching.length) count.textContent = "No hotel finds match. Try a different destination or month, or clear the filters.";
    else if (pageCount > 1) count.textContent = `Showing ${first + 1}–${first + visible.length} of ${matching.length} hotel finds.`;
    else count.textContent = `${matching.length} hotel ${matching.length === 1 ? "find" : "finds"}.`;
    results.replaceChildren(...visible.map(({ deal, status }) => makeDealCard(deal, status, false, true)));

    pages.replaceChildren();
    pages.hidden = pageCount <= 1;
    if (pageCount > 1) {
      function pageButton(label, target, disabled = false) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "finds-control";
        button.textContent = label;
        button.disabled = disabled;
        if (String(target) === label) button.setAttribute("aria-label", `Page ${label}`);
        if (String(page) === label) button.setAttribute("aria-current", "page");
        button.addEventListener("click", () => changePage(target));
        pages.append(button);
      }
      pageButton("Previous", page - 1, page === 1);
      for (let number = 1; number <= pageCount; number++) pageButton(String(number), number, number === page);
      pageButton("Next", page + 1, page === pageCount);
    }
    if (targetIndex >= 0) {
      const target = document.getElementById(initialTarget.id);
      const details = target?.querySelector(":scope > details");
      if (details) details.open = true;
      target?.scrollIntoView();
    }
  }

  function applyFilters() {
    page = 1;
    render();
    syncUrl();
  }

  search.addEventListener("input", applyFilters);
  destination.addEventListener("change", applyFilters);
  month.addEventListener("change", applyFilters);
  form.addEventListener("submit", event => {
    event.preventDefault();
    applyFilters();
  });
  form.addEventListener("reset", event => {
    event.preventDefault();
    search.value = destination.value = month.value = "";
    all = false;
    applyFilters();
  });
  browseAll.addEventListener("click", () => {
    all = true;
    changePage(1);
  });

  heading.tabIndex = -1;
  render(true);
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
  if (hotelFinds) renderHotelFinds(deals, visibleDeals);

  for (const section of featureSections) {
    const offer = visibleDeals.find(({ deal, status }) => (
      !status.historical && deal.discoveryPage === section.dataset.featureOffer
    ));
    if (!offer) continue;
    section.querySelector("[data-offer-content]").append(makeDealCard(offer.deal, offer.status, true));
    section.hidden = false;
  }
}

renderOffers().catch(error => {
  console.warn("Unable to load hotel deals.", error);
  const status = hotelFinds?.querySelector("[data-finds-count]");
  if (status) status.textContent = "Hotel finds could not be loaded. Please refresh to try again.";
});
