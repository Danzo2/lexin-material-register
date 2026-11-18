const priceFormat = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" });
const stockFormat = new Intl.NumberFormat("en-AU");
const dateFormat = new Intl.DateTimeFormat("en-AU", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** Unit price arrives as a numeric string (Postgres numeric) to avoid float rounding on the wire. */
export function formatPrice(unitPrice: string): string {
  return priceFormat.format(Number(unitPrice));
}

export function formatStock(stockOnHand: number): string {
  return stockFormat.format(stockOnHand);
}

export function formatDate(isoTimestamp: string): string {
  return dateFormat.format(new Date(isoTimestamp));
}
