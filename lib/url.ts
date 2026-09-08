/**
 * Normalise a user-entered website address for use in an href.
 *
 * People type "www.example.org", not "https://www.example.org". A bare host in
 * an href is a *relative* path, so that link would send a backer to
 * /battle/<id>/www.example.org and a 404 rather than to the charity.
 *
 * Returns null for anything that isn't a plain http(s) address, which also
 * keeps `javascript:` and `data:` out of an attribute we render.
 */
export function externalUrl(raw: string | null | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;

  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`;

  try {
    const url = new URL(candidate);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}
