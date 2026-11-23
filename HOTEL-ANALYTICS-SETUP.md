# Free CHH hotel-click analytics — setup required

This branch adds hotel-level events to the existing dynamic hotel cards, without changing live production.

## Before enabling
1. Create a free Google Analytics 4 property and web data stream for https://curatedhotelhunter.com.
2. Copy its Measurement ID (G-XXXXXXXXXX) into `hotel-analytics.js`.
3. Implement an analytics consent choice in the website's consent UI. On explicit opt-in call `window.CHHAnalytics.setConsent(true)`; on decline or withdrawal call `window.CHHAnalytics.setConsent(false)`. Do not activate analytics before consent. Ensure revocation also disables collection and addresses previously set cookies as required.
4. Update privacy/cookie disclosures to describe GA4, retention, international transfers and consent withdrawal. Verify applicable Spanish/EU consent requirements.
5. Test in GA4 DebugView / Realtime, then merge and deploy.

## Events
- `hotel_details_open`: offer details summary clicked.
- `hotel_discovery_click`: a hotel card's internal link clicked.
- `hotel_outbound_click`: a hotel card's external link clicked (including affiliate offers and banner links).
Parameters include `hotel_name`, `page_path`, and outbound `destination_host`. No full affiliate URLs are sent.

In GA4 Admin > Custom definitions, register event-scoped `hotel_name` and `destination_host` to report by hotel and booking partner. Explore > Free form: Rows = hotel_name; Columns = event_name; Values = Event count.

**Limitations:** This is click tracking, not confirmed bookings or commissions. No past clicks can be reconstructed. Home-page links are not yet instrumented. GA4 free tier may apply reporting thresholds/limits. The tracking module intentionally collects nothing until a measurement ID and explicit consent integration exist.
