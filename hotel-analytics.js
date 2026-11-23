/*
 * CHH hotel analytics (GA4 free tier).
 * Set measurementId after creating a GA4 web data stream.
 * Tracking remains disabled until explicit analytics consent is granted.
 * Your consent UI must call window.CHHAnalytics.setConsent(true/false).
 */
const measurementId = ""; // e.g. G-XXXXXXXXXX
let enabled = false;
let loaded = false;
const validId = /^G-[A-Z0-9]+$/.test(measurementId);

function startAnalytics() {
  if (!validId || loaded || !enabled) return;
  loaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", measurementId, { anonymize_ip: true });
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(measurementId);
  document.head.append(script);
}
function track(eventName, parameters) {
  if (enabled && loaded && typeof window.gtag === "function") {
    window.gtag("event", eventName, parameters);
  }
}
window.CHHAnalytics = {
  setConsent(granted) {
    enabled = granted === true;
    if (enabled) startAnalytics();
    else if (loaded && window.gtag) window.gtag("consent", "update", { analytics_storage: "denied" });
  }
};
document.addEventListener("click", (event) => {
  const target = event.target.closest("a, summary");
  if (!target) return;
  const card = target.closest(".finds-card, .card, .featured-stay, [data-feature-offer]");
  const heading = card?.querySelector("h3, h2")?.textContent?.trim();
  const pageTitle = document.querySelector(".stay-feature h1, .detail h1")?.textContent?.trim();
  const hotel = card?.dataset.hotelTitle || heading || pageTitle;
  if (!hotel) return;
  if (target.tagName === "SUMMARY") {
    track("hotel_details_open", { hotel_name: hotel, page_path: location.pathname });
    return;
  }
  const url = new URL(target.href, location.href);
  const isExternal = url.origin !== location.origin;
  track(isExternal ? "hotel_outbound_click" : "hotel_discovery_click", {
    hotel_name: hotel,
    destination_host: isExternal ? url.hostname : undefined,
    page_path: location.pathname
  });
}, { capture: true });
