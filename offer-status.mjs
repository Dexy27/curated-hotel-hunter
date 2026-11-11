const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Madrid",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const displayFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "UTC",
  dateStyle: "medium",
});

export function todayInMadrid(now = new Date()) {
  const [day, month, year] = dateFormatter.format(now).split("/");
  return `${year}-${month}-${day}`;
}

function dateOnly(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : "";
}

export function displayDate(value) {
  return dateOnly(value) ? displayFormatter.format(new Date(value)) : "—";
}

function daysBetween(start, end) {
  return (Date.parse(end) - Date.parse(start)) / 86_400_000;
}

export function offerStatus(deal, today = todayInMadrid()) {
  const checkIn = dateOnly(deal.checkIn);
  const bookingCutoff = dateOnly(deal.bookingCutoff);
  const expiresOn = [checkIn, bookingCutoff].filter(Boolean).sort()[0] ?? "";
  const lastVerified = dateOnly(deal.lastVerified);
  const cancellationCutoff = dateOnly(deal.cancellationCutoff);
  const historical = deal.historical === true;
  const retired = deal.retired === true;
  const expired = Boolean(expiresOn && today >= expiresOn);
  const showCancellation = Boolean(cancellationCutoff && today < cancellationCutoff);
  const review = [];

  if (!historical && !retired && !expired) {
    if (!expiresOn) review.push("Add a check-in date or booking cutoff");
    if (!lastVerified || lastVerified > today) review.push("Record when the offer was verified");
    else if (daysBetween(lastVerified, today) >= 7) review.push("Price and availability check due");
    if (cancellationCutoff && !showCancellation && lastVerified < cancellationCutoff) {
      review.push("Cancellation cutoff passed. Check the current terms");
    } else if (showCancellation && daysBetween(today, cancellationCutoff) <= 7) {
      review.push("Cancellation cutoff within 7 days");
    }
    if (expiresOn && daysBetween(today, expiresOn) <= 7) review.push("Expires within 7 days");
  }

  return { historical, retired, expired, expiresOn, lastVerified, cancellationCutoff, showCancellation, review };
}

export async function loadDeals() {
  const response = await fetch("/hotel-deals.json");
  if (!response.ok) throw new Error(`Hotel deals returned HTTP ${response.status}`);
  const { deals } = await response.json();
  if (!Array.isArray(deals)) throw new Error("Invalid hotel deals data");
  return deals.filter(deal => typeof deal?.title === "string" && deal.title.trim());
}
