import { displayDate, loadDeals, offerStatus, todayInMadrid } from "./offer-status.mjs";

const message = document.getElementById("review-status");

function text(parent, tag, value, className = "") {
  const element = document.createElement(tag);
  element.textContent = value;
  element.className = className;
  parent.append(element);
  return element;
}

function makeReviewCard({ deal, status }) {
  const card = document.createElement("article");
  card.className = "card";
  if (deal.promoted && !status.expired && !status.retired) text(card, "p", "Currently promoting", "tag");
  text(card, "h3", deal.title);
  if (deal.price) text(card, "p", deal.price);
  text(card, "p", `Last verified ${displayDate(status.lastVerified)} · ${status.expired ? "Expired" : "Expiry"} ${displayDate(status.expiresOn)}`, "small");
  if (status.cancellationCutoff) text(card, "p", `Free cancellation cutoff ${displayDate(status.cancellationCutoff)}`, "small");
  if (status.retired) text(card, "p", "Removed from active offers.");
  if (status.review.length) {
    const list = document.createElement("ul");
    status.review.forEach(reason => text(list, "li", reason));
    card.append(list);
  }
  if (/^https:\/\//i.test(deal.bookingUrl ?? "")) {
    const link = text(card, "a", "Open booking page ↗");
    link.href = deal.bookingUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  }
  return card;
}

function showGroup(id, items) {
  const target = document.getElementById(id);
  if (!items.length) return;
  target.replaceChildren(...items.map(makeReviewCard));
  target.parentElement.hidden = false;
  if (target.parentElement.tagName === "DETAILS") {
    target.parentElement.querySelector("summary").append(` (${items.length})`);
  }
}

function compareReviews(a, b) {
  if (Boolean(a.deal.promoted) !== Boolean(b.deal.promoted)) return a.deal.promoted ? -1 : 1;
  const nextDate = status => [status.expiresOn, status.cancellationCutoff].filter(Boolean).sort()[0] ?? "9999-12-31";
  return nextDate(a.status).localeCompare(nextDate(b.status))
    || a.status.lastVerified.localeCompare(b.status.lastVerified);
}

async function renderReview() {
  const today = todayInMadrid();
  const deals = await loadDeals();
  const reviewable = deals.map(deal => ({ deal, status: offerStatus(deal, today) }))
    .filter(({ status }) => !status.historical);
  const inactive = reviewable.filter(({ status }) => status.expired || status.retired);
  const active = reviewable.filter(({ status }) => !status.expired && !status.retired);
  const due = active.filter(({ status }) => status.review.length).sort(compareReviews);
  const current = active.filter(({ status }) => !status.review.length).sort(compareReviews);

  message.textContent = due.length
    ? `${due.length} of ${active.length} active offers need review.`
    : "No active offers need review today.";
  showGroup("review-queue", due);
  showGroup("review-current", current);
  showGroup("review-inactive", inactive);
}

renderReview().catch(() => {
  message.textContent = "The review list could not load. Refresh this page to try again.";
});
