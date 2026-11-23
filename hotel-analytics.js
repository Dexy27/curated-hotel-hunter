const measurementId = "G-1MRJFJEYK4";
const siteDomain = "curatedhotelhunter.com";
const consentCookie = "chh_analytics";
const consentDays = 180;

const footerLinks = document.querySelector("footer div");
if (footerLinks) {
  footerLinks.insertAdjacentHTML("beforeend", '<button type="button" class="cookie-settings">Cookie settings</button>');
  document.body.insertAdjacentHTML("beforeend", `
    <aside class="analytics-consent" aria-labelledby="analytics-consent-title" hidden>
      <h2 id="analytics-consent-title" tabindex="-1">Analytics cookies</h2>
      <p>Allow Google Analytics to measure visits and hotel offer clicks? You can change your choice in Cookie settings. <a href="privacy-policy.html#cookies-and-analytics">Privacy Policy</a></p>
      <div class="analytics-consent-actions">
        <button type="button" data-consent="reject">Reject analytics</button>
        <button type="button" data-consent="accept">Accept analytics</button>
      </div>
    </aside>`);

  const panel = document.querySelector(".analytics-consent");
  const settings = footerLinks.querySelector(".cookie-settings");
  const isLive = location.protocol === "https:" &&
    [siteDomain, `www.${siteDomain}`].includes(location.hostname);
  const cookieScope = isLive ? `; Domain=${siteDomain}; Secure` : "";
  let analyticsStarted = false;
  const landingUrl = new URL(location.href);
  // The hotel search box stores visitors' search terms in this parameter.
  landingUrl.searchParams.delete("q");
  landingUrl.hash = "";
  const referrer = document.referrer ? new URL(document.referrer) : null;
  if (referrer) {
    referrer.search = "";
    referrer.hash = "";
  }

  function preference() {
    return document.cookie.split("; ").find(cookie => cookie.startsWith(`${consentCookie}=`))
      ?.slice(consentCookie.length + 1);
  }

  function startAnalytics() {
    if (!isLive || analyticsStarted || preference() !== "accept") return;
    analyticsStarted = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("consent", "default", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_expires: consentDays * 86400,
      cookie_update: false,
      page_location: landingUrl.href,
      page_referrer: referrer?.href || "",
    });

    const tag = document.createElement("script");
    tag.async = true;
    tag.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.append(tag);
  }

  function stopAnalytics() {
    if (!analyticsStarted) return;
    window[`ga-disable-${measurementId}`] = true;
    for (const name of ["_ga", `_ga_${measurementId.slice(2)}`]) {
      document.cookie = `${name}=; Max-Age=0; Path=/; Secure`;
      document.cookie = `${name}=; Max-Age=0; Path=/${cookieScope}`;
    }
    location.reload();
  }

  settings.addEventListener("click", () => {
    panel.hidden = false;
    panel.querySelector("h2").focus();
  });

  for (const button of panel.querySelectorAll("[data-consent]")) {
    button.addEventListener("click", () => {
      const value = button.dataset.consent;
      document.cookie = `${consentCookie}=${value}; Max-Age=${consentDays * 86400}; Path=/; SameSite=Lax${cookieScope}`;
      panel.hidden = true;
      if (value === "accept") startAnalytics();
      else stopAnalytics();
      if (panel.contains(document.activeElement) || document.activeElement === document.body) {
        settings.focus({ preventScroll: true });
      }
    });
  }

  function trackHotel(event) {
    if (!analyticsStarted || preference() !== "accept") return;
    const control = event.target.closest("[data-analytics-hotel]");
    if (!control) return;

    const parameters = {
      hotel_name: control.dataset.analyticsHotel,
      page_path: location.pathname,
      page_location: landingUrl.href,
    };
    if (control.tagName === "SUMMARY") {
      if (event.type === "click" && !control.parentElement.open) {
        window.gtag("event", "hotel_details_open", parameters);
      }
      return;
    }

    const destination = new URL(control.href);
    const isExternal = ![siteDomain, `www.${siteDomain}`].includes(destination.hostname);
    if (isExternal) parameters.destination_host = destination.hostname;
    window.gtag("event", isExternal ? "hotel_outbound_click" : "hotel_discovery_click", parameters);
  }

  document.addEventListener("click", trackHotel);
  document.addEventListener("auxclick", event => {
    if (event.button === 1) trackHotel(event);
  });
  window.addEventListener("pageshow", () => {
    if (preference() !== "accept") stopAnalytics();
  });

  panel.hidden = Boolean(preference());
  startAnalytics();
}
